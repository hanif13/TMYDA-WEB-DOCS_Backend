import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateNextDocNo } from '../src/lib/doc-utils';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Starting Global 2569 Document Numbering Realignment ---");
    
    // Find all documents for the year 2569
    const docs = await prisma.document.findMany({
        where: {
            thaiYear: 2569
        },
        include: {
            department: true,
            category: true
        },
        orderBy: { createdAt: 'asc' } // Re-process in order of creation
    });

    console.log(`Found ${docs.length} documents to realign for 2569.`);

    // 1. Temporarily clear all document numbers to avoid unique constraint collisions
    // and to ensure they don't count against themselves in the count logic.
    console.log("Clearing existing numbers momentarily...");
    for (const doc of docs) {
        await prisma.document.update({
            where: { id: doc.id },
            data: { docNo: `REALIGN-TEMP-${doc.id}` }
        });
    }

    // 2. Re-generate numbers for each document in order
    console.log("Re-generating numbers based on updated logic...");
    for (const doc of docs) {
        if (!doc.department || !doc.category) {
            console.warn(`Skipping doc ${doc.id} because dept/cat missing.`);
            continue;
        }

        try {
            const newDocNo = await prisma.$transaction(async (tx) => {
                return await generateNextDocNo(doc.department!.name, doc.category!.name, doc.thaiYear, tx);
            });

            await prisma.document.update({
                where: { id: doc.id },
                data: { docNo: newDocNo }
            });

            console.log(`[Realigned] ${doc.id}: "${doc.name}" -> ${newDocNo}`);
        } catch (error: any) {
            console.error(`Failed to realign doc ${doc.id}:`, error.message);
        }
    }

    console.log("--- Global Realignment Completed ---");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
