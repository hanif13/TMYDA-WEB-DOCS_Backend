import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction, getFinanceCategories, getFinanceSummary, updateTransaction } from '../controllers/finance.controller';
import { authenticateToken, authorizePermission } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

// Read routes — any authenticated user can view
router.get('/', authenticateToken as any, getTransactions);
router.get('/categories', authenticateToken as any, getFinanceCategories);
router.get('/summary', authenticateToken as any, getFinanceSummary);

// Write routes
router.post('/', authenticateToken as any, authorizePermission('income_expense.edit') as any, upload.single('file'), createTransaction);
router.patch('/:id', authenticateToken as any, authorizePermission('income_expense.edit') as any, upload.single('file'), updateTransaction);
router.delete('/:id', authenticateToken as any, authorizePermission('income_expense.edit') as any, deleteTransaction);

export default router;
