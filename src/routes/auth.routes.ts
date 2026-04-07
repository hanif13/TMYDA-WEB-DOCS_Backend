import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { error: 'กรุณารอสักครู่ (15 นาที) ก่อนพยายามล็อกอินใหม่อีกครั้ง เนื่องจากมีการเข้าสู่ระบบผิดพลาดหลายครั้ง' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, login);

export default router;
