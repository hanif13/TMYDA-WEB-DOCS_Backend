import { Router } from 'express';
import { 
    getUsers, createUser, updatePermissions, deleteUser, 
    updateUser, changePassword, getProfile, updateMe,
    bulkUploadUsers 
} from '../controllers/user.controller';
import { authenticateToken, authorizeAdmin, authorizeSuperAdmin } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Self-service routes (any authenticated user)
router.get('/me', authenticateToken as any, getProfile);
router.put('/me', authenticateToken as any, updateMe);
router.put('/me/password', authenticateToken as any, changePassword);

// Admin routes (SUPER_ADMIN only for user management)
router.get('/', authenticateToken as any, authorizeSuperAdmin as any, getUsers);
router.post('/', authenticateToken as any, authorizeSuperAdmin as any, createUser);
router.post('/upload', authenticateToken as any, authorizeSuperAdmin as any, upload.single('file'), bulkUploadUsers);
router.put('/:id', authenticateToken as any, authorizeSuperAdmin as any, updateUser);
router.patch('/:id/permissions', authenticateToken as any, authorizeSuperAdmin as any, updatePermissions);
router.delete('/:id', authenticateToken as any, authorizeSuperAdmin as any, deleteUser);

export default router;
