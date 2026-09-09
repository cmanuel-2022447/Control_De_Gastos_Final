import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/errorHandles';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../services/events.service';

export const listEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    return res.json(await getEvents(Number(req.user.id)));
  } catch {
    return res.status(500).json({ message: 'Error al obtener los eventos' });
  }
};

export const saveEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    return res.status(201).json(await createEvent(Number(req.user.id), req.body));
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_EVENT_DATA') return res.status(400).json({ message: 'Los datos del evento no son válidos' });
    return res.status(500).json({ message: 'Error al guardar el evento' });
  }
};

export const editEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    return res.json(await updateEvent(Number(req.user.id), Number(req.params.id), req.body));
  } catch (error) {
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ message: 'Evento no encontrado' });
    if (error instanceof Error && error.message === 'INVALID_EVENT_DATA') return res.status(400).json({ message: 'Los datos del evento no son válidos' });
    return res.status(500).json({ message: 'Error al actualizar el evento' });
  }
};

export const removeEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    await deleteEvent(Number(req.user.id), Number(req.params.id));
    return res.json({ message: 'Evento eliminado' });
  } catch { return res.status(404).json({ message: 'Evento no encontrado' }); }
};
