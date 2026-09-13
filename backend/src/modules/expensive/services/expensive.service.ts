import { pool } from '../../../config/db';
import { convertMoneySql, parseMoney } from '../../../util/money';

export interface ExpenseData {
    id: number;
    fecha: string;
    descripcion: string;
    lugar: string | null;
    categoria: string;
    tipo: 'FIJO' | 'VARIABLE';
    monto: string;
    moneda: 'GTQ' | 'USD';
    total_deuda: string | null;
}

export const getAllExpenses = async (usuarioId: number): Promise<ExpenseData[]> => {
    const result = await pool.query(
                `SELECT g.id, g.fecha, g.descripcion, g.lugar, g.categoria, g.tipo, g.monto::text, g.moneda,
                    CASE WHEN g.categoria = 'Deuda' THEN deuda.total_deuda::text ELSE NULL END AS total_deuda
                 FROM public.gastos g
                 LEFT JOIN LATERAL (
                    SELECT MAX(e.total_deuda) AS total_deuda
                    FROM public.gastos e
                    WHERE e.usuario_id = g.usuario_id AND e.categoria = 'Deuda'
                      AND e.categoria = g.categoria
                      AND LOWER(TRIM(e.descripcion)) = LOWER(TRIM(g.descripcion))
                 ) deuda ON TRUE
         WHERE g.usuario_id = $1
         ORDER BY fecha DESC, id DESC`,
        [usuarioId]
    );

    return result.rows.map((row) => ({ ...row, monto: String(row.monto), total_deuda: row.total_deuda === null ? null : String(row.total_deuda) }));
};

export const saveExpense = async (usuarioId: number, data: any): Promise<ExpenseData> => {
    const fecha = String(data?.fecha || '').trim();
    const descripcion = String(data?.descripcion || '').trim();
    const lugar = String(data?.lugar || '').trim() || null;
    const categoria = String(data?.categoria || '').trim();
    const tipo = String(data?.tipo || 'VARIABLE').trim().toUpperCase();
    const moneda = String(data?.moneda || 'GTQ').trim().toUpperCase();
    const monto = parseMoney(data?.monto);
    const esDeuda = categoria.toUpperCase() === 'DEUDA';
    const totalDeuda = esDeuda && data?.total_deuda !== '' && data?.total_deuda !== undefined && data?.total_deuda !== null ? parseMoney(data.total_deuda, true) : null;

    if (!fecha || !descripcion || !categoria || !['FIJO', 'VARIABLE'].includes(tipo) || !['GTQ', 'USD'].includes(moneda) || !monto || (data?.total_deuda !== '' && data?.total_deuda !== undefined && data?.total_deuda !== null && !totalDeuda)) {
        throw new Error('INVALID_EXPENSE_DATA');
    }

    if (esDeuda && totalDeuda === null && !(await existeTotalDeuda(usuarioId, descripcion, categoria))) {
        throw new Error('INVALID_EXPENSE_DATA');
    }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock($1)', [usuarioId]);
            const available = await client.query(
                `SELECT COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM ingresos WHERE usuario_id = $1), 0)
                                - COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1), 0) AS disponible`,
                [usuarioId]
            );
            const newExpense = await client.query(
                `SELECT $1::numeric * CASE WHEN $2::text = 'USD' THEN 7.68::numeric ELSE 1::numeric END AS monto`,
                [monto, moneda]
            );
            if (available.rows[0].disponible < newExpense.rows[0].monto) throw new Error('INSUFFICIENT_FUNDS');
            const result = await client.query(
        `INSERT INTO public.gastos (usuario_id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda)
                 VALUES ($1, $2, $3, $4, $5, $6, $7::numeric, $8, $9::numeric)
                 RETURNING id, fecha, descripcion, lugar, categoria, tipo, monto::text, moneda, total_deuda::text`,
                [usuarioId, fecha, descripcion, lugar, categoria, tipo, monto, moneda, totalDeuda]
            );
            await client.query('COMMIT');
            return { ...result.rows[0], monto: String(result.rows[0].monto), total_deuda: result.rows[0].total_deuda === null ? null : String(result.rows[0].total_deuda) };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
};

export const updateExpense = async (usuarioId: number, id: number, data: any): Promise<ExpenseData> => {
    const fecha = String(data?.fecha || '').trim();
    const descripcion = String(data?.descripcion || '').trim();
    const lugar = String(data?.lugar || '').trim() || null;
    const categoria = String(data?.categoria || '').trim();
    const tipo = String(data?.tipo || 'VARIABLE').trim().toUpperCase();
    const moneda = String(data?.moneda || 'GTQ').trim().toUpperCase();
    const monto = parseMoney(data?.monto);
    const esDeuda = categoria.toUpperCase() === 'DEUDA';
    const totalDeuda = esDeuda && data?.total_deuda !== '' && data?.total_deuda !== undefined && data?.total_deuda !== null ? parseMoney(data.total_deuda, true) : null;
    if (!fecha || !descripcion || !categoria || !['FIJO', 'VARIABLE'].includes(tipo) || !['GTQ', 'USD'].includes(moneda) || !monto || (data?.total_deuda !== '' && data?.total_deuda !== undefined && data?.total_deuda !== null && !totalDeuda)) throw new Error('INVALID_EXPENSE_DATA');
    if (esDeuda && totalDeuda === null && !(await existeTotalDeuda(usuarioId, descripcion, categoria, id))) throw new Error('INVALID_EXPENSE_DATA');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock($1)', [usuarioId]);
            const available = await client.query(
                `SELECT COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM ingresos WHERE usuario_id = $1), 0)
                                - COALESCE((SELECT SUM(${convertMoneySql('monto', 'moneda')}) FROM gastos WHERE usuario_id = $1 AND id <> $2), 0) AS disponible`,
                [usuarioId, id]
            );
            const newExpense = await client.query(
                `SELECT $1::numeric * CASE WHEN $2::text = 'USD' THEN 7.68::numeric ELSE 1::numeric END AS monto`,
                [monto, moneda]
            );
            if (available.rows[0].disponible < newExpense.rows[0].monto) throw new Error('INSUFFICIENT_FUNDS');
            const result = await client.query(
        `UPDATE public.gastos
                        SET fecha = $1, descripcion = $2, lugar = $3, categoria = $4, tipo = $5, monto = $6::numeric, moneda = $7, total_deuda = $8::numeric
                        WHERE id = $9 AND usuario_id = $10
                        RETURNING id, fecha, descripcion, lugar, categoria, tipo, monto::text, moneda, total_deuda::text`,
                     [fecha, descripcion, lugar, categoria, tipo, monto, moneda, totalDeuda, id, usuarioId]
            );
            if (!result.rowCount) throw new Error('EXPENSE_NOT_FOUND');
            await client.query('COMMIT');
            return { ...result.rows[0], monto: String(result.rows[0].monto), total_deuda: result.rows[0].total_deuda === null ? null : String(result.rows[0].total_deuda) };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
};

export const deleteExpense = async (usuarioId: number, id: number): Promise<void> => {
    const result = await pool.query('DELETE FROM public.gastos WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
    if (!result.rowCount) throw new Error('EXPENSE_NOT_FOUND');
};

const existeTotalDeuda = async (usuarioId: number, descripcion: string, categoria: string, excluirId?: number): Promise<boolean> => {
        const result = await pool.query(
                `SELECT 1 FROM public.gastos
                 WHERE usuario_id = $1 AND categoria = $2
                     AND LOWER(TRIM(descripcion)) = LOWER(TRIM($3))
                     AND total_deuda IS NOT NULL
                     AND ($4::integer IS NULL OR id <> $4)
                 LIMIT 1`,
                [usuarioId, categoria, descripcion, excluirId ?? null]
        );
        return Boolean(result.rowCount);
};

