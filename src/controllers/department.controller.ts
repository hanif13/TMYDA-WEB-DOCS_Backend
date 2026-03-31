import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' }
        });
        return res.json(departments);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ error: "Failed to fetch departments" });
    }
};
