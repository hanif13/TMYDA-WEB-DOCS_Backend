import { PrismaClient } from '@prisma/client';
import { context } from './context';

const createPrismaClient = () => {
    const client = new PrismaClient();
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const result = await query(args);

                    const writeOperations = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
                    
                    if (writeOperations.includes(operation) && model !== 'ActivityLog') {
                        const store = context.getStore();
                        const userId = store?.userId || null;
                        
                        // Fire and forget logging using the un-extended client
                        client.activityLog.create({
                            data: {
                                userId,
                                action: operation.toUpperCase(),
                                resource: model,
                                details: args as any,
                            }
                        }).catch(err => {
                            console.error('Failed to log activity:', err);
                        });
                    }
                    
                    return result;
                }
            }
        }
    });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const getPrisma = (databaseUrl?: string) => {
    return prisma;
};
