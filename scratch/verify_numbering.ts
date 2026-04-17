import { PrismaClient } from '@prisma/client';
import { generateNextDocNo } from '../src/lib/doc-utils';

const prisma = new PrismaClient();

async function verify() {
    const deptName = "สมาคมพัฒนาเยาวชนมุสลิมไทย"; // tmyda
    const year = 2569;

    console.log("--- Verification Start ---");
    
    const nextInternal = await generateNextDocNo(deptName, "เอกสารเบิกงบประมาณ", year);
    console.log("Next Internal Doc No:", nextInternal);

    const nextExternal = await generateNextDocNo(deptName, "เอกสารขอความอนุเคราะห์", year);
    console.log("Next External Doc No:", nextExternal);
    
    console.log("--- Verification End ---");
}

verify().catch(console.error).finally(() => prisma.$disconnect());
