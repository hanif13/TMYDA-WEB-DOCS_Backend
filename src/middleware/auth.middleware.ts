import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
        permissions: string[];
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error("[AUTH DEBUG] Token verification failed:", err.message);
            return res.status(403).json({ error: 'เซสชันหมดอายุหรือไม่มีสิทธิ์การเข้าถึง' });
        }
        req.user = user;
        next();
    });
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Admin Only)' });
    }
    next();
};

export const authorizePermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user?.permissions.includes(permission) && req.user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: `คุณไม่มีสิทธิ์ในการเข้าถึง (${permission})` });
        }
        next();
    };
};
