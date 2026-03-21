import { Router } from 'express';
import { getDocumentRequests, createDocumentRequest, updateDocumentRequest, deleteDocumentRequest } from '../controllers/documentRequest.controller';
import { authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDocumentRequests);
router.post('/', authorizeAdmin, createDocumentRequest);
router.patch('/:id', authorizeAdmin, updateDocumentRequest);
router.delete('/:id', authorizeAdmin, deleteDocumentRequest);

export default router;
