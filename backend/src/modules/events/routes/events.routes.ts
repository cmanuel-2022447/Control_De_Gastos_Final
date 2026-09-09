import { Router } from 'express';
import { authenticateToken } from '../../../middleware/errorHandles';
import { editEvent, listEvents, removeEvent, saveEvent } from '../controller/events.controller';

const router = Router();
router.use(authenticateToken);
router.get('/', listEvents);
router.post('/', saveEvent);
router.put('/:id', editEvent);
router.delete('/:id', removeEvent);

export default router;
