import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  console.log('Seeding departments...');
  
  const departments = [
    { name: "สำนักอำนวยการ", subDepts: ["ผู้อำนวยการสำนัก", "รองผู้อำนวยการสำนัก", "หน่วยงานสนับสนุนและติดตาม", "หน่วยงานสมาชิกสัมพันธ์", "หน่วยงานสื่อองค์กร", "หน่วยงานงบประมาณ", "หน่วยงานวิชาการ"] },
    { name: "สมาคมพัฒนาเยาวชนมุสลิมไทย", subDepts: ["นายกสมาคมฯ", "อุปนายกสมาคมฯ", "สำนักเลขานุการและการจัดการ", "สำนักงบประมาณ", "สำนักวิชาการ", "สำนักสานสัมพันธ์เยาวชน", "สำนักสื่อและประชาสัมพันธ์", "สำนักบริหารโครงการ"] },
    { name: "สำนักกิจการสตรี สมาคมฯ", subDepts: ["ผู้อำนวยการสำนัก", "รองผู้อำนวยการสำนัก", "เลขานุการ", "เหรัญญิก", "หน่วยงานสื่อและประชาสัมพันธ์", "หน่วยงานบุคลากร", "หน่วยงานกิจกรรม", "หน่วยงานวิชาการ"] },
    { name: "ครอบครัวฟิตยะตุลฮัก", subDepts: ["ผู้จัดการครอบครัว", "เลขานุการและการเงิน", "หน่วยงานวิชาการและตัรบียะห์", "หน่วยงานสื่อ", "ที่ปรึกษาประจำสาขา"] },
  ];

  for (const dept of departments) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } });
    if (!existing) {
      await prisma.department.create({ data: dept });
      console.log(`  ✅ Created: ${dept.name}`);
    } else {
      console.log(`  ⏭️  Already exists: ${dept.name}`);
    }
  }

  console.log('\nSeeding document categories...');
  
  const categories = [
    "ประเภทเอกสารโครงการ",
    "ประเภทเอกสารรายงานผลการดำเนินโครงการ",
    "ประเภทเอกสารประกาศหรือคำสั่ง",
    "ประเภทเอกสารภายใน",
    "ประเภทเอกสารภายนอก",
  ];

  for (const name of categories) {
    const existing = await prisma.documentCategory.findUnique({ where: { name } });
    if (!existing) {
      await prisma.documentCategory.create({ data: { name } });
      console.log(`  ✅ Created: ${name}`);
    } else {
      console.log(`  ⏭️  Already exists: ${name}`);
    }
  }

  // Update admin user with department
  const adminDept = await prisma.department.findUnique({ where: { name: "สำนักอำนวยการ" } });
  if (adminDept) {
    await prisma.user.updateMany({
      where: { username: 'admin' },
      data: { departmentId: adminDept.id }
    });
    console.log('\n✅ Admin user linked to สำนักอำนวยการ');
  }

  console.log('\n🎉 Seed complete!');
  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
