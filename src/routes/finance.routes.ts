import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction } from '../controllers/finance.controller';
import { authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getTransactions);
router.post('/', authorizeAdmin, upload.single('file'), createTransaction);
router.delete('/:id', authorizeAdmin, deleteTransaction);

export default router;
