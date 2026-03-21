import { Router } from 'express';
import { getCommitteeMembers, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember, createCommitteeBulk } from '../controllers/committee.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getCommitteeMembers);
router.post('/bulk', createCommitteeBulk);
router.post('/', upload.single('photo'), createCommitteeMember);
router.patch('/:id', upload.single('photo'), updateCommitteeMember);
router.delete('/:id', deleteCommitteeMember);

export default router;
