import { Hono } from 'hono';
import { getDocuments, createDocument, updateDocument, deleteDocument, linkDocumentToProject, getDocumentCategories } from '../controllers/document.controller';
import { authorizeAdmin, Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.get('/categories', getDocumentCategories);
router.get('/', getDocuments);

// In Hono, we handle multipart/form-data in the controller
router.post('/', authorizeAdmin, createDocument);
router.patch('/:id', authorizeAdmin, updateDocument);
router.delete('/:id', authorizeAdmin, deleteDocument);
router.patch('/:documentId/link', authorizeAdmin, linkDocumentToProject);

export default router;
