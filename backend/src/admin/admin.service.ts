import { Injectable, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegisseurDto } from './dto/create-regisseur.dto';
import { UpdateRegisseurDto } from './dto/update-regisseur.dto';
import { CreateCentreDto } from './dto/create-centre.dto';
import { UpdateCentreDto } from './dto/update-centre.dto';
import { CreateChefCentreDto } from './dto/create-chef-centre.dto';
import { UpdateChefCentreDto } from './dto/update-chef-centre.dto';
import { CreatePasswordResetRequestDto } from './dto/create-password-reset-request.dto';
import { GeneratePasswordDto } from './dto/generate-password.dto';
import { DivisionsAdministrativesService } from '../divisions-administratives/divisions-administratives.service';
import * as bcrypt from 'bcrypt';
import { RoleType, StatutUser, StatutPasswordReset } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => DivisionsAdministrativesService))
    private divisionsService: DivisionsAdministrativesService,
  ) {}

  /**
   * Créer un nouveau régisseur
   */
  async createRegisseur(createRegisseurDto: CreateRegisseurDto) {
    // Générer automatiquement le code si non fourni
    let code = createRegisseurDto.code;
    if (!code) {
      // Trouver le dernier code de régisseur
      const lastRegisseur = await this.prisma.regisseur.findFirst({
        where: {
          code: {
            startsWith: 'REG-',
          },
        },
        orderBy: {
          code: 'desc',
        },
      });

      if (lastRegisseur) {
        // Extraire le numéro du dernier code (ex: REG-001 -> 1)
        const lastNumber = parseInt(lastRegisseur.code.replace('REG-', ''), 10) || 0;
        const nextNumber = lastNumber + 1;
        code = `REG-${String(nextNumber).padStart(3, '0')}`;
      } else {
        // Premier régisseur
        code = 'REG-001';
      }
    }

    // Vérifier si le code existe déjà
    const existingCode = await this.prisma.regisseur.findUnique({
      where: { code },
    });
    if (existingCode) {
      throw new ConflictException('Ce code régisseur existe déjà');
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await this.prisma.regisseur.findUnique({
      where: { email: createRegisseurDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const regisseur = await this.prisma.regisseur.create({
      data: {
        code,
        nom: createRegisseurDto.nom,
        prenom: createRegisseurDto.prenom,
        email: createRegisseurDto.email,
        telephone: createRegisseurDto.telephone,
        region: createRegisseurDto.region,
        actif: true,
      },
    });

    // Associer les chefs de centres si fournis
    if (createRegisseurDto.chefsCentresIds && createRegisseurDto.chefsCentresIds.length > 0) {
      // Vérifier que tous les chefs existent et sont bien des chefs de centre
      const chefs = await this.prisma.user.findMany({
        where: {
          id: { in: createRegisseurDto.chefsCentresIds },
          role: RoleType.CHEF_CENTRE,
        },
      });

      if (chefs.length !== createRegisseurDto.chefsCentresIds.length) {
        throw new NotFoundException('Un ou plusieurs chefs de centres sont introuvables ou invalides');
      }

      // Associer les chefs de centres au régisseur
      await this.prisma.user.updateMany({
        where: {
          id: { in: createRegisseurDto.chefsCentresIds },
        },
        data: {
          regisseurId: regisseur.id,
        },
      });
    }

    // Associer les centres directement si fournis
    if (createRegisseurDto.centresIds && createRegisseurDto.centresIds.length > 0) {
      // Vérifier que tous les centres existent
      const centres = await this.prisma.centre.findMany({
        where: {
          id: { in: createRegisseurDto.centresIds },
        },
      });

      if (centres.length !== createRegisseurDto.centresIds.length) {
        throw new NotFoundException('Un ou plusieurs centres sont introuvables');
      }

      // Associer les centres au régisseur
      await this.prisma.centre.updateMany({
        where: {
          id: { in: createRegisseurDto.centresIds },
        },
        data: {
          regisseurId: regisseur.id,
        },
      });
    }

    return {
      message: 'Régisseur créé avec succès',
      regisseur,
      chefsCentresAssocies: createRegisseurDto.chefsCentresIds?.length || 0,
      centresAssocies: createRegisseurDto.centresIds?.length || 0,
    };
  }

  /**
   * Récupérer tous les régisseurs
   */
  async getAllRegisseurs() {
    const regisseurs = await this.prisma.regisseur.findMany({
      include: {
        centres: {
          include: {
            users: {
              where: {
                role: RoleType.CHEF_CENTRE,
              },
              select: {
                id: true,
                code: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            centres: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return regisseurs.map((regisseur) => {
      const { _count, centres, users, ...regisseurData } = regisseur;
      return {
        ...regisseurData,
        centres: centres.map((centre) => {
          const { users: centreUsers, ...centreData } = centre;
          return {
            ...centreData,
            chefCentre: centreUsers.length > 0 ? centreUsers[0] : null,
          };
        }),
        utilisateurs: users, // Utilisateurs directement associés au régisseur
        centresCount: _count.centres,
        usersCount: _count.users,
      };
    });
  }

  /**
   * Récupérer un régisseur par son ID
   */
  async getRegisseurById(id: string) {
    const regisseur = await this.prisma.regisseur.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            centres: true,
            users: true,
          },
        },
      },
    });

    if (!regisseur) {
      throw new NotFoundException('Régisseur introuvable');
    }

    return {
      ...regisseur,
      centresCount: regisseur._count.centres,
      usersCount: regisseur._count.users,
    };
  }

  /**
   * Mettre à jour un régisseur
   */
  async updateRegisseur(id: string, updateRegisseurDto: UpdateRegisseurDto) {
    // Vérifier que le régisseur existe
    const existingRegisseur = await this.prisma.regisseur.findUnique({
      where: { id },
    });

    if (!existingRegisseur) {
      throw new NotFoundException('Régisseur introuvable');
    }

    // Vérifier si le code existe déjà (si fourni et différent de l'actuel)
    if (updateRegisseurDto.code && updateRegisseurDto.code !== existingRegisseur.code) {
      const existingCode = await this.prisma.regisseur.findUnique({
        where: { code: updateRegisseurDto.code },
      });
      if (existingCode) {
        throw new ConflictException('Ce code régisseur existe déjà');
      }
    }

    // Vérifier si l'email existe déjà (si fourni et différent de l'actuel)
    if (updateRegisseurDto.email && updateRegisseurDto.email !== existingRegisseur.email) {
      const existingEmail = await this.prisma.regisseur.findUnique({
        where: { email: updateRegisseurDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Mettre à jour le régisseur
    const regisseur = await this.prisma.regisseur.update({
      where: { id },
      data: updateRegisseurDto,
      include: {
        _count: {
          select: {
            centres: true,
            users: true,
          },
        },
      },
    });

    return {
      message: 'Régisseur mis à jour avec succès',
      regisseur: {
        ...regisseur,
        centresCount: regisseur._count.centres,
        usersCount: regisseur._count.users,
      },
    };
  }

  /**
   * Associer un ou plusieurs chefs de centres à un régisseur
   */
  async associerChefsCentresRegisseur(regisseurId: string, chefsCentresIds: string[]) {
    // Vérifier que le régisseur existe
    const regisseur = await this.prisma.regisseur.findUnique({
      where: { id: regisseurId },
    });

    if (!regisseur) {
      throw new NotFoundException('Régisseur introuvable');
    }

    // Vérifier que tous les chefs existent et sont bien des chefs de centre
    const chefs = await this.prisma.user.findMany({
      where: {
        id: { in: chefsCentresIds },
        role: RoleType.CHEF_CENTRE,
      },
    });

    if (chefs.length !== chefsCentresIds.length) {
      throw new NotFoundException('Un ou plusieurs chefs de centres sont introuvables ou invalides');
    }

    // Associer les chefs de centres au régisseur
    await this.prisma.user.updateMany({
      where: {
        id: { in: chefsCentresIds },
      },
      data: {
        regisseurId: regisseur.id,
      },
    });

    return {
      message: `${chefs.length} chef(s) de centre associé(s) avec succès au régisseur`,
      regisseur: {
        id: regisseur.id,
        code: regisseur.code,
        nom: regisseur.nom,
        prenom: regisseur.prenom,
      },
      chefsAssocies: chefs.map((chef) => ({
        id: chef.id,
        nom: chef.nom,
        prenom: chef.prenom,
        code: chef.code,
      })),
    };
  }

  /**
   * Récupérer les utilisateurs connectés (régisseurs et chefs de centres)
   */
  async getConnectedUsers() {
    // Considérer comme "connecté" si lastLogin est dans les 15 dernières minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [RoleType.REGISSEUR, RoleType.CHEF_CENTRE],
        },
        statut: StatutUser.ACTIF,
        lastLogin: {
          gte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        lastLogin: true,
        code: true,
        telephone: true,
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: {
        lastLogin: 'desc',
      },
    });

    return users.map((user) => {
      const isOnline = user.lastLogin 
        ? new Date(user.lastLogin).getTime() > new Date(Date.now() - 15 * 60 * 1000).getTime()
        : false;
      
      return {
        id: user.id,
        nomUtilisateur: `${user.prenom} ${user.nom}`,
        role: user.role,
        email: user.email,
        code: user.code,
        telephone: user.telephone,
        dateConnexion: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
        statut: isOnline ? 'En ligne' : 'Hors ligne',
        centre: user.centre ? {
          code: user.centre.code,
          nom: user.centre.nom,
        } : null,
        regisseur: user.regisseur ? {
          code: user.regisseur.code,
          nom: `${user.regisseur.prenom} ${user.regisseur.nom}`,
        } : null,
      };
    });
  }

  /**
   * Dissocier un centre de son régisseur
   */
  async dissocierCentreRegisseur(centreId: string) {
    // Vérifier que le centre existe
    const centre = await this.prisma.centre.findUnique({
      where: { id: centreId },
      include: {
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!centre) {
      throw new NotFoundException('Centre introuvable');
    }

    if (!centre.regisseurId) {
      throw new ConflictException("Ce centre n'est pas associé à un régisseur");
    }

    const regisseurInfo = centre.regisseur;

    // Dissocier le centre du régisseur
    await this.prisma.centre.update({
      where: { id: centreId },
      data: {
        regisseurId: null,
      },
    });

    return {
      message: 'Centre dissocié du régisseur avec succès',
      centre: {
        id: centre.id,
        code: centre.code,
        nom: centre.nom,
      },
      regisseur: regisseurInfo,
    };
  }

  /**
   * Dissocier un utilisateur d'un régisseur
   */
  async dissocierUtilisateurRegisseur(userId: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!user.regisseurId) {
      throw new ConflictException("Cet utilisateur n'est pas associé à un régisseur");
    }

    const regisseurInfo = user.regisseur;

    // Dissocier l'utilisateur du régisseur
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        regisseurId: null,
      },
    });

    return {
      message: 'Utilisateur dissocié du régisseur avec succès',
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      },
      regisseur: regisseurInfo,
    };
  }

  /**
   * Supprimer un régisseur
   */
  async deleteRegisseur(id: string) {
    // Vérifier que le régisseur existe
    const regisseur = await this.prisma.regisseur.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            centres: true,
            users: true,
          },
        },
      },
    });

    if (!regisseur) {
      throw new NotFoundException('Régisseur introuvable');
    }

    // Vérifier s'il y a des centres ou utilisateurs associés
    if (regisseur._count.centres > 0 || regisseur._count.users > 0) {
      const reasons: string[] = [];
      if (regisseur._count.centres > 0) {
        reasons.push(`${regisseur._count.centres} centre(s)`);
      }
      if (regisseur._count.users > 0) {
        reasons.push(`${regisseur._count.users} utilisateur(s)`);
      }
      throw new ConflictException(
        `Impossible de supprimer ce régisseur car il est associé à ${reasons.join(' et ')}. Veuillez d'abord supprimer ou déplacer ces éléments avant de supprimer le régisseur.`,
      );
    }

    // Supprimer le régisseur
    await this.prisma.regisseur.delete({
      where: { id },
    });

    return {
      message: 'Régisseur supprimé avec succès',
      deletedRegisseur: {
        id: regisseur.id,
        code: regisseur.code,
        nom: regisseur.nom,
        prenom: regisseur.prenom,
        email: regisseur.email,
      },
    };
  }

  /**
   * Créer un nouveau centre
   */
  async createCentre(createCentreDto: CreateCentreDto) {
    // Générer le code automatiquement s'il n'est pas fourni
    let code = createCentreDto.code;
    if (!code) {
      // Compter les centres existants pour générer le prochain code
      const count = await this.prisma.centre.count();
      code = `CS-${String(count + 1).padStart(4, '0')}`;
      
      // Vérifier si le code généré existe déjà (cas rare)
      const existingCode = await this.prisma.centre.findUnique({
        where: { code },
      });
      if (existingCode) {
        // Si le code existe, chercher le prochain disponible
        let counter = count + 1;
        do {
          counter++;
          code = `CS-${String(counter).padStart(4, '0')}`;
          const checkCode = await this.prisma.centre.findUnique({
            where: { code },
          });
          if (!checkCode) break;
        } while (counter < 9999);
      }
    } else {
      // Vérifier si le code fourni existe déjà
      const existingCode = await this.prisma.centre.findUnique({
        where: { code: createCentreDto.code },
      });
      if (existingCode) {
        throw new ConflictException('Ce code centre existe déjà');
      }
    }

    // Vérifier si le régisseur existe (si fourni)
    if (createCentreDto.regisseurId) {
      const regisseur = await this.prisma.regisseur.findUnique({
        where: { id: createCentreDto.regisseurId },
      });
      if (!regisseur) {
        throw new NotFoundException('Régisseur introuvable');
      }
    }

    // Pour compatibilité, on remplit aussi les anciens champs
    const createData: any = {
      code,
      nom: createCentreDto.nom,
      adresse: createCentreDto.adresse,
      commune: createCentreDto.commune,
      sousPrefecture: createCentreDto.sousPrefecture,
      chefLieu: createCentreDto.chefLieu,
      departement: createCentreDto.departement,
      region: createCentreDto.region,
      telephone: createCentreDto.telephone,
      email: createCentreDto.email,
      type: createCentreDto.type,
      niveau: createCentreDto.niveau,
      regisseurId: createCentreDto.regisseurId,
      actif: createCentreDto.actif ?? true,
      // Anciens champs pour compatibilité
      province: createCentreDto.chefLieu, // Ancien champ province = nouveau chefLieu
    };
    
    const centre = await this.prisma.centre.create({
      data: createData,
      include: {
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            region: true,
          },
        },
        _count: {
          select: {
            users: true,
            budgets: true,
          },
        },
      },
    });

    // Synchroniser avec les divisions administratives
    if (createCentreDto.commune) {
      try {
        // Trouver ou créer/mettre à jour la division administrative correspondante
        await this.divisionsService.findOrCreateByCommune({
          commune: createCentreDto.commune,
          region: createCentreDto.region,
          departement: createCentreDto.departement,
          chefLieu: createCentreDto.chefLieu,
          sousPrefecture: createCentreDto.sousPrefecture,
        });
      } catch (error) {
        // Ne pas bloquer la création du centre si la synchronisation échoue
        console.error('Erreur lors de la synchronisation avec les divisions administratives:', error);
      }
    }

    return {
      message: 'Centre créé avec succès',
      centre,
    };
  }

  /**
   * Récupérer les centres d'un régisseur spécifique
   */
  async getCentresByRegisseur(regisseurId: string) {
    const centres = await this.prisma.centre.findMany({
      where: {
        regisseurId: regisseurId,
        actif: true,
      },
      include: {
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            region: true,
          },
        },
        users: {
          where: {
            role: RoleType.CHEF_CENTRE,
          },
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            email: true,
          },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            budgets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return centres.map((centre) => {
      const centreAny = centre as any;
      const { province, commune, region: oldRegion, ...centreData } = centre;
      
      return {
        ...centreData,
        chefLieu: centreAny.chefLieu || province || '',
        departement: centreAny.departement || oldRegion || '',
        region: centreAny.region || commune || '',
        commune: commune || '',
        chefCentre: centre.users.length > 0 ? centre.users[0] : null,
        usersCount: centre._count.users,
        budgetsCount: centre._count.budgets,
      };
    });
  }

  /**
   * Récupérer tous les centres
   */
  async getAllCentres() {
    try {
      const centres = await this.prisma.centre.findMany({
        include: {
          regisseur: {
            select: {
              id: true,
              code: true,
              nom: true,
              prenom: true,
              region: true,
            },
          },
          users: {
            where: {
              role: RoleType.CHEF_CENTRE,
            },
            select: {
              id: true,
              code: true,
              nom: true,
              prenom: true,
              email: true,
            },
            take: 1, // Un seul chef de centre par centre normalement
          },
          _count: {
            select: {
              users: true,
              budgets: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return centres.map((centre) => {
        // Extraire les données de base en toute sécurité
        const {
          id,
          code,
          nom,
          adresse,
          commune,
          region,
          telephone,
          email,
          type,
          niveau,
          actif,
          regisseurId,
          chefLieu,
          departement,
          sousPrefecture,
          province,
          users,
          _count,
          regisseur,
          createdAt,
          updatedAt,
        } = centre as any;

        // Mapper les champs pour compatibilité
        const mappedCentre: any = {
          id,
          code,
          nom,
          adresse,
          commune: commune || '',
          region: region || commune || '',
          departement: departement || region || '',
          chefLieu: chefLieu || province || '',
          sousPrefecture: sousPrefecture || '',
          telephone: telephone || null,
          email: email || null,
          type,
          niveau,
          actif,
          regisseurId: regisseurId || null,
          regisseur: regisseur || null,
          chefCentre: (users && users.length > 0) ? users[0] : null,
          usersCount: _count?.users || 0,
          budgetsCount: _count?.budgets || 0,
          createdAt,
          updatedAt,
        };

        return mappedCentre;
      });
    } catch (error) {
      console.error('Erreur dans getAllCentres:', error);
      throw error;
    }
  }

  /**
   * Récupérer un centre par son ID
   */
  async getCentreById(id: string) {
    const centre = await this.prisma.centre.findUnique({
      where: { id },
      include: {
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            region: true,
          },
        },
        _count: {
          select: {
            users: true,
            budgets: true,
          },
        },
      },
    });

    if (!centre) {
      throw new NotFoundException('Centre introuvable');
    }

    const { province, commune, region: oldRegion, ...centreData } = centre;
    const centreAny = centre as any;
    
    // Mapper les anciens champs vers les nouveaux pour compatibilité
    // Mapping: province -> chefLieu, region (ancien) -> departement, commune (ancien) -> region (nouveau)
    const mappedCentre = {
      ...centreData,
      chefLieu: centreAny.chefLieu || province || '',
      departement: centreAny.departement || oldRegion || '',
      region: centreAny.region || commune || '',
      commune: commune || '',
      province: undefined,
    };

    return {
      ...mappedCentre,
      usersCount: centre._count.users,
      budgetsCount: centre._count.budgets,
    };
  }

  /**
   * Mettre à jour un centre
   */
  async updateCentre(id: string, updateCentreDto: UpdateCentreDto) {
    // Vérifier que le centre existe
    const existingCentre = await this.prisma.centre.findUnique({
      where: { id },
    });

    if (!existingCentre) {
      throw new NotFoundException('Centre introuvable');
    }

    // Vérifier si le régisseur existe (si fourni)
    if (updateCentreDto.regisseurId) {
      const regisseur = await this.prisma.regisseur.findUnique({
        where: { id: updateCentreDto.regisseurId },
      });
      if (!regisseur) {
        throw new NotFoundException('Régisseur introuvable');
      }
    }

    // Préparer les données de mise à jour avec compatibilité pour anciens champs
    const updateData: any = {
      ...updateCentreDto,
    };
    
    // Si les nouveaux champs sont fournis, aussi mettre à jour les anciens pour compatibilité
    if (updateCentreDto.chefLieu !== undefined) {
      updateData.province = updateCentreDto.chefLieu;
    }
    
    // Mettre à jour le centre
    const centre = await this.prisma.centre.update({
      where: { id },
      data: updateData,
      include: {
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
            region: true,
          },
        },
        _count: {
          select: {
            users: true,
            budgets: true,
          },
        },
      },
    });

    // Synchroniser avec les divisions administratives si les champs géographiques ont changé
    if (
      updateCentreDto.commune ||
      updateCentreDto.region ||
      updateCentreDto.departement ||
      updateCentreDto.chefLieu ||
      updateCentreDto.sousPrefecture
    ) {
      try {
        // Trouver ou créer/mettre à jour la division administrative correspondante
        // Convertir null en undefined pour correspondre au type attendu
        await this.divisionsService.findOrCreateByCommune({
          commune: updateCentreDto.commune || centre.commune || existingCentre.commune || undefined,
          region: updateCentreDto.region || centre.region || existingCentre.region || undefined,
          departement: updateCentreDto.departement || centre.departement || existingCentre.departement || undefined,
          chefLieu: updateCentreDto.chefLieu || centre.chefLieu || existingCentre.chefLieu || undefined,
          sousPrefecture: updateCentreDto.sousPrefecture || centre.sousPrefecture || existingCentre.sousPrefecture || undefined,
        });
      } catch (error) {
        // Ne pas bloquer la mise à jour du centre si la synchronisation échoue
        console.error('Erreur lors de la synchronisation avec les divisions administratives:', error);
      }
    }

    return {
      message: 'Centre mis à jour avec succès',
      centre: {
        ...centre,
        usersCount: centre._count.users,
        budgetsCount: centre._count.budgets,
      },
    };
  }

  /**
   * Supprimer un centre
   */
  async deleteCentre(id: string) {
    // Vérifier que le centre existe
    const centre = await this.prisma.centre.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            budgets: true,
          },
        },
      },
    });

    if (!centre) {
      throw new NotFoundException('Centre introuvable');
    }

    // Vérifier s'il y a des utilisateurs ou budgets associés
    if (centre._count.users > 0 || centre._count.budgets > 0) {
      const reasons: string[] = [];
      if (centre._count.users > 0) {
        reasons.push(`${centre._count.users} utilisateur(s)`);
      }
      if (centre._count.budgets > 0) {
        reasons.push(`${centre._count.budgets} budget(s)`);
      }
      throw new ConflictException(
        `Impossible de supprimer ce centre car il contient ${reasons.join(' et ')}. Veuillez d'abord supprimer ou déplacer ces éléments avant de supprimer le centre.`,
      );
    }

    // Supprimer le centre
    await this.prisma.centre.delete({
      where: { id },
    });

    return {
      message: 'Centre supprimé avec succès',
      deletedCentre: {
        id: centre.id,
        code: centre.code,
        nom: centre.nom,
      },
    };
  }

  /**
   * Créer un nouveau chef de centre
   */
  async createChefCentre(createChefCentreDto: CreateChefCentreDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createChefCentreDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier que le centre existe
    const centre = await this.prisma.centre.findUnique({
      where: { id: createChefCentreDto.centreId },
      include: {
        regisseur: true,
      },
    });
    if (!centre) {
      throw new NotFoundException('Centre introuvable');
    }

    // Si un régisseurId est fourni, vérifier qu'il existe
    if (createChefCentreDto.regisseurId) {
      const regisseur = await this.prisma.regisseur.findUnique({
        where: { id: createChefCentreDto.regisseurId },
      });
      if (!regisseur) {
        throw new NotFoundException('Régisseur introuvable');
      }
    } else if (centre.regisseurId) {
      // Si le centre a déjà un régisseur, l'utiliser par défaut
      createChefCentreDto.regisseurId = centre.regisseurId;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(createChefCentreDto.password, 10);

    // Générer un code si non fourni
    let code = createChefCentreDto.code;
    if (!code) {
      const existingCodes = await this.prisma.user.findMany({
        where: {
          role: RoleType.CHEF_CENTRE,
          code: {
            startsWith: 'CC-',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      if (existingCodes.length > 0 && existingCodes[0].code) {
        const lastNumber = parseInt(existingCodes[0].code.split('-')[1] || '0');
        code = `CC-${String(lastNumber + 1).padStart(3, '0')}`;
      } else {
        code = 'CC-001';
      }

      // Vérifier que le code généré n'existe pas
      while (await this.prisma.user.findUnique({ where: { code } })) {
        const number: number = parseInt(code.split('-')[1] || '0') + 1;
        code = `CC-${String(number).padStart(3, '0')}`;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: createChefCentreDto.email,
        password: hashedPassword,
        nom: createChefCentreDto.nom,
        prenom: createChefCentreDto.prenom,
        telephone: createChefCentreDto.telephone,
        code,
        role: RoleType.CHEF_CENTRE,
        statut: StatutUser.ACTIF,
        centreId: createChefCentreDto.centreId,
        regisseurId: createChefCentreDto.regisseurId,
      },
      include: {
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return {
      message: 'Chef de centre créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        code: user.code,
        role: user.role,
        telephone: user.telephone,
        centre: user.centre,
        regisseur: user.regisseur,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Récupérer tous les chefs de centres
   */
  async getAllChefsCentres() {
    const chefs = await this.prisma.user.findMany({
      where: {
        role: RoleType.CHEF_CENTRE,
      },
      include: {
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
            regisseur: {
              select: {
                id: true,
                code: true,
                nom: true,
                prenom: true,
                region: true,
              },
            },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Si le régisseur n'est pas directement associé au chef mais au centre, utiliser celui du centre
    return chefs.map((chef) => ({
      ...chef,
      regisseur: chef.regisseur || chef.centre?.regisseur || null,
    }));
  }

  /**
   * Récupérer un chef de centre par son ID
   */
  async getChefCentreById(id: string) {
    const chef = await this.prisma.user.findUnique({
      where: { id },
      include: {
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!chef || chef.role !== RoleType.CHEF_CENTRE) {
      throw new NotFoundException('Chef de centre introuvable');
    }

    return chef;
  }

  /**
   * Mettre à jour un chef de centre
   */
  async updateChefCentre(id: string, updateChefCentreDto: UpdateChefCentreDto) {
    // Vérifier que le chef de centre existe
    const existingChef = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingChef || existingChef.role !== RoleType.CHEF_CENTRE) {
      throw new NotFoundException('Chef de centre introuvable');
    }

    // Vérifier si l'email existe déjà (si fourni et différent de l'actuel)
    if (updateChefCentreDto.email && updateChefCentreDto.email !== existingChef.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateChefCentreDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Vérifier que le centre existe (si fourni)
    if (updateChefCentreDto.centreId) {
      const centre = await this.prisma.centre.findUnique({
        where: { id: updateChefCentreDto.centreId },
      });
      if (!centre) {
        throw new NotFoundException('Centre introuvable');
      }
    }

    // Vérifier que le régisseur existe (si fourni)
    if (updateChefCentreDto.regisseurId) {
      const regisseur = await this.prisma.regisseur.findUnique({
        where: { id: updateChefCentreDto.regisseurId },
      });
      if (!regisseur) {
        throw new NotFoundException('Régisseur introuvable');
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updateChefCentreDto.email) updateData.email = updateChefCentreDto.email;
    if (updateChefCentreDto.nom) updateData.nom = updateChefCentreDto.nom;
    if (updateChefCentreDto.prenom) updateData.prenom = updateChefCentreDto.prenom;
    if (updateChefCentreDto.telephone !== undefined) updateData.telephone = updateChefCentreDto.telephone;
    if (updateChefCentreDto.centreId) updateData.centreId = updateChefCentreDto.centreId;
    if (updateChefCentreDto.regisseurId !== undefined) updateData.regisseurId = updateChefCentreDto.regisseurId;

    // Hasher le nouveau mot de passe si fourni
    if (updateChefCentreDto.password) {
      updateData.password = await bcrypt.hash(updateChefCentreDto.password, 10);
    }

    // Mettre à jour le chef de centre
    const chef = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
          },
        },
        regisseur: {
          select: {
            id: true,
            code: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return {
      message: 'Chef de centre mis à jour avec succès',
      user: {
        id: chef.id,
        email: chef.email,
        nom: chef.nom,
        prenom: chef.prenom,
        code: chef.code,
        telephone: chef.telephone,
        role: chef.role,
        centre: chef.centre,
        regisseur: chef.regisseur,
        createdAt: chef.createdAt,
      },
    };
  }

  /**
   * Supprimer un chef de centre
   */
  async deleteChefCentre(id: string) {
    // Vérifier que le chef de centre existe
    const chef = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!chef || chef.role !== RoleType.CHEF_CENTRE) {
      throw new NotFoundException('Chef de centre introuvable');
    }

    // Vérifier s'il y a des budgets associés
    const budgetsCount = await this.prisma.budget.count({
      where: { creePar: id },
    });

    if (budgetsCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce chef de centre car il a créé ${budgetsCount} budget(s). Veuillez d'abord supprimer ou transférer ces budgets.`,
      );
    }

    // Supprimer le chef de centre
    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'Chef de centre supprimé avec succès',
      deletedChef: {
        id: chef.id,
        code: chef.code,
        nom: chef.nom,
        prenom: chef.prenom,
        email: chef.email,
      },
    };
  }

  /**
   * Créer une demande de réinitialisation de mot de passe
   */
  async createPasswordResetRequest(createPasswordResetRequestDto: CreatePasswordResetRequestDto) {
    console.log('[Password Reset] Demande pour l\'email:', createPasswordResetRequestDto.email);
    
    // Chercher d'abord dans la table User
    let user = await this.prisma.user.findUnique({
      where: { email: createPasswordResetRequestDto.email },
      include: {
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
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
      },
    });

    // Si l'utilisateur n'est pas trouvé dans User, chercher dans Regisseur
    if (!user) {
      console.log('[Password Reset] Utilisateur non trouvé dans User, recherche dans Regisseur...');
      const regisseur = await this.prisma.regisseur.findUnique({
        where: { email: createPasswordResetRequestDto.email },
      });

      if (regisseur) {
        console.log('[Password Reset] Régisseur trouvé:', { id: regisseur.id, email: regisseur.email });
        // Chercher un User lié à ce régisseur via regisseurId
        user = await this.prisma.user.findFirst({
          where: {
            regisseurId: regisseur.id,
            role: RoleType.REGISSEUR,
          },
          include: {
            regisseur: {
              select: {
                id: true,
                code: true,
                nom: true,
                prenom: true,
                region: true,
              },
            },
            centre: {
              select: {
                id: true,
                code: true,
                nom: true,
              },
            },
          },
        });

        // Si aucun User n'est trouvé avec ce régisseur, chercher un User avec l'email du régisseur
        // (peut arriver si le User a été créé avec l'email du régisseur mais sans regisseurId)
        if (!user) {
          console.log('[Password Reset] Aucun User lié au régisseur via regisseurId, recherche par email du régisseur...');
          user = await this.prisma.user.findUnique({
            where: {
              email: regisseur.email,
            },
            include: {
              regisseur: {
                select: {
                  id: true,
                  code: true,
                  nom: true,
                  prenom: true,
                  region: true,
                },
              },
              centre: {
                select: {
                  id: true,
                  code: true,
                  nom: true,
                },
              },
            },
          });
          
          // Si un User existe avec l'email du régisseur mais sans regisseurId, mettre à jour le lien
          if (user && !user.regisseurId && user.role === RoleType.REGISSEUR) {
            console.log('[Password Reset] User trouvé avec email du régisseur mais sans regisseurId, mise à jour du lien...');
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: {
                regisseurId: regisseur.id,
              },
              include: {
                regisseur: {
                  select: {
                    id: true,
                    code: true,
                    nom: true,
                    prenom: true,
                    region: true,
                  },
                },
                centre: {
                  select: {
                    id: true,
                    code: true,
                    nom: true,
                  },
                },
              },
            });
          }
          
          // Si aucun User n'existe du tout pour ce régisseur, créer un User avec un mot de passe temporaire
          // Cela permettra au régisseur de demander une réinitialisation
          if (!user) {
            console.log('[Password Reset] Aucun User trouvé pour ce régisseur, création d\'un User avec mot de passe temporaire...');
            const tempPassword = await bcrypt.hash('temp' + regisseur.id.substring(0, 8), 10);
            user = await this.prisma.user.create({
              data: {
                email: regisseur.email,
                password: tempPassword, // Mot de passe temporaire qui sera remplacé par la réinitialisation
                nom: regisseur.nom,
                prenom: regisseur.prenom,
                telephone: regisseur.telephone || null,
                role: RoleType.REGISSEUR,
                regisseurId: regisseur.id,
                code: regisseur.code, // Utiliser le code du régisseur
                statut: StatutUser.ACTIF,
                mustChangePassword: true, // Forcer le changement de mot de passe à la première connexion
              },
              include: {
                regisseur: {
                  select: {
                    id: true,
                    code: true,
                    nom: true,
                    prenom: true,
                    region: true,
                  },
                },
                centre: {
                  select: {
                    id: true,
                    code: true,
                    nom: true,
                  },
                },
              },
            });
            console.log('[Password Reset] User créé automatiquement pour le régisseur:', user.id);
          }
        }
      }
    }

    console.log('[Password Reset] Utilisateur trouvé:', user ? { id: user.id, email: user.email, role: user.role } : 'NULL');

    if (!user) {
      // Vérifier tous les utilisateurs avec un email similaire pour déboguer
      const allUsers = await this.prisma.user.findMany({
        select: { id: true, email: true, role: true },
        take: 10,
      });
      console.log('[Password Reset] Premiers utilisateurs dans la DB:', allUsers);
      
      // Vérifier aussi les régisseurs
      const allRegisseurs = await this.prisma.regisseur.findMany({
        select: { id: true, email: true },
        take: 10,
      });
      console.log('[Password Reset] Premiers régisseurs dans la DB:', allRegisseurs);
      
      throw new NotFoundException('Aucun utilisateur trouvé avec cet email. Vérifiez que l\'email correspond bien à un compte utilisateur (User) ou à un régisseur avec un compte utilisateur associé.');
    }

    console.log('[Password Reset] Rôle de l\'utilisateur:', user.role);
    
    if (user.role !== RoleType.CHEF_CENTRE && user.role !== RoleType.REGISSEUR) {
      console.log('[Password Reset] Rôle non autorisé:', user.role);
      throw new ConflictException('Seuls les chefs de centre et les régisseurs peuvent demander une réinitialisation de mot de passe');
    }

    // Vérifier s'il existe déjà une demande en attente pour cet utilisateur
    const existingRequest = await this.prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        statut: StatutPasswordReset.EN_ATTENTE,
      },
    });

    if (existingRequest) {
      throw new ConflictException('Une demande de réinitialisation est déjà en attente pour cet utilisateur');
    }

    // Créer la demande
    const request = await this.prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        statut: StatutPasswordReset.EN_ATTENTE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            code: true,
            role: true,
            centre: {
              select: {
                id: true,
                code: true,
                nom: true,
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
          },
        },
      },
    });

    return {
      message: 'Demande de réinitialisation créée avec succès',
      request: {
        id: request.id,
        user: request.user,
        statut: request.statut,
        createdAt: request.createdAt,
      },
    };
  }

  /**
   * Récupérer toutes les demandes de réinitialisation de mot de passe
   */
  async getAllPasswordResetRequests() {
    const requests = await this.prisma.passwordResetRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            code: true,
            role: true,
            centre: {
              select: {
                id: true,
                code: true,
                nom: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((request: any) => ({
      id: request.id,
      user: request.user,
      statut: request.statut,
      nouveauMotDePasse: request.nouveauMotDePasse,
      traitePar: request.traitePar,
      traiteLe: request.traiteLe,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  }

  /**
   * Générer un nouveau mot de passe pour une demande de réinitialisation
   */
  async generatePasswordForRequest(requestId: string, adminId: string) {
    // Récupérer la demande
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Demande de réinitialisation introuvable');
    }

    if (request.statut !== StatutPasswordReset.EN_ATTENTE) {
      throw new ConflictException('Cette demande a déjà été traitée ou annulée');
    }

    // Générer un mot de passe unique (8 caractères aléatoires avec lettres et chiffres)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newPassword = '';
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe de l'utilisateur et forcer le changement
    await this.prisma.user.update({
      where: { id: request.userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true, // Forcer l'utilisateur à changer son mot de passe à la prochaine connexion
      },
    });

    // Mettre à jour la demande
    const updatedRequest = await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        statut: StatutPasswordReset.TRAITE,
        nouveauMotDePasse: newPassword, // Stocker le mot de passe en clair pour que l'admin puisse le voir
        traitePar: adminId,
        traiteLe: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            code: true,
            role: true,
            centre: {
              select: {
                id: true,
                code: true,
                nom: true,
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
          },
        },
      },
    });

    return {
      message: 'Nouveau mot de passe généré avec succès',
      request: {
        id: updatedRequest.id,
        user: updatedRequest.user,
        nouveauMotDePasse: updatedRequest.nouveauMotDePasse,
        statut: updatedRequest.statut,
        traiteLe: updatedRequest.traiteLe,
      },
    };
  }
}

