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

    const patternPrefixMap: Record<string, RegExp> = {
        "ประเภทเอกสารโครงการ": new RegExp(`^โครงการที่\\s*(\\d+)\\s*/\\s*${year}$`),
        "ประเภทเอกสารรายงานผลการดำเนินโครงการ": new RegExp(`^รายงานโครงการที่\\s*(\\d+)\\s*/\\s*${year}$`),
        "ประเภทเอกสารประกาศหรือคำสั่ง": new RegExp(`^ประกาศหรือคำสั่งที่\\s*(\\d+)\\s*/\\s*${year}$`)
    };

    const pattern = patternPrefixMap[cat] || (() => {
        const prefix = ORG_PREFIX_BY_DEPT[deptName] || "ที่ ฟฮ";
        const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`^${escapedPrefix}\\s*(\\s|\\.|\\-)?\\s*(\\d+)\\s*/\\s*${year}$`);
    })();
    
    used = existingDocs
        .filter((d: DocItem) => {
            const docDeptName = d.department?.name || "";
            const docCatName = d.category?.name || "";
            const docMappedCat = CATEGORY_MAP[docCatName] || docCatName;

            // Strict department match
            const isDeptMatch = docDeptName === deptName;

            if (cat === "ประเภทเอกสารโครงการ" || cat === "ประเภทเอกสารรายงานผลการดำเนินโครงการ") {
                // Global sequences
                return docMappedCat === cat;
            }

            if (cat === "ประเภทเอกสารประกาศหรือคำสั่ง") {
                const isSharedDept = ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(deptName);
                if (isSharedDept) {
                    return ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(docDeptName) && docMappedCat === cat;
                }
                return isDeptMatch && docMappedCat === cat;
            }

            if (cat === "ประเภทเอกสารภายใน" || cat === "ประเภทเอกสารภายนอก") {
                return isDeptMatch && docMappedCat === cat;
            }

            // Other miscellaneous (count together but exclude known separate categories)
            return isDeptMatch && !["ประเภทเอกสารภายใน", "ประเภทเอกสารภายนอก", "ประเภทเอกสารประกาศหรือคำสั่ง"].includes(docMappedCat);
        })
        .map((d: DocItem) => {
            const matchedPattern = patternPrefixMap[CATEGORY_MAP[d.category?.name || ""] || d.category?.name || ""] || pattern;
            return parseSeq(d.docNo, matchedPattern);
        })
        .filter((n: number | null): n is number => n !== null);

    const nextSeq = used.length > 0 ? Math.max(...used) + 1 : 1;
    const finalDocNo = formatDocNo(deptName, categoryName, nextSeq, year);
    
    console.log(`[Numbering Debug] Dept: ${deptName}, Cat: ${cat}, Year: ${year}`);
    console.log(`[Numbering Debug] Found ${used.length} existing sequences in this category. Next sequence: ${nextSeq}`);
    console.log(`[Numbering Debug] Result: ${finalDocNo}`);
    
    return finalDocNo;
}
