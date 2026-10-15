'use strict';
// Shadow Strike — © KamTech Studio
// Top-down stealth game: reach every guard without stepping into a flashlight cone.
(() => {
  const W = 12, H = 20;            // map size in tiles (portrait)
  const SAVE_KEY = 'kamtech-shadowstrike-save-v1';
  const PLAYER_R = 0.3;

  const CHARACTERS = [
    { id: 'ombre',   name: 'Ombre',   color: '#4fc3f7', speed: 3.0, hp: 100, price: 0 },
    { id: 'ronin',   name: 'Ronin',   color: '#ffb74d', speed: 3.4, hp: 120, price: 150 },
    { id: 'spectre', name: 'Spectre', color: '#ba68c8', speed: 3.9, hp: 140, price: 400 },
    { id: 'titan',   name: 'Titan',   color: '#ef5350', speed: 3.3, hp: 260, price: 800 },
    { id: 'kami',    name: 'Kami',    color: '#f5c542', speed: 4.3, hp: 200, price: 1500 },
  ];

  // ---------- Save ----------
  function loadSave() {
    const base = { level: 1, gems: 0, owned: ['ombre'], selected: 'ombre' };
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') return Object.assign(base, s);
    } catch (e) { /* storage unavailable */ }
    return base;
  }
  const save = loadSave();
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }
  const currentChar = () => CHARACTERS.find(c => c.id === save.selected) || CHARACTERS[0];

  // ---------- RNG ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---------- Grid & pathfinding ----------
  let grid = null;
  const isWallTile = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || grid[ty][tx] === 1;
  const isWallAt = (px, py) => isWallTile(Math.floor(px), Math.floor(py));

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function dijkstra(g, sx, sy) {
    const N = W * H;
    const dist = new Float32Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const done = new Uint8Array(N);
    dist[sy * W + sx] = 0;
    for (;;) {
      let best = -1, bd = Infinity;
      for (let i = 0; i < N; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; best = i; }
      if (best < 0) break;
      done[best] = 1;
      const x = best % W, y = (best / W) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || g[ny][nx]) continue;
        if (dx && dy && (g[y][nx] || g[ny][x])) continue; // no corner cutting
        const j = ny * W + nx, nd = bd + (dx && dy ? 1.4142 : 1);
        if (nd < dist[j]) { dist[j] = nd; prev[j] = best; }
      }
    }
    return { dist, prev };
  }

  function clearLine(a, b, r) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(d / 0.1));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
      if (isWallAt(x - r, y - r) || isWallAt(x + r, y - r) || isWallAt(x - r, y + r) || isWallAt(x + r, y + r)) return false;
    }
    return true;
  }

  function sightLine(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(d / 0.08));
    for (let s = 1; s < steps; s++) {
      if (isWallAt(a.x + (b.x - a.x) * s / steps, a.y + (b.y - a.y) * s / steps)) return false;
    }
    return true;
  }

  // Path of tile centers from a world position to a tile, string-pulled for smooth movement.
  function findPath(from, tx, ty) {
    const sx = Math.floor(from.x), sy = Math.floor(from.y);
    if (isWallTile(sx, sy) || isWallTile(tx, ty)) return null;
    const { dist, prev } = dijkstra(grid, sx, sy);
    let i = ty * W + tx;
    if (dist[i] === Infinity) return null;
    const tiles = [];
    while (i !== -1 && i !== sy * W + sx) { tiles.push({ x: i % W + 0.5, y: ((i / W) | 0) + 0.5 }); i = prev[i]; }
    tiles.reverse();
    const out = [];
    let cur = from, k = 0;
    while (k < tiles.length) {
      let j = tiles.length - 1;
      while (j > k && !clearLine(cur, tiles[j], PLAYER_R)) j--;
      out.push(tiles[j]); cur = tiles[j]; k = j + 1;
    }
    return out;
  }

  // ---------- Level generation ----------
  function generateLevel(level) {
    const rnd = mulberry32(level * 7919 + 13);
    for (let attempt = 0; attempt < 200; attempt++) {
      const g = [];
      for (let y = 0; y < H; y++) {
        const row = [];
        for (let x = 0; x < W; x++) row.push(x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 1 : 0);
        g.push(row);
      }
      const blocks = 11 + Math.min(level, 10);
      for (let b = 0; b < blocks; b++) {
        const bw = 1 + Math.floor(rnd() * 3), bh = 1 + Math.floor(rnd() * 3);
        const bx = 1 + Math.floor(rnd() * (W - 1 - bw));
        const by = 1 + Math.floor(rnd() * (H - 4 - bh));
        for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) g[y][x] = 1;
      }
      const start = { x: Math.floor(W / 2), y: H - 2 };
      for (let x = 1; x < W - 1; x++) g[H - 2][x] = 0;

      const { dist } = dijkstra(g, start.x, start.y);
      let open = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (g[y][x]) continue;
        if (dist[y * W + x] === Infinity) g[y][x] = 1; else open++;
      }
      if (open < W * H * 0.45) continue;

      const cells = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!g[y][x]) cells.push({ x, y, d: dist[y * W + x] });
      }
      const far = cells.filter(c => c.d >= 7);
      const nGuards = Math.min(2 + Math.ceil(level * 0.6), 10);
      if (far.length < nGuards * 3) continue;

      const posts = [];
      for (let tries = 0; tries < 400 && posts.length < nGuards; tries++) {
        const c = far[Math.floor(rnd() * far.length)];
        if (posts.every(p => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) >= 4)) posts.push(c);
      }
      if (posts.length < nGuards) continue;

      const patrolCells = cells.filter(c => c.d >= 5);
      const guards = posts.map(p => {
        const wps = [p];
        const n = 1 + Math.floor(rnd() * 2);
        for (let k = 0; k < n; k++) {
          const near = patrolCells.filter(c => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 6);
          wps.push(near[Math.floor(rnd() * near.length)]);
        }
        return { post: p, waypoints: wps, startAngle: rnd() * Math.PI * 2 };
      });
      return { grid: g, start, guards };
    }
    throw new Error('level generation failed');
  }

  // ---------- Game state ----------
  let state = 'menu';
  let level = null, player = null, guards = [], levelGems = 0;
  let tracers = [], particles = [], floaters = [], marker = null;
  let shake = 0, endTimer = 0, hitFlash = 0;

  function startLevel() {
    const n = save.level;
    level = generateLevel(n);
    grid = level.grid;
    const ch = currentChar();
    player = { x: level.start.x + 0.5, y: level.start.y + 0.5, angle: -Math.PI / 2, speed: ch.speed, hp: ch.hp, maxHp: ch.hp, color: ch.color, path: null, pi: 0 };
    const gSpeed = 1.4 + Math.min(n * 0.03, 0.7);
    const range = 3.8 + Math.min(n * 0.06, 1.4);
    const damage = 18 + Math.min(n, 12);
    guards = level.guards.map(def => {
      const pts = [];
      for (let k = 0; k < def.waypoints.length; k++) {
        const a = def.waypoints[k], b = def.waypoints[(k + 1) % def.waypoints.length];
        const seg = findPath({ x: a.x + 0.5, y: a.y + 0.5 }, b.x, b.y);
        if (seg) pts.push(...seg);
      }
      return {
        x: def.post.x + 0.5, y: def.post.y + 0.5, angle: def.startAngle,
        route: pts, ri: 0, state: 'patrol', path: null, pi: 0, timer: 0,
        reaction: 0, cooldown: 0, alive: true, lastSeen: null,
        speed: gSpeed, range, half: 0.52, damage,
      };
    });
    levelGems = 0; tracers = []; particles = []; floaters = []; marker = null;
    shake = 0; endTimer = 0; hitFlash = 0;
    state = 'playing';
    showScreen(null);
    updateHud();
  }

  // ---------- Movement helpers ----------
  function angleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
  function turnTo(e, target, maxStep) {
    const d = angleDiff(e.angle, target);
    e.angle += Math.max(-maxStep, Math.min(maxStep, d));
  }
  function moveTo(e, t, speed, dt) {
    const dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy);
    if (d < 0.04) return true;
    const step = Math.min(d, speed * dt);
    e.x += dx / d * step; e.y += dy / d * step;
    turnTo(e, Math.atan2(dy, dx), dt * 9);
    return d - step < 0.04;
  }
  function followPath(e, speed, dt) {
    if (!e.path || e.pi >= e.path.length) return true;
    if (moveTo(e, e.path[e.pi], speed, dt)) e.pi++;
    return e.pi >= e.path.length;
  }

  function canSee(gd, p) {
    const dx = p.x - gd.x, dy = p.y - gd.y, d = Math.hypot(dx, dy);
    if (d > gd.range) return false;
    if (Math.abs(angleDiff(gd.angle, Math.atan2(dy, dx))) > gd.half) return false;
    return sightLine(gd, p);
  }

  // ---------- Update ----------
  function updateGuard(gd, dt) {
    if (!gd.alive) return;
    if (canSee(gd, player)) {
      if (gd.state !== 'alert') { gd.state = 'alert'; gd.reaction = 0.35; floatText(gd.x, gd.y - 0.6, '!', '#ff5252'); }
      gd.lastSeen = { x: player.x, y: player.y };
      turnTo(gd, Math.atan2(player.y - gd.y, player.x - gd.x), dt * 10);
      gd.reaction -= dt; gd.cooldown -= dt;
      if (gd.reaction <= 0 && gd.cooldown <= 0) { shoot(gd); gd.cooldown = 0.5; }
      return;
    }
    if (gd.state === 'alert') {
      gd.state = 'search';
      gd.path = findPath(gd, Math.floor(gd.lastSeen.x), Math.floor(gd.lastSeen.y)) || [];
      gd.pi = 0;
    }
    if (gd.state === 'search') {
      if (followPath(gd, gd.speed * 1.3, dt)) { gd.state = 'look'; gd.timer = 1.6; }
      return;
    }
    if (gd.state === 'look') {
      gd.timer -= dt; gd.angle += dt * 2.4;
      if (gd.timer <= 0) {
        const t = gd.route[gd.ri] || gd;
        gd.state = 'return'; gd.path = findPath(gd, Math.floor(t.x), Math.floor(t.y)) || []; gd.pi = 0;
      }
      return;
    }
    if (gd.state === 'return') {
      if (followPath(gd, gd.speed, dt)) gd.state = 'patrol';
      return;
    }
    if (gd.route.length && moveTo(gd, gd.route[gd.ri], gd.speed, dt)) gd.ri = (gd.ri + 1) % gd.route.length;
  }

  function shoot(gd) {
    player.hp -= gd.damage;
    tracers.push({ x1: gd.x, y1: gd.y, x2: player.x + (Math.random() - 0.5) * 0.2, y2: player.y + (Math.random() - 0.5) * 0.2, t: 0.09 });
    shake = 0.25; hitFlash = 0.2;
    vibrate(40);
    if (player.hp <= 0) { player.hp = 0; finish(false); }
  }

  function kill(gd) {
    gd.alive = false;
    const gain = 3 + Math.floor(Math.random() * 3);
    levelGems += gain;
    floatText(gd.x, gd.y - 0.4, '+' + gain + ' 💎', '#7fdcff');
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
      particles.push({ x: gd.x, y: gd.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.4 + Math.random() * 0.3, c: '#b71c1c' });
    }
    shake = 0.12;
    vibrate(25);
    if (guards.every(g => !g.alive)) finish(true);
  }

  function finish(won) {
    if (state !== 'playing') return;
    state = won ? 'won' : 'lost';
    endTimer = 0.9;
  }

  function floatText(x, y, text, color) { floaters.push({ x, y, text, color, t: 1 }); }
  function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } }

  function update(dt) {
    if (state === 'playing') {
      followPath(player, player.speed, dt);
      if (player.path && player.pi >= player.path.length) { player.path = null; marker = null; }
      for (const gd of guards) updateGuard(gd, dt);
      for (const gd of guards) {
        if (state === 'playing' && gd.alive && Math.hypot(gd.x - player.x, gd.y - player.y) < 0.62) kill(gd);
      }
      updateHud();
    } else if (state === 'won' || state === 'lost') {
      endTimer -= dt;
      if (endTimer <= 0) showResult(state === 'won');
    }
    for (const t of tracers) t.t -= dt;
    tracers = tracers.filter(t => t.t > 0);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.t -= dt; }
    particles = particles.filter(p => p.t > 0);
    for (const f of floaters) { f.y -= dt * 0.8; f.t -= dt; }
    floaters = floaters.filter(f => f.t > 0);
    shake = Math.max(0, shake - dt);
    hitFlash = Math.max(0, hitFlash - dt);
  }

  // ---------- Rendering ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let dpr = 1, cw = 0, ch = 0, ts = 20, ox = 0, oy = 0;
  const HUD_H = 56;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ts = Math.min((cw - 8) / W, (ch - HUD_H - 8) / H);
    ox = (cw - W * ts) / 2;
    oy = HUD_H + (ch - HUD_H - H * ts) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function visionPolygon(gd) {
    const pts = [];
    const rays = 30;
    for (let i = 0; i <= rays; i++) {
      const a = gd.angle - gd.half + (gd.half * 2 * i) / rays;
      const cx = Math.cos(a), cy = Math.sin(a);
      let d = 0;
      while (d < gd.range && !isWallAt(gd.x + cx * d, gd.y + cy * d)) d += 0.06;
      d = Math.min(d, gd.range);
      pts.push({ x: gd.x + cx * d, y: gd.y + cy * d });
    }
    return pts;
  }

  function drawCircle(x, y, r, color) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d1017';
    ctx.fillRect(0, 0, cw, ch);
    if (!grid) return;

    const sx = shake > 0 ? (Math.random() - 0.5) * 6 : 0, sy = shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    ctx.save();
    ctx.translate(ox + sx, oy + sy);
    ctx.scale(ts, ts);

    // floor
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (grid[y][x]) continue;
      ctx.fillStyle = (x + y) % 2 ? '#1a1f2c' : '#1c2231';
      ctx.fillRect(x, y, 1, 1);
    }

    // flashlight cones
    ctx.globalCompositeOperation = 'lighter';
    for (const gd of guards) {
      if (!gd.alive) continue;
      const poly = visionPolygon(gd);
      const grad = ctx.createRadialGradient(gd.x, gd.y, 0.2, gd.x, gd.y, gd.range);
      const c = gd.state === 'alert' ? '255,70,60' : '255,228,140';
      grad.addColorStop(0, `rgba(${c},0.42)`);
      grad.addColorStop(1, `rgba(${c},0.04)`);
      ctx.beginPath(); ctx.moveTo(gd.x, gd.y);
      for (const p of poly) ctx.lineTo(p.x, p.y);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // walls
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!grid[y][x]) continue;
      ctx.fillStyle = '#2b3349'; ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = '#3a4562'; ctx.fillRect(x, y, 1, 0.18);
    }

    // dead guards
    for (const gd of guards) {
      if (gd.alive) continue;
      drawCircle(gd.x, gd.y, 0.42, 'rgba(120,10,10,0.55)');
      drawCircle(gd.x, gd.y, 0.24, '#5b1f1f');
    }

    // destination marker
    if (marker) {
      ctx.strokeStyle = 'rgba(245,197,66,0.8)'; ctx.lineWidth = 0.06;
      ctx.beginPath(); ctx.arc(marker.x, marker.y, 0.25 + Math.sin(performance.now() / 150) * 0.04, 0, Math.PI * 2); ctx.stroke();
    }

    // live guards
    for (const gd of guards) {
      if (!gd.alive) continue;
      ctx.save(); ctx.translate(gd.x, gd.y); ctx.rotate(gd.angle);
      ctx.fillStyle = '#222'; ctx.fillRect(0.12, 0.08, 0.38, 0.08); // gun
      drawCircle(0, 0, 0.32, gd.state === 'alert' ? '#ff5252' : '#c0392b');
      drawCircle(0.06, 0, 0.17, '#7b1e16');
      ctx.restore();
    }

    // player
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle);
    ctx.fillStyle = '#d7dde8'; ctx.fillRect(0.2, -0.22, 0.3, 0.06); // blade
    drawCircle(0, 0, PLAYER_R, player.color);
    drawCircle(0.06, 0, 0.15, '#0d1017');
    ctx.restore();

    // tracers
    ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 0.05;
    for (const t of tracers) { ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke(); }

    // particles
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.t * 3); drawCircle(p.x, p.y, 0.07, p.c); }
    ctx.globalAlpha = 1;

    // floating text
    ctx.textAlign = 'center'; ctx.font = 'bold 0.5px system-ui, sans-serif';
    for (const f of floaters) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (hitFlash > 0) { ctx.fillStyle = `rgba(255,0,0,${hitFlash})`; ctx.fillRect(0, 0, cw, ch); }
  }

  // ---------- Input ----------
  let pointerDown = false, lastTile = -1;
  function onPointer(e) {
    if (state !== 'playing') return;
    const tx = Math.floor((e.clientX - ox) / ts), ty = Math.floor((e.clientY - oy) / ts);
    if (ty * W + tx === lastTile) return;
    lastTile = ty * W + tx;
    let target = null, best = Infinity;
    for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) {
      if (isWallTile(x, y)) continue;
      const d = Math.hypot(x - tx, y - ty);
      if (d < best) { best = d; target = { x, y }; }
    }
    if (!target) return;
    const path = findPath(player, target.x, target.y);
    if (!path) return;
    player.path = path; player.pi = 0;
    marker = { x: target.x + 0.5, y: target.y + 0.5 };
  }
  canvas.addEventListener('pointerdown', e => { pointerDown = true; lastTile = -1; onPointer(e); });
  canvas.addEventListener('pointermove', e => { if (pointerDown) onPointer(e); });
  window.addEventListener('pointerup', () => { pointerDown = false; });

  // ---------- UI ----------
  const $ = id => document.getElementById(id);
  function showScreen(id) {
    for (const s of ['menu', 'shop', 'result']) $(s).classList.toggle('hidden', s !== id);
    $('hud').classList.toggle('hidden', id !== null);
  }
  function updateHud() {
    if (!player) return;
    $('hud-level').textContent = 'Niveau ' + save.level;
    $('hud-enemies').textContent = '🎯 ' + guards.filter(g => g.alive).length;
    $('hud-gems').textContent = '💎 ' + (save.gems + levelGems);
    const pct = Math.max(0, player.hp / player.maxHp);
    const bar = $('hud-hp');
    bar.style.width = pct * 100 + '%';
    bar.style.background = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ffb300' : '#e53935';
  }
  function showMenu() {
    state = 'menu';
    $('menu-gems').textContent = save.gems;
    $('btn-play').textContent = 'Jouer — Niveau ' + save.level;
    showScreen('menu');
  }
  function showResult(won) {
    state = 'result';
    const bonus = won ? 10 + save.level * 2 : 0;
    const earned = levelGems + bonus;
    save.gems += earned;
    if (won) save.level++;
    persist();
    $('result-title').textContent = won ? 'Mission réussie' : 'Repéré !';
    $('result-text').textContent = won
      ? `+${earned} 💎 (dont ${bonus} de bonus)`
      : `Tu gardes ${earned} 💎. Reste hors de la lumière.`;
    $('btn-result').textContent = won ? 'Niveau suivant' : 'Réessayer';
    showScreen('result');
  }
  function renderShop() {
    $('shop-gems').textContent = save.gems;
    const list = $('shop-list');
    list.innerHTML = '';
    for (const c of CHARACTERS) {
      const owned = save.owned.includes(c.id), selected = save.selected === c.id;
      const row = document.createElement('div');
      row.className = 'char' + (selected ? ' selected' : '');
      row.innerHTML = `<div class="dot" style="background:${c.color};color:${c.color}"></div>
        <div class="info"><div class="name">${c.name}</div>
        <div class="stats">Vitesse ${c.speed.toFixed(1)} · Vie ${c.hp}</div></div>`;
      const btn = document.createElement('button');
      btn.className = 'btn' + (owned ? '' : ' primary');
      if (selected) { btn.textContent = 'Équipé'; btn.disabled = true; }
      else if (owned) { btn.textContent = 'Choisir'; btn.onclick = () => { save.selected = c.id; persist(); renderShop(); }; }
      else {
        btn.textContent = c.price + ' 💎';
        btn.disabled = save.gems < c.price;
        btn.onclick = () => {
          if (save.gems < c.price) return;
          save.gems -= c.price; save.owned.push(c.id); save.selected = c.id; persist(); renderShop();
        };
      }
      row.appendChild(btn);
      list.appendChild(row);
    }
  }

  $('btn-play').onclick = startLevel;
  $('btn-shop').onclick = () => { renderShop(); showScreen('shop'); };
  $('btn-shop-back').onclick = showMenu;
  $('btn-result').onclick = startLevel;
  $('btn-result-menu').onclick = showMenu;

  // ---------- Main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  showMenu();
  requestAnimationFrame(frame);

  // Exposed for automated tests only.
  window.__shadowStrike = { save, generateLevel, get state() { return state; }, get guards() { return guards; }, get player() { return player; } };
})();
