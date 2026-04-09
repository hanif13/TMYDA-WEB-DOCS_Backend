import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CURRENT_THAI_YEAR = 2569;

export const ORG_PREFIX_BY_DEPT: Record<string, string> = {
    "ครอบครัวฟิตยะตุลฮัก": "ที่ ฟฮ",
    "สำนักอำนวยการ": "ที่ สอ.ฟฮ",
    "สมาคมพัฒนาเยาวชนมุสลิมไทย": "ที่ สพยท.",
    "สำนักกิจการสตรี สมาคมฯ": "ที่ สพยท.",
    "สำนักกิจการสตรี": "ที่ สพยท.",
    "กรรมการที่ปรึกษา(ชูรอ)": "ที่ ชร.ฟฮ",
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

    // Regex to extract sequence number from different formats
    const parseSeq = (docNo: string | null, pattern: RegExp): number | null => {
        if (!docNo) return null;
        const match = docNo.match(pattern);
        return match ? parseInt(match[1], 10) : null;
    };

    if (cat === "ประเภทเอกสารโครงการ") {
        // Global sequence for all project documents
        const pattern = new RegExp(`^โครงการที่\\s*(\\d+)\\s*/\\s*${year}$`);
        used = existingDocs
            .map((d: DocItem) => parseSeq(d.docNo, pattern))
            .filter((n: number | null): n is number => n !== null);
    } else if (cat === "ประเภทเอกสารรายงานผลการดำเนินโครงการ") {
        // Global sequence for all project reports
        const pattern = new RegExp(`^รายงานโครงการที่\\s*(\\d+)\\s*/\\s*${year}$`);
        used = existingDocs
            .map((d: DocItem) => parseSeq(d.docNo, pattern))
            .filter((n: number | null): n is number => n !== null);
    } else if (cat === "ประเภทเอกสารประกาศหรือคำสั่ง") {
        // Per-department sequence for announcements
        const isSharedDept = ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(deptName);
        const pattern = new RegExp(`^ประกาศหรือคำสั่งที่\\s*(\\d+)\\s*/\\s*${year}$`);
        
        used = existingDocs
            .filter((d: DocItem) => {
                const docDeptName = d.department?.name || "";
                return isSharedDept 
                    ? ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(docDeptName)
                    : docDeptName === deptName;
            })
            .map((d: DocItem) => parseSeq(d.docNo, pattern))
            .filter((n: number | null): n is number => n !== null);
    } else {
        // Per-department sequence for Internal/External documents (determined by prefix)
        const prefix = ORG_PREFIX_BY_DEPT[deptName] || "ที่ ฟฮ";
        const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`^${escapedPrefix}\\s+(\\d+)\\s*/\\s*${year}$`);
        
        used = existingDocs
            .filter((d: DocItem) => {
                const docDeptName = d.department?.name || "";
                // Even though prefix makes it unique, we explicitly check dept to count the right sequence
                return docDeptName === deptName;
            })
            .map((d: DocItem) => parseSeq(d.docNo, pattern))
            .filter((n: number | null): n is number => n !== null);
    }

    const nextSeq = used.length > 0 ? Math.max(...used) + 1 : 1;
    return formatDocNo(deptName, categoryName, nextSeq, year);
}
