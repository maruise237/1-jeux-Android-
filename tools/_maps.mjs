import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('www'), out = process.argv[2];
const server = http.createServer((req, res) => { const f = path.join(root, req.url.split('?')[0]); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, r));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${server.address().port}/index.html`); await p.waitForTimeout(400);
for (const n of [51, 61, 71, 81, 91, 100, 35, 34]) {
  await p.evaluate(n => { const S = window.__shadowStrike; S.save.level = n; window.__variantOverride = 0; S.startLevel(); S.tick(20); }, n);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/map-${n}.png` });
  // whole map overview: zoom camera out by rendering the prebuilt map canvas
  await p.evaluate(() => { const S = window.__shadowStrike; S.finish && 0; });
}
console.log('errors', errs);
await b.close(); server.close();
