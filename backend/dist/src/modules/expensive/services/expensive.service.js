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
exports.deleteExpense = exports.updateExpense = exports.saveExpense = exports.getAllExpenses = void 0;
const db_1 = require("../../../config/db");
const getAllExpenses = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT g.id, g.fecha, g.descripcion, g.lugar, g.categoria, g.tipo, g.monto, g.moneda,
                    CASE WHEN g.categoria = 'Deuda' THEN deuda.total_deuda ELSE NULL END AS total_deuda
                 FROM public.gastos g
                 LEFT JOIN LATERAL (
                    SELECT MAX(e.total_deuda) AS total_deuda
                    FROM public.gastos e
                    WHERE e.usuario_id = g.usuario_id AND e.categoria = 'Deuda'
                      AND e.categoria = g.categoria
                      AND LOWER(TRIM(e.descripcion)) = LOWER(TRIM(g.descripcion))
                 ) deuda ON TRUE
         WHERE g.usuario_id = $1
         ORDER BY fecha DESC, id DESC`, [usuarioId]);
    return result.rows.map((row) => (Object.assign(Object.assign({}, row), { monto: Number(row.monto), total_deuda: row.total_deuda === null ? null : Number(row.total_deuda) })));
});
exports.getAllExpenses = getAllExpenses;
const saveExpense = (usuarioId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim() || null;
    const categoria = String((data === null || data === void 0 ? void 0 : data.categoria) || '').trim();
    const tipo = String((data === null || data === void 0 ? void 0 : data.tipo) || 'VARIABLE').trim().toUpperCase();
    const moneda = String((data === null || data === void 0 ? void 0 : data.moneda) || 'GTQ').trim().toUpperCase();
    const monto = Number(data === null || data === void 0 ? void 0 : data.monto);
    const esDeuda = categoria.toUpperCase() === 'DEUDA';
    const totalDeuda = esDeuda && (data === null || data === void 0 ? void 0 : data.total_deuda) !== '' && (data === null || data === void 0 ? void 0 : data.total_deuda) !== undefined && (data === null || data === void 0 ? void 0 : data.total_deuda) !== null ? Number(data.total_deuda) : null;
    if (!fecha || !descripcion || !categoria || !['FIJO', 'VARIABLE'].includes(tipo) || !['GTQ', 'USD'].includes(moneda) || !Number.isFinite(monto) || monto <= 0 || (totalDeuda !== null && (!Number.isFinite(totalDeuda) || totalDeuda < 0))) {
        throw new Error('INVALID_EXPENSE_DATA');
    }
    if (esDeuda && totalDeuda === null && !(yield existeTotalDeuda(usuarioId, descripcion, categoria))) {
        throw new Error('INVALID_EXPENSE_DATA');
    }
    const result = yield db_1.pool.query(`INSERT INTO public.gastos (usuario_id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda`, [usuarioId, fecha, descripcion, lugar, categoria, tipo, monto, moneda, totalDeuda]);
    return Object.assign(Object.assign({}, result.rows[0]), { monto: Number(result.rows[0].monto), total_deuda: result.rows[0].total_deuda === null ? null : Number(result.rows[0].total_deuda) });
});
exports.saveExpense = saveExpense;
const updateExpense = (usuarioId, id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim() || null;
    const categoria = String((data === null || data === void 0 ? void 0 : data.categoria) || '').trim();
    const tipo = String((data === null || data === void 0 ? void 0 : data.tipo) || 'VARIABLE').trim().toUpperCase();
    const moneda = String((data === null || data === void 0 ? void 0 : data.moneda) || 'GTQ').trim().toUpperCase();
    const monto = Number(data === null || data === void 0 ? void 0 : data.monto);
    const esDeuda = categoria.toUpperCase() === 'DEUDA';
    const totalDeuda = esDeuda && (data === null || data === void 0 ? void 0 : data.total_deuda) !== '' && (data === null || data === void 0 ? void 0 : data.total_deuda) !== undefined && (data === null || data === void 0 ? void 0 : data.total_deuda) !== null ? Number(data.total_deuda) : null;
    if (!fecha || !descripcion || !categoria || !['FIJO', 'VARIABLE'].includes(tipo) || !['GTQ', 'USD'].includes(moneda) || !Number.isFinite(monto) || monto <= 0 || (totalDeuda !== null && (!Number.isFinite(totalDeuda) || totalDeuda < 0)))
        throw new Error('INVALID_EXPENSE_DATA');
    if (esDeuda && totalDeuda === null && !(yield existeTotalDeuda(usuarioId, descripcion, categoria, id)))
        throw new Error('INVALID_EXPENSE_DATA');
    const result = yield db_1.pool.query(`UPDATE public.gastos
            SET fecha = $1, descripcion = $2, lugar = $3, categoria = $4, tipo = $5, monto = $6, moneda = $7, total_deuda = $8
            WHERE id = $9 AND usuario_id = $10
            RETURNING id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda`, [fecha, descripcion, lugar, categoria, tipo, monto, moneda, totalDeuda, id, usuarioId]);
    if (!result.rowCount)
        throw new Error('EXPENSE_NOT_FOUND');
    return Object.assign(Object.assign({}, result.rows[0]), { monto: Number(result.rows[0].monto), total_deuda: result.rows[0].total_deuda === null ? null : Number(result.rows[0].total_deuda) });
});
exports.updateExpense = updateExpense;
const deleteExpense = (usuarioId, id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query('DELETE FROM public.gastos WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
    if (!result.rowCount)
        throw new Error('EXPENSE_NOT_FOUND');
});
exports.deleteExpense = deleteExpense;
const existeTotalDeuda = (usuarioId, descripcion, categoria, excluirId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT 1 FROM public.gastos
                 WHERE usuario_id = $1 AND categoria = $2
                     AND LOWER(TRIM(descripcion)) = LOWER(TRIM($3))
                     AND total_deuda IS NOT NULL
                     AND ($4::integer IS NULL OR id <> $4)
                 LIMIT 1`, [usuarioId, categoria, descripcion, excluirId !== null && excluirId !== void 0 ? excluirId : null]);
    return Boolean(result.rowCount);
});
