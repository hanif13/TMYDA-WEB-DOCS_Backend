import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const normalizedUsername = username?.trim();
        console.log(`Login attempt for: ${normalizedUsername}`);

        const user = await prisma.user.findUnique({
            where: { username: normalizedUsername },
            include: { department: true }
        });

        if (!user) {
            console.log(`User not found: ${username}`);
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        console.log(`User found. Checking password...`);
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        console.log(`Password valid: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role,
                permissions: user.permissions 
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: user.permissions,
                department: user.department?.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
};
