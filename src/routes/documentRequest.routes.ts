import { Router } from 'express';
import { getDocumentRequests, createDocumentRequest, updateDocumentRequest, deleteDocumentRequest } from '../controllers/documentRequest.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDocumentRequests);
router.post('/', authenticateToken as any, authorizeAdmin as any, createDocumentRequest);
router.patch('/:id', authenticateToken as any, authorizeAdmin as any, updateDocumentRequest);
router.delete('/:id', authenticateToken as any, authorizeAdmin as any, deleteDocumentRequest);

export default router;
