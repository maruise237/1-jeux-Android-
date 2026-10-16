// Level verifier for Shadow Strike.
// Plays every level with an automated bot using the weakest hero and keeps, for each level,
// the first layout variant the bot manages to win. Writes www/js/levels.js.
//
// Usage: npm run verify-levels [-- --from 1 --to 120]
//        npm run verify-levels -- --from 31 --to 120 --max   (re-plays the verified layouts with a maxed-out hero)
// Needs Chromium: set CHROMIUM_PATH, or install one with `npx playwright install chromium`.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installBot } from './_bot.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const MAX = process.argv.includes('--max');
const FROM = arg('from', 1), TO = arg('to', 120), VARIANTS = arg('variants', 25), TRIES = arg('tries', 6);
const outFile = path.join(root, 'js', 'levels.js');
// --out <file>: write results elsewhere (to run two ranges in parallel and merge afterwards)
const outArg = process.argv.indexOf('--out');
const writeFile = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : outFile;

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

await page.evaluate(installBot);
await page.evaluate(() => {
  const s = window.__shadowStrike;
  const botStep = window.__botStep;
  window.__playLevel = (lv, variant, tries, max) => {
    window.__variantOverride = variant;
    for (let k = 1; k <= tries; k++) {
      // weakest hero by default; --max: best hero, level 20, every upgrade, best knife (guards adapt to it)
      s.save.level = lv; s.save.fails = null;
      if (max) { s.save.owned = ['kenji', 'kami']; s.save.selected = 'kami'; s.save.xp = { kami: 1e9 }; for (const u in s.save.upg) s.save.upg[u] = 5; s.save.knives = ['hero', 'plasma']; s.save.knife = 'plasma'; }
      else { s.save.selected = 'kenji'; s.save.xp = {}; for (const u in s.save.upg) s.save.upg[u] = 0; s.save.knife = 'hero'; }
      s.startLevel(); window.__goal = null;
      window.__noise = k === 1 ? 0 : 1.5;
      const delay = k === 1 ? 0 : Math.random() * 4;
      let t = 0;
      while (s.state === 'playing' && t < 240) { if (t >= delay) botStep(); s.tick(6); t += 0.1; }
      window.__winT = s.time;
      s.tick(200);
      if (s.save.level === lv + 1) { window.__variantOverride = undefined; return { won: true, tries: k, hp: Math.round(s.player.hp), secs: Math.round(window.__winT || 0), guards: s.guards.length, kind: s.level.kind, rank: s.level.rank }; }
    }
    window.__variantOverride = undefined;
    return { won: false };
  };
});

let failures = 0;
if (MAX) {
  // keep the layouts found for the weakest hero; only check that a maxed hero (with adapted guards) wins them too
  for (let lv = FROM; lv <= TO; lv++) {
    const r = await page.evaluate(([lv, v, t]) => window.__playLevel(lv, v, t, true), [lv, verified[lv - 1] || 0, TRIES]);
    if (!r.won) failures++;
    console.log(`niveau ${lv} (héros max): ${r.won ? `gagné (essai ${r.tries}, ${r.hp} PV, ${r.secs} s)` : 'PERDU'}`);
  }
  await browser.close(); server.close();
  console.log(failures ? `${failures} niveau(x) perdus avec le héros max` : `Héros max : niveaux ${FROM}-${TO} gagnés.`);
  process.exit(failures ? 1 : 0);
}
// --levels 45,71,88: only these levels
const li = process.argv.indexOf('--levels');
const LIST = li > 0 ? process.argv[li + 1].split(',').map(Number) : Array.from({ length: TO - FROM + 1 }, (_, i) => FROM + i);
for (const lv of LIST) {
  let found = -1, info = null;
  for (let v = 0; v < VARIANTS && found < 0; v++) {
    const r = await page.evaluate(([lv, v, t]) => window.__playLevel(lv, v, t), [lv, v, TRIES]);
    if (r.won) { found = v; info = r; }
  }
  if (found < 0) { failures++; console.log(`niveau ${lv}: AUCUNE variante gagnée par le robot`); verified[lv - 1] = 0; }
  else { console.log(`niveau ${lv}: variante ${found} gagnée (essai ${info.tries}, ${info.hp} PV restants, ${info.secs} s, ${info.guards} gardes, carte ${info.kind}${info.rank ? ', rang ' + info.rank : ''})`); verified[lv - 1] = found; }
  fs.writeFileSync(writeFile, `'use strict';\n// Generated by tools/verify-levels.mjs: layout variant per level, each beaten by the bot with the weakest hero.\nwindow.KT = window.KT || {};\nKT.verifiedVariants = ${JSON.stringify(Array.from(verified, v => v ?? 0))};\n`);
}
await browser.close();
server.close();
console.log(failures ? `${failures} niveau(x) non vérifié(s)` : `Tous les niveaux vérifiés (${LIST.length}) sont gagnables.`);
process.exit(failures ? 1 : 0);
