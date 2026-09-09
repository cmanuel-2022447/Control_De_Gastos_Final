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
exports.getSavings = getSavings;
exports.postSaving = postSaving;
exports.putSaving = putSaving;
exports.removeSaving = removeSaving;
const savings_service_1 = require("../services/savings.service");
function getSavings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.json(yield (0, savings_service_1.listSavings)(Number(req.user.id)));
        }
        catch (_b) {
            return res.status(500).json({ message: 'Error al obtener los ahorros' });
        }
    });
}
function postSaving(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.status(201).json(yield (0, savings_service_1.createSaving)(Number(req.user.id), req.body));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'INVALID_SAVING_DATA')
                return res.status(400).json({ message: 'Los datos del objetivo no son válidos' });
            return res.status(500).json({ message: 'Error al guardar el objetivo' });
        }
    });
}
function putSaving(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            return res.json(yield (0, savings_service_1.updateSaving)(Number(req.user.id), Number(req.params.id), req.body));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'SAVING_NOT_FOUND')
                return res.status(404).json({ message: 'Objetivo no encontrado' });
            if (error instanceof Error && error.message === 'INVALID_SAVING_DATA')
                return res.status(400).json({ message: 'Los datos del objetivo no son válidos' });
            return res.status(500).json({ message: 'Error al actualizar el objetivo' });
        }
    });
}
function removeSaving(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        try {
            yield (0, savings_service_1.deleteSaving)(Number(req.user.id), Number(req.params.id));
            return res.json({ message: 'Objetivo eliminado' });
        }
        catch (_b) {
            return res.status(404).json({ message: 'Objetivo no encontrado' });
        }
    });
}
