import { pool } from '../../../config/db';
import { convertMoneySql } from '../../../util/money';

export async function getDashboardSummary(usuarioId: number) {
    const result = await pool.query(
        `SELECT
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM ingresos WHERE usuario_id = $1), 0) / 7.68 ELSE COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM ingresos WHERE usuario_id = $1), 0) END AS ingresos,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1), 0) / 7.68 ELSE COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1), 0) END AS gastos,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1 AND tipo = 'FIJO'), 0) / 7.68 ELSE COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1 AND tipo = 'FIJO'), 0) END AS gastos_fijos,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(GREATEST(total_deuda - pagos, 0)) FROM (
                SELECT MAX(${convertMoneySql('total_deuda', 'moneda')}) AS total_deuda,
                       SUM(${convertMoneySql('monto', 'moneda')}) AS pagos
                FROM gastos
                WHERE usuario_id = $1 AND categoria = 'Deuda'
                GROUP BY LOWER(TRIM(descripcion))
            ) deudas), 0) / 7.68 ELSE COALESCE((SELECT SUM(GREATEST(total_deuda - pagos, 0)) FROM (
                SELECT MAX(${convertMoneySql('total_deuda', 'moneda')}) AS total_deuda,
                       SUM(${convertMoneySql('monto', 'moneda')}) AS pagos
                FROM gastos
                WHERE usuario_id = $1 AND categoria = 'Deuda'
                GROUP BY LOWER(TRIM(descripcion))
            ) deudas), 0) END AS deuda_pendiente,
            CASE WHEN u.moneda = 'USD' THEN COALESCE((SELECT SUM(presupuesto) FROM eventos WHERE usuario_id = $1 AND estado <> 'CANCELADO'), 0) / 7.68 ELSE COALESCE((SELECT SUM(presupuesto) FROM eventos WHERE usuario_id = $1 AND estado <> 'CANCELADO'), 0) END AS presupuesto_eventos
        FROM usuarios u WHERE u.id = $1`,
        [usuarioId]
    );
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
}
