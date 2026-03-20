import { Router } from 'express';
import { getAnnualPlans, getAnnualYears, createProject, createAnnualPlan, updateProject, updateAnnualPlan, deleteProject, deleteAnnualPlan } from '../controllers/project.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/plans', getAnnualPlans);
router.get('/plans/years', getAnnualYears);
router.post('/plans', createAnnualPlan);
router.patch('/plans/:id', updateAnnualPlan);
router.delete('/plans/:id', deleteAnnualPlan);
router.post('/', createProject);
router.patch('/:id', upload.array('images', 6), updateProject);
router.delete('/:id', deleteProject);

export default router;
