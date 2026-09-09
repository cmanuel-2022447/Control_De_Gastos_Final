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
exports.listDebts = listDebts;
exports.createDebt = createDebt;
exports.updateDebt = updateDebt;
exports.deleteDebt = deleteDebt;
const db_1 = require("../../../config/db");
function listDebts(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.pool.query(`SELECT id, descripcion, total, pagado, GREATEST(total - pagado, 0) AS pendiente, estado, created_at
     FROM deudas WHERE usuario_id = $1 ORDER BY created_at DESC, id DESC`, [userId]);
        return result.rows.map((row) => (Object.assign(Object.assign({}, row), { total: Number(row.total), pagado: Number(row.pagado), pendiente: Number(row.pendiente) })));
    });
}
function validate(data) {
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const total = Number(data === null || data === void 0 ? void 0 : data.total);
    const pagado = Number((data === null || data === void 0 ? void 0 : data.pagado) || 0);
    const estado = String((data === null || data === void 0 ? void 0 : data.estado) || 'PENDIENTE').trim().toUpperCase();
    if (!descripcion || !Number.isFinite(total) || total < 0 || !Number.isFinite(pagado) || pagado < 0 || pagado > total || !['PENDIENTE', 'EN PROCESO', 'PAGADA'].includes(estado))
        throw new Error('INVALID_DEBT_DATA');
    return { descripcion, total, pagado, estado: pagado === total ? 'PAGADA' : estado };
}
function createDebt(userId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = validate(data);
        const result = yield db_1.pool.query(`INSERT INTO deudas (usuario_id, descripcion, total, pagado, estado) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, descripcion, total, pagado, GREATEST(total - pagado, 0) AS pendiente, estado`, [userId, value.descripcion, value.total, value.pagado, value.estado]);
        return Object.assign(Object.assign({}, result.rows[0]), { total: Number(result.rows[0].total), pagado: Number(result.rows[0].pagado), pendiente: Number(result.rows[0].pendiente) });
    });
}
function updateDebt(userId, id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = validate(data);
        const result = yield db_1.pool.query(`UPDATE deudas SET descripcion = $1, total = $2, pagado = $3, estado = $4 WHERE id = $5 AND usuario_id = $6
     RETURNING id, descripcion, total, pagado, GREATEST(total - pagado, 0) AS pendiente, estado`, [value.descripcion, value.total, value.pagado, value.estado, id, userId]);
        if (!result.rowCount)
            throw new Error('DEBT_NOT_FOUND');
        return Object.assign(Object.assign({}, result.rows[0]), { total: Number(result.rows[0].total), pagado: Number(result.rows[0].pagado), pendiente: Number(result.rows[0].pendiente) });
    });
}
function deleteDebt(userId, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.pool.query('DELETE FROM deudas WHERE id = $1 AND usuario_id = $2', [id, userId]);
        if (!result.rowCount)
            throw new Error('DEBT_NOT_FOUND');
    });
}
