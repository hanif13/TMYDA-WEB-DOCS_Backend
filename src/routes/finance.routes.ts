import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction } from '../controllers/finance.controller';

import { upload } from '../middleware/upload';
const router = Router();

router.get('/', getTransactions);
router.post('/', upload.single('file'), createTransaction);
router.delete('/:id', deleteTransaction);

export default router;
