import { Router } from 'express';
import {
    registerMember,
    getMembers,
    getMemberStats,
    getMemberById,
    updateMemberStatus,
    deleteMember
} from '../controllers/member.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// ─── PUBLIC ROUTE (No Auth) ──────────────────────────────────
router.post('/register', registerMember);

// ─── PROTECTED ROUTES (Admin Only) ───────────────────────────
router.get('/', authenticateToken as any, authorizeAdmin as any, getMembers);
router.get('/stats', authenticateToken as any, authorizeAdmin as any, getMemberStats);
router.get('/:id', authenticateToken as any, authorizeAdmin as any, getMemberById);
router.patch('/:id/status', authenticateToken as any, authorizeAdmin as any, updateMemberStatus);
router.delete('/:id', authenticateToken as any, authorizeAdmin as any, deleteMember);

export default router;
