import express from 'express';
import { getActivityLogs } from '../controllers/activityLog.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Only SUPER_ADMIN and ADMIN can view logs (authorizeAdmin handles this)
router.get('/', authenticateToken, authorizeAdmin, getActivityLogs);

export default router;
