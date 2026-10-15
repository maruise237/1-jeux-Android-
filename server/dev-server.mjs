// Local stand-in for Vercel: static files + /api/* handlers. `node dev-server.mjs`
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p.startsWith('/api/')) {
    const file = path.join(root, p + '.js');
    if (!file.startsWith(path.join(root, 'api')) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('{}'); }
    const mod = await import(pathToFileURL(file).href);
    return mod.default(req, res);
  }
  let f = path.join(root, p === '/' ? 'index.html' : p);
  if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('http://localhost:' + port));
