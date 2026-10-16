// Installs a 1024x1024 icon as the app icon: assets/ sources + every Android mipmap.
// Usage: CHROMIUM_PATH=... node tools/apply-icon.mjs <icon-1024.png> [backgroundColor=#b3122a]
// The adaptive icon layers are drawn with a 16.7 % inset (mipmap-anydpi-v26), so the foreground
// is the full opaque icon and the background a flat colour behind it.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(process.argv[2] || '');
const bgColor = process.argv[3] || '#b3122a';
if (!fs.existsSync(src)) { console.error('icon not found:', src); process.exit(1); }
const res = path.join(base, 'android/app/src/main/res');
const DENS = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage();
const data = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const out = await p.evaluate(async ({ data, DENS, bgColor }) => {
  const img = new Image(); img.src = data; await img.decode();
  const draw = (size, shape) => {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    if (shape === 'round') { g.beginPath(); g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); g.clip(); }
    if (shape === 'square') { g.beginPath(); g.roundRect(0, 0, size, size, size * 0.18); g.clip(); }
    if (shape === 'bg') { g.fillStyle = bgColor; g.fillRect(0, 0, size, size); }
    else g.drawImage(img, 0, 0, size, size);
    return c.toDataURL('image/png');
  };
  const files = {
    'assets/icon-only.png': draw(1024, 'full'),
    'assets/icon-foreground.png': draw(1024, 'full'),
    'assets/icon-background.png': draw(1024, 'bg'),
  };
  for (const [d, px] of Object.entries(DENS)) {
    const layer = Math.round(px * 2.25);
    files[`mipmap-${d}/ic_launcher.png`] = draw(px, 'square');
    files[`mipmap-${d}/ic_launcher_round.png`] = draw(px, 'round');
    files[`mipmap-${d}/ic_launcher_foreground.png`] = draw(layer, 'full');
    files[`mipmap-${d}/ic_launcher_background.png`] = draw(layer, 'bg');
  }
  return files;
}, { data, DENS, bgColor });
for (const [rel, url] of Object.entries(out)) {
  const f = rel.startsWith('assets/') ? path.join(base, rel) : path.join(res, rel);
  fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
}
await b.close();
console.log('icon applied:', Object.keys(out).length, 'files');
