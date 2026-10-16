'use strict';
// Detailed procedural top-down cartoon characters, rendered once into cached sprites.
// Local space: 1 = one tile, character faces +x, light comes from the front-left.
window.KT = window.KT || {};
(() => {
  const art = KT.art;
  const { rrect, circle, ellipse, shade, OUT } = art;
  const TAU = Math.PI * 2;
  const SPR = 2.6; // sprite box size in tiles (room for the attack lunge)

  const lin = (g, x0, y0, x1, y1, stops) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    return gr;
  };
  const ball = (g, x, y, r, col) => {
    const gr = g.createRadialGradient(x + r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    gr.addColorStop(0, shade(col, 0.28));
    gr.addColorStop(0.55, col);
    gr.addColorStop(1, shade(col, -0.28));
    return gr;
  };
  function fs(g, fill, lw = 0.04) { g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); }
  function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }

  // ---------- Body parts ----------
  function drawFeet(g, c, walk, dead) {
    const st = dead ? 0 : Math.sin(walk) * 0.13;
    const shoe = c.shoe || '#2a2730';
    for (const [side, dx] of [[-1, st], [1, -st]]) {
      ellipse(g, -0.02 + dx, side * 0.15, 0.13, 0.075);
      fs(g, lin(g, -0.15, 0, 0.15, 0, [[0, shade(shoe, -0.2)], [1, shade(shoe, 0.25)]]), 0.035);
    }
  }

  function torsoPath(g) {
    g.beginPath();
    g.moveTo(-0.17, -0.37);
    g.bezierCurveTo(-0.31, -0.24, -0.31, 0.24, -0.17, 0.37);
    g.bezierCurveTo(-0.06, 0.45, 0.13, 0.43, 0.19, 0.31);
    g.bezierCurveTo(0.25, 0.16, 0.25, -0.16, 0.19, -0.31);
    g.bezierCurveTo(0.13, -0.43, -0.06, -0.45, -0.17, -0.37);
    g.closePath();
  }

  function drawCape(g, c, walk) {
    const sway = Math.sin(walk) * 0.06;
    g.beginPath();
    g.moveTo(-0.05, -0.36);
    g.quadraticCurveTo(-0.45, -0.45 + sway, -0.62, -0.28 + sway);
    g.quadraticCurveTo(-0.56, 0, -0.64, 0.28 - sway);
    g.quadraticCurveTo(-0.45, 0.45 - sway, -0.05, 0.36);
    g.closePath();
    fs(g, lin(g, -0.6, 0, 0, 0, [[0, shade(c.accent, -0.35)], [1, c.accent]]));
    g.strokeStyle = shade(c.accent, -0.4); g.lineWidth = 0.025;
    g.beginPath();
    g.moveTo(-0.15, -0.15); g.quadraticCurveTo(-0.4, -0.2, -0.55, -0.12 + sway);
    g.moveTo(-0.15, 0.15); g.quadraticCurveTo(-0.4, 0.2, -0.55, 0.12 - sway);
    g.stroke();
  }

  function drawTorso(g, c) {
    torsoPath(g);
    fs(g, lin(g, -0.3, -0.1, 0.24, 0.1, [[0, shade(c.outfit, -0.3)], [0.6, c.outfit], [1, shade(c.outfit, 0.15)]]), 0.045);
    g.save();
    torsoPath(g); g.clip();
    switch (c.detail) {
      case 'stripes':
        g.strokeStyle = c.stripe; g.lineWidth = 0.045;
        g.beginPath();
        g.moveTo(-0.3, -0.27); g.lineTo(0.25, -0.27);
        g.moveTo(-0.3, 0.27); g.lineTo(0.25, 0.27);
        g.stroke();
        g.strokeStyle = shade(c.outfit, -0.3); g.lineWidth = 0.02;
        g.beginPath(); g.moveTo(0.12, 0); g.lineTo(0.25, 0); g.stroke();
        break;
      case 'vest':
        rrect(g, -0.25, -0.26, 0.42, 0.52, 0.07);
        fs(g, lin(g, -0.25, 0, 0.17, 0, [[0, shade(c.outfit2, -0.25)], [1, shade(c.outfit2, 0.1)]]), 0.03);
        g.fillStyle = shade(c.outfit2, -0.2);
        for (const y of [-0.17, 0.07]) { rrect(g, 0.03, y, 0.11, 0.1, 0.02); g.fill(); }
        g.strokeStyle = shade(c.outfit2, 0.25); g.lineWidth = 0.02;
        g.beginPath(); g.moveTo(-0.2, -0.2); g.lineTo(-0.2, 0.2); g.stroke();
        break;
      case 'suit':
        poly(g, [[0.26, 0], [0.08, -0.13], [0.08, 0.13]]); g.fillStyle = '#f4f4f4'; g.fill();
        poly(g, [[0.25, 0], [0.13, -0.035], [0.13, 0.035]]); g.fillStyle = c.tie || '#c62f3d'; g.fill();
        g.strokeStyle = shade(c.outfit, -0.4); g.lineWidth = 0.025;
        g.beginPath(); g.moveTo(0.26, 0); g.lineTo(0.06, -0.17); g.moveTo(0.26, 0); g.lineTo(0.06, 0.17); g.stroke();
        break;
      case 'prison':
        g.fillStyle = c.stripe;
        for (let x = -0.29; x < 0.26; x += 0.11) g.fillRect(x, -0.5, 0.05, 1);
        break;
      case 'armor':
        rrect(g, -0.22, -0.22, 0.36, 0.44, 0.08);
        fs(g, lin(g, -0.22, 0, 0.14, 0, [[0, shade(c.accent, -0.3)], [1, shade(c.accent, 0.2)]]), 0.03);
        g.strokeStyle = shade(c.accent, -0.35); g.lineWidth = 0.02;
        g.beginPath(); g.moveTo(-0.22, 0); g.lineTo(0.14, 0); g.moveTo(-0.04, -0.22); g.lineTo(-0.04, 0.22); g.stroke();
        break;
      case 'jacket':
        g.fillStyle = '#f2f2f2'; g.fillRect(0.1, -0.09, 0.2, 0.18);
        g.strokeStyle = shade(c.outfit, -0.4); g.lineWidth = 0.025;
        g.beginPath(); g.moveTo(0.1, -0.09); g.lineTo(0.3, -0.09); g.moveTo(0.1, 0.09); g.lineTo(0.3, 0.09); g.stroke();
        break;
      case 'coat':
        g.fillStyle = shade(c.outfit, -0.3);
        poly(g, [[0.25, 0], [0.04, -0.2], [0.1, -0.05]]); g.fill();
        poly(g, [[0.25, 0], [0.04, 0.2], [0.1, 0.05]]); g.fill();
        g.strokeStyle = shade(c.outfit, -0.45); g.lineWidth = 0.05;
        g.beginPath(); g.moveTo(-0.2, -0.42); g.lineTo(-0.2, 0.42); g.stroke();
        g.fillStyle = '#c9a24a'; g.fillRect(-0.225, -0.04, 0.05, 0.08);
        break;
      case 'camo':
        for (const [x, y, r, k] of [[-0.15, -0.2, 0.09, 0], [0.05, 0.15, 0.1, 1], [-0.05, -0.02, 0.07, 2], [0.12, -0.22, 0.06, 1], [-0.2, 0.22, 0.08, 2]]) {
          ellipse(g, x, y, r * 1.3, r); g.fillStyle = [shade(c.outfit, -0.3), shade(c.outfit, 0.18), '#4a3f2a'][k]; g.fill();
        }
        break;
      case 'cape':
        g.fillStyle = c.accent;
        rrect(g, -0.04, -0.06, 0.32, 0.12, 0.03); g.fill();
        circle(g, 0.17, 0, 0.05); g.fillStyle = shade(c.accent, 0.4); g.fill();
        break;
    }
    // back shadow + shoulder sheen
    g.fillStyle = 'rgba(0,0,0,0.18)';
    ellipse(g, -0.3, 0, 0.12, 0.45); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.16)';
    ellipse(g, 0.08, -0.22, 0.1, 0.12); g.fill();
    g.restore();
    // neck shadow
    g.fillStyle = 'rgba(0,0,0,0.22)';
    ellipse(g, 0.0, 0, 0.24, 0.25); g.fill();
  }

  function drawArm(g, c, sh, hand, side) {
    const el = { x: (sh.x + hand.x) / 2 - 0.03, y: (sh.y + hand.y) / 2 + side * 0.07 };
    const sleeve = c.sleeveColor || c.outfit;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = OUT; g.lineWidth = 0.21;
    g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(el.x, el.y); g.lineTo(hand.x, hand.y); g.stroke();
    g.strokeStyle = shade(sleeve, -0.08); g.lineWidth = 0.13;
    g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(el.x, el.y); g.stroke();
    g.strokeStyle = c.sleeve === 'short' ? c.skin : shade(sleeve, -0.02); g.lineWidth = 0.115;
    g.beginPath(); g.moveTo(el.x, el.y); g.lineTo(hand.x, hand.y); g.stroke();
    if (c.sleeve === 'short' || c.sleeve === 'none') {
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(el.x + (hand.x - el.x) * 0.15, el.y + (hand.y - el.y) * 0.15 - side * 0.02); g.lineTo(el.x + (hand.x - el.x) * 0.6, el.y + (hand.y - el.y) * 0.6 - side * 0.02); g.stroke();
    }
    if (c.sleeve === 'none') {
      g.strokeStyle = c.skin; g.lineWidth = 0.13;
      g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(el.x, el.y); g.stroke();
    }
    if (c.sleeve === 'short') {
      g.strokeStyle = shade(sleeve, -0.25); g.lineWidth = 0.14;
      g.beginPath(); g.moveTo(el.x - (el.x - sh.x) * 0.12, el.y - (el.y - sh.y) * 0.12); g.lineTo(el.x, el.y); g.stroke();
    }
    if (c.detail === 'stripes') {
      g.strokeStyle = c.stripe; g.lineWidth = 0.03;
      g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(el.x, el.y); g.lineTo(hand.x - (hand.x - el.x) * 0.25, hand.y - (hand.y - el.y) * 0.25); g.stroke();
    }
    // deltoid / shoulder pad
    if (c.detail === 'armor') {
      ellipse(g, sh.x - 0.01, sh.y, 0.14, 0.12);
      fs(g, ball(g, sh.x - 0.01, sh.y, 0.14, c.accent), 0.035);
    } else {
      circle(g, sh.x, sh.y, 0.12);
      fs(g, ball(g, sh.x, sh.y, 0.12, sleeve), 0.04);
      if (c.detail === 'stripes') { g.strokeStyle = c.stripe; g.lineWidth = 0.03; g.beginPath(); g.moveTo(sh.x - 0.1, sh.y); g.lineTo(sh.x + 0.1, sh.y); g.stroke(); }
    }
  }

  function drawHand(g, c, h, dir) {
    const tx = Math.cos(dir) * 0.06, ty = Math.sin(dir) * 0.06;
    circle(g, h.x - ty * 0.9 + tx * 0.3, h.y + tx * 0.9 + ty * 0.3, 0.042);
    fs(g, c.glove, 0.03);
    circle(g, h.x, h.y, 0.095);
    fs(g, ball(g, h.x, h.y, 0.095, c.glove), 0.04);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.015;
    g.beginPath(); g.arc(h.x, h.y, 0.06, dir - 0.9, dir + 0.9); g.stroke();
  }

  // ---------- Weapons ----------
  const BLADES = {
    steel: ['#ffffff', '#dfe6ef', '#7d8ca3'],
    gold: ['#fff7cc', '#ffd34d', '#a86d0a'],
    ice: ['#ffffff', '#b8efff', '#3fa6d8'],
    crimson: ['#ffd9dd', '#ef3b52', '#6e0f1e'],
    venom: ['#eafff3', '#53dc9a', '#16603f'],
    shadow: ['#e6d9ff', '#7a4fd6', '#241047'],
    plasma: ['#f0ffff', '#4ff3ff', '#0b6f9e'],
  };
  // Combat knife held in the fist: pommel behind, guard in front, clip-point blade forward.
  // Futuristic kunai: diamond blade with a glowing core, ring pommel.
  function drawKunai(g, c, h) {
    g.save(); g.translate(h.x, h.y);
    circle(g, -0.17, 0, 0.055); g.lineWidth = 0.03; g.strokeStyle = OUT; g.stroke();
    g.strokeStyle = '#9aa6b8'; g.lineWidth = 0.018; g.stroke();
    rrect(g, -0.13, -0.035, 0.22, 0.07, 0.02); fs(g, '#2a2c34', 0.025);
    g.strokeStyle = '#c0392b'; g.lineWidth = 0.015; g.beginPath();
    for (let x = -0.1; x < 0.08; x += 0.03) { g.moveTo(x, -0.035); g.lineTo(x + 0.015, 0.035); } g.stroke();
    g.beginPath(); g.moveTo(0.08, 0); g.lineTo(0.24, -0.11); g.lineTo(0.62, 0); g.lineTo(0.24, 0.11); g.closePath();
    fs(g, lin(g, 0.1, -0.11, 0.1, 0.11, [[0, '#f2f7ff'], [0.5, '#a9c4e8'], [1, '#4f6f9e']]), 0.028);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.013;
    g.beginPath(); g.moveTo(0.14, 0); g.lineTo(0.58, 0); g.stroke();
    const glow = c.core || '#ff4fa3';
    const gr = g.createRadialGradient(0.24, 0, 0, 0.24, 0, 0.09);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, glow); gr.addColorStop(1, 'rgba(255,79,163,0)');
    g.fillStyle = gr; circle(g, 0.24, 0, 0.09); g.fill();
    circle(g, 0.24, 0, 0.035); fs(g, glow, 0.015);
    g.restore();
  }

  function drawKnife(g, c, h) {
    if (c.blade === 'kunai') return drawKunai(g, c, h);
    const [hi, mid, lo] = BLADES[c.blade || 'steel'];
    g.save(); g.translate(h.x, h.y);
    rrect(g, -0.15, -0.042, 0.26, 0.084, 0.03);
    fs(g, lin(g, 0, -0.042, 0, 0.042, [[0, '#5a4638'], [1, '#1c1512']]), 0.025);
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.014;
    g.beginPath(); for (let x = -0.12; x < 0.09; x += 0.035) { g.moveTo(x, -0.042); g.lineTo(x + 0.02, 0.042); } g.stroke();
    circle(g, -0.16, 0, 0.048); fs(g, ball(g, -0.16, 0, 0.048, c.blade === 'gold' ? '#ffd34d' : '#a3abba'), 0.022);
    rrect(g, 0.095, -0.095, 0.05, 0.19, 0.022);
    fs(g, lin(g, 0, -0.095, 0, 0.095, [[0, c.blade === 'gold' ? '#fff0a0' : '#e4e8ef'], [1, c.blade === 'gold' ? '#a86d0a' : '#5f687a']]), 0.022);
    g.beginPath();
    g.moveTo(0.14, -0.058);
    g.lineTo(0.45, -0.058);
    g.quadraticCurveTo(0.56, -0.052, 0.66, 0.0);
    g.quadraticCurveTo(0.52, 0.08, 0.36, 0.074);
    g.lineTo(0.14, 0.064);
    g.closePath();
    fs(g, lin(g, 0, -0.058, 0, 0.074, [[0, hi], [0.42, mid], [1, lo]]), 0.026);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 0.013;
    g.beginPath(); g.moveTo(0.16, 0.034); g.lineTo(0.37, 0.04); g.quadraticCurveTo(0.53, 0.04, 0.63, 0.004); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.017;
    g.beginPath(); g.moveTo(0.18, -0.026); g.lineTo(0.42, -0.026); g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    const sx = 0.52, sy = -0.03, r = 0.045;
    g.moveTo(sx, sy - r); g.quadraticCurveTo(sx, sy, sx + r, sy); g.quadraticCurveTo(sx, sy, sx, sy + r);
    g.quadraticCurveTo(sx, sy, sx - r, sy); g.quadraticCurveTo(sx, sy, sx, sy - r);
    g.fill();
    g.restore();
  }

  // ---------- Weapons ----------
  // Long guns are held two-handed, diagonally across the chest: stock at the right shoulder,
  // muzzle forward-left. Geometry is shared with the game (muzzle position for shots/lasers).
  const GUNS = {
    rifle:   { len: 1.02, ax: -0.12, ay: 0.27, grip: 0.38, fore: 0.7 },
    smg:     { len: 0.78, ax: -0.02, ay: 0.24, grip: 0.3, fore: 0.55 },
    shotgun: { len: 0.98, ax: -0.12, ay: 0.27, grip: 0.36, fore: 0.66 },
    energy:  { len: 1.04, ax: -0.12, ay: 0.27, grip: 0.38, fore: 0.72 },
    cannon:  { len: 0.95, ax: -0.1, ay: 0.26, grip: 0.36, fore: 0.66 },
  };
  const GUN_ANGLE = -0.3;
  function gunPoint(kind, t, off = 0) {
    const G = GUNS[kind], c = Math.cos(GUN_ANGLE), s = Math.sin(GUN_ANGLE);
    return { x: G.ax + c * t - s * off, y: G.ay + s * t + c * off };
  }
  function muzzle(kind) {
    if (kind === 'pistol') return { x: 0.78, y: 0.06 };
    if (!GUNS[kind]) return { x: 0.6, y: 0.1 };
    return gunPoint(kind, GUNS[kind].len + 0.04);
  }

  function metal(g, col) { return (y0, y1) => lin(g, 0, y0, 0, y1, [[0, shade(col, 0.35)], [0.5, col], [1, shade(col, -0.35)]]); }

  function drawGunBody(g, c, kind) {
    const G = GUNS[kind], L = G.len, tier = c.wtier || 0;
    const steel = c.gun || '#3b3e47';
    const furn = tier >= 3 ? '#e6b53a' : (c.furniture || (kind === 'shotgun' ? '#8a5a2b' : '#24262c'));
    const m = metal(g, steel), f = metal(g, furn);
    g.save(); g.translate(G.ax, G.ay); g.rotate(GUN_ANGLE);
    g.lineJoin = 'round';
    if (kind === 'cannon') {
      // heavy T-shaped energy cannon with glowing coils
      rrect(g, 0, -0.07, 0.3, 0.14, 0.04); fs(g, f(-0.07, 0.07), 0.03);
      rrect(g, 0.26, -0.06, 0.58, 0.12, 0.03); fs(g, m(-0.06, 0.06), 0.03);
      for (let x = 0.32; x < 0.8; x += 0.07) { rrect(g, x, -0.065, 0.04, 0.13, 0.01); fs(g, '#ff3b4f', 0.015); }
      rrect(g, 0.82, -0.28, 0.1, 0.56, 0.04); fs(g, m(-0.28, 0.28), 0.035);
      g.fillStyle = 'rgba(255,90,110,0.9)'; g.fillRect(0.9, -0.22, 0.03, 0.44);
      g.restore(); return;
    }
    // stock
    g.beginPath();
    if (kind === 'smg') { g.moveTo(0, -0.03); g.lineTo(0.22, -0.03); g.lineTo(0.22, 0.03); g.lineTo(0, 0.03); }
    else { g.moveTo(0, -0.07); g.lineTo(0.28, -0.05); g.lineTo(0.28, 0.05); g.lineTo(0, 0.08); }
    g.closePath(); fs(g, f(-0.07, 0.08), 0.028);
    // receiver
    const rx = kind === 'smg' ? 0.2 : 0.26, rw = kind === 'smg' ? 0.26 : 0.32;
    rrect(g, rx, -0.065, rw, 0.13, 0.025); fs(g, m(-0.065, 0.065), 0.03);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(rx + 0.08, -0.03, 0.1, 0.02);
    // pistol grip + magazine (on the +y side)
    rrect(g, rx + 0.1, 0.05, 0.06, 0.1, 0.02); fs(g, f(0.05, 0.15), 0.025);
    g.beginPath();
    if (kind === 'smg') { g.moveTo(rx + 0.18, 0.06); g.lineTo(rx + 0.24, 0.06); g.lineTo(rx + 0.24, 0.27); g.lineTo(rx + 0.18, 0.27); }
    else if (kind === 'shotgun') { g.moveTo(rx, 0); }
    else { g.moveTo(rx + 0.18, 0.06); g.lineTo(rx + 0.27, 0.06); g.quadraticCurveTo(rx + 0.31, 0.16, rx + 0.34, 0.24); g.lineTo(rx + 0.25, 0.26); g.quadraticCurveTo(rx + 0.22, 0.16, rx + 0.18, 0.06); }
    g.closePath();
    if (kind !== 'shotgun') fs(g, kind === 'energy' ? (c.glow || '#4fd2ff') : (c.mag || shade(steel, -0.2)), 0.025);
    // handguard / pump
    const hx = rx + rw - 0.01, hw = (kind === 'smg' ? 0.2 : 0.3);
    if (kind === 'shotgun') {
      rrect(g, hx, -0.05, 0.5, 0.05, 0.02); fs(g, m(-0.05, 0), 0.025);
      rrect(g, hx, 0.0, 0.48, 0.045, 0.02); fs(g, m(0, 0.045), 0.025);
      rrect(g, hx + 0.08, -0.06, 0.18, 0.13, 0.03); fs(g, f(-0.06, 0.07), 0.028);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.012; g.beginPath();
      for (let x = hx + 0.1; x < hx + 0.25; x += 0.03) { g.moveTo(x, -0.06); g.lineTo(x, 0.07); }
      g.stroke();
    } else {
      rrect(g, hx, -0.055, hw, 0.11, 0.025); fs(g, kind === 'energy' ? m(-0.055, 0.055) : f(-0.055, 0.055), 0.028);
      if (kind === 'energy') {
        for (let x = hx + 0.03; x < hx + hw - 0.03; x += 0.06) { rrect(g, x, -0.04, 0.035, 0.08, 0.01); fs(g, c.glow || '#4fd2ff', 0.012); }
      } else {
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.012; g.beginPath();
        for (let x = hx + 0.03; x < hx + hw - 0.02; x += 0.035) { g.moveTo(x, -0.055); g.lineTo(x, -0.03); }
        g.stroke();
      }
      // barrel + muzzle brake
      rrect(g, hx + hw - 0.01, -0.025, L - (hx + hw) + 0.01, 0.05, 0.015); fs(g, m(-0.025, 0.025), 0.022);
      rrect(g, L - 0.06, -0.035, 0.07, 0.07, 0.015); fs(g, '#1e2026', 0.02);
    }
    // tier attachments: tactical light, then scope + laser
    if (tier >= 1 && kind !== 'smg') {
      rrect(g, hx + 0.06, 0.055, 0.12, 0.05, 0.02); fs(g, '#2a2c33', 0.02);
      g.fillStyle = '#fff6c2'; g.fillRect(hx + 0.17, 0.062, 0.015, 0.036);
    }
    if (tier >= 2 || c.scope) {
      rrect(g, rx + 0.02, -0.12, 0.22, 0.07, 0.03); fs(g, m(-0.12, -0.05), 0.025);
      circle(g, rx + 0.24, -0.085, 0.03); fs(g, '#5ee7ff', 0.015);
    }
    if (tier >= 3) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0.04, -0.04, L * 0.6, 0.015); }
    g.restore();
  }

  function drawPistol(g, c, h) {
    g.save(); g.translate(h.x, h.y); g.rotate(-0.05);
    const col = c.gun || '#3b3e47', tier = c.wtier || 0;
    const m = metal(g, col);
    rrect(g, -0.02, -0.05, 0.36, 0.1, 0.025); fs(g, m(-0.05, 0.05), 0.03);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = 0.02; x < 0.12; x += 0.025) g.fillRect(x, -0.05, 0.012, 0.1);
    rrect(g, 0.32, -0.025, 0.06, 0.05, 0.01); fs(g, '#1e2026', 0.02);
    if (tier >= 1) { rrect(g, 0.14, 0.05, 0.14, 0.05, 0.02); fs(g, '#2a2c33', 0.02); g.fillStyle = '#fff6c2'; g.fillRect(0.27, 0.058, 0.015, 0.034); }
    if (tier >= 2) { circle(g, 0.06, -0.075, 0.03); fs(g, '#ff3b3b', 0.015); }
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0.02, -0.035, 0.28, 0.015);
    g.restore();
  }

  function drawPack(g, c) {
    rrect(g, -0.42, -0.24, 0.22, 0.48, 0.07);
    fs(g, lin(g, -0.42, 0, -0.2, 0, [[0, shade(c.pack, -0.35)], [1, c.pack]]), 0.04);
    rrect(g, -0.4, -0.16, 0.08, 0.32, 0.03); g.fillStyle = shade(c.pack, -0.2); g.fill();
    g.strokeStyle = shade(c.pack, -0.45); g.lineWidth = 0.03;
    g.beginPath(); g.moveTo(-0.22, -0.2); g.lineTo(0.02, -0.26); g.moveTo(-0.22, 0.2); g.lineTo(0.02, 0.26); g.stroke();
  }

  // Riot shield: a wide curved plate in front of the guard, with a viewing window.
  function drawShield(g, c) {
    const col = c.shieldColor || '#6c7ea3';
    g.beginPath();
    g.moveTo(0.4, -0.52);
    g.quadraticCurveTo(0.6, -0.26, 0.6, 0);
    g.quadraticCurveTo(0.6, 0.26, 0.4, 0.52);
    g.lineTo(0.3, 0.48);
    g.quadraticCurveTo(0.48, 0.24, 0.48, 0);
    g.quadraticCurveTo(0.48, -0.24, 0.3, -0.48);
    g.closePath();
    fs(g, lin(g, 0.3, -0.4, 0.6, 0.4, [[0, shade(col, -0.35)], [0.5, col], [1, shade(col, 0.3)]]), 0.045);
    g.beginPath();
    g.moveTo(0.505, -0.2); g.quadraticCurveTo(0.545, 0, 0.505, 0.2);
    g.lineTo(0.47, 0.19); g.quadraticCurveTo(0.505, 0, 0.47, -0.19);
    g.closePath();
    fs(g, lin(g, 0.47, -0.2, 0.55, 0.2, [[0, '#d8f4ff'], [1, '#5fb0e0']]), 0.025);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.02;
    g.beginPath(); g.moveTo(0.43, -0.42); g.quadraticCurveTo(0.56, -0.22, 0.565, -0.05); g.stroke();
    g.fillStyle = '#ffd34d';
    for (const y of [-0.36, 0.36]) { circle(g, 0.47 + Math.abs(y) * -0.08, y, 0.022); g.fill(); }
  }

  // ---------- Head ----------
  function hairGrad(g, c, hx) {
    return lin(g, hx - 0.22, 0, hx + 0.12, -0.05, [[0, shade(c.hairColor, -0.3)], [0.7, c.hairColor], [1, shade(c.hairColor, 0.3)]]);
  }

  function fringe(g, hx, front, bumps = 4) {
    // closed shape covering the back of the head, with a wavy front edge at x = hx + front
    g.beginPath();
    g.moveTo(hx - 0.3, -0.3);
    g.lineTo(hx + front - 0.02, -0.3);
    for (let i = 0; i <= bumps; i++) {
      const y = -0.22 + (0.44 * i) / bumps;
      const x = hx + front + (i % 2 ? 0.045 : -0.01) - Math.abs(y) * 0.25;
      g.lineTo(x, y);
    }
    g.lineTo(hx + front - 0.02, 0.3);
    g.lineTo(hx - 0.3, 0.3);
    g.closePath();
  }

  function drawFace(g, c, hx, o) {
    if (o.dead) {
      g.strokeStyle = OUT; g.lineWidth = 0.022;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(hx + 0.1, s * 0.075 - 0.025); g.lineTo(hx + 0.15, s * 0.075 + 0.025);
        g.moveTo(hx + 0.15, s * 0.075 - 0.025); g.lineTo(hx + 0.1, s * 0.075 + 0.025);
        g.stroke();
      }
    } else if (c.eyes === 'shades') {
      rrect(g, hx + 0.1, -0.135, 0.065, 0.27, 0.03); g.fillStyle = '#15151c'; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(hx + 0.115, -0.11, 0.015, 0.06); g.fillRect(hx + 0.115, 0.04, 0.015, 0.06);
    } else {
      for (const s of [-1, 1]) {
        ellipse(g, hx + 0.13, s * 0.075, 0.03, 0.038); g.fillStyle = '#ffffff'; g.fill();
        ellipse(g, hx + 0.142, s * 0.072, 0.019, 0.025); g.fillStyle = '#1c1a2b'; g.fill();
      }
      g.strokeStyle = shade(c.brow || c.hairColor || '#2a2a2a', -0.2); g.lineWidth = 0.028; g.lineCap = 'round';
      const angry = c.eyes === 'angry';
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(hx + (angry ? 0.115 : 0.095), s * 0.035);
        g.lineTo(hx + 0.09, s * 0.12);
        g.stroke();
      }
    }
    circle(g, hx + 0.19, 0, 0.038); fs(g, ball(g, hx + 0.19, 0, 0.038, c.skin), 0.02);
  }

  function drawHead(g, c, o) {
    const hx = 0.03, R = 0.2;
    const covered = ['helmet', 'hood', 'balaclava'].includes(c.hair);

    // things behind the head
    if (c.hair === 'long') { ellipse(g, hx - 0.17, 0, 0.2, 0.22); fs(g, hairGrad(g, c, hx - 0.1)); }
    if (c.hair === 'pigtails') {
      for (const s of [-1, 1]) {
        ellipse(g, hx - 0.1, s * 0.27, 0.1, 0.085); fs(g, hairGrad(g, c, hx - 0.05), 0.035);
        circle(g, hx - 0.04, s * 0.2, 0.035); fs(g, c.accent || '#ff4f8b', 0.025);
      }
    }
    if (c.hair === 'afro') {
      g.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * TAU, r = 0.27 + (i % 2) * 0.025;
        g.lineTo(hx - 0.04 + Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath(); fs(g, hairGrad(g, c, hx));
    }
    if (c.hair === 'spiky') {
      g.beginPath();
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * 0.45 + (i / 12) * Math.PI * 1.1, r = i % 2 ? 0.2 : 0.29;
        g.lineTo(hx - 0.02 + Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath(); fs(g, hairGrad(g, c, hx));
    }
    if (c.hair === 'hood') {
      ellipse(g, hx - 0.06, 0, 0.27, 0.26);
      fs(g, lin(g, hx - 0.3, 0, hx + 0.2, 0, [[0, shade(c.hairColor, -0.35)], [1, shade(c.hairColor, 0.1)]]));
    }

    // ears
    if (!covered && c.hair !== 'afro') {
      for (const s of [-1, 1]) { ellipse(g, hx + 0.02, s * 0.2, 0.045, 0.055); fs(g, shade(c.skin, -0.05), 0.03); }
    }

    // head ball
    circle(g, hx, 0, R);
    fs(g, ball(g, hx + 0.03, 0, R, c.skin), 0.045);

    g.save();
    circle(g, hx, 0, R); g.clip();
    switch (c.hair) {
      case 'short': case 'spiky': case 'long': case 'pigtails': case 'bun': case 'afro':
        fringe(g, hx, c.hair === 'afro' ? 0.05 : 0.06, 5);
        fs(g, hairGrad(g, c, hx), 0.03);
        break;
      case 'slick':
        fringe(g, hx, 0.04, 1);
        fs(g, hairGrad(g, c, hx), 0.03);
        g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.014;
        g.beginPath(); g.arc(hx - 0.1, 0, 0.12, -0.9, 0.9); g.stroke();
        g.strokeStyle = shade(c.hairColor, -0.5); g.lineWidth = 0.014;
        g.beginPath(); g.moveTo(hx + 0.03, -0.06); g.lineTo(hx - 0.17, -0.09); g.stroke();
        break;
      case 'mohawk':
        g.fillStyle = 'rgba(0,0,0,0.12)'; circle(g, hx - 0.05, 0, R); g.fill();
        break;
      case 'beanie':
        fringe(g, hx, 0.05, 0);
        fs(g, lin(g, hx - 0.2, 0, hx + 0.1, 0, [[0, shade(c.hat, -0.3)], [1, shade(c.hat, 0.15)]]), 0.03);
        g.fillStyle = shade(c.hat, 0.18); g.fillRect(hx - 0.02, -0.25, 0.07, 0.5);
        g.strokeStyle = shade(c.hat, -0.4); g.lineWidth = 0.015;
        g.beginPath(); g.moveTo(hx - 0.02, -0.25); g.lineTo(hx - 0.02, 0.25); g.stroke();
        break;
      case 'balaclava':
        g.fillStyle = lin(g, hx - 0.2, 0, hx + 0.2, 0, [[0, shade(c.hairColor, -0.3)], [1, shade(c.hairColor, 0.15)]]);
        g.fillRect(hx - 0.25, -0.25, 0.5, 0.5);
        rrect(g, hx + 0.08, -0.135, 0.11, 0.27, 0.04); fs(g, c.skin, 0.025);
        break;
    }
    g.restore();

    if (c.hair === 'beanie') { circle(g, hx - 0.09, 0, 0.055); fs(g, ball(g, hx - 0.09, 0, 0.055, shade(c.hat, 0.25)), 0.03); }
    if (c.hair === 'bun') {
      circle(g, hx - 0.19, 0, 0.085); fs(g, ball(g, hx - 0.19, 0, 0.085, c.hairColor), 0.035);
      g.strokeStyle = c.accent || '#ff4f8b'; g.lineWidth = 0.03; g.beginPath(); g.arc(hx - 0.19, 0, 0.09, 0.9, -0.9); g.stroke();
    }
    if (c.hair === 'mohawk') {
      g.beginPath();
      g.moveTo(hx + 0.13, 0);
      g.quadraticCurveTo(hx + 0.08, -0.085, hx - 0.02, -0.075);
      g.lineTo(hx - 0.06, -0.12); g.lineTo(hx - 0.1, -0.07);
      g.lineTo(hx - 0.17, -0.11); g.lineTo(hx - 0.2, -0.05);
      g.lineTo(hx - 0.3, -0.06); g.lineTo(hx - 0.27, 0);
      g.lineTo(hx - 0.3, 0.06); g.lineTo(hx - 0.2, 0.05);
      g.lineTo(hx - 0.17, 0.11); g.lineTo(hx - 0.1, 0.07);
      g.lineTo(hx - 0.06, 0.12); g.lineTo(hx - 0.02, 0.075);
      g.quadraticCurveTo(hx + 0.08, 0.085, hx + 0.13, 0);
      g.closePath();
      fs(g, lin(g, hx - 0.3, 0, hx + 0.13, 0, [[0, shade(c.hairColor, -0.35)], [1, shade(c.hairColor, 0.25)]]), 0.03);
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.018;
      g.beginPath(); g.moveTo(hx + 0.08, -0.02); g.lineTo(hx - 0.18, -0.02); g.stroke();
    }
    // face (hidden by full helmets / caps)
    if (!['helmet', 'hood', 'cap', 'fedora', 'gasmask'].includes(c.hair)) drawFace(g, c, hx, o);

    if (c.hair === 'cap') {
      g.save(); circle(g, hx, 0, R + 0.005); g.clip();
      fringe(g, hx, 0.1, 0);
      fs(g, lin(g, hx - 0.2, 0, hx + 0.1, 0, [[0, shade(c.cap, -0.3)], [1, shade(c.cap, 0.2)]]), 0.03);
      g.restore();
      circle(g, hx, 0, R); g.lineWidth = 0.045; g.strokeStyle = OUT; g.stroke();
      ellipse(g, hx + 0.19, 0, 0.1, 0.17); fs(g, shade(c.cap, -0.15), 0.035);
      circle(g, hx - 0.03, 0, 0.03); g.fillStyle = shade(c.cap, 0.3); g.fill();
    }
    if (c.hair === 'gasmask') {
      // hood, red crest, rubber mask with glowing lenses and two filter canisters
      circle(g, hx - 0.01, 0, 0.215); fs(g, ball(g, hx - 0.01, 0, 0.215, c.hairColor), 0.045);
      g.beginPath(); g.moveTo(hx + 0.08, 0);
      for (let i = 0; i <= 6; i++) { const x = hx + 0.06 - i * 0.055; g.lineTo(x, (i % 2 ? -1 : 1) * 0.05); }
      g.lineTo(hx - 0.3, 0);
      for (let i = 6; i >= 0; i--) { const x = hx + 0.06 - i * 0.055; g.lineTo(x, (i % 2 ? 1 : -1) * 0.06); }
      g.closePath(); fs(g, lin(g, hx - 0.3, 0, hx + 0.1, 0, [[0, '#8f1418'], [1, c.crest || '#e8344a']]), 0.03);
      ellipse(g, hx + 0.11, 0, 0.11, 0.16); fs(g, ball(g, hx + 0.11, 0, 0.16, c.mask), 0.035);
      for (const sd of [-1, 1]) {
        circle(g, hx + 0.13, sd * 0.075, 0.045); fs(g, c.lens || '#7dff5a', 0.025);
        g.fillStyle = 'rgba(255,255,255,0.7)'; circle(g, hx + 0.14, sd * 0.075 - 0.015, 0.012); g.fill();
        circle(g, hx + 0.2, sd * 0.13, 0.055); fs(g, ball(g, hx + 0.2, sd * 0.13, 0.055, '#4a4d54'), 0.03);
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.012; circle(g, hx + 0.2, sd * 0.13, 0.03); g.stroke();
      }
    }
    if (c.hair === 'fedora') {
      ellipse(g, hx - 0.01, 0, 0.26, 0.27); fs(g, ball(g, hx - 0.01, 0, 0.27, shade(c.hat, -0.05)), 0.04);
      ellipse(g, hx - 0.03, 0, 0.17, 0.19); fs(g, ball(g, hx - 0.03, 0, 0.19, c.hat), 0.035);
      g.strokeStyle = c.band || '#2a1f16'; g.lineWidth = 0.035;
      g.beginPath(); g.ellipse(hx - 0.03, 0, 0.17, 0.19, 0, 0, TAU); g.stroke();
      g.strokeStyle = shade(c.hat, -0.35); g.lineWidth = 0.02;
      g.beginPath(); g.moveTo(hx - 0.16, 0); g.lineTo(hx + 0.1, 0); g.stroke();
    }
    if (c.hair === 'helmet') {
      circle(g, hx, 0, 0.225); fs(g, ball(g, hx, 0, 0.225, c.helmet), 0.045);
      g.strokeStyle = shade(c.helmet, -0.35); g.lineWidth = 0.022;
      g.beginPath(); g.arc(hx, 0, 0.15, Math.PI * 0.6, Math.PI * 1.4); g.stroke();
      g.beginPath(); g.arc(hx, 0, 0.225, -0.95, 0.95);
      g.arc(hx, 0, 0.15, 0.85, -0.85, true); g.closePath();
      fs(g, lin(g, hx + 0.1, -0.2, hx + 0.2, 0.2, [[0, shade(c.visor, 0.35)], [1, c.visor]]), 0.03);
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.02;
      g.beginPath(); g.arc(hx, 0, 0.19, -0.7, -0.2); g.stroke();
    }
    if (c.hair === 'hood') {
      ellipse(g, hx + 0.07, 0, 0.15, 0.17); g.fillStyle = '#121218'; g.fill();
      ellipse(g, hx + 0.1, 0, 0.12, 0.14); fs(g, ball(g, hx + 0.1, 0, 0.13, c.mask), 0.03);
      g.fillStyle = OUT;
      for (const s of [-1, 1]) {
        poly(g, [[hx + 0.12, s * 0.025], [hx + 0.17, s * 0.1], [hx + 0.13, s * 0.11]]); g.fill();
      }
      g.strokeStyle = shade(c.hairColor, -0.45); g.lineWidth = 0.02;
      g.beginPath(); g.arc(hx - 0.06, 0, 0.18, Math.PI * 0.7, Math.PI * 1.3); g.stroke();
    }
    if (c.headband) {
      g.strokeStyle = c.headband; g.lineWidth = 0.04;
      g.beginPath(); g.arc(hx, 0, R - 0.02, 0, TAU); g.stroke();
      g.lineWidth = 0.045; g.lineCap = 'round';
      for (const [ty, ex] of [[-0.05, -0.38], [0.04, -0.35]]) {
        g.strokeStyle = OUT; g.lineWidth = 0.07;
        g.beginPath(); g.moveTo(hx - 0.2, 0); g.quadraticCurveTo(hx - 0.28, ty * 0.5, hx + ex + 0.03, ty * 2); g.stroke();
        g.strokeStyle = c.headband; g.lineWidth = 0.04; g.stroke();
      }
      circle(g, hx - 0.2, 0, 0.04); fs(g, c.headband, 0.025);
      circle(g, hx, 0, R); g.lineWidth = 0.045; g.strokeStyle = OUT; g.stroke();
    }
    // hair shine
    if (!['bald', 'mohawk', 'helmet', 'hood', 'balaclava', 'fedora', 'gasmask'].includes(c.hair)) {
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.025; g.lineCap = 'round';
      g.beginPath(); g.arc(hx - 0.04, 0, 0.13, -1.9, -1.2); g.stroke();
    } else if (c.hair === 'bald' || c.hair === 'mohawk') {
      g.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(g, hx - 0.02, -0.09, 0.06, 0.035); g.fill();
    }
    // cloth mask over the nose and mouth, below the eyes (Kenji, as on the store icon)
    if (c.scarf && !o.dead) {
      g.save(); circle(g, hx, 0, R); g.clip();
      g.beginPath(); g.moveTo(hx + 0.14, -0.25); g.quadraticCurveTo(hx + 0.155, 0, hx + 0.14, 0.25); g.lineTo(hx + 0.3, 0.25); g.lineTo(hx + 0.3, -0.25); g.closePath();
      fs(g, lin(g, hx + 0.15, -0.2, hx + 0.22, 0.2, [[0, shade(c.scarf, 0.2)], [1, shade(c.scarf, -0.2)]]), 0.03);
      g.restore();
    }
  }

  // ---------- Full character ----------
  function drawCharacterVector(g, L, o = {}) {
    const c = o.dead ? art.greyLook(L) : L;
    const w = o.weapon || 'knife';
    const walk = o.walk || 0;
    const sw = Math.sin(walk) * (w === 'knife' ? 0.09 : 0.025);
    let lh, rh;
    if (o.dead) { lh = { x: -0.02, y: -0.52 }; rh = { x: 0.12, y: 0.5 }; }
    else if (w === 'knife') { lh = { x: 0.22 - sw, y: -0.33 }; rh = { x: 0.3 + sw, y: 0.3 }; }
    else if (w === 'pistol') { lh = { x: 0.4, y: 0.02 }; rh = { x: 0.42, y: 0.1 }; }
    else if (GUNS[w]) { rh = gunPoint(w, GUNS[w].grip, 0.07); lh = gunPoint(w, GUNS[w].fore, 0.05); lh.y += sw; }
    if (o.attack) { rh = { x: 0.58, y: 0.1 }; lh = { x: 0.02, y: -0.38 }; }
    if (c.shield && !o.dead) { lh = { x: 0.34, y: -0.2 }; rh = { x: 0.3, y: 0.24 }; }

    g.lineJoin = 'round'; g.lineCap = 'round';
    drawFeet(g, c, walk, o.dead);
    if (c.detail === 'cape') drawCape(g, c, walk);
    if (c.detail === 'coat') {
      const sw2 = Math.sin(walk) * 0.03;
      g.beginPath();
      g.moveTo(-0.08, -0.4); g.quadraticCurveTo(-0.42, -0.42 + sw2, -0.46, 0);
      g.quadraticCurveTo(-0.42, 0.42 - sw2, -0.08, 0.4); g.closePath();
      fs(g, lin(g, -0.46, 0, -0.08, 0, [[0, shade(c.outfit, -0.35)], [1, shade(c.outfit, -0.1)]]));
      g.strokeStyle = shade(c.outfit, -0.45); g.lineWidth = 0.02;
      g.beginPath(); g.moveTo(-0.3, 0); g.lineTo(-0.44, 0); g.stroke();
    }
    if (c.pack) drawPack(g, c);
    drawTorso(g, c);
    drawArm(g, c, { x: -0.02, y: -0.31 }, lh, -1);
    drawArm(g, c, { x: -0.02, y: 0.31 }, rh, 1);
    if (!o.dead && GUNS[w]) drawGunBody(g, c, w);
    if (!o.dead && c.shield) drawShield(g, c);
    if (!o.dead && w === 'knife') drawKnife(g, c, rh);
    if (!o.dead && w === 'pistol') drawPistol(g, c, rh);
    drawHand(g, c, lh, Math.atan2(lh.y + 0.31, lh.x));
    drawHand(g, c, rh, Math.atan2(rh.y - 0.31, rh.x));
    drawHead(g, c, o);
  }

  // ---------- Sprite cache ----------
  const cache = new Map();
  let px = 80;
  function setResolution(p) {
    p = Math.max(24, Math.round(p));
    if (p !== px) { px = p; cache.clear(); }
  }
  function frameOf(o) {
    if (o.dead) return 'd';
    if (o.attack) return 'a';
    const ph = (((o.walk || 0) % TAU) + TAU) % TAU;
    return String(Math.floor(ph / TAU * 8));
  }
  function sprite(L, o) {
    const f = frameOf(o);
    const key = (L.id || L.outfit) + '|' + (o.weapon || 'knife') + '|' + f;
    let c = cache.get(key);
    if (c) return c;
    const S = Math.ceil(SPR * px);
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.setTransform(px, 0, 0, px, S / 2, S / 2);
    const walk = /^\d$/.test(f) ? ((+f + 0.5) / 8) * TAU : 0;
    drawCharacterVector(g, L, { weapon: o.weapon, dead: o.dead, attack: o.attack, walk });
    cache.set(key, c);
    return c;
  }

  function drawCharacter(g, L, x, y, ang, o = {}) {
    const s = o.scale || 1;
    g.save();
    g.translate(x, y);
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    if (!o.noShadow) { g.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(g, 0.06 * s, 0.1 * s, 0.42 * s, 0.38 * s); g.fill(); }
    g.rotate(ang);
    const half = SPR / 2 * s;
    g.drawImage(sprite(L, o), -half, -half, half * 2, half * 2);
    g.restore();
  }

  function drawPortrait(canvas, look, opts = {}) {
    const g = canvas.getContext('2d');
    const s = canvas.width;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, s, s);
    const k = s / 1.45;
    g.setTransform(k, 0, 0, k, s * 0.44, s * 0.6);
    g.rotate(-Math.PI / 2 - 0.35);
    drawCharacterVector(g, look, { weapon: 'knife', walk: opts.walk == null ? 1.2 : opts.walk, dead: false });
    if (opts.locked) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(25,28,48,0.82)';
      g.fillRect(0, 0, s, s);
      g.globalCompositeOperation = 'source-over';
    }
  }

  // shop icon: the knife alone, tilted, filling the canvas
  function drawKnifeIcon(canvas, blade, core) {
    const g = canvas.getContext('2d'), s = canvas.width;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, s, s);
    const k = s / 0.95;
    g.setTransform(k, 0, 0, k, s * 0.5, s * 0.5);
    g.rotate(-Math.PI / 4);
    drawKnife(g, { blade, core }, { x: -0.25, y: 0 });
  }

  Object.assign(art, { drawCharacter, drawPortrait, drawKnifeIcon, setResolution, muzzle });
})();
