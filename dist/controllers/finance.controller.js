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
exports.deleteTransaction = exports.createTransaction = exports.getTransactions = void 0;
const prisma_1 = require("../lib/prisma");
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const filter = {};
        if (year)
            filter.thaiYear = Number(year);
        const transactions = yield prisma_1.prisma.transaction.findMany({
            where: filter,
            include: {
                department: true,
                project: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});
exports.getTransactions = getTransactions;
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, title, type, amount, category, docRef, months, departmentId, projectId } = req.body;
        // Handle file upload for slip
        const slipUrl = req.file ? `/uploads/documents/${req.file.filename}` : req.body.slipUrl;
        // Start a transaction to ensure data consistency
        const transaction = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const newTx = yield tx.transaction.create({
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
                const project = yield tx.project.findUnique({
                    where: { id: projectId },
                    select: { annualPlanId: true }
                });
                if (project) {
                    const adjustment = type === 'expense' ? Number(amount) : -Number(amount);
                    // Update project-level total
                    yield tx.project.update({
                        where: { id: projectId },
                        data: { budgetUsed: { increment: adjustment } }
                    });
                    // Update annual plan total
                    yield tx.annualPlan.update({
                        where: { id: project.annualPlanId },
                        data: { totalUsed: { increment: adjustment } }
                    });
                }
            }
            return newTx;
        }));
        res.status(201).json(transaction);
    }
    catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
});
exports.createTransaction = createTransaction;
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = yield tx.transaction.findUnique({
                where: { id: String(id) },
                include: { project: true }
            });
            if (!transaction) {
                throw new Error("Transaction not found");
            }
            // Reverse budget updates
            if (transaction.projectId && (transaction.type === 'expense' || transaction.type === 'refund' || transaction.type === 'income')) {
                const adjustment = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
                yield tx.project.update({
                    where: { id: transaction.projectId },
                    data: { budgetUsed: { increment: adjustment } }
                });
                // Update annual plan total
                const txWithProject = transaction;
                if (txWithProject.project) {
                    yield tx.annualPlan.update({
                        where: { id: txWithProject.project.annualPlanId },
                        data: { totalUsed: { increment: adjustment } }
                    });
                }
            }
            yield tx.transaction.delete({ where: { id: String(id) } });
        }));
        res.json({ message: "Transaction deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: error.message || "Failed to delete transaction" });
    }
});
exports.deleteTransaction = deleteTransaction;
