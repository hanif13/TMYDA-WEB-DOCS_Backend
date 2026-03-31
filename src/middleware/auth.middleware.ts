import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

// Types for Hono context
export type Bindings = {
    DATABASE_URL: string;
    JWT_SECRET: string;
    CORS_ORIGIN: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
};

export type Variables = {
    user?: {
        userId: string;
        username: string;
        role: string;
        permissions: string[];
    };
};

export const authenticateToken = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const authHeader = c.req.header('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return c.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }, 401);
    }

    try {
        const secret = c.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ JWT_SECRET is not set in environment.');
            return c.json({ error: 'เซิร์ฟเวอร์ยังไม่พร้อมใช้งาน' }, 500);
        }

        const decoded = jwt.verify(token, secret) as any;
        c.set('user', decoded);
        await next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return c.json({ error: 'เซสชันหมดอายุหรือไม่มีสิทธิ์การเข้าถึง' }, 403);
    }
};

export const authorizeAdmin = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const user = c.get('user');
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return c.json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Admin Only)' }, 403);
    }
    await next();
};

export const authorizePermission = (permission: string) => {
    return async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
        const user = c.get('user');
        if (!user?.permissions.includes(permission) && user?.role !== 'SUPER_ADMIN') {
            return c.json({ error: `คุณไม่มีสิทธิ์ในการเข้าถึง (${permission})` }, 403);
        }
        await next();
    };
};
