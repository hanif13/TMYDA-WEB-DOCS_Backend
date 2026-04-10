
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- Connected Database Users ---');
    users.forEach(u => {
      const usernameHex = Buffer.from(u.username).toString('hex');
      console.log(`Username: "${u.username}" (Hex: ${usernameHex}), Role: ${u.role}`);
    });
    console.log('-------------------------------');
  } catch (e) {
    console.error('Database connection error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
