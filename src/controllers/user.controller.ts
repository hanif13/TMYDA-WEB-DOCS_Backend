import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        
        // Remove passwordHash before sending
        const safeUsers = users.map(({ passwordHash, ...user }) => user);
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, password, name, role, permissions, departmentId } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash,
                name,
                role: (role as string) || 'USER',
                permissions: (permissions as string[]) || ['VIEW'],
                departmentId
            }
        });

        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' });
    }
};

export const updatePermissions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { permissions, role } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: id as string },
            data: { 
                permissions: permissions as string[], 
                role: role as string 
            }
        });

        const { passwordHash, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถอัปเดตสิทธิ์ได้' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, name, role, permissions, departmentId, password } = req.body;

        const data: any = {
            username,
            name,
            role,
            permissions,
            departmentId
        };

        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: id as string },
            data
        });

        const { passwordHash, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Prevent deleting self? or strictly super-admin can delete anyone?
        // For simplicity, just delete.
        await prisma.user.delete({ where: { id: id as string } });
        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
    }
};
