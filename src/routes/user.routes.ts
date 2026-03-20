import { Router } from 'express';
import { getUsers, createUser, updatePermissions, deleteUser, updateUser } from '../controllers/user.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication and admin/super-admin role
router.get('/', authenticateToken, authorizeAdmin, getUsers);
router.post('/', authenticateToken, authorizeAdmin, createUser);
router.put('/:id', authenticateToken, authorizeAdmin, updateUser);
router.patch('/:id/permissions', authenticateToken, authorizeAdmin, updatePermissions);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteUser);

export default router;
