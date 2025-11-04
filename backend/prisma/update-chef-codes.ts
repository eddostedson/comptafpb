import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateChefCodes() {
  console.log('🔄 Mise à jour des codes pour les chefs de centres...');

  try {
    // Récupérer tous les chefs de centres sans code
    const chefs = await prisma.user.findMany({
      where: {
        role: 'CHEF_CENTRE',
        code: null,
      },
      include: {
        centre: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📋 ${chefs.length} chefs de centres à mettre à jour`);

    let counter = 1;

    for (const chef of chefs) {
      const codeChef = `CC-${String(counter).padStart(3, '0')}`;
      
      // Vérifier si le code existe déjà
      const existing = await prisma.user.findUnique({
        where: { code: codeChef },
      });

      if (existing) {
        console.log(`⚠️  Code ${codeChef} existe déjà, passage au suivant...`);
        counter++;
        continue;
      }

      await prisma.user.update({
        where: { id: chef.id },
        data: { code: codeChef },
      });

      console.log(`✅ ${chef.email} -> ${codeChef} ${chef.centre ? `(${chef.centre.code})` : ''}`);
      counter++;
    }

    console.log(`\n🎉 ${chefs.length} chefs de centres mis à jour avec succès !`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateChefCodes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });





