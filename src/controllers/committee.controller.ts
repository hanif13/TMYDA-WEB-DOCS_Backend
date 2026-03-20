import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getCommitteeMembers = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        const where: any = {};
        
        if (year && !isNaN(parseInt(year as string))) {
            where.thaiYear = parseInt(year as string);
        }

        const members = await (prisma as any).committeeMember.findMany({
            where,
            include: {
                department: true
            },
            orderBy: [
                { departmentId: 'asc' },
                { order: 'asc' }
            ]
        });
        res.json(members);
    } catch (error: any) {
        console.error("DEBUG - Error fetching committee members:", error);
        res.status(500).json({ 
            error: "Failed to fetch committee members", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const createCommitteeMember = async (req: Request, res: Response) => {
    try {
        const { name, position, phoneNumber, email, occupation, departmentId, order, thaiYear } = req.body;
        const photoUrl = req.file ? `/uploads/documents/${req.file.filename}` : "";

        const member = await (prisma as any).committeeMember.create({
            data: {
                name,
                position,
                phoneNumber,
                email,
                occupation,
                photoUrl,
                departmentId,
                order: Number(order) || 0,
                thaiYear: Number(thaiYear) || 2569
            }
        });
        res.status(201).json(member);
    } catch (error) {
        console.error("Error creating committee member:", error);
        res.status(500).json({ error: "Failed to create committee member" });
    }
};

export const deleteCommitteeMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await (prisma as any).committeeMember.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting committee member:", error);
        res.status(500).json({ error: "Failed to delete committee member" });
    }
};
