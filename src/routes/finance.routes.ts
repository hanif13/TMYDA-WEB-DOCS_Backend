import { Hono } from 'hono';
import { getTransactions, createTransaction, deleteTransaction } from '../controllers/finance.controller';
import { authorizeAdmin, Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.get('/', getTransactions);
router.post('/', authorizeAdmin, createTransaction);
router.delete('/:id', authorizeAdmin, deleteTransaction);

export default router;
