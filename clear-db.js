const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing projects...');
    const deletedProjects = await prisma.project.deleteMany({});
    console.log(`Deleted ${deletedProjects.count} projects.`);

    console.log('Clearing annual plans...');
    const deletedPlans = await prisma.annualPlan.deleteMany({});
    console.log(`Deleted ${deletedPlans.count} annual plans.`);
}

main()
    .catch(err => {
        console.error('Error clearing data:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
