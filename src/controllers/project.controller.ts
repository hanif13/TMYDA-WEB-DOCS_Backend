import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

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
        return res.json(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        return res.status(500).json({ error: "Failed to fetch annual plans" });
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
        return res.json(years);
    } catch (error) {
        console.error("Error fetching annual years:", error);
        return res.status(500).json({ error: "Failed to fetch annual years" });
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
        
        return res.status(201).json(newProject);
    } catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project" });
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
        return res.status(201).json(newPlan);
    } catch (error: any) {
        console.error("Error creating annual plan:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Year already exists" });
        }
        return res.status(500).json({ error: "Failed to create annual plan" });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const data = req.body;
        const files = req.files as Express.Multer.File[];
        
        const name = data.name;
        const departmentId = data.departmentId;
        const subDepartment = data.subDepartment;
        const projectType = data.projectType;
        const lead = data.lead;
        const budget = data.budget;
        const quarter = data.quarter;
        const isStarted = data.isStarted;
        const status = data.status;
        const budgetUsed = data.budgetUsed;
        const description = data.description;
        const kpi = data.kpi;
        const targetPax = data.targetPax;
        const actualPax = data.actualPax;
        const actualDate = data.actualDate;
        const actualBudget = data.actualBudget;
        const isUnplanned = data.isUnplanned;
        
        let months = data.months;
        if (typeof months === 'string') {
            try { months = JSON.parse(months); } catch (e) {}
        }
        
        let completedMonths = data.completedMonths;
        if (typeof completedMonths === 'string') {
            try { completedMonths = JSON.parse(completedMonths); } catch (e) {}
        }

        // If budget is changing, we need to update the AnnualPlan totalBudget
        if (budget !== undefined && budget !== null) {
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

        let summaryImages = undefined;
        if (files && files.length > 0) {
            summaryImages = await Promise.all(files.map(async (file) => {
                const extension = file.originalname.split('.').pop() || 'tmp';
                const fileName = `prj-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
                const { data: uploadData, error } = await supabaseAdmin.storage
                    .from('uploads')
                    .upload(`projects/${fileName}`, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true
                    });

                if (error) throw error;
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('uploads')
                    .getPublicUrl(`projects/${fileName}`);
                return publicUrl;
            }));
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
                ...(isStarted !== undefined && { isStarted: String(isStarted) === 'true' }),
                ...(status && { status }),
                ...(budgetUsed !== undefined && { budgetUsed: Number(budgetUsed) }),
                ...(description !== undefined && { description }),
                ...(kpi !== undefined && { kpi }),
                ...(targetPax !== undefined && { targetPax: Number(targetPax) }),
                ...(actualPax !== undefined && { actualPax: Number(actualPax) }),
                ...(actualDate !== undefined && { actualDate }),
                ...(actualBudget !== undefined && { actualBudget: Number(actualBudget) }),
                ...(isUnplanned !== undefined && { isUnplanned: String(isUnplanned) === 'true' }),
                ...(summaryImages && { summaryImages })
            },
            include: {
                department: true
            }
        });
        
        return res.json(updated);
    } catch (error) {
        console.error("Error updating project:", error);
        return res.status(500).json({ error: "Failed to update project" });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        const project = await prisma.project.findUnique({
            where: { id },
            select: { budget: true, annualPlanId: true }
        });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        await prisma.project.delete({
            where: { id }
        });

        await prisma.annualPlan.update({
            where: { id: project.annualPlanId },
            data: { totalBudget: { decrement: project.budget } }
        });

        return res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        return res.status(500).json({ error: "Failed to delete project" });
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
        
        return res.json(updated);
    } catch (error: any) {
        console.error("Error updating annual plan:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Year already exists" });
        }
        return res.status(500).json({ error: "Failed to update annual plan" });
    }
};

export const deleteAnnualPlan = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        await prisma.$transaction([
            prisma.project.deleteMany({ where: { annualPlanId: id } }),
            prisma.annualPlan.delete({ where: { id } })
        ]);
        
        return res.json({ message: "Annual plan and associated projects deleted successfully" });
    } catch (error) {
        console.error("Error deleting annual plan:", error);
        return res.status(500).json({ error: "Failed to delete annual plan" });
    }
};

export const createProjectBulk = async (req: Request, res: Response) => {
    try {
        const { projects, annualPlanId } = req.body;
        if (!Array.isArray(projects) || !annualPlanId) {
            return res.status(400).json({ error: "Invalid data format or missing annualPlanId." });
        }
        
        let totalBudgetToAdd = 0;
        
        const mappedProjects = projects.map((p: any) => {
            const budget = Number(p.budget) || 0;
            totalBudgetToAdd += budget;
            return {
                name: p.name,
                departmentId: p.departmentId || "admin",
                subDepartment: p.subDepartment || "",
                projectType: p.projectType || "general",
                lead: p.lead || "",
                budget,
                quarter: Number(p.quarter) || 1,
                annualPlanId,
                months: Array.isArray(p.months) ? p.months : [],
                isUnplanned: Boolean(p.isUnplanned),
                isStarted: Boolean(p.isUnplanned),
                status: p.isUnplanned ? 'in_progress' : 'planned',
            };
        });

        const result = await prisma.project.createMany({
            data: mappedProjects
        });

        await prisma.annualPlan.update({
            where: { id: annualPlanId },
            data: { totalBudget: { increment: totalBudgetToAdd } }
        });

        return res.status(201).json({ message: "Imported successfully", count: result.count });
    } catch (error) {
        console.error("Error bulk creating projects:", error);
        return res.status(500).json({ error: "Failed to import projects" });
    }
};
