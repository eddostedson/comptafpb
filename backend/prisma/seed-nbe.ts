import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, 'data', 'nbe.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const lines = JSON.parse(raw);

  console.log('🧹 Clearing existing NBE lines...');
  await prisma.nbeLine.deleteMany({});

  if (!Array.isArray(lines) || lines.length === 0) {
    console.log('⚠️ No NBE lines found in JSON. Aborting.');
    return;
  }

  console.log(`📥 Inserting ${lines.length} NBE lines...`);
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const res = await prisma.nbeLine.createMany({ data: chunk });
    inserted += res.count;
  }

  console.log(`✅ Done. Inserted ${inserted} NBE lines.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


