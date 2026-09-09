import app from './app';
import { initializeDatabase } from './src/config/db';

const PORT = process.env.PORT || 3000;

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('No fue posible inicializar la base de datos', error);
        process.exit(1);
    });