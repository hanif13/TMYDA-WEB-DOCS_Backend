import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Bindings, Variables } from '../middleware/auth.middleware';

export const login = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const { username, password } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        const normalizedUsername = username?.trim();

        if (!normalizedUsername || !password) {
            return c.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, 400);
        }

        const user = await prisma.user.findUnique({
            where: { username: normalizedUsername },
            include: { department: true }
        });

        if (!user) {
            return c.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
            return c.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
        }

        const secret = c.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ JWT_SECRET is not set in environment.');
            return c.json({ error: 'เซิร์ฟเวอร์ยังไม่พร้อมใช้งาน' }, 500);
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role,
                permissions: user.permissions 
            },
            secret,
            { expiresIn: '7d' }
        );

        return c.json({
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
        console.error('Login error details:', error);
        return c.json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, 500);
    }
};
