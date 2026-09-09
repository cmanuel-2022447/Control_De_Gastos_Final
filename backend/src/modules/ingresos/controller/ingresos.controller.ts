import { Response } from 'express';
import { getAllIngresos, saveIngreso, updateIngreso, deleteIngreso, clearIngresos } from '../services/ingresos.service';
import { AuthenticatedRequest } from '../../../middleware/errorHandles';

export const getIngresos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const data = await getAllIngresos(Number(req.user.id));
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener los ingresos' });
  }
};

export const createIngreso = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const nuevoIngreso = await saveIngreso(Number(req.user.id), req.body);
    return res.status(201).json({ message: 'Ingreso guardado con éxito', data: nuevoIngreso });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'INVALID_INCOME_DATA') {
      return res.status(400).json({ message: 'Faltan datos o el monto no es válido' });
    }
    return res.status(500).json({ message: 'Error al guardar el ingreso' });
  }
};

export const updateIngresoController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const id = Number(req.params.id);
    const ingresoActualizado = await updateIngreso(Number(req.user.id), id, req.body);
    return res.status(200).json({ message: 'Ingreso actualizado', data: ingresoActualizado });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'INCOME_NOT_FOUND') {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }
    return res.status(500).json({ message: 'Error al actualizar el ingreso' });
  }
};

export const deleteIngresoController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const id = Number(req.params.id);
    const result = await deleteIngreso(Number(req.user.id), id);
    return res.status(200).json({ message: 'Ingreso eliminado', data: result });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'INCOME_NOT_FOUND') {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }
    return res.status(500).json({ message: 'Error al eliminar el ingreso' });
  }
};

export const clearIngresosController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const result = await clearIngresos(Number(req.user.id));
    return res.status(200).json({ message: 'Ingresos eliminados al cerrar sesión', data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al limpiar los ingresos' });
  }
};
