import crypto from 'node:crypto';

// One admin, one password (Vercel env var ADMIN_PASSWORD). Changing it logs every session out.
const DAYS = 30;
const key = () => {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 10) throw Object.assign(new Error('ADMIN_PASSWORD absent ou trop court (10 caractères minimum) dans Vercel.'), { status: 500 });
  return crypto.createHash('sha256').update('kamtech-admin:' + pw).digest();
};
const sign = exp => crypto.createHmac('sha256', key()).update(String(exp)).digest('base64url');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export async function login(password) {
  const ok = typeof password === 'string' && same(crypto.createHash('sha256').update(password).digest('hex'), crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || '').digest('hex'));
  key(); // surfaces a missing password as a clear setup error
  if (!ok) { await new Promise(r => setTimeout(r, 800)); throw Object.assign(new Error('Mot de passe incorrect'), { status: 401 }); }
  const exp = Date.now() + DAYS * 864e5;
  return exp + '.' + sign(exp);
}

export function requireAdmin(req) {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [exp, sig] = tok.split('.');
  if (!exp || !sig || !(Number(exp) > Date.now()) || !same(sig, sign(exp))) throw Object.assign(new Error('Session expirée, reconnecte-toi'), { status: 401 });
}
