import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateNextDocNo } from '../src/lib/doc-utils';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Starting Placeholder Doc Fix ---");
    
    // Find all documents with the placeholder string
    const docsToFix = await prisma.document.findMany({
        where: {
            OR: [
                { docNo: "(ออกเลขอัตโนมัติ)" },
                { docNo: { contains: "ออกเลข" } },
                { docNo: "" }
            ]
        },
        include: {
            department: true,
            category: true
        }
    });

    console.log(`Found ${docsToFix.length} documents to fix.`);

    for (const doc of docsToFix) {
        if (!doc.department || !doc.category) {
            console.warn(`Skipping doc ${doc.id} (${doc.name}) because department or category is missing.`);
            continue;
        }

        try {
            console.log(`Fixing doc ${doc.id}: "${doc.name}"`);
            
            // Generate a fresh number inside a transaction
            const newDocNo = await prisma.$transaction(async (tx) => {
                return await generateNextDocNo(doc.department!.name, doc.category!.name, doc.thaiYear, tx);
            });

            await prisma.document.update({
                where: { id: doc.id },
                data: { docNo: newDocNo }
            });

            console.log(`Successfully updated doc ${doc.id} to ${newDocNo}`);
        } catch (error: any) {
            console.error(`Failed to fix doc ${doc.id}:`, error.message);
        }
    }

    console.log("--- Placeholder Doc Fix Completed ---");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
