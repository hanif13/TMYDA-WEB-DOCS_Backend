import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import { Bindings, Variables } from '../middleware/auth.middleware';

export const getDepartments = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' }
        });
        return c.json(departments);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return c.json({ error: "Failed to fetch departments" }, 500);
    }
};
