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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.errorHandler = errorHandler;
const jwt_1 = require("../util/jwt");
const auth_service_1 = require("../modules/auth/services/auth.service");
function authenticateToken(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authorization = req.headers.authorization;
        const token = (authorization === null || authorization === void 0 ? void 0 : authorization.startsWith('Bearer '))
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
            req.user = (0, jwt_1.verifyToken)(token);
            const refreshedToken = yield auth_service_1.AuthService.touchSession(Number(req.user.id), Number(req.user.sessionVersion));
            res.setHeader('X-Session-Token', refreshedToken);
            next();
        }
        catch (error) {
            // Distinguir entre token expirado e inválido
            if (error instanceof Error && error.message === 'SESSION_IDLE') {
                res.status(401).json({ message: 'La sesión expiró por inactividad', code: 'SESSION_IDLE' });
            }
            else if (error instanceof Error && error.name === 'TokenExpiredError') {
                res.status(401).json({
                    message: 'El token ha expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            else if (error instanceof Error && error.message === 'Token invalido') {
                res.status(401).json({
                    message: 'El token es inválido',
                    code: 'TOKEN_INVALID'
                });
            }
            else {
                res.status(401).json({
                    message: 'Error de autenticación',
                    code: 'AUTH_ERROR'
                });
            }
        }
    });
}
function errorHandler(error, _req, res, _next) {
    console.error(error);
    res.status(500).json({ message: 'Error interno en el servidor' });
}
