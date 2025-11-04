import * as XLSX from 'xlsx';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const filePath = path.join(__dirname, '../../docs/villesci.xlsx');

interface VilleData {
  REGION?: string;
  'CHEF-LIEU'?: string;
  DEPARTEMENT?: string;
  'SOUS-PREFECTURE'?: string;
  COMMUNE?: string;
}

async function importVilles() {
  console.log('📊 Import des données administratives depuis villesci.xlsx...\n');

  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Première feuille
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON
    const data = XLSX.utils.sheet_to_json<VilleData>(worksheet, {
      defval: '',
      raw: false,
    });

    console.log(`📄 ${data.length} lignes détectées dans le fichier\n`);

    // Nettoyer et valider les données
    const validData: Array<{
      region?: string;
      chefLieu?: string;
      departement?: string;
      sousPrefecture?: string;
      commune?: string;
    }> = [];

    for (const row of data) {
      const region = row.REGION?.toString().trim();
      const chefLieu = row['CHEF-LIEU']?.toString().trim();
      const departement = row.DEPARTEMENT?.toString().trim();
      const sousPrefecture = row['SOUS-PREFECTURE']?.toString().trim();
      const commune = row.COMMUNE?.toString().trim();

      // Ignorer les lignes où REGION est un en-tête ou vide
      if (!region || 
          region.toUpperCase() === 'REGION' || 
          region.toUpperCase() === 'SOUS-PREFECTURE' ||
          region.toUpperCase() === 'COMMUNE') {
        continue;
      }

      // Ignorer les lignes vides
      if (!region && !chefLieu && !departement && !sousPrefecture && !commune) {
        continue;
      }

      validData.push({
        region: region || undefined,
        chefLieu: chefLieu || undefined,
        departement: departement || undefined,
        sousPrefecture: sousPrefecture || undefined,
        commune: commune || undefined,
      });
    }

    console.log(`✅ ${validData.length} lignes valides après nettoyage\n`);

    // Supprimer les anciennes données (optionnel)
    console.log('🗑️  Nettoyage des anciennes données...');
    await prisma.divisionAdministrative.deleteMany({});
    console.log('✅ Anciennes données supprimées\n');

    // Insérer les nouvelles données par batch
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize);
      
      await prisma.divisionAdministrative.createMany({
        data: batch.map((item, index) => ({
          code: `${item.region || ''}-${item.departement || ''}-${item.commune || ''}-${i + index}`.replace(/--+/g, '-').replace(/^-|-$/g, '') || undefined,
          region: item.region,
          chefLieu: item.chefLieu,
          departement: item.departement,
          sousPrefecture: item.sousPrefecture,
          commune: item.commune,
          actif: true,
        })),
        skipDuplicates: true,
      });

      inserted += batch.length;
      console.log(`📦 ${inserted}/${validData.length} lignes insérées...`);
    }

    console.log(`\n✅ Import terminé avec succès !`);
    console.log(`   - ${inserted} divisions administratives importées`);

    // Afficher quelques statistiques
    const stats = await prisma.divisionAdministrative.groupBy({
      by: ['region'],
      _count: true,
    });

    console.log(`\n📊 Statistiques:`);
    console.log(`   - ${stats.length} régions uniques`);
    
    const departementsCount = await prisma.divisionAdministrative.groupBy({
      by: ['departement'],
      _count: true,
      where: { departement: { not: null } },
    });
    console.log(`   - ${departementsCount.length} départements uniques`);
    
    const communesCount = await prisma.divisionAdministrative.groupBy({
      by: ['commune'],
      _count: true,
      where: { commune: { not: null } },
    });
    console.log(`   - ${communesCount.length} communes uniques`);

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    if (error.code === 'ENOENT') {
      console.error(`   Le fichier ${filePath} n'existe pas`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'import
importVilles()
  .then(() => {
    console.log('\n✨ Import terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });






