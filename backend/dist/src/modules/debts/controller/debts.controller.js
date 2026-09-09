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
exports.getDebts = getDebts;
exports.postDebt = postDebt;
exports.putDebt = putDebt;
exports.removeDebt = removeDebt;
const debts_service_1 = require("../services/debts.service");
function getDebts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.json(yield (0, debts_service_1.listDebts)(Number(req.user.id)));
        }
        catch (_b) {
            return res.status(500).json({ message: 'Error al obtener las deudas' });
        }
    });
}
function postDebt(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.status(201).json(yield (0, debts_service_1.createDebt)(Number(req.user.id), req.body));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'INVALID_DEBT_DATA')
                return res.status(400).json({ message: 'Los datos de la deuda no son válidos' });
            return res.status(500).json({ message: 'Error al guardar la deuda' });
        }
    });
}
function putDebt(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.json(yield (0, debts_service_1.updateDebt)(Number(req.user.id), Number(req.params.id), req.body));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'DEBT_NOT_FOUND')
                return res.status(404).json({ message: 'Deuda no encontrada' });
            if (error instanceof Error && error.message === 'INVALID_DEBT_DATA')
                return res.status(400).json({ message: 'Los datos de la deuda no son válidos' });
            return res.status(500).json({ message: 'Error al actualizar la deuda' });
        }
    });
}
function removeDebt(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            yield (0, debts_service_1.deleteDebt)(Number(req.user.id), Number(req.params.id));
            return res.json({ message: 'Deuda eliminada' });
        }
        catch (_b) {
            return res.status(404).json({ message: 'Deuda no encontrada' });
        }
    });
}
