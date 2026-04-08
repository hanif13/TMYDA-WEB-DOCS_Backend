import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const docs = await prisma.document.findMany({
        where: { docNo: { startsWith: 'ที่ สพยท. 016/2567' } }
    });
    for (const d of docs) {
        console.log(`ID: ${d.id}, docNo: ${d.docNo}, Name: ${d.name}, CreatedAt: ${d.createdAt}`);
    }
}
main().finally(() => prisma.$disconnect());
