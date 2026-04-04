import { prisma } from '../lib/prisma';

/**
 * Recalculate and sync project.budgetUsed based on its transactions (expense - refund).
 * Then calls syncAnnualPlanTotalUsed.
 */
export async function syncProjectBudgetUsed(projectId: string) {
    const projectTx = await prisma.transaction.findMany({
        where: { projectId },
        select: { type: true, amount: true }
    });
    
    const expense = projectTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const refund = projectTx
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const project = await prisma.project.update({
        where: { id: projectId },
        data: { budgetUsed: expense - refund },
        select: { annualPlanId: true }
    });
    
    if (project.annualPlanId) {
        await syncAnnualPlanTotalUsed(project.annualPlanId);
    }
}

/**
 * Recalculate and sync annualPlan.totalUsed by summing budgetUsed and actualBudgetExternal of its projects.
 */
export async function syncAnnualPlanTotalUsed(annualPlanId: string) {
    const projects = await prisma.project.findMany({
        where: { annualPlanId },
        select: { budgetUsed: true, actualBudgetExternal: true }
    });
    
    const totalUsed = projects.reduce((sum, p) => 
        sum + (p.budgetUsed || 0) + (p.actualBudgetExternal || 0), 0
    );
    
    await prisma.annualPlan.update({
        where: { id: annualPlanId },
        data: { totalUsed }
    });
}
