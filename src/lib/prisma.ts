import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Compatibility helper for the migration from the Hono context.
 * In Express/Node.js, we use the singleton prisma instance directly.
 */
export const getPrisma = (databaseUrl?: string): PrismaClient => {
    return prisma;
};
