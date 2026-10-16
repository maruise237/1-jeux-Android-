// Draws candidate store icons (1024x1024, opaque) for comparison, in the game's own art style.
// Usage: CHROMIUM_PATH=... node tools/icon-lab.mjs <outDir>
//   final-1-gameplay.png : top-down, Kenji lunging with his kunai, just outside a guard's flashlight cone
//   final-2-closeup.png  : front bust of Kenji (masked, narrowed eyes, red headband) raising his kunai
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

const res = await p.evaluate((V) => {
  const { HERO_K, HERO_X, HERO_Y, HERO_A, CONE, HAIR_N, HAIR_IN, HAIR_OUT } = V;
  const S = 1024, OUT = '#1c1a2b', art = KT.art, st = window.__shadowStrike;
  st.save.level = 1; st.startLevel();
  const kenji = { ...st.player.look, eyes: 'angry', id: 'icon-kenji' };
  const canvas = () => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; return [c, g]; };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
  const rad = (g, x0, y0, r0, x1, y1, r1, stops) => { const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };

  // brand background: bright red core, deep crimson edges (full bleed, opaque)
  function brandBg(g, cx = S / 2, cy = S / 2) {
    g.fillStyle = rad(g, cx, cy, 30, S / 2, S / 2, S * 0.78, [[0, '#ff5a68'], [0.35, '#ff3a4c'], [0.7, '#b3122a'], [1, '#4d0612']]);
    g.fillRect(0, 0, S, S);
  }

  // ================= Variant 1: gameplay (top-down) =================
  function gameplay() {
    const [c, g] = canvas();
    // night: brand red, darker than the close-up so the flashlight reads as light
    g.fillStyle = rad(g, S * 0.5, S * 0.55, 30, S * 0.5, S * 0.5, S * 0.78, [[0, '#f0364a'], [0.45, '#c41a32'], [0.8, '#7d0b1d'], [1, '#3d0410']]);
    g.fillRect(0, 0, S, S);
    // the guard's flashlight cone (guard off-frame top-left): crisp edge like in game; the hero lurks just outside it
    const ox = CONE[0], oy = CONE[1], a = CONE[2], half = CONE[3], R = 1400;
    g.save();
    g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, R, a - half, a + half); g.closePath(); g.clip();
    g.fillStyle = rad(g, ox, oy, 20, ox, oy, R, [[0, 'rgba(255,248,225,0.95)'], [0.5, 'rgba(255,236,210,0.7)'], [1, 'rgba(255,225,200,0.35)']]);
    g.fillRect(0, 0, S, S);
    g.restore();
    g.save(); g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, R, a - half, a + half); g.closePath();
    g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.stroke(); g.restore();
    // hero, top-down, mid-strike toward the bottom-right (towards the player), out of the light
    const k = HERO_K, hx = HERO_X, hy = HERO_Y, ang = HERO_A;
    // soft contact shadow
    g.save(); g.filter = 'blur(18px)'; g.fillStyle = 'rgba(40,0,10,0.45)';
    g.beginPath(); g.ellipse(hx + 30, hy + 40, 0.45 * k, 0.4 * k, ang, 0, Math.PI * 2); g.fill(); g.restore();
    art.setResolution(k);
    g.save(); g.scale(k, k);
    art.drawCharacter(g, kenji, hx / k, hy / k, ang, { attack: true, noShadow: true });
    g.restore();
    return c.toDataURL('image/png');
  }

  // ================= Variant 2: close-up bust =================
  function closeup() {
    const [c, g] = canvas();
    brandBg(g, S * 0.5, S * 0.42);
    const SKIN = '#e8b48a', SKIN_SH = '#c98d5f', SKIN_HI = '#f6cfa8';
    const GREEN = '#3b8f4a', GREEN_D = '#24552e', HAIR = '#4a2f1d', BAND = '#d63a3a';
    const P = (pts) => (cont) => { if (!cont) g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) { const q = pts[i]; if (q.length === 6) g.bezierCurveTo(...q); else if (q.length === 4) g.quadraticCurveTo(...q); else g.lineTo(...q); } g.closePath(); };
    // fill, optional inner rim light (shifted outline clipped to the shape), then the outline on top
    const ink = (path, fill, lw = 14, rims = []) => {
      path(); g.fillStyle = fill; g.fill();
      for (const [dx, dy, col, w] of rims) { g.save(); path(); g.clip(); g.translate(dx, dy); path(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); g.restore(); }
      path(); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke();
    };
    const shadeIn = (path, fn) => { g.save(); path(); g.clip(); fn(); g.restore(); };
    // cel band: the part of the shape not covered by its own copy shifted by (dx, dy) -> crisp edge light/shadow
    const band = (path, dx, dy, col) => { g.save(); path(); g.clip(); g.beginPath(); g.rect(-3000, -3000, 7000, 7000); g.translate(dx, dy); path(true); g.fillStyle = col; g.fill('evenodd'); g.restore(); };
    const inkB = (path, fill, lw, bands) => { path(); g.fillStyle = fill; g.fill(); for (const b of bands) band(path, ...b); path(); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); };
    const PINK = 'rgba(255,150,160,0.85)', LIGHT = 'rgba(255,235,210,0.35)', DARK = 'rgba(20,10,20,0.28)';
    const rimR = [-14, 6, 'rgba(255,140,150,0.85)', 16], rimL = [12, 10, 'rgba(255,240,220,0.55)', 14];

    // ---- swept spiky hair, built procedurally: spikes radiate from the head and bend to the right
    function spikyPath(cx, cy, n, a0, a1, rIn, rOut, bend, jitter) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, a = a0 + (a1 - a0) * t;
        const r = rOut * (1 + (jitter[i % jitter.length] || 0));
        pts.push({ tip: [cx + Math.cos(a + bend) * r, cy + Math.sin(a + bend) * r], a });
      }
      return (cont) => {
        if (!cont) g.beginPath();
        const v0 = [cx + Math.cos(a0 - 0.12) * rIn, cy + Math.sin(a0 - 0.12) * rIn];
        g.moveTo(...v0);
        pts.forEach((p, i) => {
          const da = (a1 - a0) / n;
          const vPrev = [cx + Math.cos(p.a - da / 2) * rIn, cy + Math.sin(p.a - da / 2) * rIn];
          const vNext = [cx + Math.cos(p.a + da / 2) * rIn, cy + Math.sin(p.a + da / 2) * rIn];
          if (i > 0) g.lineTo(...vPrev);
          // concave leading edge, convex trailing edge => swept, flame-like spikes
          g.quadraticCurveTo((vPrev[0] + p.tip[0]) / 2 + Math.cos(p.a + 1.6) * 30, (vPrev[1] + p.tip[1]) / 2 + Math.sin(p.a + 1.6) * 30, ...p.tip);
          g.quadraticCurveTo((vNext[0] + p.tip[0]) / 2 + Math.cos(p.a + 1.6) * 14, (vNext[1] + p.tip[1]) / 2 + Math.sin(p.a + 1.6) * 14, ...vNext);
        });
        g.lineTo(cx + Math.cos(a1 + 0.12) * rIn, cy + Math.sin(a1 + 0.12) * rIn);
        g.lineTo(cx, cy + 60);
        g.closePath();
      };
    }

    // headband tails flying to the right, behind everything
    ink(P([[660, 420], [770, 380, 860, 440, 975, 345], [950, 440, 860, 480, 700, 470]]), lin(g, 660, 0, 975, 0, [[0, '#a01e28'], [1, BAND]]), 14);
    ink(P([[660, 455], [760, 480, 850, 560, 950, 540], [900, 640, 760, 600, 665, 505]]), lin(g, 660, 0, 960, 0, [[0, '#7e1820'], [1, '#c23034']]), 14);

    // shoulders + vest
    const body = P([[80, S + 30], [100, 870, 250, 800, 400, 780], [512, 812], [624, 780], [774, 800, 924, 870, 944, S + 30]]);
    inkB(body, lin(g, 0, 780, 0, S, [[0, '#4aa65a'], [1, GREEN_D]]), 16, [[14, 16, LIGHT], [-14, 0, PINK]]);
    ink(P([[140, S + 30], [170, 905, 270, 835, 405, 805], [445, S + 30]]), lin(g, 140, 0, 445, 0, [[0, '#1c4426'], [1, '#2b6638']]), 12);
    ink(P([[884, S + 30], [854, 905, 754, 835, 619, 805], [579, S + 30]]), lin(g, 579, 0, 884, 0, [[0, '#24552e'], [1, '#163a20']]), 12);
    // dark undershirt V between the vest panels
    ink(P([[405, 805], [512, 930], [619, 805], [580, 790], [444, 790]]), '#1c4426', 12);
    // neck wrapped in the mask cloth, flaring into the collar
    const neck = P([[440, 650], [428, 790], [400, 812], [512, 850], [624, 812], [596, 790], [584, 650]]);
    ink(neck, lin(g, 428, 0, 596, 0, [[0, '#2b6638'], [1, '#163a20']]), 14);
    shadeIn(neck, () => { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(512, 735, 120, 60, 0, 0, Math.PI * 2); g.fill(); });
    // back hair
    const hairBack = spikyPath(512, 440, HAIR_N, Math.PI * 1.0, Math.PI * 2.0, HAIR_IN, HAIR_OUT, 0.2, [-0.12, 0.0, 0.08, 0.05, 0.02, -0.06, 0.0]);
    inkB(hairBack, lin(g, 0, 90, 0, 470, [[0, '#7a5236'], [0.55, HAIR], [1, '#2e1c10']]), 16, [[22, 26, 'rgba(255,215,170,0.3)'], [-26, -10, 'rgba(25,12,6,0.45)'], [-12, 0, PINK]]);
    // ears
    ink(() => { g.beginPath(); g.ellipse(318, 535, 38, 56, -0.15, 0, Math.PI * 2); }, SKIN, 14);
    ink(() => { g.beginPath(); g.ellipse(706, 535, 38, 56, 0.15, 0, Math.PI * 2); }, SKIN_SH, 14);
    for (const s2 of [-1, 1]) { g.beginPath(); g.arc(512 + s2 * 198, 535, 20, s2 < 0 ? 1.9 : -1.2, s2 < 0 ? 4.4 : 1.2); g.lineWidth = 7; g.strokeStyle = 'rgba(140,70,35,0.7)'; g.stroke(); }
    // face
    const face = P([[322, 410], [314, 520], [326, 610, 380, 690], [432, 752, 512, 756], [592, 752, 644, 690], [698, 610, 710, 520], [702, 410], [650, 340, 374, 340]]);
    inkB(face, SKIN, 16, [[-12, 0, PINK]]);
    shadeIn(face, () => {
      // cel shadow on the right cheek, soft-free hard edge
      g.fillStyle = SKIN_SH; g.beginPath(); g.moveTo(610, 380); g.bezierCurveTo(650, 470, 640, 600, 590, 780); g.lineTo(760, 780); g.lineTo(760, 380); g.closePath(); g.fill();
      // shadow under the headband
      g.fillStyle = 'rgba(140,70,35,0.35)'; g.beginPath(); g.moveTo(300, 455); g.quadraticCurveTo(512, 400, 720, 455); g.lineTo(720, 492); g.quadraticCurveTo(512, 440, 300, 492); g.closePath(); g.fill();
      // eye sockets
      g.fillStyle = 'rgba(160,80,40,0.22)';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(512 + s * 95, 520, 92, 46, s * 0.18, 0, Math.PI * 2); g.fill(); }
    });

    // ninja mask over the nose and mouth
    const mask = P([[316, 572], [420, 552, 470, 560, 512, 532], [554, 560, 604, 552, 708, 572], [704, 630, 660, 700], [612, 768, 512, 776], [412, 768, 364, 700], [320, 630, 316, 572]]);
    inkB(mask, lin(g, 316, 0, 708, 0, [[0, '#327540'], [0.55, GREEN_D], [1, '#14361d']]), 16, [[12, 14, 'rgba(255,255,255,0.16)'], [-12, 0, PINK]]);
    shadeIn(mask, () => {
      // nose ridge and cloth creases radiating from it
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(512, 540); g.quadraticCurveTo(560, 600, 540, 640); g.quadraticCurveTo(600, 640, 640, 600); g.lineTo(720, 560); g.lineTo(720, 800); g.lineTo(520, 800); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 9;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(512 + s * 30, 625); g.quadraticCurveTo(512 + s * 70, 670, 512 + s * 120, 690); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(498, 555); g.quadraticCurveTo(486, 590, 492, 620); g.stroke();
    });

    // eyes: narrowed almond shape, heavy upper lid slanting down toward the nose
    for (const s of [-1, 1]) {
      const cx = 512 + s * 98;
      const outer = [cx + s * 74, 500], inner = [cx - s * 58, 534];
      const eye = P([outer, [cx + s * 20, 494, inner[0], inner[1]], [cx - s * 4, 566, outer[0], outer[1]]]);
      ink(eye, '#ffffff', 10);
      shadeIn(eye, () => {
        g.beginPath(); g.arc(cx - s * 10, 532, 30, 0, Math.PI * 2); g.fillStyle = lin(g, 0, 500, 0, 562, [[0, '#2b1a10'], [1, '#7a4a28']]); g.fill();
        g.beginPath(); g.arc(cx - s * 10, 532, 15, 0, Math.PI * 2); g.fillStyle = OUT; g.fill();
        g.beginPath(); g.arc(cx - s * 2, 522, 8, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
        g.fillStyle = 'rgba(28,26,43,0.35)'; g.beginPath(); g.moveTo(outer[0], 480); g.lineTo(inner[0], 515); g.lineTo(inner[0], 480); g.lineTo(outer[0], 470); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(outer[0], outer[1]); g.quadraticCurveTo(cx + s * 20, 494, inner[0], inner[1]); g.lineWidth = 22; g.strokeStyle = 'rgba(28,26,43,0.3)'; g.stroke();
      });
      // thick upper lid line with a sharp flick at the outer corner
      g.beginPath(); g.moveTo(outer[0] + s * 16, outer[1] - 12); g.quadraticCurveTo(cx + s * 20, 490, inner[0], inner[1]); g.lineWidth = 18; g.strokeStyle = OUT; g.stroke();
      // brow: thick, tapered, angled hard toward the nose
      ink(P([[cx + s * 92, 448], [cx + s * 30, 446, inner[0] - s * 2, 492], [inner[0] - s * 14, 512], [cx + s * 10, 480, cx + s * 88, 470]]), '#2e1c10', 8);
    }
    // frown crease
    g.strokeStyle = 'rgba(130,60,30,0.6)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(500, 474); g.lineTo(506, 496); g.moveTo(524, 474); g.lineTo(518, 496); g.stroke();

    // headband with the metal plate
    ink(P([[310, 428], [512, 366, 714, 428], [714, 480], [512, 418, 310, 480]]), lin(g, 0, 366, 0, 480, [[0, '#ff5d5d'], [0.6, BAND], [1, '#a01e28']]), 14, [[0, 10, 'rgba(255,255,255,0.35)', 10]]);
    ink(P([[448, 398], [512, 382, 576, 398], [580, 448], [512, 434, 444, 448]]), lin(g, 0, 384, 0, 448, [[0, '#f4f7fb'], [1, '#8d97a8']]), 10);
    g.strokeStyle = '#4e5869'; g.lineWidth = 7; g.beginPath(); g.moveTo(488, 404); g.lineTo(536, 430); g.moveTo(536, 404); g.lineTo(488, 430); g.stroke();
    // front fringe spikes over the band
    const fringe = P([[302, 446], [306, 360, 360, 300], [372, 360, 392, 430], [418, 330, 470, 300], [470, 360, 482, 400], [520, 320, 590, 296], [580, 350, 594, 396], [640, 330, 702, 320], [690, 380, 722, 446], [690, 380, 512, 352], [400, 352, 302, 446]]);
    inkB(fringe, lin(g, 0, 290, 0, 440, [[0, '#6b472e'], [1, '#35210f']]), 14, [[14, 18, 'rgba(255,215,170,0.3)']]);

    // kunai raised in the right fist (viewer's right), blade pointing up
    g.save(); g.translate(758, 860); g.rotate(-1.22);
    // forearm coming up from the bottom edge
    ink(P([[-150, -66], [-420, -90], [-420, 90], [-150, 66]]), lin(g, 0, -80, 0, 80, [[0, SKIN_HI], [1, SKIN_SH]]), 14);
    ink(P([[-150, -72], [-205, -76], [-205, 76], [-150, 72]]), '#2b2b33', 12);
    // ring pommel + wrapped grip below the fist
    // blade
    ink(P([[72, 0], [180, -84], [500, 0], [180, 84]]), lin(g, 0, -84, 0, 84, [[0, '#f6f9ff'], [0.5, '#b3cbea'], [1, '#4f6f9e']]), 16);
    g.beginPath(); g.moveTo(110, 0); g.lineTo(482, 0); g.lineWidth = 9; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
    g.fillStyle = rad(g, 180, 0, 0, 180, 0, 86, [[0, '#fff'], [0.35, '#ff4fa3'], [1, 'rgba(255,79,163,0)']]);
    g.beginPath(); g.arc(180, 0, 86, 0, Math.PI * 2); g.fill();
    ink(() => { g.beginPath(); g.arc(180, 0, 24, 0, Math.PI * 2); }, '#ff4fa3', 10);
    // grip stub above the fist
    ink(() => { g.beginPath(); g.roundRect(40, -28, 44, 56, 10); }, '#2a2c34', 12);
    // fingerless glove fist: palm block, four finger rolls across the grip, thumb on top
    const fist = () => { g.beginPath(); g.roundRect(-150, -92, 196, 176, 44); };
    ink(fist, lin(g, 0, -92, 0, 84, [[0, '#4a4a58'], [1, '#22222a']]), 16, [[0, 10, 'rgba(255,255,255,0.18)', 10]]);
    for (let i = 0; i < 4; i++) {
      const x = -118 + i * 42;
      ink(() => { g.beginPath(); g.roundRect(x, 20, 40, 82, 18); }, lin(g, 0, 20, 0, 102, [[0, SKIN_HI], [1, SKIN_SH]]), 10);
    }
    ink(P([[-60, -96], [10, -110, 40, -60], [50, -20, 20, 0], [-30, -10, -60, -96]]), lin(g, 0, -110, 0, 0, [[0, SKIN_HI], [1, SKIN_SH]]), 10);
    g.restore();
    // glint on the kunai tip
    const tip = [758 + Math.cos(-1.22) * 470, 860 + Math.sin(-1.22) * 470];
    g.save(); g.translate(...tip); g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, -46); g.quadraticCurveTo(4, -4, 46, 0); g.quadraticCurveTo(4, 4, 0, 46); g.quadraticCurveTo(-4, 4, -46, 0); g.quadraticCurveTo(-4, -4, 0, -46); g.fill();
    g.restore();
    return c.toDataURL('image/png');
  }
  return { 'final-1-gameplay': gameplay(), 'final-2-closeup': closeup() };
}, { HERO_K: +(process.env.HK || 560), HERO_X: +(process.env.HX || 351), HERO_Y: +(process.env.HY || 692), HERO_A: +(process.env.HA || -0.75), CONE: (process.env.CONE || '1120,110,3.07,0.21').split(',').map(Number), HAIR_N: +(process.env.HN || 5), HAIR_IN: +(process.env.HI || 230), HAIR_OUT: +(process.env.HO || 370) });
for (const [k, v] of Object.entries(res)) fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(v.split(',')[1], 'base64'));
await b.close(); server.close();
console.log('ok ->', out);
