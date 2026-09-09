import { Router } from 'express';
import { authenticateToken } from '../../../middleware/errorHandles';
import { getSummary } from '../controller/dashboard.controller';

const router = Router();
router.use(authenticateToken);
router.get('/summary', getSummary);

export default router;
