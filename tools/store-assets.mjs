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

// 1. Raw gameplay captures, 1080x1920. With zoom, the frame is a 1.5x close-up centred on `focus`
// (the hero by default) so characters stay readable at store thumbnail size.
const ZW = 240, ZH = 1920 / 4.5;
async function capture(level, { screen, prep, arg = null, zoom = false, focus } = {}) {
  const p = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: zoom ? 4.5 : 3, hasTouch: true, isMobile: true });
  p.on('pageerror', e => console.log('page error', e.message));
  await p.goto(url); await p.waitForTimeout(500);
  await p.evaluate(l => { const s = window.__shadowStrike.save; s.level = l; s.gems = 2450; }, level);
  await p.evaluate(() => document.getElementById('btn-heroes-close')?.click()); await p.waitForTimeout(250);
  let clip;
  if (screen) { await p.click(screen); await p.waitForTimeout(400); }
  else {
    await p.click('#btn-play'); await p.waitForTimeout(4500);
    await p.evaluate(() => window.__shadowStrike.tick(120));
    if (prep) await p.evaluate(prep, arg);
    await p.addStyleTag({ content: '#tip{display:none!important}' });
    await p.waitForTimeout(400);
    if (zoom) {
      const c = await p.evaluate(f => { const S = window.__shadowStrike; const t = f === 'boss' ? S.guards.find(g => g.type === 'boss') : S.player; return S.toScreen(t.x, t.y); }, focus);
      clip = { x: Math.max(0, Math.min(360 - ZW, c.x - ZW / 2)), y: Math.max(0, Math.min(640 - ZH, c.y - ZH * 0.55)), width: ZW, height: ZH };
    }
  }
  const png = await p.screenshot({ type: 'png', clip }); await p.close();
  return 'data:image/png;base64,' + png.toString('base64');
}
// World units are tiles. Put the hero on a free tile `d` tiles behind guard `g` (outside its cone).
const placeBehindSrc = `(S, g, ds) => { const pl = S.player;
  for (const d of ds) for (const da of [0, 0.5, -0.5, 1, -1]) {
    const a = g.angle + Math.PI + da, x = g.x + Math.cos(a) * d, y = g.y + Math.sin(a) * d;
    if (!S.isWallTile(Math.floor(x), Math.floor(y))) { pl.x = x; pl.y = y; pl.angle = a + Math.PI; pl.path = null; return true; }
  } return false; }`;
// Hero right behind the guard it just killed: strike flash and gem burst both visible.
const strike = src => {
  const S = window.__shadowStrike, place = eval(src), pl = S.player;
  const g = S.guards.filter(g => g.alive && g.type !== 'boss').sort((a, b) => Math.hypot(a.x - pl.x, a.y - pl.y) - Math.hypot(b.x - pl.x, b.y - pl.y))[0];
  place(S, g, [0.7, 0.9]); S.kill(g); S.tick(3);
};
// Hero sneaking up behind a guard (the boss for `type: 'boss'`), just outside the back of its cone.
const behind = ([src, type]) => {
  const S = window.__shadowStrike, place = eval(src), pl = S.player;
  const g = S.guards.filter(g => g.alive && (!type || g.type === type)).sort((a, b) => Math.hypot(a.x - pl.x, a.y - pl.y) - Math.hypot(b.x - pl.x, b.y - pl.y))[0];
  g.frozen = 0; place(S, g, [1.3, 1.6, 1.0]); S.tick(1, 0);
};
const winAll = () => { const S = window.__shadowStrike; for (const g of S.guards) if (g.alive) S.kill(g); S.tick(240); };

const RED = ['#ff3a4c', '#8a0f22'], NAVY = ['#2b2f6b', '#14163a'];
// Order: the first 3 carry the promise (the kill, the stealth, the heroes to unlock).
const shots = [
  { cap: ['<b>Frappe</b>', 'dans l\'ombre'], img: await capture(12, { prep: strike, arg: placeBehindSrc, zoom: true }), bg: RED },
  { cap: ['<b>Évite</b>', 'la lumière'], img: await capture(18, { prep: behind, arg: [placeBehindSrc], zoom: true }), bg: RED },
  { cap: ['<b>Débloque</b>', '10 assassins'], img: await capture(8, { screen: '#btn-heroes' }), bg: RED },
  { cap: ['<b>Abats</b> le boss', 'du 10e niveau'], img: await capture(10, { prep: behind, arg: [placeBehindSrc, 'boss'], zoom: true, focus: 'boss' }), bg: NAVY },
  { cap: ['<b>Piège</b> les gardes', 'avec les mines'], img: await capture(27), bg: NAVY },
  { cap: ['<b>Gagne</b> gemmes', 'et étoiles'], img: await capture(15, { prep: winAll }), bg: NAVY },
];

const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'fonts/lilita-one-latin.woff2')).toString('base64');
const css = `@font-face{font-family:L;src:url(${font})}*{margin:0;box-sizing:border-box}body{font-family:L;overflow:hidden}`;

// 2. Captioned screenshots: caption band = 340 px of 1920 (17.7 %), gameplay below it, uncropped width.
for (const [i, s] of shots.entries()) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<style>${css}
    body{width:1080px;height:1920px;background:linear-gradient(160deg,${s.bg[0]},${s.bg[1]})}
    .cap{height:340px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;
      font-size:112px;line-height:1;text-align:center;-webkit-text-stroke:6px #2a0710;paint-order:stroke fill;
      text-shadow:0 7px 0 rgba(0,0,0,.35)}
    .cap b{font-weight:normal;color:#ffd84d}
    .shot{position:absolute;left:40px;top:340px;width:1000px;height:1600px;border-radius:44px 44px 0 0;overflow:hidden;
      box-shadow:0 -10px 50px rgba(0,0,0,.45);border:6px solid rgba(255,255,255,.9);border-bottom:0}
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
    .ph{position:absolute;top:58px;width:210px;height:374px;border-radius:26px;overflow:hidden;border:6px solid #fff;
      box-shadow:0 14px 34px rgba(60,0,10,.55)}
    .ph img{width:100%;display:block}
    .l{left:30px;transform:rotate(-6deg)} .r{right:30px;transform:rotate(6deg)}
    .t{position:absolute;left:0;right:0;top:118px;text-align:center;line-height:.92}
    .a{font-size:104px;color:#fff;text-shadow:0 7px 0 #4a0010}
    .b{font-size:104px;color:#ffd84d;text-shadow:0 7px 0 #4a0010}
    .s{position:absolute;left:0;right:0;top:384px;text-align:center}.s span{display:inline-block;font-size:28px;color:#fff;background:rgba(74,0,16,.6);padding:6px 22px;border-radius:20px}</style>
    <div class=streak></div>
    <div class="ph l"><img src="${shots[0].img}"></div><div class="ph r"><img src="${shots[3].img}"></div>
    <div class=t><div class=a>SHADOW</div><div class=b>STRIKE</div></div>
    <div class=s><span>Frappe dans l'ombre</span></div>`);
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
