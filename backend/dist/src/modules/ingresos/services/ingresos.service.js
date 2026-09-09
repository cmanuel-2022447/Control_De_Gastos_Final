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
const getAllIngresos = (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT id, fecha, descripcion, lugar, original, conversion
    FROM public.ingresos
    WHERE usuario_id = $1
    ORDER BY fecha ASC, id ASC`, [usuarioId]);
    return result.rows.map((row) => (Object.assign(Object.assign({}, row), { original: String(row.original), conversion: String(row.conversion) })));
});
exports.getAllIngresos = getAllIngresos;
const saveIngreso = (usuarioId, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim();
    const moneda = String((data === null || data === void 0 ? void 0 : data.moneda) || 'GTQ').trim().toUpperCase();
    const monedaDestino = String((data === null || data === void 0 ? void 0 : data.monedaDestino) || (moneda === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
    const monto = Number(data === null || data === void 0 ? void 0 : data.monto);
    const tasaCambio = Number((_b = (_a = data === null || data === void 0 ? void 0 : data.tasa_cambio) !== null && _a !== void 0 ? _a : data === null || data === void 0 ? void 0 : data.tasaCambio) !== null && _b !== void 0 ? _b : 7.68);
    if (!fecha || !descripcion || !lugar || !Number.isFinite(monto) || monto <= 0) {
        throw new Error('INVALID_INCOME_DATA');
    }
    if (!['GTQ', 'USD'].includes(moneda) || !['GTQ', 'USD'].includes(monedaDestino)) {
        throw new Error('INVALID_INCOME_DATA');
    }
    const montoConvertido = moneda === monedaDestino
        ? monto
        : moneda === 'USD' && monedaDestino === 'GTQ'
            ? monto * tasaCambio
            : monto / tasaCambio;
    const original = `${moneda} ${monto.toFixed(2)}`;
    const conversion = `${monedaDestino} ${montoConvertido.toFixed(2)}`;
    const result = yield db_1.pool.query(`INSERT INTO public.ingresos (usuario_id, fecha, descripcion, lugar, original, conversion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, fecha, descripcion, lugar, original, conversion`, [usuarioId, fecha, descripcion, lugar, original, conversion]);
    const row = result.rows[0];
    return Object.assign(Object.assign({}, row), { original: String(row.original), conversion: String(row.conversion) });
});
exports.saveIngreso = saveIngreso;
const updateIngreso = (usuarioId, id, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const fecha = String((data === null || data === void 0 ? void 0 : data.fecha) || '').trim();
    const descripcion = String((data === null || data === void 0 ? void 0 : data.descripcion) || '').trim();
    const lugar = String((data === null || data === void 0 ? void 0 : data.lugar) || '').trim();
    const moneda = String((data === null || data === void 0 ? void 0 : data.moneda) || 'GTQ').trim().toUpperCase();
    const monedaDestino = String((data === null || data === void 0 ? void 0 : data.monedaDestino) || (moneda === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
    const monto = Number(data === null || data === void 0 ? void 0 : data.monto);
    const tasaCambio = Number((_b = (_a = data === null || data === void 0 ? void 0 : data.tasa_cambio) !== null && _a !== void 0 ? _a : data === null || data === void 0 ? void 0 : data.tasaCambio) !== null && _b !== void 0 ? _b : 7.68);
    if (!fecha || !descripcion || !lugar || !Number.isFinite(monto) || monto <= 0) {
        throw new Error('INVALID_INCOME_DATA');
    }
    if (!['GTQ', 'USD'].includes(moneda) || !['GTQ', 'USD'].includes(monedaDestino)) {
        throw new Error('INVALID_INCOME_DATA');
    }
    const montoConvertido = moneda === monedaDestino
        ? monto
        : moneda === 'USD' && monedaDestino === 'GTQ'
            ? monto * tasaCambio
            : monto / tasaCambio;
    const original = `${moneda} ${monto.toFixed(2)}`;
    const conversion = `${monedaDestino} ${montoConvertido.toFixed(2)}`;
    const result = yield db_1.pool.query(`UPDATE public.ingresos
     SET fecha = $1,
         descripcion = $2,
         lugar = $3,
         original = $4,
         conversion = $5
    WHERE id = $6 AND usuario_id = $7
     RETURNING id, fecha, descripcion, lugar, original, conversion`, [fecha, descripcion, lugar, original, conversion, id, usuarioId]);
    if (result.rowCount === 0) {
        throw new Error('INCOME_NOT_FOUND');
    }
    const row = result.rows[0];
    return Object.assign(Object.assign({}, row), { original: String(row.original), conversion: String(row.conversion) });
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
