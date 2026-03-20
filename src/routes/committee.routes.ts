import { Router } from 'express';
import { getCommitteeMembers, createCommitteeMember, deleteCommitteeMember } from '../controllers/committee.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getCommitteeMembers);
router.post('/', upload.single('photo'), createCommitteeMember);
router.delete('/:id', deleteCommitteeMember);

export default router;
