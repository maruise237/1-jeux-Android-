import { requireAdmin } from '../../lib/auth.js';
import { db, ensureSchema } from '../../lib/db.js';
import { send, query, fail } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET uniquement' });
  try {
    requireAdmin(req);
    await ensureSchema();
    const days = Math.max(1, Math.min(365, parseInt(query(req).days, 10) || 30));
    const { rows } = await db().query('select kam_stats($1) as s', [days]);
    send(res, 200, rows[0].s);
  } catch (e) { fail(res, e); }
}
