import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, SourceRecetteDto, LigneBudgetaireDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { StatutBudget, SourceFinancement, TypeSourceRecette } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, centreId: string, dto: CreateBudgetDto) {
    // Calculer les totaux
    const { totalRecettes, totalDepenses, recettesParSource, depensesParSource } =
      this.calculateTotals(dto.sourcesRecettes, dto.lignesBudgetaires);

    // Validation : vérifier que les dépenses ne dépassent pas les recettes par source
    this.validateBudget(recettesParSource, depensesParSource);

    // Générer le code
    const code = await this.generateCode(dto.annee, centreId);

    // Créer le budget avec les sources et lignes
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
        montantTotal: new Decimal(totalDepenses),
        sourcesRecettes: {
          create: dto.sourcesRecettes.map((s) => ({
            type: s.type as TypeSourceRecette,
            nature: s.nature,
            montant: new Decimal(s.montant),
          })),
        },
        lignesBudgetaires: {
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
        },
      },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
    });

    // Sauvegarder les templates d'activités pour auto-complétion
    await this.saveActivityTemplates(centreId, dto.lignesBudgetaires);

    return budget;
  }

  async findAll(centreId?: string, regisseurId?: string) {
    const where: any = {};
    if (centreId) {
      where.centreId = centreId;
    } else if (regisseurId) {
      where.centre = { regisseurId };
    }

    return this.prisma.budget.findMany({
      where,
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: true,
        centre: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        sourcesRecettes: true,
        lignesBudgetaires: {
          include: {
            nbeLine: true,
          },
        },
        centre: true,
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
}


