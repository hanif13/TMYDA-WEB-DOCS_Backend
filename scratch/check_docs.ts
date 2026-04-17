import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const docs = await prisma.document.findMany({
        take: 20,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(docs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
