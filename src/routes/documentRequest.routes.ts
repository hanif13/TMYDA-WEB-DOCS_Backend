import { Router } from 'express';
import { getDocumentRequests, createDocumentRequest, updateDocumentRequest, deleteDocumentRequest } from '../controllers/documentRequest.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken as any, getDocumentRequests);
router.post('/', authenticateToken as any, createDocumentRequest);
router.patch('/:id', authenticateToken as any, updateDocumentRequest);
router.delete('/:id', authenticateToken as any, deleteDocumentRequest);

export default router;
