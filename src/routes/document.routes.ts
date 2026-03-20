import { Router } from 'express';
import { getDocuments, createDocument, updateDocument, deleteDocument, linkDocumentToProject } from '../controllers/document.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getDocuments);
router.post('/', upload.single('file'), createDocument);
router.patch('/:id', upload.single('file'), updateDocument);
router.delete('/:id', deleteDocument);
router.patch('/:documentId/link', linkDocumentToProject);

export default router;
