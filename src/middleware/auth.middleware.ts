import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { prisma } from '../lib/prisma';

// Extend Express Request to include user
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
        permissions: string[];
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ JWT_SECRET is not set in environment.');
            return res.status(500).json({ error: 'เซิร์ฟเวอร์ยังไม่พร้อมใช้งาน' });
        }

        const decoded = jwt.verify(token, secret) as any;
        
        // 🚨 Security Fix: Verify that the user still exists in the database!
        const userInDb = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!userInDb) {
            return res.status(403).json({ error: 'บัญชีผู้ใช้นี้ถูกระงับหรือลบออกจากระบบแล้ว' });
        }

        // Sync fresh data from DB (in case admin changed their role mid-session)
        req.user = {
            userId: userInDb.id,
            username: userInDb.username,
            role: userInDb.role,
            permissions: userInDb.permissions
        };
        
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ error: 'เซสชันหมดอายุหรือไม่มีสิทธิ์การเข้าถึง' });
    }
};

// Allow SUPER_ADMIN and ADMIN
export const authorizeAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Admin Only)' });
    }
    next();
};

// Allow SUPER_ADMIN and FINANCE for finance write operations
export const authorizeFinance = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user?.role !== 'FINANCE' && user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Finance Only)' });
    }
    next();
};

// Allow SUPER_ADMIN only
export const authorizeSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Super Admin Only)' });
    }
    next();
};

export const authorizePermission = (permission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user?.permissions.includes(permission) && user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: `คุณไม่มีสิทธิ์ในการเข้าถึง (${permission})` });
        }
        next();
    };
};
