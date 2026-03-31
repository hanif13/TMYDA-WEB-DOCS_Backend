import { Router } from 'express';
import { getAnnualPlans, getAnnualYears, createProject, createAnnualPlan, updateProject, updateAnnualPlan, deleteProject, deleteAnnualPlan, createProjectBulk } from '../controllers/project.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/plans', getAnnualPlans);
router.get('/plans/years', getAnnualYears);
router.post('/plans', authenticateToken as any, authorizeAdmin as any, createAnnualPlan);
router.patch('/plans/:id', authenticateToken as any, authorizeAdmin as any, updateAnnualPlan);
router.delete('/plans/:id', authenticateToken as any, authorizeAdmin as any, deleteAnnualPlan);
router.post('/bulk', authenticateToken as any, authorizeAdmin as any, createProjectBulk);
router.post('/', authenticateToken as any, authorizeAdmin as any, createProject);

// Handle multiple images for project summary
router.patch('/:id', authenticateToken as any, authorizeAdmin as any, upload.array('images', 10), updateProject);
router.delete('/:id', authenticateToken as any, authorizeAdmin as any, deleteProject);

export default router;
