import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, password, role, name, department } = req.body;
        
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
        
        return res.status(201).json(newUser);
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Failed to create user" });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { username, password, role, name, department } = req.body;
        
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
        
        return res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.user.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: "Failed to delete user" });
    }
};

export const updatePermissions = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { permissions } = req.body;
        
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: "Permissions must be an array" });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { permissions },
            include: { department: true }
        });
        
        return res.json(updatedUser);
    } catch (error) {
        console.error("Error updating permissions:", error);
        return res.status(500).json({ error: "Failed to update permissions" });
    }
};
