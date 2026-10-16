// Draws the 10 assassins with the game's own character art (KT.art.drawPortrait), one PNG each.
// Usage: CHROMIUM_PATH=... node video/portraits.mjs <outDir> [size=640]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || 'portraits'); const size = +(process.argv[3] || 640);
fs.mkdirSync(out, { recursive: true });
// the hero list lives inside game.js's closure: read it from the source
const src = fs.readFileSync(path.join(base, 'www/js/game.js'), 'utf8');
const heroes = new Function(`return ${src.match(/const HEROES = (\[[\s\S]*?\n  \]);/)[1]}`)();
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage();
await p.setContent('<body></body>');
for (const f of ['art.js', 'characters.js']) await p.addScriptTag({ path: path.join(base, 'www/js', f) });
const pngs = await p.evaluate(([heroes, size]) => heroes.map(h => {
  const c = document.createElement('canvas'); c.width = c.height = size;
  KT.art.drawPortrait(c, { ...h.look, id: 'hero-' + h.id });
  return [h.id, c.toDataURL('image/png')];
}), [heroes, size]);
for (const [id, url] of pngs) fs.writeFileSync(path.join(out, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
await b.close();
console.log(pngs.length, 'portraits ->', out, heroes.map(h => h.name).join(', '));
