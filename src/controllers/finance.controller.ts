import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        const where: any = {};
        if (year) where.thaiYear = Number(year);

        const transactions = await prisma.transaction.findMany({
            where,
            include: { department: true }, // removed category include as it's a string field
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
        const { date, type, departmentId, category, amount, title, thaiYear, year: yearBody, docRef } = req.body;
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
                category: category || "",
                amount: Number(amount),
                title: title || "",
                docRef: docRef || "",
                slipUrl,
                thaiYear: thaiYearVal ? Number(thaiYearVal) : 2569
            },
            include: { department: true }
        });
        
        return res.status(201).json(transaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
        return res.status(500).json({ error: "Failed to create transaction" });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.transaction.delete({ where: { id } });
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
            if (curr.type === 'INCOME') acc.totalIncome += curr.amount;
            else acc.totalExpense += curr.amount;
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
