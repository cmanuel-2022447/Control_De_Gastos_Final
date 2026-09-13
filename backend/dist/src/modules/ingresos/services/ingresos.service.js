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
exports.clearIngresos = exports.deleteIngreso = exports.updateIngreso = exports.saveIngreso = exports.getAllIngresos = void 0;
const db_1 = require("../../../config/db");
const money_1 = require("../../../util/money");
const getAllIngresos = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT id, fecha, descripcion, lugar, monto::text, moneda, moneda_destino, original, conversion
    FROM public.ingresos
    WHERE usuario_id = $1
    ORDER BY fecha ASC, id ASC`, [usuarioId]);
    return result.rows.map((row) => (Object.assign(Object.assign({}, row), { monto: String(row.monto), original: String(row.original), conversion: String(row.conversion) })));
});
exports.getAllIngresos = getAllIngresos;
const saveIngreso = (usuarioId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim();
    const moneda = String((data === null || data === void 0 ? void 0 : data.moneda) || 'GTQ').trim().toUpperCase();
    const monedaDestino = String((data === null || data === void 0 ? void 0 : data.monedaDestino) || (moneda === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
    const monto = (0, money_1.parseMoney)(data === null || data === void 0 ? void 0 : data.monto);
    if (!fecha || !descripcion || !lugar || !monto)
        throw new Error('INVALID_INCOME_DATA');
    if (!['GTQ', 'USD'].includes(moneda) || !['GTQ', 'USD'].includes(monedaDestino)) {
        throw new Error('INVALID_CURRENCY');
    }
    const fechaResult = yield db_1.pool.query('SELECT $1::date = CURRENT_DATE AS es_hoy', [fecha]);
    if (!fechaResult.rows[0].es_hoy)
        throw new Error('INCOME_DATE_NOT_TODAY');
    const conversionResult = yield db_1.pool.query(`SELECT CASE WHEN $1::text = $2::text THEN $3::numeric
                 WHEN $1::text = 'USD' THEN $3::numeric * 7.68::numeric
                 ELSE $3::numeric / 7.68::numeric END AS monto_convertido`, [moneda, monedaDestino, monto]);
    const original = `${moneda} ${monto}`;
    const conversion = `${monedaDestino} ${String(conversionResult.rows[0].monto_convertido)}`;
    const result = yield db_1.pool.query(`INSERT INTO public.ingresos (usuario_id, fecha, descripcion, lugar, monto, moneda, moneda_destino, original, conversion)
     VALUES ($1, $2, $3, $4, $5::numeric, $6, $7, $8, $9)
     RETURNING id, fecha, descripcion, lugar, monto::text, moneda, moneda_destino, original, conversion`, [usuarioId, fecha, descripcion, lugar, monto, moneda, monedaDestino, original, conversion]);
    const row = result.rows[0];
    return Object.assign(Object.assign({}, row), { monto: String(row.monto), original: String(row.original), conversion: String(row.conversion) });
});
exports.saveIngreso = saveIngreso;
const updateIngreso = (usuarioId, id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim();
    const moneda = String((data === null || data === void 0 ? void 0 : data.moneda) || 'GTQ').trim().toUpperCase();
    const monedaDestino = String((data === null || data === void 0 ? void 0 : data.monedaDestino) || (moneda === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
    const monto = (0, money_1.parseMoney)(data === null || data === void 0 ? void 0 : data.monto);
    if (!fecha || !descripcion || !lugar || !monto)
        throw new Error('INVALID_INCOME_DATA');
    if (!['GTQ', 'USD'].includes(moneda) || !['GTQ', 'USD'].includes(monedaDestino)) {
        throw new Error('INVALID_CURRENCY');
    }
    const fechaResult = yield db_1.pool.query('SELECT $1::date = CURRENT_DATE AS es_hoy', [fecha]);
    if (!fechaResult.rows[0].es_hoy)
        throw new Error('INCOME_DATE_NOT_TODAY');
    const conversionResult = yield db_1.pool.query(`SELECT CASE WHEN $1::text = $2::text THEN $3::numeric
                 WHEN $1::text = 'USD' THEN $3::numeric * 7.68::numeric
                 ELSE $3::numeric / 7.68::numeric END AS monto_convertido`, [moneda, monedaDestino, monto]);
    const original = `${moneda} ${monto}`;
    const conversion = `${monedaDestino} ${String(conversionResult.rows[0].monto_convertido)}`;
    const result = yield db_1.pool.query(`UPDATE public.ingresos
    SET fecha = $1,
         descripcion = $2,
         lugar = $3,
        monto = $4::numeric,
        moneda = $5,
        moneda_destino = $6,
        original = $7,
        conversion = $8
      WHERE id = $9 AND usuario_id = $10
    RETURNING id, fecha, descripcion, lugar, monto::text, moneda, moneda_destino, original, conversion`, [fecha, descripcion, lugar, monto, moneda, monedaDestino, original, conversion, id, usuarioId]);
    if (result.rowCount === 0) {
        throw new Error('INCOME_NOT_FOUND');
    }
    const row = result.rows[0];
    return Object.assign(Object.assign({}, row), { monto: String(row.monto), original: String(row.original), conversion: String(row.conversion) });
});
exports.updateIngreso = updateIngreso;
const deleteIngreso = (usuarioId, id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query('DELETE FROM public.ingresos WHERE id = $1 AND usuario_id = $2 RETURNING id', [id, usuarioId]);
    if (result.rowCount === 0) {
        throw new Error('INCOME_NOT_FOUND');
    }
    return { id: Number(result.rows[0].id) };
});
exports.deleteIngreso = deleteIngreso;
const clearIngresos = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield db_1.pool.query('DELETE FROM public.ingresos WHERE usuario_id = $1', [usuarioId]);
    return { deleted: (_a = result.rowCount) !== null && _a !== void 0 ? _a : 0 };
});
exports.clearIngresos = clearIngresos;
