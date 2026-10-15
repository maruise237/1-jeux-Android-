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
  function line(g, a, b) { g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
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

  // ---------- Characters ----------
  function drawHead(g, c) {
    const hx = 0.02;
    switch (c.hair) {
      case 'bald':
        circle(g, hx, 0, 0.19); fillStroke(g, c.skin);
        break;
      case 'mohawk':
        circle(g, hx, 0, 0.19); fillStroke(g, c.skin);
        ellipse(g, hx - 0.01, 0, 0.2, 0.065); fillStroke(g, c.hairColor, 0.035);
        break;
      case 'helmet':
        circle(g, hx, 0, 0.215); fillStroke(g, c.hairColor);
        g.lineWidth = 0.03; g.strokeStyle = shade(c.hairColor, -0.35);
        circle(g, hx - 0.02, 0, 0.13); g.stroke();
        ellipse(g, hx + 0.16, 0, 0.05, 0.13); g.fillStyle = '#20232e'; g.fill();
        break;
      case 'hood':
        circle(g, hx - 0.02, 0, 0.235); fillStroke(g, shade(c.hairColor, -0.1));
        ellipse(g, hx + 0.08, 0, 0.13, 0.155); fillStroke(g, c.mask || '#f2f2f2', 0.035);
        g.fillStyle = OUT;
        ellipse(g, hx + 0.13, -0.06, 0.025, 0.04); g.fill();
        ellipse(g, hx + 0.13, 0.06, 0.025, 0.04); g.fill();
        break;
      case 'cap':
        ellipse(g, hx + 0.17, 0, 0.09, 0.16); fillStroke(g, shade(c.cap || c.hairColor, -0.15), 0.035);
        circle(g, hx, 0, 0.19); fillStroke(g, c.cap || c.hairColor);
        break;
      case 'pigtails':
        circle(g, hx - 0.06, -0.23, 0.095); fillStroke(g, c.hairColor, 0.035);
        circle(g, hx - 0.06, 0.23, 0.095); fillStroke(g, c.hairColor, 0.035);
        circle(g, hx, 0, 0.19); fillStroke(g, c.hairColor);
        break;
      case 'long':
        ellipse(g, hx - 0.13, 0, 0.2, 0.21); fillStroke(g, shade(c.hairColor, -0.1));
        circle(g, hx, 0, 0.19); fillStroke(g, c.hairColor);
        break;
      default:
        circle(g, hx, 0, 0.19); fillStroke(g, c.hairColor);
    }
    if (!['bald', 'mohawk', 'helmet', 'hood', 'cap'].includes(c.hair)) {
      ellipse(g, hx + 0.13, 0, 0.06, 0.11); g.fillStyle = c.skin; g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.28)';
    ellipse(g, hx - 0.05, -0.07, 0.07, 0.04); g.fill();
  }

  function drawGun(g, w, c) {
    const len = w === 'shotgun' ? 0.7 : 0.82;
    const col = c.gun || (w === 'shotgun' ? '#5b4636' : '#e0922f');
    rrect(g, 0.05, 0.03, len, 0.1, 0.03); fillStroke(g, col, 0.04);
    rrect(g, 0.05 + len * 0.55, 0.0, len * 0.45, 0.06, 0.02); fillStroke(g, '#3a3d48', 0.03);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0.1, 0.045, len * 0.4, 0.02);
  }

  function drawCharacter(g, L, x, y, ang, o = {}) {
    const c = o.dead ? greyLook(L) : L;
    const s = o.scale || 1;
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    if (!o.noShadow) { g.fillStyle = 'rgba(0,0,0,0.22)'; ellipse(g, 0.05, 0.1, 0.42, 0.38); g.fill(); }
    g.rotate(ang);
    if (o.dead) g.scale(0.92, 1.08);
    g.lineJoin = 'round'; g.lineCap = 'round';

    const w = o.weapon || 'knife';
    const sw = Math.sin(o.walk || 0) * (w === 'knife' ? 0.09 : 0.03);
    let lh, rh;
    if (w === 'knife') { lh = { x: 0.2 - sw, y: -0.32 }; rh = { x: 0.3 + sw, y: 0.3 }; }
    else if (w === 'pistol') { lh = { x: 0.38, y: 0.02 }; rh = { x: 0.42, y: 0.14 }; }
    else { lh = { x: 0.52, y: 0.06 }; rh = { x: 0.2, y: 0.12 }; }
    if (o.attack) { rh = { x: 0.56, y: 0.05 }; lh = { x: 0.05, y: -0.36 }; }

    if (w === 'rifle' || w === 'shotgun') drawGun(g, w, c);

    const arms = [[{ x: -0.02, y: -0.3 }, lh], [{ x: -0.02, y: 0.3 }, rh]];
    for (const [sh, h] of arms) {
      g.strokeStyle = OUT; g.lineWidth = 0.21; line(g, sh, h);
      g.strokeStyle = shade(c.outfit, -0.08); g.lineWidth = 0.13; line(g, sh, h);
      if (c.stripe) { g.strokeStyle = c.stripe; g.lineWidth = 0.035; line(g, sh, { x: (sh.x + h.x) / 2, y: (sh.y + h.y) / 2 }); }
    }

    ellipse(g, -0.03, 0, 0.25, 0.41); fillStroke(g, c.outfit);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    ellipse(g, 0.04, -0.12, 0.12, 0.2); g.fill();
    if (c.stripe) {
      g.strokeStyle = c.stripe; g.lineWidth = 0.05;
      g.beginPath(); g.moveTo(-0.2, -0.28); g.lineTo(-0.2, 0.28); g.stroke();
    }

    if (w === 'pistol') {
      rrect(g, rh.x, rh.y - 0.05, 0.3, 0.08, 0.02); fillStroke(g, c.gun || '#cfd3dc', 0.035);
    }
    if (w === 'knife') {
      rrect(g, rh.x + 0.02, rh.y - 0.035, 0.12, 0.07, 0.02); fillStroke(g, '#4a2f1d', 0.03);
      g.beginPath();
      g.moveTo(rh.x + 0.13, rh.y - 0.05);
      g.lineTo(rh.x + 0.46, rh.y - 0.02);
      g.lineTo(rh.x + 0.13, rh.y + 0.05);
      g.closePath(); fillStroke(g, '#e8eef6', 0.03);
    }
    for (const h of [lh, rh]) { circle(g, h.x, h.y, 0.095); fillStroke(g, c.glove, 0.04); }

    drawHead(g, c);
    g.restore();
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
  const THEMES = {
    concrete: { base: '#c9ccd4', line: 'rgba(60,60,90,0.10)', stain: 'rgba(40,40,60,0.06)' },
    brick: { base: '#dcb487', line: 'rgba(110,60,25,0.22)', stain: 'rgba(90,50,20,0.07)' },
    hex: { base: '#c2c6ce', line: 'rgba(60,60,90,0.13)', stain: 'rgba(40,40,60,0.06)' },
  };

  function drawFloor(g, L, rnd) {
    const th = THEMES[L.theme] || THEMES.concrete;
    g.fillStyle = th.base; g.fillRect(0, 0, L.W, L.H);
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      const r = rnd();
      if (r < 0.15) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x, y, 1, 1); }
      else if (r < 0.28) { g.fillStyle = 'rgba(0,0,0,0.035)'; g.fillRect(x, y, 1, 1); }
    }
    g.strokeStyle = th.line; g.lineWidth = 0.025;
    g.beginPath();
    if (L.theme === 'brick') {
      for (let y = 0; y <= L.H; y += 0.25) { g.moveTo(0, y); g.lineTo(L.W, y); }
      for (let row = 0; row < L.H * 4; row++) {
        const off = row % 2 ? 0.25 : 0;
        for (let x = off; x <= L.W; x += 0.5) { g.moveTo(x, row * 0.25); g.lineTo(x, row * 0.25 + 0.25); }
      }
    } else if (L.theme === 'hex') {
      const r = 0.2, hw = r * Math.sqrt(3);
      for (let row = 0, y = 0; y < L.H + r; row++, y += r * 1.5) {
        for (let x = row % 2 ? hw / 2 : 0; x < L.W + hw; x += hw) {
          for (let i = 0; i < 6; i++) {
            const a = Math.PI / 3 * i + Math.PI / 6;
            const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
            if (i) g.lineTo(px, py); else g.moveTo(px, py);
          }
          g.closePath();
        }
      }
    } else {
      for (let y = 0; y <= L.H; y += 0.5) { g.moveTo(0, y); g.lineTo(L.W, y); }
      for (let x = 0; x <= L.W; x += 0.5) { g.moveTo(x, 0); g.lineTo(x, L.H); }
    }
    g.stroke();
    g.fillStyle = th.stain;
    for (let i = 0; i < 10; i++) { ellipse(g, rnd() * L.W, rnd() * L.H, 0.4 + rnd() * 0.9, 0.3 + rnd() * 0.6); g.fill(); }
    // hazard stripes on the spawn row
    const sy = L.H - 1.2;
    g.save(); g.beginPath(); g.rect(1, sy, L.W - 2, 0.2); g.clip();
    g.fillStyle = '#f5c542'; g.fillRect(1, sy, L.W - 2, 0.2);
    g.fillStyle = '#2a2a33';
    for (let x = 0; x < L.W; x += 0.4) { g.beginPath(); g.moveTo(x, sy + 0.2); g.lineTo(x + 0.2, sy); g.lineTo(x + 0.4, sy); g.lineTo(x + 0.2, sy + 0.2); g.fill(); }
    g.restore();
  }

  function drawWalls(g, L) {
    const isW = (x, y) => x < 0 || y < 0 || x >= L.W || y >= L.H || L.grid[y][x] === 1;
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (L.grid[y][x] !== 1) continue;
      g.fillStyle = '#4e517c'; g.fillRect(x, y, 1, 1);
      const topH = isW(x, y + 1) ? 1 : 0.74;
      g.fillStyle = '#6f73a8'; g.fillRect(x, y, 1, topH);
      g.fillStyle = 'rgba(255,255,255,0.06)';
      g.fillRect(x + 0.08, y + 0.08, 0.84, Math.max(0, topH - 0.16));
    }
    g.strokeStyle = OUT; g.lineWidth = 0.05; g.lineCap = 'round';
    g.beginPath();
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (L.grid[y][x] !== 1) continue;
      if (!isW(x, y - 1)) { g.moveTo(x, y); g.lineTo(x + 1, y); }
      if (!isW(x, y + 1)) { g.moveTo(x, y + 1); g.lineTo(x + 1, y + 1); g.moveTo(x, y + 0.74); g.lineTo(x + 1, y + 0.74); }
      if (!isW(x - 1, y)) { g.moveTo(x, y); g.lineTo(x, y + 1); }
      if (!isW(x + 1, y)) { g.moveTo(x + 1, y); g.lineTo(x + 1, y + 1); }
    }
    g.stroke();
  }

  function drawObstacle(g, r) {
    const { x, y, w, h, type } = r, i = 0.05;
    const X = x + i, Y = y + i, Wd = w - i * 2, Hd = h - i * 2;
    g.lineJoin = 'round';
    if (type === 'crate') {
      rrect(g, X, Y, Wd, Hd, 0.08); fillStroke(g, '#e58a43');
      const p = 0.13;
      rrect(g, X + p, Y + p, Wd - p * 2, Hd - p * 2, 0.04); g.fillStyle = '#cf6f2c'; g.fill();
      g.strokeStyle = '#b15a1f'; g.lineWidth = 0.03; g.beginPath();
      for (let yy = Y + p + 0.2; yy < Y + Hd - p - 0.05; yy += 0.2) { g.moveTo(X + p, yy); g.lineTo(X + Wd - p, yy); }
      g.stroke();
      g.strokeStyle = '#f2ab6a'; g.lineWidth = 0.09;
      g.beginPath(); g.moveTo(X + p + 0.04, Y + Hd - p - 0.04); g.lineTo(X + Wd - p - 0.04, Y + p + 0.04); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.04;
      g.beginPath(); g.moveTo(X + 0.1, Y + 0.05); g.lineTo(X + Wd - 0.1, Y + 0.05); g.stroke();
    } else if (type === 'metal') {
      rrect(g, X, Y, Wd, Hd, 0.1); fillStroke(g, '#8487bd');
      rrect(g, X + 0.17, Y + 0.17, Wd - 0.34, Hd - 0.34, 0.05); g.fillStyle = '#585b91'; g.fill();
      g.lineWidth = 0.03; g.strokeStyle = 'rgba(0,0,0,0.3)'; g.stroke();
      g.fillStyle = '#c3c5e6';
      for (const [cx, cy] of [[X + 0.09, Y + 0.09], [X + Wd - 0.09, Y + 0.09], [X + 0.09, Y + Hd - 0.09], [X + Wd - 0.09, Y + Hd - 0.09]]) { circle(g, cx, cy, 0.03); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(X + 0.2, Y + 0.24); g.lineTo(X + Wd - 0.24, Y + 0.24); g.stroke();
    } else {
      rrect(g, X, Y, Wd, Hd, 0.08); fillStroke(g, '#30b088');
      rrect(g, X + 0.09, Y + 0.09, Wd - 0.18, Hd - 0.18, 0.04); g.fillStyle = '#26946f'; g.fill();
      g.strokeStyle = '#1d7a5b'; g.lineWidth = 0.04; g.beginPath();
      if (w >= h) for (let xx = X + 0.2; xx < X + Wd - 0.1; xx += 0.16) { g.moveTo(xx, Y + 0.12); g.lineTo(xx, Y + Hd - 0.12); }
      else for (let yy = Y + 0.2; yy < Y + Hd - 0.1; yy += 0.16) { g.moveTo(X + 0.12, yy); g.lineTo(X + Wd - 0.12, yy); }
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 0.04;
      g.beginPath(); g.moveTo(X + 0.1, Y + 0.05); g.lineTo(X + Wd - 0.1, Y + 0.05); g.stroke();
    }
  }

  function renderMap(L, px) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(L.W * px); c.height = Math.ceil(L.H * px);
    const g = c.getContext('2d');
    g.scale(px, px);
    drawFloor(g, L, mulberry32(L.seed));
    g.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
      if (L.grid[y][x] === 1) g.fillRect(x + 0.1, y + 0.16, 1, 1);
    }
    for (const r of L.rects) { rrect(g, r.x + 0.13, r.y + 0.18, r.w - 0.06, r.h - 0.06, 0.1); g.fill(); }
    drawWalls(g, L);
    for (const r of L.rects) drawObstacle(g, r);
    return c;
  }

  // Character portrait for menus (facing up).
  function drawPortrait(canvas, look, opts = {}) {
    const g = canvas.getContext('2d');
    const s = canvas.width;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, s, s);
    g.setTransform(s / 1.35, 0, 0, s / 1.35, s / 2 - s * 0.04, s / 2 + s * 0.1);
    drawCharacter(g, look, 0, 0, -Math.PI / 2 - 0.35, { weapon: 'knife', walk: opts.walk || 0.6, noShadow: true, dead: opts.locked });
  }

  return { drawCharacter, drawIce, drawGem, renderMap, drawPortrait, rrect, circle, ellipse, shade, mulberry32, OUT };
})();
