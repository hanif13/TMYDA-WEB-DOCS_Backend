import { Router } from 'express';
import { getUsers, createUser, updatePermissions, deleteUser, updateUser } from '../controllers/user.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication and admin/super-admin role
router.use(authenticateToken as any, authorizeAdmin as any);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/permissions', updatePermissions);
router.delete('/:id', deleteUser);

export default router;
