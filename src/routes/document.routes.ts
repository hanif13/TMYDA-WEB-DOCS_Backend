import { Router } from 'express';
import { getDocuments, createDocument, updateDocument, deleteDocument, linkDocumentToProject, getDocumentCategories } from '../controllers/document.controller';
import { authenticateToken, authorizePermission } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/categories', authenticateToken as any, getDocumentCategories);
router.get('/', authenticateToken as any, getDocuments);

// Handle single document file upload
router.post('/', authenticateToken as any, authorizePermission('documents.edit') as any, upload.single('file'), createDocument);
router.patch('/:id', authenticateToken as any, authorizePermission('documents.edit') as any, upload.single('file'), updateDocument);
router.delete('/:id', authenticateToken as any, authorizePermission('documents.edit') as any, deleteDocument);
router.patch('/:documentId/link', authenticateToken as any, authorizePermission('documents.edit') as any, linkDocumentToProject);

export default router;
