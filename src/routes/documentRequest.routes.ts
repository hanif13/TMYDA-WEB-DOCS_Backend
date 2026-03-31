import { Hono } from 'hono';
import { getDocumentRequests, createDocumentRequest, updateDocumentRequest, deleteDocumentRequest } from '../controllers/documentRequest.controller';
import { authorizeAdmin, Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.get('/', getDocumentRequests);
router.post('/', authorizeAdmin, createDocumentRequest);
router.patch('/:id', authorizeAdmin, updateDocumentRequest);
router.delete('/:id', authorizeAdmin, deleteDocumentRequest);

export default router;
