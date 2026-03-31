import { Router } from 'express';
import { getDocuments, createDocument, updateDocument, deleteDocument, linkDocumentToProject, getDocumentCategories } from '../controllers/document.controller';
import { authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/categories', getDocumentCategories);
router.get('/', getDocuments);
router.post('/', authorizeAdmin, upload.single('file'), createDocument);
router.patch('/:id', authorizeAdmin, upload.single('file'), updateDocument);
router.delete('/:id', authorizeAdmin, deleteDocument);
router.patch('/:documentId/link', authorizeAdmin, linkDocumentToProject);

export default router;
