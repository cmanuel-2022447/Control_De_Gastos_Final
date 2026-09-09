import dotenv from 'dotenv';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET no está configurado en variables de entorno. ' +
        'Por seguridad, debes establecer JWT_SECRET en el archivo .env con un valor de al menos 32 caracteres.'
    );
}

const TOKEN_EXPIRATION: SignOptions['expiresIn'] =
    (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '3m';

export interface AuthTokenPayload extends JwtPayload {
    id: number;
    usuario: string;
    email: string;
    rol: 'ADMIN' | 'USUARIO';
    nombre?: string;
    apellido?: string;
    genero?: string;
    sessionVersion: number;
}

export function generateToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = { expiresIn: TOKEN_EXPIRATION };
    return jwt.sign(payload, JWT_SECRET as string, options);
}

export function verifyToken(token: string): AuthTokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET as string);

    if (typeof decoded === 'string' || !('id' in decoded) || !('usuario' in decoded) || !('email' in decoded) || !('rol' in decoded)) {
        throw new Error('Token invalido');
    }

    return decoded as AuthTokenPayload;
}