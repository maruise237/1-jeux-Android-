'use strict';
// Shadow Strike — © KamTech Studio
(() => {
  const { art, audio } = KT;
  const sfx = audio.sfx;
  const W = 11;
  let H = 19; // map height grows with the level (see levelHeight)
  const levelHeight = n => 19 + Math.min(Math.floor((n - 1) / 3), 11);
  const SAVE_KEY = 'kamtech-shadowstrike-save-v2';
  const HP_DISPLAY = 10; // health is shown x10 (a base hero has 1000)
  const BASE_SPEED = 3.6, BASE_HP = 100, PLAYER_R = 0.3, CHAR_SCALE = 1.3;
  // Difficulty ceilings: levels get harder but always stay winnable.
  const MAX_RANGE = 4.2;         // flashlight reach (tiles)
  const MAX_GUARD_SPEED = 1.8;   // always well below the slowest hero (3.6)
  const MAX_HIT = 34, MAX_HIT_SHOTGUN = 45; // a base hero (100 HP) always survives 2 hits

  const HEROES = [
    { id: 'kenji', name: 'Kenji', label: 'Standard', spd: 0, hp: 0, price: 0, look: { outfit: '#3b8f4a', outfit2: '#24552e', detail: 'vest', sleeve: 'short', skin: '#e8b48a', hair: 'spiky', hairColor: '#4a2f1d', headband: '#d63a3a', glove: '#2b2b33' } },
    { id: 'nova', name: 'Nova', label: 'Standard', spd: 0, hp: 0, price: 60, look: { outfit: '#f0b42a', detail: 'stripes', stripe: '#1c1a2b', skin: '#c98d5f', hair: 'bun', hairColor: '#1f1a1a', glove: '#2b2b33' } },
    { id: 'rex', name: 'Rex', label: '+20% Vitesse', spd: 0.2, hp: 0, price: 150, look: { outfit: '#d6463a', detail: 'jacket', sleeve: 'short', skin: '#f0c7a0', hair: 'mohawk', hairColor: '#2e8bff', glove: '#222222', eyes: 'angry' } },
    { id: 'lila', name: 'Lila', label: '+20% Vie', spd: 0, hp: 0.2, price: 150, look: { outfit: '#8e5ad6', detail: 'stripes', stripe: '#38d6d0', skin: '#f3cfb0', hair: 'pigtails', hairColor: '#38d6d0', accent: '#ff4f8b', glove: '#3a2350' } },
    { id: 'blaze', name: 'Blaze', label: '+30% Vitesse', spd: 0.3, hp: 0, price: 350, look: { outfit: '#ff7a1a', outfit2: '#2a2a33', detail: 'vest', skin: '#a86f48', hair: 'cap', cap: '#1d4fd6', glove: '#2b2b33' } },
    { id: 'onyx', name: 'Onyx', label: '+40% Vie', spd: 0, hp: 0.4, price: 350, look: { outfit: '#2b2d3a', detail: 'armor', accent: '#c0392b', sleeve: 'short', skin: '#7a4b2e', hair: 'bald', hairColor: '#1a1a1a', glove: '#c0392b', eyes: 'angry' } },
    { id: 'viper', name: 'Viper', label: '+40% Vitesse', spd: 0.4, hp: 0, price: 700, look: { blade: 'venom', outfit: '#1fa37a', detail: 'stripes', stripe: '#0f3d30', hair: 'hood', hairColor: '#1fa37a', mask: '#e6f5ee', skin: '#e8b48a', glove: '#0f3d30' } },
    { id: 'frost', name: 'Frost', label: '+60% Vie', spd: 0, hp: 0.6, price: 700, look: { blade: 'ice', outfit: '#6fd3ff', detail: 'armor', accent: '#e9f8ff', skin: '#bfe9ff', hair: 'spiky', hairColor: '#e9f8ff', glove: '#e9762b' } },
    { id: 'phantom', name: 'Phantom', label: '+50% Vitesse +30% Vie', spd: 0.5, hp: 0.3, price: 1400, look: { blade: 'crimson', outfit: '#d6245c', detail: 'stripes', stripe: '#1c1a2b', hair: 'hood', hairColor: '#d6245c', mask: '#f4f4f4', skin: '#f0c7a0', glove: '#222222' } },
    { id: 'kami', name: 'Kami', label: '+60% Vitesse +80% Vie', spd: 0.6, hp: 0.8, price: 3000, look: { blade: 'gold', outfit: '#1c1a2b', detail: 'cape', accent: '#f5c542', skin: '#e8b48a', hair: 'helmet', helmet: '#f5c542', visor: '#1c1a2b', glove: '#f5c542' } },
  ];
  for (const h of HEROES) h.look.id = 'hero-' + h.id;

  // Enemy roster: tougher types with better gear unlock as levels go up.
  const GUARD_TYPES = {
    thug: { name: 'Voyous', weapon: 'pistol', range: 1.0, half: 0.5, dmg: 1.0, rate: 0.5, reaction: 0.5, look: { outfit: '#2547b8', detail: 'stripes', stripe: '#ffffff', skin: '#a8714a', hair: 'short', hairColor: '#f2c230', glove: '#a8714a', eyes: 'angry', gun: '#6b6f7c' } },
    suit: { name: 'Gardes du corps', weapon: 'pistol', range: 1.05, half: 0.5, dmg: 1.05, rate: 0.45, reaction: 0.48, look: { outfit: '#2a2b33', detail: 'suit', skin: '#d9a77c', hair: 'slick', hairColor: '#111111', glove: '#d9a77c', eyes: 'shades', gun: '#2f323b' } },
    prisoner: { name: 'Évadés armés', weapon: 'rifle', range: 1.15, half: 0.45, dmg: 1.1, rate: 0.5, reaction: 0.45, look: { outfit: '#f0f0f0', detail: 'prison', stripe: '#2a2a2a', sleeve: 'short', skin: '#d9a77c', hair: 'beanie', hat: '#2a2a2a', glove: '#d9a77c', eyes: 'angry', gun: '#e0922f' } },
    soldier: { name: 'Soldats', weapon: 'rifle', range: 1.25, half: 0.42, dmg: 1.2, rate: 0.45, reaction: 0.4, look: { outfit: '#d7dde3', outfit2: '#5b616e', detail: 'vest', skin: '#d9a77c', hair: 'balaclava', hairColor: '#3a3d45', glove: '#3a3d45', eyes: 'angry', gun: '#4a5a3a' } },
    heavy: { name: 'Colosses blindés', tip: 'Fusil à pompe : très dangereux de près, mais lents.', weapon: 'shotgun', range: 0.85, half: 0.75, dmg: 1.7, rate: 0.8, reaction: 0.4, look: { outfit: '#7a3d2a', detail: 'armor', accent: '#5b616e', skin: '#c98d5f', hair: 'helmet', helmet: '#c0392b', visor: '#20232e', glove: '#2a2a2a' } },
    shield: { name: 'Gardes à bouclier', tip: 'Invincibles de face : prends-les de dos ou gèle-les !', weapon: 'pistol', shield: true, range: 0.95, half: 0.5, dmg: 1.0, rate: 0.55, reaction: 0.5, look: { outfit: '#3a4a6a', detail: 'armor', accent: '#5b6b8a', skin: '#d9a77c', hair: 'helmet', helmet: '#2b3550', visor: '#9fd3ff', glove: '#1f232b', shield: true, shieldColor: '#6c7ea3', gun: '#2f323b' } },
    elite: { name: 'Commandos d\'élite', weapon: 'rifle', range: 1.35, half: 0.45, dmg: 1.4, rate: 0.45, reaction: 0.35, laser: true, look: { outfit: '#2b2f3a', detail: 'armor', accent: '#3d4452', skin: '#d9a77c', hair: 'helmet', helmet: '#1f232b', visor: '#ff3b3b', glove: '#1f232b', gun: '#1c1e24' } },
  };
  function guardPool(n) {
    if (n <= 2) return ['thug'];
    if (n <= 5) return ['thug', 'thug', 'suit'];
    if (n <= 9) return ['thug', 'suit', 'prisoner', 'shield'];
    if (n <= 14) return ['suit', 'prisoner', 'soldier', 'shield'];
    if (n <= 19) return ['prisoner', 'soldier', 'heavy', 'shield'];
    if (n <= 24) return ['soldier', 'heavy', 'elite', 'shield'];
    return ['heavy', 'elite', 'elite', 'shield'];
  }
  // Shields are strong, so their number is capped to keep every level winnable.
  const maxShields = n => (n < 7 ? 0 : n < 15 ? 1 : n < 25 ? 2 : 3);

  // Every 10 levels the whole roster gets better weapons: steel -> black ops -> gold.
  const GEAR = [
    { name: '', dmg: 1, range: 1, gun: null },
    { name: 'Armes renforcées', dmg: 1.1, range: 1.05, gun: '#1c1e24' },
    { name: 'Armes de précision', dmg: 1.2, range: 1.1, gun: '#3a4a6a', laser: true },
    { name: 'Armes en or', dmg: 1.3, range: 1.15, gun: '#f5c542', laser: true },
  ];
  const gearTier = n => Math.min(GEAR.length - 1, Math.floor((n - 1) / 10));
  const lookCache = {};
  function guardLook(type, tier) {
    const key = type + tier;
    if (!lookCache[key]) {
      const T = GUARD_TYPES[type];
      lookCache[key] = { ...T.look, id: 'guard-' + key, gun: GEAR[tier].gun || T.look.gun };
    }
    return lookCache[key];
  }

  // ---------- Save ----------
  function loadSave() {
    const base = { level: 1, gems: 0, owned: ['kenji'], selected: 'kenji', sfx: true, music: true, stars: {}, tips: {} };
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') return Object.assign(base, s);
    } catch (e) { /* storage unavailable */ }
    return base;
  }
  const save = loadSave();
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
  const currentHero = () => HEROES.find(h => h.id === save.selected) || HEROES[0];
  audio.set({ sfx: save.sfx, music: save.music });

  // ---------- Grid & pathfinding ----------
  let grid = null;
  const isWallTile = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || grid[ty][tx] !== 0;
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
        if (dx && dy && (g[y][nx] || g[ny][x])) continue;
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
    for (let s = 1; s < steps; s++) if (isWallAt(a.x + (b.x - a.x) * s / steps, a.y + (b.y - a.y) * s / steps)) return false;
    return true;
  }
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
  // Levels 1..VERIFIED.length use a layout variant that the automated bot (tools/verify-levels.mjs)
  // has beaten with the weakest hero. Past that, every difficulty setting is already at its ceiling,
  // so verified layouts from the last 20 levels are reused (enemy gear keeps evolving).
  const VERIFIED = KT.verifiedVariants || [];
  function layoutOf(n) {
    const V = VERIFIED.length;
    if (n <= V || V < 40) return { n, variant: VERIFIED[n - 1] || 0 };
    const m = V - 19 + ((n - (V - 19)) % 20);
    return { n: m, variant: VERIFIED[m - 1] || 0 };
  }
  function generateLevel(n, variantOverride) {
    const lay = variantOverride == null ? layoutOf(n) : { n, variant: variantOverride };
    const prevH = H, prevGrid = grid;
    H = levelHeight(lay.n);
    try { return buildLevel(lay.n, lay.variant); } finally { H = prevH; grid = prevGrid; }
  }
  function buildLevel(n, variant) {
    const rnd = art.mulberry32(n * 7919 + 13 + variant * 104729);
    const ri = k => Math.floor(rnd() * k);
    const pick = arr => arr[ri(arr.length)];
    for (let attempt = 0; attempt < 300; attempt++) {
      const g = [];
      for (let y = 0; y < H; y++) {
        const row = [];
        for (let x = 0; x < W; x++) row.push(x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 1 : 0);
        g.push(row);
      }
      const wallRows = [];
      const nWalls = 1 + Math.floor((H - 15) / 7) + (rnd() < 0.55 ? 1 : 0);
      for (let k = 0; k < nWalls; k++) {
        const y = 4 + ri(H - 11);
        if (wallRows.some(r => Math.abs(r - y) < 4)) continue;
        wallRows.push(y);
        const full = rnd() < 0.7;
        const a = full ? 1 : 1 + ri(3), b = full ? W - 2 : W - 2 - ri(3);
        for (let x = a; x <= b; x++) g[y][x] = 1;
        const gaps = 1 + ri(2);
        for (let q = 0; q < gaps; q++) {
          const gx = a + ri(Math.max(1, b - a));
          g[y][gx] = 0;
          if (gx + 1 <= b) g[y][gx + 1] = 0;
        }
      }
      if (rnd() < 0.5) {
        const x = 3 + ri(W - 6), y0 = 2 + ri(H - 10), len = 3 + ri(3);
        for (let y = y0; y < Math.min(H - 5, y0 + len); y++) g[y][x] = 1;
      }
      const rects = [];
      const nObs = Math.round((7 + Math.min(n, 9)) * H / 19);
      for (let k = 0, tries = 0; k < nObs && tries < 300; tries++) {
        const r = rnd();
        let type, w, h;
        if (r < 0.35) { type = 'crate'; w = 1; h = 1; }
        else if (r < 0.45) { type = 'planter'; w = 2; h = 2; }
        else if (r < 0.7) { type = 'metal'; w = 1; h = 1; }
        else { type = 'container'; if (rnd() < 0.5) { w = 2; h = 1; } else { w = 1; h = 2; } }
        const x = 1 + ri(W - 1 - w), y = 1 + ri(H - 4 - h);
        let ok = true;
        for (let yy = y; yy < y + h && ok; yy++) for (let xx = x; xx < x + w; xx++) if (g[yy][xx]) { ok = false; break; }
        if (!ok) continue;
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g[yy][xx] = 2;
        rects.push({ x, y, w, h, type });
        k++;
      }
      const start = { x: Math.floor(W / 2), y: H - 2 };
      const { dist } = dijkstra(g, start.x, start.y);
      let open = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (g[y][x]) continue;
        if (dist[y * W + x] === Infinity) g[y][x] = 3; else open++; // 3 = sealed-off area (solid, indestructible)
      }
      if (open < W * H * 0.45) continue;

      const cells = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!g[y][x]) cells.push({ x, y, d: dist[y * W + x] });
      const far = cells.filter(c => c.d >= 7);
      // never more than one guard per 16 open tiles, so there are always shadows to hide in
      const nGuards = Math.min(3 + Math.floor((n - 1) / 4), 9, Math.floor(open / 16));
      if (far.length < nGuards * 3) continue;
      const posts = [];
      for (let tries = 0; tries < 500 && posts.length < nGuards; tries++) {
        const c = pick(far);
        if (posts.every(p => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) >= 4)) posts.push(c);
      }
      if (posts.length < nGuards) continue;
      const isPost = (x, y) => posts.some(p => p.x === x && p.y === y);

      const patrolCells = cells.filter(c => c.d >= 5);
      const pool = guardPool(n);
      const nonShield = pool.filter(t => t !== 'shield');
      let shields = 0;
      grid = g;
      const startPt = { x: start.x + 0.5, y: start.y + 0.5 };
      // a point is unsafe if a guard standing there could see the spawn point
      const seesStart = q => Math.hypot(q.x - startPt.x, q.y - startPt.y) < MAX_RANGE + 0.6 && sightLine(q, startPt);
      let guards = posts.map(p => {
        const wps = [p];
        const k = 1 + ri(2);
        for (let q = 0, tries = 0; q < k && tries < 20; tries++) {
          const near = patrolCells.filter(c => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 6 && (c.x !== p.x || c.y !== p.y));
          if (!near.length) break;
          wps.push(pick(near)); q++;
        }
        const route = [];
        for (let j = 0; j < wps.length; j++) {
          const a = wps[j], b = wps[(j + 1) % wps.length];
          const seg = findPath({ x: a.x + 0.5, y: a.y + 0.5 }, b.x, b.y);
          if (seg) route.push(...seg);
        }
        let type = pick(pool);
        if (type === 'shield') { if (shields < maxShields(n)) shields++; else type = pick(nonShield); }
        return { post: p, route, startAngle: rnd() * Math.PI * 2, type };
      });
      // safety: guards never patrol where they can see the spawn, and always move (so they turn their backs)
      const routeSafe = gd => {
        if (gd.route.length < 2) return false;
        let prev = { x: gd.post.x + 0.5, y: gd.post.y + 0.5 };
        for (const q of [...gd.route, prev]) {
          const steps = Math.ceil(Math.hypot(q.x - prev.x, q.y - prev.y) / 0.5);
          for (let i = 0; i <= steps; i++) {
            const t = steps ? i / steps : 0;
            if (seesStart({ x: prev.x + (q.x - prev.x) * t, y: prev.y + (q.y - prev.y) * t })) return false;
          }
          prev = q;
        }
        return true;
      };
      const allSafe = guards.every(routeSafe);
      // safety: at the start, most of the map must be in the shadows
      let lit = 0;
      for (const c of cells) {
        const q = { x: c.x + 0.5, y: c.y + 0.5 };
        if (guards.some(gd => {
          const o = { x: gd.post.x + 0.5, y: gd.post.y + 0.5 };
          const d = Math.hypot(q.x - o.x, q.y - o.y);
          if (d > MAX_RANGE || d < 0.01) return d < 0.01;
          let da = Math.atan2(q.y - o.y, q.x - o.x) - gd.startAngle;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          return Math.abs(da) < 0.6 && sightLine(o, q);
        })) lit++;
      }
      if (!allSafe || lit > cells.length * 0.35) continue;

      const lasers = [];
      if (n >= 4) {
        const cands = [];
        for (let y = 2; y < H - 5; y++) {
          for (let x = 1; x < W - 1;) {
            if (g[y][x]) { x++; continue; }
            let e = x;
            while (e < W - 1 && !g[y][e]) e++;
            const len = e - x;
            if (len >= 2 && len <= 4 && g[y][x - 1] && g[y][e]) cands.push({ h: true, a: x, b: e, c: y + 0.5, cells: Array.from({ length: len }, (_, i) => [x + i, y]) });
            x = e;
          }
        }
        for (let x = 1; x < W - 1; x++) {
          for (let y = 2; y < H - 5;) {
            if (g[y][x]) { y++; continue; }
            let e = y;
            while (e < H - 5 && !g[e][x]) e++;
            const len = e - y;
            if (len >= 2 && len <= 4 && g[y - 1][x] && g[e] && g[e][x]) cands.push({ h: false, a: y, b: e, c: x + 0.5, cells: Array.from({ length: len }, (_, i) => [x, y + i]) });
            y = e;
          }
        }
        const want = n >= 10 ? 2 : 1;
        for (let tries = 0; tries < 30 && lasers.length < want && cands.length; tries++) {
          const c = cands.splice(ri(cands.length), 1)[0];
          if (c.cells.some(([x, y]) => isPost(x, y))) continue;
          lasers.push({ h: c.h, a: c.a, b: c.b, c: c.c, period: 3.2, on: 1.7, phase: rnd() * 3.2, cells: c.cells });
        }
      }
      const onLaser = (x, y) => lasers.some(l => l.cells.some(([cx, cy]) => cx === x && cy === y));
      const free = cells.filter(c => !isPost(c.x, c.y) && !onLaser(c.x, c.y));

      const mines = [];
      if (n >= 3 || shields > 0) {
        const spots = free.filter(c => c.d >= 4 && c.d <= 13);
        const want = n >= 8 || shields > 1 ? 2 : 1;
        for (let q = 0; q < want && spots.length; q++) {
          const c = spots.splice(ri(spots.length), 1)[0];
          mines.push({ x: c.x + 0.5, y: c.y + 0.5 });
        }
      }
      // explosive mines (from level 12): blow up whoever steps on them and break nearby walls
      const bombs = [];
      if (n >= 12) {
        const routePts = guards.flatMap(gd => gd.route);
        const spots = free.filter(c => c.d >= 6 && !mines.some(m => Math.floor(m.x) === c.x && Math.floor(m.y) === c.y)
          && routePts.some(q => Math.hypot(q.x - c.x - 0.5, q.y - c.y - 0.5) < 1.6));
        for (let q = 0, want = n >= 25 ? 2 : 1; q < want && spots.length; q++) {
          const c = spots.splice(ri(spots.length), 1)[0];
          bombs.push({ x: c.x + 0.5, y: c.y + 0.5 });
        }
      }
      const pickups = [];
      const pspots = free.filter(c => c.d >= 3 && ![...mines, ...bombs].some(m => Math.floor(m.x) === c.x && Math.floor(m.y) === c.y));
      for (let q = 0, k = 2 + ri(2); q < k && pspots.length; q++) {
        const c = pspots.splice(ri(pspots.length), 1)[0];
        pickups.push({ x: c.x + 0.5, y: c.y + 0.5, value: 5 });
      }
      const themes = ['concrete', 'warehouse', 'lab'];
      return { W, H, grid: g, rects, start, guards, lasers, mines, bombs, pickups, theme: themes[Math.floor((n - 1) / 3) % 3], seed: n * 31 + 7 + variant };
    }
    throw new Error('level generation failed');
  }

  // ---------- State ----------
  let state = 'menu';
  let L = null, player = null, guards = [], lasers = [], mines = [], bombs = [], pickups = [], decals = [];
  let fx = null, levelGems = 0, shake = 0, endTimer = 0, hurtFlash = 0, time = 0, slowmo = 1;
  let marker = null, gemSoundCd = 0, mapCanvas = null;
  const cam = { x: 0, y: 0 };
  const resetFx = () => ({ parts: [], gems: [], texts: [], rings: [], tracers: [], ripples: [], slashes: [], smoke: [], fireballs: [] });
  fx = resetFx();

  function startLevel() {
    audio.init();
    const n = save.level;
    L = generateLevel(n, window.__variantOverride);
    H = L.H;
    grid = L.grid;
    const hero = currentHero();
    const maxHp = Math.round(BASE_HP * (1 + hero.hp));
    player = {
      x: L.start.x + 0.5, y: L.start.y + 0.5, angle: -Math.PI / 2, speed: BASE_SPEED * (1 + hero.spd),
      hp: maxHp, maxHp, look: hero.look, path: null, pi: 0, walk: 0, chase: null, repath: 0,
      spotted: false, hurtCd: 0, attack: 0, dust: 0,
    };
    const gSpeed = Math.min(1.35 + n * 0.025, MAX_GUARD_SPEED);
    const baseRange = Math.min(3.0 + n * 0.04, 3.8);
    const baseDmg = 16 + Math.min(n, 14);
    const tier = gearTier(n), G = GEAR[tier];
    guards = L.guards.map(def => {
      const T = GUARD_TYPES[def.type];
      const route = def.route;
      return {
        x: def.post.x + 0.5, y: def.post.y + 0.5, angle: def.startAngle, route, ri: 0,
        state: 'patrol', path: null, pi: 0, timer: 0, reaction: 0, cooldown: 0, alive: true, lastSeen: null,
        speed: gSpeed * (def.type === 'heavy' ? 0.85 : 1), range: Math.min(baseRange * T.range * G.range, MAX_RANGE), half: T.half,
        damage: Math.min(Math.round(baseDmg * T.dmg * G.dmg), T.weapon === 'shotgun' ? MAX_HIT_SHOTGUN : MAX_HIT), shield: !!T.shield, rate: T.rate, type: def.type, look: guardLook(def.type, tier), weapon: T.weapon,
        reactTime: T.reaction, laser: !!(T.laser || (G.laser && T.weapon !== 'shotgun')),
        frozen: 0, walk: 0, muzzle: 0, alertT: 0, qT: 0, deadT: 0,
      };
    });
    lasers = L.lasers.map(l => ({ ...l }));
    mines = L.mines.map(m => ({ ...m, used: false }));
    bombs = (L.bombs || []).map(b => ({ ...b, state: 'armed', fuse: 0 }));
    decals = [];
    pickups = L.pickups.map(p => ({ ...p, taken: false }));
    fx = resetFx();
    levelGems = 0; shake = 0; endTimer = 0; hurtFlash = 0; time = 0; slowmo = 1; marker = null;
    buildMap();
    updateCamera(0, true);
    state = 'playing';
    showScreen(null);
    buildHud();
    showBanner('NIVEAU ' + n, `Élimine ${guards.length} gardes`);
    let tip = null;
    const types = [...new Set(guards.map(g => g.type))];
    const newType = types.find(t => t !== 'thug' && !save.tips['enemy_' + t]);
    if (tier > 0 && !save.tips['gear' + tier]) { tip = `⚠ Les ennemis s'équipent : <b>${G.name}</b> !<br>Plus de dégâts et plus de portée.`; save.tips['gear' + tier] = 1; }
    else if (newType) tip = `⚠ Nouveaux ennemis : <b>${GUARD_TYPES[newType].name}</b> !` + (GUARD_TYPES[newType].tip ? '<br>' + GUARD_TYPES[newType].tip : '');
    else if (n === 1) tip = 'Touche le sol pour te déplacer.<br>Touche un garde pour l\'éliminer par surprise !';
    else if (lasers.length && !save.tips.laser) { tip = 'Attention aux lasers rouges !<br>Passe quand ils sont éteints.'; save.tips.laser = 1; }
    else if (bombs.length && !save.tips.bomb) { tip = 'Mine explosive 💥 : elle saute quand quelqu\'un marche dessus.<br>Attire les gardes dessus, mais reste loin !'; save.tips.bomb = 1; }
    else if (mines.length && !save.tips.mine) { tip = 'Marche sur la mine de glace ❄<br>pour geler les gardes autour.'; save.tips.mine = 1; }
    for (const t of types) save.tips['enemy_' + t] = 1;
    showTip(tip);
    persist();
  }

  // ---------- Movement ----------
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
    turnTo(e, Math.atan2(dy, dx), dt * 10);
    return d - step < 0.04;
  }
  function followPath(e, speed, dt) {
    if (!e.path || e.pi >= e.path.length) return true;
    if (moveTo(e, e.path[e.pi], speed, dt)) e.pi++;
    return e.pi >= e.path.length;
  }
  function canSee(gd, p) {
    if (gd.frozen > 0) return false;
    const dx = p.x - gd.x, dy = p.y - gd.y, d = Math.hypot(dx, dy);
    if (d > gd.range) return false;
    if (Math.abs(angleDiff(gd.angle, Math.atan2(dy, dx))) > gd.half) return false;
    return sightLine(gd, p);
  }
  const laserOn = l => ((time + l.phase) % l.period) < l.on;
  const laserWarn = l => ((time + l.phase) % l.period) > l.period - 0.45;
  function hitsLaser(l, p) {
    return l.h
      ? Math.abs(p.y - l.c) < 0.3 && p.x > l.a - 0.1 && p.x < l.b + 0.1
      : Math.abs(p.x - l.c) < 0.3 && p.y > l.a - 0.1 && p.y < l.b + 0.1;
  }

  // ---------- Update ----------
  function updatePlayer(dt) {
    const p = player;
    if (p.chase) {
      if (!p.chase.alive) { p.chase = null; p.path = null; marker = null; }
      else {
        p.repath -= dt;
        if (p.repath <= 0) {
          p.repath = 0.25;
          const path = findPath(p, Math.floor(p.chase.x), Math.floor(p.chase.y));
          if (path) { p.path = path; p.pi = 0; }
        }
      }
    }
    const moving = p.path && p.pi < p.path.length;
    followPath(p, p.speed, dt);
    if (moving) {
      p.walk += dt * 14;
      p.dust -= dt;
      if (p.dust <= 0) {
        p.dust = 0.11;
        fx.parts.push({ x: p.x - Math.cos(p.angle) * 0.25, y: p.y - Math.sin(p.angle) * 0.25, vx: 0, vy: 0, t: 0.4, max: 0.4, r: 0.09, c: 'rgba(120,120,135,0.5)', grow: 0.3 });
      }
    }
    if (p.path && p.pi >= p.path.length) { p.path = null; if (!p.chase) marker = null; }
    p.attack = Math.max(0, p.attack - dt);
    p.hurtCd = Math.max(0, p.hurtCd - dt);

    for (const pk of pickups) {
      if (pk.taken || Math.hypot(pk.x - p.x, pk.y - p.y) > 0.5) continue;
      pk.taken = true;
      sfx.pickup();
      spawnGems(pk.x, pk.y, pk.value);
      fx.texts.push({ x: pk.x, y: pk.y - 0.3, text: '+' + pk.value, color: '#5ee7ff', t: 1, max: 1 });
    }
    for (const m of mines) if (!m.used && Math.hypot(m.x - p.x, m.y - p.y) < 0.5) triggerFreeze(m);
    for (const l of lasers) {
      if (p.hurtCd <= 0 && laserOn(l) && hitsLaser(l, p)) { sfx.laser(); damage(20); p.hurtCd = 0.7; }
    }
    p.blockCd = Math.max(0, (p.blockCd || 0) - dt);
    for (const gd of guards) {
      if (state !== 'playing' || !gd.alive || Math.hypot(gd.x - p.x, gd.y - p.y) >= 0.62) continue;
      const fromFront = Math.abs(angleDiff(gd.angle, Math.atan2(p.y - gd.y, p.x - gd.x))) < 1.15;
      if (gd.shield && gd.frozen <= 0 && fromFront) blocked(gd);
      else kill(gd);
    }
  }

  function updateGuard(gd, dt) {
    if (!gd.alive) { gd.deadT += dt; return; }
    gd.muzzle = Math.max(0, gd.muzzle - dt);
    gd.alertT = Math.max(0, gd.alertT - dt);
    gd.qT = Math.max(0, gd.qT - dt);
    if (gd.frozen > 0) {
      gd.frozen -= dt;
      if (gd.frozen <= 0) { gd.state = 'look'; gd.timer = 0.8; }
      return;
    }
    const ox = gd.x, oy = gd.y;
    stepGuard(gd, dt);
    if (Math.hypot(gd.x - ox, gd.y - oy) > 0.001) gd.walk += dt * 10;
  }

  function stepGuard(gd, dt) {
    if (state === 'playing' && canSee(gd, player)) {
      if (gd.state !== 'alert') { gd.state = 'alert'; gd.reaction = gd.reactTime; gd.alertT = 1.2; sfx.alert(); player.spotted = true; }
      gd.lastSeen = { x: player.x, y: player.y };
      turnTo(gd, Math.atan2(player.y - gd.y, player.x - gd.x), dt * 10);
      gd.reaction -= dt; gd.cooldown -= dt;
      if (gd.reaction <= 0 && gd.cooldown <= 0) { shoot(gd); gd.cooldown = gd.rate; }
      return;
    }
    if (gd.state === 'alert') {
      gd.state = 'search';
      gd.path = findPath(gd, Math.floor(gd.lastSeen.x), Math.floor(gd.lastSeen.y)) || [];
      gd.pi = 0;
    }
    if (gd.state === 'suspect') {
      turnTo(gd, Math.atan2(gd.lastSeen.y - gd.y, gd.lastSeen.x - gd.x), dt * 3);
      gd.timer -= dt;
      if (gd.timer <= 0) {
        gd.state = 'search';
        gd.path = findPath(gd, Math.floor(gd.lastSeen.x), Math.floor(gd.lastSeen.y)) || []; gd.pi = 0;
      }
      return;
    }
    if (gd.state === 'search') {
      if (followPath(gd, gd.speed * 1.25, dt)) { gd.state = 'look'; gd.timer = 1.6; }
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

  function gunTip(gd) {
    const len = (gd.weapon === 'pistol' ? 0.75 : 0.9) * CHAR_SCALE;
    const off = (gd.weapon === 'pistol' ? 0.1 : 0.06) * CHAR_SCALE;
    const c = Math.cos(gd.angle), s = Math.sin(gd.angle);
    return { x: gd.x + c * len - s * off, y: gd.y + s * len + c * off };
  }

  function shoot(gd) {
    gd.muzzle = 0.08;
    const tip = gunTip(gd);
    const pellets = gd.weapon === 'shotgun' ? 3 : 1;
    for (let i = 0; i < pellets; i++) {
      fx.tracers.push({ x1: tip.x, y1: tip.y, x2: player.x + (Math.random() - 0.5) * 0.4, y2: player.y + (Math.random() - 0.5) * 0.4, t: 0.09 });
    }
    // ejected shell casing + muzzle sparks
    const side = gd.angle + Math.PI / 2;
    fx.parts.push({ x: tip.x, y: tip.y, vx: Math.cos(side) * 2 + (Math.random() - 0.5), vy: Math.sin(side) * 2 + (Math.random() - 0.5), t: 1.4, max: 1.4, r: 0.04, c: '#e8b931', shard: true, rot: Math.random() * 6 });
    for (let i = 0; i < 4; i++) {
      const a = gd.angle + (Math.random() - 0.5) * 0.8, v = 3 + Math.random() * 3;
      fx.parts.push({ x: tip.x, y: tip.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.15, max: 0.15, r: 0.03, c: '#ffe27a' });
    }
    sfx.shot();
    damage(gd.damage);
  }

  function damage(amount) {
    if (state !== 'playing') return;
    player.hp -= amount;
    fx.texts.push({ x: player.x + (Math.random() - 0.5) * 0.4, y: player.y - 0.5, text: '-' + Math.round(amount * HP_DISPLAY), color: '#ff4040', t: 0.9, max: 0.9 });
    player.spotted = true;
    hurtFlash = 0.35; shake = Math.max(shake, 0.25);
    sfx.hurt(); vibrate(45);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      fx.parts.push({ x: player.x, y: player.y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, t: 0.3, max: 0.3, r: 0.06, c: '#ff5a4f' });
    }
    if (player.hp <= 0) { player.hp = 0; finish(false); }
  }

  function addSplat(x, y, size) {
    decals.push({ kind: 'blood', x, y, rot: Math.random() * 6, shape: art.makeSplat(Math.random, size), t: 0 });
  }

  function kill(gd, byBlast) {
    gd.alive = false; gd.deadT = 0;
    if (!byBlast) {
      player.attack = 0.2;
      player.angle = Math.atan2(gd.y - player.y, gd.x - player.x);
    }
    const wasFrozen = gd.frozen > 0;
    if (!wasFrozen) addSplat(gd.x, gd.y, 0.38 + Math.random() * 0.12);
    gd.frozen = 0;
    if (wasFrozen) {
      sfx.shatter();
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3;
        fx.parts.push({ x: gd.x, y: gd.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.6, max: 0.6, r: 0.08, c: '#bfeeff', shard: true, rot: a });
      }
    } else if (!byBlast) sfx.kill();
    if (!byBlast) fx.slashes.push({ x: gd.x, y: gd.y, a: player.angle, t: 0.2 });
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3;
      fx.parts.push({ x: gd.x, y: gd.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.35, max: 0.35, r: 0.05, c: '#fff6c2' });
    }
    const gain = 4 + Math.floor(Math.random() * 4) + Math.floor(save.level / 5);
    spawnGems(gd.x, gd.y, gain);
    fx.texts.push({ x: gd.x, y: gd.y - 0.4, text: '+' + gain, color: '#7dff5a', t: 1.1, max: 1.1, big: true });
    shake = Math.max(shake, 0.15);
    vibrate(30);
    for (const o of guards) {
      if (!o.alive || o.frozen > 0 || o.state !== 'patrol') continue;
      // only guards that could see the spot get suspicious, and they hesitate before checking it
      if (Math.hypot(o.x - gd.x, o.y - gd.y) < 2.6 && sightLine(o, gd)) {
        o.state = 'suspect'; o.timer = 0.8; o.qT = 1.2;
        o.lastSeen = { x: gd.x, y: gd.y };
      }
    }
    if (guards.every(g => !g.alive)) finish(true);
  }

  // Hitting a shield from the front bounces the player back and alerts the guard.
  function blocked(gd) {
    const p = player;
    if (p.blockCd > 0) return;
    p.blockCd = 0.6;
    const dx = p.x - gd.x, dy = p.y - gd.y, d = Math.hypot(dx, dy) || 1;
    for (let k = 0.8; k > 0; k -= 0.1) {
      const nx = p.x + dx / d * k, ny = p.y + dy / d * k;
      if (clearLine(p, { x: nx, y: ny }, PLAYER_R * 0.9)) { p.x = nx; p.y = ny; break; }
    }
    p.path = null; p.chase = null; marker = null; p.spotted = true;
    gd.angle = Math.atan2(p.y - gd.y, p.x - gd.x);
    gd.state = 'alert'; gd.reaction = gd.reactTime; gd.alertT = 1.2;
    sfx.clang(); vibrate(50);
    shake = Math.max(shake, 0.2);
    const sx = gd.x + Math.cos(gd.angle) * 0.5, sy = gd.y + Math.sin(gd.angle) * 0.5;
    for (let i = 0; i < 12; i++) {
      const a = gd.angle + (Math.random() - 0.5) * 2, v = 2 + Math.random() * 3;
      fx.parts.push({ x: sx, y: sy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.3, max: 0.3, r: 0.045, c: '#ffe27a' });
    }
    fx.texts.push({ x: gd.x, y: gd.y - 0.5, text: 'BLOQUÉ !', color: '#ffd34d', t: 1, max: 1 });
  }

  function updateBombs(dt) {
    for (const b of bombs) {
      if (b.state === 'armed') {
        const who = [player, ...guards.filter(g => g.alive)].some(e => Math.hypot(e.x - b.x, e.y - b.y) < 0.45);
        if (who && state === 'playing') { b.state = 'fuse'; b.fuse = 0.7; sfx.beep(); }
      } else if (b.state === 'fuse') {
        const before = b.fuse;
        b.fuse -= dt;
        if (Math.floor(before * 8) !== Math.floor(b.fuse * 8)) sfx.beep();
        if (b.fuse <= 0) explode(b);
      }
    }
  }

  function explode(b) {
    b.state = 'done';
    const R = 1.9;
    sfx.explosion(); vibrate(150);
    shake = Math.max(shake, 0.55);
    fx.fireballs.push({ x: b.x, y: b.y, t: 0, max: 0.45, r: R });
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * R * 0.6;
      fx.smoke.push({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d, vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.4 - 0.15, r: 0.35 + Math.random() * 0.4, t: 0, max: 1.8 + Math.random() * 1.2 });
    }
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 5;
      fx.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.5, max: 0.5, r: 0.05, c: i % 2 ? '#ffb02e' : '#ff6a1e' });
    }
    decals.push({ kind: 'scorch', x: b.x, y: b.y, r: R * 0.9, seed: Math.random() * 10 });
    // break interior walls caught in the blast
    let broke = false;
    for (let y = Math.floor(b.y - R); y <= Math.ceil(b.y + R); y++) for (let x = Math.floor(b.x - R); x <= Math.ceil(b.x + R); x++) {
      if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1 || grid[y][x] !== 1) continue;
      if (Math.hypot(x + 0.5 - b.x, y + 0.5 - b.y) > R * 0.8) continue;
      grid[y][x] = 0; broke = true;
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
        fx.parts.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.8, max: 0.8, r: 0.07, c: '#7a7850', shard: true, rot: a });
      }
      decals.push({ kind: 'rubble', x: x + 0.5, y: y + 0.5, seed: Math.random() * 10 });
    }
    if (broke) buildMap();
    const pd = Math.hypot(player.x - b.x, player.y - b.y);
    if (pd < R && state === 'playing') damage(Math.round(player.maxHp * 0.45 * (1 - pd / R * 0.5)));
    for (const gd of guards) {
      if (gd.alive && Math.hypot(gd.x - b.x, gd.y - b.y) < R) kill(gd, true);
    }
    for (const o of guards) {
      if (!o.alive || o.frozen > 0 || o.state !== 'patrol') continue;
      if (Math.hypot(o.x - b.x, o.y - b.y) < 4) { o.state = 'suspect'; o.timer = 0.8; o.qT = 1.2; o.lastSeen = { x: b.x, y: b.y }; }
    }
  }

  function spawnGems(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3.5;
      fx.gems.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, rot: Math.random() * 6 });
    }
  }

  function triggerFreeze(m) {
    m.used = true;
    sfx.freeze(); vibrate(60);
    fx.rings.push({ x: m.x, y: m.y, t: 0, max: 0.55, r: 2.9 });
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      fx.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.7, max: 0.7, r: 0.07, c: '#d6f6ff', shard: true, rot: a });
    }
    shake = Math.max(shake, 0.2);
    for (const gd of guards) {
      if (gd.alive && Math.hypot(gd.x - m.x, gd.y - m.y) < 2.9) { gd.frozen = 4.5; gd.state = 'patrol'; gd.path = null; }
    }
  }

  function finish(won) {
    if (state !== 'playing') return;
    state = won ? 'won' : 'lost';
    endTimer = won ? 1.3 : 1.1;
    slowmo = 0.35;
    player.path = null; player.chase = null; marker = null;
    if (won) sfx.win(); else sfx.lose();
  }

  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

  function updateFx(dt) {
    for (const p of fx.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.t -= dt; }
    fx.parts = fx.parts.filter(p => p.t > 0);
    gemSoundCd -= dt;
    for (const g of fx.gems) {
      g.t += dt; g.rot += dt * 6;
      if (g.t < 0.4) { g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= 0.86; g.vy *= 0.86; }
      else {
        const dx = player.x - g.x, dy = player.y - g.y, d = Math.hypot(dx, dy);
        const sp = 4 + (g.t - 0.4) * 22;
        if (d < 0.3 || d < sp * dt) { g.done = true; levelGems++; if (gemSoundCd <= 0) { sfx.gem(); gemSoundCd = 0.045; } }
        else { g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
      }
    }
    fx.gems = fx.gems.filter(g => !g.done);
    for (const t of fx.texts) { t.y -= dt * 0.7; t.t -= dt; }
    fx.texts = fx.texts.filter(t => t.t > 0);
    for (const r of fx.rings) r.t += dt;
    fx.rings = fx.rings.filter(r => r.t < r.max);
    for (const r of fx.ripples) r.t += dt;
    fx.ripples = fx.ripples.filter(r => r.t < 0.4);
    for (const t of fx.tracers) t.t -= dt;
    fx.tracers = fx.tracers.filter(t => t.t > 0);
    for (const sm of fx.smoke) { sm.t += dt; sm.x += sm.vx * dt; sm.y += sm.vy * dt; sm.vx *= 0.97; sm.vy *= 0.97; }
    fx.smoke = fx.smoke.filter(sm => sm.t < sm.max);
    for (const f of fx.fireballs) f.t += dt;
    fx.fireballs = fx.fireballs.filter(f => f.t < f.max);
    for (const s of fx.slashes) s.t -= dt;
    fx.slashes = fx.slashes.filter(s => s.t > 0);
  }

  function update(rawDt) {
    if (state === 'paused' || !L) return;
    if (state === 'won' || state === 'lost') {
      slowmo = Math.min(1, slowmo + rawDt * 0.8);
      endTimer -= rawDt;
      if (endTimer <= 0) showResult(state === 'won');
    }
    const dt = rawDt * (state === 'playing' ? 1 : slowmo);
    time += dt;
    if (state === 'playing') updatePlayer(dt);
    if (state === 'playing' || state === 'won' || state === 'lost') {
      for (const gd of guards) updateGuard(gd, dt);
      updateBombs(dt);
      updateFx(dt);
      updateHud();
    }
    updateCamera(rawDt, false);
    shake = Math.max(0, shake - rawDt);
    hurtFlash = Math.max(0, hurtFlash - rawDt);
  }

  // ---------- Camera & canvas ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const shadeCanvas = document.createElement('canvas');
  const sctx = shadeCanvas.getContext('2d');
  let dpr = 1, cw = 0, ch = 0, ts = 40;
  const HUD_H = 64;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    shadeCanvas.width = canvas.width; shadeCanvas.height = canvas.height;
    const fit = Math.min(cw / W, (ch - HUD_H) / H);
    ts = Math.max(fit, Math.min(cw / 9, (ch - HUD_H) / 13));
    art.setResolution(ts * dpr * CHAR_SCALE);
    if (L) { buildMap(); updateCamera(0, true); }
  }
  function buildMap() { mapCanvas = art.renderMap(L, ts * dpr); }

  function updateCamera(dt, snap) {
    if (!player) return;
    const vw = cw / ts, vh = (ch - HUD_H) / ts;
    const tx = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, player.x - vw / 2));
    const ty = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, player.y - vh / 2));
    if (snap) { cam.x = tx; cam.y = ty; return; }
    const k = 1 - Math.exp(-dt * 6);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  }
  window.addEventListener('resize', resize);

  const toScreen = (x, y) => ({ x: (x - cam.x) * ts, y: HUD_H + (y - cam.y) * ts });

  // ---------- Rendering ----------
  function visionPolygon(gd) {
    const pts = [];
    const rays = 32;
    for (let i = 0; i <= rays; i++) {
      const a = gd.angle - gd.half + (gd.half * 2 * i) / rays;
      const cx = Math.cos(a), cy = Math.sin(a);
      let d = 0.2;
      while (d < gd.range && !isWallAt(gd.x + cx * d, gd.y + cy * d)) d += 0.06;
      d = Math.min(d, gd.range);
      pts.push({ x: gd.x + cx * d, y: gd.y + cy * d });
    }
    return pts;
  }
  function tracePoly(g, gd, poly) {
    g.beginPath(); g.moveTo(gd.x, gd.y);
    for (const p of poly) g.lineTo(p.x, p.y);
    g.closePath();
  }

  function worldTransform(g, sx, sy) {
    g.setTransform(dpr * ts, 0, 0, dpr * ts, dpr * (-cam.x * ts + sx), dpr * (HUD_H - cam.y * ts + sy));
  }

  function drawMine(m) {
    const pulse = 0.5 + Math.sin(time * 5) * 0.5;
    ctx.fillStyle = `rgba(94,231,255,${0.15 + pulse * 0.2})`;
    art.circle(ctx, m.x, m.y, 0.42 + pulse * 0.06); ctx.fill();
    art.circle(ctx, m.x, m.y, 0.3);
    ctx.fillStyle = '#4b5a72'; ctx.fill(); ctx.lineWidth = 0.05; ctx.strokeStyle = art.OUT; ctx.stroke();
    art.circle(ctx, m.x, m.y, 0.2); ctx.fillStyle = '#d9f6ff'; ctx.fill();
    ctx.strokeStyle = '#1b8fd1'; ctx.lineWidth = 0.035; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 3 * i + time * 0.6;
      ctx.moveTo(m.x + Math.cos(a) * 0.15, m.y + Math.sin(a) * 0.15);
      ctx.lineTo(m.x - Math.cos(a) * 0.15, m.y - Math.sin(a) * 0.15);
    }
    ctx.stroke();
    art.circle(ctx, m.x, m.y, 0.04); ctx.fillStyle = '#ff4f4f'; ctx.fill();
  }

  function drawLaser(l) {
    const on = laserOn(l), warn = !on && laserWarn(l);
    const p1 = l.h ? { x: l.a, y: l.c } : { x: l.c, y: l.a };
    const p2 = l.h ? { x: l.b, y: l.c } : { x: l.c, y: l.b };
    if (on) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,40,40,0.25)'; ctx.lineWidth = 0.35 + Math.sin(time * 40) * 0.04;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 0.12; ctx.stroke();
      ctx.strokeStyle = '#ffe2e2'; ctx.lineWidth = 0.04; ctx.stroke();
    } else if (warn && Math.sin(time * 40) > 0) {
      ctx.setLineDash([0.12, 0.1]);
      ctx.strokeStyle = 'rgba(255,60,60,0.7)'; ctx.lineWidth = 0.04;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const p of [p1, p2]) {
      art.rrect(ctx, p.x - 0.13, p.y - 0.13, 0.26, 0.26, 0.05);
      ctx.fillStyle = '#3a3d4c'; ctx.fill(); ctx.lineWidth = 0.04; ctx.strokeStyle = art.OUT; ctx.stroke();
      art.circle(ctx, p.x, p.y, 0.07); ctx.fillStyle = on ? '#ff3b3b' : warn ? '#ffb02e' : '#7a2a2a'; ctx.fill();
    }
  }

  // Orange curved arrow along the planned route.
  function drawPathLine() {
    const p = player;
    let pts;
    if (p.chase && p.chase.alive) pts = [{ x: p.x, y: p.y }, { x: p.chase.x, y: p.chase.y }];
    else if (p.path && p.pi < p.path.length) pts = [{ x: p.x, y: p.y }, ...p.path.slice(p.pi)];
    else return;
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
    const end = p.chase ? { x: last.x - Math.cos(ang) * 0.75, y: last.y - Math.sin(ang) * 0.75 } : last;
    if (Math.hypot(end.x - p.x, end.y - p.y) < 0.4) return;
    const trace = () => {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, i === pts.length - 2 ? end.x : mx, i === pts.length - 2 ? end.y : my);
      }
      if (pts.length === 2) ctx.lineTo(end.x, end.y);
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    trace(); ctx.strokeStyle = 'rgba(80,30,0,0.45)'; ctx.lineWidth = 0.16; ctx.stroke();
    trace(); ctx.strokeStyle = '#ff8a1e'; ctx.lineWidth = 0.1; ctx.stroke();
    ctx.save(); ctx.translate(end.x, end.y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0.22, 0); ctx.lineTo(-0.1, -0.17); ctx.lineTo(-0.1, 0.17); ctx.closePath();
    ctx.fillStyle = '#ff8a1e'; ctx.fill(); ctx.lineWidth = 0.035; ctx.strokeStyle = 'rgba(80,30,0,0.6)'; ctx.stroke();
    ctx.restore();
  }

  function drawBomb(b) {
    const blink = b.state === 'fuse' ? Math.sin(time * 40) > 0 : Math.sin(time * 4) > 0.3;
    const pulse = 0.5 + Math.sin(time * (b.state === 'fuse' ? 30 : 4)) * 0.5;
    ctx.strokeStyle = `rgba(255,60,80,${0.25 + pulse * 0.35})`; ctx.lineWidth = 0.05;
    art.circle(ctx, b.x, b.y, 0.36 + pulse * 0.08); ctx.stroke();
    art.circle(ctx, b.x, b.y, 0.26); ctx.fillStyle = '#c9ccd6'; ctx.fill(); ctx.lineWidth = 0.045; ctx.strokeStyle = art.OUT; ctx.stroke();
    art.circle(ctx, b.x, b.y, 0.17); ctx.fillStyle = '#e7a6b3'; ctx.fill();
    art.circle(ctx, b.x, b.y, 0.09); ctx.fillStyle = blink ? '#ff2a3d' : '#7a1020'; ctx.fill();
    if (blink) { ctx.fillStyle = 'rgba(255,60,80,0.35)'; art.circle(ctx, b.x, b.y, 0.2); ctx.fill(); }
  }

  function drawChaseMarker(gd) {
    const r = 0.75 + Math.sin(time * 8) * 0.05;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + Math.PI / 2 * i + time * 1.5;
      const cx = gd.x + Math.cos(a) * r, cy = gd.y + Math.sin(a) * r;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + Math.PI);
      ctx.beginPath(); ctx.moveTo(0.14, 0); ctx.lineTo(-0.08, -0.12); ctx.lineTo(-0.08, 0.12); ctx.closePath();
      ctx.fillStyle = '#ffa21a'; ctx.fill(); ctx.lineWidth = 0.035; ctx.strokeStyle = '#a3480b'; ctx.stroke();
      ctx.restore();
    }
  }

  function screenText(text, x, y, size, fill, opts = {}) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${size}px "Lilita One", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.22); ctx.strokeStyle = opts.stroke || '#1c1a2b';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#12141d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!L || !mapCanvas) return;

    const sx = shake > 0 ? (Math.random() - 0.5) * 10 * shake * 3 : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * 10 * shake * 3 : 0;
    worldTransform(ctx, sx, sy);
    ctx.drawImage(mapCanvas, 0, 0, W, H);

    // persistent decals (scorch marks, rubble, blood)
    for (const d of decals) {
      if (d.kind === 'scorch') art.drawScorch(ctx, d);
      else if (d.kind === 'rubble') {
        ctx.fillStyle = '#6f6d48';
        for (let i = 0; i < 6; i++) { const a = d.seed + i * 1.1, r = 0.15 + (i % 3) * 0.12; ctx.fillRect(d.x + Math.cos(a) * r - 0.06, d.y + Math.sin(a) * r - 0.05, 0.12 + (i % 2) * 0.06, 0.09); }
      }
    }
    for (const d of decals) {
      if (d.kind !== 'blood') continue;
      d.t = Math.min(1, d.t + 1 / 30);
      d.alpha = 0.92; d.scale = 0.4 + 0.6 * Math.min(1, d.t * 3);
      ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.scale, d.scale); ctx.translate(-d.x, -d.y);
      art.drawSplat(ctx, d); ctx.restore();
    }
    // ground layer
    for (const b of bombs) if (b.state !== 'done') drawBomb(b);
    for (const m of mines) if (!m.used) drawMine(m);
    for (const pk of pickups) {
      if (pk.taken) continue;
      const bob = Math.sin(time * 4 + pk.x) * 0.06;
      ctx.fillStyle = 'rgba(94,231,255,0.25)'; art.circle(ctx, pk.x, pk.y, 0.32); ctx.fill();
      art.drawGem(ctx, pk.x, pk.y - 0.05 + bob, 0.2, Math.sin(time * 2) * 0.2);
    }
    // fallen guards fade away, leaving only the stain
    for (const gd of guards) {
      if (gd.alive || gd.deadT > 0.7) continue;
      art.drawCharacter(ctx, gd.look, gd.x, gd.y, gd.angle, { weapon: gd.weapon, dead: true, alpha: 1 - gd.deadT / 0.7, noShadow: true, scale: CHAR_SCALE });
    }

    // darkness with flashlight cones cut out
    const polys = guards.filter(g => g.alive && g.frozen <= 0).map(g => [g, visionPolygon(g)]);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, shadeCanvas.width, shadeCanvas.height);
    sctx.fillStyle = 'rgba(8,10,30,0.32)';
    sctx.fillRect(0, 0, shadeCanvas.width, shadeCanvas.height);
    worldTransform(sctx, sx, sy);
    sctx.globalCompositeOperation = 'destination-out';
    for (const [gd, poly] of polys) {
      const grad = sctx.createRadialGradient(gd.x, gd.y, 0.1, gd.x, gd.y, gd.range);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      tracePoly(sctx, gd, poly); sctx.fillStyle = grad; sctx.fill();
    }
    sctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(shadeCanvas, 0, 0);
    worldTransform(ctx, sx, sy);
    ctx.globalCompositeOperation = 'lighter';
    for (const [gd, poly] of polys) {
      const c = gd.state === 'alert' ? '255,60,50' : '255,236,190';
      const grad = ctx.createRadialGradient(gd.x, gd.y, 0.1, gd.x, gd.y, gd.range);
      grad.addColorStop(0, `rgba(${c},${gd.state === 'alert' ? 0.4 : 0.22})`);
      grad.addColorStop(1, `rgba(${c},0.03)`);
      tracePoly(ctx, gd, poly); ctx.fillStyle = grad; ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    for (const l of lasers) drawLaser(l);
    drawPathLine();
    if (marker && !player.chase) {
      ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 0.07;
      art.circle(ctx, marker.x, marker.y, 0.24 + Math.sin(time * 8) * 0.04); ctx.stroke();
    }
    for (const r of fx.ripples) {
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - r.t / 0.4)})`; ctx.lineWidth = 0.05;
      art.circle(ctx, r.x, r.y, 0.15 + r.t * 1.6); ctx.stroke();
    }

    // laser sights
    for (const gd of guards) {
      if (!gd.alive || !gd.laser || gd.frozen > 0) continue;
      const tip = gunTip(gd), c = Math.cos(gd.angle), sn = Math.sin(gd.angle);
      let d = 0;
      while (d < gd.range && !isWallAt(tip.x + c * d, tip.y + sn * d)) d += 0.05;
      ctx.strokeStyle = gd.state === 'alert' ? 'rgba(255,40,40,0.9)' : 'rgba(255,40,40,0.45)'; ctx.lineWidth = 0.025;
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x + c * d, tip.y + sn * d); ctx.stroke();
      ctx.fillStyle = '#ff3b3b'; art.circle(ctx, tip.x + c * d, tip.y + sn * d, 0.05); ctx.fill();
    }

    // characters
    for (const gd of guards) {
      if (!gd.alive) continue;
      art.drawCharacter(ctx, gd.look, gd.x, gd.y, gd.angle, { weapon: gd.weapon, walk: gd.walk, scale: CHAR_SCALE });
      if (gd.muzzle > 0) {
        const tip = gunTip(gd);
        ctx.fillStyle = '#fff2a8'; art.circle(ctx, tip.x, tip.y, 0.16); ctx.fill();
        ctx.fillStyle = '#ffb02e'; art.circle(ctx, tip.x, tip.y, 0.09); ctx.fill();
      }
      if (gd.frozen > 0) { ctx.save(); ctx.translate(gd.x, gd.y); ctx.scale(CHAR_SCALE, CHAR_SCALE); art.drawIce(ctx, 0, 0, gd.frozen); ctx.restore(); }
    }
    if (player.chase && player.chase.alive) drawChaseMarker(player.chase);
    const blink = player.hurtCd > 0 && Math.sin(time * 50) > 0;
    if (!(state === 'lost' && endTimer < 0.6)) {
      art.drawCharacter(ctx, player.look, player.x, player.y, player.angle, { weapon: 'knife', walk: player.walk, attack: player.attack > 0, alpha: blink ? 0.5 : 1, scale: CHAR_SCALE });
    }

    // effects
    for (const s of fx.slashes) {
      const k = s.t / 0.2;
      ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 0.14 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(s.x, s.y, 0.5, s.a - 1.3 + (1 - k) * 0.8, s.a + 0.6 + (1 - k) * 0.8); ctx.stroke();
    }
    for (const t of fx.tracers) {
      ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 0.05;
      ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke();
    }
    for (const r of fx.rings) {
      const k = r.t / r.max, rad = r.r * Math.sqrt(k);
      ctx.fillStyle = `rgba(120,220,255,${0.35 * (1 - k)})`; art.circle(ctx, r.x, r.y, rad); ctx.fill();
      ctx.strokeStyle = `rgba(230,250,255,${1 - k})`; ctx.lineWidth = 0.12 * (1 - k) + 0.02; ctx.stroke();
    }
    for (const p of fx.parts) {
      const k = p.t / p.max;
      ctx.globalAlpha = Math.min(1, k * 2);
      if (p.shard) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore();
      } else {
        ctx.fillStyle = p.c; art.circle(ctx, p.x, p.y, p.r + (p.grow ? (1 - k) * p.grow * 0.3 : 0)); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const g of fx.gems) art.drawGem(ctx, g.x, g.y, 0.13, g.rot);
    for (const f of fx.fireballs) {
      const k = f.t / f.max;
      const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (0.4 + k * 0.7));
      gr.addColorStop(0, `rgba(255,250,210,${1 - k})`); gr.addColorStop(0.35, `rgba(255,170,40,${0.9 * (1 - k)})`);
      gr.addColorStop(0.7, `rgba(230,70,20,${0.6 * (1 - k)})`); gr.addColorStop(1, 'rgba(120,30,10,0)');
      ctx.fillStyle = gr; art.circle(ctx, f.x, f.y, f.r * (0.4 + k * 0.7)); ctx.fill();
    }
    for (const sm of fx.smoke) {
      const k = sm.t / sm.max;
      ctx.fillStyle = `rgba(70,72,78,${0.55 * (1 - k)})`;
      art.circle(ctx, sm.x, sm.y, sm.r * (1 + k * 1.6)); ctx.fill();
    }

    // screen-space overlays
    for (const gd of guards) {
      if (!gd.alive || (gd.alertT <= 0 && gd.qT <= 0)) continue;
      const s = toScreen(gd.x, gd.y - 0.9);
      const pop = Math.min(1, (gd.alertT > 0 ? 1.2 - gd.alertT : 1 - gd.qT) * 8);
      screenText(gd.alertT > 0 ? '!' : '?', s.x + sx, s.y + sy, 30 * pop, gd.alertT > 0 ? '#ff4040' : '#ffc93c');
    }
    if (state === 'playing') {
      const s = toScreen(player.x, player.y + 0.72);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = 40, k = Math.max(0, player.hp / player.maxHp);
      ctx.fillStyle = '#1c1a2b'; ctx.fillRect(s.x - w / 2 - 2, s.y - 4, w + 4, 8);
      ctx.fillStyle = k > 0.5 ? '#3fd14a' : k > 0.25 ? '#ffb02e' : '#ff4040';
      ctx.fillRect(s.x - w / 2, s.y - 2, w * k, 4);
      screenText(String(Math.round(player.hp * HP_DISPLAY)), s.x, s.y, 11, '#ffffff');
    }
    for (const t of fx.texts) {
      const s = toScreen(t.x, t.y);
      const age = t.max - t.t;
      const pop = age < 0.12 ? age / 0.12 * 1.3 : Math.max(1, 1.3 - (age - 0.12) * 3);
      screenText(t.text, s.x + sx, s.y + sy, (t.big ? 34 : 24) * pop, t.color, { alpha: Math.min(1, t.t * 2.5) });
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const low = player.hp / player.maxHp;
    if (state === 'playing' && low < 0.35) {
      const a = 0.25 + Math.sin(time * 6) * 0.1;
      const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.height * 0.7);
      grad.addColorStop(0, 'rgba(255,0,0,0)'); grad.addColorStop(1, `rgba(200,0,0,${a})`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (hurtFlash > 0) { ctx.fillStyle = `rgba(255,30,30,${hurtFlash * 0.6})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }

  // ---------- Input ----------
  let pointerDown = false, lastTile = -1;
  function toWorld(e) { return { x: e.clientX / ts + cam.x, y: (e.clientY - HUD_H) / ts + cam.y }; }
  function onPointer(e, isDown) {
    if (state !== 'playing') return;
    const w = toWorld(e);
    if (isDown) {
      let target = null, best = 1.0;
      for (const gd of guards) {
        if (!gd.alive) continue;
        const d = Math.hypot(gd.x - w.x, gd.y - w.y);
        if (d < best) { best = d; target = gd; }
      }
      fx.ripples.push({ x: w.x, y: w.y, t: 0 });
      hideTip();
      if (target) {
        player.chase = target; player.repath = 0; marker = null; lastTile = -1;
        sfx.tap();
        return;
      }
      sfx.tap();
    }
    const tx = Math.floor(w.x), ty = Math.floor(w.y);
    if (!isDown && ty * W + tx === lastTile) return;
    lastTile = ty * W + tx;
    let cell = null, best = Infinity;
    for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) {
      if (isWallTile(x, y)) continue;
      const d = Math.hypot(x + 0.5 - w.x, y + 0.5 - w.y);
      if (d < best) { best = d; cell = { x, y }; }
    }
    if (!cell) return;
    const path = findPath(player, cell.x, cell.y);
    if (!path) return;
    player.chase = null;
    player.path = path; player.pi = 0;
    marker = { x: cell.x + 0.5, y: cell.y + 0.5 };
  }
  canvas.addEventListener('pointerdown', e => { pointerDown = true; lastTile = -1; onPointer(e, true); });
  canvas.addEventListener('pointermove', e => { if (pointerDown && player && !player.chase) onPointer(e, false); });
  window.addEventListener('pointerup', () => { pointerDown = false; });

  // ---------- UI ----------
  const $ = id => document.getElementById(id);
  const SCREENS = ['menu', 'heroes', 'result', 'pause'];
  function showScreen(id) {
    for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
    $('hud').classList.toggle('hidden', !(id === null || id === 'pause'));
  }
  function showBanner(title, sub) {
    const b = $('banner');
    b.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${sub}</div>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
  function showTip(html) {
    const t = $('tip');
    if (!html) { t.classList.add('hidden'); return; }
    t.innerHTML = `<span class="hand">👆</span><span>${html}</span>`;
    t.classList.remove('hidden');
  }
  function hideTip() { $('tip').classList.add('hidden'); }

  function buildHud() {
    $('hud-level').textContent = 'NIVEAU ' + save.level;
    updateHud();
  }
  let lastGemShown = -1;
  function updateHud() {
    const dead = guards.filter(g => !g.alive).length, kn = $('hud-kills-n');
    const txt = dead + '/' + guards.length;
    if (kn.textContent !== txt) {
      kn.textContent = txt;
      const el = $('hud-kills'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
    const gems = save.gems + levelGems;
    if (gems !== lastGemShown) {
      $('hud-gems').textContent = gems;
      if (lastGemShown >= 0 && gems > lastGemShown) {
        const el = $('hud-gembox'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      }
      lastGemShown = gems;
    }
  }

  function heroPortrait(look, size, opts) {
    const c = document.createElement('canvas');
    c.width = c.height = size * 2; c.style.width = c.style.height = size + 'px';
    art.drawPortrait(c, look, opts);
    return c;
  }

  function showMenu() {
    state = 'menu';
    $('menu-gems').textContent = save.gems;
    $('btn-play-level').textContent = 'NIVEAU ' + save.level;
    const holder = $('menu-hero');
    holder.innerHTML = '';
    holder.appendChild(heroPortrait(currentHero().look, 170));
    $('menu-hero-name').textContent = currentHero().name;
    refreshToggles();
    showScreen('menu');
  }

  function refreshToggles() {
    for (const k of ['sfx', 'music']) {
      document.querySelectorAll(`[data-toggle="${k}"]`).forEach(b => b.classList.toggle('off', !save[k]));
    }
  }
  function toggle(k) {
    save[k] = !save[k]; persist();
    audio.init(); audio.set({ sfx: save.sfx, music: save.music });
    refreshToggles();
  }
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => { toggle(b.dataset.toggle); sfx.button(); }));

  function renderHeroes() {
    $('heroes-gems').textContent = save.gems;
    const grid = $('heroes-grid');
    grid.innerHTML = '';
    for (const h of HEROES) {
      const owned = save.owned.includes(h.id), selected = save.selected === h.id;
      const card = document.createElement('button');
      card.className = 'hero-card' + (selected ? ' selected' : '') + (owned ? '' : ' locked');
      card.appendChild(heroPortrait(h.look, 84, { locked: !owned }));
      const name = document.createElement('div'); name.className = 'hero-name'; name.textContent = h.name;
      const lab = document.createElement('div'); lab.className = 'hero-label'; lab.textContent = selected ? 'ÉQUIPÉ' : h.label;
      if (h.spd && !selected) lab.classList.add('speed');
      if (h.hp && !h.spd && !selected) lab.classList.add('health');
      card.append(name, lab);
      if (!owned) {
        const price = document.createElement('div');
        price.className = 'hero-price' + (save.gems < h.price ? ' poor' : '');
        price.innerHTML = `<i class="gem-ico"></i>${h.price}`;
        card.appendChild(price);
      }
      card.onclick = () => {
        if (selected) return;
        if (owned) { save.selected = h.id; sfx.button(); }
        else if (save.gems >= h.price) { save.gems -= h.price; save.owned.push(h.id); save.selected = h.id; sfx.pickup(); }
        else { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); sfx.hurt(); return; }
        persist(); renderHeroes();
      };
      grid.appendChild(card);
    }
  }

  function showResult(won) {
    state = 'result';
    for (const g of fx.gems) levelGems++;
    fx.gems = [];
    const n = save.level;
    const k = player.hp / player.maxHp;
    const stars = won ? (!player.spotted ? 3 : k >= 0.5 ? 2 : 1) : 0;
    const bonus = won ? 5 * stars + 2 * n : 0;
    const total = levelGems + bonus;
    save.gems += total;
    if (won) { save.stars[n] = Math.max(save.stars[n] || 0, stars); save.level++; }
    persist();
    lastGemShown = -1;
    const box = $('result');
    box.classList.toggle('lost', !won);
    $('result-title').textContent = won ? 'MISSION RÉUSSIE !' : 'REPÉRÉ !';
    $('result-sub').textContent = won ? (stars === 3 ? 'Assassin parfait : jamais repéré !' : 'Reste dans l\'ombre pour 3 étoiles') : 'Les gardes t\'ont eu. Réessaie !';
    const starEls = [...document.querySelectorAll('#result .star')];
    starEls.forEach(s => s.classList.remove('on'));
    $('result-stars').classList.toggle('hidden', !won);
    starEls.forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); sfx.star(i); }, 350 + i * 300); });
    $('result-bonus').textContent = won ? `Butin ${levelGems} + bonus ${bonus}` : `Butin conservé : ${levelGems}`;
    const el = $('result-gems');
    const t0 = performance.now();
    let lastShown = 0;
    (function count(now) {
      const p = Math.min(1, (now - t0) / 900);
      const v = Math.round(total * p);
      el.textContent = '+' + v;
      if (v !== lastShown && v % 3 === 0) sfx.coin();
      lastShown = v;
      if (p < 1 && state === 'result') requestAnimationFrame(count);
    })(t0);
    $('btn-result').textContent = won ? 'SUIVANT' : 'REJOUER';
    showScreen('result');
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    showScreen('pause');
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'playing';
    showScreen(null);
  }

  const click = (id, fn) => $(id).addEventListener('click', () => { audio.init(); sfx.button(); fn(); });
  click('btn-play', startLevel);
  click('btn-heroes', () => { renderHeroes(); showScreen('heroes'); });
  click('btn-heroes-close', showMenu);
  click('btn-result', startLevel);
  click('btn-result-menu', showMenu);
  click('btn-pause', pause);
  click('btn-resume', resume);
  click('btn-restart', startLevel);
  click('btn-quit', showMenu);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); audio.suspend(); } else audio.resume();
  });

  // ---------- Main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  resize();
  showMenu();
  requestAnimationFrame(frame);

  // Hook for automated tests.
  window.__shadowStrike = {
    save, generateLevel, startLevel, kill, triggerFreeze, canSee, findPath, isWallTile, angleDiff, GUARD_TYPES,
    tick(n, dt = 1 / 60) { for (let i = 0; i < n; i++) update(dt); },
    get level() { return L; }, get time() { return time; },
    get state() { return state; }, get guards() { return guards; }, get player() { return player; },
    get mines() { return mines; }, get lasers() { return lasers; }, get bombs() { return bombs; },
  };
})();
