import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const { year, scope } = req.query;
        let where: any = {};
        
        if (scope === 'committee') {
            // Committee scope: only return departments for the exact year
            // This completely isolates committee departments from other pages
            if (year && year !== 'all') {
                const yearInt = parseInt(year.toString(), 10);
                where.thaiYear = yearInt;
                where.NOT = { hiddenInCommitteeYears: { has: yearInt } };
            }
        } else {
            // Non-committee scope: only return shared (non-committee-only) departments
            where.isCommitteeOnly = false;
            if (year && year !== 'all') {
                where.thaiYear = parseInt(year.toString(), 10);
            }
        }

        const departmentsData = await prisma.department.findMany({
            where,
            orderBy: [{ order: 'asc' }]
        });

        // For non-committee scope, deduplicate by name to prevent
        // old cloned data from showing duplicate entries.
        // Always prefer the newest year (highest thaiYear) to get the most up-to-date subDepts.
        if (scope !== 'committee') {
            const uniqueMap = new Map();
            departmentsData.forEach(d => {
                if (!uniqueMap.has(d.name) || uniqueMap.get(d.name).thaiYear < d.thaiYear) {
                    uniqueMap.set(d.name, d);
                }
            });
            const result = Array.from(uniqueMap.values()).sort((a, b) => a.order - b.order);
            return res.json(result);
        }
        
        // Committee scope: no dedup needed (DB unique constraint handles it)
        return res.json(departmentsData);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ error: "Failed to fetch departments" });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name, subDepts, theme, order, thaiYear, isCommitteeOnly } = req.body;
        const yearInt = thaiYear ? parseInt(thaiYear.toString()) : 2567;
        const isCommittee = isCommitteeOnly === true || isCommitteeOnly === 'true';

        // Use upsert to prevent UniqueConstraint error when auto-creating from CSV
        const department = await prisma.department.upsert({
            where: {
                name_thaiYear: {
                    name,
                    thaiYear: yearInt,
                }
            },
            update: {}, // Do nothing if it already exists
            create: {
                name,
                subDepts: subDepts || [],
                theme: theme || null,
                order: order ? parseInt(order.toString()) : 0,
                thaiYear: yearInt,
                isCommitteeOnly: isCommittee
            }
        });
        
        return res.status(200).json(department);
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
