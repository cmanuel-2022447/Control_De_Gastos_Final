import { Router } from 'express';
import { editExpense, getExpenses, createExpense, removeExpense } from '../controller/expensive.controller';
import { authenticateToken } from '../../../middleware/errorHandles';

const router = Router();

router.use(authenticateToken);

// Endpoint para obtener todos los gastos registrados
router.get('/', getExpenses);

// Endpoint para crear nuevo gasto
router.post('/', createExpense);
router.put('/:id', editExpense);
router.delete('/:id', removeExpense);

export default router;