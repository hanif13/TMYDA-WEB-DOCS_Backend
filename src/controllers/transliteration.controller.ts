import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/transliteration?search=&category=
export const getTransliterations = async (req: Request, res: Response) => {
    try {
        const { search, category } = req.query;

        const where: any = {};

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

        const items = await prisma.transliteration.findMany({
            where,
            orderBy: [{ foreign: 'asc' }],
        });

        return res.json(items);
    } catch (error) {
        console.error('Error fetching transliterations:', error);
        return res.status(500).json({ error: 'Failed to fetch transliterations' });
    }
};

// GET /api/transliteration/categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const result = await prisma.transliteration.findMany({
            select: { category: true },
            distinct: ['category'],
            where: { category: { not: null } },
            orderBy: { category: 'asc' },
        });
        const categories = result.map((r) => r.category).filter(Boolean);
        return res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// POST /api/transliteration
export const createTransliteration = async (req: Request, res: Response) => {
    try {
        const { foreign, arabic, thai, category, note } = req.body;

        if (!foreign || !thai) {
            return res.status(400).json({ error: 'กรุณากรอกคำต้นฉบับและคำทับศัพท์' });
        }

        const newItem = await prisma.transliteration.create({
            data: {
                foreign: foreign.trim(),
                arabic: arabic?.trim() || null,
                thai: thai.trim(),
                category: category?.trim() || null,
                note: note?.trim() || null,
            },
        });

        return res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating transliteration:', error);
        return res.status(500).json({ error: 'Failed to create transliteration' });
    }
};

// POST /api/transliteration/bulk
export const bulkCreateTransliterations = async (req: Request, res: Response) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
        }

        const validItems = items
            .filter((item: any) => item.foreign && item.thai)
            .map((item: any) => ({
                foreign: item.foreign.trim(),
                arabic: item.arabic?.trim() || null,
                thai: item.thai.trim(),
                category: item.category?.trim() || null,
                note: item.note?.trim() || null,
            }));

        if (validItems.length === 0) {
            return res.status(400).json({ error: 'ไม่มีข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบ CSV' });
        }

        const result = await prisma.transliteration.createMany({
            data: validItems,
            skipDuplicates: true,
        });

        return res.status(201).json({
            message: `นำเข้าสำเร็จ ${result.count} รายการ`,
            count: result.count,
        });
    } catch (error) {
        console.error('Error bulk creating transliterations:', error);
        return res.status(500).json({ error: 'Failed to bulk import transliterations' });
    }
};

// PATCH /api/transliteration/:id
export const updateTransliteration = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { foreign, arabic, thai, category, note } = req.body;

        const updateData: any = {};
        if (foreign !== undefined) updateData.foreign = foreign.trim();
        if (arabic !== undefined) updateData.arabic = arabic?.trim() || null;
        if (thai !== undefined) updateData.thai = thai.trim();
        if (category !== undefined) updateData.category = category?.trim() || null;
        if (note !== undefined) updateData.note = note?.trim() || null;

        const updated = await prisma.transliteration.update({
            where: { id },
            data: updateData,
        });

        return res.json(updated);
    } catch (error) {
        console.error('Error updating transliteration:', error);
        return res.status(500).json({ error: 'Failed to update transliteration' });
    }
};

// DELETE /api/transliteration/:id
export const deleteTransliteration = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.transliteration.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting transliteration:', error);
        return res.status(500).json({ error: 'Failed to delete transliteration' });
    }
};

// DELETE /api/transliteration (bulk delete)
export const bulkDeleteTransliterations = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'กรุณาระบุ ID ที่ต้องการลบ' });
        }

        const result = await prisma.transliteration.deleteMany({
            where: { id: { in: ids } },
        });

        return res.json({ message: `ลบสำเร็จ ${result.count} รายการ`, count: result.count });
    } catch (error) {
        console.error('Error bulk deleting transliterations:', error);
        return res.status(500).json({ error: 'Failed to bulk delete transliterations' });
    }
};
