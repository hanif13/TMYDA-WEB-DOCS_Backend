import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Initialize and get the Prisma Client with the provided database URL.
 * In Cloudflare Workers, we use the DATABASE_URL from the environment context.
 */
export const getPrisma = (databaseUrl: string): PrismaClient => {
    if (!prismaInstance) {
        if (!databaseUrl) {
            throw new Error("DATABASE_URL is missing in environment variables.");
        }
        const pool = new Pool({ connectionString: databaseUrl });
        const adapter = new PrismaPg(pool as any);
        prismaInstance = new PrismaClient({ adapter: adapter as any });
    }
    return prismaInstance;
};

// Exporting a placeholder for compatibility during the transition
export const prisma = {} as PrismaClient;
