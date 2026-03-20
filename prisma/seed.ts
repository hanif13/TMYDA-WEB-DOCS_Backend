import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
    console.log("Starting DB Seed...");

    // Cleanup existing data
    await prisma.transaction.deleteMany();
    await prisma.project.deleteMany();
    await prisma.annualPlan.deleteMany();
    await prisma.document.deleteMany();
    await prisma.documentCategory.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    // Seed Departments
    const dept1 = await prisma.department.create({
        data: {
            id: "admin",
            name: "สำนักอำนวยการ",
            theme: "amber",
            subDepts: ["ผู้อำนวยการสำนัก", "รองผู้อำนวยการสำนัก", "หน่วยงานสนับสนุนและติดตาม", "หน่วยงานสมาชิกสัมพันธ์", "หน่วยงานสื่อองค์กร", "หน่วยงานงบประมาณ", "หน่วยงานวิชาการ"]
        }
    });
    console.log(`Created Dept: ${dept1.name}`);

    const dept2 = await prisma.department.create({
        data: {
            id: "tmyda",
            name: "สมาคมพัฒนาเยาวชนมุสลิมไทย",
            theme: "blue",
            subDepts: ["นายกสมาคมฯ", "อุปนายกสมาคมฯ", "สำนักเลขานุการและการจัดการ", "สำนักงบประมาณ", "สำนักวิชาการ", "สำนักสานสัมพันธ์เยาวชน", "สำนักสื่อและประชาสัมพันธ์", "สำนักบริหารโครงการ"]
        }
    });
    console.log(`Created Dept: ${dept2.name}`);

    const dept3 = await prisma.department.create({
        data: {
            id: "women",
            name: "สำนักกิจการสตรี สมาคมฯ",
            theme: "pink",
            subDepts: ["ผู้อำนวยการสำนัก", "รองผู้อำนวยการสำนัก", "เลขานุการ", "เหรัญญิก", "หน่วยงานสื่อและประชาสัมพันธ์", "หน่วยงานบุคลากร", "หน่วยงานกิจกรรม", "หน่วยงานวิชาการ"]
        }
    });
    console.log(`Created Dept: ${dept3.name}`);

    const dept4 = await prisma.department.create({
        data: {
            id: "family",
            name: "ครอบครัวฟิตยะตุลฮัก",
            theme: "emerald",
            subDepts: ["ผู้จัดการครอบครัว", "เลขานุการและการเงิน", "หน่วยงานวิชาการและตัรบียะห์", "หน่วยงานสื่อ", "ที่ปรึกษาประจำสาขา"]
        }
    });
    console.log(`Created Dept: ${dept4.name}`);

    // Seed User
    const passwordHash = await bcrypt.hash("password123", 10);
    const admin = await prisma.user.create({
        data: {
            username: "admin",
            passwordHash: passwordHash,
            name: "ผู้ดูแลระบบ (Super Admin)",
            role: "SUPER_ADMIN",
            permissions: ["VIEW", "EDIT", "MANAGE_USERS"],
            departmentId: dept1.id
        }
    });

    // Seed Categories
    const catProject = await prisma.documentCategory.create({
        data: { name: "ประเภทเอกสารโครงการ" }
    });
    const catReport = await prisma.documentCategory.create({
        data: { name: "ประเภทเอกสารรายงานผลการดำเนินโครงการ" }
    });

    const catInternal = await prisma.documentCategory.create({
        data: { name: "ประเภทเอกสารภายใน" }
    });
    const catExternal = await prisma.documentCategory.create({
        data: { name: "ประเภทเอกสารภายนอก" }
    });

    // Seed Plans
    const plan2569 = await prisma.annualPlan.create({
        data: {
            year: 2026,
            thaiYear: 2569,
            label: "แผนงานและโครงการประจำปี พ.ศ. 2569",
            totalBudget: 480000,
            totalUsed: 120000
        }
    });
    console.log("Plans created.");

    // Seed Project
    await prisma.project.create({
        data: {
            name: "อบรมจิตอาสาชุมชน",
            departmentId: dept1.id,
            projectType: "โครงการในแผน",
            lead: "ผอ.สมชาย",
            budget: 10000,
            quarter: 1,
            annualPlanId: plan2569.id
        }
    });
    
    console.log("DB Seed Completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
