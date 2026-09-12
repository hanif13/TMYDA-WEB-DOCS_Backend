import express from 'express';
import { getActivityLogs } from '../controllers/activityLog.controller';
import { authenticateToken, authorizePermission } from '../middleware/auth.middleware';

const router = express.Router();

// Only users with activity_logs.view permission can view logs
router.get('/', authenticateToken, authorizePermission('activity_logs.view') as any, getActivityLogs);

export default router;
