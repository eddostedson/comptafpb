import { PrismaClient, RoleType, StatutUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Régions du Congo
const REGIONS = [
  'Brazzaville',
  'Pointe-Noire',
  'Kouilou',
  'Niari',
  'Bouenza',
  'Lékoumou',
  'Pool',
  'Plateaux',
  'Cuvette',
  'Cuvette-Ouest',
  'Sangha',
  'Likouala',
];

// Types et niveaux de centres
const TYPES_CENTRE = ['Public', 'Privé', 'Confessionnel'];
const NIVEAUX_CENTRE = ['CS', 'CMA', 'Hôpital'];

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer les données existantes
  console.log('🧹 Nettoyage des données existantes...');
  await prisma.auditAction.deleteMany();
  await prisma.user.deleteMany();
  await prisma.centre.deleteMany();
  await prisma.regisseur.deleteMany();

  // 1. Créer les régisseurs (150)
  console.log('👥 Création des régisseurs...');
  const regisseurs = [];
  for (let i = 1; i <= 150; i++) {
    const region = REGIONS[i % REGIONS.length];
    const regisseur = await prisma.regisseur.create({
      data: {
        code: `REG-${String(i).padStart(3, '0')}`,
        nom: `Régisseur-${i}`,
        prenom: `Prénom-${i}`,
        email: `regisseur${i}@cgcs.cg`,
        telephone: `+242 06 ${String(i).padStart(3, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
        region,
        actif: true,
      },
    });
    regisseurs.push(regisseur);
  }
  console.log(`✅ ${regisseurs.length} régisseurs créés`);

  // 2. Créer les centres (2500)
  console.log('🏥 Création des centres de santé...');
  const centres = [];
  const centresPerRegisseur = 25; // Environ 20-25 centres par régisseur

  for (let i = 1; i <= 2500; i++) {
    const regisseurIndex = Math.floor((i - 1) / centresPerRegisseur) % regisseurs.length;
    const regisseur = regisseurs[regisseurIndex];
    const region = regisseur.region;
    const type = TYPES_CENTRE[i % TYPES_CENTRE.length];
    const niveau = NIVEAUX_CENTRE[i % NIVEAUX_CENTRE.length];

    const centre = await prisma.centre.create({
      data: {
        code: `CS-${String(i).padStart(4, '0')}`,
        nom: `Centre de Santé ${niveau} ${i}`,
        adresse: `${i} Avenue de la Santé`,
        commune: `Commune ${(i % 10) + 1}`,
        province: region,
        region,
        telephone: `+242 05 ${String(i).padStart(3, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
        email: `centre${i}@cgcs.cg`,
        type,
        niveau,
        actif: true,
        regisseurId: regisseur.id,
      },
    });
    centres.push(centre);

    // Afficher la progression tous les 250 centres
    if (i % 250 === 0) {
      console.log(`   ⏳ ${i}/2500 centres créés...`);
    }
  }
  console.log(`✅ ${centres.length} centres créés`);

  // 3. Créer l'administrateur central
  console.log('👤 Création de l\'administrateur central...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cgcs.cg',
      password: adminPassword,
      nom: 'Admin',
      prenom: 'Central',
      telephone: '+242 06 000 00 00',
      role: RoleType.ADMIN,
      statut: StatutUser.ACTIF,
    },
  });
  console.log(`✅ Admin créé: ${admin.email} / admin123`);

  // 4. Créer des comptes régisseurs (un compte par régisseur)
  console.log('👥 Création des comptes régisseurs...');
  const regisseurPassword = await bcrypt.hash('regisseur123', 10);
  const regisseurUsers = [];
  
  for (let i = 0; i < 10; i++) { // Créer 10 comptes régisseurs pour les tests
    const regisseur = regisseurs[i];
    const user = await prisma.user.create({
      data: {
        email: regisseur.email,
        password: regisseurPassword,
        nom: regisseur.nom,
        prenom: regisseur.prenom,
        telephone: regisseur.telephone,
        role: RoleType.REGISSEUR,
        statut: StatutUser.ACTIF,
        regisseurId: regisseur.id,
      },
    });
    regisseurUsers.push(user);
  }
  console.log(`✅ ${regisseurUsers.length} comptes régisseurs créés (password: regisseur123)`);

  // 5. Créer des comptes chefs de centre (20 pour les tests)
  console.log('👤 Création des comptes chefs de centre...');
  const chefPassword = await bcrypt.hash('chef123', 10);
  const chefUsers = [];
  
  for (let i = 0; i < 20; i++) {
    const centre = centres[i];
    const codeChef = `CC-${String(i + 1).padStart(3, '0')}`; // Format: CC-001, CC-002, etc.
    const user = await prisma.user.create({
      data: {
        email: `chef${i + 1}@cgcs.cg`,
        password: chefPassword,
        nom: `Chef`,
        prenom: `Centre-${i + 1}`,
        telephone: centre.telephone,
        code: codeChef,
        role: RoleType.CHEF_CENTRE,
        statut: StatutUser.ACTIF,
        centreId: centre.id,
        regisseurId: centre.regisseurId,
      },
    });
    chefUsers.push(user);
  }
  console.log(`✅ ${chefUsers.length} comptes chefs de centre créés (password: chef123)`);

  // 6. Logger les actions de création
  console.log('📝 Logging des actions de création...');
  await prisma.auditAction.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entity: 'Database',
      entityId: 'seed',
      description: 'Initialisation de la base de données avec les données de test',
    },
  });

  console.log('\n🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé :');
  console.log(`   - ${regisseurs.length} régisseurs`);
  console.log(`   - ${centres.length} centres de santé`);
  console.log(`   - 1 administrateur`);
  console.log(`   - ${regisseurUsers.length} comptes régisseurs`);
  console.log(`   - ${chefUsers.length} comptes chefs de centre`);
  console.log('\n🔐 Comptes de test :');
  console.log('   📧 Admin: admin@cgcs.cg / admin123');
  console.log('   📧 Régisseur: regisseur1@cgcs.cg / regisseur123');
  console.log('   📧 Chef: chef1@cgcs.cg / chef123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

