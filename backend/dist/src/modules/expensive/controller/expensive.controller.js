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
exports.removeExpense = exports.editExpense = exports.createExpense = exports.getExpenses = void 0;
const expensive_service_1 = require("../services/expensive.service");
// Obtiene lista completa de gastos registrados.
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const data = yield (0, expensive_service_1.getAllExpenses)(Number(userId));
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos' });
    }
});
exports.getExpenses = getExpenses;
// Crea nuevo registro de gasto
// Valida datos enviados y almacena en base de datos
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const newExpense = yield (0, expensive_service_1.saveExpense)(Number(userId), req.body);
        res.status(201).json({ message: 'Dato guardado con éxito', data: newExpense });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'INVALID_EXPENSE_DATA') {
            res.status(400).json({ message: 'Los datos del gasto no son válidos' });
            return;
        }
        res.status(500).json({ message: 'Error al guardar el dato' });
    }
});
exports.createExpense = createExpense;
const editExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const expense = yield (0, expensive_service_1.updateExpense)(Number(req.user.id), Number(req.params.id), req.body);
        return res.json({ message: 'Gasto actualizado', data: expense });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'EXPENSE_NOT_FOUND')
            return res.status(404).json({ message: 'Gasto no encontrado' });
        if (error instanceof Error && error.message === 'INVALID_EXPENSE_DATA')
            return res.status(400).json({ message: 'Los datos del gasto no son válidos' });
        return res.status(500).json({ message: 'Error al actualizar el gasto' });
    }
});
exports.editExpense = editExpense;
const removeExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        yield (0, expensive_service_1.deleteExpense)(Number(req.user.id), Number(req.params.id));
        return res.json({ message: 'Gasto eliminado' });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'EXPENSE_NOT_FOUND')
            return res.status(404).json({ message: 'Gasto no encontrado' });
        return res.status(500).json({ message: 'Error al eliminar el gasto' });
    }
});
exports.removeExpense = removeExpense;
