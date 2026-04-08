import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for duplicate docNo...");
    
    // 1. Get all documents, ordered by creation date ascending
    const docs = await prisma.document.findMany({
        orderBy: { createdAt: 'asc' }
    });
    
    const seenMap = new Map<string, string[]>(); // key: `${docNo}_${thaiYear}`, value: array of document IDs
    
    for (const doc of docs) {
        const key = `${doc.docNo}_${doc.thaiYear}`;
        if (!seenMap.has(key)) {
            seenMap.set(key, []);
        }
        seenMap.get(key)!.push(doc.id);
    }
    
    let fixCount = 0;
    
    // 2. Fix duplicates by appending '-ซ้ำ1', '-ซ้ำ2' etc.
    for (const [key, ids] of seenMap.entries()) {
        if (ids.length > 1) {
            console.log(`Found ${ids.length} docs for key ${key}`);
            // Keep the first one as original, rename the rest
            for (let i = 1; i < ids.length; i++) {
                const id = ids[i];
                const doc = docs.find(d => d.id === id)!;
                const newDocNo = `${doc.docNo}-ซ้ำ${i}`;
                console.log(`  Updating ID: ${id} -> ${newDocNo}`);
                
                await prisma.document.update({
                    where: { id },
                    data: { docNo: newDocNo }
                });
                fixCount++;
            }
        }
    }
    
    console.log(`Finished. Fixed ${fixCount} duplicate documents.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
