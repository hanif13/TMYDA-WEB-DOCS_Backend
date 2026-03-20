import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { users: true, projects: true }
                }
            }
        });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};
