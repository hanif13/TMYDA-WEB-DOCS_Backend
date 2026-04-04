import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB Seed...");

    // Seed Departments (Check if they exist first)
    const departments = [
        { id: "admin", name: "สำนักอำนวยการ", theme: "amber", subDepts: ["ผู้อำนวยการสำนัก", "รองผู้อำนวยการสำนัก", "หน่วยงานสนับสนุนและติดตาม", "หน่วยงานสมาชิกสัมพันธ์", "หน่วยงานสื่อองค์กร", "หน่วยงานงบประมาณ", "หน่วยงานวิชาการ"] },
        { id: "tmyda", name: "สมาคมพัฒนาเยาวชนมุสลิมไทย", theme: "blue", subDepts: ["นายกสมาคมฯ", "อุปนายกสมาคมฯ", "สำนักเลขานุการและการจัดการ", "สำนักงบประมาณ", "สำนักวิชาการ", "สำนักสานสัมพันธ์เยาวชน", "สำนักสื่อและประชาสัมพันธ์", "สำนักบริหารโครงการ"] },
        { id: "women", name: "สำนักกิจการสตรี สมาคมฯ", theme: "pink", subDepts: ["ผู้อำนวยการสำนัก", "รองผู้อำนวยการสำนัก", "เลขานุการ", "เหรัญญิก", "หน่วยงานสื่อและประชาสัมพันธ์", "หน่วยงานบุคลากร", "หน่วยงานกิจกรรม", "หน่วยงานวิชาการ"] },
        { id: "family", name: "ครอบครัวฟิตยะตุลฮัก", theme: "emerald", subDepts: ["ผู้จัดการครอบครัว", "เลขานุการและการเงิน", "หน่วยงานวิชาการและตัรบียะห์", "หน่วยงานสื่อ", "ที่ปรึกษาประจำสาขา"] }
    ];

    for (const dept of departments) {
        const existing = await prisma.department.findUnique({ where: { id: dept.id } });
        if (!existing) {
            await prisma.department.create({ data: dept });
            console.log(`✅ Created Dept: ${dept.name}`);
        } else {
            console.log(`⌛ Dept already exists: ${dept.name}`);
        }
    }

    // Seed Admin User (Check if admin exists first)
    const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash("password123", 10);
        await prisma.user.create({
            data: {
                username: "admin",
                passwordHash: passwordHash,
                name: "ผู้ดูแลระบบ (Super Admin)",
                role: "SUPER_ADMIN",
                permissions: ["VIEW", "EDIT", "MANAGE_USERS"],
                departmentId: "admin"
            }
        });
        console.log("✅ Created Admin User: admin");
    } else {
        console.log("⌛ Admin user already exists.");
    }

    // Seed Categories
    const categories = [
        "ประเภทเอกสารโครงการ",
        "ประเภทเอกสารรายงานผลการดำเนินโครงการ",
        "ประเภทเอกสารภายใน",
        "ประเภทเอกสารประกาศหรือคำสั่ง",
        "ประเภทเอกสารภายนอก"
    ];

    for (const name of categories) {
        const existing = await prisma.documentCategory.findUnique({ where: { name } });
        if (!existing) {
            await prisma.documentCategory.create({ data: { name } });
            console.log(`✅ Created Category: ${name}`);
        }
    }

    // Seed Plans
    const plans = [
        { year: 2024, thaiYear: 2567, label: "แผนงานและโครงการประจำปี พ.ศ. 2567", totalBudget: 400000, totalUsed: 350000 },
        { year: 2025, thaiYear: 2568, label: "แผนงานและโครงการประจำปี พ.ศ. 2568", totalBudget: 450000, totalUsed: 200000 },
        { year: 2026, thaiYear: 2569, label: "แผนงานและโครงการประจำปี พ.ศ. 2569", totalBudget: 480000, totalUsed: 0 }
    ];

    for (const plan of plans) {
        const existing = await prisma.annualPlan.findUnique({ where: { year: plan.year } });
        if (!existing) {
            await prisma.annualPlan.create({ data: plan });
            console.log(`✅ Created Plan: ${plan.thaiYear}`);
        }
    }

    console.log("DB Seed Sync Completed!");
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
