import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const { year, scope } = req.query;
        let where: any = {};
        
        if (scope === 'committee') {
            if (year && year !== 'all') {
                const yearInt = parseInt(year.toString(), 10);
                where.NOT = { hiddenInCommitteeYears: { has: yearInt } };
                where.OR = [
                    { thaiYear: yearInt },
                    { isCommitteeOnly: false }
                ];
            }
        } else {
            where.isCommitteeOnly = false;
        }

        const departmentsData = await prisma.department.findMany({
            where,
            orderBy: [{ order: 'asc' }]
        });

        // Unique filter to prevent duplicates (if any old cloned data remains)
        const uniqueMap = new Map();
        departmentsData.forEach(d => {
            if (!uniqueMap.has(d.name)) {
                uniqueMap.set(d.name, d);
            }
        });
        
        return res.json(Array.from(uniqueMap.values()));
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ error: "Failed to fetch departments" });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name, subDepts, theme, order, thaiYear, isCommitteeOnly } = req.body;
        const department = await prisma.department.create({
            data: {
                name,
                subDepts: subDepts || [],
                theme: theme || null,
                order: order ? parseInt(order.toString()) : 0,
                thaiYear: thaiYear ? parseInt(thaiYear.toString()) : 2567,
                isCommitteeOnly: isCommitteeOnly === true || isCommitteeOnly === 'true'
            }
        });
        return res.status(201).json(department);
    } catch (error) {
        console.error("Error creating department:", error);
        return res.status(500).json({ error: "Failed to create department" });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, subDepts, theme, order } = req.body;
        const department = await prisma.department.update({
            where: { id },
            data: {
                name,
                subDepts,
                theme,
                order: order !== undefined ? parseInt(order.toString()) : undefined
            }
        });
        return res.json(department);
    } catch (error) {
        console.error("Error updating department:", error);
        return res.status(500).json({ error: "Failed to update department" });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        const dept = await prisma.department.findUnique({ where: { id }});
        if (!dept) {
            return res.status(404).json({ error: "Department not found" });
        }

        // Cascading delete members first
        await prisma.committeeMember.deleteMany({
            where: { departmentId: id }
        });

        if (!dept.isCommitteeOnly) {
            const reqYear = req.query.year as string;
            if (reqYear) {
                const yearInt = parseInt(reqYear, 10);
                if (!dept.hiddenInCommitteeYears.includes(yearInt)) {
                    await prisma.department.update({
                        where: { id },
                        data: { hiddenInCommitteeYears: { push: yearInt } }
                    });
                }
            }
            return res.status(204).send();
        }

        // Committee-only department, delete fully
        await prisma.department.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting department:", error);
        return res.status(500).json({ error: "Failed to delete department" });
    }
};

export const reorderDepartments = async (req: Request, res: Response) => {
    try {
        const { orders } = req.body; // Array of { id, order }
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "Invalid orders format" });
        }

        await prisma.$transaction(
            orders.map((item: { id: string, order: number }) => 
                prisma.department.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );

        return res.json({ message: "Reordered successfully" });
    } catch (error) {
        console.error("Error reordering departments:", error);
        return res.status(500).json({ error: "Failed to reorder departments" });
    }
};
