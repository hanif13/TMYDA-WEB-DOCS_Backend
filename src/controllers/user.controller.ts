import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { Bindings, Variables } from '../middleware/auth.middleware';

export const getUsers = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const users = await prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        return c.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return c.json({ error: "Failed to fetch users" }, 500);
    }
};

export const createUser = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const { username, password, role, name, department } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        let departmentId = department;
        if (department && department.length > 10) {
             // likely already an ID
        } else if (department) {
            const dept = await prisma.department.findUnique({ where: { name: department } });
            if (dept) departmentId = dept.id;
        }

        const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);
        
        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash,
                role: role || 'USER',
                name: name || username,
                departmentId: departmentId || null,
                permissions: role === 'SUPER_ADMIN' ? ['all'] : ['VIEW']
            },
            include: { department: true }
        });
        
        return c.json(newUser, 201);
    } catch (error) {
        console.error("Error creating user:", error);
        return c.json({ error: "Failed to create user" }, 500);
    }
};

export const updateUser = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const { username, password, role, name, department } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        let updateData: any = {};
        if (username) updateData.username = username;
        if (role) updateData.role = role;
        if (name) updateData.name = name;
        
        if (department) {
            if (department.length > 10) {
                updateData.departmentId = department;
            } else {
                const dept = await prisma.department.findUnique({ where: { name: department } });
                if (dept) updateData.departmentId = dept.id;
            }
        }

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { department: true }
        });
        
        return c.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return c.json({ error: "Failed to update user" }, 500);
    }
};

export const deleteUser = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const prisma = getPrisma(c.env.DATABASE_URL);
        await prisma.user.delete({ where: { id } });
        return c.body(null, 204);
    } catch (error) {
        console.error("Error deleting user:", error);
        return c.json({ error: "Failed to delete user" }, 500);
    }
};

export const updatePermissions = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const { permissions } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        if (!Array.isArray(permissions)) {
            return c.json({ error: "Permissions must be an array" }, 400);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { permissions },
            include: { department: true }
        });
        
        return c.json(updatedUser);
    } catch (error) {
        console.error("Error updating permissions:", error);
        return c.json({ error: "Failed to update permissions" }, 500);
    }
};
