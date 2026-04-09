import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const username = 'Super Admin(hanif)';
  const newPassword = 'hanif1303259';
  
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.error(`User "${username}" not found.`);
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`✅ Password for "${username}" has been reset to "${newPassword}".`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
