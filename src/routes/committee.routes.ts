import { Router } from 'express';
import { getCommitteeMembers, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember, createCommitteeBulk } from '../controllers/committee.controller';
import { authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getCommitteeMembers);
router.post('/bulk', authorizeAdmin, createCommitteeBulk);
router.post('/', authorizeAdmin, upload.single('photo'), createCommitteeMember);
router.patch('/:id', authorizeAdmin, upload.single('photo'), updateCommitteeMember);
router.delete('/:id', authorizeAdmin, deleteCommitteeMember);

export default router;
