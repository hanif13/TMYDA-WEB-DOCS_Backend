import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  console.log('Departments in DB:', JSON.stringify(depts, null, 2));
}

main().catch(console.error);
