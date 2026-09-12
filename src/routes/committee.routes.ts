import { Router } from 'express';
import { 
    getCommitteeMembers, 
    createCommitteeMember, 
    updateCommitteeMember, 
    deleteCommitteeMember, 
    createCommitteeBulk,
    reorderCommitteeMembers
} from '../controllers/committee.controller';
import { authenticateToken, authorizePermission } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', authenticateToken as any, getCommitteeMembers);
router.post('/bulk', authenticateToken as any, authorizePermission('committee.edit') as any, createCommitteeBulk);
router.put('/reorder', authenticateToken as any, authorizePermission('committee.edit') as any, reorderCommitteeMembers);

// Handle single image upload for committee member
router.post('/', authenticateToken as any, authorizePermission('committee.edit') as any, upload.single('image'), createCommitteeMember);
router.patch('/:id', authenticateToken as any, authorizePermission('committee.edit') as any, upload.single('image'), updateCommitteeMember);
router.delete('/:id', authenticateToken as any, authorizePermission('committee.edit') as any, deleteCommitteeMember);

export default router;
