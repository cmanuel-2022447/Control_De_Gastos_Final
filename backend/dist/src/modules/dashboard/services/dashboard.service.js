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
exports.getDashboardSummary = getDashboardSummary;
const db_1 = require("../../../config/db");
const money_1 = require("../../../util/money");
function getDashboardSummary(usuarioId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.pool.query(`SELECT
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) FROM ingresos WHERE usuario_id = $1), 0) / 7.68 ELSE COALESCE((SELECT SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) FROM ingresos WHERE usuario_id = $1), 0) END AS ingresos,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1), 0) / 7.68 ELSE COALESCE((SELECT SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1), 0) END AS gastos,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1 AND tipo = 'FIJO'), 0) / 7.68 ELSE COALESCE((SELECT SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1 AND tipo = 'FIJO'), 0) END AS gastos_fijos,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(GREATEST(total_deuda - pagos, 0)) FROM (
                SELECT MAX(${(0, money_1.convertMoneySql)('total_deuda', 'moneda')}) AS total_deuda,
                       SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) AS pagos
                FROM gastos
                WHERE usuario_id = $1 AND categoria = 'Deuda'
                GROUP BY LOWER(TRIM(descripcion))
            ) deudas), 0) / 7.68 ELSE COALESCE((SELECT SUM(GREATEST(total_deuda - pagos, 0)) FROM (
                SELECT MAX(${(0, money_1.convertMoneySql)('total_deuda', 'moneda')}) AS total_deuda,
                       SUM(${(0, money_1.convertMoneySql)('monto', 'moneda')}) AS pagos
                FROM gastos
                WHERE usuario_id = $1 AND categoria = 'Deuda'
                GROUP BY LOWER(TRIM(descripcion))
            ) deudas), 0) END AS deuda_pendiente,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(presupuesto) FROM eventos WHERE usuario_id = $1 AND estado <> 'CANCELADO'), 0) / 7.68 ELSE COALESCE((SELECT SUM(presupuesto) FROM eventos WHERE usuario_id = $1 AND estado <> 'CANCELADO'), 0) END AS presupuesto_eventos
        FROM usuarios u WHERE u.id = $1`, [usuarioId]);
        const row = result.rows[0];
        const totalIngresos = String(row.ingresos);
        const totalGastos = String(row.gastos);
        const presupuestoEvento = String(row.presupuesto_eventos);
        return {
            totalIngresos,
            totalGastos,
            dineroRestante: String(Number(row.ingresos) - Number(row.gastos)),
            gastosFijos: String(row.gastos_fijos),
            deudaPendiente: String(row.deuda_pendiente),
            presupuestoEvento
        };
    });
}
