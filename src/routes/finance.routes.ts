import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction, getFinanceCategories, getFinanceSummary, updateTransaction } from '../controllers/finance.controller';
import { authenticateToken, authorizeFinance } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

// Read routes — any authenticated user can view
router.get('/', authenticateToken as any, getTransactions);
router.get('/categories', authenticateToken as any, getFinanceCategories);
router.get('/summary', authenticateToken as any, getFinanceSummary);

// Write routes — SUPER_ADMIN and FINANCE only
router.post('/', authenticateToken as any, authorizeFinance as any, upload.single('evidence'), createTransaction);
router.patch('/:id', authenticateToken as any, authorizeFinance as any, upload.single('evidence'), updateTransaction);
router.delete('/:id', authenticateToken as any, authorizeFinance as any, deleteTransaction);

export default router;
