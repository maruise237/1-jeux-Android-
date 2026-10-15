export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// Vercel pre-parses req.body; a plain Node server leaves the stream unread.
export async function readJson(req, limit = 64 * 1024) {
  let raw = req.body;
  if (raw === undefined) {
    raw = '';
    for await (const chunk of req) { raw += chunk; if (raw.length > limit) throw Object.assign(new Error('trop gros'), { status: 413 }); }
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw === 'string') {
    if (raw.length > limit) throw Object.assign(new Error('trop gros'), { status: 413 });
    try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('JSON invalide'), { status: 400 }); }
  }
  return raw || {};
}

export function query(req) {
  if (req.query) return req.query;
  return Object.fromEntries(new URL(req.url, 'http://x').searchParams);
}

export function fail(res, e) {
  const status = e.status || 500;
  if (status >= 500) console.error(e);
  send(res, status, { error: status >= 500 && !e.status ? 'Erreur serveur' : e.message });
}
