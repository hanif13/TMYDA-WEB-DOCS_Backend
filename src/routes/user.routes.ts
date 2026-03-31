import { Hono } from 'hono';
import { getUsers, createUser, updatePermissions, deleteUser, updateUser } from '../controllers/user.controller';
import { authenticateToken, authorizeAdmin, Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// All user routes require authentication and admin/super-admin role
// In Hono, we can apply middleware at the router level
router.use('*', authenticateToken, authorizeAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/permissions', updatePermissions);
router.delete('/:id', deleteUser);

export default router;
