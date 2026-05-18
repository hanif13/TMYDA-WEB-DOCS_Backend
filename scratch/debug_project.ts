import { prisma } from '../src/lib/prisma';

async function main() {
    try {
        const project = await prisma.project.findFirst({
            where: {
                name: {
                    contains: "อัลมะดาริจ"
                }
            },
            include: {
                department: true,
                annualPlan: true
            }
        });
        console.log("PROJECT DETAILS:", JSON.stringify(project, null, 2));

        const depts = await prisma.department.findMany({
            where: {
                name: project?.department?.name
            }
        });
        console.log("ALL DEPARTMENTS WITH THIS NAME:", JSON.stringify(depts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
