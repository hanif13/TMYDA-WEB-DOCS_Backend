import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All authenticated users can view events
router.get('/', authenticateToken as any, getEvents);

// Only ADMIN and SUPER_ADMIN can create/update/delete events
router.post('/', authenticateToken as any, authorizeAdmin as any, createEvent);
router.patch('/:id', authenticateToken as any, authorizeAdmin as any, updateEvent);
router.delete('/:id', authenticateToken as any, authorizeAdmin as any, deleteEvent);

export default router;
