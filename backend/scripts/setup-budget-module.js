const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Configuration du Module 2 - Gestion Budgétaire...\n');

try {
  // 1. Générer le client Prisma
  console.log('1️⃣ Génération du client Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Client Prisma généré\n');

  // 2. Appliquer les migrations
  console.log('2️⃣ Application des migrations...');
  execSync('npx prisma db push', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Migrations appliquées\n');

  // 3. Exécuter le seed des correspondances
  console.log('3️⃣ Seeding des correspondances d\'activités...');
  execSync('npx tsx prisma/seed-correspondances.ts', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Correspondances d\'activités créées\n');

  console.log('🎉 Module 2 - Gestion Budgétaire configuré avec succès !');
  console.log('\n📊 Tables créées :');
  console.log('   • budgets');
  console.log('   • lignes_budgetaires');
  console.log('   • correspondances_activites');
  console.log('\n🔗 Relations configurées :');
  console.log('   • Centre → Budgets');
  console.log('   • Budget → Lignes budgétaires');
  console.log('   • Ligne budgétaire → Correspondances d\'activités');

} catch (error) {
  console.error('❌ Erreur lors de la configuration du Module 2:', error.message);
  process.exit(1);
}





