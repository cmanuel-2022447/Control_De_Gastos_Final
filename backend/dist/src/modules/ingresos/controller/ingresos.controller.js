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
exports.clearIngresosController = exports.deleteIngresoController = exports.updateIngresoController = exports.createIngreso = exports.getIngresos = void 0;
const ingresos_service_1 = require("../services/ingresos.service");
const getIngresos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const data = yield (0, ingresos_service_1.getAllIngresos)(Number(req.user.id));
        return res.status(200).json(data);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener los ingresos' });
    }
});
exports.getIngresos = getIngresos;
const createIngreso = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const nuevoIngreso = yield (0, ingresos_service_1.saveIngreso)(Number(req.user.id), req.body);
        return res.status(201).json({ message: 'Ingreso guardado con éxito', data: nuevoIngreso });
    }
    catch (error) {
        console.error(error);
        if (error instanceof Error && error.message === 'INVALID_INCOME_DATA') {
            return res.status(400).json({ message: 'Los datos del ingreso no son válidos. El monto admite máximo 3 decimales.' });
        }
        if (error instanceof Error && error.message === 'INCOME_DATE_NOT_TODAY')
            return res.status(400).json({ message: 'Los ingresos solo pueden registrarse con la fecha de hoy.' });
        if (error instanceof Error && error.message === 'INVALID_CURRENCY')
            return res.status(400).json({ message: 'La moneda seleccionada no es válida.' });
        return res.status(500).json({ message: 'Error al guardar el ingreso' });
    }
});
exports.createIngreso = createIngreso;
const updateIngresoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const id = Number(req.params.id);
        const ingresoActualizado = yield (0, ingresos_service_1.updateIngreso)(Number(req.user.id), id, req.body);
        return res.status(200).json({ message: 'Ingreso actualizado', data: ingresoActualizado });
    }
    catch (error) {
        console.error(error);
        if (error instanceof Error && error.message === 'INCOME_NOT_FOUND') {
            return res.status(404).json({ message: 'Ingreso no encontrado' });
        }
        if (error instanceof Error && error.message === 'INVALID_INCOME_DATA')
            return res.status(400).json({ message: 'Los datos del ingreso no son válidos. El monto admite máximo 3 decimales.' });
        if (error instanceof Error && error.message === 'INCOME_DATE_NOT_TODAY')
            return res.status(400).json({ message: 'Los ingresos solo pueden registrarse con la fecha de hoy.' });
        if (error instanceof Error && error.message === 'INVALID_CURRENCY')
            return res.status(400).json({ message: 'La moneda seleccionada no es válida.' });
        return res.status(500).json({ message: 'Error al actualizar el ingreso' });
    }
});
exports.updateIngresoController = updateIngresoController;
const deleteIngresoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const id = Number(req.params.id);
        const result = yield (0, ingresos_service_1.deleteIngreso)(Number(req.user.id), id);
        return res.status(200).json({ message: 'Ingreso eliminado', data: result });
    }
    catch (error) {
        console.error(error);
        if (error instanceof Error && error.message === 'INCOME_NOT_FOUND') {
            return res.status(404).json({ message: 'Ingreso no encontrado' });
        }
        return res.status(500).json({ message: 'Error al eliminar el ingreso' });
    }
});
exports.deleteIngresoController = deleteIngresoController;
const clearIngresosController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const result = yield (0, ingresos_service_1.clearIngresos)(Number(req.user.id));
        return res.status(200).json({ message: 'Ingresos eliminados al cerrar sesión', data: result });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al limpiar los ingresos' });
    }
});
exports.clearIngresosController = clearIngresosController;
