import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../../../middleware/errorHandles';

export class AuthController {
    static googleConfig(_req: Request, res: Response) {
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        const validClientId = clientId && /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(clientId)
            ? clientId
            : null;
        return res.json({
            enabled: process.env.GOOGLE_AUTH_ENABLED === 'true' && Boolean(validClientId),
            clientId: process.env.GOOGLE_AUTH_ENABLED === 'true' ? validClientId : null,
            traditionalEnabled: process.env.TRADITIONAL_AUTH_ENABLED !== 'false'
        });
    }

    static async googleLogin(req: Request, res: Response) {
        try {
            const result = await AuthService.loginWithGoogle(req.body?.credential);
            return res.status(200).json({ message: 'Inicio de sesión con Google exitoso', token: result.token, rol: result.rol });
        } catch (error) {
            if (error instanceof Error && error.message === 'GOOGLE_AUTH_DISABLED') return res.status(503).json({ message: 'El inicio de sesión con Google no está disponible' });
            if (error instanceof Error && error.message === 'GOOGLE_ACCOUNT_CONFLICT') return res.status(409).json({ message: 'La cuenta de Google no coincide con la cuenta existente' });
            if (error instanceof Error && ['GOOGLE_TOKEN_INVALID', 'GOOGLE_ACCOUNT_INVALID'].includes(error.message)) return res.status(401).json({ message: 'No fue posible validar la cuenta de Google' });
            return res.status(503).json({ message: 'No fue posible iniciar sesión con Google' });
        }
    }

    static async logout(req: AuthenticatedRequest, res: Response) {
        if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
        await AuthService.logout(Number(req.user.id), Number(req.user.sessionVersion));
        return res.status(204).send();
    }

    static activity(_req: AuthenticatedRequest, res: Response) {
        return res.status(204).send();
    }

    static async profile(req: AuthenticatedRequest, res: Response) {
        if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.json(await AuthService.getProfile(Number(req.user.id)));
        } catch {
            return res.status(500).json({ message: 'No fue posible obtener el perfil' });
        }
    }

    static async updateProfile(req: AuthenticatedRequest, res: Response) {
        if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.json(await AuthService.updateProfile(Number(req.user.id), req.body));
        } catch {
            return res.status(500).json({ message: 'No fue posible actualizar el perfil' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { login, usuario, correo, email, identifier, username, password } = req.body;
            const loginValue = login || usuario || correo || email || identifier || username;

            if (!loginValue || !password) {
                return res.status(400).json({ message: "Faltan datos en la solicitud (usuario o contraseña vacíos)" });
            }

            const result = await AuthService.login(loginValue, password);
            return res.status(200).json({ message: "Inicio de sesión exitoso", token: result.token, rol: result.rol });
        } catch (error) {
            if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
                return res.status(401).json({ message: "Correo, usuario o contraseña incorrectos" });
            }
            if (error instanceof Error && error.message === 'INVALID_GENDER') {
                return res.status(400).json({ message: 'El género debe ser FEMENINO o MASCULINO' });
            }
            return res.status(503).json({ message: "La base de datos no está disponible" });
        }
    }

    static async register(req: Request, res: Response) {
        try {
            if (process.env.TRADITIONAL_AUTH_ENABLED === 'false') {
                return res.status(403).json({ message: 'El registro tradicional está deshabilitado temporalmente' });
            }
            const { usuario, correo, email, password, nombre, apellido, genero } = req.body;
            const cleanUsuario = usuario || req.body.username || req.body.user;
            const cleanCorreo = correo || email;

            if (!cleanUsuario || !cleanCorreo || !password) {
                return res.status(400).json({ message: "Faltan datos para registrar el usuario" });
            }

            const result = await AuthService.register({
                usuario: cleanUsuario,
                correo: cleanCorreo,
                password,
                nombre,
                apellido,
                genero
            });

            return res.status(201).json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'INVALID_REGISTER_DATA') {
                return res.status(400).json({ message: "Faltan datos para registrar el usuario" });
            }

            if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
                return res.status(409).json({ message: "El usuario o correo ya existe" });
            }

            if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
                return res.status(409).json({ message: "Este correo electrónico ya está registrado." });
            }

            if (error instanceof Error && error.message === 'USERNAME_ALREADY_EXISTS') {
                return res.status(409).json({ message: "El nombre de usuario ya está registrado." });
            }

            return res.status(503).json({ message: "La base de datos no está disponible" });
        }
    }
}