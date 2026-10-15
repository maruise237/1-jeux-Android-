import { login } from '../../lib/auth.js';
import { ensureSchema } from '../../lib/db.js';
import { send, readJson, fail } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST uniquement' });
  try {
    const { password } = await readJson(req, 4096);
    const token = await login(password);
    await ensureSchema(); // first login creates the tables
    send(res, 200, { token });
  } catch (e) { fail(res, e); }
}
