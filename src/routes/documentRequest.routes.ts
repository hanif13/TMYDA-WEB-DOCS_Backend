import { Router } from 'express';
import { getDocumentRequests, createDocumentRequest, updateDocumentRequest, deleteDocumentRequest } from '../controllers/documentRequest.controller';

const router = Router();

router.get('/', getDocumentRequests);
router.post('/', createDocumentRequest);
router.patch('/:id', updateDocumentRequest);
router.delete('/:id', deleteDocumentRequest);

export default router;
