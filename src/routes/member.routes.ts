import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    registerMember,
    getMembers,
    getMemberStats,
    getMemberById,
    updateMemberStatus,
    deleteMember
} from '../controllers/member.controller';
import { authenticateToken, authorizePermission } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for member photo upload
const memberUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for member photos
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp) เท่านั้น'));
    }
});

// ─── PUBLIC ROUTE (No Auth) ──────────────────────────────────
router.post('/register', memberUpload.single('photo'), registerMember);

// ─── PROTECTED ROUTES ───────────────────────────
router.get('/', authenticateToken as any, authorizePermission('members.view') as any, getMembers);
router.get('/stats', authenticateToken as any, authorizePermission('members.view') as any, getMemberStats);
router.get('/:id', authenticateToken as any, authorizePermission('members.view') as any, getMemberById);
router.patch('/:id/status', authenticateToken as any, authorizePermission('members.edit') as any, updateMemberStatus);
router.delete('/:id', authenticateToken as any, authorizePermission('members.edit') as any, deleteMember);

export default router;
