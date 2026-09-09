import { pool } from '../../../config/db';

export interface IngresoDbRow {
  id: number;
  fecha: string;
  descripcion: string;
  lugar: string;
  original: string;
  conversion: string;
}

export const getAllIngresos = async (usuarioId: number): Promise<IngresoDbRow[]> => {
  const result = await pool.query(
    `SELECT id, fecha, descripcion, lugar, original, conversion
    FROM public.ingresos
    WHERE usuario_id = $1
    ORDER BY fecha ASC, id ASC`,
      [usuarioId]
  );

  return result.rows.map((row) => ({
    ...row,
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
  const monto = Number(data?.monto);
  const tasaCambio = Number(data?.tasa_cambio ?? data?.tasaCambio ?? 7.68);

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

  const result = await pool.query(
    `INSERT INTO public.ingresos (usuario_id, fecha, descripcion, lugar, original, conversion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, fecha, descripcion, lugar, original, conversion`,
    [usuarioId, fecha, descripcion, lugar, original, conversion]
  );

  const row = result.rows[0];
  return {
    ...row,
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
  const monto = Number(data?.monto);
  const tasaCambio = Number(data?.tasa_cambio ?? data?.tasaCambio ?? 7.68);

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

  const result = await pool.query(
    `UPDATE public.ingresos
     SET fecha = $1,
         descripcion = $2,
         lugar = $3,
         original = $4,
         conversion = $5
    WHERE id = $6 AND usuario_id = $7
     RETURNING id, fecha, descripcion, lugar, original, conversion`,
      [fecha, descripcion, lugar, original, conversion, id, usuarioId]
  );

  if (result.rowCount === 0) {
    throw new Error('INCOME_NOT_FOUND');
  }

  const row = result.rows[0];
  return {
    ...row,
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
