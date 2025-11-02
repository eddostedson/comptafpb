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

    // Logger l'action (ne pas bloquer l'inscription si le logging échoue)
    try {
      await this.logAuditAction(user.id, 'CREATE', 'User', user.id, 'Création de compte');
    } catch (error) {
      console.error('Erreur lors du logging de l\'action d\'audit:', error);
      // Ne pas bloquer l'inscription si le logging échoue
    }

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

    // Retourner l'utilisateur sans le password, avec l'info mustChangePassword
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      mustChangePassword: user.mustChangePassword, // Inclure cette info pour le frontend
    };
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
      mustChangePassword: user.mustChangePassword || false, // Inclure dans le JWT
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
        mustChangePassword: user.mustChangePassword || false, // Inclure dans la réponse
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
            sousPrefecture: true,
            chefLieu: true,
            departement: true,
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
   * Changer le mot de passe de l'utilisateur (obligatoire après réinitialisation)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier que l'utilisateur doit changer son mot de passe
    if (!user.mustChangePassword) {
      throw new ConflictException('Vous n\'êtes pas obligé de changer votre mot de passe pour le moment');
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ConflictException('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et désactiver mustChangePassword
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        mustChangePassword: false, // Le mot de passe a été changé, plus besoin de forcer le changement
      },
    });

    // Logger l'action
    await this.logAuditAction(userId, 'UPDATE', 'User', userId, 'Changement de mot de passe obligatoire effectué');

    return {
      message: 'Mot de passe changé avec succès. Vous pouvez maintenant utiliser votre nouveau mot de passe.',
    };
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

