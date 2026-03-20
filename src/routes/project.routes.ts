import { Router } from 'express';
import { getAnnualPlans, createProject, createAnnualPlan, updateProject, deleteProject, deleteAnnualPlan } from '../controllers/project.controller';

const router = Router();

router.get('/plans', getAnnualPlans);
router.post('/plans', createAnnualPlan);
router.delete('/plans/:id', deleteAnnualPlan);
router.post('/', createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
