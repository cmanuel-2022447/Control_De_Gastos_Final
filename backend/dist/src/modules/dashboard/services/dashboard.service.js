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
function getDashboardSummary(usuarioId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.pool.query(`SELECT
            COALESCE((SELECT SUM(CASE WHEN original LIKE 'USD %' THEN REPLACE(SPLIT_PART(original, ' ', 2), ',', '')::numeric * 7.68 ELSE REPLACE(SPLIT_PART(original, ' ', 2), ',', '')::numeric END) FROM ingresos WHERE usuario_id = $1), 0) AS ingresos,
            COALESCE((SELECT SUM(CASE WHEN moneda = 'USD' THEN monto * 7.68 ELSE monto END) FROM gastos WHERE usuario_id = $1), 0) AS gastos,
            COALESCE((SELECT SUM(CASE WHEN moneda = 'USD' THEN monto * 7.68 ELSE monto END) FROM gastos WHERE usuario_id = $1 AND tipo = 'FIJO'), 0) AS gastos_fijos,
            COALESCE((SELECT SUM(GREATEST(total_deuda - pagos, 0)) FROM (
                SELECT MAX(total_deuda) AS total_deuda,
                       SUM(CASE WHEN moneda = 'USD' THEN monto * 7.68 ELSE monto END) AS pagos
                FROM gastos
                  WHERE usuario_id = $1 AND categoria = 'Deuda'
                  GROUP BY LOWER(TRIM(descripcion))
            ) deudas), 0) AS deuda_pendiente,
            COALESCE((SELECT SUM(presupuesto) FROM eventos WHERE usuario_id = $1 AND estado <> 'CANCELADO'), 0) AS presupuesto_eventos`, [usuarioId]);
        const row = result.rows[0];
        const totalIngresos = Number(row.ingresos);
        const totalGastos = Number(row.gastos);
        const presupuestoEvento = Number(row.presupuesto_eventos);
        return {
            totalIngresos,
            totalGastos,
            dineroRestante: totalIngresos - totalGastos,
            gastosFijos: Number(row.gastos_fijos),
            deudaPendiente: Number(row.deuda_pendiente),
            presupuestoEvento
        };
    });
}
