import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, SourceRecetteDto, LigneBudgetaireDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateLigneBudgetaireDto } from './dto/create-ligne-budgetaire.dto';
import { UpdateLigneBudgetaireDto } from './dto/update-ligne-budgetaire.dto';
import { StatutBudget, SourceFinancement, TypeSourceRecette } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, centreId: string, dto: CreateBudgetDto) {
    try {
      // Vérifications préliminaires
      if (!dto.nom || dto.nom.trim() === '') {
        throw new BadRequestException('Le nom du budget est requis');
      }
      if (!dto.annee || dto.annee < 2000 || dto.annee > 2100) {
        throw new BadRequestException('L\'année doit être valide (2000-2100)');
      }
      if (!dto.type) {
        throw new BadRequestException('Le type de budget est requis');
      }
      if (!dto.sourcesRecettes || dto.sourcesRecettes.length === 0) {
        throw new BadRequestException('Au moins une source de recette est requise');
      }

      console.log('[Budget Service] Début création budget:', {
        nom: dto.nom,
        annee: dto.annee,
        type: dto.type,
        sourcesCount: dto.sourcesRecettes?.length || 0,
        lignesCount: dto.lignesBudgetaires?.length || 0,
      });

      // Calculer les totaux (utiliser un tableau vide si lignesBudgetaires n'existe pas)
      const lignes = dto.lignesBudgetaires || [];
      const { totalRecettes, totalDepenses, recettesParSource, depensesParSource } =
        this.calculateTotals(dto.sourcesRecettes, lignes);

      console.log('[Budget Service] Totaux calculés:', {
        totalRecettes,
        totalDepenses,
      });

      // Validation : vérifier que les dépenses ne dépassent pas les recettes par source
      // Seulement si il y a des dépenses à valider
      if (lignes && lignes.length > 0) {
        this.validateBudget(recettesParSource, depensesParSource);
      }

      // Générer le code
      const code = await this.generateCode(dto.annee, centreId);
      console.log('[Budget Service] Code généré:', code);

      // Créer le budget avec les sources et lignes
      console.log('[Budget Service] Préparation des sources de recettes:', dto.sourcesRecettes);
      
      const sourcesData = dto.sourcesRecettes.map((s) => {
        // S'assurer que le montant est une string valide et nettoyée
        const montantStr = String(s.montant || '0').trim();
        if (!montantStr || montantStr === '') {
          throw new BadRequestException(`Le montant ne peut pas être vide pour la source ${s.type}`);
        }
        const montantDecimal = new Decimal(montantStr);
        if (montantDecimal.lt(0)) {
          throw new BadRequestException(`Le montant doit être positif pour la source ${s.type}`);
        }
        
        console.log('[Budget Service] Source préparée:', {
          type: s.type,
          montant: montantStr,
          montantDecimal: montantDecimal.toString(),
        });
        
        return {
          type: s.type as TypeSourceRecette,
          nature: s.nature && s.nature.trim() !== '' ? s.nature.trim() : null,
          montant: montantDecimal,
        };
      });

      console.log('[Budget Service] Création du budget en base de données...');
      
      const budget = await this.prisma.budget.create({
        data: {
          code,
          nom: dto.nom,
          description: dto.description,
          annee: dto.annee,
          type: dto.type,
          statut: StatutBudget.BROUILLON,
          centreId,
          creePar: userId,
          montantTotal: new Decimal(String(totalDepenses || 0)),
          sourcesRecettes: {
            create: sourcesData,
          },
          lignesBudgetaires: {
            create: lignes && lignes.length > 0
              ? lignes.map((l) => {
                  const montantActivite = new Decimal(l.quantite)
                    .mul(new Decimal(l.frequence))
                    .mul(new Decimal(l.coutUnitaire));

                  return {
                    activiteCle: l.activiteCle,
                    typeMoyens: l.typeMoyens,
                    quantite: new Decimal(l.quantite),
                    frequence: new Decimal(l.frequence),
                    coutUnitaire: new Decimal(l.coutUnitaire),
                    montantActivite,
                    montantPrevu: montantActivite,
                    ligneNbe: l.ligneNbe || null,
                    libelleNbe: l.libelleNbe || null,
                    sourceFinancement: l.sourceFinancement as SourceFinancement,
                  };
                })
              : [],
          },
      },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
    });

      // Sauvegarder les templates d'activités pour auto-complétion (seulement s'il y a des lignes)
      if (lignes && lignes.length > 0) {
        await this.saveActivityTemplates(centreId, lignes);
      }

      console.log('[Budget Service] Budget créé avec succès:', budget.id);
      return budget;
    } catch (error: any) {
      console.error('[Budget Service] Erreur lors de la création du budget:', error);
      console.error('[Budget Service] Message:', error.message);
      console.error('[Budget Service] Stack:', error.stack);
      throw error;
    }
  }

  async findAll(centreId?: string, regisseurId?: string) {
    const where: any = {};
    if (centreId) {
      where.centreId = centreId;
    } else if (regisseurId) {
      where.centre = { regisseurId };
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
            niveau: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculer le montant total à partir des sources de recettes pour chaque budget
    return budgets.map((budget) => {
      const montantTotal = budget.sourcesRecettes.reduce(
        (sum, source) => sum + Number(source.montant),
        0
      );
      return {
        ...budget,
        montantTotal,
      };
    });
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: {
          include: {
            nbeLine: {
              select: {
                id: true,
                ligne: true,
                libelle: true,
                objetDepense: true,
                categorie: true,
                sousCategorie: true,
              },
            },
          },
        },
        centre: {
          select: {
            id: true,
            code: true,
            nom: true,
            niveau: true,
            type: true,
            commune: true,
            region: true,
            departement: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${id} introuvable`);
    }

    return budget;
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    const budget = await this.findOne(id);

    // Vérifier que c'est le créateur
    if (budget.creePar !== userId) {
      throw new BadRequestException('Seul le créateur peut modifier le budget');
    }
    // Permettre la modification si brouillon ou en attente de validation
    // Une fois validé, on ne peut plus modifier (protection des données validées)
    if (budget.statut === StatutBudget.VALIDE || budget.statut === StatutBudget.ARCHIVE) {
      throw new BadRequestException('Ce budget a été validé et ne peut plus être modifié');
    }
    // Si rejeté, permettre la modification pour corriger

    // Recalculer si sources ou lignes modifiées
    if (dto.sourcesRecettes || dto.lignesBudgetaires) {
      const sources = dto.sourcesRecettes || (await this.getSourcesRecettes(id));
      const lignes = dto.lignesBudgetaires || (await this.getLignesBudgetaires(id));

      const { totalRecettes, totalDepenses, recettesParSource, depensesParSource } =
        this.calculateTotals(sources, lignes);

      this.validateBudget(recettesParSource, depensesParSource);
    }

    // Mettre à jour
    const updateData: any = {};
    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.annee !== undefined) updateData.annee = dto.annee;
    if (dto.type !== undefined) updateData.type = dto.type;

    if (dto.sourcesRecettes) {
      // Supprimer les anciennes sources
      await this.prisma.sourceRecette.deleteMany({ where: { budgetId: id } });
      // Créer les nouvelles
      updateData.sourcesRecettes = {
        create: dto.sourcesRecettes.map((s) => ({
          type: s.type as TypeSourceRecette,
          nature: s.nature,
          montant: new Decimal(s.montant),
        })),
      };
    }

    if (dto.lignesBudgetaires) {
      // Supprimer les anciennes lignes
      await this.prisma.ligneBudgetaire.deleteMany({ where: { budgetId: id } });
      // Créer les nouvelles
      updateData.lignesBudgetaires = {
        create: dto.lignesBudgetaires.map((l) => {
          const montantActivite = new Decimal(l.quantite)
            .mul(new Decimal(l.frequence))
            .mul(new Decimal(l.coutUnitaire));

          return {
            activiteCle: l.activiteCle,
            typeMoyens: l.typeMoyens,
            quantite: new Decimal(l.quantite),
            frequence: new Decimal(l.frequence),
            coutUnitaire: new Decimal(l.coutUnitaire),
            montantActivite,
            montantPrevu: montantActivite,
            ligneNbe: l.ligneNbe,
            libelleNbe: l.libelleNbe,
            sourceFinancement: l.sourceFinancement as SourceFinancement,
          };
        }),
      };

      // Sauvegarder les templates
      await this.saveActivityTemplates(budget.centreId, dto.lignesBudgetaires);
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
    });

    return updated;
  }

  async submit(id: string, userId: string) {
    const budget = await this.findOne(id);

    if (budget.creePar !== userId) {
      throw new BadRequestException('Seul le créateur peut soumettre le budget');
    }
    if (budget.statut !== StatutBudget.BROUILLON) {
      throw new BadRequestException('Seuls les budgets en brouillon peuvent être soumis');
    }

    // Valider les totaux avant soumission
    const sources = await this.getSourcesRecettes(id);
    const lignes = await this.getLignesBudgetaires(id);
    const { recettesParSource, depensesParSource } = this.calculateTotals(sources, lignes);
    this.validateBudget(recettesParSource, depensesParSource);

    return this.prisma.budget.update({
      where: { id },
      data: {
        statut: StatutBudget.EN_ATTENTE_VALIDATION,
      },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
    });
  }

  async validate(id: string, userId: string) {
    const budget = await this.findOne(id);

    if (budget.statut !== StatutBudget.EN_ATTENTE_VALIDATION) {
      throw new BadRequestException('Seuls les budgets en attente peuvent être validés');
    }

    return this.prisma.budget.update({
      where: { id },
      data: {
        statut: StatutBudget.VALIDE,
        validePar: userId,
        valideLe: new Date(),
        montantValide: budget.montantTotal,
      },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
    });
  }

  async reject(id: string, userId: string, raison?: string) {
    const budget = await this.findOne(id);

    if (budget.statut !== StatutBudget.EN_ATTENTE_VALIDATION) {
      throw new BadRequestException('Seuls les budgets en attente peuvent être rejetés');
    }

    return this.prisma.budget.update({
      where: { id },
      data: {
        statut: StatutBudget.REJETE,
        description: raison ? `${budget.description || ''}\nRaison du rejet: ${raison}`.trim() : budget.description,
      },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
    });
  }

  async getSummary(id: string) {
    const budget = await this.findOne(id);
    const sources = await this.getSourcesRecettes(id);
    const lignes = await this.getLignesBudgetaires(id);

    const { totalRecettes, totalDepenses, recettesParSource, depensesParSource } =
      this.calculateTotals(sources, lignes);

    return {
      budget: {
        id: budget.id,
        code: budget.code,
        nom: budget.nom,
        statut: budget.statut,
      },
      recettes: {
        total: totalRecettes,
        parSource: recettesParSource,
      },
      depenses: {
        total: totalDepenses,
        parSource: depensesParSource,
      },
      validation: {
        isValid: this.isBudgetValid(recettesParSource, depensesParSource),
        messages: this.getValidationMessages(recettesParSource, depensesParSource),
      },
    };
  }

  async delete(id: string, userId: string, userRole: string) {
    const budget = await this.findOne(id);

    // Vérifier les permissions
    if (userRole !== 'ADMIN' && budget.creePar !== userId) {
      throw new BadRequestException('Seul le créateur du budget ou un administrateur peut le supprimer');
    }

    // Ne pas permettre la suppression des budgets validés (sauf admin)
    if (budget.statut === StatutBudget.VALIDE && userRole !== 'ADMIN') {
      throw new BadRequestException('Un budget validé ne peut pas être supprimé. Contactez un administrateur.');
    }

    // Supprimer le budget (cascade delete pour sources et lignes)
    await this.prisma.budget.delete({
      where: { id },
    });

    return { message: 'Budget supprimé avec succès', id };
  }

  async getActivitySuggestions(centreId: string, query?: string) {
    const where: any = { centreId };
    if (query) {
      where.OR = [
        { activiteCle: { contains: query, mode: 'insensitive' } },
        { typeMoyens: { contains: query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.activityTemplate.findMany({
      where,
      orderBy: { utilisationCount: 'desc' },
      take: 20,
    });
  }

  // Méthodes privées

  private calculateTotals(
    sources: SourceRecetteDto[],
    lignes: LigneBudgetaireDto[],
  ): {
    totalRecettes: number;
    totalDepenses: number;
    recettesParSource: Record<string, number>;
    depensesParSource: Record<string, number>;
  } {
    const totalRecettes = sources.reduce((sum, s) => sum + Number(s.montant), 0);

    const totalDepenses = lignes.reduce(
      (sum, l) => sum + Number(l.quantite) * Number(l.frequence) * Number(l.coutUnitaire),
      0,
    );

    const recettesParSource: Record<string, number> = {};
    sources.forEach((s) => {
      const key = s.type;
      recettesParSource[key] = (recettesParSource[key] || 0) + Number(s.montant);
    });

    const depensesParSource: Record<string, number> = {};
    lignes.forEach((l) => {
      const key = l.sourceFinancement;
      const montant = Number(l.quantite) * Number(l.frequence) * Number(l.coutUnitaire);
      depensesParSource[key] = (depensesParSource[key] || 0) + montant;
    });

    return { totalRecettes, totalDepenses, recettesParSource, depensesParSource };
  }

  private validateBudget(
    recettesParSource: Record<string, number>,
    depensesParSource: Record<string, number>,
  ) {
    const mapping: Record<string, string> = {
      BE: 'BE',
      RESSOURCES_PROPRES: 'RP',
      PTF: 'AUTRES',
      DONS_LEGS: 'AUTRES',
    };

    for (const [source, montant] of Object.entries(depensesParSource)) {
      const recetteKey = Object.keys(recettesParSource).find(
        (k) => mapping[k] === source || k === source,
      );
      const recetteMontant = recettesParSource[recetteKey || ''] || 0;

      if (montant > recetteMontant) {
        throw new BadRequestException(
          `Les dépenses pour ${source} (${montant}) dépassent les recettes (${recetteMontant})`,
        );
      }
    }
  }

  private isBudgetValid(
    recettesParSource: Record<string, number>,
    depensesParSource: Record<string, number>,
  ): boolean {
    try {
      this.validateBudget(recettesParSource, depensesParSource);
      return true;
    } catch {
      return false;
    }
  }

  private getValidationMessages(
    recettesParSource: Record<string, number>,
    depensesParSource: Record<string, number>,
  ): string[] {
    const messages: string[] = [];
    const mapping: Record<string, string> = {
      BE: 'BE',
      RESSOURCES_PROPRES: 'RP',
      PTF: 'AUTRES',
      DONS_LEGS: 'AUTRES',
    };

    for (const [source, montant] of Object.entries(depensesParSource)) {
      const recetteKey = Object.keys(recettesParSource).find(
        (k) => mapping[k] === source || k === source,
      );
      const recetteMontant = recettesParSource[recetteKey || ''] || 0;

      if (montant > recetteMontant) {
        messages.push(
          `⚠️ Dépenses ${source}: ${montant.toLocaleString()} > Recettes: ${recetteMontant.toLocaleString()}`,
        );
      }
    }

    return messages;
  }

  private async generateCode(annee: number, centreId: string): Promise<string> {
    const count = await this.prisma.budget.count({
      where: { annee, centreId },
    });
    const centre = await this.prisma.centre.findUnique({ where: { id: centreId } });
    const centreCode = centre?.code.replace(/[^0-9]/g, '') || '000';
    return `BUD-${annee}-${centreCode}-${String(count + 1).padStart(3, '0')}`;
  }

  private async getSourcesRecettes(budgetId: string): Promise<SourceRecetteDto[]> {
    const sources = await this.prisma.sourceRecette.findMany({
      where: { budgetId },
    });

    return sources.map((s) => ({
      type: s.type as any,
      nature: s.nature || undefined,
      montant: s.montant.toString(),
    }));
  }

  private async getLignesBudgetaires(budgetId: string): Promise<LigneBudgetaireDto[]> {
    const lignes = await this.prisma.ligneBudgetaire.findMany({
      where: { budgetId },
    });

    return lignes.map((l) => ({
      activiteCle: l.activiteCle,
      typeMoyens: l.typeMoyens,
      quantite: l.quantite.toString(),
      frequence: l.frequence.toString(),
      coutUnitaire: l.coutUnitaire.toString(),
      ligneNbe: l.ligneNbe || undefined,
      libelleNbe: l.libelleNbe || undefined,
      sourceFinancement: l.sourceFinancement as any,
    }));
  }

  private async saveActivityTemplates(centreId: string, lignes: LigneBudgetaireDto[]) {
    for (const ligne of lignes) {
      const existing = await this.prisma.activityTemplate.findFirst({
        where: {
          centreId,
          activiteCle: ligne.activiteCle,
          typeMoyens: ligne.typeMoyens,
        },
      });

      if (existing) {
        // Incrémenter le compteur d'utilisation
        await this.prisma.activityTemplate.update({
          where: { id: existing.id },
          data: { utilisationCount: existing.utilisationCount + 1 },
        });
      } else {
        // Créer un nouveau template
        await this.prisma.activityTemplate.create({
          data: {
            activiteCle: ligne.activiteCle,
            typeMoyens: ligne.typeMoyens,
            ligneNbe: ligne.ligneNbe,
            libelleNbe: ligne.libelleNbe,
            sourceFinancement: ligne.sourceFinancement as SourceFinancement,
            centreId,
            utilisationCount: 1,
          },
        });
      }
    }
  }

  // Méthodes pour gérer les lignes budgétaires individuellement
  async createLigneBudgetaire(budgetId: string, userId: string, dto: CreateLigneBudgetaireDto) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    const budget = await this.findOne(budgetId);
    if (budget.creePar !== userId) {
      throw new BadRequestException('Seul le créateur peut ajouter des lignes à ce budget');
    }
    if (budget.statut === StatutBudget.VALIDE || budget.statut === StatutBudget.ARCHIVE) {
      throw new BadRequestException('Ce budget a été validé et ne peut plus être modifié');
    }

    // Calculer le montant de l'activité
    const montantActivite = new Decimal(dto.quantite)
      .mul(new Decimal(dto.frequence))
      .mul(new Decimal(dto.coutUnitaire));

    // Trouver la ligne NBE si elle existe
    let nbeLineId: string | null = null;
    if (dto.ligneNbe) {
      const nbeLine = await this.prisma.nbeLine.findFirst({
        where: { ligne: dto.ligneNbe.trim() },
      });
      if (nbeLine) {
        nbeLineId = nbeLine.id;
      }
    }

    // Créer la ligne budgétaire
    const ligne = await this.prisma.ligneBudgetaire.create({
      data: {
        budgetId,
        activiteCle: dto.activiteCle.trim(),
        typeMoyens: dto.typeMoyens.trim(),
        quantite: new Decimal(dto.quantite),
        frequence: new Decimal(dto.frequence),
        coutUnitaire: new Decimal(dto.coutUnitaire),
        montantActivite,
        montantPrevu: montantActivite,
        ligneNbe: dto.ligneNbe?.trim() || null,
        libelleNbe: dto.libelleNbe?.trim() || null,
        sourceFinancement: dto.sourceFinancement as SourceFinancement,
        nbeLineId,
      },
      include: {
        nbeLine: {
          select: {
            id: true,
            ligne: true,
            libelle: true,
            objetDepense: true,
            categorie: true,
            sousCategorie: true,
          },
        },
      },
    });

    // Mettre à jour le montant total du budget
    await this.updateBudgetTotal(budgetId);

    // Sauvegarder le template d'activité
    await this.saveActivityTemplates(budget.centreId, [dto]);

    return ligne;
  }

  async updateLigneBudgetaire(
    budgetId: string,
    ligneId: string,
    userId: string,
    dto: UpdateLigneBudgetaireDto,
  ) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    const budget = await this.findOne(budgetId);
    if (budget.creePar !== userId) {
      throw new BadRequestException('Seul le créateur peut modifier les lignes de ce budget');
    }
    if (budget.statut === StatutBudget.VALIDE || budget.statut === StatutBudget.ARCHIVE) {
      throw new BadRequestException('Ce budget a été validé et ne peut plus être modifié');
    }

    // Vérifier que la ligne existe et appartient au budget
    const ligne = await this.prisma.ligneBudgetaire.findFirst({
      where: {
        id: ligneId,
        budgetId,
      },
    });

    if (!ligne) {
      throw new NotFoundException('Ligne budgétaire introuvable');
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (dto.activiteCle !== undefined) {
      updateData.activiteCle = dto.activiteCle.trim();
    }
    if (dto.typeMoyens !== undefined) {
      updateData.typeMoyens = dto.typeMoyens.trim();
    }
    if (dto.quantite !== undefined) {
      updateData.quantite = new Decimal(dto.quantite);
    }
    if (dto.frequence !== undefined) {
      updateData.frequence = new Decimal(dto.frequence);
    }
    if (dto.coutUnitaire !== undefined) {
      updateData.coutUnitaire = new Decimal(dto.coutUnitaire);
    }
    if (dto.ligneNbe !== undefined) {
      updateData.ligneNbe = dto.ligneNbe?.trim() || null;
    }
    if (dto.libelleNbe !== undefined) {
      updateData.libelleNbe = dto.libelleNbe?.trim() || null;
    }
    if (dto.sourceFinancement !== undefined) {
      updateData.sourceFinancement = dto.sourceFinancement as SourceFinancement;
    }

    // Recalculer le montant si quantité, fréquence ou coût unitaire modifiés
    const quantite = dto.quantite !== undefined ? new Decimal(dto.quantite) : ligne.quantite;
    const frequence = dto.frequence !== undefined ? new Decimal(dto.frequence) : ligne.frequence;
    const coutUnitaire = dto.coutUnitaire !== undefined ? new Decimal(dto.coutUnitaire) : ligne.coutUnitaire;

    const montantActivite = quantite.mul(frequence).mul(coutUnitaire);
    updateData.montantActivite = montantActivite;
    updateData.montantPrevu = montantActivite;

    // Mettre à jour la référence NBE si nécessaire
    if (dto.ligneNbe !== undefined) {
      if (dto.ligneNbe) {
        const nbeLine = await this.prisma.nbeLine.findFirst({
          where: { ligne: dto.ligneNbe.trim() },
        });
        updateData.nbeLineId = nbeLine?.id || null;
      } else {
        updateData.nbeLineId = null;
      }
    }

    // Mettre à jour la ligne
    const updated = await this.prisma.ligneBudgetaire.update({
      where: { id: ligneId },
      data: updateData,
      include: {
        nbeLine: {
          select: {
            id: true,
            ligne: true,
            libelle: true,
            objetDepense: true,
            categorie: true,
            sousCategorie: true,
          },
        },
      },
    });

    // Mettre à jour le montant total du budget
    await this.updateBudgetTotal(budgetId);

    return updated;
  }

  async deleteLigneBudgetaire(budgetId: string, ligneId: string, userId: string) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    const budget = await this.findOne(budgetId);
    if (budget.creePar !== userId) {
      throw new BadRequestException('Seul le créateur peut supprimer les lignes de ce budget');
    }
    if (budget.statut === StatutBudget.VALIDE || budget.statut === StatutBudget.ARCHIVE) {
      throw new BadRequestException('Ce budget a été validé et ne peut plus être modifié');
    }

    // Vérifier que la ligne existe et appartient au budget
    const ligne = await this.prisma.ligneBudgetaire.findFirst({
      where: {
        id: ligneId,
        budgetId,
      },
    });

    if (!ligne) {
      throw new NotFoundException('Ligne budgétaire introuvable');
    }

    // Supprimer la ligne
    await this.prisma.ligneBudgetaire.delete({
      where: { id: ligneId },
    });

    // Mettre à jour le montant total du budget
    await this.updateBudgetTotal(budgetId);

    return { message: 'Ligne budgétaire supprimée avec succès' };
  }

  async getLigneBudgetaire(budgetId: string, ligneId: string) {
    const ligne = await this.prisma.ligneBudgetaire.findFirst({
      where: {
        id: ligneId,
        budgetId,
      },
      include: {
        nbeLine: {
          select: {
            id: true,
            ligne: true,
            libelle: true,
            objetDepense: true,
            categorie: true,
            sousCategorie: true,
          },
        },
      },
    });

    if (!ligne) {
      throw new NotFoundException('Ligne budgétaire introuvable');
    }

    return ligne;
  }

  private async updateBudgetTotal(budgetId: string) {
    // Récupérer toutes les lignes budgétaires du budget
    const lignes = await this.prisma.ligneBudgetaire.findMany({
      where: { budgetId },
    });

    // Calculer le total des dépenses
    const totalDepenses = lignes.reduce((sum, ligne) => {
      return sum + Number(ligne.montantActivite);
    }, 0);

    // Mettre à jour le montant total du budget
    await this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        montantTotal: new Decimal(totalDepenses),
      },
    });
  }
}


