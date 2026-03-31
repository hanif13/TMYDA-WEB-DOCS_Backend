import { Hono } from 'hono';
import { getAnnualPlans, getAnnualYears, createProject, createAnnualPlan, updateProject, updateAnnualPlan, deleteProject, deleteAnnualPlan, createProjectBulk } from '../controllers/project.controller';
import { authorizeAdmin, Bindings, Variables } from '../middleware/auth.middleware';

const router = new Hono<{ Bindings: Bindings, Variables: Variables }>();

router.get('/plans', getAnnualPlans);
router.get('/plans/years', getAnnualYears);
router.post('/plans', authorizeAdmin, createAnnualPlan);
router.patch('/plans/:id', authorizeAdmin, updateAnnualPlan);
router.delete('/plans/:id', authorizeAdmin, deleteAnnualPlan);
router.post('/bulk', authorizeAdmin, createProjectBulk);
router.post('/', authorizeAdmin, createProject);

// In Hono, we handle multiple file uploads in the controller
router.patch('/:id', authorizeAdmin, updateProject);
router.delete('/:id', authorizeAdmin, deleteProject);

export default router;
