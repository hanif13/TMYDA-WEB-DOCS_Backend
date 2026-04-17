import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateNextDocNo } from '../src/lib/doc-utils';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Starting Women's Office Doc Number Alignment ---");
    
    // Target department
    const deptName = "สำนักกิจการสตรี สมาคมฯ";
    
    // Find documents for this department
    const docs = await prisma.document.findMany({
        where: {
            department: { name: deptName }
        },
        include: {
            department: true,
            category: true
        },
        orderBy: { createdAt: 'asc' } // Preserve original order
    });

    console.log(`Found ${docs.length} documents for "${deptName}".`);

    for (const doc of docs) {
        try {
            console.log(`Re-generating number for: "${doc.name}" (Current: ${doc.docNo})`);
            
            // Set temporary dummy number to avoid unique constraint collision if we were going down, 
            // but here we are going up, so it's probably fine. 
            // To be safe, we'll do it in a transaction.
            const newDocNo = await prisma.$transaction(async (tx) => {
                // Clear current number from this doc so it doesn't count against itself in the shared sequence
                await tx.document.update({
                    where: { id: doc.id },
                    data: { docNo: `TEMP-${doc.id}` }
                });
                
                return await generateNextDocNo(doc.department!.name, doc.category!.name, doc.thaiYear, tx);
            });

            await prisma.document.update({
                where: { id: doc.id },
                data: { docNo: newDocNo }
            });

            console.log(`Updated to: ${newDocNo}`);
        } catch (error: any) {
            console.error(`Error processing doc ${doc.id}:`, error.message);
        }
    }

    console.log("--- Alignment Completed ---");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
