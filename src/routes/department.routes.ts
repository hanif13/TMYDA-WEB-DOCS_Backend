import { Hono } from 'hono';
import { getDepartments } from '../controllers/department.controller';
import { Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.get('/', getDepartments);

export default router;
