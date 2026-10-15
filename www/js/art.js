'use strict';
// Procedural cartoon art: characters, obstacles, floors, gems. No image files.
// World units: 1 = one tile. Characters face +x in local space.
window.KT = window.KT || {};
KT.art = (() => {
  const OUT = '#1c1a2b';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function rrect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  function ellipse(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
  function fillStroke(g, fill, lw = 0.05) { g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); }

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function hex(r, g, b) { return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  // amt > 0 lightens, < 0 darkens
  function shade(h, amt) {
    const [r, g, b] = rgb(h), t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    return hex(Math.round((t - r) * p + r), Math.round((t - g) * p + g), Math.round((t - b) * p + b));
  }
  function grey(h) {
    const [r, g, b] = rgb(h);
    const v = Math.round((r * 0.3 + g * 0.59 + b * 0.11) * 0.55 + 50);
    return hex(v, v, v);
  }
  const greyCache = new WeakMap();
  function greyLook(L) {
    if (!greyCache.has(L)) {
      const o = {};
      for (const k in L) o[k] = typeof L[k] === 'string' && L[k][0] === '#' ? grey(L[k]) : L[k];
      greyCache.set(L, o);
    }
    return greyCache.get(L);
  }

  function drawIce(g, x, y, t) {
    g.save(); g.translate(x, y);
    const pts = [[0.55, 0], [0.38, 0.42], [-0.05, 0.56], [-0.45, 0.35], [-0.55, -0.05], [-0.3, -0.48], [0.15, -0.55], [0.48, -0.3]];
    g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath();
    g.fillStyle = 'rgba(160,225,255,0.72)'; g.fill();
    g.lineWidth = 0.05; g.strokeStyle = '#e9fbff'; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.04;
    g.beginPath(); g.moveTo(-0.3, -0.25); g.lineTo(-0.05, -0.38); g.stroke();
    g.beginPath(); g.moveTo(0.1, 0.25); g.lineTo(0.3, 0.1); g.stroke();
    if (t != null && t < 1.2 && Math.sin(t * 25) > 0) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(); }
    g.restore();
  }

  function drawGem(g, x, y, r, rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath();
    g.fillStyle = '#45d4ff'; g.fill();
    g.lineWidth = r * 0.2; g.strokeStyle = '#13609c'; g.stroke();
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; g.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); }
    g.closePath(); g.fillStyle = '#b5f3ff'; g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(-r * 0.35, -r * 0.45, r * 0.18, r * 0.18);
    g.restore();
  }

  // ---------- Map ----------
  // ---------- Map ----------
  // Each theme changes the floor and the look of the interior walls.
  const THEMES = {
    concrete: { base: '#c9cac6', stain: [70, 72, 66], line: 'rgba(60,62,58,0.07)', wall: 'fence' },
    warehouse: { base: '#c2b7a4', stain: [90, 70, 45], line: 'rgba(80,60,40,0.08)', wall: 'fence' },
    lab: { base: '#c6ccd2', stain: [50, 60, 75], line: 'rgba(50,60,80,0.08)', wall: 'fence' },
    interior: { base: '#86b9bb', stain: [30, 70, 80], line: 'rgba(20,60,70,0.16)', wall: 'panel', tiles: 0.5 },
    garden: { base: '#bcc3b2', stain: [70, 80, 60], line: 'rgba(60,70,50,0.14)', wall: 'hedge', tiles: 1 },
  };

  function hazard(g, x, y, w, h, vertical) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#f2c230'; g.fillRect(x, y, w, h);
    g.fillStyle = '#26262b';
    const step = 0.16, len = vertical ? h : w;
    for (let t = -0.2; t < len + 0.2; t += step * 2) {
      g.beginPath();
      if (vertical) { g.moveTo(x, y + t); g.lineTo(x + w, y + t + w); g.lineTo(x + w, y + t + w + step); g.lineTo(x, y + t + step); }
      else { g.moveTo(x + t, y + h); g.lineTo(x + t + h, y); g.lineTo(x + t + h + step, y); g.lineTo(x + t + step, y + h); }
      g.fill();
    }
    g.restore();
    g.lineWidth = 0.025; g.strokeStyle = '#26262b'; g.strokeRect(x, y, w, h);
  }

  function drawFloor(g, L, rnd) {
    const th = THEMES[L.theme] || THEMES.concrete;
    g.fillStyle = th.base; g.fillRect(0, 0, L.W, L.H);
    // mottled concrete: large soft stains
    const [sr, sg, sb] = th.stain;
    for (let i = 0; i < L.W * L.H * 0.35; i++) {
      const x = rnd() * L.W, y = rnd() * L.H, r = 0.3 + rnd() * 1.1;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.03 + rnd() * 0.06;
      gr.addColorStop(0, `rgba(${sr},${sg},${sb},${a})`); gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < L.W * L.H * 0.12; i++) {
      const x = rnd() * L.W, y = rnd() * L.H, r = 0.2 + rnd() * 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // slab joints (tiled themes have a tighter grid)
    const step = th.tiles || 2;
    g.strokeStyle = th.line; g.lineWidth = th.tiles ? 0.03 : 0.02; g.beginPath();
    for (let y = 0; y <= L.H; y += step) { g.moveTo(0, y); g.lineTo(L.W, y); }
    for (let x = 0; x <= L.W; x += step) { g.moveTo(x, 0); g.lineTo(x, L.H); }
    g.stroke();
    // small cracks
    g.strokeStyle = 'rgba(40,40,40,0.18)'; g.lineWidth = 0.015;
    for (let i = 0; i < L.H * 0.6; i++) {
      let x = 1 + rnd() * (L.W - 2), y = 1 + rnd() * (L.H - 2);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 0.4; y += (rnd() - 0.5) * 0.4; g.lineTo(x, y); }
      g.stroke();
    }
  }

  // Interior walls are olive fence segments; the outer border is a heavy dark metal wall.
  function drawWalls(g, L) {
    const solid = v => v === 1 || v === 3;
    const isW = (x, y) => x < 0 || y < 0 || x >= L.W || y >= L.H || solid(L.grid[y][x]);
    const border = (x, y) => x === 0 || y === 0 || x === L.W - 1 || y === L.H - 1 || L.grid[y][x] === 3;
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (!solid(L.grid[y][x])) continue;
      if (border(x, y)) {
        g.fillStyle = '#34363b'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#44474d'; g.fillRect(x + 0.06, y + 0.06, 0.88, 0.88);
        g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 0.06, y + 0.06, 0.88, 0.12);
        continue;
      }
      const style = (THEMES[L.theme] || THEMES.concrete).wall;
      const topH = isW(x, y + 1) ? 1 : 0.8;
      if (style === 'hedge') {
        g.fillStyle = '#245e22'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#3a8c33'; g.fillRect(x, y, 1, topH);
        for (let k = 0; k < 9; k++) {
          const lx = x + 0.12 + ((k * 0.37 + x * 0.13) % 0.78), ly = y + 0.1 + ((k * 0.53 + y * 0.29) % (topH - 0.18));
          g.fillStyle = k % 3 ? 'rgba(120,200,90,0.55)' : 'rgba(20,70,20,0.45)';
          circle(g, lx, ly, 0.09 + (k % 2) * 0.04); g.fill();
        }
      } else if (style === 'panel') {
        g.fillStyle = '#243b63'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#3e62a0'; g.fillRect(x, y, 1, topH);
        g.strokeStyle = 'rgba(15,30,60,0.55)'; g.lineWidth = 0.03; g.beginPath();
        g.moveTo(x + 0.5, y + 0.05); g.lineTo(x + 0.5, y + topH - 0.05); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 0.06, y + 0.05, 0.88, 0.07);
        g.fillStyle = '#a8bde0';
        for (const [rx, ry] of [[0.15, 0.2], [0.85, 0.2], [0.15, topH - 0.15], [0.85, topH - 0.15]]) { circle(g, x + rx, y + ry, 0.03); g.fill(); }
      } else {
        g.fillStyle = '#6f6d44'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#8c8a58'; g.fillRect(x, y, 1, topH);
        g.strokeStyle = '#6a6840'; g.lineWidth = 0.035; g.beginPath();
        for (let k = 0; k < 5; k++) {
          const yy = y + 0.12 + k * 0.15, off = (k % 2) * 0.12;
          for (let xx = x + 0.05 + off; xx < x + 0.95; xx += 0.24) { g.moveTo(xx, yy); g.lineTo(Math.min(x + 0.95, xx + 0.13), yy); }
        }
        g.stroke();
      }
    }
    // outlines on the edges facing the floor
    g.strokeStyle = '#2b2b26'; g.lineWidth = 0.06; g.lineCap = 'square';
    g.beginPath();
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (!solid(L.grid[y][x])) continue;
      if (!isW(x, y - 1)) { g.moveTo(x, y); g.lineTo(x + 1, y); }
      if (!isW(x, y + 1)) { g.moveTo(x, y + 1); g.lineTo(x + 1, y + 1); }
      if (!isW(x - 1, y)) { g.moveTo(x, y); g.lineTo(x, y + 1); }
      if (!isW(x + 1, y)) { g.moveTo(x + 1, y); g.lineTo(x + 1, y + 1); }
    }
    g.stroke();
    // doorways: hazard-striped thresholds where a wall row has a gap
    for (let y = 1; y < L.H - 1; y++) for (let x = 1; x < L.W - 1; x++) {
      if (L.grid[y][x] !== 0) continue;
      // a doorway is a gap (1-2 tiles wide) inside a horizontal wall line
      if (isW(x, y - 1) || isW(x, y + 1)) continue;
      const horizWall = (wx) => isW(wx, y) && !border(wx, y) && !isW(wx, y - 1) && !isW(wx, y + 1);
      const leftOk = horizWall(x - 1) || (!isW(x - 1, y) && horizWall(x - 2));
      const rightOk = horizWall(x + 1) || (!isW(x + 1, y) && horizWall(x + 2));
      if (leftOk && rightOk) {
        hazard(g, x + 0.04, y + 0.02, 0.92, 0.13, false);
        hazard(g, x + 0.04, y + 0.85, 0.92, 0.13, false);
      }
    }
  }

  function drawObstacle(g, r) {
    const { x, y, w, h, type } = r, i = 0.04;
    const X = x + i, Y = y + i, Wd = w - i * 2, Hd = h - i * 2;
    g.lineJoin = 'round';
    if (type === 'planter') {
      rrect(g, X, Y, Wd, Hd, 0.06); fillStroke(g, '#5a6e2e', 0.05);
      g.save(); rrect(g, X + 0.07, Y + 0.07, Wd - 0.14, Hd - 0.14, 0.04); g.clip();
      for (let yy = 0; yy < h * 4; yy++) for (let xx = 0; xx < w * 4; xx++) {
        g.fillStyle = (xx + yy) % 2 ? '#7cc23a' : '#6db532';
        g.fillRect(x + xx * 0.25, y + yy * 0.25, 0.25, 0.25);
      }
      g.strokeStyle = 'rgba(40,90,20,0.35)'; g.lineWidth = 0.015; g.beginPath();
      for (let k = 0; k < 40 * w * h; k++) {
        const gx = x + 0.1 + ((k * 0.37) % (w - 0.2)), gy = y + 0.1 + ((k * 0.61) % (h - 0.2));
        g.moveTo(gx, gy); g.lineTo(gx + 0.03, gy - 0.07);
      }
      g.stroke();
      g.restore();
      const cx = x + w / 2, cy = y + h / 2;
      g.fillStyle = 'rgba(0,0,0,0.25)'; rrect(g, cx - 0.3, cy - 0.22, 0.62, 0.62, 0.08); g.fill();
      rrect(g, cx - 0.32, cy - 0.32, 0.64, 0.64, 0.08); fillStroke(g, '#5b5d62', 0.045);
      rrect(g, cx - 0.22, cy - 0.22, 0.44, 0.44, 0.05); g.fillStyle = '#74777d'; g.fill();
    } else if (type === 'crate') {
      rrect(g, X, Y, Wd, Hd, 0.06); fillStroke(g, '#b5653a');
      const p = 0.1;
      g.fillStyle = '#9c5431'; g.fillRect(X + p, Y + p, Wd - p * 2, Hd - p * 2);
      g.strokeStyle = '#7d4126'; g.lineWidth = 0.03; g.beginPath();
      for (let xx = X + p + 0.16; xx < X + Wd - p - 0.05; xx += 0.16) { g.moveTo(xx, Y + p); g.lineTo(xx, Y + Hd - p); }
      g.stroke();
      g.strokeStyle = '#c97c4c'; g.lineWidth = 0.08;
      g.beginPath(); g.moveTo(X + p, Y + p); g.lineTo(X + Wd - p, Y + Hd - p); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(X + 0.08, Y + 0.04); g.lineTo(X + Wd - 0.08, Y + 0.04); g.stroke();
    } else if (type === 'metal') {
      rrect(g, X + 0.04, Y + 0.04, Wd - 0.08, Hd - 0.08, 0.1); fillStroke(g, '#4c4e53', 0.05);
      rrect(g, X + 0.16, Y + 0.16, Wd - 0.32, Hd - 0.32, 0.06);
      g.fillStyle = lin(g, X, Y, X + Wd, Y + Hd, '#7a7d83', '#55585e'); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 0.03;
      g.beginPath(); g.moveTo(X + 0.18, Y + 0.18); g.lineTo(X + Wd - 0.2, Y + 0.18); g.stroke();
    } else {
      // red shipping container with hazard chevrons
      rrect(g, X, Y, Wd, Hd, 0.07); fillStroke(g, '#c4512c');
      const horiz = w >= h;
      g.strokeStyle = '#a5401f'; g.lineWidth = 0.04; g.beginPath();
      if (horiz) for (let xx = X + 0.12; xx < X + Wd - 0.06; xx += 0.14) { g.moveTo(xx, Y + 0.1); g.lineTo(xx, Y + Hd - 0.1); }
      else for (let yy = Y + 0.12; yy < Y + Hd - 0.06; yy += 0.14) { g.moveTo(X + 0.1, yy); g.lineTo(X + Wd - 0.1, yy); }
      g.stroke();
      g.strokeStyle = '#26262b'; g.lineWidth = 0.05; g.beginPath();
      if (horiz) {
        const cx = X + Wd / 2;
        g.moveTo(cx - 0.42, Y + 0.12); g.lineTo(cx - 0.2, Y + Hd - 0.14); g.moveTo(cx + 0.42, Y + 0.12); g.lineTo(cx + 0.2, Y + Hd - 0.14);
      } else {
        const cy = Y + Hd / 2;
        g.moveTo(X + 0.12, cy - 0.42); g.lineTo(X + Wd - 0.14, cy - 0.2); g.moveTo(X + 0.12, cy + 0.42); g.lineTo(X + Wd - 0.14, cy + 0.2);
      }
      g.stroke();
      g.strokeStyle = '#f2c230'; g.lineWidth = 0.025; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(X + 0.08, Y + 0.04); g.lineTo(X + Wd - 0.08, Y + 0.04); g.stroke();
    }
  }
  function lin(g, x0, y0, x1, y1, c0, c1) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; }

  function renderMap(L, px) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(L.W * px); c.height = Math.ceil(L.H * px);
    const g = c.getContext('2d');
    g.scale(px, px);
    drawFloor(g, L, mulberry32(L.seed));
    // obstacles walled into a sealed-off area are not visible
    const touchesFloor = r => {
      for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) {
        if (y >= 0 && x >= 0 && y < L.H && x < L.W && L.grid[y][x] === 0) return true;
      }
      return false;
    };
    const rects = L.rects.filter(touchesFloor);
    for (const r of L.rects) if (!rects.includes(r)) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      g.fillStyle = '#34363b'; g.fillRect(x, y, 1, 1); g.fillStyle = '#44474d'; g.fillRect(x + 0.06, y + 0.06, 0.88, 0.88);
    }
    // soft drop shadows toward the bottom-right
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (L.grid[y][x] === 1 || L.grid[y][x] === 3) g.fillRect(x + 0.12, y + 0.16, 1, 1);
    }
    for (const r of rects) {
      if (r.type === 'planter') continue;
      rrect(g, r.x + 0.12, r.y + 0.18, r.w - 0.04, r.h - 0.04, 0.1); g.fill();
    }
    drawWalls(g, L);
    for (const r of rects) drawObstacle(g, r);
    return c;
  }

  // ---------- Persistent floor decals ----------
  function makeSplat(rnd, size) {
    const pts = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = size * (0.55 + rnd() * 0.5) * (i % 3 === 0 ? 1.35 : 1);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const drops = [];
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2, d = size * (1.1 + rnd() * 1.1);
      drops.push([Math.cos(a) * d, Math.sin(a) * d, size * (0.06 + rnd() * 0.12)]);
    }
    const streaks = [];
    for (let i = 0; i < 4; i++) { const a = rnd() * Math.PI * 2; streaks.push([a, size * (1.2 + rnd() * 1.0)]); }
    return { pts, drops, streaks };
  }
  function drawSplat(g, d) {
    g.save(); g.translate(d.x, d.y); g.rotate(d.rot || 0);
    g.globalAlpha = d.alpha == null ? 1 : d.alpha;
    g.strokeStyle = '#8f1418'; g.lineCap = 'round';
    for (const [a, l] of d.shape.streaks) {
      g.lineWidth = 0.05; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke();
    }
    g.beginPath();
    d.shape.pts.forEach(([x, y], i) => {
      const [px, py] = d.shape.pts[(i + d.shape.pts.length - 1) % d.shape.pts.length];
      if (!i) g.moveTo((x + px) / 2, (y + py) / 2);
      g.quadraticCurveTo(px, py, (x + px) / 2, (y + py) / 2);
    });
    const [lx, ly] = d.shape.pts[d.shape.pts.length - 1], [fx, fy] = d.shape.pts[0];
    g.quadraticCurveTo(lx, ly, (fx + lx) / 2, (fy + ly) / 2);
    g.closePath();
    g.fillStyle = '#a3171c'; g.fill();
    g.fillStyle = 'rgba(70,0,5,0.35)'; g.save(); g.scale(0.6, 0.6); g.fill(); g.restore();
    g.fillStyle = '#a3171c';
    for (const [x, y, r] of d.shape.drops) { circle(g, x, y, r); g.fill(); }
    g.restore();
  }
  function drawScorch(g, d) {
    g.save(); g.translate(d.x, d.y);
    const gr = g.createRadialGradient(0, 0, 0.1, 0, 0, d.r);
    gr.addColorStop(0, 'rgba(15,15,15,0.85)'); gr.addColorStop(0.55, 'rgba(25,25,25,0.55)'); gr.addColorStop(1, 'rgba(30,30,30,0)');
    g.fillStyle = gr;
    g.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2, r = d.r * (0.75 + 0.25 * Math.abs(Math.sin(i * 2.3 + d.seed)));
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,20,20,0.5)'; g.lineWidth = 0.03;
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63 + d.seed, r = d.r * (0.8 + (i % 3) * 0.15);
      g.beginPath(); g.moveTo(Math.cos(a) * d.r * 0.3, Math.sin(a) * d.r * 0.3); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke();
    }
    g.restore();
  }

  return { drawIce, drawGem, renderMap, makeSplat, drawSplat, drawScorch, rrect, circle, ellipse, shade, greyLook, mulberry32, OUT };
})();
