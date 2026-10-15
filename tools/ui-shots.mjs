// Captures every menu/overlay at phone sizes for UI review.
// Usage: CHROMIUM_PATH=... node tools/ui-shots.mjs <outDir> [suffix]
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('www');
const out = process.argv[2] || 'shots';
const suffix = process.argv[3] || '';
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const sizes = [[360, 640], [412, 915]];
for (const [w, h] of sizes) {
  for (const rich of [false, true]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForTimeout(400);
    if (rich) await page.evaluate(() => { const s = window.__shadowStrike.save; s.gems = 5000; s.level = 10; for (const id in s.missions || {}) s.missions[id].done = true; });
    const tag = `${w}x${h}${rich ? '-rich' : ''}${suffix}`;
    const shot = async name => page.screenshot({ path: `${out}/${tag}-${name}.png` });
    await page.evaluate(() => document.getElementById('btn-heroes-close').click());
    await page.waitForTimeout(300); await shot('01-menu');
    await page.click('#btn-heroes'); await page.waitForTimeout(250); await shot('02-heroes');
    await page.click('#btn-heroes-close');
    for (const [btn, n] of [['#btn-upgrade', '03-shop-up'], ['#btn-armory', '04-shop-knife'], ['#btn-outfits', '05-shop-outfit']]) {
      await page.click(btn); await page.waitForTimeout(250); await shot(n);
      await page.click('#btn-shop-close'); await page.waitForTimeout(150);
    }
    await page.click('#btn-play'); await page.waitForTimeout(700); await shot('06-hud');
    await page.click('#btn-pause'); await page.waitForTimeout(200); await shot('07-pause');
    await page.click('#btn-resume');
    if (!rich) {
      await page.evaluate(() => { const S = window.__shadowStrike; S.finish(false); S.tick(200); });
      await page.waitForTimeout(500); await shot('08-lose');
    } else {
      await page.evaluate(() => { const S = window.__shadowStrike; for (const g of S.guards) if (g.alive) S.kill(g); S.tick(240); });
      await page.waitForTimeout(1600); await shot('08-win');
      if (await page.isVisible('#btn-wheel')) {
        await page.click('#btn-wheel'); await page.waitForTimeout(200); await shot('09-wheel');
      }
    }
    if (errors.length) console.log(tag, 'ERRORS', errors);
    await page.close();
  }
}
await browser.close(); server.close();
console.log('done');
