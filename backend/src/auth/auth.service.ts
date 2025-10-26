import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { StatutUser } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Créer un nouveau compte utilisateur
   */
  async register(registerDto: RegisterDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier que le centre existe (si fourni)
    if (registerDto.centreId) {
      const centre = await this.prisma.centre.findUnique({
        where: { id: registerDto.centreId },
      });
      if (!centre) {
        throw new NotFoundException('Centre introuvable');
      }
    }

    // Vérifier que le régisseur existe (si fourni)
    if (registerDto.regisseurId) {
      const regisseur = await this.prisma.regisseur.findUnique({
        where: { id: registerDto.regisseurId },
      });
      if (!regisseur) {
        throw new NotFoundException('Régisseur introuvable');
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        nom: registerDto.nom,
        prenom: registerDto.prenom,
        telephone: registerDto.telephone,
        role: registerDto.role,
        centreId: registerDto.centreId,
        regisseurId: registerDto.regisseurId,
        statut: StatutUser.ACTIF,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        statut: true,
        centreId: true,
        regisseurId: true,
        createdAt: true,
      },
    });

    // Logger l'action
    await this.logAuditAction(user.id, 'CREATE', 'User', user.id, 'Création de compte');

    return {
      message: 'Compte créé avec succès',
      user,
    };
  }

  /**
   * Valider les identifiants (utilisé par LocalStrategy)
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        centre: true,
        regisseur: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le statut
    if (user.statut !== StatutUser.ACTIF) {
      throw new UnauthorizedException('Compte inactif ou suspendu');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Mettre à jour lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Logger la connexion
    await this.logAuditAction(user.id, 'LOGIN', 'User', user.id, 'Connexion réussie');

    // Retourner l'utilisateur sans le password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Générer un JWT après authentification
   */
  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      centreId: user.centreId,
      regisseurId: user.regisseurId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        centreId: user.centreId,
        regisseurId: user.regisseurId,
        centre: user.centre,
        regisseur: user.regisseur,
      },
    };
  }

  /**
   * Obtenir le profil complet de l'utilisateur
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        statut: true,
        centreId: true,
        regisseurId: true,
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
            commune: true,
            province: true,
            region: true,
          },
        },
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            region: true,
          },
        },
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  /**
   * Logger une action dans l'audit
   */
  private async logAuditAction(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    description: string,
  ) {
    await this.prisma.auditAction.create({
      data: {
        userId,
        action: action as any,
        entity,
        entityId,
        description,
      },
    });
  }
}

