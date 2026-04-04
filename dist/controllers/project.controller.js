"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectBulk = exports.deleteAnnualPlan = exports.updateAnnualPlan = exports.deleteProject = exports.updateProject = exports.createAnnualPlan = exports.createProject = exports.getAnnualYears = exports.getAnnualPlans = void 0;
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../lib/supabase");
const getAnnualPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = yield prisma_1.prisma.annualPlan.findMany({
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
    }
    catch (error) {
        console.error("Error fetching plans:", error);
        return res.status(500).json({ error: "Failed to fetch annual plans" });
    }
});
exports.getAnnualPlans = getAnnualPlans;
const getAnnualYears = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const years = yield prisma_1.prisma.annualPlan.findMany({
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
    }
    catch (error) {
        console.error("Error fetching annual years:", error);
        return res.status(500).json({ error: "Failed to fetch annual years" });
    }
});
exports.getAnnualYears = getAnnualYears;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, departmentId, subDepartment, projectType, lead, budget, quarter, annualPlanId, months, isUnplanned } = req.body;
        const newProject = yield prisma_1.prisma.project.create({
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
        yield prisma_1.prisma.annualPlan.update({
            where: { id: annualPlanId },
            data: { totalBudget: { increment: Number(budget) } }
        });
        return res.status(201).json(newProject);
    }
    catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project" });
    }
});
exports.createProject = createProject;
const createAnnualPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year, thaiYear, label } = req.body;
        const newPlan = yield prisma_1.prisma.annualPlan.create({
            data: {
                year: Number(year),
                thaiYear: Number(thaiYear),
                label,
                totalBudget: 0,
                totalUsed: 0
            }
        });
        return res.status(201).json(newPlan);
    }
    catch (error) {
        console.error("Error creating annual plan:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Year already exists" });
        }
        return res.status(500).json({ error: "Failed to create annual plan" });
    }
});
exports.createAnnualPlan = createAnnualPlan;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const data = req.body;
        const files = req.files;
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
            try {
                months = JSON.parse(months);
            }
            catch (e) { }
        }
        let completedMonths = data.completedMonths;
        if (typeof completedMonths === 'string') {
            try {
                completedMonths = JSON.parse(completedMonths);
            }
            catch (e) { }
        }
        // If budget is changing, we need to update the AnnualPlan totalBudget
        if (budget !== undefined && budget !== null) {
            const oldProject = yield prisma_1.prisma.project.findUnique({
                where: { id },
                select: { budget: true, annualPlanId: true }
            });
            if (oldProject && oldProject.budget !== Number(budget)) {
                const diff = Number(budget) - oldProject.budget;
                yield prisma_1.prisma.annualPlan.update({
                    where: { id: oldProject.annualPlanId },
                    data: { totalBudget: { increment: diff } }
                });
            }
        }
        let summaryImages = undefined;
        if (files && files.length > 0) {
            summaryImages = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const extension = file.originalname.split('.').pop() || 'tmp';
                const fileName = `prj-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
                const { data: uploadData, error } = yield supabase_1.supabaseAdmin.storage
                    .from('uploads')
                    .upload(`projects/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });
                if (error)
                    throw error;
                const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
                    .from('uploads')
                    .getPublicUrl(`projects/${fileName}`);
                return publicUrl;
            })));
        }
        const updated = yield prisma_1.prisma.project.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (departmentId && { departmentId })), (subDepartment !== undefined && { subDepartment })), (projectType && { projectType })), (lead && { lead })), (budget !== undefined && { budget: Number(budget) })), (quarter !== undefined && { quarter: Number(quarter) })), (months !== undefined && { months })), (completedMonths !== undefined && { completedMonths })), (isStarted !== undefined && { isStarted: String(isStarted) === 'true' })), (status && { status })), (budgetUsed !== undefined && { budgetUsed: Number(budgetUsed) })), (description !== undefined && { description })), (kpi !== undefined && { kpi })), (targetPax !== undefined && { targetPax: Number(targetPax) })), (actualPax !== undefined && { actualPax: Number(actualPax) })), (actualDate !== undefined && { actualDate })), (actualBudget !== undefined && { actualBudget: Number(actualBudget) })), (isUnplanned !== undefined && { isUnplanned: String(isUnplanned) === 'true' })), (summaryImages && { summaryImages })),
            include: {
                department: true
            }
        });
        return res.json(updated);
    }
    catch (error) {
        console.error("Error updating project:", error);
        return res.status(500).json({ error: "Failed to update project" });
    }
});
exports.updateProject = updateProject;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const project = yield prisma_1.prisma.project.findUnique({
            where: { id },
            select: { budget: true, annualPlanId: true }
        });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        // Delete all linked transactions first
        yield prisma_1.prisma.transaction.deleteMany({
            where: { projectId: id }
        });
        yield prisma_1.prisma.project.delete({
            where: { id }
        });
        yield prisma_1.prisma.annualPlan.update({
            where: { id: project.annualPlanId },
            data: { totalBudget: { decrement: project.budget } }
        });
        return res.json({ message: "Project deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting project:", error);
        return res.status(500).json({ error: "Failed to delete project" });
    }
});
exports.deleteProject = deleteProject;
const updateAnnualPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { year, thaiYear, label } = req.body;
        const updated = yield prisma_1.prisma.annualPlan.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (year && { year: Number(year) })), (thaiYear && { thaiYear: Number(thaiYear) })), (label && { label }))
        });
        return res.json(updated);
    }
    catch (error) {
        console.error("Error updating annual plan:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Year already exists" });
        }
        return res.status(500).json({ error: "Failed to update annual plan" });
    }
});
exports.updateAnnualPlan = updateAnnualPlan;
const deleteAnnualPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // First find all project IDs in this plan to delete their transactions
        const projectIds = (yield prisma_1.prisma.project.findMany({
            where: { annualPlanId: id },
            select: { id: true }
        })).map(p => p.id);
        yield prisma_1.prisma.$transaction([
            // Delete transactions linked to projects in this plan
            prisma_1.prisma.transaction.deleteMany({ where: { projectId: { in: projectIds } } }),
            prisma_1.prisma.project.deleteMany({ where: { annualPlanId: id } }),
            prisma_1.prisma.annualPlan.delete({ where: { id } })
        ]);
        return res.json({ message: "Annual plan and associated projects deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting annual plan:", error);
        return res.status(500).json({ error: "Failed to delete annual plan" });
    }
});
exports.deleteAnnualPlan = deleteAnnualPlan;
const createProjectBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projects, annualPlanId } = req.body;
        if (!Array.isArray(projects) || !annualPlanId) {
            return res.status(400).json({ error: "Invalid data format or missing annualPlanId." });
        }
        let totalBudgetToAdd = 0;
        const mappedProjects = projects.map((p) => {
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
        const result = yield prisma_1.prisma.project.createMany({
            data: mappedProjects
        });
        yield prisma_1.prisma.annualPlan.update({
            where: { id: annualPlanId },
            data: { totalBudget: { increment: totalBudgetToAdd } }
        });
        return res.status(201).json({ message: "Imported successfully", count: result.count });
    }
    catch (error) {
        console.error("Error bulk creating projects:", error);
        return res.status(500).json({ error: "Failed to import projects" });
    }
});
exports.createProjectBulk = createProjectBulk;
