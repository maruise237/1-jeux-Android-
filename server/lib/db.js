import pg from 'pg';
import { SCHEMA } from './schema.js';

// Neon (added from the Vercel marketplace) sets DATABASE_URL; POSTGRES_URL is the older name.
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url || '') || /host=\/tmp/.test(url || '');

let pool;
export function db() {
  if (!url) throw Object.assign(new Error('DATABASE_URL manquant : ajoute Neon au projet Vercel.'), { status: 500 });
  if (!pool) pool = new pg.Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 3, idleTimeoutMillis: 10000 });
  return pool;
}

let ready;
export function ensureSchema() {
  if (!ready) ready = db().query(SCHEMA).catch(e => { ready = null; throw e; });
  return ready;
}
