import { Hono } from 'hono';
import { login } from '../controllers/auth.controller';
import { Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.post('/login', login);

export default router;
