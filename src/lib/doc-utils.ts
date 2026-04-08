import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CURRENT_THAI_YEAR = 2569;

export const ORG_PREFIX_BY_DEPT: Record<string, string> = {
    "ครอบครัวฟิตยะตุลฮัก": "ที่ ฟฮ",
    "สำนักอำนวยการ": "ที่ สอ.ฟฮ",
    "สมาคมพัฒนาเยาวชนมุสลิมไทย": "ที่ สพยท.",
    "สำนักกิจการสตรี สมาคมฯ": "ที่ สพยท.",
    "สำนักกิจการสตรี": "ที่ สพยท.",
};

export const CATEGORY_MAP: Record<string, string> = {
    "ใบโครงการ": "ประเภทเอกสารโครงการ",
    "รายงานผลการดำเนินโครงการ": "ประเภทเอกสารรายงานผลการดำเนินโครงการ",
    "เอกสารประกาศต่าง ๆ": "ประเภทเอกสารประกาศหรือคำสั่ง",
    "เอกสารเบิกงบประมาณ": "ประเภทเอกสารภายใน",
    "เอกสารขอความอนุเคราะห์": "ประเภทเอกสารภายนอก"
};

export function formatDocNo(dept: string, type: string, seq: number, year = CURRENT_THAI_YEAR): string {
    const padSeq = String(seq).padStart(3, "0");
    const cat = CATEGORY_MAP[type] || type;
    
    if (cat === "ประเภทเอกสารโครงการ") {
        return `โครงการที่ ${padSeq}/${year}`;
    }
    if (cat === "ประเภทเอกสารรายงานผลการดำเนินโครงการ") {
        return `รายงานโครงการที่ ${padSeq}/${year}`;
    }
    if (cat === "ประเภทเอกสารประกาศหรือคำสั่ง") {
        return `ประกาศหรือคำสั่งที่ ${padSeq}/${year}`;
    }
    const prefix = ORG_PREFIX_BY_DEPT[dept] || "ที่ ฟฮ";
    return `${prefix} ${padSeq}/${year}`;
}

export async function generateNextDocNo(
    deptName: string, 
    categoryName: string, 
    year = CURRENT_THAI_YEAR, 
    tx?: any // Optional Prisma transaction
): Promise<string> {
    const db = tx || prisma;
    const cat = CATEGORY_MAP[categoryName] || categoryName;
    
    // We get ALL documents for the given year to analyze the sequence
    const existingDocs = await db.document.findMany({
        where: { thaiYear: year },
        include: {
            department: true,
            category: true
        }
    });

    let used: number[] = [];

    // Explicit type to satisfy TS
    type DocItem = { docNo: string | null; department: { name: string } | null; category: { name: string } | null; };

    if (cat === "ประเภทเอกสารโครงการ") {
        used = existingDocs
            .filter((d: DocItem) => d.docNo?.startsWith("โครงการที่ ") && d.docNo?.endsWith(`/${year}`))
            .map((d: DocItem) => parseInt(d.docNo!.replace("โครงการที่ ", "").split("/")[0], 10))
            .filter((n: number) => !isNaN(n));
    } else if (cat === "ประเภทเอกสารรายงานผลการดำเนินโครงการ") {
        used = existingDocs
            .filter((d: DocItem) => d.docNo?.startsWith("รายงานโครงการที่ ") && d.docNo?.endsWith(`/${year}`))
            .map((d: DocItem) => parseInt(d.docNo!.replace("รายงานโครงการที่ ", "").split("/")[0], 10))
            .filter((n: number) => !isNaN(n));
    } else if (cat === "ประเภทเอกสารประกาศหรือคำสั่ง") {
        const isSharedDept = ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(deptName);
        
        used = existingDocs
            .filter((d: DocItem) => {
                const docDeptName = d.department?.name || "";
                const matchDept = isSharedDept 
                    ? ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(docDeptName)
                    : docDeptName === deptName;
                return matchDept && d.docNo?.startsWith("ประกาศหรือคำสั่งที่ ") && d.docNo?.endsWith(`/${year}`);
            })
            .map((d: DocItem) => parseInt(d.docNo!.replace("ประกาศหรือคำสั่งที่ ", "").split("/")[0], 10))
            .filter((n: number) => !isNaN(n));
    } else {
        const prefix = ORG_PREFIX_BY_DEPT[deptName] || "ที่ ฟฮ";
        used = existingDocs
            .filter((d: DocItem) => {
                const docCat = d.category?.name || "";
                const mappedDocCat = CATEGORY_MAP[docCat] || docCat;
                return d.docNo?.startsWith(`${prefix} `) && 
                       d.docNo?.endsWith(`/${year}`) &&
                       mappedDocCat === cat;
            })
            .map((d: DocItem) => parseInt(d.docNo!.replace(`${prefix} `, "").split("/")[0], 10))
            .filter((n: number) => !isNaN(n));
    }

    const nextSeq = used.length > 0 ? Math.max(...used) + 1 : 1;
    return formatDocNo(deptName, categoryName, nextSeq, year);
}
