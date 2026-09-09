import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../util/jwt';
import { AuthService } from '../modules/auth/services/auth.service';

export type AuthenticatedRequest = Request & {
    user?: ReturnType<typeof verifyToken>;
};

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : undefined;

    if (!token) {
        res.status(401).json({ 
            message: 'Token requerido',
            code: 'NO_TOKEN'
        });
        return;
    }

    try {
        req.user = verifyToken(token);
        const refreshedToken = await AuthService.touchSession(Number(req.user.id), Number(req.user.sessionVersion));
        res.setHeader('X-Session-Token', refreshedToken);
        next();
    } catch (error) {
        // Distinguir entre token expirado e inválido
        if (error instanceof Error && error.message === 'SESSION_IDLE') {
            res.status(401).json({ message: 'La sesión expiró por inactividad', code: 'SESSION_IDLE' });
        } else if (error instanceof Error && error.name === 'TokenExpiredError') {
            res.status(401).json({ 
                message: 'El token ha expirado',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error instanceof Error && error.message === 'Token invalido') {
            res.status(401).json({ 
                message: 'El token es inválido',
                code: 'TOKEN_INVALID'
            });
        } else {
            res.status(401).json({ 
                message: 'Error de autenticación',
                code: 'AUTH_ERROR'
            });
        }
    }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
    console.error(error);
    res.status(500).json({ message: 'Error interno en el servidor' });
}