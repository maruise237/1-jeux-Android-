// Draws the app icon from the game's own hero art (top view, knife raised, red background).
// Usage: CHROMIUM_PATH=... node tools/make-icon.mjs  ->  assets/icon-only.png, icon-foreground.png, icon-background.png
// then: npx @capacitor/assets generate --android
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(base, 'www'), outDir = path.join(base, 'assets');
const server=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(root,u==='/'?'index.html':u);if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':{'.js':'text/javascript','.html':'text/html','.css':'text/css'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(0);
const b=await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p=await b.newPage({viewport:{width:400,height:400}});
await p.goto(`http://localhost:${server.address().port}/index.html`);
await p.waitForTimeout(500);
const out = await p.evaluate(() => {
  const s = window.__shadowStrike; s.save.level = 1; s.startLevel();
  const look = s.player.look, art = KT.art, S = 1024;
  function layer(kind) {
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    if (kind !== 'fg') {
      const bg = g.createRadialGradient(S/2, S*0.42, 40, S/2, S/2, S*0.75);
      bg.addColorStop(0, '#ff3a4c'); bg.addColorStop(0.45, '#b3122a'); bg.addColorStop(1, '#2a0510');
      g.fillStyle = bg; g.fillRect(0, 0, S, S);
      // diagonal slash streak behind the hero
      g.save(); g.translate(S/2, S/2); g.rotate(-0.75);
      const st = g.createLinearGradient(-S*0.6, 0, S*0.6, 0);
      st.addColorStop(0, 'rgba(255,255,255,0)'); st.addColorStop(0.5, 'rgba(255,220,225,0.35)'); st.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = st; g.beginPath(); g.moveTo(-S*0.6, -14); g.lineTo(S*0.6, -40); g.lineTo(S*0.6, 40); g.lineTo(-S*0.6, 14); g.fill();
      g.restore();
    }
    if (kind !== 'bg') {
      const pc = document.createElement('canvas'); pc.width = 900; pc.height = 1150;
      // the portrait is framed tight on the head: push it down so the raised knife fits in the picture
      const pg = pc.getContext('2d'), st0 = pg.setTransform.bind(pg);
      pg.setTransform = (a, b2, c2, d, e, f) => st0(a, b2, c2, d, e + (a !== 1 ? -60 : 0), f + (a !== 1 ? 170 : 0));
      art.drawPortrait(pc, look, { walk: 1.2 });
      // soft dark shadow, then the hero
      g.save(); g.shadowColor = 'rgba(30,0,8,0.65)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
      g.drawImage(pc, (S - 700) / 2 + 30, (S - 894) / 2 + 20, 700, 894); g.restore();
    }
    return c.toDataURL('image/png');
  }
  return { full: layer('full'), fg: layer('fg'), bg: layer('bg') };
});
for (const k of Object.keys(out)) fs.writeFileSync(`${outDir}/${{ full: 'icon-only', fg: 'icon-foreground', bg: 'icon-background' }[k]}.png`, Buffer.from(out[k].split(',')[1], 'base64'));
await b.close(); server.close();
