import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.document.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
        category: true,
        department: true
    }
  });
  console.log('Recent Documents:');
  console.dir(docs, { depth: null });

  const count = await prisma.document.count();
  console.log(`Total documents: ${count}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
