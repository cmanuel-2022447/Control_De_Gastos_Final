// Configuracion principal de la aplicacion Express
// Inicializa middleware CORS y manejo de JSON
// Define las rutas principales del servidor

import express from 'express';
import cors from 'cors';
import authRoutes from './src/modules/auth/routes/auth.routes';
import expensiveRoutes from './src/modules/expensive/routes/expensive.routes';
import ingresosRoutes from './src/modules/ingresos/routes/ingresos.routes';
import eventsRoutes from './src/modules/events/routes/events.routes';
import dashboardRoutes from './src/modules/dashboard/routes/dashboard.routes';
import { errorHandler } from './src/middleware/errorHandles';

// Crear instancia de Express
const app = express();

// El origen debe coincidir exactamente con el configurado en Google Cloud.
app.use(cors({
	origin: 'http://localhost:4200',
	exposedHeaders: ['X-Session-Token']
}));

// Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(express.json());

// Registrar rutas de autenticacion bajo /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/expensive', expensiveRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/eventos', eventsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(errorHandler);

export default app;