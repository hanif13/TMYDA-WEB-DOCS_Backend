import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const docs = await prisma.document.findMany({
        where: { docNo: { startsWith: 'ที่ สพยท. 016/2567' } },
        include: { category: true, department: true }
    });
    for (const d of docs) {
        console.log(`docNo: ${d.docNo}, Cat: ${d.category.name}, Dept: ${d.department?.name}`);
    }
}
main().finally(() => prisma.$disconnect());
