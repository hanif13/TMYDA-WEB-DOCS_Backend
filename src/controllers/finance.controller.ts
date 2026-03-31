import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import { uploadToSupabase } from '../lib/supabase';
import { Bindings, Variables } from '../middleware/auth.middleware';

export const getTransactions = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const year = c.req.query('year');
        const prisma = getPrisma(c.env.DATABASE_URL);
        const where: any = {};
        if (year) where.thaiYear = Number(year);

        const transactions = await prisma.transaction.findMany({
            where,
            include: { department: true, category: true },
            orderBy: { date: 'desc' }
        });
        return c.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return c.json({ error: "Failed to fetch transactions" }, 500);
    }
};

export const createTransaction = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const formData = await c.req.formData();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const date = formData.get('date') as string;
        const type = formData.get('type') as 'INCOME' | 'EXPENSE';
        const departmentId = formData.get('departmentId') as string;
        const categoryId = formData.get('categoryId') as string;
        const amount = formData.get('amount') as string;
        const description = formData.get('description') as string;
        const file = formData.get('evidence') as File;
        const thaiYear = formData.get('thaiYear') || formData.get('year');

        let evidenceUrl = "";
        if (file && file.size > 0) {
            const fileName = `fin-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
            const buffer = await file.arrayBuffer();
            evidenceUrl = await uploadToSupabase('uploads', `finance/${fileName}`, new Uint8Array(buffer), file.type, c.env);
        }

        const transaction = await prisma.transaction.create({
            data: {
                date: new Date(date),
                type,
                departmentId,
                categoryId,
                amount: Number(amount),
                description: description || "",
                evidenceUrl,
                thaiYear: thaiYear ? Number(thaiYear) : 2569
            },
            include: { department: true, category: true }
        });
        
        return c.json(transaction, 201);
    } catch (error) {
        console.error("Error creating transaction:", error);
        return c.json({ error: "Failed to create transaction" }, 500);
    }
};

export const deleteTransaction = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const prisma = getPrisma(c.env.DATABASE_URL);
        await prisma.transaction.delete({ where: { id } });
        return c.body(null, 204);
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return c.json({ error: "Failed to delete transaction" }, 500);
    }
};

export const getFinanceCategories = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const categories = await prisma.transactionCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return c.json(categories);
    } catch (error) {
        console.error("Error fetching finance categories:", error);
        return c.json({ error: "Failed to fetch categories" }, 500);
    }
};

export const getFinanceSummary = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const year = c.req.query('year');
        const prisma = getPrisma(c.env.DATABASE_URL);
        const where: any = {};
        if (year) where.thaiYear = Number(year);

        const transactions = await prisma.transaction.findMany({ where });
        
        const summary = transactions.reduce((acc, curr) => {
            if (curr.type === 'INCOME') acc.totalIncome += curr.amount;
            else acc.totalExpense += curr.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        return c.json({
            ...summary,
            balance: summary.totalIncome - summary.totalExpense
        });
    } catch (error) {
        console.error("Error fetching finance summary:", error);
        return c.json({ error: "Failed to fetch summary" }, 500);
    }
};
