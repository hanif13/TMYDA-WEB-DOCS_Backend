import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  // ลบ user เก่าที่สร้างไว้ (ถ้ามี)
  await prisma.user.deleteMany({ where: { username: 'admin' } }).catch(() => {});
  
  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);
  
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hash,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      permissions: ['VIEW', 'EDIT', 'DELETE'],
    }
  });
  
  console.log('User created successfully:', user);
  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
