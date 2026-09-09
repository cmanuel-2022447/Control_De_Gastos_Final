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
exports.listSavings = listSavings;
exports.createSaving = createSaving;
exports.updateSaving = updateSaving;
exports.deleteSaving = deleteSaving;
const db_1 = require("../../../config/db");
function listSavings(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.pool.query(`SELECT id, meta, descripcion, objetivo, ahorrado, GREATEST(objetivo - ahorrado, 0) AS faltante, fecha_inicio, fecha_objetivo, estado
     FROM ahorros WHERE usuario_id = $1 ORDER BY created_at DESC, id DESC`, [userId]);
        return result.rows.map((row) => (Object.assign(Object.assign({}, row), { objetivo: Number(row.objetivo), ahorrado: Number(row.ahorrado), faltante: Number(row.faltante) })));
    });
}
function validate(data) {
    const meta = String((data === null || data === void 0 ? void 0 : data.meta) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim() || null;
    const objetivo = Number(data === null || data === void 0 ? void 0 : data.objetivo);
    const ahorrado = Number((data === null || data === void 0 ? void 0 : data.ahorrado) || 0);
    const fechaInicio = String((data === null || data === void 0 ? void 0 : data.fecha_inicio) || (data === null || data === void 0 ? void 0 : data.fechaInicio) || '').trim();
    const fechaObjetivo = String((data === null || data === void 0 ? void 0 : data.fecha_objetivo) || (data === null || data === void 0 ? void 0 : data.fechaObjetivo) || '').trim() || null;
    if (!meta || !fechaInicio || !Number.isFinite(objetivo) || objetivo <= 0 || !Number.isFinite(ahorrado) || ahorrado < 0 || ahorrado > objetivo)
        throw new Error('INVALID_SAVING_DATA');
    return { meta, descripcion, objetivo, ahorrado, fechaInicio, fechaObjetivo, estado: ahorrado >= objetivo ? 'COMPLETADA' : 'ACTIVA' };
}
function createSaving(userId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = validate(data);
        const result = yield db_1.pool.query(`INSERT INTO ahorros (usuario_id, meta, descripcion, objetivo, ahorrado, fecha_inicio, fecha_objetivo, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, meta, descripcion, objetivo, ahorrado, GREATEST(objetivo - ahorrado, 0) AS faltante, fecha_inicio, fecha_objetivo, estado`, [userId, value.meta, value.descripcion, value.objetivo, value.ahorrado, value.fechaInicio, value.fechaObjetivo, value.estado]);
        return Object.assign(Object.assign({}, result.rows[0]), { objetivo: Number(result.rows[0].objetivo), ahorrado: Number(result.rows[0].ahorrado), faltante: Number(result.rows[0].faltante) });
    });
}
function updateSaving(userId, id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = validate(data);
        const result = yield db_1.pool.query(`UPDATE ahorros SET meta = $1, descripcion = $2, objetivo = $3, ahorrado = $4, fecha_inicio = $5, fecha_objetivo = $6, estado = $7
     WHERE id = $8 AND usuario_id = $9
     RETURNING id, meta, descripcion, objetivo, ahorrado, GREATEST(objetivo - ahorrado, 0) AS faltante, fecha_inicio, fecha_objetivo, estado`, [value.meta, value.descripcion, value.objetivo, value.ahorrado, value.fechaInicio, value.fechaObjetivo, value.estado, id, userId]);
        if (!result.rowCount)
            throw new Error('SAVING_NOT_FOUND');
        return Object.assign(Object.assign({}, result.rows[0]), { objetivo: Number(result.rows[0].objetivo), ahorrado: Number(result.rows[0].ahorrado), faltante: Number(result.rows[0].faltante) });
    });
}
function deleteSaving(userId, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.pool.query('DELETE FROM ahorros WHERE id = $1 AND usuario_id = $2', [id, userId]);
        if (!result.rowCount)
            throw new Error('SAVING_NOT_FOUND');
    });
}
