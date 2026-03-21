import { Router } from 'express';
import { getAnnualPlans, getAnnualYears, createProject, createAnnualPlan, updateProject, updateAnnualPlan, deleteProject, deleteAnnualPlan, createProjectBulk } from '../controllers/project.controller';
import { authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/plans', getAnnualPlans);
router.get('/plans/years', getAnnualYears);
router.post('/plans', authorizeAdmin, createAnnualPlan);
router.patch('/plans/:id', authorizeAdmin, updateAnnualPlan);
router.delete('/plans/:id', authorizeAdmin, deleteAnnualPlan);
router.post('/bulk', authorizeAdmin, createProjectBulk);
router.post('/', authorizeAdmin, createProject);
router.patch('/:id', authorizeAdmin, upload.array('images', 6), updateProject);
router.delete('/:id', authorizeAdmin, deleteProject);

export default router;
