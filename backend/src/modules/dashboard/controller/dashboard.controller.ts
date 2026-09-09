import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/errorHandles';
import { getDashboardSummary } from '../services/dashboard.service';

export async function getSummary(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    try {
        return res.json(await getDashboardSummary(Number(req.user.id)));
    } catch {
        return res.status(500).json({ message: 'No fue posible obtener el resumen' });
    }
}
