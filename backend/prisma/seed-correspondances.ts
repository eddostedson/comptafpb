import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Données d'exemple pour les correspondances d'activités
// Basé sur le fichier "Outil 14 Tableau de correspondance des activités aux lignes budgetaires.xlsx"
const correspondancesActivites = [
  // CHAPITRE 1: PERSONNEL
  {
    codeActivite: 'ACT-001',
    nomActivite: 'Consultations médicales générales',
    description: 'Consultations de médecine générale pour patients externes',
    categorie: 'SOINS_MEDICAUX',
    sousCategorie: 'CONSULTATIONS',
    codeLigne: '01.01.01',
    libelleLigne: 'Salaires du personnel médical',
    chapitre: '01',
    section: '01',
    paragraphe: '01',
    article: '01',
    pourcentage: 25.0,
    priorite: 1
  },
  {
    codeActivite: 'ACT-002',
    nomActivite: 'Soins infirmiers',
    description: 'Soins infirmiers et suivi des patients',
    categorie: 'SOINS_MEDICAUX',
    sousCategorie: 'SOINS_INFIRMIERS',
    codeLigne: '01.01.02',
    libelleLigne: 'Salaires du personnel infirmier',
    chapitre: '01',
    section: '01',
    paragraphe: '01',
    article: '02',
    pourcentage: 30.0,
    priorite: 1
  },
  {
    codeActivite: 'ACT-003',
    nomActivite: 'Accouchements',
    description: 'Accouchements et soins obstétricaux',
    categorie: 'SOINS_MEDICAUX',
    sousCategorie: 'OBSTETRIQUE',
    codeLigne: '01.01.03',
    libelleLigne: 'Salaires du personnel obstétrical',
    chapitre: '01',
    section: '01',
    paragraphe: '01',
    article: '03',
    pourcentage: 20.0,
    priorite: 1
  },
  {
    codeActivite: 'ACT-004',
    nomActivite: 'Vaccinations',
    description: 'Campagnes de vaccination et immunisation',
    categorie: 'PREVENTION',
    sousCategorie: 'VACCINATION',
    codeLigne: '01.01.04',
    libelleLigne: 'Salaires du personnel de prévention',
    chapitre: '01',
    section: '01',
    paragraphe: '01',
    article: '04',
    pourcentage: 15.0,
    priorite: 2
  },
  {
    codeActivite: 'ACT-005',
    nomActivite: 'Chirurgie mineure',
    description: 'Interventions chirurgicales mineures',
    categorie: 'SOINS_MEDICAUX',
    sousCategorie: 'CHIRURGIE',
    codeLigne: '01.01.05',
    libelleLigne: 'Salaires du personnel chirurgical',
    chapitre: '01',
    section: '01',
    paragraphe: '01',
    article: '05',
    pourcentage: 10.0,
    priorite: 1
  },

  // CHAPITRE 2: FONCTIONNEMENT
  {
    codeActivite: 'ACT-006',
    nomActivite: 'Achat de médicaments',
    description: 'Acquisition de médicaments essentiels',
    categorie: 'FONCTIONNEMENT',
    sousCategorie: 'MEDICAMENTS',
    codeLigne: '02.01.01',
    libelleLigne: 'Achat de médicaments',
    chapitre: '02',
    section: '01',
    paragraphe: '01',
    article: '01',
    pourcentage: 40.0,
    priorite: 1
  },
  {
    codeActivite: 'ACT-007',
    nomActivite: 'Achat de matériel médical',
    description: 'Acquisition de matériel et équipements médicaux',
    categorie: 'FONCTIONNEMENT',
    sousCategorie: 'MATERIEL_MEDICAL',
    codeLigne: '02.01.02',
    libelleLigne: 'Achat de matériel médical',
    chapitre: '02',
    section: '01',
    paragraphe: '01',
    article: '02',
    pourcentage: 25.0,
    priorite: 1
  },
  {
    codeActivite: 'ACT-008',
    nomActivite: 'Maintenance des équipements',
    description: 'Maintenance et réparation des équipements',
    categorie: 'FONCTIONNEMENT',
    sousCategorie: 'MAINTENANCE',
    codeLigne: '02.01.03',
    libelleLigne: 'Maintenance des équipements',
    chapitre: '02',
    section: '01',
    paragraphe: '01',
    article: '03',
    pourcentage: 20.0,
    priorite: 2
  },
  {
    codeActivite: 'ACT-009',
    nomActivite: 'Formation du personnel',
    description: 'Formation continue du personnel médical et paramédical',
    categorie: 'FORMATION',
    sousCategorie: 'FORMATION_CONTINUE',
    codeLigne: '02.01.04',
    libelleLigne: 'Formation du personnel',
    chapitre: '02',
    section: '01',
    paragraphe: '01',
    article: '04',
    pourcentage: 15.0,
    priorite: 3
  },

  // CHAPITRE 3: INVESTISSEMENT
  {
    codeActivite: 'ACT-010',
    nomActivite: 'Construction de bâtiments',
    description: 'Construction et rénovation de bâtiments de santé',
    categorie: 'INVESTISSEMENT',
    sousCategorie: 'CONSTRUCTION',
    codeLigne: '03.01.01',
    libelleLigne: 'Construction de bâtiments',
    chapitre: '03',
    section: '01',
    paragraphe: '01',
    article: '01',
    pourcentage: 60.0,
    priorite: 1
  },
  {
    codeActivite: 'ACT-011',
    nomActivite: 'Achat d\'équipements lourds',
    description: 'Acquisition d\'équipements médicaux lourds',
    categorie: 'INVESTISSEMENT',
    sousCategorie: 'EQUIPEMENTS_LOURDS',
    codeLigne: '03.01.02',
    libelleLigne: 'Achat d\'équipements lourds',
    chapitre: '03',
    section: '01',
    paragraphe: '01',
    article: '02',
    pourcentage: 40.0,
    priorite: 1
  },

  // CHAPITRE 4: RESSOURCES HUMAINES
  {
    codeActivite: 'ACT-012',
    nomActivite: 'Recrutement de personnel',
    description: 'Recrutement et formation du nouveau personnel',
    categorie: 'RESSOURCES_HUMAINES',
    sousCategorie: 'RECRUTEMENT',
    codeLigne: '04.01.01',
    libelleLigne: 'Recrutement de personnel',
    chapitre: '04',
    section: '01',
    paragraphe: '01',
    article: '01',
    pourcentage: 30.0,
    priorite: 2
  },
  {
    codeActivite: 'ACT-013',
    nomActivite: 'Formation spécialisée',
    description: 'Formation spécialisée du personnel médical',
    categorie: 'RESSOURCES_HUMAINES',
    sousCategorie: 'FORMATION_SPECIALISEE',
    codeLigne: '04.01.02',
    libelleLigne: 'Formation spécialisée',
    chapitre: '04',
    section: '01',
    paragraphe: '01',
    article: '02',
    pourcentage: 20.0,
    priorite: 3
  }
];

async function seedCorrespondances() {
  console.log('🌱 Seeding correspondances d\'activités...');

  try {
    // Créer un budget d'exemple pour un centre
    const centre = await prisma.centre.findFirst();
    if (!centre) {
      console.log('❌ Aucun centre trouvé. Veuillez d\'abord exécuter le seed principal.');
      return;
    }

    // Créer un budget d'exemple
    const budget = await prisma.budget.create({
      data: {
        code: 'BUD-2024-001',
        nom: `Budget 2024 - ${centre.nom}`,
        description: 'Budget prévisionnel 2024 pour les correspondances d\'activités',
        annee: 2024,
        type: 'FONCTIONNEMENT',
        statut: 'BROUILLON',
        montantTotal: 0,
        centreId: centre.id,
        creePar: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || 'unknown'
      }
    });

    console.log(`✅ Budget créé: ${budget.code}`);

    // Créer les lignes budgétaires
    const lignesBudgetaires = [];
    for (const correspondance of correspondancesActivites) {
      const ligneBudgetaire = await prisma.ligneBudgetaire.create({
        data: {
          code: correspondance.codeLigne,
          libelle: correspondance.libelleLigne,
          description: `Ligne budgétaire pour ${correspondance.nomActivite}`,
          montantPrevu: 100000, // Montant d'exemple
          chapitre: correspondance.chapitre,
          section: correspondance.section,
          paragraphe: correspondance.paragraphe,
          article: correspondance.article,
          budgetId: budget.id
        }
      });
      lignesBudgetaires.push(ligneBudgetaire);
    }

    console.log(`✅ ${lignesBudgetaires.length} lignes budgétaires créées`);

    // Créer les correspondances d'activités
    for (let i = 0; i < correspondancesActivites.length; i++) {
      const correspondance = correspondancesActivites[i];
      const ligneBudgetaire = lignesBudgetaires[i];

      await prisma.correspondanceActivite.create({
        data: {
          codeActivite: correspondance.codeActivite,
          nomActivite: correspondance.nomActivite,
          description: correspondance.description,
          categorie: correspondance.categorie,
          sousCategorie: correspondance.sousCategorie,
          ligneBudgetaireId: ligneBudgetaire.id,
          pourcentage: correspondance.pourcentage,
          montantMax: 50000, // Montant maximum d'exemple
          priorite: correspondance.priorite,
          valide: true,
          validePar: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || 'unknown',
          valideLe: new Date()
        }
      });
    }

    console.log(`✅ ${correspondancesActivites.length} correspondances d'activités créées`);

    // Mettre à jour le montant total du budget
    const totalLignes = await prisma.ligneBudgetaire.aggregate({
      where: { budgetId: budget.id },
      _sum: { montantPrevu: true }
    });

    await prisma.budget.update({
      where: { id: budget.id },
      data: { 
        montantTotal: totalLignes._sum.montantPrevu || 0,
        montantValide: totalLignes._sum.montantPrevu || 0,
        montantRestant: totalLignes._sum.montantPrevu || 0
      }
    });

    console.log(`✅ Budget mis à jour avec un montant total de ${totalLignes._sum.montantPrevu || 0} XAF`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding des correspondances:', error);
    throw error;
  }
}

// Exécuter le seeding
seedCorrespondances()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









