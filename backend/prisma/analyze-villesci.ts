import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.join(__dirname, '../../docs/villesci.xlsx');

console.log('📊 Analyse du fichier villesci.xlsx...\n');

try {
  // Lire le fichier Excel
  const workbook = XLSX.readFile(filePath);
  
  // Afficher les noms des feuilles
  console.log('📄 Feuilles disponibles:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  
  // Analyser chaque feuille
  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Feuille: ${sheetName}`);
    console.log('='.repeat(60));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (data.length === 0) {
      console.log('  ⚠️ Feuille vide');
      return;
    }
    
    // Première ligne = en-têtes
    const headers = data[0] as string[];
    console.log('\n📌 Colonnes détectées:');
    headers.forEach((header, index) => {
      if (header) {
        console.log(`  ${index + 1}. ${header}`);
      }
    });
    
    // Afficher quelques lignes d'exemple
    console.log('\n📝 Exemples de données (premières 5 lignes):');
    const sampleRows = data.slice(1, Math.min(6, data.length));
    sampleRows.forEach((row: any[], rowIndex) => {
      if (row.some(cell => cell)) {
        console.log(`\n  Ligne ${rowIndex + 2}:`);
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex]) {
            console.log(`    ${header}: ${row[colIndex]}`);
          }
        });
      }
    });
    
    // Statistiques
    console.log(`\n📊 Statistiques:`);
    console.log(`  - Nombre de lignes: ${data.length - 1} (sans l'en-tête)`);
    
    // Compter les valeurs uniques par colonne
    const uniqueValues: Record<string, Set<string>> = {};
    headers.forEach((header, index) => {
      if (header) {
        uniqueValues[header] = new Set();
        data.slice(1).forEach((row: any[]) => {
          const value = row[index];
          if (value && typeof value === 'string' && value.trim()) {
            uniqueValues[header].add(value.trim());
          }
        });
        if (uniqueValues[header].size > 0) {
          console.log(`  - ${header}: ${uniqueValues[header].size} valeurs uniques`);
          if (uniqueValues[header].size <= 20) {
            console.log(`    Valeurs: ${Array.from(uniqueValues[header]).slice(0, 10).join(', ')}${uniqueValues[header].size > 10 ? '...' : ''}`);
          }
        }
      }
    });
  });
  
  // Identifier la structure pour les données administratives
  console.log(`\n${'='.repeat(60)}`);
  console.log('💡 Structure suggérée pour la base de données:');
  console.log('='.repeat(60));
  
  // Analyser les colonnes pour suggérer le modèle
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  const firstHeaders = firstSheetData[0] as string[];
  
  console.log('\nModèle Prisma suggéré:');
  console.log(`
model DivisionAdministrative {
  id            String   @id @default(uuid())
  code          String?  @unique
  region        String?
  departement   String?
  chefLieu      String?
  sousPrefecture String?
  commune       String?
  actif         Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([region])
  @@index([departement])
  @@index([commune])
  @@map("divisions_administratives")
}
  `);
  
} catch (error: any) {
  console.error('❌ Erreur lors de l\'analyse:', error.message);
  if (error.code === 'ENOENT') {
    console.error(`   Le fichier ${filePath} n'existe pas`);
  }
  process.exit(1);
}


