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
exports.syncProjectBudgetUsed = syncProjectBudgetUsed;
exports.syncAnnualPlanTotalUsed = syncAnnualPlanTotalUsed;
const prisma_1 = require("../lib/prisma");
/**
 * Recalculate and sync project.budgetUsed based on its transactions (expense - refund).
 * Then calls syncAnnualPlanTotalUsed.
 */
function syncProjectBudgetUsed(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectTx = yield prisma_1.prisma.transaction.findMany({
            where: { projectId },
            select: { type: true, amount: true }
        });
        const expense = projectTx
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const refund = projectTx
            .filter(t => t.type === 'refund')
            .reduce((sum, t) => sum + t.amount, 0);
        const project = yield prisma_1.prisma.project.update({
            where: { id: projectId },
            data: { budgetUsed: expense - refund },
            select: { annualPlanId: true }
        });
        if (project.annualPlanId) {
            yield syncAnnualPlanTotalUsed(project.annualPlanId);
        }
    });
}
/**
 * Recalculate and sync annualPlan.totalUsed by summing budgetUsed and actualBudgetExternal of its projects.
 */
function syncAnnualPlanTotalUsed(annualPlanId) {
    return __awaiter(this, void 0, void 0, function* () {
        const projects = yield prisma_1.prisma.project.findMany({
            where: { annualPlanId },
            select: { budgetUsed: true, actualBudgetExternal: true }
        });
        const totalUsed = projects.reduce((sum, p) => sum + (p.budgetUsed || 0) + (p.actualBudgetExternal || 0), 0);
        yield prisma_1.prisma.annualPlan.update({
            where: { id: annualPlanId },
            data: { totalUsed }
        });
    });
}
