import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { context } from '../lib/context';

// GET /api/events
export const getEvents = async (req: AuthRequest, res: Response) => {
    try {
        const { year, departmentId, from, to } = req.query;

        const where: any = {};

        if (year) {
            where.thaiYear = Number(year);
        }

        if (departmentId) {
            where.departmentId = String(departmentId);
        }

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(String(from));
            if (to) where.date.lte = new Date(String(to));
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                department: { select: { id: true, name: true, theme: true } }
            },
            orderBy: { date: 'asc' }
        });

        return res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม' });
    }
};

// POST /api/events
export const createEvent = async (req: AuthRequest, res: Response) => {
    try {
        const { title, departmentId, date, endDate, location, description, color, thaiYear } = req.body;

        if (!title || !departmentId || !date) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อกิจกรรม, หน่วยงาน, วันที่)' });
        }

        const event = await prisma.event.create({
            data: {
                title,
                departmentId,
                date: new Date(date),
                endDate: endDate ? new Date(endDate) : null,
                location: location || null,
                description: description || null,
                color: color || null,
                thaiYear: thaiYear || 2569,
            },
            include: {
                department: { select: { id: true, name: true, theme: true } }
            }
        });

        // Activity log
        const store = context.getStore();
        if (store?.userId) {
            await prisma.activityLog.create({
                data: {
                    userId: store.userId,
                    action: 'CREATE',
                    resource: 'Event',
                    details: { id: event.id, title: event.title },
                }
            });
        }

        return res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม' });
    }
};

// PATCH /api/events/:id
export const updateEvent = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { title, departmentId, date, endDate, location, description, color } = req.body;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'ไม่พบกิจกรรมที่ต้องการแก้ไข' });
        }

        const data: any = {};
        if (title !== undefined) data.title = title;
        if (departmentId !== undefined) data.departmentId = departmentId;
        if (date !== undefined) data.date = new Date(date);
        if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
        if (location !== undefined) data.location = location;
        if (description !== undefined) data.description = description;
        if (color !== undefined) data.color = color;

        const event = await prisma.event.update({
            where: { id },
            data,
            include: {
                department: { select: { id: true, name: true, theme: true } }
            }
        });

        // Activity log
        const store = context.getStore();
        if (store?.userId) {
            await prisma.activityLog.create({
                data: {
                    userId: store.userId,
                    action: 'UPDATE',
                    resource: 'Event',
                    details: { id: event.id, title: event.title },
                }
            });
        }

        return res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขกิจกรรม' });
    }
};

// DELETE /api/events/:id
export const deleteEvent = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'ไม่พบกิจกรรมที่ต้องการลบ' });
        }

        await prisma.event.delete({ where: { id } });

        // Activity log
        const store = context.getStore();
        if (store?.userId) {
            await prisma.activityLog.create({
                data: {
                    userId: store.userId,
                    action: 'DELETE',
                    resource: 'Event',
                    details: { id: existing.id, title: existing.title },
                }
            });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบกิจกรรม' });
    }
};
