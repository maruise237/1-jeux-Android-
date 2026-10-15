import { db } from '../lib/db.js';
import { cors, send, readJson, fail } from '../lib/http.js';

const TYPES = new Set(['session', 'level_start', 'level_end', 'purchase', 'promo_view', 'promo_click']);
const MAX = 50, MONTH = 30 * 864e5;

// Public: the game posts batches of anonymous events (queued while offline).
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'POST uniquement' });
  try {
    const body = await readJson(req);
    const device = typeof body.device === 'string' ? body.device.slice(0, 64) : '';
    if (device.length < 8 || !/^[\w-]+$/.test(device)) return send(res, 400, { error: 'device invalide' });
    const version = typeof body.version === 'string' ? body.version.slice(0, 20) : null;
    const list = Array.isArray(body.events) ? body.events.slice(0, MAX) : [];
    const now = Date.now(), rows = [];
    for (const e of list) {
      if (!e || !TYPES.has(e.type)) continue;
      // offline events keep their real date, within reason
      const t = Number(e.t);
      const at = Number.isFinite(t) && t > now - MONTH && t < now + 5 * 60e3 ? t : now;
      const level = Number.isInteger(e.level) && e.level >= 0 && e.level <= 100000 ? e.level : null;
      let data = e.data && typeof e.data === 'object' && !Array.isArray(e.data) ? e.data : {};
      if (JSON.stringify(data).length > 1500) data = {};
      rows.push([new Date(at).toISOString(), device, e.type, level, JSON.stringify(data), version]);
    }
    if (!rows.length) return send(res, 200, { saved: 0 });
    const params = [], values = rows.map((r, i) => {
      params.push(...r);
      const b = i * 6;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}::jsonb, $${b + 6})`;
    });
    await db().query(`insert into events (created_at, device_id, type, level, data, app_version) values ${values.join(',')}`, params);
    send(res, 200, { saved: rows.length });
  } catch (e) { fail(res, e); }
}
