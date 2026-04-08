import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const docs = await prisma.document.findMany({
        where: { docNo: { contains: '-ซ้ำ' } },
        orderBy: { docNo: 'asc' }
    });
    console.log(`Found ${docs.length} docs with "-ซ้ำ"`);
    for (const d of docs) {
        console.log(`ID: ${d.id}, docNo: ${d.docNo}, thaiYear: ${d.thaiYear}, name: ${d.name}`);
    }
}
main().finally(() => prisma.$disconnect());
