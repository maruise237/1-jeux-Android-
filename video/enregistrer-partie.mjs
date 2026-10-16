// Films a real game, frame by frame, played by the level bot (tools/_bot.mjs).
// The page clock is driven by hand (fake requestAnimationFrame) so every frame is exact,
// whatever the speed of the machine. Math.random is seeded: same seed, same game.
//
// Usage: CHROMIUM_PATH=... node video/enregistrer-partie.mjs <outDir> --level 12 [--hero kenji]
//          [--secs 12] [--fps 30] [--seed 1] [--skip 0] [--variant n] [--menu heroes] [--naif]
// --naif: instead of the bot, the hero runs straight at the nearest guard (a real careless player, for fail shots).
// Writes <outDir>/f00000.jpg… (1080x1920), <outDir>/clip.json (n, fps…) and <outDir>/evenements.json:
//   [{ t, type: 'tap'|'kill'|'spotted'|'hurt'|'win'|'lost', x, y }]  (x, y in output pixels)
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installBot } from '../tools/_bot.mjs';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(base, 'www');
const out = path.resolve(process.argv[2] || 'partie');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LEVEL = +arg('level', 12), HERO = arg('hero', 'kenji'), SECS = +arg('secs', 12), FPS = +arg('fps', 30);
const SEED = +arg('seed', 1), SKIP = +arg('skip', 0), VARIANT = arg('variant', null), MENU = arg('menu', null);
const NAIF = process.argv.includes('--naif');
const SCALE = 3; // 360x640 CSS px -> 1080x1920
const BOT_EVERY = Math.max(1, Math.round(FPS / 10)); // the bot thinks every 0.1 s of game time, whatever the fps
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(root, u === '/' ? 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: SCALE, hasTouch: true, isMobile: true });
p.on('pageerror', e => console.log('page error', e.message));
await p.addInitScript(seed => {
  let a = seed >>> 0; // mulberry32
  Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let now = 0, queue = [];
  performance.now = () => now;
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.__step = dt => { now += dt * 1000; const q = queue; queue = []; for (const cb of q) cb(now); };
}, SEED);
await p.goto(`http://localhost:${server.address().port}/index.html`);
await p.waitForTimeout(400);
await p.evaluate(([lv, hero, v]) => {
  const s = window.__shadowStrike.save;
  s.level = lv; s.gems = 2450;
  if (!s.owned.includes(hero)) s.owned.push(hero);
  s.selected = hero;
  if (v !== null) window.__variantOverride = +v;
}, [LEVEL, HERO, VARIANT]);
await p.evaluate(() => document.getElementById('btn-heroes-close')?.click());
await p.evaluate(() => window.__step(1 / 30));
await p.waitForTimeout(250);
await p.evaluate(installBot);
if (NAIF) await p.evaluate(() => {
  window.__botStep = () => {
    const S = window.__shadowStrike, P = S.player;
    if (P.chase && P.chase.alive) return;
    const g = S.guards.filter(g => g.alive).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
    if (g) { P.chase = g; P.repath = 0; }
  };
});

// --skip always runs at 30 fps, so a slow-motion take (--fps 90) replays the same game up to the cut
const pump = async (secs, bot) => {
  for (let i = 0; i < Math.round(secs * 30); i++) await p.evaluate(([dt, bot, i]) => {
    if (bot && i % 3 === 0 && window.__shadowStrike.state === 'playing') window.__botStep();
    window.__step(dt);
  }, [1 / 30, bot, i]);
};

const events = [];
if (MENU) { await p.click('#btn-' + MENU); await p.waitForTimeout(400); }
else {
  await p.click('#btn-play');
  await p.addStyleTag({ content: '#tip{display:none!important}' });
  if (SKIP) await pump(SKIP, true);
}
for (let f = 0; f < Math.round(SECS * FPS); f++) {
  const ev = await p.evaluate(([dt, f, scale, bot, every]) => {
    const S = window.__shadowStrike, P = S.player, evs = [];
    if (!S.player) { window.__step(dt); return evs; }
    const at = o => { const c = S.toScreen(o.x, o.y); return { x: Math.round(c.x * scale), y: Math.round(c.y * scale) }; };
    const before = { alive: S.guards.filter(g => g.alive), chase: P.chase, hp: P.hp, alert: S.guards.filter(g => g.alive && g.state === 'alert').length, state: S.state };
    if (bot && f % every === 0 && S.state === 'playing') window.__botStep();
    if (P.chase && P.chase !== before.chase) evs.push({ type: 'tap', ...at(P.chase) });
    window.__step(dt);
    for (const g of before.alive) if (!g.alive) evs.push({ type: 'kill', ...at(g) });
    const alert = S.guards.filter(g => g.alive && g.state === 'alert').length;
    if (alert > before.alert) evs.push({ type: 'spotted', ...at(P) });
    if (P.hp < before.hp) evs.push({ type: 'hurt', ...at(P) });
    if (S.state !== before.state && (S.state === 'won' || S.state === 'lost')) evs.push({ type: S.state, ...at(P) });
    evs.push({ type: 'hero', ...at(P) });
    return evs;
  }, [1 / FPS, f, SCALE, !MENU, BOT_EVERY]);
  for (const e of ev) if (e.type !== 'hero' || f % BOT_EVERY === 0) events.push({ t: +(f / FPS).toFixed(3), ...e });
  await p.screenshot({ path: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
}
fs.writeFileSync(path.join(out, 'evenements.json'), JSON.stringify(events));
fs.writeFileSync(path.join(out, 'clip.json'), JSON.stringify({ n: Math.round(SECS * FPS), fps: FPS, level: LEVEL, hero: HERO, seed: SEED, skip: SKIP }));
await browser.close(); server.close();
console.log(`${Math.round(SECS * FPS)} images ->`, out, '|', events.filter(e => e.type !== 'hero').map(e => `${e.t}s ${e.type}`).join(', '));
