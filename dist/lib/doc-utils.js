"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_MAP = exports.ORG_PREFIX_BY_DEPT = void 0;
exports.formatDocNo = formatDocNo;
exports.generateNextDocNo = generateNextDocNo;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CURRENT_THAI_YEAR = 2569;
exports.ORG_PREFIX_BY_DEPT = {
    "ครอบครัวฟิตยะตุลฮัก": "ที่ ฟฮ",
    "สำนักอำนวยการ": "ที่ สอ.ฟฮ",
    "สมาคมพัฒนาเยาวชนมุสลิมไทย": "ที่ สพยท.",
    "สำนักกิจการสตรี สมาคมฯ": "ที่ สพยท.",
    "สำนักกิจการสตรี": "ที่ สพยท.",
    "กรรมการที่ปรึกษา(ชูรอ)": "ที่ ชร.ฟฮ",
};
exports.CATEGORY_MAP = {
    "ใบโครงการ": "ประเภทเอกสารโครงการ",
    "รายงานผลการดำเนินโครงการ": "ประเภทเอกสารรายงานผลการดำเนินโครงการ",
    "เอกสารประกาศต่าง ๆ": "ประเภทเอกสารประกาศหรือคำสั่ง",
    "เอกสารเบิกงบประมาณ": "ประเภทเอกสารภายใน",
    "เอกสารขอความอนุเคราะห์": "ประเภทเอกสารภายนอก"
};
function formatDocNo(dept, type, seq, year = CURRENT_THAI_YEAR) {
    const padSeq = String(seq).padStart(3, "0");
    const cat = exports.CATEGORY_MAP[type] || type;
    if (cat === "ประเภทเอกสารโครงการ") {
        return `โครงการที่ ${padSeq}/${year}`;
    }
    if (cat === "ประเภทเอกสารรายงานผลการดำเนินโครงการ") {
        return `รายงานโครงการที่ ${padSeq}/${year}`;
    }
    if (cat === "ประเภทเอกสารประกาศหรือคำสั่ง") {
        return `ประกาศหรือคำสั่งที่ ${padSeq}/${year}`;
    }
    const prefix = exports.ORG_PREFIX_BY_DEPT[dept] || "ที่ ฟฮ";
    return `${prefix} ${padSeq}/${year}`;
}
function generateNextDocNo(deptName_1, categoryName_1) {
    return __awaiter(this, arguments, void 0, function* (deptName, categoryName, year = CURRENT_THAI_YEAR, tx // Optional Prisma transaction
    ) {
        const db = tx || prisma;
        const cat = exports.CATEGORY_MAP[categoryName] || categoryName;
        // We get ALL documents for the given year to analyze the sequence
        const existingDocs = yield db.document.findMany({
            where: { thaiYear: year },
            include: {
                department: true,
                category: true
            }
        });
        let used = [];
        // Regex to extract sequence number from different formats
        const parseSeq = (docNo, pattern) => {
            if (!docNo)
                return null;
            const match = docNo.match(pattern);
            return match ? parseInt(match[1], 10) : null;
        };
        const patternPrefixMap = {
            "ประเภทเอกสารโครงการ": new RegExp(`^โครงการที่\\s*(\\d+)\\s*/\\s*${year}$`),
            "ประเภทเอกสารรายงานผลการดำเนินโครงการ": new RegExp(`^รายงานโครงการที่\\s*(\\d+)\\s*/\\s*${year}$`),
            "ประเภทเอกสารประกาศหรือคำสั่ง": new RegExp(`^ประกาศหรือคำสั่งที่\\s*(\\d+)\\s*/\\s*${year}$`)
        };
        const pattern = patternPrefixMap[cat] || (() => {
            const prefix = exports.ORG_PREFIX_BY_DEPT[deptName] || "ที่ ฟฮ";
            const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`^${escapedPrefix}\\s*(?:\\s|\\.|\\-)?\\s*(\\d+)\\s*/\\s*${year}$`);
        })();
        used = existingDocs
            .filter((d) => {
            var _a, _b;
            const docDeptName = ((_a = d.department) === null || _a === void 0 ? void 0 : _a.name) || "";
            const docCatName = ((_b = d.category) === null || _b === void 0 ? void 0 : _b.name) || "";
            const docMappedCat = exports.CATEGORY_MAP[docCatName] || docCatName;
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
            .map((d) => {
            var _a, _b;
            const matchedPattern = patternPrefixMap[exports.CATEGORY_MAP[((_a = d.category) === null || _a === void 0 ? void 0 : _a.name) || ""] || ((_b = d.category) === null || _b === void 0 ? void 0 : _b.name) || ""] || pattern;
            return parseSeq(d.docNo, matchedPattern);
        })
            .filter((n) => n !== null);
        const nextSeq = used.length > 0 ? Math.max(...used) + 1 : 1;
        const finalDocNo = formatDocNo(deptName, categoryName, nextSeq, year);
        console.log(`[Numbering Debug] Dept: ${deptName}, Cat: ${cat}, Year: ${year}`);
        console.log(`[Numbering Debug] Found ${used.length} existing sequences in this category. Next sequence: ${nextSeq}`);
        console.log(`[Numbering Debug] Result: ${finalDocNo}`);
        return finalDocNo;
    });
}
