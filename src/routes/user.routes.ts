import { Router } from 'express';
import { 
    getUsers, createUser, updatePermissions, deleteUser, 
    updateUser, changePassword, getProfile, updateMe,
    bulkUploadUsers, getPermissionsCatalog
} from '../controllers/user.controller';
import { authenticateToken, authorizePermission } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Permissions catalog (any authenticated user)
router.get('/permissions-catalog', authenticateToken as any, getPermissionsCatalog);

// Self-service routes (any authenticated user)
router.get('/me', authenticateToken as any, getProfile);
router.put('/me', authenticateToken as any, updateMe);
router.put('/me/password', authenticateToken as any, changePassword);

// Admin routes (GET for users.view, others for users.edit)
router.get('/', authenticateToken as any, authorizePermission('users.view') as any, getUsers);
router.post('/', authenticateToken as any, authorizePermission('users.edit') as any, createUser);
router.post('/upload', authenticateToken as any, authorizePermission('users.edit') as any, upload.single('file'), bulkUploadUsers);
router.put('/:id', authenticateToken as any, authorizePermission('users.edit') as any, updateUser);
router.delete('/:id', authenticateToken as any, authorizePermission('users.edit') as any, deleteUser);
router.patch('/:id/permissions', authenticateToken as any, authorizePermission('users.edit') as any, updatePermissions);

export default router;
