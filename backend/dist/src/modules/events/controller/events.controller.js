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
exports.removeEvent = exports.editEvent = exports.saveEvent = exports.listEvents = void 0;
const events_service_1 = require("../services/events.service");
const listEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        return res.json(yield (0, events_service_1.getEvents)(Number(req.user.id)));
    }
    catch (_b) {
        return res.status(500).json({ message: 'Error al obtener los eventos' });
    }
});
exports.listEvents = listEvents;
const saveEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        return res.status(201).json(yield (0, events_service_1.createEvent)(Number(req.user.id), req.body));
    }
    catch (error) {
        if (error instanceof Error && error.message === 'INVALID_EVENT_DATA')
            return res.status(400).json({ message: 'Los datos del evento no son válidos' });
        return res.status(500).json({ message: 'Error al guardar el evento' });
    }
});
exports.saveEvent = saveEvent;
const editEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        return res.json(yield (0, events_service_1.updateEvent)(Number(req.user.id), Number(req.params.id), req.body));
    }
    catch (error) {
        if (error instanceof Error && error.message === 'EVENT_NOT_FOUND')
            return res.status(404).json({ message: 'Evento no encontrado' });
        if (error instanceof Error && error.message === 'INVALID_EVENT_DATA')
            return res.status(400).json({ message: 'Los datos del evento no son válidos' });
        return res.status(500).json({ message: 'Error al actualizar el evento' });
    }
});
exports.editEvent = editEvent;
const removeEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
            return res.status(401).json({ message: 'Usuario no autenticado' });
        yield (0, events_service_1.deleteEvent)(Number(req.user.id), Number(req.params.id));
        return res.json({ message: 'Evento eliminado' });
    }
    catch (_b) {
        return res.status(404).json({ message: 'Evento no encontrado' });
    }
});
exports.removeEvent = removeEvent;
