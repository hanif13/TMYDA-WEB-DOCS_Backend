import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        const filter: any = {};
        if (year) filter.thaiYear = Number(year);

        const transactions = await prisma.transaction.findMany({
            where: filter,
            include: {
                department: true,
                project: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { date, title, type, amount, category, docRef, months, departmentId, projectId } = req.body;
        
        // Handle file upload for slip
        const slipUrl = req.file ? `/uploads/documents/${req.file.filename}` : req.body.slipUrl;

        // Start a transaction to ensure data consistency
        const transaction = await prisma.$transaction(async (tx) => {
            const newTx = await tx.transaction.create({
                data: {
                    date,
                    title,
                    type, // 'income', 'expense', or 'refund'
                    amount: Number(amount),
                    category: category || 'general',
                    docRef,
                    slipUrl,
                    months: typeof months === 'string' ? JSON.parse(months) : (months || []),
                    departmentId,
                    projectId: projectId || null,
                    thaiYear: req.body.thaiYear ? Number(req.body.thaiYear) : (req.body.year ? Number(req.body.year) : 2569)
                },
                include: {
                    department: true,
                    project: true,
                }
            });

            // Update Project and AnnualPlan budget usage for expense, refund, or project-related income
            if (projectId && (type === 'expense' || type === 'refund' || type === 'income')) {
                const project = await tx.project.findUnique({
                    where: { id: projectId },
                    select: { annualPlanId: true }
                });

                if (project) {
                    const adjustment = type === 'expense' ? Number(amount) : -Number(amount);
                    
                    // Update project-level total
                    await tx.project.update({
                        where: { id: projectId },
                        data: { budgetUsed: { increment: adjustment } }
                    });

                    // Update annual plan total
                    await tx.annualPlan.update({
                        where: { id: project.annualPlanId },
                        data: { totalUsed: { increment: adjustment } }
                    });
                }
            }

            return newTx;
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: String(id) },
                include: { project: true }
            });

            if (!transaction) {
                throw new Error("Transaction not found");
            }

            // Reverse budget updates
            if (transaction.projectId && (transaction.type === 'expense' || transaction.type === 'refund' || transaction.type === 'income')) {
                const adjustment = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
                
                await tx.project.update({
                    where: { id: transaction.projectId },
                    data: { budgetUsed: { increment: adjustment } }
                });

                // Update annual plan total
                const txWithProject = transaction as any;
                if (txWithProject.project) {
                     await tx.annualPlan.update({
                        where: { id: txWithProject.project.annualPlanId },
                        data: { totalUsed: { increment: adjustment } }
                    });
                }
            }

            await tx.transaction.delete({ where: { id: String(id) } });
        });

        res.json({ message: "Transaction deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: error.message || "Failed to delete transaction" });
    }
};
