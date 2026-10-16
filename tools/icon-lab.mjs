// Draws candidate store icons (1024x1024) for comparison, in the game's own art style.
// Usage: CHROMIUM_PATH=... node tools/icon-lab.mjs <outDir>
//   A-embuscade.png : top-down, the hero lunging at a guard who looks away (gameplay view, like the screenshots)
//   B-portrait.png  : front close-up of Kenji (red headband, kunai), determined look
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(base, 'www'), out = path.resolve(process.argv[2] || 'icon-lab');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 400, height: 400 } });
await p.goto(`http://localhost:${server.address().port}/index.html`);
await p.waitForTimeout(500);

const res = await p.evaluate(() => {
  const S = 1024, OUT = '#1c1a2b', art = KT.art, st = window.__shadowStrike;
  st.save.level = 1; st.startLevel();
  const hero = { ...st.player.look, eyes: 'angry' };
  const thug = { ...st.GUARD_TYPES.suit.look, id: 'icon-guard' };
  const canvas = () => { const c = document.createElement('canvas'); c.width = c.height = S; return [c, c.getContext('2d')]; };

  // ---- A: ambush, top-down ----
  function ambush() {
    const [c, g] = canvas();
    const bg = g.createRadialGradient(S * 0.45, S * 0.55, 60, S / 2, S / 2, S * 0.78);
    bg.addColorStop(0, '#3a4266'); bg.addColorStop(0.6, '#262b45'); bg.addColorStop(1, '#14172a');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    // floor tiles, faint
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 6;
    for (let i = -2; i < 8; i++) { g.beginPath(); g.moveTo(i * 180 + 40, 0); g.lineTo(i * 180 + 40, S); g.moveTo(0, i * 180 + 70); g.lineTo(S, i * 180 + 70); g.stroke(); }
    const k = 880; // px per tile
    art.setResolution(k);
    const guard = { x: S * 0.9, y: S * 0.1, a: -Math.PI / 4 }; // looks away, to the top-right
    // flashlight cone of the guard
    g.save(); g.translate(guard.x, guard.y); g.rotate(guard.a + 0.35);
    const cone = g.createRadialGradient(0, 0, 40, 0, 0, 520);
    cone.addColorStop(0, 'rgba(255,244,190,0.95)'); cone.addColorStop(1, 'rgba(255,220,120,0.15)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 520, -0.55, 0.55); g.closePath(); g.fill();
    g.restore();
    // red danger glow behind the hero
    const glow = g.createRadialGradient(S * 0.4, S * 0.62, 30, S * 0.4, S * 0.62, 460);
    glow.addColorStop(0, 'rgba(255,58,76,0.55)'); glow.addColorStop(1, 'rgba(255,58,76,0)');
    g.fillStyle = glow; g.fillRect(0, 0, S, S);
    g.save(); g.scale(k, k);
    art.drawCharacter(g, thug, guard.x / k, guard.y / k, guard.a, { weapon: 'smg' });
    art.drawCharacter(g, hero, S * 0.42 / k, S * 0.6 / k, -Math.PI / 4, { attack: true });
    g.restore();
    return c.toDataURL('image/png');
  }

  // ---- B: front portrait ----
  function portrait() {
    const [c, g] = canvas();
    g.lineJoin = 'round'; g.lineCap = 'round';
    const bg = g.createRadialGradient(S * 0.5, S * 0.42, 40, S * 0.5, S * 0.5, S * 0.75);
    bg.addColorStop(0, '#ff4d5e'); bg.addColorStop(0.5, '#c3142d'); bg.addColorStop(1, '#4a0614');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    const ink = (fill, lw = 16) => { g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); };
    const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };

    // shoulders + vest
    g.beginPath(); g.moveTo(130, S + 20); g.bezierCurveTo(150, 800, 300, 735, 512, 735); g.bezierCurveTo(724, 735, 874, 800, 894, S + 20); g.closePath();
    ink(lin(0, 735, 0, S, [[0, '#4aa65a'], [1, '#24552e']]));
    g.beginPath(); g.moveTo(420, 740); g.lineTo(512, 860); g.lineTo(604, 740); ink('#24552e', 14);
    // neck
    g.beginPath(); g.moveTo(440, 640); g.lineTo(440, 760); g.quadraticCurveTo(512, 800, 584, 760); g.lineTo(584, 640); g.closePath(); ink('#cf9873', 14);
    // headband tails, behind the head, flying right
    g.beginPath(); g.moveTo(700, 330); g.bezierCurveTo(820, 300, 880, 360, 960, 300); g.bezierCurveTo(930, 380, 850, 400, 720, 395); g.closePath(); ink('#d63a3a', 14);
    g.beginPath(); g.moveTo(705, 360); g.bezierCurveTo(820, 380, 860, 470, 950, 470); g.bezierCurveTo(880, 520, 790, 470, 700, 420); g.closePath(); ink('#b52b2b', 14);
    // spiky hair (back mass)
    const spikes = [[270, 360], [215, 230], [320, 270], [330, 130], [430, 220], [500, 80], [560, 210], [660, 120], [680, 260], [800, 210], [760, 360]];
    g.beginPath(); g.moveTo(...spikes[0]); spikes.slice(1).forEach(pt => g.lineTo(...pt)); g.quadraticCurveTo(512, 420, 270, 360); g.closePath();
    ink(lin(0, 80, 0, 420, [[0, '#7a5236'], [1, '#3a2416']]));
    // ears
    for (const [x, s] of [[290, -1], [734, 1]]) { g.beginPath(); g.ellipse(x, 500, 48, 66, s * 0.2, 0, Math.PI * 2); ink('#e0a67c', 14); }
    // head
    g.beginPath(); g.moveTo(300, 380); g.bezierCurveTo(290, 560, 360, 690, 512, 700); g.bezierCurveTo(664, 690, 734, 560, 724, 380); g.bezierCurveTo(700, 300, 324, 300, 300, 380); g.closePath();
    ink(lin(300, 0, 724, 0, [[0, '#f4c49c'], [0.6, '#e8b48a'], [1, '#c98d5f']]));
    // front hair fringe
    g.beginPath(); g.moveTo(300, 390); g.lineTo(345, 300); g.lineTo(390, 360); g.lineTo(440, 285); g.lineTo(490, 355); g.lineTo(560, 280); g.lineTo(600, 350); g.lineTo(670, 290); g.lineTo(724, 390); g.quadraticCurveTo(512, 330, 300, 390); g.closePath();
    ink('#4a2f1d', 14);
    // headband
    g.beginPath(); g.moveTo(296, 400); g.quadraticCurveTo(512, 340, 728, 400); g.lineTo(726, 462); g.quadraticCurveTo(512, 404, 298, 462); g.closePath(); ink(lin(0, 340, 0, 462, [[0, '#ff5a5a'], [1, '#b52b2b']]), 14);
    g.beginPath(); g.ellipse(512, 410, 46, 26, 0, 0, Math.PI * 2); ink('#c9ced8', 10); // metal plate
    // eyes (determined, looking to the side)
    for (const [x, s] of [[425, -1], [600, 1]]) {
      g.beginPath(); g.moveTo(x - 62, 525); g.quadraticCurveTo(x, 482 + (s < 0 ? 8 : 0), x + 62, 525 - s * 8); g.quadraticCurveTo(x, 568, x - 62, 525); g.closePath(); ink('#ffffff', 12);
      g.beginPath(); g.ellipse(x + 22, 530, 22, 27, 0, 0, Math.PI * 2); g.fillStyle = OUT; g.fill();
      g.beginPath(); g.arc(x + 26, 518, 8, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      // angry brow
      g.beginPath(); g.moveTo(x - 74, 470 - s * 40 + (s > 0 ? 0 : 0)); g.lineTo(x + 70, 470 + s * 40); g.lineWidth = 40; g.strokeStyle = '#2e1c10'; g.stroke();
    }
    // nose + smirk
    g.beginPath(); g.moveTo(512, 560); g.quadraticCurveTo(540, 600, 506, 610); g.lineWidth = 10; g.strokeStyle = '#a8714a'; g.stroke();
    g.beginPath(); g.moveTo(440, 636); g.quadraticCurveTo(520, 668, 600, 606); g.quadraticCurveTo(540, 690, 440, 636); g.closePath(); ink('#7a2a2a', 12);
    g.beginPath(); g.moveTo(470, 642); g.quadraticCurveTo(530, 660, 585, 622); g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.stroke();
    // fist + kunai crossing in front, blade to the top-right
    g.save(); g.translate(760, 930); g.rotate(-1.25); g.scale(0.85, 0.85);
    g.beginPath(); g.arc(-150, 0, 44, 0, Math.PI * 2); g.lineWidth = 26; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#9aa6b8'; g.stroke();
    g.beginPath(); g.roundRect(-110, -32, 200, 64, 18); ink('#2a2c34', 14);
    g.beginPath(); g.moveTo(80, 0); g.lineTo(200, -92); g.lineTo(560, 0); g.lineTo(200, 92); g.closePath();
    ink(lin(0, -92, 0, 92, [[0, '#f2f7ff'], [0.5, '#a9c4e8'], [1, '#4f6f9e']]), 16);
    g.beginPath(); g.moveTo(130, 0); g.lineTo(530, 0); g.lineWidth = 10; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
    const gl = g.createRadialGradient(200, 0, 0, 200, 0, 80); gl.addColorStop(0, '#fff'); gl.addColorStop(0.35, '#ff4fa3'); gl.addColorStop(1, 'rgba(255,79,163,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(200, 0, 80, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(200, 0, 26, 0, Math.PI * 2); ink('#ff4fa3', 10);
    // fist over the grip
    g.beginPath(); g.ellipse(-10, 0, 82, 74, 0, 0, Math.PI * 2); ink(lin(-90, 0, 70, 0, [[0, '#2b2b33'], [1, '#4a4a58']]), 16);
    g.restore();
    return c.toDataURL('image/png');
  }
  return { 'A-embuscade': ambush(), 'B-portrait': portrait() };
});
for (const [k, v] of Object.entries(res)) fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(v.split(',')[1], 'base64'));
await b.close(); server.close();
console.log('ok ->', out);
