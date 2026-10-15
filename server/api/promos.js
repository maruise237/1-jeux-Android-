import { db } from '../lib/db.js';
import { cors, send, fail } from '../lib/http.js';

// Public: live announcements for the game. Cached one minute at Vercel's edge.
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET') return send(res, 405, { error: 'GET uniquement' });
  try {
    const { rows } = await db().query(`
      select id, title, body, cta_label, url, image_url, starts_at, ends_at, min_level, every_hours, priority
      from promos
      where active and (starts_at is null or starts_at <= now() + interval '1 day') and (ends_at is null or ends_at > now())
      order by priority desc, id desc limit 10`);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    send(res, 200, { promos: rows });
  } catch (e) {
    // a missing table before the first admin login is not an error for the game
    if (e.code === '42P01') return send(res, 200, { promos: [] });
    fail(res, e);
  }
}
