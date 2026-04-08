import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Restoring document numbers by removing '-ซ้ำ' suffixes...");
    
    const docs = await prisma.document.findMany({
        where: {
            docNo: {
                contains: '-ซ้ำ'
            }
        }
    });
    
    console.log(`Found ${docs.length} documents to restore.`);
    
    for (const doc of docs) {
        // Remove '-ซ้ำ' and anything after it (e.g., -ซ้ำ1)
        const restoredNo = doc.docNo.split('-ซ้ำ')[0];
        console.log(`Restoring: ${doc.docNo} -> ${restoredNo}`);
        
        await prisma.document.update({
            where: { id: doc.id },
            data: { docNo: restoredNo }
        });
    }
    
    console.log("Restoration complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
