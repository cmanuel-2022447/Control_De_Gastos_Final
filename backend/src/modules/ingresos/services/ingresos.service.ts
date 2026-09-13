import { pool } from '../../../config/db';
import { parseMoney } from '../../../util/money';

export interface IngresoDbRow {
  id: number;
  fecha: string;
  descripcion: string;
  lugar: string;
  monto: string;
  moneda: 'GTQ' | 'USD';
  moneda_destino: 'GTQ' | 'USD';
  original: string;
  conversion: string;
}

export const getAllIngresos = async (usuarioId: number): Promise<IngresoDbRow[]> => {
  const result = await pool.query(
    `SELECT id, fecha, descripcion, lugar, monto::text, moneda, moneda_destino, original, conversion
    FROM public.ingresos
    WHERE usuario_id = $1
    ORDER BY fecha ASC, id ASC`,
      [usuarioId]
  );

  return result.rows.map((row) => ({
    ...row,
    monto: String(row.monto),
    original: String(row.original),
    conversion: String(row.conversion)
  }));
};

export const saveIngreso = async (usuarioId: number, data: any): Promise<IngresoDbRow> => {
  const fecha = String(data?.fecha || '').trim();
  const descripcion = String(data?.descripcion || '').trim();
  const lugar = String(data?.lugar || '').trim();
  const moneda = String(data?.moneda || 'GTQ').trim().toUpperCase();
  const monedaDestino = String(data?.monedaDestino || (moneda === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
  const monto = parseMoney(data?.monto);

  if (!fecha || !descripcion || !lugar || !monto) throw new Error('INVALID_INCOME_DATA');

  if (!['GTQ', 'USD'].includes(moneda) || !['GTQ', 'USD'].includes(monedaDestino)) {
    throw new Error('INVALID_CURRENCY');
  }

  const fechaResult = await pool.query('SELECT $1::date = CURRENT_DATE AS es_hoy', [fecha]);
  if (!fechaResult.rows[0].es_hoy) throw new Error('INCOME_DATE_NOT_TODAY');
  const conversionResult = await pool.query(
    `SELECT CASE WHEN $1::text = $2::text THEN $3::numeric
                 WHEN $1::text = 'USD' THEN $3::numeric * 7.68::numeric
                 ELSE $3::numeric / 7.68::numeric END AS monto_convertido`,
    [moneda, monedaDestino, monto]
  );
  const original = `${moneda} ${monto}`;
  const conversion = `${monedaDestino} ${String(conversionResult.rows[0].monto_convertido)}`;

  const result = await pool.query(
    `INSERT INTO public.ingresos (usuario_id, fecha, descripcion, lugar, monto, moneda, moneda_destino, original, conversion)
     VALUES ($1, $2, $3, $4, $5::numeric, $6, $7, $8, $9)
     RETURNING id, fecha, descripcion, lugar, monto::text, moneda, moneda_destino, original, conversion`,
    [usuarioId, fecha, descripcion, lugar, monto, moneda, monedaDestino, original, conversion]
  );

  const row = result.rows[0];
  return {
    ...row,
    monto: String(row.monto),
    original: String(row.original),
    conversion: String(row.conversion)
  };
};

export const updateIngreso = async (usuarioId: number, id: number, data: any): Promise<IngresoDbRow> => {
  const fecha = String(data?.fecha || '').trim();
  const descripcion = String(data?.descripcion || '').trim();
  const lugar = String(data?.lugar || '').trim();
  const moneda = String(data?.moneda || 'GTQ').trim().toUpperCase();
  const monedaDestino = String(data?.monedaDestino || (moneda === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
  const monto = parseMoney(data?.monto);

  if (!fecha || !descripcion || !lugar || !monto) throw new Error('INVALID_INCOME_DATA');

  if (!['GTQ', 'USD'].includes(moneda) || !['GTQ', 'USD'].includes(monedaDestino)) {
    throw new Error('INVALID_CURRENCY');
  }

  const fechaResult = await pool.query('SELECT $1::date = CURRENT_DATE AS es_hoy', [fecha]);
  if (!fechaResult.rows[0].es_hoy) throw new Error('INCOME_DATE_NOT_TODAY');
  const conversionResult = await pool.query(
    `SELECT CASE WHEN $1::text = $2::text THEN $3::numeric
                 WHEN $1::text = 'USD' THEN $3::numeric * 7.68::numeric
                 ELSE $3::numeric / 7.68::numeric END AS monto_convertido`,
    [moneda, monedaDestino, monto]
  );
  const original = `${moneda} ${monto}`;
  const conversion = `${monedaDestino} ${String(conversionResult.rows[0].monto_convertido)}`;

  const result = await pool.query(
    `UPDATE public.ingresos
    SET fecha = $1,
         descripcion = $2,
         lugar = $3,
        monto = $4::numeric,
        moneda = $5,
        moneda_destino = $6,
        original = $7,
        conversion = $8
      WHERE id = $9 AND usuario_id = $10
    RETURNING id, fecha, descripcion, lugar, monto::text, moneda, moneda_destino, original, conversion`,
     [fecha, descripcion, lugar, monto, moneda, monedaDestino, original, conversion, id, usuarioId]
  );

  if (result.rowCount === 0) {
    throw new Error('INCOME_NOT_FOUND');
  }

  const row = result.rows[0];
  return {
    ...row,
    monto: String(row.monto),
    original: String(row.original),
    conversion: String(row.conversion)
  };
};

export const deleteIngreso = async (usuarioId: number, id: number): Promise<{ id: number }> => {
  const result = await pool.query('DELETE FROM public.ingresos WHERE id = $1 AND usuario_id = $2 RETURNING id', [id, usuarioId]);

  if (result.rowCount === 0) {
    throw new Error('INCOME_NOT_FOUND');
  }

  return { id: Number(result.rows[0].id) };
};

export const clearIngresos = async (usuarioId: number): Promise<{ deleted: number }> => {
  const result = await pool.query('DELETE FROM public.ingresos WHERE usuario_id = $1', [usuarioId]);
  return { deleted: result.rowCount ?? 0 };
};
