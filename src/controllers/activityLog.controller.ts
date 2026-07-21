import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getActivityLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const userId = req.query.userId as string | undefined;
        const resource = req.query.resource as string | undefined;
        const action = req.query.action as string | undefined;

        // Build where clause
        const where: any = {};
        if (userId) where.userId = userId;
        if (resource) where.resource = resource;
        if (action) where.action = action;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            subDepartment: true,
                        }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        return res.json({
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching activity logs:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการใช้งาน' });
    }
};
