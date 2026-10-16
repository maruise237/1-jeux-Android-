// Builds the Google Play listing graphics from real gameplay.
// Usage: CHROMIUM_PATH=... node tools/store-assets.mjs [outDir=store-listing]
//   -> icone-512.png (32-bit PNG), image-presentation-1024x500.png (24-bit PNG),
//      capture-1..6.png (1080x1920, 24-bit PNG, real gameplay + one caption band <= 20 % of the height)
// Follows https://support.google.com/googleplay/android-developer/answer/9866151 :
// no ranking/price/"free" wording, no call to action, focal point centred, vivid (not dark) feature graphic.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(base, 'www');
const out = path.resolve(base, process.argv[2] || 'store-listing');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(root, u === '/' ? 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

// 1. Raw gameplay captures (360x640 @3x = 1080x1920), level banner and tips hidden.
async function capture(level, { screen, prep } = {}) {
  const p = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  p.on('pageerror', e => console.log('page error', e.message));
  await p.goto(url); await p.waitForTimeout(500);
  await p.evaluate(l => { const s = window.__shadowStrike.save; s.level = l; s.gems = 2450; }, level);
  await p.evaluate(() => document.getElementById('btn-heroes-close')?.click()); await p.waitForTimeout(250);
  if (screen) { await p.click(screen); await p.waitForTimeout(400); }
  else {
    await p.click('#btn-play'); await p.waitForTimeout(4500);
    await p.evaluate(() => window.__shadowStrike.tick(120));
    if (prep) await p.evaluate(prep);
    await p.addStyleTag({ content: '#tip{display:none!important}' });
    await p.waitForTimeout(400);
  }
  const png = await p.screenshot({ type: 'png' }); await p.close();
  return 'data:image/png;base64,' + png.toString('base64');
}
// Kill the guard nearest to the hero, so the shot shows the strike and the gem burst.
const strike = () => {
  const S = window.__shadowStrike, pl = S.player;
  const g = S.guards.filter(g => g.alive).sort((a, b) => Math.hypot(a.x - pl.x, a.y - pl.y) - Math.hypot(b.x - pl.x, b.y - pl.y))[0];
  pl.x = g.x - 20; pl.y = g.y; S.kill(g); S.tick(6);
};
const winAll = () => { const S = window.__shadowStrike; for (const g of S.guards) if (g.alive) S.kill(g); S.tick(240); };

// Order follows the "first 3" rule: core action, stealth twist, boss.
const shots = [
  { cap: ['Frappe dans l\'ombre', 'sans un bruit'], img: await capture(12, { prep: strike }), bg: ['#ff3a4c', '#8a0f22'] },
  { cap: ['Reste hors de la lumière', 'des lampes torches'], img: await capture(27), bg: ['#ffb020', '#c24a00'] },
  { cap: ['Un boss à abattre', 'tous les 10 niveaux'], img: await capture(10), bg: ['#9b5cff', '#3d1c8f'] },
  { cap: ['Mines, lasers et herbes', 'pour te cacher'], img: await capture(3), bg: ['#18c2a0', '#06624f'] },
  { cap: ['10 assassins', 'à débloquer'], img: await capture(8, { screen: '#btn-heroes' }), bg: ['#2f8cff', '#123d8f'] },
  { cap: ['Gemmes, étoiles', 'et roue de la chance'], img: await capture(15, { prep: winAll }), bg: ['#ff5fa2', '#8f1650'] },
];

const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'fonts/lilita-one-latin.woff2')).toString('base64');
const css = `@font-face{font-family:L;src:url(${font})}*{margin:0;box-sizing:border-box}body{font-family:L;overflow:hidden}`;

// 2. Captioned screenshots: caption band = 340 px of 1920 (17.7 %), gameplay below it, uncropped width.
for (const [i, s] of shots.entries()) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<style>${css}
    body{width:1080px;height:1920px;background:linear-gradient(160deg,${s.bg[0]},${s.bg[1]})}
    .cap{height:340px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;
      font-size:92px;line-height:1.02;text-align:center;text-shadow:0 7px 0 rgba(0,0,0,.35)}
    .shot{position:absolute;left:90px;top:340px;width:900px;height:1600px;border-radius:44px 44px 0 0;overflow:hidden;
      box-shadow:0 -10px 50px rgba(0,0,0,.45);border:8px solid rgba(255,255,255,.9);border-bottom:0}
    .shot img{width:100%;display:block}</style>
    <div class=cap><div>${s.cap[0]}</div><div>${s.cap[1]}</div></div><div class=shot><img src="${s.img}"></div>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, `capture-${i + 1}.png`), omitBackground: false });
  await p.close();
}

// 3. Feature graphic: vivid red, title centred (safe from cropping), real gameplay framed on the right.
{
  const p = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await p.setContent(`<style>${css}
    body{width:1024px;height:500px;background:radial-gradient(circle at 50% 45%,#ff4d5e 0%,#d0142f 55%,#7a0a1d 100%)}
    .streak{position:absolute;left:-100px;top:225px;width:1300px;height:60px;transform:rotate(-12deg);
      background:linear-gradient(90deg,transparent,rgba(255,225,230,.35),transparent)}
    .ph{position:absolute;top:40px;width:230px;height:410px;border-radius:26px;overflow:hidden;border:6px solid #fff;
      box-shadow:0 14px 34px rgba(60,0,10,.55)}
    .ph img{width:100%;display:block}
    .l{left:44px;transform:rotate(-6deg)} .r{right:44px;transform:rotate(6deg)}
    .t{position:absolute;left:0;right:0;top:118px;text-align:center;line-height:.92}
    .a{font-size:118px;color:#fff;text-shadow:0 7px 0 #4a0010}
    .b{font-size:118px;color:#ffd84d;text-shadow:0 7px 0 #4a0010}
    .s{position:absolute;left:0;right:0;top:372px;text-align:center;font-size:32px;color:#fff;text-shadow:0 3px 0 #4a0010}</style>
    <div class=streak></div>
    <div class="ph l"><img src="${shots[0].img}"></div><div class="ph r"><img src="${shots[1].img}"></div>
    <div class=t><div class=a>SHADOW</div><div class=b>STRIKE</div></div>
    <div class=s>Infiltre-toi. Frappe dans l'ombre.</div>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'image-presentation-1024x500.png') });
  await p.close();
}

// 4. Icon: the app icon (assets/icon-only.png) downscaled, kept as 32-bit PNG with alpha.
{
  const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(base, 'assets/icon-only.png')).toString('base64');
  const p = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await p.setContent(`<style>*{margin:0}</style><img src="${icon}" width=512 height=512 style="display:block">`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(out, 'icone-512.png'), omitBackground: true });
  await p.close();
}

await browser.close(); server.close();
console.log('ok ->', out);
