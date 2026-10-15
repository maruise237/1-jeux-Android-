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
    g.lineWidth = 0.05; g.strokeStyle = '#eef8ff'; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.04;
    g.beginPath(); g.moveTo(-0.3, -0.25); g.lineTo(-0.05, -0.38); g.stroke();
    g.beginPath(); g.moveTo(0.1, 0.25); g.lineTo(0.3, 0.1); g.stroke();
    if (t != null && t < 1.2 && Math.sin(t * 25) > 0) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(); }
    g.restore();
  }

  // Brilliant-cut diamond seen slightly from above: crown facets on top, pavilion below.
  // `spin` turns it on itself (flying loot), `glint` (0..1) adds a star-shaped sparkle.
  const GEM_LIGHT = ['#eef8ff', '#6cc4ff', '#2b8cff', '#1360e6', '#0a3fb0', '#062a7a'];
  function drawGem(g, x, y, r, spin = 0, glint = 0) {
    g.save(); g.translate(x, y);
    const sx = Math.cos(spin), k = Math.max(0.28, Math.abs(sx));
    g.scale(k, 1);
    const girdle = [-1, -0.5, 0, 0.5, 1].map(u => [u * r, -0.18 * r]);
    const table = [-0.56, -0.19, 0.19, 0.56].map(u => [u * r, -0.6 * r]);
    const culet = [0, 0.9 * r];
    const tri = (a, b, c, col) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fillStyle = col; g.fill(); };
    // the light comes from the top left; turning the gem slides the bright facets across
    const shift = sx < 0 ? 1 : 0;
    const L = i => GEM_LIGHT[Math.max(0, Math.min(5, i))];
    // pavilion (lower half): four long facets meeting at the culet
    [3, 4, 2, 5].forEach((c, i) => tri(girdle[i], girdle[i + 1], culet, L(c + (i % 2 ? shift : -shift))));
    // crown: zig-zag of triangles between the girdle and the table
    const crown = [[girdle[0], table[0], girdle[1], 2], [table[0], girdle[1], table[1], 1], [girdle[1], table[1], girdle[2], 3],
      [table[1], girdle[2], table[2], 1], [girdle[2], table[2], girdle[3], 2], [table[2], girdle[3], table[3], 3], [girdle[3], table[3], girdle[4], 4]];
    crown.forEach(([a, b, c, col]) => tri(a, b, c, L(col + shift)));
    // table: the flat top, thin because we look at it from the side
    g.beginPath(); g.moveTo(table[0][0], table[0][1]); g.lineTo(table[3][0], table[3][1]);
    g.lineTo(table[3][0] * 0.86, -0.7 * r); g.lineTo(table[0][0] * 0.86, -0.7 * r); g.closePath();
    g.fillStyle = L(shift); g.fill();
    // fine facet lines, then the outline
    g.lineWidth = r * 0.05; g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(girdle[0][0], girdle[0][1]); g.lineTo(girdle[4][0], girdle[4][1]); g.stroke();
    g.beginPath();
    g.moveTo(table[0][0] * 0.86, -0.7 * r); g.lineTo(-r, -0.18 * r); g.lineTo(0, 0.9 * r); g.lineTo(r, -0.18 * r); g.lineTo(table[3][0] * 0.86, -0.7 * r); g.closePath();
    g.lineWidth = r * 0.16; g.strokeStyle = '#031a4d'; g.stroke();
    // sparkle
    if (glint > 0) {
      g.scale(1 / k, 1);
      const s = r * (0.35 + 0.55 * glint), cx = -0.32 * r * k, cy = -0.5 * r;
      g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * glint})`;
      g.beginPath();
      g.moveTo(cx, cy - s); g.quadraticCurveTo(cx, cy, cx + s, cy); g.quadraticCurveTo(cx, cy, cx, cy + s);
      g.quadraticCurveTo(cx, cy, cx - s, cy); g.quadraticCurveTo(cx, cy, cx, cy - s); g.fill();
    }
    g.restore();
  }

  // Loot crate: a small steel-banded box hiding diamonds. Light leaks through its seams and it
  // hops now and then to call the player. `charge` (0..1) makes it rattle harder before it bursts.
  function drawLootCrate(g, x, y, time, charge = 0, seed = 0) {
    const ph = (time * 0.8 + seed) % 2.6;
    const hop = ph < 0.35 ? Math.sin(ph / 0.35 * Math.PI) : 0;
    const shakeX = charge > 0 ? Math.sin(time * (40 + charge * 30)) * 0.035 * charge : 0;
    const lift = hop * 0.12 + charge * 0.03;
    const sq = 1 + (ph > 0.35 && ph < 0.5 ? Math.sin((ph - 0.35) / 0.15 * Math.PI) * 0.12 : 0) + charge * 0.06;
    const w = 0.8, h = 0.68;
    // warm halo so the crate reads even in the dark rooms
    g.save(); g.globalCompositeOperation = 'lighter';
    const halo = g.createRadialGradient(x, y, 0.05, x, y, 0.75);
    halo.addColorStop(0, `rgba(255,210,90,${0.28 + 0.1 * Math.sin(time * 3 + seed) + charge * 0.2})`); halo.addColorStop(1, 'rgba(255,210,90,0)');
    g.fillStyle = halo; circle(g, x, y, 0.75); g.fill(); g.restore();
    // ground shadow shrinks while it is in the air
    g.fillStyle = `rgba(0,0,0,${0.3 - hop * 0.12})`; ellipse(g, x, y + 0.32, w * 0.55 * (1 - hop * 0.2), 0.09); g.fill();
    g.save(); g.translate(x + shakeX, y + 0.3 - lift); g.scale(sq, 2 - sq); g.translate(0, -0.3);
    g.rotate(charge > 0 ? Math.sin(time * 33) * 0.06 * charge : 0);
    // box body
    rrect(g, -w / 2, -h / 2, w, h, 0.1); g.fillStyle = '#4a7de8'; g.fill();
    g.lineWidth = 0.06; g.strokeStyle = OUT; g.stroke();
    // front face, darker, for a bit of volume
    rrect(g, -w / 2 + 0.03, 0.02, w - 0.06, h / 2 - 0.05, 0.05); g.fillStyle = '#2d55b0'; g.fill();
    // lid seam glowing with the diamonds' light
    const glow = 0.55 + Math.sin(time * 4 + seed) * 0.25 + charge * 0.4;
    g.fillStyle = `rgba(150,235,255,${Math.min(1, glow)})`; g.fillRect(-w / 2 + 0.05, -0.02, w - 0.1, 0.045);
    // steel bands and rivets
    g.fillStyle = '#ffc93c';
    g.fillRect(-w / 2 + 0.12, -h / 2 + 0.02, 0.1, h - 0.04); g.fillRect(w / 2 - 0.22, -h / 2 + 0.02, 0.1, h - 0.04);
    g.fillStyle = '#b86f10';
    for (const [rx, ry] of [[-w / 2 + 0.17, -0.22], [-w / 2 + 0.17, 0.21], [w / 2 - 0.17, -0.22], [w / 2 - 0.17, 0.21]]) { circle(g, rx, ry, 0.028); g.fill(); }
    // diamond emblem on the lid
    drawGem(g, 0, -0.16, 0.15, 0, Math.max(0, Math.sin(time * 2.2 + seed * 3) * 3 - 2));
    // flashes white just before it bursts
    if (charge > 0.75) { rrect(g, -w / 2, -h / 2, w, h, 0.1); g.fillStyle = `rgba(255,255,255,${(charge - 0.75) * 2.4 * (0.6 + 0.4 * Math.sin(time * 50))})`; g.fill(); }
    g.restore();
  }

  // ---------- Map ----------
  // ---------- Map ----------
  // Each theme changes the floor and the look of the interior walls.
  const THEMES = {
    concrete: { base: '#c9cac6', stain: [70, 72, 66], line: 'rgba(60,62,58,0.07)', wall: 'block' },
    warehouse: { base: '#b8a888', stain: [90, 70, 45], line: 'rgba(80,60,40,0.08)', wall: 'steel', lanes: true },
    lab: { base: '#d2dade', stain: [50, 60, 75], line: 'rgba(50,60,80,0.12)', wall: 'lab', tiles: 1 },
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
    for (let i = 0; i < L.W * L.H * 0.14; i++) {
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
    for (let y = 0; y < L.H; y += step) for (let x = 0; x < L.W; x += step) {
      const v = (rnd() - 0.5) * 0.08;
      g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; g.fillRect(x, y, step, step);
      g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(x, y, step, 0.02);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x, y + step - 0.02, step, 0.02);
    }
    if (th.lanes) { // painted forklift lanes in the warehouse
      g.fillStyle = 'rgba(230,190,40,0.35)';
      for (let x = 3; x < L.W - 2; x += 5) g.fillRect(x, 1, 0.08, L.H - 2);
    }
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
      const topH = isW(x, y + 1) ? 1 : 0.7; // the bottom strip is the wall's lit-from-above front face
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
      } else if (style === 'steel') {
        // corrugated steel: vertical ribs catching the light
        g.fillStyle = '#3a4450'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#5d6b7a'; g.fillRect(x, y, 1, topH);
        for (let k = 0; k < 6; k++) {
          const rx = x + 0.04 + k * 0.16;
          g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(rx, y, 0.05, topH);
          g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(rx + 0.08, y, 0.04, topH);
          if (topH < 1) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(rx, y + topH, 0.05, 1 - topH); }
        }
      } else if (style === 'lab') {
        // white wall panels with a cyan seam
        g.fillStyle = '#9fb0b8'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#e3e9ec'; g.fillRect(x, y, 1, topH);
        g.fillStyle = 'rgba(40,70,90,0.18)'; g.fillRect(x + 0.49, y, 0.02, topH);
        g.fillStyle = '#4fd0e0'; g.fillRect(x, y + topH * 0.5 - 0.02, 1, 0.04);
        if (topH < 1) { g.fillStyle = 'rgba(80,210,230,0.45)'; g.fillRect(x, y + topH + 0.1, 1, 0.03); }
      } else {
        // cinder blocks laid in a staggered bond
        g.fillStyle = '#5f615e'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#8d8f8c'; g.fillRect(x, y, 1, topH);
        g.strokeStyle = 'rgba(50,52,50,0.55)'; g.lineWidth = 0.025; g.beginPath();
        const rows = topH < 1 ? 3 : 4, rh = topH / rows;
        for (let k = 1; k < rows; k++) { g.moveTo(x, y + k * rh); g.lineTo(x + 1, y + k * rh); }
        for (let k = 0; k < rows; k++) {
          for (const jx of (k + y) % 2 ? [0.25, 0.75] : [0.5]) { g.moveTo(x + jx, y + k * rh); g.lineTo(x + jx, y + (k + 1) * rh); }
        }
        g.stroke();
        if (topH < 1) { g.strokeStyle = 'rgba(30,32,30,0.4)'; g.beginPath(); g.moveTo(x + 0.33, y + topH); g.lineTo(x + 0.33, y + 1); g.moveTo(x + 0.83, y + topH); g.lineTo(x + 0.83, y + 1); g.stroke(); }
      }
      if (topH < 1) {
        // front face: darker toward the floor, lit lip at the top edge
        g.fillStyle = lin(g, 0, y + topH, 0, y + 1, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.3)'); g.fillRect(x, y + topH, 1, 1 - topH);
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x, y + topH - 0.03, 1, 0.03);
      }
      if (!isW(x, y - 1)) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y, 1, 0.05); }
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
    // soft drop shadows toward the bottom-right, drawn on their own layer and blurred
    const sc = document.createElement('canvas'); sc.width = c.width; sc.height = c.height;
    const sg = sc.getContext('2d'); sg.scale(px, px); sg.fillStyle = '#000';
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (L.grid[y][x] === 1 || L.grid[y][x] === 3) sg.fillRect(x + 0.2, y + 0.28, 1, 1);
    }
    for (const r of rects) {
      if (r.type === 'planter') continue;
      rrect(sg, r.x + 0.14, r.y + 0.2, r.w - 0.04, r.h - 0.04, 0.1); sg.fill();
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.34;
    g.filter = `blur(${Math.max(1, px * 0.12)}px)`; g.drawImage(sc, 0, 0); g.restore();
    // tight contact shadow right at the base of the walls
    g.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if ((L.grid[y][x] === 1 || L.grid[y][x] === 3) && y + 1 < L.H && L.grid[y + 1][x] === 0) g.fillRect(x, y + 1, 1, 0.07);
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

  return { drawIce, drawGem, drawLootCrate, renderMap, makeSplat, drawSplat, drawScorch, rrect, circle, ellipse, shade, greyLook, mulberry32, OUT };
})();
