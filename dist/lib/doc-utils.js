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
        if (cat === "ประเภทเอกสารโครงการ") {
            used = existingDocs
                .filter((d) => { var _a, _b; return ((_a = d.docNo) === null || _a === void 0 ? void 0 : _a.startsWith("โครงการที่ ")) && ((_b = d.docNo) === null || _b === void 0 ? void 0 : _b.endsWith(`/${year}`)); })
                .map((d) => parseInt(d.docNo.replace("โครงการที่ ", "").split("/")[0], 10))
                .filter((n) => !isNaN(n));
        }
        else if (cat === "ประเภทเอกสารรายงานผลการดำเนินโครงการ") {
            used = existingDocs
                .filter((d) => { var _a, _b; return ((_a = d.docNo) === null || _a === void 0 ? void 0 : _a.startsWith("รายงานโครงการที่ ")) && ((_b = d.docNo) === null || _b === void 0 ? void 0 : _b.endsWith(`/${year}`)); })
                .map((d) => parseInt(d.docNo.replace("รายงานโครงการที่ ", "").split("/")[0], 10))
                .filter((n) => !isNaN(n));
        }
        else if (cat === "ประเภทเอกสารประกาศหรือคำสั่ง") {
            const isSharedDept = ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(deptName);
            used = existingDocs
                .filter((d) => {
                var _a, _b, _c;
                const docDeptName = ((_a = d.department) === null || _a === void 0 ? void 0 : _a.name) || "";
                const matchDept = isSharedDept
                    ? ["สมาคมพัฒนาเยาวชนมุสลิมไทย", "สำนักกิจการสตรี สมาคมฯ"].includes(docDeptName)
                    : docDeptName === deptName;
                return matchDept && ((_b = d.docNo) === null || _b === void 0 ? void 0 : _b.startsWith("ประกาศหรือคำสั่งที่ ")) && ((_c = d.docNo) === null || _c === void 0 ? void 0 : _c.endsWith(`/${year}`));
            })
                .map((d) => parseInt(d.docNo.replace("ประกาศหรือคำสั่งที่ ", "").split("/")[0], 10))
                .filter((n) => !isNaN(n));
        }
        else {
            const prefix = exports.ORG_PREFIX_BY_DEPT[deptName] || "ที่ ฟฮ";
            used = existingDocs
                .filter((d) => {
                var _a, _b, _c;
                const docCat = ((_a = d.category) === null || _a === void 0 ? void 0 : _a.name) || "";
                const mappedDocCat = exports.CATEGORY_MAP[docCat] || docCat;
                return ((_b = d.docNo) === null || _b === void 0 ? void 0 : _b.startsWith(`${prefix} `)) &&
                    ((_c = d.docNo) === null || _c === void 0 ? void 0 : _c.endsWith(`/${year}`)) &&
                    mappedDocCat === cat;
            })
                .map((d) => parseInt(d.docNo.replace(`${prefix} `, "").split("/")[0], 10))
                .filter((n) => !isNaN(n));
        }
        const nextSeq = used.length > 0 ? Math.max(...used) + 1 : 1;
        return formatDocNo(deptName, categoryName, nextSeq, year);
    });
}
