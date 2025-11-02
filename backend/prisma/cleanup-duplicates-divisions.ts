import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🔍 Recherche des doublons dans les divisions administratives...\n');

  try {
    // Récupérer toutes les divisions
    const allDivisions = await prisma.divisionAdministrative.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Total de divisions: ${allDivisions.length}`);

    // Identifier les doublons basés sur la combinaison de région, département, chef-lieu, sous-préfecture, commune
    const seen = new Map<string, string[]>();
    const duplicates: string[] = [];
    const toKeep: string[] = [];

    for (const division of allDivisions) {
      // Créer une clé unique basée sur les valeurs
      const key = JSON.stringify({
        region: (division.region || '').trim().toLowerCase(),
        departement: (division.departement || '').trim().toLowerCase(),
        chefLieu: (division.chefLieu || '').trim().toLowerCase(),
        sousPrefecture: (division.sousPrefecture || '').trim().toLowerCase(),
        commune: (division.commune || '').trim().toLowerCase(),
      });

      if (!seen.has(key)) {
        // Premier exemplaire - on le garde
        seen.set(key, [division.id]);
        toKeep.push(division.id);
      } else {
        // Doublon - on l'ajoute à la liste des doublons
        const existingIds = seen.get(key)!;
        existingIds.push(division.id);
        seen.set(key, existingIds);
        duplicates.push(division.id);
      }
    }

    console.log(`\n📊 Analyse des doublons:`);
    console.log(`   - Divisions uniques: ${toKeep.length}`);
    console.log(`   - Doublons à supprimer: ${duplicates.length}`);

    // Afficher quelques exemples de doublons
    const duplicateGroups = Array.from(seen.values()).filter(ids => ids.length > 1);
    if (duplicateGroups.length > 0) {
      console.log(`\n📋 Exemples de groupes de doublons:`);
      duplicateGroups.slice(0, 5).forEach((ids, index) => {
        console.log(`   Groupe ${index + 1}: ${ids.length} doublons`);
        ids.slice(0, 3).forEach(id => {
          const div = allDivisions.find(d => d.id === id);
          if (div) {
            console.log(`     - ${div.region || ''} / ${div.departement || ''} / ${div.commune || ''}`);
          }
        });
      });
    }

    if (duplicates.length === 0) {
      console.log('\n✅ Aucun doublon trouvé !');
      return;
    }

    // Supprimer les doublons
    console.log(`\n🗑️  Suppression de ${duplicates.length} doublons...`);

    // Supprimer par batch pour éviter les timeouts
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < duplicates.length; i += batchSize) {
      const batch = duplicates.slice(i, i + batchSize);
      
      const result = await prisma.divisionAdministrative.deleteMany({
        where: {
          id: { in: batch },
        },
      });

      deleted += result.count;
      console.log(`   ${deleted}/${duplicates.length} doublons supprimés...`);
    }

    console.log(`\n✅ ${deleted} doublons supprimés avec succès !`);

    // Vérification finale
    const remaining = await prisma.divisionAdministrative.count();
    console.log(`\n📊 État final:`);
    console.log(`   - Divisions restantes: ${remaining}`);
    console.log(`   - Doublons supprimés: ${deleted}`);

    // Statistiques finales
    const finalStats = await prisma.divisionAdministrative.groupBy({
      by: ['region'],
      _count: true,
      where: { region: { not: null } },
    });

    const departementsCount = await prisma.divisionAdministrative.groupBy({
      by: ['departement'],
      _count: true,
      where: { departement: { not: null } },
    });

    const communesCount = await prisma.divisionAdministrative.groupBy({
      by: ['commune'],
      _count: true,
      where: { commune: { not: null } },
    });

    console.log(`\n📊 Statistiques après nettoyage:`);
    console.log(`   - ${finalStats.length} régions uniques`);
    console.log(`   - ${departementsCount.length} départements uniques`);
    console.log(`   - ${communesCount.length} communes uniques`);

  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
cleanupDuplicates()
  .then(() => {
    console.log('\n✨ Nettoyage terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });


