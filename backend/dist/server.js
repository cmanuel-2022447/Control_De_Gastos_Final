"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./src/config/db");
const PORT = process.env.PORT || 3000;
(0, db_1.initializeDatabase)()
    .then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
})
    .catch((error) => {
    console.error('No fue posible inicializar la base de datos', error);
    process.exit(1);
});
