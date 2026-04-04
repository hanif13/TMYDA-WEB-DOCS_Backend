import { Router } from 'express';
import { 
    getDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment, 
    reorderDepartments 
} from '../controllers/department.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken as any, getDepartments);
router.post('/', authenticateToken, createDepartment);
router.put('/reorder', authenticateToken, reorderDepartments);
router.put('/:id', authenticateToken, updateDepartment);
router.delete('/:id', authenticateToken, deleteDepartment);

export default router;
