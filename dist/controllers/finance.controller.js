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
exports.updateTransaction = exports.getFinanceSummary = exports.getFinanceCategories = exports.deleteTransaction = exports.createTransaction = exports.getTransactions = void 0;
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../lib/supabase");
const budget_sync_1 = require("../utils/budget.sync");
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const where = {};
        if (year)
            where.thaiYear = Number(year);
        const transactions = yield prisma_1.prisma.transaction.findMany({
            where,
            include: { department: true, project: true },
            orderBy: { date: 'desc' }
        });
        return res.json(transactions);
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({ error: "Failed to fetch transactions" });
    }
});
exports.getTransactions = getTransactions;
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, type, departmentId, category, amount, title, thaiYear, year: yearBody, docRef, projectId, months, note } = req.body;
        const file = req.file;
        console.log("Create Transaction - Body:", req.body);
        console.log("Create Transaction - File:", file ? { name: file.originalname, size: file.size, mimetype: file.mimetype } : "No file");
        let slipUrl = "";
        if (file) {
            try {
                const extension = file.originalname.split('.').pop();
                const fileName = `fin-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
                const { data, error } = yield supabase_1.supabaseAdmin.storage
                    .from('uploads')
                    .upload(`finance/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });
                if (error) {
                    console.error("Supabase Storage Error:", error);
                    throw error;
                }
                const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
                    .from('uploads')
                    .getPublicUrl(`finance/${fileName}`);
                slipUrl = publicUrl;
                console.log("Uploaded Slip URL:", slipUrl);
            }
            catch (storageErr) {
                console.error("Storage Processing Failed:", storageErr);
                return res.status(500).json({ error: "Failed to process file upload", detail: storageErr.message });
            }
        }
        const thaiYearVal = thaiYear || yearBody;
        const transaction = yield prisma_1.prisma.transaction.create({
            data: {
                date: date,
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
                recordedBy: req.body.recordedBy || "",
                slipUrl,
                thaiYear: thaiYearVal ? Number(thaiYearVal) : 2569
            },
            include: { department: true, project: true }
        });
        // Sync project budgetUsed if linked to a project
        if (transaction.projectId) {
            yield (0, budget_sync_1.syncProjectBudgetUsed)(transaction.projectId);
        }
        return res.status(201).json(transaction);
    }
    catch (error) {
        console.error("Error creating transaction (FULL DETAIL):", {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        return res.status(500).json({ error: "Failed to create transaction", detail: error.message });
    }
});
exports.createTransaction = createTransaction;
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // Find the transaction first to get projectId before deleting
        const tx = yield prisma_1.prisma.transaction.findUnique({ where: { id } });
        yield prisma_1.prisma.transaction.delete({ where: { id } });
        // Sync project budgetUsed if it was linked to a project
        if (tx === null || tx === void 0 ? void 0 : tx.projectId) {
            yield (0, budget_sync_1.syncProjectBudgetUsed)(tx.projectId);
        }
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting transaction:", error);
        return res.status(500).json({ error: "Failed to delete transaction" });
    }
});
exports.deleteTransaction = deleteTransaction;
const getFinanceCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Since TransactionCategory model doesn't exist, we'll return unique categories from Transactions
        const transactions = yield prisma_1.prisma.transaction.findMany({
            select: { category: true },
            distinct: ['category']
        });
        const categories = transactions
            .map((t) => ({ name: t.category }))
            .filter((c) => c.name !== null);
        return res.json(categories);
    }
    catch (error) {
        console.error("Error fetching finance categories:", error);
        return res.status(500).json({ error: "Failed to fetch categories" });
    }
});
exports.getFinanceCategories = getFinanceCategories;
const getFinanceSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const where = {};
        if (year)
            where.thaiYear = Number(year);
        const transactions = yield prisma_1.prisma.transaction.findMany({ where });
        const summary = transactions.reduce((acc, curr) => {
            const type = (curr.type || "").toUpperCase();
            if (type === 'INCOME')
                acc.totalIncome += curr.amount;
            else if (type === 'EXPENSE')
                acc.totalExpense += curr.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });
        return res.json(Object.assign(Object.assign({}, summary), { balance: summary.totalIncome - summary.totalExpense }));
    }
    catch (error) {
        console.error("Error fetching finance summary:", error);
        return res.status(500).json({ error: "Failed to fetch summary" });
    }
});
exports.getFinanceSummary = getFinanceSummary;
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        const { date, type, departmentId, category, amount, title, thaiYear, docRef, projectId, months, note, recordedBy } = req.body;
        const file = req.file;
        console.log(`Update Transaction ${id} - Body:`, req.body);
        console.log(`Update Transaction ${id} - File:`, file ? { name: file.originalname, size: file.size } : "No file");
        const oldTx = yield prisma_1.prisma.transaction.findUnique({ where: { id } });
        if (!oldTx)
            return res.status(404).json({ error: "Transaction not found" });
        let slipUrl = oldTx.slipUrl;
        if (file) {
            try {
                const extension = file.originalname.split('.').pop();
                const fileName = `fin-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
                const { data, error } = yield supabase_1.supabaseAdmin.storage
                    .from('uploads')
                    .upload(`finance/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });
                if (error) {
                    console.error("Supabase Storage Error (Update):", error);
                    throw error;
                }
                const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
                    .from('uploads')
                    .getPublicUrl(`finance/${fileName}`);
                slipUrl = publicUrl;
                console.log("Updated Slip URL:", slipUrl);
            }
            catch (storageErr) {
                console.error("Storage Processing Failed (Update):", storageErr);
                return res.status(500).json({ error: "Failed to process file update", detail: storageErr.message });
            }
        }
        const transaction = yield prisma_1.prisma.transaction.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (date && { date: date })), (type && { type })), (departmentId && { departmentId })), (projectId !== undefined && { projectId: projectId || null })), (months && { months: typeof months === 'string' ? JSON.parse(months) : months })), (note !== undefined && { note: note || "" })), (category && { category })), (amount !== undefined && { amount: Number(amount) })), { title: title || undefined }), (docRef !== undefined && { docRef: docRef || "" })), (req.body.claimedBy !== undefined && { claimedBy: req.body.claimedBy || "" })), (recordedBy !== undefined && { recordedBy: recordedBy || "" })), { slipUrl }), (thaiYear && { thaiYear: Number(thaiYear) })),
            include: { department: true, project: true }
        });
        // Sync project budgetUsed for old and new projects
        const projectsToSync = new Set();
        if (oldTx.projectId)
            projectsToSync.add(oldTx.projectId);
        if (transaction.projectId)
            projectsToSync.add(transaction.projectId);
        for (const pId of projectsToSync) {
            yield (0, budget_sync_1.syncProjectBudgetUsed)(pId);
        }
        return res.json(transaction);
    }
    catch (error) {
        console.error("Error updating transaction (FULL DETAIL):", {
            id,
            message: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: "Failed to update transaction", detail: error.message });
    }
});
exports.updateTransaction = updateTransaction;
