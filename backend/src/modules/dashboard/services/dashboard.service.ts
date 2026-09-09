import { pool } from '../../../config/db';

export async function getDashboardSummary(usuarioId: number) {
    const result = await pool.query(
        `SELECT
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
            COALESCE((SELECT SUM(presupuesto) FROM eventos WHERE usuario_id = $1 AND estado <> 'CANCELADO'), 0) AS presupuesto_eventos`,
        [usuarioId]
    );
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
}
