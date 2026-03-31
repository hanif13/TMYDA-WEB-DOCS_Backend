import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction, getFinanceCategories, getFinanceSummary } from '../controllers/finance.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getTransactions);
router.get('/categories', getFinanceCategories);
router.get('/summary', getFinanceSummary);

router.post('/', authenticateToken as any, authorizeAdmin as any, upload.single('evidence'), createTransaction);
router.delete('/:id', authenticateToken as any, authorizeAdmin as any, deleteTransaction);

export default router;
