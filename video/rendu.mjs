// Renders a video page (render(t) from video/lib/scene.js) to JPEG frames, several pages in parallel.
// Usage: CHROMIUM_PATH=... node video/rendu.mjs <page.html> <outDir> --clips <dir of recorded clips>
//          [--w 1080 --h 1920] [--fps 30] [--workers 4] [--at 0 1.5 3 ...]   (--at: contact sheet only)
// Writes <outDir>/images/f00000.jpg… or, with --at, <outDir>/planche.jpg.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';

const [pagePath, outDir] = process.argv.slice(2).map(p => path.resolve(p));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const W = +arg('w', 1080), H = +arg('h', 1920), FPS = +arg('fps', 30), WORKERS = +arg('workers', 4);
const clipsDir = path.resolve(arg('clips', '.'));
const ai = process.argv.indexOf('--at');
const AT = ai > 0 ? process.argv.slice(ai + 1).map(Number) : null;

// clip index: frame count, fps and events of every recorded clip (clip.json + evenements.json)
const CLIPS = {};
for (const d of fs.readdirSync(clipsDir)) {
  const info = path.join(clipsDir, d, 'clip.json');
  if (!fs.existsSync(info)) continue;
  CLIPS[d] = { ...JSON.parse(fs.readFileSync(info, 'utf8')), ev: JSON.parse(fs.readFileSync(path.join(clipsDir, d, 'evenements.json'), 'utf8')) };
}

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
async function openPage() {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('page error', e.message));
  await p.addInitScript(([c, root]) => { window.CLIPS = c; window.CLIPS_ROOT = root; }, [CLIPS, 'file://' + clipsDir]);
  await p.goto(`file://${pagePath}?w=${W}&h=${H}`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => window.PRET === true);
  return p;
}
const first = await openPage();
const DUREE = await first.evaluate(() => window.DUREE);
fs.writeFileSync(path.join(outDir, 'sons.json'), JSON.stringify({ duree: DUREE, sons: await first.evaluate(() => window.SONS || []) }, null, 1));

if (AT) {
  const dir = path.join(outDir, 'planche'); fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const [i, t] of AT.entries()) {
    await first.evaluate(t => window.render(t), t);
    const f = path.join(dir, `p${String(i).padStart(2, '0')}.jpg`);
    await first.screenshot({ path: f, type: 'jpeg', quality: 88 }); files.push(f);
  }
  const cols = W > H ? 4 : 6, tw = W > H ? 480 : 270, th = Math.round(tw * H / W);
  const args = files.flatMap(f => ['-i', f]);
  const fc = files.map((_, i) => `[${i}:v]scale=${tw}:${th},drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${AT[i]}s':x=6:y=6:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const lay = files.map((_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, '-filter_complex', `${fc};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${lay}:fill=black`, '-frames:v', '1', path.join(outDir, 'planche.jpg')]);
  console.log(path.join(outDir, 'planche.jpg'));
} else {
  const imgDir = path.join(outDir, 'images');
  fs.rmSync(imgDir, { recursive: true, force: true }); fs.mkdirSync(imgDir, { recursive: true });
  const n = Math.round(DUREE * FPS);
  const pages = [first, ...await Promise.all(Array.from({ length: WORKERS - 1 }, openPage))];
  let next = 0, done = 0;
  await Promise.all(pages.map(async p => {
    while (next < n) {
      const f = next++;
      await p.evaluate(t => window.render(t), f / FPS);
      await p.screenshot({ path: path.join(imgDir, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
      if (++done % 150 === 0) process.stdout.write(done + ' ');
    }
  }));
  console.log(`\n${n} images (${DUREE} s) ->`, imgDir);
}
await browser.close();
