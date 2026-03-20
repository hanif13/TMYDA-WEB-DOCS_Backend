import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: { username: 'test_admin' },
      update: {
        permissions: ['ACCESS_DASHBOARD', 'ACCESS_USERS', 'ACCESS_PROJECTS'],
        role: 'SUPER_ADMIN'
      },
      create: {
        username: 'test_admin',
        name: 'Test Administrator',
        passwordHash: 'dummy',
        role: 'SUPER_ADMIN',
        permissions: ['ACCESS_DASHBOARD', 'ACCESS_USERS', 'ACCESS_PROJECTS'],
      }
    });
    console.log('Created/Updated User:', user);
    const allUsers = await prisma.user.findMany();
    console.log('All Users:', allUsers);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
