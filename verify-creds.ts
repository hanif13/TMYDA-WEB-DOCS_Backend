import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'Super Admin(hanif)';
  const password = 'hanif1303259';
  
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log(`User "${username}" not found in database.`);
    return;
  }

  console.log(`User "${username}" found.`);
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log(`Password "${password}" is valid: ${isValid}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
