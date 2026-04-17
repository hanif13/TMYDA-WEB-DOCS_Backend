import { PrismaClient } from '@prisma/client';
import { generateNextDocNo, CATEGORY_MAP } from '../src/lib/doc-utils';

const prisma = new PrismaClient();

async function verify() {
    const deptName = "สมาคมพัฒนาเยาวชนมุสลิมไทย"; // tmyda
    const year = 2569;

    console.log("--- Detailed Verification Start ---");
    
    const docs = await prisma.document.findMany({
        where: { thaiYear: year, department: { name: deptName } },
        include: { category: true }
    });

    console.log(`Total documents for ${deptName} in ${year}: ${docs.length}`);
    
    const internalDocs = docs.filter(d => (CATEGORY_MAP[d.category.name] || d.category.name) === "ประเภทเอกสารภายใน");
    const externalDocs = docs.filter(d => (CATEGORY_MAP[d.category.name] || d.category.name) === "ประเภทเอกสารภายนอก");
    
    console.log(`Internal docs count: ${internalDocs.length}`);
    console.log("Internal doc numbers:", internalDocs.map(d => d.docNo));
    
    console.log(`External docs count: ${externalDocs.length}`);
    console.log("External doc numbers:", externalDocs.map(d => d.docNo));

    const nextInternal = await generateNextDocNo(deptName, "เอกสารเบิกงบประมาณ", year);
    console.log("Next Internal Doc No calculated:", nextInternal);

    const nextExternal = await generateNextDocNo(deptName, "เอกสารขอความอนุเคราะห์", year);
    console.log("Next External Doc No calculated:", nextExternal);
    
    console.log("--- Detailed Verification End ---");
}

verify().catch(console.error).finally(() => prisma.$disconnect());
