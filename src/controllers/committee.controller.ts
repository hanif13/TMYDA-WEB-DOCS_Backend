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

export const updateCommitteeMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, position, phoneNumber, email, occupation, departmentId, order, thaiYear } = req.body;
        
        const dataToUpdate: any = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (position !== undefined) dataToUpdate.position = position;
        if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;
        if (email !== undefined) dataToUpdate.email = email;
        if (occupation !== undefined) dataToUpdate.occupation = occupation;
        if (departmentId !== undefined) dataToUpdate.departmentId = departmentId;
        if (order !== undefined) dataToUpdate.order = Number(order);
        if (thaiYear !== undefined) dataToUpdate.thaiYear = Number(thaiYear);
        
        if (req.file) {
            dataToUpdate.photoUrl = `/uploads/documents/${req.file.filename}`;
        }

        const member = await (prisma as any).committeeMember.update({
            where: { id },
            data: dataToUpdate
        });
        res.json(member);
    } catch (error) {
        console.error("Error updating committee member:", error);
        res.status(500).json({ error: "Failed to update committee member" });
    }
};

export const createCommitteeBulk = async (req: Request, res: Response) => {
    try {
        const members = req.body;
        if (!Array.isArray(members)) {
            return res.status(400).json({ error: "Invalid data format. Expected an array." });
        }
        
        const result = await (prisma as any).committeeMember.createMany({
            data: members.map((m: any) => ({
                name: m.name,
                position: m.position,
                phoneNumber: m.phoneNumber || "",
                email: m.email || "",
                occupation: m.occupation || "",
                departmentId: m.departmentId || "admin",
                order: Number(m.order) || 0,
                thaiYear: Number(m.thaiYear) || 2567
            }))
        });

        res.status(201).json({ message: "Imported successfully", count: result.count });
    } catch (error) {
        console.error("Error bulk creating committee members:", error);
        res.status(500).json({ error: "Failed to import committee members" });
    }
};
