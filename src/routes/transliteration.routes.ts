import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    getTransliterations,
    getCategories,
    createTransliteration,
    bulkCreateTransliterations,
    updateTransliteration,
    deleteTransliteration,
    bulkDeleteTransliterations,
} from '../controllers/transliteration.controller';

const router = Router();

// Public routes (authenticated)
router.get('/', authenticateToken, getTransliterations);
router.get('/categories', authenticateToken, getCategories);
router.post('/', authenticateToken, createTransliteration);
router.post('/bulk', authenticateToken, bulkCreateTransliterations);
router.patch('/:id', authenticateToken, updateTransliteration);
router.delete('/bulk', authenticateToken, bulkDeleteTransliterations);
router.delete('/:id', authenticateToken, deleteTransliteration);

export default router;
