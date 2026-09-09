"use strict";
// Configuracion principal de la aplicacion Express
// Inicializa middleware CORS y manejo de JSON
// Define las rutas principales del servidor
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./src/modules/auth/routes/auth.routes"));
const expensive_routes_1 = __importDefault(require("./src/modules/expensive/routes/expensive.routes"));
const ingresos_routes_1 = __importDefault(require("./src/modules/ingresos/routes/ingresos.routes"));
const events_routes_1 = __importDefault(require("./src/modules/events/routes/events.routes"));
const dashboard_routes_1 = __importDefault(require("./src/modules/dashboard/routes/dashboard.routes"));
const errorHandles_1 = require("./src/middleware/errorHandles");
// Crear instancia de Express
const app = (0, express_1.default)();
// El origen debe coincidir exactamente con el configurado en Google Cloud.
app.use((0, cors_1.default)({
    origin: 'http://localhost:4200',
    exposedHeaders: ['X-Session-Token']
}));
// Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(express_1.default.json());
// Registrar rutas de autenticacion bajo /api/auth
app.use('/api/auth', auth_routes_1.default);
app.use('/api/expensive', expensive_routes_1.default);
app.use('/api/ingresos', ingresos_routes_1.default);
app.use('/api/eventos', events_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use(errorHandles_1.errorHandler);
exports.default = app;
