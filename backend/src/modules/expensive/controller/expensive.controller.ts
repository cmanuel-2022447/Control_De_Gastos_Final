import { Request, Response } from 'express';
import { deleteExpense, getAllExpenses, saveExpense, updateExpense } from '../services/expensive.service';
import { AuthenticatedRequest } from '../../../middleware/errorHandles';

// Obtiene lista completa de gastos registrados.
export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });
        const data = await getAllExpenses(Number(userId));
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos' });
    }
};

// Crea nuevo registro de gasto
// Valida datos enviados y almacena en base de datos
export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });
        const newExpense = await saveExpense(Number(userId), req.body);
        res.status(201).json({ message: 'Dato guardado con éxito', data: newExpense });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_EXPENSE_DATA') {
            res.status(400).json({ message: 'Los datos del gasto no son válidos' });
            return;
        }
        res.status(500).json({ message: 'Error al guardar el dato' });
    }
};

export const editExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
        const expense = await updateExpense(Number(req.user.id), Number(req.params.id), req.body);
        return res.json({ message: 'Gasto actualizado', data: expense });
    } catch (error) {
        if (error instanceof Error && error.message === 'EXPENSE_NOT_FOUND') return res.status(404).json({ message: 'Gasto no encontrado' });
        if (error instanceof Error && error.message === 'INVALID_EXPENSE_DATA') return res.status(400).json({ message: 'Los datos del gasto no son válidos' });
        return res.status(500).json({ message: 'Error al actualizar el gasto' });
    }
};

export const removeExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
        await deleteExpense(Number(req.user.id), Number(req.params.id));
        return res.json({ message: 'Gasto eliminado' });
    } catch (error) {
        if (error instanceof Error && error.message === 'EXPENSE_NOT_FOUND') return res.status(404).json({ message: 'Gasto no encontrado' });
        return res.status(500).json({ message: 'Error al eliminar el gasto' });
    }
};