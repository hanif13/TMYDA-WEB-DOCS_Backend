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
exports.bulkDeleteTransliterations = exports.deleteTransliteration = exports.updateTransliteration = exports.bulkCreateTransliterations = exports.createTransliteration = exports.getCategories = exports.getTransliterations = void 0;
const prisma_1 = require("../lib/prisma");
// GET /api/transliteration?search=&category=
const getTransliterations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category } = req.query;
        const where = {};
        if (search && typeof search === 'string' && search.trim()) {
            where.OR = [
                { foreign: { contains: search, mode: 'insensitive' } },
                { arabic: { contains: search, mode: 'insensitive' } },
                { thai: { contains: search, mode: 'insensitive' } },
                { note: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category && typeof category === 'string' && category.trim()) {
            where.category = { equals: category, mode: 'insensitive' };
        }
        const items = yield prisma_1.prisma.transliteration.findMany({
            where,
            orderBy: [{ foreign: 'asc' }],
        });
        return res.json(items);
    }
    catch (error) {
        console.error('Error fetching transliterations:', error);
        return res.status(500).json({ error: 'Failed to fetch transliterations' });
    }
});
exports.getTransliterations = getTransliterations;
// GET /api/transliteration/categories
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield prisma_1.prisma.transliteration.findMany({
            select: { category: true },
            distinct: ['category'],
            where: { category: { not: null } },
            orderBy: { category: 'asc' },
        });
        const categories = result.map((r) => r.category).filter(Boolean);
        return res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
exports.getCategories = getCategories;
// POST /api/transliteration
const createTransliteration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { foreign, arabic, thai, category, note } = req.body;
        if (!foreign || !thai) {
            return res.status(400).json({ error: 'กรุณากรอกคำต้นฉบับและคำทับศัพท์' });
        }
        const newItem = yield prisma_1.prisma.transliteration.create({
            data: {
                foreign: foreign.trim(),
                arabic: (arabic === null || arabic === void 0 ? void 0 : arabic.trim()) || null,
                thai: thai.trim(),
                category: (category === null || category === void 0 ? void 0 : category.trim()) || null,
                note: (note === null || note === void 0 ? void 0 : note.trim()) || null,
            },
        });
        return res.status(201).json(newItem);
    }
    catch (error) {
        console.error('Error creating transliteration:', error);
        return res.status(500).json({ error: 'Failed to create transliteration' });
    }
});
exports.createTransliteration = createTransliteration;
// POST /api/transliteration/bulk
const bulkCreateTransliterations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
        }
        const validItems = items
            .filter((item) => item.foreign && item.thai)
            .map((item) => {
            var _a, _b, _c;
            return ({
                foreign: item.foreign.trim(),
                arabic: ((_a = item.arabic) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                thai: item.thai.trim(),
                category: ((_b = item.category) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                note: ((_c = item.note) === null || _c === void 0 ? void 0 : _c.trim()) || null,
            });
        });
        if (validItems.length === 0) {
            return res.status(400).json({ error: 'ไม่มีข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบ CSV' });
        }
        const result = yield prisma_1.prisma.transliteration.createMany({
            data: validItems,
            skipDuplicates: true,
        });
        return res.status(201).json({
            message: `นำเข้าสำเร็จ ${result.count} รายการ`,
            count: result.count,
        });
    }
    catch (error) {
        console.error('Error bulk creating transliterations:', error);
        return res.status(500).json({ error: 'Failed to bulk import transliterations' });
    }
});
exports.bulkCreateTransliterations = bulkCreateTransliterations;
// PATCH /api/transliteration/:id
const updateTransliteration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { foreign, arabic, thai, category, note } = req.body;
        const updateData = {};
        if (foreign !== undefined)
            updateData.foreign = foreign.trim();
        if (arabic !== undefined)
            updateData.arabic = (arabic === null || arabic === void 0 ? void 0 : arabic.trim()) || null;
        if (thai !== undefined)
            updateData.thai = thai.trim();
        if (category !== undefined)
            updateData.category = (category === null || category === void 0 ? void 0 : category.trim()) || null;
        if (note !== undefined)
            updateData.note = (note === null || note === void 0 ? void 0 : note.trim()) || null;
        const updated = yield prisma_1.prisma.transliteration.update({
            where: { id },
            data: updateData,
        });
        return res.json(updated);
    }
    catch (error) {
        console.error('Error updating transliteration:', error);
        return res.status(500).json({ error: 'Failed to update transliteration' });
    }
});
exports.updateTransliteration = updateTransliteration;
// DELETE /api/transliteration/:id
const deleteTransliteration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield prisma_1.prisma.transliteration.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting transliteration:', error);
        return res.status(500).json({ error: 'Failed to delete transliteration' });
    }
});
exports.deleteTransliteration = deleteTransliteration;
// DELETE /api/transliteration (bulk delete)
const bulkDeleteTransliterations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'กรุณาระบุ ID ที่ต้องการลบ' });
        }
        const result = yield prisma_1.prisma.transliteration.deleteMany({
            where: { id: { in: ids } },
        });
        return res.json({ message: `ลบสำเร็จ ${result.count} รายการ`, count: result.count });
    }
    catch (error) {
        console.error('Error bulk deleting transliterations:', error);
        return res.status(500).json({ error: 'Failed to bulk delete transliterations' });
    }
});
exports.bulkDeleteTransliterations = bulkDeleteTransliterations;
