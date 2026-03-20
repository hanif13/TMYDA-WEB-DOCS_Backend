import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAnnualPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.annualPlan.findMany({
            include: {
                projects: {
                    include: { 
                        department: true,
                        documents: {
                            include: { category: true, department: true, uploadedBy: true }
                        }
                    }
                }
            },
            orderBy: { year: 'desc' }
        });
        res.json(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        res.status(500).json({ error: "Failed to fetch annual plans" });
    }
};

export const getAnnualYears = async (req: Request, res: Response) => {
    try {
        const years = await prisma.annualPlan.findMany({
            select: {
                id: true,
                year: true,
                thaiYear: true,
                label: true,
                totalBudget: true,
                totalUsed: true
            },
            orderBy: { year: 'desc' }
        });
        res.json(years);
    } catch (error) {
        console.error("Error fetching annual years:", error);
        res.status(500).json({ error: "Failed to fetch annual years" });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, departmentId, subDepartment, projectType, lead, budget, quarter, annualPlanId, months, isUnplanned } = req.body;
        
        const newProject = await prisma.project.create({
            data: {
                name,
                departmentId,
                subDepartment,
                projectType,
                lead,
                budget: Number(budget),
                quarter: Number(quarter),
                annualPlanId,
                months: months || [],
                isUnplanned: Boolean(isUnplanned),
                isStarted: Boolean(isUnplanned), // Unplanned projects start immediately
                status: isUnplanned ? 'in_progress' : 'planned'
            },
            include: {
                department: true
            }
        });

        // Update Annual Plan Total Budget
        await prisma.annualPlan.update({
            where: { id: annualPlanId },
            data: { totalBudget: { increment: Number(budget) } }
        });
        
        res.status(201).json(newProject);
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Failed to create project" });
    }
};

export const createAnnualPlan = async (req: Request, res: Response) => {
    try {
        const { year, thaiYear, label } = req.body;
        const newPlan = await prisma.annualPlan.create({
            data: {
                year: Number(year),
                thaiYear: Number(thaiYear),
                label,
                totalBudget: 0,
                totalUsed: 0
            }
        });
        res.status(201).json(newPlan);
    } catch (error: any) {
        console.error("Error creating annual plan:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Year already exists" });
        }
        res.status(500).json({ error: "Failed to create annual plan" });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const { 
            name, 
            departmentId, 
            subDepartment,
            projectType, 
            lead, 
            budget, 
            quarter, 
            months, 
            isStarted, 
            status, 
            budgetUsed, 
            description, 
            kpi, 
            targetPax, 
            actualPax,
            isUnplanned,
            completedMonths
        } = req.body;
        
        // If budget is changing, we need to update the AnnualPlan totalBudget
        if (budget !== undefined) {
            const oldProject = await prisma.project.findUnique({
                where: { id },
                select: { budget: true, annualPlanId: true }
            });
            
            if (oldProject && oldProject.budget !== Number(budget)) {
                const diff = Number(budget) - oldProject.budget;
                await prisma.annualPlan.update({
                    where: { id: oldProject.annualPlanId },
                    data: { totalBudget: { increment: diff } }
                });
            }
        }

        const updated = await prisma.project.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(departmentId && { departmentId }),
                ...(subDepartment !== undefined && { subDepartment }),
                ...(projectType && { projectType }),
                ...(lead && { lead }),
                ...(budget !== undefined && { budget: Number(budget) }),
                ...(quarter !== undefined && { quarter: Number(quarter) }),
                ...(months !== undefined && { months }),
                ...(completedMonths !== undefined && { completedMonths }),
                ...(isStarted !== undefined && { isStarted: Boolean(isStarted) }),
                ...(status && { status }),
                ...(budgetUsed !== undefined && { budgetUsed: Number(budgetUsed) }),
                ...(description !== undefined && { description }),
                ...(kpi !== undefined && { kpi }),
                ...(targetPax !== undefined && { targetPax: Number(targetPax) }),
                ...(actualPax !== undefined && { actualPax: Number(actualPax) }),
                ...(isUnplanned !== undefined && { isUnplanned: Boolean(isUnplanned) }),
                ...(req.files && Array.isArray(req.files) && req.files.length > 0 && {
                    summaryImages: (req.files as Express.Multer.File[]).map(f => `/uploads/documents/${f.filename}`)
                })
            },
            include: {
                department: true
            }
        });
        
        res.json(updated);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: "Failed to update project" });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        // Find project to get budget and annualPlanId before deleting
        const project = await prisma.project.findUnique({
            where: { id },
            select: { budget: true, annualPlanId: true }
        });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Delete project
        await prisma.project.delete({
            where: { id }
        });

        // Update Annual Plan Total Budget
        await prisma.annualPlan.update({
            where: { id: project.annualPlanId },
            data: { totalBudget: { decrement: project.budget } }
        });

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};
export const updateAnnualPlan = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { year, thaiYear, label } = req.body;
        
        const updated = await prisma.annualPlan.update({
            where: { id },
            data: {
                ...(year && { year: Number(year) }),
                ...(thaiYear && { thaiYear: Number(thaiYear) }),
                ...(label && { label })
            }
        });
        
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating annual plan:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Year already exists" });
        }
        res.status(500).json({ error: "Failed to update annual plan" });
    }
};

export const deleteAnnualPlan = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        // Use a transaction to ensure both projects and the plan are deleted
        await prisma.$transaction([
            prisma.project.deleteMany({ where: { annualPlanId: id } }),
            prisma.annualPlan.delete({ where: { id } })
        ]);
        
        res.json({ message: "Annual plan and associated projects deleted successfully" });
    } catch (error) {
        console.error("Error deleting annual plan:", error);
        res.status(500).json({ error: "Failed to delete annual plan" });
    }
};
