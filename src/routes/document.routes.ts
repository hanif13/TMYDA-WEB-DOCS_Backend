import { Router } from 'express';
import { getDocuments, createDocument, updateDocument, deleteDocument, linkDocumentToProject, getDocumentCategories } from '../controllers/document.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/categories', getDocumentCategories);
router.get('/', getDocuments);

// Handle single document file upload
router.post('/', authenticateToken as any, authorizeAdmin as any, upload.single('file'), createDocument);
router.patch('/:id', authenticateToken as any, authorizeAdmin as any, upload.single('file'), updateDocument);
router.delete('/:id', authenticateToken as any, authorizeAdmin as any, deleteDocument);
router.patch('/:documentId/link', authenticateToken as any, authorizeAdmin as any, linkDocumentToProject);

export default router;
