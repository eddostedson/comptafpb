import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AutocompleteOptions {
  region?: string;
  departement?: string;
  chefLieu?: string;
  sousPrefecture?: string;
}

@Injectable()
export class DivisionsAdministrativesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer toutes les régions uniques
   */
  async getRegions(): Promise<string[]> {
    const divisions = await this.prisma.divisionAdministrative.findMany({
      where: { 
        actif: true,
        region: { not: null },
      },
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' },
    });

    return divisions
      .map(d => d.region)
      .filter((r): r is string => r !== null);
  }

  /**
   * Récupérer les départements d'une région
   */
  async getDepartementsByRegion(region: string): Promise<string[]> {
    const divisions = await this.prisma.divisionAdministrative.findMany({
      where: { 
        actif: true,
        region: { equals: region, mode: 'insensitive' },
        departement: { not: null },
      },
      select: { departement: true },
      distinct: ['departement'],
      orderBy: { departement: 'asc' },
    });

    return divisions
      .map(d => d.departement)
      .filter((d): d is string => d !== null);
  }

  /**
   * Récupérer les chef-lieux d'un département
   */
  async getChefLieusByDepartement(departement: string, region?: string): Promise<string[]> {
    const where: any = {
      actif: true,
      departement: { equals: departement, mode: 'insensitive' },
      chefLieu: { not: null },
    };

    if (region) {
      where.region = { equals: region, mode: 'insensitive' };
    }

    const divisions = await this.prisma.divisionAdministrative.findMany({
      where,
      select: { chefLieu: true },
      distinct: ['chefLieu'],
      orderBy: { chefLieu: 'asc' },
    });

    return divisions
      .map(d => d.chefLieu)
      .filter((c): c is string => c !== null);
  }

  /**
   * Récupérer les sous-préfectures d'un chef-lieu
   */
  async getSousPrefecturesByChefLieu(chefLieu: string, departement?: string): Promise<string[]> {
    const where: any = {
      actif: true,
      chefLieu: { equals: chefLieu, mode: 'insensitive' },
      sousPrefecture: { not: null },
    };

    if (departement) {
      where.departement = { equals: departement, mode: 'insensitive' };
    }

    const divisions = await this.prisma.divisionAdministrative.findMany({
      where,
      select: { sousPrefecture: true },
      distinct: ['sousPrefecture'],
      orderBy: { sousPrefecture: 'asc' },
    });

    return divisions
      .map(d => d.sousPrefecture)
      .filter((s): s is string => s !== null);
  }

  /**
   * Récupérer les communes
   */
  async getCommunes(options?: AutocompleteOptions): Promise<string[]> {
    const where: any = {
      actif: true,
      commune: { not: null },
    };

    if (options?.region) {
      where.region = { equals: options.region, mode: 'insensitive' };
    }
    if (options?.departement) {
      where.departement = { equals: options.departement, mode: 'insensitive' };
    }
    if (options?.chefLieu) {
      where.chefLieu = { equals: options.chefLieu, mode: 'insensitive' };
    }
    if (options?.sousPrefecture) {
      where.sousPrefecture = { equals: options.sousPrefecture, mode: 'insensitive' };
    }

    const divisions = await this.prisma.divisionAdministrative.findMany({
      where,
      select: { commune: true },
      distinct: ['commune'],
      orderBy: { commune: 'asc' },
    });

    return divisions
      .map(d => d.commune)
      .filter((c): c is string => c !== null);
  }

  /**
   * Recherche complète pour auto-complétion
   */
  async autocomplete(query: string, type?: 'region' | 'departement' | 'chefLieu' | 'sousPrefecture' | 'commune'): Promise<any> {
    if (!query || query.length < 2) {
      return {
        regions: [],
        departements: [],
        chefLieus: [],
        sousPrefectures: [],
        communes: [],
      };
    }

    const searchQuery = { contains: query, mode: 'insensitive' as const };
    const where = { actif: true };

    const [regions, departements, chefLieus, sousPrefectures, communes] = await Promise.all([
      type === 'region' || !type
        ? this.prisma.divisionAdministrative.findMany({
            where: { ...where, region: searchQuery },
            select: { region: true },
            distinct: ['region'],
            take: 10,
          })
        : Promise.resolve([]),
      type === 'departement' || !type
        ? this.prisma.divisionAdministrative.findMany({
            where: { ...where, departement: searchQuery },
            select: { departement: true },
            distinct: ['departement'],
            take: 10,
          })
        : Promise.resolve([]),
      type === 'chefLieu' || !type
        ? this.prisma.divisionAdministrative.findMany({
            where: { ...where, chefLieu: searchQuery },
            select: { chefLieu: true },
            distinct: ['chefLieu'],
            take: 10,
          })
        : Promise.resolve([]),
      type === 'sousPrefecture' || !type
        ? this.prisma.divisionAdministrative.findMany({
            where: { ...where, sousPrefecture: searchQuery },
            select: { sousPrefecture: true },
            distinct: ['sousPrefecture'],
            take: 10,
          })
        : Promise.resolve([]),
      type === 'commune' || !type
        ? this.prisma.divisionAdministrative.findMany({
            where: { ...where, commune: searchQuery },
            select: { commune: true },
            distinct: ['commune'],
            take: 10,
          })
        : Promise.resolve([]),
    ]);

    return {
      regions: regions.map(r => r.region).filter((r): r is string => r !== null),
      departements: departements.map(d => d.departement).filter((d): d is string => d !== null),
      chefLieus: chefLieus.map(c => c.chefLieu).filter((c): c is string => c !== null),
      sousPrefectures: sousPrefectures.map(s => s.sousPrefecture).filter((s): s is string => s !== null),
      communes: communes.map(c => c.commune).filter((c): c is string => c !== null),
    };
  }

  /**
   * Récupérer toutes les divisions administratives (pour gestion)
   */
  async findAll(page = 1, pageSize = 50, search?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = { actif: true };

    if (search) {
      where.OR = [
        { region: { contains: search, mode: 'insensitive' } },
        { departement: { contains: search, mode: 'insensitive' } },
        { chefLieu: { contains: search, mode: 'insensitive' } },
        { sousPrefecture: { contains: search, mode: 'insensitive' } },
        { commune: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.divisionAdministrative.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ region: 'asc' }, { departement: 'asc' }, { commune: 'asc' }],
      }),
      this.prisma.divisionAdministrative.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Créer une nouvelle division administrative
   */
  async create(data: {
    code?: string;
    region?: string;
    departement?: string;
    chefLieu?: string;
    sousPrefecture?: string;
    commune?: string;
    actif?: boolean;
  }) {
    // Générer un code si non fourni
    let code = data.code;
    if (!code) {
      const parts = [
        data.region,
        data.departement,
        data.commune,
      ].filter(Boolean);
      code = parts.length > 0 
        ? parts.join('-').replace(/\s+/g, '-').toUpperCase()
        : `DIV-${Date.now()}`;
      
      // Vérifier l'unicité
      let counter = 1;
      let uniqueCode = code;
      while (await this.prisma.divisionAdministrative.findUnique({ where: { code: uniqueCode } })) {
        uniqueCode = `${code}-${counter}`;
        counter++;
      }
      code = uniqueCode;
    } else {
      // Vérifier que le code n'existe pas déjà
      const existing = await this.prisma.divisionAdministrative.findUnique({
        where: { code },
      });
      if (existing) {
        throw new ConflictException('Ce code existe déjà');
      }
    }

    const division = await this.prisma.divisionAdministrative.create({
      data: {
        code,
        region: data.region,
        departement: data.departement,
        chefLieu: data.chefLieu,
        sousPrefecture: data.sousPrefecture,
        commune: data.commune,
        actif: data.actif ?? true,
      },
    });

    return { message: 'Division administrative créée avec succès', division };
  }

  /**
   * Mettre à jour une division administrative
   * Met automatiquement à jour les centres qui utilisent les anciennes valeurs
   */
  async update(id: string, data: {
    code?: string;
    region?: string;
    departement?: string;
    chefLieu?: string;
    sousPrefecture?: string;
    commune?: string;
    actif?: boolean;
  }) {
    // Vérifier que la division existe
    const existing = await this.prisma.divisionAdministrative.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Division administrative introuvable');
    }

    // Vérifier l'unicité du code si modifié
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.prisma.divisionAdministrative.findUnique({
        where: { code: data.code },
      });
      if (codeExists) {
        throw new ConflictException('Ce code existe déjà');
      }
    }

    // Mettre à jour la division administrative
    const division = await this.prisma.divisionAdministrative.update({
      where: { id },
      data,
    });

    // Identifier les changements pour propager aux centres
    const updates: {
      region?: { old: string | null; new: string | null };
      departement?: { old: string | null; new: string | null };
      chefLieu?: { old: string | null; new: string | null };
      sousPrefecture?: { old: string | null; new: string | null };
      commune?: { old: string | null; new: string | null };
    } = {};

    // Détecter les changements de chaque champ
    if (data.region !== undefined && data.region !== existing.region) {
      updates.region = { old: existing.region, new: data.region };
    }
    if (data.departement !== undefined && data.departement !== existing.departement) {
      updates.departement = { old: existing.departement, new: data.departement };
    }
    if (data.chefLieu !== undefined && data.chefLieu !== existing.chefLieu) {
      updates.chefLieu = { old: existing.chefLieu, new: data.chefLieu };
    }
    if (data.sousPrefecture !== undefined && data.sousPrefecture !== existing.sousPrefecture) {
      updates.sousPrefecture = { old: existing.sousPrefecture, new: data.sousPrefecture };
    }
    if (data.commune !== undefined && data.commune !== existing.commune) {
      updates.commune = { old: existing.commune, new: data.commune };
    }

    // Propager les changements aux centres concernés
    let centresUpdated = 0;
    if (Object.keys(updates).length > 0) {
      // Construire la condition de recherche pour trouver les centres à mettre à jour
      const whereConditions: any[] = [];

      // Pour chaque champ modifié, chercher les centres qui utilisent l'ancienne valeur
      if (updates.region && updates.region.old) {
        whereConditions.push({
          OR: [
            { region: { equals: updates.region.old, mode: 'insensitive' } },
            { commune: { equals: updates.region.old, mode: 'insensitive' } }, // Ancien champ
          ],
        });
      }
      if (updates.departement && updates.departement.old) {
        whereConditions.push({
          departement: { equals: updates.departement.old, mode: 'insensitive' },
        });
      }
      if (updates.chefLieu && updates.chefLieu.old) {
        whereConditions.push({
          OR: [
            { chefLieu: { equals: updates.chefLieu.old, mode: 'insensitive' } },
            { province: { equals: updates.chefLieu.old, mode: 'insensitive' } }, // Ancien champ
          ],
        });
      }
      if (updates.sousPrefecture && updates.sousPrefecture.old) {
        whereConditions.push({
          sousPrefecture: { equals: updates.sousPrefecture.old, mode: 'insensitive' },
        });
      }
      if (updates.commune && updates.commune.old) {
        whereConditions.push({
          commune: { equals: updates.commune.old, mode: 'insensitive' },
        });
      }

      if (whereConditions.length > 0) {
        // Trouver tous les centres à mettre à jour (recherche avec OR pour couvrir tous les cas)
        const centresToUpdate = await this.prisma.centre.findMany({
          where: {
            OR: whereConditions,
          },
          select: {
            id: true,
            code: true,
            nom: true,
            region: true,
            departement: true,
            chefLieu: true,
            sousPrefecture: true,
            commune: true,
            province: true,
          },
        });

        // Mettre à jour chaque centre de manière précise
        for (const centre of centresToUpdate) {
          const updateData: any = {};

          // Mettre à jour région (vérifie les nouveaux et anciens champs)
          if (updates.region && updates.region.new && updates.region.old) {
            const oldValue = updates.region.old.toLowerCase();
            if (
              (centre.region && centre.region.toLowerCase() === oldValue) ||
              (centre.commune && centre.commune.toLowerCase() === oldValue)
            ) {
              updateData.region = updates.region.new;
              // Mettre à jour aussi l'ancien champ pour compatibilité
              updateData.commune = updates.region.new;
            }
          }

          // Mettre à jour département
          if (updates.departement && updates.departement.new && updates.departement.old) {
            if (
              centre.departement &&
              centre.departement.toLowerCase() === updates.departement.old.toLowerCase()
            ) {
              updateData.departement = updates.departement.new;
            }
          }

          // Mettre à jour chef-lieu (vérifie les nouveaux et anciens champs)
          if (updates.chefLieu && updates.chefLieu.new && updates.chefLieu.old) {
            const oldValue = updates.chefLieu.old.toLowerCase();
            if (
              (centre.chefLieu && centre.chefLieu.toLowerCase() === oldValue) ||
              (centre.province && centre.province.toLowerCase() === oldValue)
            ) {
              updateData.chefLieu = updates.chefLieu.new;
              // Mettre à jour aussi l'ancien champ pour compatibilité
              updateData.province = updates.chefLieu.new;
            }
          }

          // Mettre à jour sous-préfecture
          if (updates.sousPrefecture && updates.sousPrefecture.new && updates.sousPrefecture.old) {
            if (
              centre.sousPrefecture &&
              centre.sousPrefecture.toLowerCase() === updates.sousPrefecture.old.toLowerCase()
            ) {
              updateData.sousPrefecture = updates.sousPrefecture.new;
            }
          }

          // Mettre à jour commune (note: commune dans Centre = ancien sens)
          if (updates.commune && updates.commune.new && updates.commune.old) {
            if (
              centre.commune &&
              centre.commune.toLowerCase() === updates.commune.old.toLowerCase()
            ) {
              updateData.commune = updates.commune.new;
            }
          }

          // Mettre à jour le centre si des changements sont nécessaires
          if (Object.keys(updateData).length > 0) {
            await this.prisma.centre.update({
              where: { id: centre.id },
              data: updateData,
            });
            centresUpdated++;
          }
        }
      }
    }

    return {
      message: 'Division administrative mise à jour avec succès',
      division,
      centresUpdated,
      details: centresUpdated > 0
        ? `${centresUpdated} centre(s) mis à jour automatiquement avec les nouvelles valeurs`
        : 'Aucun centre à mettre à jour',
    };
  }

  /**
   * Supprimer une division administrative
   */
  async delete(id: string) {
    // Vérifier que la division existe
    const existing = await this.prisma.divisionAdministrative.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Division administrative introuvable');
    }

    await this.prisma.divisionAdministrative.delete({
      where: { id },
    });

    return { message: 'Division administrative supprimée avec succès' };
  }

  /**
   * Récupérer une division administrative par ID
   */
  async findOne(id: string) {
    const division = await this.prisma.divisionAdministrative.findUnique({
      where: { id },
    });

    if (!division) {
      throw new NotFoundException('Division administrative introuvable');
    }

    return division;
  }

  /**
   * Trouver une division administrative par commune ou créer/mettre à jour
   */
  async findOrCreateByCommune(data: {
    region?: string;
    departement?: string;
    chefLieu?: string;
    sousPrefecture?: string;
    commune?: string;
  }) {
    if (!data.commune) {
      return null;
    }

    // Chercher une division existante par commune exacte
    let division = await this.prisma.divisionAdministrative.findFirst({
      where: {
        commune: { equals: data.commune, mode: 'insensitive' },
        actif: true,
      },
      orderBy: { updatedAt: 'desc' }, // Prendre la plus récente
    });

    if (division) {
      // Si trouvée, vérifier si on doit mettre à jour
      const needsUpdate =
        (data.region && data.region !== division.region) ||
        (data.departement && data.departement !== division.departement) ||
        (data.chefLieu && data.chefLieu !== division.chefLieu) ||
        (data.sousPrefecture && data.sousPrefecture !== division.sousPrefecture);

      if (needsUpdate) {
        // Mettre à jour la division existante
        division = await this.prisma.divisionAdministrative.update({
          where: { id: division.id },
          data: {
            region: data.region || division.region,
            departement: data.departement || division.departement,
            chefLieu: data.chefLieu || division.chefLieu,
            sousPrefecture: data.sousPrefecture || division.sousPrefecture,
            commune: data.commune || division.commune,
          },
        });
      }
    } else {
      // Créer une nouvelle division
      const parts = [
        data.region,
        data.departement,
        data.commune,
      ].filter(Boolean);
      const code = parts.length > 0
        ? parts.join('-').replace(/\s+/g, '-').toUpperCase()
        : `DIV-${Date.now()}`;

      // Vérifier l'unicité du code
      let uniqueCode = code;
      let counter = 1;
      while (await this.prisma.divisionAdministrative.findUnique({ where: { code: uniqueCode } })) {
        uniqueCode = `${code}-${counter}`;
        counter++;
      }

      division = await this.prisma.divisionAdministrative.create({
        data: {
          code: uniqueCode,
          region: data.region,
          departement: data.departement,
          chefLieu: data.chefLieu,
          sousPrefecture: data.sousPrefecture,
          commune: data.commune,
          actif: true,
        },
      });
    }

    return division;
  }
}
