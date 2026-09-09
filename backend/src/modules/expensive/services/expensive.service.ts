import { pool } from '../../../config/db';

export interface ExpenseData {
    id: number;
    fecha: string;
    descripcion: string;
    lugar: string | null;
    categoria: string;
    tipo: 'FIJO' | 'VARIABLE';
    monto: number;
    moneda: 'GTQ' | 'USD';
    total_deuda: number | null;
}

export const getAllExpenses = async (usuarioId: number): Promise<ExpenseData[]> => {
    const result = await pool.query(
                `SELECT g.id, g.fecha, g.descripcion, g.lugar, g.categoria, g.tipo, g.monto, g.moneda,
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
         ORDER BY fecha DESC, id DESC`,
        [usuarioId]
    );

    return result.rows.map((row) => ({ ...row, monto: Number(row.monto), total_deuda: row.total_deuda === null ? null : Number(row.total_deuda) }));
};

export const saveExpense = async (usuarioId: number, data: any): Promise<ExpenseData> => {
    const fecha = String(data?.fecha || '').trim();
    const descripcion = String(data?.descripcion || '').trim();
    const lugar = String(data?.lugar || '').trim() || null;
    const categoria = String(data?.categoria || '').trim();
    const tipo = String(data?.tipo || 'VARIABLE').trim().toUpperCase();
    const moneda = String(data?.moneda || 'GTQ').trim().toUpperCase();
    const monto = Number(data?.monto);
    const esDeuda = categoria.toUpperCase() === 'DEUDA';
    const totalDeuda = esDeuda && data?.total_deuda !== '' && data?.total_deuda !== undefined && data?.total_deuda !== null ? Number(data.total_deuda) : null;

    if (!fecha || !descripcion || !categoria || !['FIJO', 'VARIABLE'].includes(tipo) || !['GTQ', 'USD'].includes(moneda) || !Number.isFinite(monto) || monto <= 0 || (totalDeuda !== null && (!Number.isFinite(totalDeuda) || totalDeuda < 0))) {
        throw new Error('INVALID_EXPENSE_DATA');
    }

    if (esDeuda && totalDeuda === null && !(await existeTotalDeuda(usuarioId, descripcion, categoria))) {
        throw new Error('INVALID_EXPENSE_DATA');
    }

    const result = await pool.query(
        `INSERT INTO public.gastos (usuario_id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda`,
        [usuarioId, fecha, descripcion, lugar, categoria, tipo, monto, moneda, totalDeuda]
    );

    return { ...result.rows[0], monto: Number(result.rows[0].monto), total_deuda: result.rows[0].total_deuda === null ? null : Number(result.rows[0].total_deuda) };
};

export const updateExpense = async (usuarioId: number, id: number, data: any): Promise<ExpenseData> => {
    const fecha = String(data?.fecha || '').trim();
    const descripcion = String(data?.descripcion || '').trim();
    const lugar = String(data?.lugar || '').trim() || null;
    const categoria = String(data?.categoria || '').trim();
    const tipo = String(data?.tipo || 'VARIABLE').trim().toUpperCase();
    const moneda = String(data?.moneda || 'GTQ').trim().toUpperCase();
    const monto = Number(data?.monto);
    const esDeuda = categoria.toUpperCase() === 'DEUDA';
    const totalDeuda = esDeuda && data?.total_deuda !== '' && data?.total_deuda !== undefined && data?.total_deuda !== null ? Number(data.total_deuda) : null;
    if (!fecha || !descripcion || !categoria || !['FIJO', 'VARIABLE'].includes(tipo) || !['GTQ', 'USD'].includes(moneda) || !Number.isFinite(monto) || monto <= 0 || (totalDeuda !== null && (!Number.isFinite(totalDeuda) || totalDeuda < 0))) throw new Error('INVALID_EXPENSE_DATA');
    if (esDeuda && totalDeuda === null && !(await existeTotalDeuda(usuarioId, descripcion, categoria, id))) throw new Error('INVALID_EXPENSE_DATA');

    const result = await pool.query(
        `UPDATE public.gastos
            SET fecha = $1, descripcion = $2, lugar = $3, categoria = $4, tipo = $5, monto = $6, moneda = $7, total_deuda = $8
            WHERE id = $9 AND usuario_id = $10
            RETURNING id, fecha, descripcion, lugar, categoria, tipo, monto, moneda, total_deuda`,
           [fecha, descripcion, lugar, categoria, tipo, monto, moneda, totalDeuda, id, usuarioId]
    );
    if (!result.rowCount) throw new Error('EXPENSE_NOT_FOUND');
    return { ...result.rows[0], monto: Number(result.rows[0].monto), total_deuda: result.rows[0].total_deuda === null ? null : Number(result.rows[0].total_deuda) };
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

