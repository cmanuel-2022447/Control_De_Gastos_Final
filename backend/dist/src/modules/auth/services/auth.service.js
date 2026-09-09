"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const google_auth_library_1 = require("google-auth-library");
const db_1 = require("../../../config/db");
const jwt_1 = require("../../../util/jwt");
const googleClient = new google_auth_library_1.OAuth2Client();
const SESSION_IDLE_MINUTES = 3;
function googleClientId() {
    var _a;
    const value = (_a = process.env.GOOGLE_CLIENT_ID) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value || !/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(value)) {
        return null;
    }
    return value;
}
function googleAuthEnabled() {
    return process.env.GOOGLE_AUTH_ENABLED === 'true' && Boolean(googleClientId());
}
function sessionToken(user) {
    return (0, jwt_1.generateToken)({
        id: user.id,
        usuario: user.usuario,
        email: user.correo,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
        genero: user.genero,
        sessionVersion: user.session_version
    });
}
function normalizarGenero(value) {
    const genero = String(value || '').trim().toUpperCase();
    if (['FEMENINO', 'FEMALE', 'F'].includes(genero))
        return 'FEMENINO';
    if (['MASCULINO', 'MALE', 'M'].includes(genero))
        return 'MASCULINO';
    return null;
}
class AuthService {
    static getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.pool.query(`SELECT id, usuario, correo, nombre, apellido,
                    CASE UPPER(TRIM(genero))
                        WHEN 'FEMENINO' THEN 'FEMENINO'
                        WHEN 'FEMALE' THEN 'FEMENINO'
                        WHEN 'F' THEN 'FEMENINO'
                        WHEN 'MASCULINO' THEN 'MASCULINO'
                        WHEN 'MALE' THEN 'MASCULINO'
                        WHEN 'M' THEN 'MASCULINO'
                        ELSE NULL
                    END AS genero,
                    foto_url, auth_provider, moneda, tema, rol
             FROM public.usuarios WHERE id = $1`, [userId]);
            if (!result.rowCount)
                throw new Error('USER_NOT_FOUND');
            return result.rows[0];
        });
    }
    static updateProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const current = yield db_1.pool.query(`SELECT nombre, apellido, genero, foto_url, moneda, tema
             FROM public.usuarios WHERE id = $1`, [userId]);
            if (!current.rowCount)
                throw new Error('USER_NOT_FOUND');
            const saved = current.rows[0];
            const has = (field) => Object.prototype.hasOwnProperty.call(data || {}, field);
            const nombre = has('nombre') ? String(data.nombre || '').trim() || null : saved.nombre;
            const apellido = has('apellido') ? String(data.apellido || '').trim() || null : saved.apellido;
            const genero = has('genero') ? normalizarGenero(data.genero) : saved.genero;
            if (has('genero') && !genero)
                throw new Error('INVALID_GENDER');
            const fotoUrl = has('foto_url') ? String(data.foto_url || '').trim() || null : saved.foto_url;
            const moneda = has('moneda') && ['GTQ', 'USD'].includes(String(data.moneda || '').toUpperCase())
                ? String(data.moneda).toUpperCase()
                : saved.moneda;
            const tema = has('tema') && ['CLARO', 'OSCURO'].includes(String(data.tema || '').toUpperCase())
                ? String(data.tema).toUpperCase()
                : saved.tema;
            const result = yield db_1.pool.query(`UPDATE public.usuarios SET nombre = $1, apellido = $2, genero = $3, foto_url = $4, moneda = $5, tema = $6
             WHERE id = $7
             RETURNING id, usuario, correo, nombre, apellido, genero, foto_url, auth_provider, moneda, tema, rol`, [nombre, apellido, genero, fotoUrl, moneda, tema, userId]);
            if (!result.rowCount)
                throw new Error('USER_NOT_FOUND');
            return result.rows[0];
        });
    }
    static login(loginValue, passwordInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleanLogin = loginValue === null || loginValue === void 0 ? void 0 : loginValue.trim();
            const cleanPassword = passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.trim();
            if (!cleanLogin || !cleanPassword) {
                throw new Error('INVALID_CREDENTIALS');
            }
            const lookupValue = cleanLogin.toLowerCase();
            const userQuery = cleanLogin.includes('@')
                ? `SELECT id, usuario, correo, password, rol, nombre, apellido, genero, foto_url, session_version
               FROM public.usuarios
               WHERE LOWER(correo) = $1
               LIMIT 1`
                : `SELECT id, usuario, correo, password, rol, nombre, apellido, genero, foto_url, session_version
               FROM public.usuarios
               WHERE LOWER(usuario) = $1
               LIMIT 1`;
            const result = yield db_1.pool.query(userQuery, [lookupValue]);
            const user = result.rows[0];
            // El costo de bcrypt.compare es deliberado: hace que la validación de contraseña sea
            // segura frente a ataques de fuerza bruta. Este tiempo no se debe eliminar ni ocultar,
            // pero sí se puede reducir el costo de la búsqueda previa con consultas más eficientes.
            if (!user || !user.password) {
                throw new Error('INVALID_CREDENTIALS');
            }
            const passwordMatch = yield bcryptjs_1.default.compare(cleanPassword, user.password);
            if (!passwordMatch) {
                throw new Error('INVALID_CREDENTIALS');
            }
            const loginSession = yield db_1.pool.query(`UPDATE public.usuarios
             SET last_activity = CURRENT_TIMESTAMP, last_login = CURRENT_TIMESTAMP,
                 session_version = session_version + 1
             WHERE id = $1
             RETURNING session_version`, [user.id]);
            user.session_version = loginSession.rows[0].session_version;
            const token = sessionToken(user);
            return {
                token,
                rol: user.rol
            };
        });
    }
    static loginWithGoogle(credential) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = googleClientId();
            if (!googleAuthEnabled() || !clientId)
                throw new Error('GOOGLE_AUTH_DISABLED');
            if (!credential)
                throw new Error('GOOGLE_TOKEN_INVALID');
            let ticket;
            try {
                ticket = yield googleClient.verifyIdToken({
                    idToken: credential,
                    audience: clientId
                });
            }
            catch (_a) {
                throw new Error('GOOGLE_TOKEN_INVALID');
            }
            const payload = ticket.getPayload();
            if (!(payload === null || payload === void 0 ? void 0 : payload.sub) || !payload.email || payload.email_verified !== true ||
                !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss || '')) {
                throw new Error('GOOGLE_ACCOUNT_INVALID');
            }
            const byGoogleSub = yield db_1.pool.query(`SELECT id, usuario, correo, nombre, apellido, genero, foto_url, rol, session_version, google_sub
             FROM public.usuarios WHERE google_sub = $1 LIMIT 1`, [payload.sub]);
            const byEmail = byGoogleSub.rows[0] ? null : yield db_1.pool.query(`SELECT id, usuario, correo, nombre, apellido, genero, foto_url, rol, session_version, google_sub
             FROM public.usuarios WHERE LOWER(correo) = LOWER($1) LIMIT 1`, [payload.email]);
            let user = byGoogleSub.rows[0] || (byEmail === null || byEmail === void 0 ? void 0 : byEmail.rows[0]);
            if ((user === null || user === void 0 ? void 0 : user.google_sub) && user.google_sub !== payload.sub) {
                throw new Error('GOOGLE_ACCOUNT_CONFLICT');
            }
            if (user) {
                yield db_1.pool.query(`UPDATE public.usuarios
                 SET google_sub = $1, nombre = $2, apellido = $3, foto_url = $4,
                     auth_provider = CASE WHEN password IS NULL THEN 'GOOGLE' ELSE auth_provider END,
                     last_activity = CURRENT_TIMESTAMP, last_login = CURRENT_TIMESTAMP
                 WHERE id = $5`, [payload.sub, payload.given_name || null, payload.family_name || null, payload.picture || user.foto_url || null, user.id]);
            }
            else {
                const baseUsername = (payload.email.split('@')[0] || 'googleuser')
                    .toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 80) || 'googleuser';
                let username = baseUsername;
                let suffix = 1;
                while ((yield db_1.pool.query('SELECT 1 FROM public.usuarios WHERE LOWER(usuario) = LOWER($1)', [username])).rowCount) {
                    username = `${baseUsername.slice(0, 75)}_${suffix++}`;
                }
                const created = yield db_1.pool.query(`INSERT INTO public.usuarios
                 (usuario, correo, password, auth_provider, google_sub, nombre, apellido, foto_url, rol, last_activity, last_login)
                 VALUES ($1, $2, NULL, 'GOOGLE', $3, $4, $5, $6, 'USUARIO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id, usuario, correo, nombre, apellido, genero, foto_url, rol, session_version`, [username, payload.email, payload.sub, payload.given_name || null, payload.family_name || null, payload.picture || null]);
                user = created.rows[0];
            }
            const googleSession = yield db_1.pool.query(`UPDATE public.usuarios
             SET session_version = session_version + 1
             WHERE id = $1
             RETURNING id, usuario, correo, nombre, apellido, genero, foto_url, rol, session_version`, [user.id]);
            user = googleSession.rows[0];
            return { token: sessionToken(user), rol: user.rol };
        });
    }
    static touchSession(userId, sessionVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.pool.query(`SELECT id, usuario, correo, nombre, apellido, genero, rol, session_version,
                    last_activity, (last_activity IS NULL OR last_activity < CURRENT_TIMESTAMP - ($3 * INTERVAL '1 minute')) AS idle
             FROM public.usuarios WHERE id = $1 AND session_version = $2`, [userId, sessionVersion, SESSION_IDLE_MINUTES]);
            const user = result.rows[0];
            if (!user || user.idle)
                throw new Error('SESSION_IDLE');
            yield db_1.pool.query('UPDATE public.usuarios SET last_activity = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
            return sessionToken(user);
        });
    }
    static logout(userId, sessionVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.pool.query(`UPDATE public.usuarios
             SET session_version = session_version + 1, last_activity = NULL
             WHERE id = $1 AND session_version = $2`, [userId, sessionVersion]);
        });
    }
    static register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const usuario = (_a = userData === null || userData === void 0 ? void 0 : userData.usuario) === null || _a === void 0 ? void 0 : _a.trim();
            const correo = (_b = userData === null || userData === void 0 ? void 0 : userData.correo) === null || _b === void 0 ? void 0 : _b.trim();
            const password = (_c = userData === null || userData === void 0 ? void 0 : userData.password) === null || _c === void 0 ? void 0 : _c.trim();
            const rol = 'USUARIO';
            const nombre = ((_d = userData === null || userData === void 0 ? void 0 : userData.nombre) === null || _d === void 0 ? void 0 : _d.trim()) || null;
            const apellido = ((_e = userData === null || userData === void 0 ? void 0 : userData.apellido) === null || _e === void 0 ? void 0 : _e.trim()) || null;
            const genero = normalizarGenero(userData === null || userData === void 0 ? void 0 : userData.genero);
            if (!usuario || !correo || !password || !correo.includes('@') || password.length < 8) {
                throw new Error('INVALID_REGISTER_DATA');
            }
            const existingUser = yield db_1.pool.query(`SELECT usuario, correo FROM public.usuarios
             WHERE LOWER(usuario) = LOWER($1) OR LOWER(correo) = LOWER($2)
             LIMIT 1`, [usuario, correo]);
            if (existingUser.rows.length > 0) {
                const existing = existingUser.rows[0];
                if (existing.correo.toLowerCase() === correo.toLowerCase()) {
                    throw new Error('EMAIL_ALREADY_EXISTS');
                }
                throw new Error('USERNAME_ALREADY_EXISTS');
            }
            const passwordHash = yield bcryptjs_1.default.hash(password, 10);
            const result = yield db_1.pool.query(`INSERT INTO public.usuarios (usuario, correo, password, nombre, apellido, genero, rol)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, usuario, correo, nombre, apellido, genero, rol, created_at`, [usuario, correo, passwordHash, nombre, apellido, genero, rol]);
            return {
                message: 'Usuario registrado correctamente',
                usuario: result.rows[0]
            };
        });
    }
}
exports.AuthService = AuthService;
