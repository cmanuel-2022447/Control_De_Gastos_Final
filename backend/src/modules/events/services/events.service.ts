import { pool } from '../../../config/db';

export const getEvents = async (usuarioId: number) => {
  const result = await pool.query(
        `SELECT e.id, e.nombre, e.tipo, e.invitados, e.lugar, e.fecha, e.presupuesto, e.estado,
          0 AS gastado
         FROM eventos e
     WHERE e.usuario_id = $1
     ORDER BY e.fecha ASC, e.id ASC`,
    [usuarioId]
  );
  return result.rows.map((row) => ({ ...row, presupuesto: Number(row.presupuesto), gastado: Number(row.gastado) }));
};

export const createEvent = async (usuarioId: number, data: any) => {
  const nombre = String(data?.nombre || '').trim();
  const tipo = String(data?.tipo || '').trim();
  const lugar = String(data?.lugar || '').trim() || null;
  const invitados = data?.invitados === '' || data?.invitados === undefined || data?.invitados === null ? null : Number(data.invitados);
  const fecha = String(data?.fecha || '').trim();
  const presupuesto = Number(data?.presupuesto);
  if (!nombre || !tipo || !fecha || !Number.isFinite(presupuesto) || presupuesto < 0 || (invitados !== null && (!Number.isInteger(invitados) || invitados < 0))) throw new Error('INVALID_EVENT_DATA');
  const result = await pool.query(
    `INSERT INTO eventos (usuario_id, nombre, tipo, invitados, lugar, fecha, presupuesto)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombre, tipo, invitados, lugar, fecha, presupuesto, estado`,
    [usuarioId, nombre, tipo, invitados, lugar, fecha, presupuesto]
  );
  return { ...result.rows[0], presupuesto: Number(result.rows[0].presupuesto), gastado: 0 };
};

export const updateEvent = async (usuarioId: number, eventId: number, data: any) => {
  const nombre = String(data?.nombre || '').trim();
  const tipo = String(data?.tipo || '').trim();
  const lugar = String(data?.lugar || '').trim() || null;
  const invitados = data?.invitados === '' || data?.invitados === undefined || data?.invitados === null ? null : Number(data.invitados);
  const fecha = String(data?.fecha || '').trim();
  const presupuesto = Number(data?.presupuesto);
  const estado = String(data?.estado || 'PLANIFICADO').trim().toUpperCase();
  if (!nombre || !tipo || !fecha || !Number.isFinite(presupuesto) || presupuesto < 0 || (invitados !== null && (!Number.isInteger(invitados) || invitados < 0))) throw new Error('INVALID_EVENT_DATA');
  const result = await pool.query(
    `UPDATE eventos SET nombre = $1, tipo = $2, invitados = $3, lugar = $4, fecha = $5, presupuesto = $6, estado = $7
     WHERE id = $8 AND usuario_id = $9
     RETURNING id, nombre, tipo, invitados, lugar, fecha, presupuesto, estado`,
    [nombre, tipo, invitados, lugar, fecha, presupuesto, estado, eventId, usuarioId]
  );
  if (!result.rowCount) throw new Error('EVENT_NOT_FOUND');
  return { ...result.rows[0], presupuesto: Number(result.rows[0].presupuesto) };
};

export const deleteEvent = async (usuarioId: number, eventId: number) => {
  const result = await pool.query('DELETE FROM eventos WHERE id = $1 AND usuario_id = $2', [eventId, usuarioId]);
  if (!result.rowCount) throw new Error('EVENT_NOT_FOUND');
};
