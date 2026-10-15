import { requireAdmin } from '../../lib/auth.js';
import { db, ensureSchema } from '../../lib/db.js';
import { send, readJson, query, fail } from '../../lib/http.js';

const bad = msg => Object.assign(new Error(msg), { status: 400 });
const https = (v, name, optional) => {
  if (optional && (v == null || v === '')) return null;
  if (typeof v !== 'string' || !/^https:\/\/\S+$/i.test(v) || v.length > 500) throw bad(`${name} : un lien https:// est obligatoire`);
  return v;
};
const text = (v, name, max, min = 0) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min || s.length > max) throw bad(`${name} : ${min ? `entre ${min} et ` : 'au plus '}${max} caractères`);
  return s;
};
const date = (v, name) => {
  if (v == null || v === '') return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) throw bad(`${name} : date invalide`);
  return new Date(t).toISOString();
};
const int = (v, name, lo, hi, d) => {
  if (v == null || v === '') return d;
  const n = Number(v);
  if (!Number.isInteger(n) || n < lo || n > hi) throw bad(`${name} : nombre entre ${lo} et ${hi}`);
  return n;
};
function clean(b) {
  const p = {
    active: !!b.active,
    title: text(b.title, 'Titre', 60, 1),
    body: text(b.body, 'Texte', 240),
    cta_label: text(b.cta_label || 'En savoir plus', 'Bouton', 24, 1),
    url: https(b.url, 'Lien'),
    image_url: https(b.image_url, 'Image', true),
    starts_at: date(b.starts_at, 'Début'),
    ends_at: date(b.ends_at, 'Fin'),
    min_level: int(b.min_level, 'Niveau minimum', 1, 1000, 3),
    every_hours: int(b.every_hours, 'Fréquence', 1, 720, 24),
    priority: int(b.priority, 'Priorité', -100, 100, 0),
  };
  if (p.starts_at && p.ends_at && p.ends_at <= p.starts_at) throw bad('La fin doit être après le début');
  return p;
}
const COLS = ['active', 'title', 'body', 'cta_label', 'url', 'image_url', 'starts_at', 'ends_at', 'min_level', 'every_hours', 'priority'];

export default async function handler(req, res) {
  try {
    requireAdmin(req);
    await ensureSchema();
    const id = parseInt(query(req).id, 10);
    if (req.method === 'GET') {
      const { rows } = await db().query(`
        select p.*, coalesce(v.views, 0)::int as views, coalesce(v.clicks, 0)::int as clicks
        from promos p left join (
          select (data->>'promo')::bigint as pid,
            count(*) filter (where type = 'promo_view') as views, count(*) filter (where type = 'promo_click') as clicks
          from events where type in ('promo_view', 'promo_click') group by 1
        ) v on v.pid = p.id
        order by p.active desc, p.priority desc, p.id desc`);
      return send(res, 200, { promos: rows });
    }
    if (req.method === 'POST') {
      const p = clean(await readJson(req));
      const { rows } = await db().query(
        `insert into promos (${COLS.join(',')}) values (${COLS.map((_, i) => '$' + (i + 1)).join(',')}) returning *`, COLS.map(c => p[c]));
      return send(res, 201, { promo: rows[0] });
    }
    if (!Number.isInteger(id)) throw bad('id manquant');
    if (req.method === 'PUT') {
      const p = clean(await readJson(req));
      const { rows } = await db().query(
        `update promos set ${COLS.map((c, i) => `${c} = $${i + 1}`).join(', ')} where id = $${COLS.length + 1} returning *`, [...COLS.map(c => p[c]), id]);
      if (!rows.length) return send(res, 404, { error: 'Annonce introuvable' });
      return send(res, 200, { promo: rows[0] });
    }
    if (req.method === 'PATCH') { // quick on/off switch
      const b = await readJson(req, 1024);
      const { rows } = await db().query('update promos set active = $1 where id = $2 returning *', [!!b.active, id]);
      if (!rows.length) return send(res, 404, { error: 'Annonce introuvable' });
      return send(res, 200, { promo: rows[0] });
    }
    if (req.method === 'DELETE') {
      await db().query('delete from promos where id = $1', [id]);
      return send(res, 200, { ok: true });
    }
    send(res, 405, { error: 'Méthode non prise en charge' });
  } catch (e) { fail(res, e); }
}
