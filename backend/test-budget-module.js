const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBudgetModule() {
  console.log('🧪 Test du Module 2 - Gestion Budgétaire\n');

  try {
    // 1. Vérifier les budgets
    console.log('1️⃣ Vérification des budgets...');
    const budgets = await prisma.budget.findMany({
      include: {
        centre: {
          select: { nom: true, code: true }
        },
        lignesBudgetaires: {
          include: {
            correspondances: true
          }
        }
      }
    });

    console.log(`✅ ${budgets.length} budget(s) trouvé(s)`);
    
    for (const budget of budgets) {
      console.log(`   📊 ${budget.code} - ${budget.nom}`);
      console.log(`   🏥 Centre: ${budget.centre.nom} (${budget.centre.code})`);
      console.log(`   💰 Montant total: ${budget.montantTotal} XAF`);
      console.log(`   📋 ${budget.lignesBudgetaires.length} ligne(s) budgétaire(s)`);
      
      for (const ligne of budget.lignesBudgetaires) {
        console.log(`      • ${ligne.code} - ${ligne.libelle} (${ligne.montantPrevu} XAF)`);
        console.log(`        🔗 ${ligne.correspondances.length} correspondance(s) d'activité(s)`);
        
        for (const corr of ligne.correspondances) {
          console.log(`          - ${corr.codeActivite}: ${corr.nomActivite} (${corr.pourcentage}%)`);
        }
      }
      console.log('');
    }

    // 2. Vérifier les correspondances par catégorie
    console.log('2️⃣ Vérification des correspondances par catégorie...');
    const correspondancesByCategory = await prisma.correspondanceActivite.groupBy({
      by: ['categorie'],
      _count: { id: true }
    });

    for (const cat of correspondancesByCategory) {
      console.log(`   📁 ${cat.categorie}: ${cat._count.id} activité(s)`);
    }

    // 3. Vérifier les montants totaux
    console.log('\n3️⃣ Vérification des montants totaux...');
    const totalLignes = await prisma.ligneBudgetaire.aggregate({
      _sum: { montantPrevu: true }
    });
    
    const totalCorrespondances = await prisma.correspondanceActivite.aggregate({
      _sum: { montantMax: true }
    });

    console.log(`   💰 Montant total des lignes budgétaires: ${totalLignes._sum.montantPrevu || 0} XAF`);
    console.log(`   💰 Montant total des correspondances: ${totalCorrespondances._sum.montantMax || 0} XAF`);

    // 4. Test de requête complexe
    console.log('\n4️⃣ Test de requête complexe...');
    const activitesParLigne = await prisma.ligneBudgetaire.findMany({
      where: {
        budget: {
          code: 'BUD-2024-001'
        }
      },
      select: {
        code: true,
        libelle: true,
        montantPrevu: true,
        correspondances: {
          select: {
            codeActivite: true,
            nomActivite: true,
            pourcentage: true,
            montantMax: true,
            priorite: true
          }
        }
      }
    });

    console.log('   📋 Détail des activités par ligne budgétaire:');
    for (const ligne of activitesParLigne) {
      console.log(`   \n   ${ligne.code} - ${ligne.libelle} (${ligne.montantPrevu} XAF)`);
      for (const corr of ligne.correspondances) {
        const prioriteText = corr.priorite === 1 ? '🔴 Haute' : corr.priorite === 2 ? '🟡 Moyenne' : '🟢 Faible';
        console.log(`      ${corr.codeActivite}: ${corr.nomActivite} (${corr.pourcentage}% - ${corr.montantMax} XAF) ${prioriteText}`);
      }
    }

    console.log('\n🎉 Module 2 - Gestion Budgétaire testé avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   • ${budgets.length} budget(s)`);
    console.log(`   • ${budgets[0]?.lignesBudgetaires.length || 0} ligne(s) budgétaire(s)`);
    console.log(`   • ${budgets[0]?.lignesBudgetaires.reduce((acc, l) => acc + l.correspondances.length, 0) || 0} correspondance(s) d'activité(s)`);
    console.log(`   • ${correspondancesByCategory.length} catégorie(s) d'activités`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  }
}

// Exécuter le test
testBudgetModule()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









