import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction, getFinanceCategories, getFinanceSummary } from '../controllers/finance.controller';
import { authenticateToken, authorizeFinance } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

// Read routes — any authenticated user can view
router.get('/', getTransactions);
router.get('/categories', getFinanceCategories);
router.get('/summary', getFinanceSummary);

// Write routes — SUPER_ADMIN and FINANCE only
router.post('/', authenticateToken as any, authorizeFinance as any, upload.single('evidence'), createTransaction);
router.delete('/:id', authenticateToken as any, authorizeFinance as any, deleteTransaction);

export default router;
