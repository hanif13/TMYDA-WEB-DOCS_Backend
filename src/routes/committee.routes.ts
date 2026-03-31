import { Hono } from 'hono';
import { getCommitteeMembers, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember, createCommitteeBulk } from '../controllers/committee.controller';
import { authorizeAdmin, Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.get('/', getCommitteeMembers);
router.post('/bulk', authorizeAdmin, createCommitteeBulk);

// In Hono, we don't need a separate upload middleware for simple cases; 
// we handle multipart/form-data in the controller.
router.post('/', authorizeAdmin, createCommitteeMember);
router.patch('/:id', authorizeAdmin, updateCommitteeMember);
router.delete('/:id', authorizeAdmin, deleteCommitteeMember);

export default router;
