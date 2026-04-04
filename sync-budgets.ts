import { prisma } from './src/lib/prisma';
import { syncAnnualPlanTotalUsed } from './src/utils/budget.sync';

async function main() {
    console.log("Starting full budget sync...");
    const plans = await prisma.annualPlan.findMany({ select: { id: true, thaiYear: true } });
    
    for (const plan of plans) {
        console.log(`Syncing budget for Year ${plan.thaiYear}...`);
        await syncAnnualPlanTotalUsed(plan.id);
    }
    
    console.log("Full sync completed!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
