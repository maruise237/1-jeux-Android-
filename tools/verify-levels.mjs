// Level verifier for Shadow Strike.
// Plays every level with an automated bot using the weakest hero and keeps, for each level,
// the first layout variant the bot manages to win. Writes www/js/levels.js.
//
// Usage: npm run verify-levels [-- --from 1 --to 60]
// Needs Chromium: set CHROMIUM_PATH, or install one with `npx playwright install chromium`.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const FROM = arg('from', 1), TO = arg('to', 60), VARIANTS = arg('variants', 25), TRIES = arg('tries', 6);
const outFile = path.join(root, 'js', 'levels.js');

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(`http://localhost:${port}/index.html`);

// keep already verified results when only re-checking part of the range
let verified = [];
try { verified = JSON.parse(fs.readFileSync(outFile, 'utf8').match(/\[(.*)\]/s)[0]); } catch { /* first run */ }

await page.evaluate(() => {
  const s = window.__shadowStrike;
  const W = 11; const H = () => s.level.H;
  function botStep() {
    const P = s.player, G = s.guards.filter(g => g.alive);
    if (!G.length) return;
    const seen = pt => G.some(g => g.frozen <= 0 && s.canSee(g, pt));
    const near = pt => G.some(g => g.frozen <= 0 && Math.hypot(g.x - pt.x, g.y - pt.y) < 1.2 && Math.abs(s.angleDiff(g.angle, Math.atan2(pt.y - g.y, pt.x - g.x))) < 1.2);
    const onLaser = pt => s.lasers.some(l => {
      const ph = (s.time + l.phase) % l.period;
      const hot = ph < l.on + 0.25 || ph > l.period - 0.7;
      const hit = l.h ? Math.abs(pt.y - l.c) < 0.45 && pt.x > l.a - 0.2 && pt.x < l.b + 0.2 : Math.abs(pt.x - l.c) < 0.45 && pt.y > l.a - 0.2 && pt.y < l.b + 0.2;
      return hot && hit;
    });
    const nearBomb = pt => (s.bombs || []).some(b => b.state !== 'done' && Math.hypot(b.x - pt.x, b.y - pt.y) < (b.state === 'fuse' ? 2.4 : 0.85))
      || s.mines.some(m => m.state !== 'used' && Math.hypot(m.x - pt.x, m.y - pt.y) < (m.state === 'fuse' ? 2.6 : 0.8));
    const unsafe = pt => seen(pt) || near(pt) || onLaser(pt) || nearBomb(pt);
    const pathUnsafe = (path, look = 1.4) => {
      let prev = { x: P.x, y: P.y }, acc = 0;
      for (const q of path) {
        const d = Math.hypot(q.x - prev.x, q.y - prev.y), n = Math.max(1, Math.ceil(d / 0.25));
        for (let i = 1; i <= n; i++) {
          const pt = { x: prev.x + (q.x - prev.x) * i / n, y: prev.y + (q.y - prev.y) * i / n };
          acc += d / n; if (acc > look) return false;
          if (unsafe(pt)) return true;
        }
        prev = q;
      }
      return false;
    };
    // pick the best victim: frozen, or back turned, closest first
    let best = null, bs = 1e9;
    for (const g of G) {
      const back = Math.abs(s.angleDiff(g.angle, Math.atan2(P.y - g.y, P.x - g.x))) > 1.7;
      const sc = Math.hypot(g.x - P.x, g.y - P.y) + Math.random() * window.__noise + (g.frozen > 0 ? -5 : 0) + (back ? 0 : 4) + (g.shield && g.frozen <= 0 ? 3 : 0);
      if (sc < bs) { bs = sc; best = g; }
    }
    const attackPath = s.findPath(P, Math.floor(best.x), Math.floor(best.y));
    const back = Math.abs(s.angleDiff(best.angle, Math.atan2(P.y - best.y, P.x - best.x))) > 1.3;
    const okShield = !best.shield || best.frozen > 0 || back;
    if (attackPath && okShield && !pathUnsafe(attackPath, Math.hypot(best.x - P.x, best.y - P.y) < 1.6 ? 0.5 : 1.4)) {
      P.chase = best; P.repath = 0; return;
    }
    // otherwise hide: safe cell close to the target
    const here = { x: P.x, y: P.y };
    let spot = null, ss = 1e9;
    for (let y = 1; y < H() - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (s.isWallTile(x, y)) continue;
      const c = { x: x + 0.5, y: y + 0.5 };
      const dp = Math.hypot(c.x - P.x, c.y - P.y); if (dp > 6) continue;
      if (unsafe(c)) continue;
      const exposure = G.reduce((a, g) => a + (Math.hypot(g.x - c.x, g.y - c.y) < g.range + 0.5 ? 1 : 0), 0);
      const sc = dp * 0.6 + Math.hypot(c.x - best.x, c.y - best.y) * 0.5 + exposure * 1.2 + Math.random() * window.__noise;
      if (sc < ss) { ss = sc; spot = { x, y, c }; }
    }
    P.chase = null;
    if (!unsafe(here) && (!spot || Math.hypot(spot.c.x - P.x, spot.c.y - P.y) < 0.6)) { P.path = null; return; }
    if (spot) { const path = s.findPath(P, spot.x, spot.y); if (path && path.length) { P.path = path; P.pi = 0; window.__goal = { ...spot, t: 0 }; } }
  }

  window.__playLevel = (lv, variant, tries) => {
    window.__variantOverride = variant;
    for (let k = 1; k <= tries; k++) {
      s.save.level = lv; s.save.selected = 'kenji'; s.save.xp = {}; s.startLevel(); window.__goal = null;
      window.__noise = k === 1 ? 0 : 1.5;
      const delay = k === 1 ? 0 : Math.random() * 4;
      let t = 0;
      while (s.state === 'playing' && t < 240) { if (t >= delay) botStep(); s.tick(6); t += 0.1; }
      s.tick(200);
      if (s.save.level === lv + 1) { window.__variantOverride = undefined; return { won: true, tries: k, hp: Math.round(s.player.hp) }; }
    }
    window.__variantOverride = undefined;
    return { won: false };
  };
});

let failures = 0;
for (let lv = FROM; lv <= TO; lv++) {
  let found = -1, info = null;
  for (let v = 0; v < VARIANTS && found < 0; v++) {
    const r = await page.evaluate(([lv, v, t]) => window.__playLevel(lv, v, t), [lv, v, TRIES]);
    if (r.won) { found = v; info = r; }
  }
  if (found < 0) { failures++; console.log(`niveau ${lv}: AUCUNE variante gagnée par le robot`); verified[lv - 1] = 0; }
  else { console.log(`niveau ${lv}: variante ${found} gagnée (essai ${info.tries}, ${info.hp} PV restants)`); verified[lv - 1] = found; }
  fs.writeFileSync(outFile, `'use strict';\n// Generated by tools/verify-levels.mjs: layout variant per level, each beaten by the bot with the weakest hero.\nwindow.KT = window.KT || {};\nKT.verifiedVariants = ${JSON.stringify(verified)};\n`);
}
await browser.close();
server.close();
console.log(failures ? `${failures} niveau(x) non vérifié(s)` : `Tous les niveaux ${FROM}-${TO} sont gagnables.`);
process.exit(failures ? 1 : 0);
