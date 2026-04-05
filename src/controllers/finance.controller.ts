import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { syncProjectBudgetUsed } from '../utils/budget.sync';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        const where: any = {};
        if (year) where.thaiYear = Number(year);

        const transactions = await prisma.transaction.findMany({
            where,
            include: { department: true, project: true }, 
            orderBy: { date: 'desc' }
        });
        return res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { date, type, departmentId, category, amount, title, thaiYear, year: yearBody, docRef, projectId, months, note } = req.body;
        const file = req.file;

        let slipUrl = "";
        if (file) {
            const extension = file.originalname.split('.').pop();
            const fileName = `fin-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`finance/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`finance/${fileName}`);
            slipUrl = publicUrl;
        }

        const thaiYearVal = thaiYear || yearBody;

        const transaction = await prisma.transaction.create({
            data: {
                date: date as string,
                type,
                departmentId,
                projectId: projectId || null,
                months: months ? (typeof months === 'string' ? JSON.parse(months) : months) : [],
                note: note || "",
                category: category || "",
                amount: Number(amount),
                title: title || "",
                docRef: docRef || "",
                claimedBy: req.body.claimedBy || "",
                slipUrl,
                thaiYear: thaiYearVal ? Number(thaiYearVal) : 2569
            },
            include: { department: true, project: true }
        });

        // Sync project budgetUsed if linked to a project
        if (transaction.projectId) {
            await syncProjectBudgetUsed(transaction.projectId);
        }

        return res.status(201).json(transaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
        return res.status(500).json({ error: "Failed to create transaction" });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // Find the transaction first to get projectId before deleting
        const tx = await prisma.transaction.findUnique({ where: { id } });
        await prisma.transaction.delete({ where: { id } });

        // Sync project budgetUsed if it was linked to a project
        if (tx?.projectId) {
            await syncProjectBudgetUsed(tx.projectId);
        }

        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return res.status(500).json({ error: "Failed to delete transaction" });
    }
};

export const getFinanceCategories = async (req: Request, res: Response) => {
    try {
        // Since TransactionCategory model doesn't exist, we'll return unique categories from Transactions
        const transactions = await prisma.transaction.findMany({
            select: { category: true },
            distinct: ['category']
        });
        const categories = transactions
            .map((t: any) => ({ name: t.category }))
            .filter((c: any) => c.name !== null);
        
        return res.json(categories);
    } catch (error) {
        console.error("Error fetching finance categories:", error);
        return res.status(500).json({ error: "Failed to fetch categories" });
    }
};

export const getFinanceSummary = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        const where: any = {};
        if (year) where.thaiYear = Number(year);

        const transactions = await prisma.transaction.findMany({ where });
        
        const summary = transactions.reduce((acc: any, curr: any) => {
            const type = (curr.type || "").toUpperCase();
            if (type === 'INCOME') acc.totalIncome += curr.amount;
            else if (type === 'EXPENSE') acc.totalExpense += curr.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        return res.json({
            ...summary,
            balance: summary.totalIncome - summary.totalExpense
        });
    } catch (error) {
        console.error("Error fetching finance summary:", error);
        return res.status(500).json({ error: "Failed to fetch summary" });
    }
};

export const updateTransaction = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { date, type, departmentId, category, amount, title, thaiYear, docRef, projectId, months, note } = req.body;
        const file = req.file;

        const oldTx = await prisma.transaction.findUnique({ where: { id } });
        if (!oldTx) return res.status(404).json({ error: "Transaction not found" });

        let slipUrl = oldTx.slipUrl;
        if (file) {
            const extension = file.originalname.split('.').pop();
            const fileName = `fin-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`finance/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`finance/${fileName}`);
            slipUrl = publicUrl;
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                ...(date && { date: date as string }),
                ...(type && { type }),
                ...(departmentId && { departmentId }),
                ...(projectId !== undefined && { projectId: projectId || null }),
                ...(months && { months: typeof months === 'string' ? JSON.parse(months) : months }),
                ...(note !== undefined && { note: note || "" }),
                ...(category && { category }),
                ...(amount !== undefined && { amount: Number(amount) }),
                title: title || undefined, // Support updating title too
                ...(docRef !== undefined && { docRef: docRef || "" }),
                ...(req.body.claimedBy !== undefined && { claimedBy: req.body.claimedBy || "" }),
                slipUrl,
                ...(thaiYear && { thaiYear: Number(thaiYear) })
            },
            include: { department: true, project: true }
        });

        // Sync project budgetUsed for old and new projects
        const projectsToSync = new Set<string>();
        if (oldTx.projectId) projectsToSync.add(oldTx.projectId);
        if (transaction.projectId) projectsToSync.add(transaction.projectId);

        for (const pId of projectsToSync) {
            await syncProjectBudgetUsed(pId);
        }

        return res.json(transaction);
    } catch (error) {
        console.error("Error updating transaction:", error);
        return res.status(500).json({ error: "Failed to update transaction" });
    }
};
