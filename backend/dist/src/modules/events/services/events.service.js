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
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvents = void 0;
const db_1 = require("../../../config/db");
const getEvents = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT e.id, e.nombre, e.tipo, e.invitados, e.lugar, e.fecha, e.presupuesto, e.estado,
          0 AS gastado
         FROM eventos e
     WHERE e.usuario_id = $1
     ORDER BY e.fecha ASC, e.id ASC`, [usuarioId]);
    return result.rows.map((row) => (Object.assign(Object.assign({}, row), { presupuesto: Number(row.presupuesto), gastado: Number(row.gastado) })));
});
exports.getEvents = getEvents;
const createEvent = (usuarioId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const nombre = String((data === null || data === void 0 ? void 0 : data.nombre) || '').trim();
    const tipo = String((data === null || data === void 0 ? void 0 : data.tipo) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim() || null;
    const invitados = (data === null || data === void 0 ? void 0 : data.invitados) === '' || (data === null || data === void 0 ? void 0 : data.invitados) === undefined || (data === null || data === void 0 ? void 0 : data.invitados) === null ? null : Number(data.invitados);
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const presupuesto = Number(data === null || data === void 0 ? void 0 : data.presupuesto);
    if (!nombre || !tipo || !fecha || !Number.isFinite(presupuesto) || presupuesto < 0 || (invitados !== null && (!Number.isInteger(invitados) || invitados < 0)))
        throw new Error('INVALID_EVENT_DATA');
    const result = yield db_1.pool.query(`INSERT INTO eventos (usuario_id, nombre, tipo, invitados, lugar, fecha, presupuesto)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombre, tipo, invitados, lugar, fecha, presupuesto, estado`, [usuarioId, nombre, tipo, invitados, lugar, fecha, presupuesto]);
    return Object.assign(Object.assign({}, result.rows[0]), { presupuesto: Number(result.rows[0].presupuesto), gastado: 0 });
});
exports.createEvent = createEvent;
const updateEvent = (usuarioId, eventId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const nombre = String((data === null || data === void 0 ? void 0 : data.nombre) || '').trim();
    const tipo = String((data === null || data === void 0 ? void 0 : data.tipo) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim() || null;
    const invitados = (data === null || data === void 0 ? void 0 : data.invitados) === '' || (data === null || data === void 0 ? void 0 : data.invitados) === undefined || (data === null || data === void 0 ? void 0 : data.invitados) === null ? null : Number(data.invitados);
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const presupuesto = Number(data === null || data === void 0 ? void 0 : data.presupuesto);
    const estado = String((data === null || data === void 0 ? void 0 : data.estado) || 'PLANIFICADO').trim().toUpperCase();
    if (!nombre || !tipo || !fecha || !Number.isFinite(presupuesto) || presupuesto < 0 || (invitados !== null && (!Number.isInteger(invitados) || invitados < 0)))
        throw new Error('INVALID_EVENT_DATA');
    const result = yield db_1.pool.query(`UPDATE eventos SET nombre = $1, tipo = $2, invitados = $3, lugar = $4, fecha = $5, presupuesto = $6, estado = $7
     WHERE id = $8 AND usuario_id = $9
     RETURNING id, nombre, tipo, invitados, lugar, fecha, presupuesto, estado`, [nombre, tipo, invitados, lugar, fecha, presupuesto, estado, eventId, usuarioId]);
    if (!result.rowCount)
        throw new Error('EVENT_NOT_FOUND');
    return Object.assign(Object.assign({}, result.rows[0]), { presupuesto: Number(result.rows[0].presupuesto) });
});
exports.updateEvent = updateEvent;
const deleteEvent = (usuarioId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query('DELETE FROM eventos WHERE id = $1 AND usuario_id = $2', [eventId, usuarioId]);
    if (!result.rowCount)
        throw new Error('EVENT_NOT_FOUND');
});
exports.deleteEvent = deleteEvent;
