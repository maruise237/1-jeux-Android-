'use strict';
// Shadow Strike — © KamTech Studio
(() => {
  const { art, audio } = KT;
  const sfx = audio.sfx;
  const W = 11;
  let H = 19; // map height grows with the level (see levelHeight)
  const levelHeight = n => (n <= 3 ? 13 + n * 2 : 19 + Math.min(Math.floor((n - 1) / 3), 11));
  const SAVE_KEY = 'kamtech-shadowstrike-save-v2';
  const HP_DISPLAY = 10; // health is shown x10 (a base hero has 1000)
  const BODY_HOLD = 0.7, BODY_FADE = 0.45; // seconds a body stays, then dissolves
  const BASE_SPEED = 4.9, BASE_HP = 100, PLAYER_R = 0.3, CHAR_SCALE = 1.3;
  // Difficulty ceilings: levels get harder but always stay winnable.
  const MAX_RANGE = 4.2;         // flashlight reach (tiles)
  const MAX_GUARD_SPEED = 1.8;   // always well below the slowest hero (3.6)
  const MAX_HIT = 34, MAX_HIT_SHOTGUN = 45; // a base hero (100 HP) always survives 2 hits

  const HEROES = [
    { id: 'kenji', name: 'Kenji', label: 'Standard', spd: 0, hp: 0, price: 0, look: { blade: 'kunai', outfit: '#3b8f4a', outfit2: '#24552e', detail: 'vest', sleeve: 'short', skin: '#e8b48a', hair: 'spiky', hairColor: '#4a2f1d', headband: '#d63a3a', glove: '#2b2b33' } },
    { id: 'nova', name: 'Nova', label: '+10% Vie', spd: 0, hp: 0.1, price: 400, look: { outfit: '#f0b42a', detail: 'stripes', stripe: '#1c1a2b', skin: '#c98d5f', hair: 'bun', hairColor: '#1f1a1a', glove: '#2b2b33' } },
    { id: 'rex', name: 'Rex', label: '+20% Vitesse', spd: 0.2, hp: 0, price: 900, look: { outfit: '#d6463a', detail: 'jacket', sleeve: 'short', skin: '#f0c7a0', hair: 'mohawk', hairColor: '#2e8bff', glove: '#222222', eyes: 'angry' } },
    { id: 'lila', name: 'Lila', label: '+20% Vie', spd: 0, hp: 0.2, price: 900, look: { outfit: '#8e5ad6', detail: 'stripes', stripe: '#38d6d0', skin: '#f3cfb0', hair: 'pigtails', hairColor: '#38d6d0', accent: '#ff4f8b', glove: '#3a2350' } },
    { id: 'blaze', name: 'Blaze', label: '+30% Vitesse', spd: 0.3, hp: 0, price: 2000, look: { outfit: '#ff7a1a', outfit2: '#2a2a33', detail: 'vest', skin: '#a86f48', hair: 'cap', cap: '#1d4fd6', glove: '#2b2b33' } },
    { id: 'onyx', name: 'Onyx', label: '+40% Vie', spd: 0, hp: 0.4, price: 2000, look: { outfit: '#2b2d3a', detail: 'armor', accent: '#c0392b', sleeve: 'short', skin: '#7a4b2e', hair: 'bald', hairColor: '#1a1a1a', glove: '#c0392b', eyes: 'angry' } },
    { id: 'viper', name: 'Viper', label: '+40% Vitesse', spd: 0.4, hp: 0, price: 4500, look: { blade: 'venom', outfit: '#1fa37a', detail: 'stripes', stripe: '#0f3d30', hair: 'hood', hairColor: '#1fa37a', mask: '#e6f5ee', skin: '#e8b48a', glove: '#0f3d30' } },
    { id: 'frost', name: 'Frost', label: '+60% Vie', spd: 0, hp: 0.6, price: 4500, look: { blade: 'ice', outfit: '#6fd3ff', detail: 'armor', accent: '#e9f8ff', skin: '#bfe9ff', hair: 'spiky', hairColor: '#e9f8ff', glove: '#e9762b' } },
    { id: 'phantom', name: 'Phantom', label: '+35% Vitesse +30% Vie', spd: 0.35, hp: 0.3, price: 9000, look: { blade: 'crimson', outfit: '#d6245c', detail: 'stripes', stripe: '#1c1a2b', hair: 'hood', hairColor: '#d6245c', mask: '#f4f4f4', skin: '#f0c7a0', glove: '#222222' } },
    { id: 'kami', name: 'Kami', label: '+40% Vitesse +60% Vie', spd: 0.4, hp: 0.6, price: 18000, look: { blade: 'gold', outfit: '#1c1a2b', detail: 'cape', accent: '#f5c542', skin: '#e8b48a', hair: 'helmet', helmet: '#f5c542', visor: '#1c1a2b', glove: '#f5c542' } },
  ];
  for (const h of HEROES) h.look.id = 'hero-' + h.id;

  // ---------- Shop: what diamonds buy ----------
  // Prices follow docs/economie.md: a player earns ~22 000 diamonds over levels 1-60, then ~600 per level.
  // Early items fit in a few levels; the top of each track is a long-term goal.
  const UPGRADES = [
    { id: 'hp', name: 'Endurance', per: 0.06, text: n => `+${n * 6} % de vie` },
    { id: 'spd', name: 'Agilité', per: 0.03, text: n => `+${n * 3} % de vitesse` },
    { id: 'loot', name: 'Pillage', per: 0.08, text: n => `+${n * 8} % de diamants` },
    { id: 'crate', name: 'Crochetage', per: 0.12, text: n => `Caisses ${n * 12} % plus rapides` },
    { id: 'quiet', name: 'Discrétion', per: 0.08, text: n => `Éliminations ${n * 8} % plus silencieuses` },
  ];
  const UPG_COST = [300, 800, 1800, 3800, 7500];
  const KNIVES = [
    { id: 'hero', name: 'Lame du héros', blade: null, price: 0, perk: 'Aucun bonus', fx: {} },
    { id: 'kunai', name: 'Kunai', blade: 'kunai', price: 800, perk: '+5 % de diamants', fx: { loot: 0.05 } },
    { id: 'venom', name: 'Croc venimeux', blade: 'venom', price: 2000, perk: 'Éliminations 15 % plus silencieuses', fx: { quiet: 0.15 } },
    { id: 'ice', name: 'Lame de givre', blade: 'ice', price: 3500, perk: 'Caisses 20 % plus rapides', fx: { crate: 0.2 } },
    { id: 'crimson', name: 'Écarlate', blade: 'crimson', price: 6000, perk: '+12 % de diamants', fx: { loot: 0.12 } },
    { id: 'shadow', name: 'Lame d\'ombre', blade: 'shadow', price: 10000, perk: 'Éliminations 30 % plus silencieuses', fx: { quiet: 0.3 } },
    { id: 'gold', name: 'Lame d\'or', blade: 'gold', price: 16000, perk: '+20 % de diamants, 10 % plus silencieuse', fx: { loot: 0.2, quiet: 0.1 } },
    { id: 'plasma', name: 'Plasma', blade: 'plasma', price: 25000, perk: '+25 % de diamants, caisses 25 % plus rapides', fx: { loot: 0.25, crate: 0.25 } },
  ];
  const OUTFITS = [
    { id: 'base', name: 'Classique', price: 0, desc: 'La tenue d\'origine' },
    { id: 'night', name: 'Nuit', price: 700, desc: 'Noir mat et néon cyan', over: { outfit: '#262a36', outfit2: '#16181f', stripe: '#5ee7ff', accent: '#5ee7ff', headband: '#5ee7ff' } },
    { id: 'blood', name: 'Sang', price: 1500, desc: 'Rouge assassin', over: { outfit: '#b3122a', outfit2: '#5a0614', stripe: '#1c1a2b', accent: '#1c1a2b', headband: '#1c1a2b' } },
    { id: 'snow', name: 'Neige', price: 1500, desc: 'Blanc et bleu, pour les missions d\'hiver', over: { outfit: '#e9eef5', outfit2: '#9aa6b8', stripe: '#3d6bea', accent: '#3d6bea', headband: '#3d6bea' } },
    { id: 'royal', name: 'Royale', price: 4000, desc: 'Or et violet, la tenue des légendes', over: { outfit: '#f5c542', outfit2: '#a86d0a', stripe: '#1c1a2b', accent: '#7a3ad6', headband: '#7a3ad6' } },
  ];
  // the hero as he looks with his outfit (and, for the selected hero, the equipped knife)
  function heroLook(h, withKnife) {
    const o = OUTFITS.find(x => x.id === (save.outfit[h.id] || 'base')) || OUTFITS[0];
    const k = withKnife ? KNIVES.find(x => x.id === save.knife) : null;
    const L = { ...h.look };
    if (o.over) for (const [key, v] of Object.entries(o.over)) if (key === 'outfit' || key in h.look) L[key] = v;
    if (k && k.blade) L.blade = k.blade;
    L.id = `hero-${h.id}-${o.id}-${L.blade || 'steel'}`;
    return L;
  }
  // every bonus bought in the shop, combined
  function perks() {
    const u = save.upg, k = KNIVES.find(x => x.id === save.knife) || KNIVES[0];
    return {
      hp: 1 + 0.06 * u.hp, spd: 1 + 0.03 * u.spd,
      loot: 1 + 0.08 * u.loot + (k.fx.loot || 0),
      crate: 1 + 0.12 * u.crate + (k.fx.crate || 0),
      quiet: Math.max(0.4, 1 - 0.08 * u.quiet - (k.fx.quiet || 0)),
    };
  }
  let perk = { hp: 1, spd: 1, loot: 1, crate: 1, quiet: 1 };

  // Enemy roster: tougher types with better gear unlock as levels go up.
  const GUARD_TYPES = {
    thug: { name: 'Voyous', weapon: 'pistol', range: 1.0, half: 0.5, dmg: 1.0, rate: 0.5, reaction: 0.5, look: { outfit: '#2547b8', detail: 'stripes', stripe: '#ffffff', skin: '#a8714a', hair: 'short', hairColor: '#f2c230', glove: '#a8714a', eyes: 'angry', gun: '#6b6f7c' } },
    suit: { name: 'Agents en imperméable', weapon: 'smg', range: 0.95, half: 0.5, dmg: 0.85, rate: 0.38, reaction: 0.48, look: { outfit: '#8a6a4a', detail: 'coat', skin: '#d9a77c', hair: 'fedora', hat: '#6b4f35', band: '#2a1f16', glove: '#3a2a1e', gun: '#2f323b' } },
    prisoner: { name: 'Évadés armés', weapon: 'rifle', range: 1.15, half: 0.45, dmg: 1.1, rate: 0.5, reaction: 0.45, look: { outfit: '#ef7d2c', detail: 'prison', stripe: '#d4651c', sleeve: 'none', skin: '#c98d5f', hair: 'short', hairColor: '#2a2522', glove: '#c98d5f', eyes: 'angry', gun: '#3b3e47', furniture: '#8a5a2b', mag: '#2a2c33' } },
    soldier: { name: 'Soldats', weapon: 'rifle', range: 1.25, half: 0.42, dmg: 1.2, rate: 0.45, reaction: 0.4, look: { outfit: '#6b7a3a', detail: 'camo', skin: '#d9a77c', hair: 'helmet', helmet: '#56642c', visor: '#2b2f22', glove: '#2b2f22', pack: '#d8b23a', gun: '#3b3e47', furniture: '#4a5328', mag: '#b5c43a', scope: true } },
    heavy: { name: 'Colosses blindés', tip: 'Fusil à pompe : très dangereux de près, mais lents.', weapon: 'shotgun', range: 0.85, half: 0.75, dmg: 1.7, rate: 0.8, reaction: 0.4, look: { outfit: '#7a3d2a', detail: 'armor', accent: '#5b616e', skin: '#c98d5f', hair: 'helmet', helmet: '#c0392b', visor: '#20232e', glove: '#2a2a2a' } },
    shield: { name: 'Gardes à bouclier', tip: 'Invincibles de face : prends-les de dos ou gèle-les !', weapon: 'pistol', shield: true, range: 0.95, half: 0.5, dmg: 1.0, rate: 0.55, reaction: 0.5, look: { outfit: '#3a4a6a', detail: 'armor', accent: '#5b6b8a', skin: '#d9a77c', hair: 'helmet', helmet: '#2b3550', visor: '#9fd3ff', glove: '#1f232b', shield: true, shieldColor: '#6c7ea3', gun: '#2f323b' } },
    boss: { name: 'Le Colosse', weapon: 'cannon', range: 1.1, half: 0.6, dmg: 1.7, rate: 0.75, reaction: 0.45, look: { outfit: '#3d4a2a', detail: 'armor', accent: '#58613d', sleeve: 'none', skin: '#b07a50', hair: 'gasmask', hairColor: '#2a2a2a', mask: '#6b6f75', lens: '#7dff5a', crest: '#e8344a', glove: '#222222', gun: '#2f323b' } },
    elite: { name: 'Commandos d\'élite', weapon: 'energy', range: 1.35, half: 0.45, dmg: 1.4, rate: 0.45, reaction: 0.35, laser: true, look: { outfit: '#23252b', detail: 'vest', outfit2: '#33363f', skin: '#d9a77c', hair: 'helmet', helmet: '#1f232b', visor: '#ff3b3b', glove: '#1f232b', gun: '#2f6fd6', glow: '#5ee7ff' } },
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
    { name: 'Armes renforcées', dmg: 1.1, range: 1.05, gun: null },
    { name: 'Armes de précision', dmg: 1.2, range: 1.1, gun: '#3a4a6a', laser: true },
    { name: 'Armes en or', dmg: 1.3, range: 1.15, gun: '#f5c542', laser: true },
  ];
  const gearTier = n => Math.min(GEAR.length - 1, Math.floor((n - 1) / 10));
  const lookCache = {};
  function guardLook(type, tier) {
    const key = type + tier;
    if (!lookCache[key]) {
      const T = GUARD_TYPES[type];
      lookCache[key] = { ...T.look, id: 'guard-' + key, gun: GEAR[tier].gun || T.look.gun, wtier: tier };
    }
    return lookCache[key];
  }

  // ---------- Save ----------
  function loadSave() {
    const base = { level: 1, gems: 0, keys: 0, owned: ['kenji'], selected: 'kenji', sfx: true, music: true, vibe: true, stars: {}, tips: {} };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      let s = null;
      try { s = JSON.parse(raw); } catch (e) { localStorage.setItem(SAVE_KEY + '-bak', raw); } // keep a damaged save aside
      if (s && typeof s === 'object') {
        // only take fields with the expected type, so a damaged save can't freeze the game
        const obj = v => v && typeof v === 'object' && !Array.isArray(v);
        if (Number.isFinite(s.level) && s.level >= 1) base.level = Math.floor(s.level);
        if (Number.isFinite(s.gems) && s.gems >= 0) base.gems = Math.floor(s.gems);
        if (Number.isFinite(s.keys) && s.keys >= 0) base.keys = Math.min(2, Math.floor(s.keys));
        if (Array.isArray(s.owned)) base.owned = [...new Set(['kenji', ...s.owned.filter(x => typeof x === 'string')])];
        if (typeof s.selected === 'string' && base.owned.includes(s.selected)) base.selected = s.selected;
        for (const k of ['sfx', 'music', 'vibe']) if (typeof s[k] === 'boolean') base[k] = s[k];
        for (const k of ['stars', 'tips', 'missions', 'xp']) if (obj(s[k])) base[k] = s[k];
        if (Number.isFinite(s.unlock)) base.unlock = s.unlock;
        for (const k of Object.keys(s)) if (!(k in base)) base[k] = s[k];
      }
    } catch (e) { /* storage unavailable */ }
    return base;
  }
  const save = loadSave();
  {
    // shop data: keep only well-formed values from older or damaged saves
    const u = save.upg && typeof save.upg === 'object' ? save.upg : {};
    save.upg = {};
    for (const id of ['hp', 'spd', 'loot', 'crate', 'quiet']) save.upg[id] = Number.isFinite(u[id]) ? Math.max(0, Math.min(5, Math.floor(u[id]))) : 0;
    save.knives = Array.isArray(save.knives) ? [...new Set(['hero', ...save.knives.filter(x => typeof x === 'string')])] : ['hero'];
    if (typeof save.knife !== 'string' || !save.knives.includes(save.knife)) save.knife = 'hero';
    if (!save.outfits || typeof save.outfits !== 'object' || Array.isArray(save.outfits)) save.outfits = {};
    if (!save.outfit || typeof save.outfit !== 'object' || Array.isArray(save.outfit)) save.outfit = {};
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
  const currentHero = () => HEROES.find(h => h.id === save.selected) || HEROES[0];
  // Experience: every hero levels up from kills and wins (+4% health, +1.5% speed per level, max 20)
  const MAX_HERO_LV = 20;
  const heroXp = id => (save.xp && save.xp[id]) || 0;
  const xpFor = lv => 40 * (lv - 1) * (lv - 1);
  const heroLevel = id => { let lv = 1; while (lv < MAX_HERO_LV && heroXp(id) >= xpFor(lv + 1)) lv++; return lv; };
  const trainCost = lv => 50 + 15 * lv * lv; // 65 for level 2, 1550 for level 11, 5465 for level 20
  function addXp(id, n) { save.xp = save.xp || {}; const before = heroLevel(id); save.xp[id] = heroXp(id) + n; return heroLevel(id) > before; }
  audio.set({ sfx: save.sfx, music: save.music });

  // ---------- Grid & pathfinding ----------
  let grid = null;
  const isWallTile = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || grid[ty][tx] !== 0;
  const isWallAt = (px, py) => isWallTile(Math.floor(px), Math.floor(py));
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function dijkstra(g, sx, sy, extra) {
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
        const j = ny * W + nx, nd = bd + (dx && dy ? 1.4142 : 1) + (extra ? extra[j] : 0);
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
    let extra = null;
    if (from === player && lasers.length) {
      extra = new Float32Array(W * H);
      for (const l of lasers) for (const [cx, cy] of l.cells) extra[cy * W + cx] = 3;
    }
    const { dist, prev } = dijkstra(grid, sx, sy, extra);
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
        else if (r < 0.45) { type = 'planter'; w = 3; h = 3; }
        else if (r < 0.7) { type = 'metal'; w = 1; h = 1; }
        else { type = 'container'; if (rnd() < 0.5) { w = 2; h = 1; } else { w = 1; h = 2; } }
        const x = 1 + ri(W - 1 - w), y = 1 + ri(H - 4 - h);
        let ok = true;
        for (let yy = y; yy < y + h && ok; yy++) for (let xx = x; xx < x + w; xx++) if (g[yy][xx]) { ok = false; break; }
        if (!ok) continue;
        if (type === 'planter') {
          // grass is walkable (and hides the hero); only the stone in the middle is solid
          for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g[yy][xx] = 4;
          g[y + 1][x + 1] = 2;
        } else for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g[yy][xx] = 2;
        rects.push({ x, y, w, h, type });
        k++;
      }
      const hide = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === 4) { g[y][x] = 0; hide.push([x, y]); }
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
      // relief level after each boss (levels 11, 21, 31...): two guards fewer
      const nGuards = Math.min(n <= 2 ? n + 1 : 3 + Math.floor((n - 1) / 4) - (n > 10 && n % 10 === 1 ? 2 : 0), n >= 45 ? 10 : 9, Math.floor(open / 16));
      if (far.length < nGuards * 3) continue;
      // posts are spread over the whole map (best of several random picks, farthest from the others),
      // so guards never start bunched up in one corner
      const md = c => posts.reduce((m, p) => Math.min(m, Math.abs(p.x - c.x) + Math.abs(p.y - c.y)), 99);
      const posts = [];
      for (let k = 0; k < nGuards; k++) {
        let best = null, bs = -1;
        for (let sm = 0; sm < 16; sm++) {
          const c = pick(far), d = md(c);
          if (d < 4) continue;
          const sc = Math.min(d, 10) + rnd() * 2.5;
          if (sc > bs) { bs = sc; best = c; }
        }
        if (!best) break;
        posts.push(best);
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
      // each guard owns the area closest to his post and patrols a loop through it: guards cover the
      // whole map instead of walking over each other
      const owner = c => { let bi = 0, bd = 1e9; posts.forEach((p, i) => { const d = Math.abs(p.x - c.x) + Math.abs(p.y - c.y); if (d < bd) { bd = d; bi = i; } }); return bi; };
      let guards = posts.map((p, pi) => {
        const wps = [p];
        const span = c => Math.abs(c.x - p.x) + Math.abs(c.y - p.y);
        let zone = patrolCells.filter(c => span(c) >= 3 && span(c) <= 7 && owner(c) === pi);
        if (zone.length < 2) zone = patrolCells.filter(c => span(c) >= 2 && span(c) <= 6);
        const k = zone.length >= 6 ? 1 + ri(2) : 1;
        for (let q = 0; q < k && zone.length; q++) {
          // the next waypoint is the best of a few picks, far from the points already on the loop
          let best = null, bs = -1;
          for (let sm = 0; sm < 5; sm++) {
            const c = pick(zone);
            const d = wps.reduce((m, w) => Math.min(m, Math.abs(w.x - c.x) + Math.abs(w.y - c.y)), 99) + rnd();
            if (d > bs) { bs = d; best = c; }
          }
          wps.push(best);
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
      // from level 4, some guards patrol in pairs: the follower walks right behind its leader
      if (n >= 4) for (let i = 1; i < guards.length; i++) {
        if (guards[i - 1].follow == null && guards[i].type !== 'shield' && rnd() < Math.min(0.3 + 0.006 * Math.max(0, n - 20), 0.5)) {
          guards[i].follow = i - 1; guards[i].post = guards[i - 1].post; guards[i].route = guards[i - 1].route;
          guards[i].startAngle = guards[i - 1].startAngle;
        }
      }
      // every 10th level is a boss fight: the guard farthest from the spawn becomes the boss
      if (n % 10 === 0) {
        let bi = 0;
        guards.forEach((gd, i) => { if (gd.post.d > guards[bi].post.d) bi = i; });
        guards[bi].type = 'boss';
        for (const gd of guards) if (gd.follow === bi) delete gd.follow;
        if (guards[bi].follow != null) delete guards[bi].follow;
      }
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
        const want = n >= 40 ? 3 : n >= 10 ? 2 : 1;
        for (let tries = 0; tries < 30 && lasers.length < want && cands.length; tries++) {
          const c = cands.splice(ri(cands.length), 1)[0];
          if (c.cells.some(([x, y]) => isPost(x, y))) continue;
          lasers.push({ h: c.h, a: c.a, b: c.b, c: c.c, period: 3.2, on: Math.min(1.2 + 0.015 * n, 2.0), phase: rnd() * 3.2, cells: c.cells });
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
        pickups.push({ x: c.x + 0.5, y: c.y + 0.5, value: 6 + Math.floor(n / 4) });
      }
      let key = null;
      const kspots = pspots.filter(c => c.d >= 6);
      if (n >= 2 && rnd() < 0.5 && kspots.length) { const c = kspots[ri(kspots.length)]; key = { x: c.x + 0.5, y: c.y + 0.5 }; }
      const themes = ['interior', 'warehouse', 'garden', 'concrete', 'lab'];
      return { W, H, grid: g, rects, hide, key, start, guards, lasers, mines, bombs, pickups, theme: themes[Math.floor((n - 1) / 5) % themes.length], seed: n * 31 + 7 + variant };
    }
    throw new Error('level generation failed');
  }

  // ---------- State ----------
  let state = 'menu';
  let L = null, player = null, guards = [], lasers = [], mines = [], bombs = [], pickups = [], decals = [];
  let hideSet = new Set(), keyItem = null, spawnT = 0;
  let fx = null, levelGems = 0, shake = 0, endTimer = 0, hurtFlash = 0, time = 0, slowmo = 1, hitStop = 0, combo = 0, comboT = -9, heartT = 0;
  let marker = null, gemSoundCd = 0, mapCanvas = null, levelKey = 0;
  // loot counter floating above the hero: counts up as each gem is absorbed, then fades
  let introT = 0, loot = { n: 0, t: 9, pop: 0 }, gemStreak = 0, gemGap = 9, spawnLanded = false;
  const calmMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const cam = { x: 0, y: 0 }, lead = { x: 0, y: 0 };
  let camKick = { x: 0, y: 0 };
  const INTRO = 1.25, CRATE_R = 1.15;
  const resetFx = () => ({ parts: [], gems: [], texts: [], rings: [], tracers: [], ripples: [], slashes: [], smoke: [], fireballs: [] });
  fx = resetFx();

  function startLevel() {
    audio.init();
    const n = save.level;
    L = generateLevel(n, window.__variantOverride);
    H = L.H;
    grid = L.grid;
    const hero = currentHero();
    const hlv = heroLevel(hero.id);
    perk = perks();
    const maxHp = Math.round(BASE_HP * (1 + hero.hp) * (1 + 0.04 * (hlv - 1)) * perk.hp);
    player = {
      x: L.start.x + 0.5, y: L.start.y + 0.5, angle: -Math.PI / 2, speed: BASE_SPEED * (1 + hero.spd) * (1 + 0.01 * (hlv - 1)) * perk.spd,
      hp: maxHp, maxHp, look: heroLook(hero, true), path: null, pi: 0, walk: 0, chase: null, repath: 0,
      spotted: false, hurtCd: 0, attack: 0, dust: 0, frozen: 0,
    };
    const gSpeed = Math.min(1.5 + n * 0.025, MAX_GUARD_SPEED);
    // the first 30 levels got sharper guards; the late game was already at the edge of what the bot can win
    const sharp = n < 30;
    const baseRange = Math.min(3.25 + n * 0.04, 3.8);
    const baseDmg = 20 + Math.min(n, 14);
    const tier = gearTier(n), G = GEAR[tier];
    guards = L.guards.map((def, gi) => {
      const T = GUARD_TYPES[def.type];
      const route = def.route;
      return {
        x: def.post.x + 0.5, y: def.post.y + 0.5, angle: def.startAngle, route, ri: 0,
        state: 'patrol', path: null, pi: 0, timer: 0, reaction: 0, cooldown: 0, alive: true, lastSeen: null,
        speed: gSpeed * (def.type === 'heavy' ? 0.85 : def.type === 'boss' ? 0.8 : 1), range: Math.min(baseRange * T.range * G.range, MAX_RANGE), half: T.half,
        damage: Math.min(Math.round(baseDmg * T.dmg * G.dmg * (def.type === 'heavy' && tier >= 2 ? 1.15 : 1)), (T.weapon === 'shotgun' || T.weapon === 'cannon') ? MAX_HIT_SHOTGUN : MAX_HIT), shield: !!T.shield, rate: T.rate * (sharp ? 0.85 : 1), type: def.type, look: guardLook(def.type, tier), weapon: def.type === 'heavy' && tier >= 2 ? 'cannon' : T.weapon,
        reactTime: T.reaction, sharp, laser: !!(T.laser || (G.laser && T.weapon !== 'shotgun')),
        frozen: 0, walk: 0, muzzle: 0, alertT: 0, qT: 0, deadT: 0, follow: def.follow,
        boss: def.type === 'boss', hp: def.type === 'boss' ? 3 + Math.floor(n / 30) : 1, stun: 0, scale: def.type === 'boss' ? 1.45 : 1,
      };
    });
    lasers = L.lasers.map(l => ({ ...l }));
    mines = L.mines.map(m => ({ ...m, used: false, state: 'armed', fuse: 0 }));
    hideSet = new Set((L.hide || []).map(([x, y]) => y * W + x));
    keyItem = L.key ? { ...L.key, taken: false } : null;
    spawnT = 1.6; spawnLanded = false;
    bombs = (L.bombs || []).map(b => ({ ...b, state: 'armed', fuse: 0 }));
    decals = [];
    pickups = L.pickups.map(p => ({ ...p, taken: false, open: 0 }));
    fx = resetFx();
    levelGems = 0; levelKey = 0; shake = 0; endTimer = 0; hurtFlash = 0; time = 0; slowmo = 1; marker = null; hitStop = 0; combo = 0; comboT = -9;
    loot = { n: 0, t: 9, pop: 0 }; gemStreak = 0; gemGap = 9;
    buildMap();
    updateCamera(0, true);
    // opening shot: fade in over the top of the map, then glide down to the hero
    introT = INTRO; cam.y = 0;
    sfx.whoosh();
    state = 'playing';
    showScreen(null);
    buildHud();
    if (guards.some(g => g.boss)) { showBanner('COMBAT DE BOSS', `Abats le Colosse et ses gardes`); sfx.alert(); }
    else showBanner('NIVEAU ' + n, `Élimine ${guards.length} gardes`);
    let tip = null;
    const types = [...new Set(guards.map(g => g.type))];
    const newType = types.find(t => t !== 'thug' && !save.tips['enemy_' + t]);
    if (guards.some(g => g.boss) && !save.tips.boss) { tip = 'Boss : il faut plusieurs coups de couteau !<br>Après chaque coup il riposte : éloigne-toi puis reviens.'; save.tips.boss = 1; }
    else if (tier > 0 && !save.tips['gear' + tier]) { tip = `Les ennemis s'équipent : <b>${G.name}</b>.<br>Plus de dégâts et plus de portée.`; save.tips['gear' + tier] = 1; }
    else if (newType) tip = `Nouveaux ennemis : <b>${GUARD_TYPES[newType].name}</b>.` + (GUARD_TYPES[newType].tip ? '<br>' + GUARD_TYPES[newType].tip : '');
    else if (n === 1) tip = 'Touche le sol pour te déplacer.<br>Reste hors des <b>faisceaux de lumière</b> : un garde qui te voit tire.<br>Touche un garde <b>de dos</b> pour l\'éliminer.';
    else if (lasers.length && !save.tips.laser) { tip = 'Attention aux lasers rouges !<br>Passe quand ils sont éteints.'; save.tips.laser = 1; }
    else if (bombs.length && !save.tips.bomb) { tip = 'Mine explosive : passe dessus et fuis vite.<br>L\'explosion détruit les murs et tue tes poursuivants.'; save.tips.bomb = 1; }
    else if (mines.length && !save.tips.mine) { tip = 'Mine de glace : passe dessus quand on te poursuit,<br>elle gèle tout autour… toi aussi si tu restes près !'; save.tips.mine = 1; }
    else if (hideSet.size && !save.tips.grass) { tip = 'Cache-toi dans l\'herbe :<br>les gardes ne te voient pas.'; save.tips.grass = 1; }
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
  const inGrass = p => hideSet.has(Math.floor(p.y) * W + Math.floor(p.x));
  function canSee(gd, p) {
    if (gd.frozen > 0 || gd.stun > 0) return false;
    const dx = p.x - gd.x, dy = p.y - gd.y, d = Math.hypot(dx, dy);
    if (p === player && inGrass(p) && d > 1.1) return false;
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
          const c = p.chase;
          let tx = Math.floor(c.x), ty = Math.floor(c.y);
          if (c.shield) { // aim for the tile behind a shield guard
            const bx = Math.floor(c.x - Math.cos(c.angle)), by = Math.floor(c.y - Math.sin(c.angle));
            if (!isWallTile(bx, by) && Math.hypot(p.x - c.x, p.y - c.y) > 1.2) { tx = bx; ty = by; }
          }
          const path = findPath(p, tx, ty);
          if (path) { p.path = path; p.pi = 0; }
        }
      }
    }
    if (p.frozen > 0) {
      p.frozen -= dt;
      p.path = null; p.chase = null; marker = null;
      if (p.frozen <= 0) sfx.shatter();
    }
    const moving = p.frozen <= 0 && p.path && p.pi < p.path.length;
    if (p.frozen <= 0) followPath(p, p.speed, dt);
    if (moving) {
      const ph = Math.floor(p.walk / Math.PI);
      p.walk += dt * 14;
      if (Math.floor(p.walk / Math.PI) !== ph) sfx.step(inGrass(p));
      p.dust -= dt;
      if (p.dust <= 0) {
        p.dust = 0.11;
        fx.parts.push({ x: p.x - Math.cos(p.angle) * 0.25, y: p.y - Math.sin(p.angle) * 0.25, vx: 0, vy: 0, t: 0.4, max: 0.4, r: 0.09, c: 'rgba(120,120,135,0.5)', grow: 0.3 });
      }
    }
    if (p.path && p.pi >= p.path.length) { p.path = null; if (!p.chase) marker = null; }
    p.attack = Math.max(0, p.attack - dt);
    p.hurtCd = Math.max(0, p.hurtCd - dt);

    // loot crates open after standing next to them for a moment
    for (const pk of pickups) {
      if (pk.taken) continue;
      // stand on the loot: a ring fills up, then it bursts open
      const before = pk.open;
      if (Math.hypot(pk.x - p.x, pk.y - p.y) < CRATE_R) pk.open = Math.min(1, pk.open + dt * perk.crate / 0.8);
      else pk.open = Math.max(0, pk.open - dt * 2);
      if (Math.floor(before * 5) < Math.floor(pk.open * 5) && pk.open < 1) sfx.fillTick(pk.open);
      if (pk.open >= 1) {
        pk.taken = true;
        sfx.crate(); vibrate(35);
        shake = Math.max(shake, 0.12);
        // the crate bursts: flash, a bright ring, planks and steel bits, then the diamonds spill out
        fx.rings.push({ x: pk.x, y: pk.y, t: 0, max: 0.45, r: CRATE_R + 0.3, c: '120,255,170', thin: true });
        fx.parts.push({ x: pk.x, y: pk.y, vx: 0, vy: 0, t: 0.12, max: 0.12, r: 0.6, c: 'rgba(255,255,255,0.9)' });
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 3.5;
          fx.parts.push({ x: pk.x, y: pk.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.55, max: 0.55, r: 0.07 + Math.random() * 0.04, c: i % 3 ? '#3f6fd0' : '#c9d2e6', shard: true, rot: a });
        }
        spawnGems(pk.x, pk.y, Math.round(pk.value * perk.loot), 1.15, 0.45);
      }
    }
    if (keyItem && !keyItem.taken && Math.hypot(keyItem.x - p.x, keyItem.y - p.y) < 0.55) {
      keyItem.taken = true; levelKey = 1; sfx.pickup();
      fx.texts.push({ x: keyItem.x, y: keyItem.y - 0.3, text: 'Clé ' + Math.min(3, save.keys + 1) + '/3', color: '#ffd34d', t: 1.3, max: 1.3, big: true });
    }
    // freeze mine: arms when the hero runs over it, then freezes everything around (the hero too if still close)
    for (const m of mines) {
      if (m.state === 'armed' && Math.hypot(m.x - p.x, m.y - p.y) < 0.5) { m.state = 'fuse'; m.fuse = MINE_FUSE; m.tick = 0; sfx.arm(); }
    }
    for (const l of lasers) {
      if (p.hurtCd <= 0 && laserOn(l) && hitsLaser(l, p)) {
        // tripwire: the alarm brings the guards, and the beam burns a little
        sfx.laser(); p.hurtCd = 0.7; p.path = null; p.chase = null; marker = null;
        makeNoise(p.x, p.y, 5, 0.4);
        fx.texts.push({ x: p.x, y: p.y - 0.8, text: 'ALARME', color: '#ff5a4f', t: 1, max: 1 });
        damage(Math.round(p.maxHp * 0.08), true);
      }
    }
    p.blockCd = Math.max(0, (p.blockCd || 0) - dt);
    for (const gd of guards) {
      if (state !== 'playing' || !gd.alive || Math.hypot(gd.x - p.x, gd.y - p.y) >= (gd.boss ? 0.85 : 0.62)) continue;
      if (gd.boss && gd.hp > 1) { bossHit(gd); continue; }
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
    if (gd.stun > 0) {
      gd.stun -= dt; gd.angle += dt * 6;
      if (gd.stun <= 0) { gd.state = 'alert'; gd.reaction = 0.3; gd.angle = Math.atan2(player.y - gd.y, player.x - gd.x); }
      return;
    }
    if (gd.frozen > 0) {
      gd.frozen -= dt;
      if (gd.frozen <= 0) { gd.state = 'look'; gd.timer = 0.8; gd.lookBase = gd.angle; gd.lookT = 0; }
      return;
    }
    const ox = gd.x, oy = gd.y;
    stepGuard(gd, dt);
    if (Math.hypot(gd.x - ox, gd.y - oy) > 0.001) gd.walk += dt * 10;
  }

  // Guards hear noises (a buddy being stabbed, gunfire, explosions) through walls and come to check,
  // walking a bit faster than on patrol. Guards that can see the spot react sooner.
  function makeNoise(x, y, radius, hesitation, except) {
    let heard = false, sent = 0;
    // only the two closest guards leave their round to check; the others glance over and keep patrolling,
    // so one noise never pulls the whole map into a single pile
    const near = guards.filter(o => o !== except && o.alive && o.frozen <= 0 && o.stun <= 0 && o.state !== 'alert'
      && Math.hypot(o.x - x, o.y - y) <= radius).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    for (const o of near) {
      if (o.state === 'suspect' || o.state === 'search' || o.state === 'look') { heard = true; continue; }
      if (sent >= 2) { o.glance = { a: Math.atan2(y - o.y, x - o.x), t: 0.9 }; continue; }
      if (!findPath(o, Math.floor(x), Math.floor(y))) continue;
      sent++;
      const sees = sightLine(o, { x, y });
      o.state = 'suspect'; o.qT = 1.4; o.searchN = 0;
      o.timer = (sees ? hesitation * 0.6 : hesitation) + Math.random() * 0.25;
      o.lastSeen = { x, y };
      heard = true;
    }
    if (heard) sfx.suspect();
  }

  function nearestRouteIndex(gd) {
    let bi = 0, bd = Infinity;
    gd.route.forEach((q, i) => { const d = Math.hypot(q.x - gd.x, q.y - gd.y); if (d < bd) { bd = d; bi = i; } });
    return bi;
  }
  function goBackToRoute(gd) {
    gd.follow = gd.follow != null && guards[gd.follow] && guards[gd.follow].alive ? gd.follow : null;
    if (!gd.route.length) { gd.state = 'patrol'; return; }
    gd.ri = nearestRouteIndex(gd);
    const t = gd.route[gd.ri];
    gd.state = 'return'; gd.path = findPath(gd, Math.floor(t.x), Math.floor(t.y)) || [t]; gd.pi = 0;
  }
  // walk to a point (several guards going to the same spot spread around it instead of piling up)
  function goTo(gd, x, y, speedMul, nextState) {
    let tx = Math.floor(x), ty = Math.floor(y);
    const taken = guards.some(o => o !== gd && o.alive && o.goal && o.goal.x === tx && o.goal.y === ty);
    if (taken || isWallTile(tx, ty)) {
      const opts = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const cx = tx + dx, cy = ty + dy;
        if ((dx || dy) && !isWallTile(cx, cy) && !guards.some(o => o !== gd && o.alive && o.goal && o.goal.x === cx && o.goal.y === cy)) opts.push({ x: cx, y: cy });
      }
      if (opts.length) { const o = opts[Math.floor(Math.random() * opts.length)]; tx = o.x; ty = o.y; }
    }
    const path = findPath(gd, tx, ty);
    if (!path) { gd.goal = null; goBackToRoute(gd); return; }
    gd.goal = { x: tx, y: ty }; gd.path = path; gd.pi = 0; gd.moveMul = speedMul; gd.state = nextState;
  }
  // after reaching the spot: look left and right, then check one or two nearby corners before giving up
  function nextSearchSpot(gd) {
    const c = gd.lastSeen || gd, opts = [];
    for (let y = Math.floor(c.y) - 3; y <= Math.floor(c.y) + 3; y++) for (let x = Math.floor(c.x) - 3; x <= Math.floor(c.x) + 3; x++) {
      if (isWallTile(x, y)) continue;
      const d = Math.hypot(x + 0.5 - gd.x, y + 0.5 - gd.y);
      if (d > 1.4 && d < 3.6) opts.push({ x, y });
    }
    for (let k = 0; k < 6 && opts.length; k++) {
      const o = opts.splice(Math.floor(Math.random() * opts.length), 1)[0];
      const path = findPath(gd, o.x, o.y);
      if (path && path.length <= 5) { gd.goal = o; gd.path = path; gd.pi = 0; gd.moveMul = 1.15; gd.state = 'search'; return true; }
    }
    return false;
  }

  function stepGuard(gd, dt) {
    const seen = state === 'playing' && canSee(gd, player);
    if (seen) {
      if (gd.state !== 'alert') {
        // a guard who sees the hero reacts at once: short draw time, then he fires
        const dd = Math.hypot(player.x - gd.x, player.y - gd.y);
        gd.state = 'alert'; gd.reaction = Math.max(0.12, gd.reactTime * ((gd.sharp ? 0.4 : 0.5) + 0.45 * Math.min(1, dd / gd.range))); gd.alertT = 1.2; sfx.alert(); player.spotted = true;
        // he shouts: nearby guards come to help
        makeNoise(player.x, player.y, gd.sharp ? 4.4 : 3.6, 0.6, gd);
      }
      gd.lastSeen = { x: player.x, y: player.y };
      turnTo(gd, Math.atan2(player.y - gd.y, player.x - gd.x), dt * 10);
      gd.reaction -= dt; gd.cooldown -= dt;
      if (gd.reaction <= 0 && gd.cooldown <= 0) { shoot(gd); gd.cooldown = gd.rate; }
      return;
    }
    if (gd.state === 'alert') {
      // lost sight of the hero: run to where he was last seen
      if (!gd.lastSeen) gd.lastSeen = { x: gd.x, y: gd.y };
      gd.searchN = 0;
      goTo(gd, gd.lastSeen.x, gd.lastSeen.y, 1.4, 'search');
      if (gd.state !== 'search') return;
    }
    if (gd.state === 'suspect') {
      if (!gd.lastSeen) { goBackToRoute(gd); return; }
      turnTo(gd, Math.atan2(gd.lastSeen.y - gd.y, gd.lastSeen.x - gd.x), dt * 4);
      gd.timer -= dt;
      if (gd.timer <= 0) goTo(gd, gd.lastSeen.x, gd.lastSeen.y, 1.3, 'search');
      return;
    }
    if (gd.state === 'search') {
      if (followPath(gd, gd.speed * (gd.moveMul || 1.25), dt)) {
        gd.state = 'look'; gd.timer = 1.0; gd.lookBase = gd.angle; gd.lookT = 0;
      }
      return;
    }
    if (gd.state === 'look') {
      gd.timer -= dt; gd.lookT += dt;
      gd.angle = gd.lookBase + Math.sin(gd.lookT * 3.2) * 1.2;
      if (gd.timer <= 0) {
        gd.searchN = (gd.searchN || 0) + 1;
        if (gd.searchN > 1 || !nextSearchSpot(gd)) { gd.goal = null; goBackToRoute(gd); }
      }
      return;
    }
    if (gd.state === 'return') {
      if (followPath(gd, gd.speed, dt)) gd.state = 'patrol';
      return;
    }
    const leader = gd.follow != null ? guards[gd.follow] : null;
    if (leader && leader.alive && leader.frozen <= 0) {
      if (leader.state === 'patrol') {
        const t = { x: leader.x - Math.cos(leader.angle) * 0.9, y: leader.y - Math.sin(leader.angle) * 0.9 };
        if (Math.hypot(t.x - gd.x, t.y - gd.y) > 0.15 && !isWallAt(t.x, t.y) && clearLine(gd, t, 0.1)) moveTo(gd, t, gd.speed * 1.1, dt);
        else if (Math.hypot(leader.x - gd.x, leader.y - gd.y) > 1.6) { goTo(gd, leader.x, leader.y, 1.2, 'return'); return; }
        else turnTo(gd, leader.angle, dt * 4);
        gd.ri = leader.ri;
        return;
      }
      // the leader is checking something out: his partner goes with him
      if (leader.lastSeen && (leader.state === 'suspect' || leader.state === 'search' || leader.state === 'look')) {
        gd.lastSeen = { ...leader.lastSeen }; gd.state = 'suspect'; gd.timer = 0.3; gd.searchN = 0; return;
      }
    }
    if (gd.glance) {
      // heard something far off: turn toward it for a moment, then carry on
      gd.glance.t -= dt; turnTo(gd, gd.glance.a, dt * 6);
      if (gd.glance.t <= 0) gd.glance = null;
      return;
    }
    if (!gd.route.length) return;
    // lost the route (pushed away, leader gone): walk back along a real path instead of through walls
    if (!clearLine(gd, gd.route[gd.ri], 0.1)) { goBackToRoute(gd); return; }
    if (moveTo(gd, gd.route[gd.ri], gd.speed, dt)) gd.ri = (gd.ri + 1) % gd.route.length;
  }

  // Guards never stand inside each other; a guard that stops moving for too long picks a new path.
  function separateGuards(dt) {
    const live = guards.filter(g => g.alive && g.frozen <= 0 && g.stun <= 0);
    // only guards standing still (looking around, hesitating) are spread apart: pushing walking guards
    // could keep two of them from ever reaching the same waypoint
    const idle = g => g.state === 'look' || g.state === 'suspect';
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (!idle(a) || !idle(b)) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= 0.5 || d < 1e-4) continue;
      const push = (0.5 - d) / 2, ux = dx / d * push, uy = dy / d * push;
      if (!isWallAt(a.x - ux, a.y - uy)) { a.x -= ux; a.y -= uy; }
      if (!isWallAt(b.x + ux, b.y + uy)) { b.x += ux; b.y += uy; }
    }
    for (const g of live) {
      const busy = g.state === 'search' || g.state === 'return' || (g.state === 'patrol' && g.follow == null && g.route.length);
      if (!busy) { g.stuckT = 0; g.stuckAt = { x: g.x, y: g.y }; continue; }
      if (!g.stuckAt || Math.hypot(g.x - g.stuckAt.x, g.y - g.stuckAt.y) > 0.25) { g.stuckAt = { x: g.x, y: g.y }; g.stuckT = 0; continue; }
      g.stuckT = (g.stuckT || 0) + dt;
      if (g.stuckT > 1.5) {
        g.stuckT = 0; g.goal = null; goBackToRoute(g);
        // still blocked on the same waypoint: skip to the next one
        if (g.route.length > 1 && Math.hypot(g.route[g.ri].x - g.x, g.route[g.ri].y - g.y) < 0.6) {
          g.ri = (g.ri + 1) % g.route.length; const t = g.route[g.ri];
          g.path = findPath(g, Math.floor(t.x), Math.floor(t.y)) || [t]; g.pi = 0;
        }
      }
    }
  }

  function gunTip(gd) {
    const m = art.muzzle(gd.weapon);
    const c = Math.cos(gd.angle), sn = Math.sin(gd.angle);
    const k = CHAR_SCALE * (gd.scale || 1);
    return { x: gd.x + (c * m.x - sn * m.y) * k, y: gd.y + (sn * m.x + c * m.y) * k };
  }

  function shoot(gd) {
    gd.muzzle = 0.08;
    const tip = gunTip(gd);
    const pellets = gd.weapon === 'shotgun' ? 3 : gd.weapon === 'smg' ? 2 : 1;
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
    sfx.shot(gd.weapon, Math.hypot(gd.x - player.x, gd.y - player.y));
    damage(gd.damage);
  }

  function damage(amount, silent) {
    if (state !== 'playing') return;
    player.hp -= amount;
    fx.texts.push({ x: player.x + (Math.random() - 0.5) * 0.4, y: player.y - 0.5, text: '-' + Math.round(amount * HP_DISPLAY), color: '#ff4040', t: 0.9, max: 0.9 });
    if (!silent) player.spotted = true;
    hurtFlash = 0.35; shake = Math.max(shake, 0.25);
    sfx.hurt(); vibrate(45);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      fx.parts.push({ x: player.x, y: player.y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, t: 0.3, max: 0.3, r: 0.06, c: '#ff5a4f' });
    }
    if (player.hp <= 0) { player.hp = 0; finish(false); }
  }

  // The boss takes several stabs: each one staggers him and knocks the hero back, then he fights back.
  function bossHit(gd) {
    const p = player;
    if (p.blockCd > 0) return;
    p.blockCd = 0.5;
    gd.hp--; gd.stun = 0.8; gd.state = 'alert'; gd.lastSeen = { x: p.x, y: p.y };
    const dx = p.x - gd.x, dy = p.y - gd.y, d = Math.hypot(dx, dy) || 1;
    for (let k = 1.1; k > 0; k -= 0.1) {
      const nx = p.x + dx / d * k, ny = p.y + dy / d * k;
      if (clearLine(p, { x: nx, y: ny }, PLAYER_R * 0.9)) { p.x = nx; p.y = ny; break; }
    }
    p.path = null; p.chase = null; marker = null; p.attack = 0.2;
    fx.slashes.push({ x: gd.x, y: gd.y, a: Math.atan2(-dy, -dx), t: 0.2 });
    addSplat(gd.x + (Math.random() - 0.5) * 0.4, gd.y + (Math.random() - 0.5) * 0.4, 0.22);
    fx.texts.push({ x: gd.x, y: gd.y - 0.8, text: 'TOUCHÉ !', color: '#ffd34d', t: 1, max: 1, big: true });
    sfx.kill(); vibrate(60); shake = Math.max(shake, 0.3);
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
      gd.vanish = true; // shattered into shards: nothing left to lie down
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
    let gain = 4 + Math.floor(Math.random() * 4) + Math.floor(save.level / 5);
    // knife kills freeze the action for a split second and flash the victim: every kill lands
    if (!byBlast) {
      hitStop = 0.06;
      fx.parts.push({ x: gd.x, y: gd.y, vx: 0, vy: 0, t: 0.09, max: 0.09, r: 0.55, c: 'rgba(255,255,255,0.85)' });
      const a = player.angle;
      camKick = { x: Math.cos(a) * 0.12, y: Math.sin(a) * 0.12 };
    }
    // kill streaks: chained kills within 2.5 s give a small bonus
    combo = time - comboT < 2.5 ? combo + 1 : 1;
    comboT = time;
    if (combo >= 2) {
      const label = combo === 2 ? 'DOUBLE !' : combo === 3 ? 'TRIPLE !' : 'MULTI ×' + combo;
      const bonus = 2 * combo;
      gain += bonus;
      fx.texts.push({ x: gd.x, y: gd.y - 1.0, text: label, color: '#ffd34d', t: 1.3, max: 1.3, big: true });
      sfx.combo(combo);
    }
    spawnGems(gd.x, gd.y, Math.round(gain * perk.loot));
    fx.rings.push({ x: gd.x, y: gd.y, t: 0, max: 0.35, r: 0.9, c: '255,90,70', thin: true });
    shake = Math.max(shake, 0.15);
    vibrate(30);
    // the victim's cry: guards nearby hear it and come to look (frozen victims shatter silently)
    if (!wasFrozen || byBlast) makeNoise(gd.x, gd.y, (gd.boss ? 4.5 : 3.3) * perk.quiet, 0.7);
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
    // the shield guard is armed: bumping into him from the front makes him open fire at once
    gd.state = 'alert'; gd.reaction = 0.08; gd.cooldown = 0; gd.alertT = 1.2;
    gd.lastSeen = { x: p.x, y: p.y };
    sfx.clang(); vibrate(50);
    shake = Math.max(shake, 0.2);
    const sx = gd.x + Math.cos(gd.angle) * 0.5, sy = gd.y + Math.sin(gd.angle) * 0.5;
    for (let i = 0; i < 12; i++) {
      const a = gd.angle + (Math.random() - 0.5) * 2, v = 2 + Math.random() * 3;
      fx.parts.push({ x: sx, y: sy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.3, max: 0.3, r: 0.045, c: '#ffe27a' });
    }
    fx.texts.push({ x: gd.x, y: gd.y - 0.5, text: 'BLOQUÉ !', color: '#ffd34d', t: 1, max: 1 });
  }

  function updateMines(dt) {
    for (const m of mines) {
      if (m.state !== 'fuse') continue;
      m.fuse -= dt; m.tick = (m.tick || 0) - dt;
      // cold chirps that speed up until the burst
      if (m.tick <= 0) { const k = 1 - m.fuse / MINE_FUSE; sfx.tick(k, true); m.tick = 0.05 + 0.13 * (1 - k); m.flash = 0.06; }
      m.flash = Math.max(0, (m.flash || 0) - dt);
      if (m.fuse <= 0) triggerFreeze(m);
    }
  }

  function updateBombs(dt) {
    for (const b of bombs) {
      if (b.state === 'armed') {
        // only the hero sets it off; the short fuse lets him run while his pursuers get caught
        if (state === 'playing' && Math.hypot(player.x - b.x, player.y - b.y) < 0.45) { b.state = 'fuse'; b.fuse = BOMB_FUSE; b.tick = 0; sfx.arm(); }
      } else if (b.state === 'fuse') {
        // like a real mine: tit... tit.. tit. tit-tit-tit, faster and higher until it blows
        b.fuse -= dt; b.tick -= dt;
        if (b.tick <= 0) { const k = 1 - b.fuse / BOMB_FUSE; sfx.tick(k); b.tick = 0.045 + 0.24 * Math.pow(1 - k, 1.4); b.flash = 0.07; vibrate(8); }
        b.flash = Math.max(0, (b.flash || 0) - dt);
        if (b.fuse <= 0) explode(b);
      }
    }
  }

  function explode(b) {
    b.state = 'done';
    const R = BLAST_R;
    sfx.explosion(); vibrate(150);
    makeNoise(b.x, b.y, 5, 0.4);
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
    for (let i = 0; i < 14; i++) {
      fx.smoke.push({ x: b.x + (Math.random() - 0.5) * 0.4, y: b.y, vx: (Math.random() - 0.5) * 0.15, vy: -0.9 - i * 0.25, r: 0.3 + i * 0.03, t: -i * 0.08, max: 3.2, column: true });
    }
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
    if (pd < R && state === 'playing') damage(Math.round(player.maxHp * 0.45 * (1 - pd / R * 0.5)), true);
    for (const gd of guards) {
      if (!gd.alive || Math.hypot(gd.x - b.x, gd.y - b.y) >= R) continue;
      if (gd.boss && gd.hp > 2) { gd.hp -= 2; gd.stun = 1.2; } else kill(gd, true);
    }
    for (const o of guards) {
      if (!o.alive || o.frozen > 0 || o.state !== 'patrol') continue;
      if (Math.hypot(o.x - b.x, o.y - b.y) < 4) { o.state = 'suspect'; o.timer = 0.8; o.qT = 1.2; o.lastSeen = { x: b.x, y: b.y }; }
    }
  }

  // gems pop out in a little fountain (they hop and bounce), then get pulled into the hero
  function spawnGems(x, y, n, spread = 1, hold = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (1.6 + Math.random() * 3) * spread;
      fx.gems.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 0, vz: 3 + Math.random() * 2.5, t: -i * 0.012, rot: Math.random() * 6, hold });
    }
  }

  const FREEZE_R = 2.3, MINE_FUSE = 0.8, BOMB_FUSE = 1.6, BLAST_R = 1.9;
  function triggerFreeze(m) {
    m.used = true; m.state = 'used';
    sfx.freeze(); vibrate(60);
    fx.rings.push({ x: m.x, y: m.y, t: 0, max: 0.55, r: FREEZE_R });
    decals.push({ kind: 'frost', x: m.x, y: m.y, r: FREEZE_R, t: 6 });
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      fx.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.7, max: 0.7, r: 0.07, c: '#d6f6ff', shard: true, rot: a });
    }
    shake = Math.max(shake, 0.2);
    for (const gd of guards) {
      if (gd.alive && Math.hypot(gd.x - m.x, gd.y - m.y) < FREEZE_R) { gd.frozen = 4.5; gd.state = 'patrol'; gd.path = null; }
    }
    if (state === 'playing' && Math.hypot(player.x - m.x, player.y - m.y) < FREEZE_R) {
      player.frozen = 2.5;
      fx.texts.push({ x: player.x, y: player.y - 0.6, text: 'GELÉ !', color: '#8fe3ff', t: 1.2, max: 1.2, big: true });
    }
  }

  function finish(won) {
    if (state !== 'playing') return;
    state = won ? 'won' : 'lost';
    endTimer = won ? 1.3 : 1.1;
    slowmo = 0.35;
    player.path = null; player.chase = null; marker = null;
    if (won) { sfx.win(); showBanner('TERMINÉ !', '', 'clear'); } else sfx.lose();
  }

  function vibrate(ms) { if (save.vibe === false) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

  let lastKeysHtml = '';
  function updateFx(dt) {
    for (const p of fx.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.t -= dt; }
    fx.parts = fx.parts.filter(p => p.t > 0);
    gemSoundCd -= dt;
    for (const d of decals) {
      if (d.kind === 'frost') d.t -= dt;
      else if (d.kind === 'blood') d.t = Math.min(1, d.t + dt * 2);
    }
    if (decals.some(d => d.kind === 'frost' && d.t <= 0)) decals = decals.filter(d => d.kind !== 'frost' || d.t > 0);
    gemGap += dt;
    if (gemGap > 0.4) gemStreak = 0;
    loot.t += dt; loot.pop = Math.max(0, loot.pop - dt * 6);
    if (loot.t > 1.1) loot.n = 0;
    for (const g of fx.gems) {
      g.t += dt; g.rot += dt * 6;
      if (g.t < 0) continue;
      if (g.t < 0.5 + (g.hold || 0)) {
        g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= 0.88; g.vy *= 0.88;
        g.z += g.vz * dt; g.vz -= 22 * dt;
        if (g.z < 0) { g.z = 0; g.vz = Math.abs(g.vz) * 0.35; }
      } else {
        g.z *= Math.exp(-dt * 8);
        const dx = player.x - g.x, dy = player.y - g.y, d = Math.hypot(dx, dy);
        const sp = 4 + (g.t - 0.5 - (g.hold || 0)) * 24;
        if (d < 0.3 || d < sp * dt) {
          g.done = true; levelGems++;
          loot.n++; loot.t = 0; loot.pop = 1;
          gemStreak++; gemGap = 0;
          if (gemSoundCd <= 0) { sfx.gem(gemStreak); gemSoundCd = 0.045; }
          fx.parts.push({ x: player.x, y: player.y - 0.1, vx: 0, vy: 0, t: 0.18, max: 0.18, r: 0.12, c: 'rgba(160,240,255,0.7)', grow: 1.2 });
        } else { g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
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
    for (const sm of fx.smoke) { sm.t += dt; if (sm.t < 0) continue; sm.x += sm.vx * dt; sm.y += sm.vy * dt; sm.vx *= 0.97; sm.vy *= sm.column ? 0.995 : 0.97; }
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
    hitStop = Math.max(0, hitStop - rawDt);
    const dt = rawDt * (state === 'playing' ? (hitStop > 0 ? 0.06 : 1) : slowmo);
    time += dt;
    if (state === 'playing') updatePlayer(dt);
    // music follows the action; a heartbeat warns when health is low
    audio.setTension(state === 'playing' && guards.some(g => g.alive && g.state === 'alert') ? 1 : 0);
    if (state === 'playing' && player.hp / player.maxHp < 0.35) {
      heartT -= rawDt;
      if (heartT <= 0) { sfx.heart(); heartT = 0.95; }
    } else heartT = 0;
    if (state === 'playing' || state === 'won' || state === 'lost') {
      for (const gd of guards) updateGuard(gd, dt);
      separateGuards(dt);
      updateBombs(dt);
      updateMines(dt);
      updateFx(dt);
      updateHud();
    }
    updateCamera(rawDt, false);
    if (introT > 0) introT = Math.max(0, introT - rawDt);
    spawnT = Math.max(0, spawnT - rawDt);
    if (!spawnLanded && spawnT < 1.6 * 0.62) { spawnLanded = true; sfx.spawn(); }
    shake = Math.max(0, shake - rawDt);
    camKick.x *= Math.exp(-rawDt * 14); camKick.y *= Math.exp(-rawDt * 14);
    hurtFlash = Math.max(0, hurtFlash - rawDt);
  }

  // ---------- Camera & canvas ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const shadeCanvas = document.createElement('canvas');
  const sctx = shadeCanvas.getContext('2d');
  const NIGHT = {
    concrete: 'rgba(10,14,34,0.4)', warehouse: 'rgba(28,18,12,0.4)', lab: 'rgba(6,18,40,0.36)',
    interior: 'rgba(6,14,30,0.4)', garden: 'rgba(6,20,14,0.36)',
  };
  // darkened screen corners, rebuilt only when the canvas size changes
  let vigCanvas = null;
  function vignette(w, h) {
    if (vigCanvas && vigCanvas.width === w && vigCanvas.height === h) return vigCanvas;
    vigCanvas = document.createElement('canvas'); vigCanvas.width = w; vigCanvas.height = h;
    const v = vigCanvas.getContext('2d'), r = Math.hypot(w, h) / 2;
    const gr = v.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.38)');
    v.fillStyle = gr; v.fillRect(0, 0, w, h);
    return vigCanvas;
  }
  let dpr = 1, cw = 0, ch = 0, ts = 40;
  const HUD_H = 64;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    shadeCanvas.width = canvas.width >> 1; shadeCanvas.height = canvas.height >> 1; // soft layer, half resolution
    const fit = Math.min(cw / W, (ch - HUD_H) / H);
    ts = Math.max(fit, Math.min(cw / 9, (ch - HUD_H) / 13));
    art.setResolution(ts * dpr * CHAR_SCALE);
    if (L) { buildMap(); updateCamera(0, true); }
  }
  function buildMap() { mapCanvas = art.renderMap(L, ts * dpr); }

  function updateCamera(dt, snap) {
    if (!player) return;
    const vw = cw / ts, vh = (ch - HUD_H) / ts;
    // look-ahead: the camera leans up to one tile towards where the hero is heading
    const moving = state === 'playing' && player.path && player.pi < player.path.length;
    const kl = 1 - Math.exp(-dt * 2.5);
    lead.x += ((moving ? Math.cos(player.angle) : 0) - lead.x) * kl;
    lead.y += ((moving ? Math.sin(player.angle) * 1.3 : 0) - lead.y) * kl;
    if (snap) { lead.x = 0; lead.y = 0; }
    const tx = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, player.x + lead.x - vw / 2));
    const ty = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, player.y + lead.y - vh / 2));
    if (snap) { cam.x = tx; cam.y = ty; return; }
    // during the opening shot the camera glides slowly, then settles into its normal follow
    const k = 1 - Math.exp(-dt * (introT > 0 ? 3.2 : 6));
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

  function worldTransform(g, sx, sy, k = 1) {
    const d = dpr * k;
    g.setTransform(d * ts, 0, 0, d * ts, d * (-cam.x * ts + sx), d * (HUD_H - cam.y * ts + sy));
  }

  // Ground shadow shared by the traps, so they sit on the floor instead of being painted on it.
  function trapShadow(x, y, r) {
    const sh = ctx.createRadialGradient(x + 0.05, y + 0.08, r * 0.6, x + 0.05, y + 0.08, r * 1.15);
    sh.addColorStop(0, 'rgba(0,0,0,0.38)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; art.circle(ctx, x + 0.05, y + 0.08, r * 1.15); ctx.fill();
  }
  // Brushed-metal disc lit from the top left.
  function metalDisc(x, y, r, light, dark) {
    const gr = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r);
    gr.addColorStop(0, light); gr.addColorStop(1, dark);
    art.circle(ctx, x, y, r); ctx.fillStyle = gr; ctx.fill();
  }

  // Freeze mine: a squat cryo canister with a frosted glass dome and four bolts.
  function drawMine(m) {
    const fuse = m.state === 'fuse';
    const pulse = 0.5 + Math.sin(time * (fuse ? 35 : 3)) * 0.5;
    if (fuse) { ctx.strokeStyle = `rgba(150,230,255,${0.5 + pulse * 0.4})`; ctx.lineWidth = 0.05; art.circle(ctx, m.x, m.y, FREEZE_R * (1 - m.fuse / MINE_FUSE)); ctx.stroke(); }
    // frost on the floor around it
    const fr = ctx.createRadialGradient(m.x, m.y, 0.15, m.x, m.y, 0.75);
    fr.addColorStop(0, `rgba(40,160,255,${0.6 + pulse * 0.15 + (m.flash > 0 ? 0.3 : 0)})`); fr.addColorStop(1, 'rgba(60,170,255,0)');
    ctx.fillStyle = fr; art.circle(ctx, m.x, m.y, 0.75); ctx.fill();
    // a canister with height: cast shadow along the light, a dark side wall, then the lid
    const sh = ctx.createRadialGradient(m.x + 0.14, m.y + 0.2, 0.12, m.x + 0.14, m.y + 0.2, 0.42);
    sh.addColorStop(0, 'rgba(0,0,0,0.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; art.ellipse(ctx, m.x + 0.14, m.y + 0.2, 0.42, 0.36); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; art.ellipse(ctx, m.x, m.y + 0.1, 0.32, 0.29); ctx.fill();
    const side = ctx.createLinearGradient(m.x - 0.3, 0, m.x + 0.3, 0);
    side.addColorStop(0, '#1f64c4'); side.addColorStop(0.35, '#3d8ef0'); side.addColorStop(1, '#0d2f6e');
    ctx.fillStyle = side; ctx.beginPath();
    ctx.arc(m.x, m.y + 0.09, 0.3, 0, Math.PI); ctx.lineTo(m.x - 0.3, m.y); ctx.arc(m.x, m.y, 0.3, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 0.035; ctx.strokeStyle = art.OUT; ctx.beginPath(); ctx.arc(m.x, m.y + 0.09, 0.3, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.015;
    for (const fx2 of [-0.18, 0, 0.18]) { ctx.beginPath(); ctx.moveTo(m.x + fx2, m.y + 0.2); ctx.lineTo(m.x + fx2, m.y + 0.31); ctx.stroke(); }
    metalDisc(m.x, m.y, 0.3, '#8fd0ff', '#1a5bc0');
    ctx.lineWidth = 0.035; ctx.strokeStyle = art.OUT; art.circle(ctx, m.x, m.y, 0.3); ctx.stroke();
    // bevelled rim
    ctx.lineWidth = 0.03; ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(m.x, m.y, 0.26, Math.PI * 0.95, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(m.x, m.y, 0.26, -0.2, Math.PI * 0.8); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + Math.PI / 2 * i, bx = m.x + Math.cos(a) * 0.23, by = m.y + Math.sin(a) * 0.23;
      metalDisc(bx, by, 0.03, '#e3e8ef', '#4a5361');
    }
    // glass dome with the coolant swirling inside
    const dg = ctx.createRadialGradient(m.x - 0.06, m.y - 0.07, 0.01, m.x, m.y, 0.17);
    dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.3, '#9fe6ff'); dg.addColorStop(1, m.flash > 0 ? '#ffffff' : fuse ? '#3fd0ff' : '#0f8cff');
    art.circle(ctx, m.x, m.y, 0.17); ctx.fillStyle = dg; ctx.fill();
    ctx.lineWidth = 0.03; ctx.strokeStyle = '#1d3550'; ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.3})`; ctx.lineWidth = 0.02; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = time * 1.4 + i * 2.1;
      ctx.beginPath(); ctx.arc(m.x, m.y, 0.07 + i * 0.025, a, a + 1.2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; art.ellipse(ctx, m.x - 0.06, m.y - 0.08, 0.045, 0.025); ctx.fill();
    // status light
    art.circle(ctx, m.x + 0.2, m.y - 0.2, 0.035); ctx.fillStyle = fuse ? (pulse > 0.5 ? '#ffffff' : '#5ee7ff') : (pulse > 0.8 ? '#7dffb0' : '#1f6b45'); ctx.fill();
    // cold vapour
    for (let i = 0; i < 3; i++) {
      const t = (time * 0.6 + i / 3) % 1, a = i * 2.3 + m.x;
      ctx.fillStyle = `rgba(235,250,255,${0.35 * (1 - t)})`;
      art.circle(ctx, m.x + Math.cos(a) * (0.2 + t * 0.25), m.y + Math.sin(a) * (0.2 + t * 0.25) - t * 0.15, 0.05 + t * 0.06); ctx.fill();
    }
  }

  // Explosive mine: an olive anti-personnel mine half buried in loose dirt, with a ribbed rim and a pressure plate.
  function drawBomb(b) {
    const fuse = b.state === 'fuse';
    const blink = fuse ? b.flash > 0 : Math.sin(time * 4) > 0.6;
    if (fuse) {
      // blast zone fills in as the countdown runs out
      const k = 1 - b.fuse / BOMB_FUSE;
      ctx.fillStyle = `rgba(255,40,40,${0.1 + k * 0.18 + (b.flash > 0 ? 0.1 : 0)})`; art.circle(ctx, b.x, b.y, BLAST_R * k); ctx.fill();
      ctx.strokeStyle = `rgba(255,70,70,${0.5 + (b.flash > 0 ? 0.4 : 0)})`; ctx.lineWidth = 0.05;
      art.circle(ctx, b.x, b.y, BLAST_R); ctx.stroke();
    }
    // red danger glow on the floor, so the mine reads at a glance even in the dark
    const hot = b.flash > 0 ? 1 : 0;
    const halo = ctx.createRadialGradient(b.x, b.y, 0.12, b.x, b.y, 0.72);
    halo.addColorStop(0, `rgba(255,40,40,${0.6 + 0.15 * Math.sin(time * 3) + hot * 0.3})`); halo.addColorStop(1, 'rgba(255,40,40,0)');
    ctx.fillStyle = halo; art.circle(ctx, b.x, b.y, 0.72); ctx.fill();
    // disturbed earth
    ctx.fillStyle = 'rgba(92,72,48,0.55)';
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = (Math.PI * 2 * i) / 12, r = 0.38 + Math.sin(i * 2.7 + b.x * 5) * 0.04;
      ctx.lineTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.9);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(60,45,28,0.7)';
    for (let i = 0; i < 6; i++) { const a = i * 1.07 + b.y * 3; art.circle(ctx, b.x + Math.cos(a) * 0.33, b.y + Math.sin(a) * 0.3, 0.022); ctx.fill(); }
    // the hole it sits in: darker toward the casing
    const pit = ctx.createRadialGradient(b.x, b.y, 0.22, b.x, b.y, 0.36);
    pit.addColorStop(0, 'rgba(30,22,12,0.75)'); pit.addColorStop(1, 'rgba(30,22,12,0)');
    ctx.fillStyle = pit; art.circle(ctx, b.x, b.y, 0.36); ctx.fill();
    metalDisc(b.x, b.y, 0.27, '#d0414c', '#5a0a14');
    ctx.lineWidth = 0.035; ctx.strokeStyle = art.OUT; art.circle(ctx, b.x, b.y, 0.27); ctx.stroke();
    // half buried: dirt spills over the top-left lip (shadowed), the bottom-right lip catches light
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.arc(b.x, b.y, 0.245, Math.PI * 0.95, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,210,0.28)'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.arc(b.x, b.y, 0.25, -0.1, Math.PI * 0.7); ctx.stroke();
    ctx.fillStyle = 'rgba(92,72,48,0.9)';
    for (let i = 0; i < 5; i++) { const a = Math.PI * (1.0 + i * 0.16); art.ellipse(ctx, b.x + Math.cos(a) * 0.27, b.y + Math.sin(a) * 0.27, 0.06, 0.035); ctx.fill(); }
    // ribs around the casing
    ctx.strokeStyle = 'rgba(40,0,6,0.6)'; ctx.lineWidth = 0.018;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      ctx.moveTo(b.x + Math.cos(a) * 0.2, b.y + Math.sin(a) * 0.2); ctx.lineTo(b.x + Math.cos(a) * 0.26, b.y + Math.sin(a) * 0.26);
    }
    ctx.stroke();
    // pressure plate
    // explosive core: glowing red, flashes white-hot on each countdown tick
    const core = ctx.createRadialGradient(b.x - 0.04, b.y - 0.05, 0.01, b.x, b.y, 0.15);
    core.addColorStop(0, hot ? '#ffffff' : '#ff9a8a'); core.addColorStop(0.45, hot ? '#ff5a4a' : '#ff2a2a'); core.addColorStop(1, '#8a0010');
    art.circle(ctx, b.x, b.y, 0.15); ctx.fillStyle = core; ctx.fill();
    ctx.lineWidth = 0.025; ctx.strokeStyle = '#3a0008'; art.circle(ctx, b.x, b.y, 0.15); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.015;
    ctx.beginPath(); ctx.moveTo(b.x - 0.09, b.y); ctx.lineTo(b.x + 0.09, b.y); ctx.moveTo(b.x, b.y - 0.09); ctx.lineTo(b.x, b.y + 0.09); ctx.stroke();
    // stencilled warning band
    ctx.strokeStyle = '#d8b13a'; ctx.lineWidth = 0.022;
    ctx.beginPath(); ctx.arc(b.x, b.y, 0.18, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x, b.y, 0.18, Math.PI * 0.1, Math.PI * 0.4); ctx.stroke();
    // arming light
    art.circle(ctx, b.x + 0.1, b.y - 0.1, 0.035); ctx.fillStyle = blink ? '#ff3b3b' : '#5a1414'; ctx.fill();
    if (blink) {
      const gl = ctx.createRadialGradient(b.x + 0.1, b.y - 0.1, 0, b.x + 0.1, b.y - 0.1, 0.18);
      gl.addColorStop(0, 'rgba(255,60,60,0.6)'); gl.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.fillStyle = gl; art.circle(ctx, b.x + 0.1, b.y - 0.1, 0.18); ctx.fill();
    }
  }

  // Tripwire laser: an emitter bolted to one wall shoots a beam into a receiver on the opposite wall.
  function laserBox(p, dx, dy, emitter, on, warn) {
    const nx = -dy, ny = dx; // across the beam
    ctx.save(); ctx.translate(p.x, p.y); ctx.transform(dx, dy, nx, ny, 0, 0);
    // housing sunk into the wall, sticking out a little
    trapShadow(0.02, 0, 0.16);
    const hg = ctx.createLinearGradient(0, -0.17, 0, 0.17);
    hg.addColorStop(0, '#7d8697'); hg.addColorStop(0.5, '#4a5160'); hg.addColorStop(1, '#262a33');
    art.rrect(ctx, -0.2, -0.17, 0.3, 0.34, 0.05); ctx.fillStyle = hg; ctx.fill();
    ctx.lineWidth = 0.035; ctx.strokeStyle = art.OUT; ctx.stroke();
    ctx.fillStyle = '#1a1d24'; ctx.fillRect(-0.16, -0.17, 0.035, 0.34);
    for (const yy of [-0.11, 0.11]) { art.circle(ctx, -0.07, yy, 0.022); ctx.fillStyle = '#c8ced8'; ctx.fill(); }
    // lens
    const lit = emitter ? (on ? 1 : warn ? 0.5 + 0.5 * Math.sin(time * 40) : 0.15) : (on ? 0.8 : 0.1);
    art.rrect(ctx, 0.06, -0.08, 0.07, 0.16, 0.03); ctx.fillStyle = '#111'; ctx.fill();
    art.circle(ctx, 0.1, 0, 0.055);
    ctx.fillStyle = `rgb(${110 + lit * 145 | 0},${30 + lit * 60 | 0},${30 + lit * 60 | 0})`; ctx.fill();
    if (lit > 0.3) {
      const gl = ctx.createRadialGradient(0.12, 0, 0, 0.12, 0, 0.3);
      gl.addColorStop(0, `rgba(255,70,60,${0.55 * lit})`); gl.addColorStop(1, 'rgba(255,70,60,0)');
      ctx.fillStyle = gl; art.circle(ctx, 0.12, 0, 0.3); ctx.fill();
    }
    ctx.restore();
  }
  function drawLaser(l) {
    const on = laserOn(l), warn = !on && laserWarn(l);
    const p1 = l.h ? { x: l.a, y: l.c } : { x: l.c, y: l.a };
    const p2 = l.h ? { x: l.b, y: l.c } : { x: l.c, y: l.b };
    const dx = l.h ? 1 : 0, dy = l.h ? 0 : 1;
    const s1 = { x: p1.x + dx * 0.12, y: p1.y + dy * 0.12 }, s2 = { x: p2.x - dx * 0.12, y: p2.y - dy * 0.12 };
    const line = () => { ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); };
    if (on) {
      ctx.save(); ctx.lineCap = 'butt';
      // red light spilling on the floor
      ctx.strokeStyle = 'rgba(255,40,30,0.07)'; ctx.lineWidth = 0.6; line(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,40,30,0.07)'; ctx.lineWidth = 0.36; line(); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      const flick = 0.85 + Math.sin(time * 53) * 0.08 + Math.sin(time * 31) * 0.07;
      ctx.strokeStyle = `rgba(255,30,20,${0.35 * flick})`; ctx.lineWidth = 0.22; line(); ctx.stroke();
      ctx.strokeStyle = `rgba(255,60,40,${0.8 * flick})`; ctx.lineWidth = 0.08; line(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,235,225,0.95)'; ctx.lineWidth = 0.025; line(); ctx.stroke();
      // dust drifting through the beam
      const len = Math.hypot(s2.x - s1.x, s2.y - s1.y);
      for (let i = 0; i < 6; i++) {
        const u = ((time * 0.35 + i * 0.37 + l.c) % 1), off = Math.sin(time * 2 + i * 1.7) * 0.05;
        ctx.fillStyle = `rgba(255,190,170,${0.7 * Math.sin(u * Math.PI)})`;
        art.circle(ctx, s1.x + dx * u * len - dy * off, s1.y + dy * u * len + dx * off, 0.018); ctx.fill();
      }
      ctx.restore();
    } else if (warn) {
      ctx.save(); ctx.setLineDash([0.08, 0.12]); ctx.lineDashOffset = -time * 2;
      ctx.strokeStyle = `rgba(255,70,60,${0.25 + 0.35 * (Math.sin(time * 40) > 0)})`; ctx.lineWidth = 0.025; line(); ctx.stroke();
      ctx.restore();
    }
    laserBox(p1, dx, dy, true, on, warn);
    laserBox(p2, -dx, -dy, false, on, warn);
  }

  // Orange arrow that follows the real route around walls and obstacles, with rounded corners.
  function drawPathLine() {
    const p = player;
    if (!p.path || p.pi >= p.path.length) return;
    let pts = [{ x: p.x, y: p.y }, ...p.path.slice(p.pi)];
    if (p.chase && p.chase.alive) {
      // the path ends on the target's tile: finish on the target itself, stopping just short of it
      pts[pts.length - 1] = { x: p.chase.x, y: p.chase.y };
      const a = pts[pts.length - 2], z = pts[pts.length - 1], d = Math.hypot(z.x - a.x, z.y - a.y);
      if (d > 0.7) pts[pts.length - 1] = { x: z.x - (z.x - a.x) / d * 0.6, y: z.y - (z.y - a.y) / d * 0.6 };
      else pts.pop();
    }
    // drop points closer than a few centimetres (they would make tiny wobbles)
    pts = pts.filter((q, i) => i === 0 || Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) > 0.05);
    if (pts.length < 2) return;
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const total = pts.reduce((acc, q, i) => i ? acc + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0, 0);
    if (total < 0.4) return;
    const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
    // leave room for the arrow head
    const end = { x: last.x - Math.cos(ang) * 0.12, y: last.y - Math.sin(ang) * 0.12 };
    const trace = () => {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], c = pts[i], n = pts[i + 1];
        const r = Math.min(0.55, Math.hypot(c.x - a.x, c.y - a.y) / 2, Math.hypot(n.x - c.x, n.y - c.y) / 2);
        ctx.arcTo(c.x, c.y, n.x, n.y, r);
      }
      ctx.lineTo(end.x, end.y);
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    trace(); ctx.strokeStyle = 'rgba(80,30,0,0.45)'; ctx.lineWidth = 0.17; ctx.stroke();
    trace(); ctx.strokeStyle = '#ff8a1e'; ctx.lineWidth = 0.1; ctx.stroke();
    // moving dashes show the direction of travel
    ctx.save();
    trace(); ctx.setLineDash([0.12, 0.28]); ctx.lineDashOffset = -time * 1.6;
    ctx.strokeStyle = 'rgba(255,236,190,0.9)'; ctx.lineWidth = 0.045; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(last.x, last.y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0.22, 0); ctx.lineTo(-0.12, -0.19); ctx.lineTo(-0.12, 0.19); ctx.closePath();
    ctx.fillStyle = '#ff8a1e'; ctx.fill(); ctx.lineWidth = 0.035; ctx.strokeStyle = 'rgba(80,30,0,0.6)'; ctx.stroke();
    ctx.restore();
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

    const shk = shake * (calmMotion ? 0.35 : 1);
    const sx = (shk > 0 ? (Math.random() - 0.5) * 10 * shk * 3 : 0) + camKick.x * ts;
    const sy = (shk > 0 ? (Math.random() - 0.5) * 10 * shk * 3 : 0) + camKick.y * ts;
    worldTransform(ctx, sx, sy);
    ctx.drawImage(mapCanvas, 0, 0, W, H);

    // persistent decals (scorch marks, rubble, blood)
    // grass glows when the hero hides in it
    if (player && inGrass(player)) {
      const pl = L.rects.find(r => r.type === 'planter' && player.x >= r.x && player.x < r.x + r.w && player.y >= r.y && player.y < r.y + r.h);
      if (pl) {
        ctx.fillStyle = `rgba(200,255,90,${0.32 + Math.sin(time * 5) * 0.06})`;
        ctx.fillRect(pl.x + 0.11, pl.y + 0.11, pl.w - 0.22, pl.h - 0.22);
      }
    }
    for (const d of decals) {
      if (d.kind === 'frost') {
        if (d.t > 0) {
          const a = Math.min(1, d.t / 2) * 0.45;
          const gr = ctx.createRadialGradient(d.x, d.y, 0.1, d.x, d.y, d.r);
          gr.addColorStop(0, `rgba(220,248,255,${a})`); gr.addColorStop(0.8, `rgba(160,225,255,${a * 0.6})`); gr.addColorStop(1, 'rgba(160,225,255,0)');
          ctx.fillStyle = gr; art.circle(ctx, d.x, d.y, d.r); ctx.fill();
        }
        continue;
      }
      if (d.kind === 'scorch') art.drawScorch(ctx, d);
      else if (d.kind === 'rubble') {
        ctx.fillStyle = '#6f6d48';
        for (let i = 0; i < 6; i++) { const a = d.seed + i * 1.1, r = 0.15 + (i % 3) * 0.12; ctx.fillRect(d.x + Math.cos(a) * r - 0.06, d.y + Math.sin(a) * r - 0.05, 0.12 + (i % 2) * 0.06, 0.09); }
      }
    }
    for (const d of decals) {
      if (d.kind !== 'blood') continue;
      d.alpha = 0.92; d.scale = 0.4 + 0.6 * Math.min(1, d.t * 3);
      ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.scale, d.scale); ctx.translate(-d.x, -d.y);
      art.drawSplat(ctx, d); ctx.restore();
    }
    // ground layer
    for (const b of bombs) if (b.state !== 'done') drawBomb(b);
    for (const m of mines) if (m.state !== 'used') drawMine(m);
    for (const pk of pickups) {
      if (pk.taken) continue;
      // opening zone: a wide pale circle, filled from the centre while the hero stands in it
      if (pk.open > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; art.circle(ctx, pk.x, pk.y, CRATE_R); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.035; ctx.stroke();
        ctx.fillStyle = 'rgba(80,235,140,0.55)'; art.circle(ctx, pk.x, pk.y, CRATE_R * pk.open); ctx.fill();
      }
      art.drawLootCrate(ctx, pk.x, pk.y, time, pk.open, pk.x * 1.7 + pk.y);
    }
    if (keyItem && !keyItem.taken) {
      const kx = keyItem.x, ky = keyItem.y + Math.sin(time * 3) * 0.05;
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(-0.5);
      ctx.fillStyle = 'rgba(255,211,77,0.3)'; art.circle(ctx, 0, 0, 0.36); ctx.fill();
      ctx.strokeStyle = art.OUT; ctx.lineWidth = 0.13; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-0.05, 0); ctx.lineTo(0.3, 0); ctx.moveTo(0.22, 0); ctx.lineTo(0.22, 0.1); ctx.moveTo(0.3, 0); ctx.lineTo(0.3, 0.12); ctx.stroke();
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 0.07; ctx.stroke();
      art.circle(ctx, -0.14, 0, 0.12); ctx.fillStyle = '#ffd34d'; ctx.fill(); ctx.lineWidth = 0.04; ctx.strokeStyle = art.OUT; ctx.stroke();
      art.circle(ctx, -0.14, 0, 0.05); ctx.fillStyle = '#a86d0a'; ctx.fill();
      ctx.restore();
    }
    // fallen guards: the body drops, lies still a moment, then sinks and dissolves, leaving only the stain
    for (const gd of guards) {
      if (gd.alive || gd.vanish) continue;
      const t = gd.deadT, k = Math.min(1, Math.max(0, (t - BODY_HOLD) / BODY_FADE));
      if (k >= 1) { gd.vanish = true; continue; }
      if (k > 0 && !gd.puffed) {
        gd.puffed = true;
        for (let i = 0; i < 7; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * 0.3;
          fx.smoke.push({ x: gd.x + Math.cos(a) * r, y: gd.y + Math.sin(a) * r, vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.4 - 0.3, t: 0, max: 0.6, r: 0.22 + Math.random() * 0.12 });
        }
      }
      const drop = Math.min(1, t / 0.12); // quick fall: the body lands a touch bigger, then settles
      const sc = CHAR_SCALE * gd.scale * (1.08 - 0.08 * drop) * (1 - 0.25 * k);
      art.drawCharacter(ctx, gd.look, gd.x, gd.y, gd.angle, { weapon: gd.weapon, dead: true, alpha: 0.95 * (1 - k * k), noShadow: true, scale: sc });
    }

    // darkness with flashlight cones cut out
    const vh = (ch - HUD_H) / ts, vw = cw / ts;
    const polys = guards.filter(g => g.alive && g.frozen <= 0
      && Math.abs(g.y - (cam.y + vh / 2)) < vh / 2 + g.range + 1 && Math.abs(g.x - (cam.x + vw / 2)) < vw / 2 + g.range + 1)
      .map(g => [g, visionPolygon(g)]);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, shadeCanvas.width, shadeCanvas.height);
    // night tint per theme: the room is dim, so the flashlights read as real light
    sctx.fillStyle = NIGHT[L.theme] || NIGHT.concrete;
    sctx.fillRect(0, 0, shadeCanvas.width, shadeCanvas.height);
    worldTransform(sctx, sx, sy, shadeCanvas.width / canvas.width);
    sctx.globalCompositeOperation = 'destination-out';
    for (const [gd, poly] of polys) {
      const grad = sctx.createRadialGradient(gd.x, gd.y, 0.1, gd.x, gd.y, gd.range);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.75, 'rgba(0,0,0,0.85)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
      tracePoly(sctx, gd, poly); sctx.fillStyle = grad; sctx.fill();
    }
    // mines glow through the dark (their own little pool of light), so they can't be missed
    for (const t of [...bombs.filter(b => b.state !== 'done'), ...mines.filter(m => m.state !== 'used')]) {
      const gl = sctx.createRadialGradient(t.x, t.y, 0.05, t.x, t.y, 0.8);
      gl.addColorStop(0, 'rgba(0,0,0,0.9)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = gl; art.circle(sctx, t.x, t.y, 0.8); sctx.fill();
    }
    sctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(shadeCanvas, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(vignette(canvas.width, canvas.height), 0, 0);
    worldTransform(ctx, sx, sy);
    for (const [gd, poly] of polys) {
      // white light while patrolling, red once alerted
      const c = gd.state === 'alert' ? '255,90,80' : '255,255,250';
      const grad = ctx.createRadialGradient(gd.x, gd.y, 0.1, gd.x, gd.y, gd.range);
      grad.addColorStop(0, `rgba(${c},0.3)`); grad.addColorStop(0.7, `rgba(${c},0.2)`); grad.addColorStop(1, `rgba(${c},0.1)`);
      ctx.save();
      tracePoly(ctx, gd, poly); ctx.clip();
      ctx.fillStyle = grad; ctx.fill();
      // alerted: a moving dashed edge, so the state does not rely on colour alone
      if (gd.state === 'alert') {
        ctx.setLineDash([0.18, 0.12]); ctx.lineDashOffset = -time * 2; ctx.lineWidth = 0.14;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); ctx.setLineDash([]);
      }
      // round spot of light where the beam lands
      const sx2 = gd.x + Math.cos(gd.angle) * gd.range * 0.78, sy2 = gd.y + Math.sin(gd.angle) * gd.range * 0.78;
      const spot = ctx.createRadialGradient(sx2, sy2, 0.05, sx2, sy2, gd.range * 0.42);
      spot.addColorStop(0, `rgba(${c},0.3)`); spot.addColorStop(0.85, `rgba(${c},0.18)`); spot.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = spot; art.circle(ctx, sx2, sy2, gd.range * 0.42); ctx.fill();
      ctx.restore();
    }

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
      art.drawCharacter(ctx, gd.look, gd.x, gd.y, gd.angle, { weapon: gd.weapon, walk: gd.walk, scale: CHAR_SCALE * gd.scale });
      if (gd.stun > 0) {
        for (let i = 0; i < 3; i++) {
          const a = time * 6 + i * 2.1;
          ctx.fillStyle = '#ffd34d'; art.circle(ctx, gd.x + Math.cos(a) * 0.45, gd.y - 0.3 + Math.sin(a) * 0.2, 0.07); ctx.fill();
        }
      }
      if (gd.muzzle > 0) {
        const tip = gunTip(gd);
        ctx.fillStyle = '#fff2a8'; art.circle(ctx, tip.x, tip.y, 0.16); ctx.fill();
        ctx.fillStyle = '#ffb02e'; art.circle(ctx, tip.x, tip.y, 0.09); ctx.fill();
      }
      if (gd.frozen > 0) { ctx.save(); ctx.translate(gd.x, gd.y); ctx.scale(CHAR_SCALE, CHAR_SCALE); art.drawIce(ctx, 0, 0, gd.frozen); ctx.restore(); }
    }
    if (player.chase && player.chase.alive) drawChaseMarker(player.chase);
    const blink = player.hurtCd > 0 && Math.sin(time * 50) > 0;
    if (spawnT > 0) {
      const k = 1 - spawnT / 1.6;
      // a wide ring tightens onto the hero, then pulses and fades
      const c = Math.min(1, k / 0.38), ease = 1 - Math.pow(1 - c, 3);
      const rad = 4.2 - (4.2 - 0.62) * ease + (c >= 1 ? Math.sin(time * 8) * 0.04 : 0);
      ctx.strokeStyle = `rgba(80,200,255,${0.9 * (1 - k)})`; ctx.lineWidth = 0.1 + (1 - ease) * 0.08;
      art.circle(ctx, player.x, player.y, rad); ctx.stroke();
      ctx.strokeStyle = `rgba(200,240,255,${0.6 * (1 - k)})`; ctx.lineWidth = 0.04; ctx.stroke();
    }
    if (!(state === 'lost' && endTimer < 0.6)) {
      const hidden = inGrass(player);
      // faint ground ring so the hero is easy to find, whatever the floor colour
      ctx.strokeStyle = 'rgba(94,231,255,0.3)'; ctx.lineWidth = 0.05;
      art.ellipse(ctx, player.x, player.y + 0.06, 0.46, 0.4); ctx.stroke();
      art.drawCharacter(ctx, player.look, player.x, player.y, player.angle, { weapon: 'knife', walk: player.walk, attack: player.attack > 0, alpha: (blink ? 0.5 : 1) * (hidden ? 0.45 : 1), scale: CHAR_SCALE, noShadow: hidden });
      if (player.frozen > 0) { ctx.save(); ctx.translate(player.x, player.y); ctx.scale(CHAR_SCALE, CHAR_SCALE); art.drawIce(ctx, 0, 0, player.frozen); ctx.restore(); }
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
      const k = r.t / r.max, rad = r.r * Math.sqrt(k), c = r.c || '120,220,255';
      ctx.fillStyle = `rgba(${c},${(r.thin ? 0.14 : 0.35) * (1 - k)})`; art.circle(ctx, r.x, r.y, rad); ctx.fill();
      ctx.strokeStyle = r.thin ? `rgba(${c},${1 - k})` : `rgba(230,250,255,${1 - k})`; ctx.lineWidth = (r.thin ? 0.16 : 0.12) * (1 - k) + 0.02; ctx.stroke();
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
    for (const g of fx.gems) {
      if (g.t < 0) continue;
      if (g.z > 0.03) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; art.ellipse(ctx, g.x, g.y + 0.08, 0.1, 0.04); ctx.fill(); }
      // a small blue glow travels with each diamond
      const gy = g.y - g.z * 0.35, gg = ctx.createRadialGradient(g.x, gy, 0.02, g.x, gy, 0.24);
      gg.addColorStop(0, 'rgba(30,110,255,0.55)'); gg.addColorStop(1, 'rgba(30,110,255,0)');
      ctx.fillStyle = gg; art.circle(ctx, g.x, gy, 0.24); ctx.fill();
      art.drawGem(ctx, g.x, g.y - g.z * 0.35, 0.15, g.rot, Math.max(0, Math.cos(g.rot) * 3 - 1.8));
    }
    for (const f of fx.fireballs) {
      const k = f.t / f.max;
      const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (0.4 + k * 0.7));
      gr.addColorStop(0, `rgba(255,250,210,${1 - k})`); gr.addColorStop(0.35, `rgba(255,170,40,${0.9 * (1 - k)})`);
      gr.addColorStop(0.7, `rgba(230,70,20,${0.6 * (1 - k)})`); gr.addColorStop(1, 'rgba(120,30,10,0)');
      ctx.fillStyle = gr; art.circle(ctx, f.x, f.y, f.r * (0.4 + k * 0.7)); ctx.fill();
    }
    for (const sm of fx.smoke) {
      if (sm.t < 0) continue;
      const k = sm.t / sm.max;
      ctx.fillStyle = `rgba(70,72,78,${0.55 * (1 - k)})`;
      art.circle(ctx, sm.x, sm.y, sm.r * (1 + k * 1.6)); ctx.fill();
    }

    // screen-space overlays
    for (const gd of guards) {
      if (!gd.alive || !gd.boss) continue;
      const s4 = toScreen(gd.x, gd.y - 1.05), maxHp = 3 + Math.floor(save.level / 30);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const seg = 16, w4 = seg * maxHp + 2 * (maxHp - 1);
      for (let i = 0; i < maxHp; i++) {
        ctx.fillStyle = '#1c1a2b'; ctx.fillRect(s4.x + sx - w4 / 2 + i * (seg + 2) - 2, s4.y + sy - 5, seg + 4, 10);
        ctx.fillStyle = i < gd.hp ? '#ff3b4f' : '#4a4c60'; ctx.fillRect(s4.x + sx - w4 / 2 + i * (seg + 2), s4.y + sy - 3, seg, 6);
      }
    }
    if (state === 'playing') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx0 = cw / 2, cy0 = HUD_H + (ch - HUD_H) / 2, m = 22;
      for (const gd of guards) {
        if (!gd.alive) continue;
        const s3 = toScreen(gd.x, gd.y);
        if (s3.x > 0 && s3.x < cw && s3.y > HUD_H && s3.y < ch) continue;
        const a = Math.atan2(s3.y - cy0, s3.x - cx0);
        const kx = (cw / 2 - m) / Math.abs(Math.cos(a) || 1e-6), ky = ((ch - HUD_H) / 2 - m) / Math.abs(Math.sin(a) || 1e-6);
        const k = Math.min(kx, ky);
        const px = cx0 + Math.cos(a) * k, py = cy0 + Math.sin(a) * k;
        ctx.save(); ctx.translate(px, py); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath();
        const al = gd.state === 'alert';
        if (al) { ctx.scale(1.35, 1.35); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); }
        ctx.fillStyle = al ? '#ff2a2a' : '#e8344a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1c1a2b'; ctx.stroke();
        if (al) { ctx.rotate(-a); ctx.fillStyle = '#fff'; ctx.font = '13px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 1); }
        ctx.restore();
      }
    }
    for (const gd of guards) {
      if (!gd.alive || (gd.alertT <= 0 && gd.qT <= 0)) continue;
      const s = toScreen(gd.x, gd.y - 0.9);
      const pop = Math.min(1, (gd.alertT > 0 ? 1.2 - gd.alertT : 1 - gd.qT) * 8);
      screenText(gd.alertT > 0 ? '!' : '?', s.x + sx, s.y + sy, 30 * pop, gd.alertT > 0 ? '#ff2a2a' : '#ff5a3d', { stroke: '#ffffff' });
    }
    if (state === 'playing') {
      const s = toScreen(player.x, player.y + 0.72);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = 56, k = Math.max(0, player.hp / player.maxHp);
      ctx.fillStyle = '#1c1a2b'; ctx.fillRect(s.x - w / 2 - 2, s.y - 5, w + 4, 10);
      ctx.fillStyle = k > 0.5 ? '#3fd14a' : k > 0.25 ? '#ffb02e' : '#ff4040';
      ctx.fillRect(s.x - w / 2, s.y - 3, w * k, 6);
      screenText(String(Math.round(player.hp * HP_DISPLAY)), s.x, s.y, 13, '#ffffff');
    }
    if (loot.n > 0 && player) {
      const s = toScreen(player.x, player.y - 1.0);
      const a = Math.min(1, (1.1 - loot.t) * 3);
      screenText('+' + loot.n, s.x + sx - 6, s.y + sy, 26 * (1 + loot.pop * 0.3), '#ffffff', { alpha: a });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = a;
      const w = ctx.measureText('+' + loot.n).width;
      ctx.translate(s.x + sx - 6 + w / 2 + 12, s.y + sy); ctx.scale(30, 30);
      art.drawGem(ctx, 0, 0, 0.32, 0.3, loot.pop * 2);
      ctx.globalAlpha = 1;
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
    if (hurtFlash > 0) {
      // hits flash the screen edges, keeping the centre readable
      const w0 = canvas.width, h0 = canvas.height;
      const g2 = ctx.createRadialGradient(w0 / 2, h0 / 2, Math.min(w0, h0) * 0.25, w0 / 2, h0 / 2, Math.max(w0, h0) * 0.62);
      g2.addColorStop(0, 'rgba(255,20,20,0)'); g2.addColorStop(1, `rgba(255,20,20,${Math.min(1, hurtFlash * 2.4)})`);
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w0, h0);
    }
    if (introT > INTRO - 0.5) {
      ctx.fillStyle = `rgba(14,18,40,${(introT - (INTRO - 0.5)) / 0.5 * 0.85})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ---------- Input ----------
  let pointerDown = false, lastTile = -1;
  function toWorld(e) { return { x: e.clientX / ts + cam.x, y: (e.clientY - HUD_H) / ts + cam.y }; }
  function onPointer(e, isDown) {
    if (state !== 'playing' || player.frozen > 0) return;
    const w = toWorld(e);
    if (isDown) {
      let target = null, best = 1.0;
      for (const gd of guards) {
        if (!gd.alive) continue;
        const d = Math.hypot(gd.x - w.x, gd.y - w.y);
        if (d < best) { best = d; target = gd; }
      }
      fx.ripples.push({ x: w.x, y: w.y, t: 0 });
      if (time > 4) hideTip(); // leave the tip up long enough to be read
      if (target) {
        player.chase = target; player.repath = 0; marker = null; lastTile = -1;
        sfx.tap(); sfx.unsheathe();
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
  const SCREENS = ['menu', 'heroes', 'result', 'pause', 'wheel', 'shop'];
  function showScreen(id) {
    for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
    $('hud').classList.toggle('hidden', !(id === null || id === 'pause'));
  }
  function showBanner(title, sub, cls) {
    const b = $('banner');
    b.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${sub}</div>`;
    b.className = cls || '';
    void b.offsetWidth; b.classList.add('show');
  }
  function showTip(html) {
    const t = $('tip');
    if (!html) { t.classList.add('hidden'); return; }
    t.innerHTML = `<span>${html}</span>`;
    t.classList.remove('hidden');
  }
  const LOSS_TIPS = [
    'Attends que le faisceau se détourne, puis frappe de dos.',
    'Cache-toi dans les herbes hautes pour casser la poursuite.',
    'Un laser déclenche l\'alarme : passe quand il est éteint.',
    'Les gardes au bouclier se prennent uniquement de dos.',
    'Un garde qui a un doute vient voir : attends-le au coin du mur.',
  ];
  function hideTip() { $('tip').classList.add('hidden'); }

  function buildHud() {
    $('hud-level').textContent = 'NIVEAU ' + save.level;
    updateHud();
  }
  let lastGemShown = -1;
  function updateHud() {
    const keys = (save.keys || 0) + levelKey;
    $('hud-keys').classList.toggle('hidden', keys === 0);
    const kh = '<i class="key-ico"></i>' + Math.min(keys, 3) + '/3';
    if (kh !== lastKeysHtml) { lastKeysHtml = kh; $('hud-keys').innerHTML = kh; }
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

  // ---------- Missions (repeatable, rewarded in gems) ----------
  const MISSIONS = [
    { id: 'stealth', text: 'Termine un niveau sans être repéré', base: 40, per: 4 },
    { id: 'nodmg', text: 'Termine un niveau sans dégâts subis', base: 40, per: 4 },
    { id: 'kills', text: 'Élimine 25 gardes', goal: 25, base: 30, per: 3 },
  ];
  const missionReward = m => m.base + m.per * save.level;
  function missionState(id) {
    save.missions = save.missions || {};
    return (save.missions[id] = save.missions[id] || { progress: 0, done: false });
  }
  function renderMissions() {
    const box = $('missions');
    box.innerHTML = '';
    for (const m of MISSIONS) {
      const st = missionState(m.id);
      const row = document.createElement('div'); row.className = 'mission';
      const txt = document.createElement('div'); txt.className = 'mtext'; txt.textContent = m.text;
      if (m.goal) { const sm = document.createElement('small'); sm.textContent = `${Math.min(st.progress, m.goal)}/${m.goal}`; txt.appendChild(sm); }
      const btn = document.createElement('button');
      btn.className = 'reward' + (st.done ? ' ready' : '');
      const rw = missionReward(m);
      btn.innerHTML = `<span class="reward-lab">${st.done ? 'Réclamer' : 'Prix'}</span><span class="reward-val"><i class="gem-ico"></i>${rw}</span>`;
      btn.setAttribute('aria-label', st.done ? `Récupérer ${rw} diamants` : `Mission en cours, ${rw} diamants`);
      btn.classList.toggle('bump', st.done);
      btn.disabled = !st.done;
      btn.onclick = () => {
        if (!st.done) return;
        save.gems += rw; st.done = false; st.progress = 0; persist();
        sfx.pickup(); $('menu-gems').textContent = save.gems; renderMissions(); refreshBadges();
      };
      row.append(txt, btn); box.appendChild(row);
    }
  }

  function showMenu() {
    renderMissions();
    state = 'menu';
    $('menu-gems').textContent = save.gems;
    $('btn-play-level').textContent = 'NIVEAU ' + save.level;
    const ch2 = currentHero(), lv2 = heroLevel(ch2.id);
    const holder = $('menu-hero');
    holder.innerHTML = '';
    holder.appendChild(heroPortrait(heroLook(ch2, true), 96));
    const pct = lv2 >= MAX_HERO_LV ? 100 : Math.round(100 * (heroXp(ch2.id) - xpFor(lv2)) / (xpFor(lv2 + 1) - xpFor(lv2)));
    $('menu-hero-name').innerHTML = `${ch2.name} · niv. ${lv2}<span class="xpbar"><i style="width:${pct}%"></i></span>`;
    const kn = KNIVES.find(k => k.id === save.knife) || KNIVES[0];
    art.drawKnifeIcon($('menu-knife'), kn.blade || ch2.look.blade || 'steel');
    const oh = $('menu-outfit'); oh.innerHTML = ''; oh.appendChild(heroPortrait(heroLook(ch2, false), 56));
    refreshBadges();
    refreshToggles();
    showScreen('menu');
  }

  function refreshToggles() {
    for (const k of ['sfx', 'music', 'vibe']) {
      document.querySelectorAll(`[data-toggle="${k}"]`).forEach(b => { b.classList.toggle('off', !save[k]); b.setAttribute('aria-pressed', String(!!save[k])); });
    }
  }
  function toggle(k) {
    save[k] = !save[k]; persist();
    audio.init(); audio.set({ sfx: save.sfx, music: save.music });
    if (k === 'vibe' && save.vibe) vibrate(40);
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
      card.appendChild(heroPortrait(owned ? heroLook(h, selected) : h.look, 84, { locked: !owned }));
      const name = document.createElement('div'); name.className = 'hero-name'; name.innerHTML = owned ? `${h.name} <small>niv. ${heroLevel(h.id)}</small>` : h.name;
      const lab = document.createElement('div'); lab.className = 'hero-label'; lab.textContent = selected ? 'ÉQUIPÉ' : h.label;
      if (h.spd && !selected) lab.classList.add('speed');
      if (h.hp && !h.spd && !selected) lab.classList.add('health');
      card.append(name, lab);
      if (!owned) {
        const price = document.createElement('div');
        price.className = 'hero-price' + (save.gems < h.price ? ' poor' : '');
        price.innerHTML = `<i class="gem-ico"></i>${h.price}`;
        card.appendChild(price);
      } else if (heroLevel(h.id) < MAX_HERO_LV) {
        // training: spend diamonds to gain a level right away
        const lv = heroLevel(h.id), cost = trainCost(lv);
        const tr = document.createElement('div');
        tr.className = 'hero-train' + (save.gems < cost ? ' poor' : '');
        tr.setAttribute('role', 'button');
        tr.innerHTML = `Entraîner <i class="gem-ico"></i>${cost}`;
        tr.onclick = e => {
          e.stopPropagation();
          if (save.gems < cost) { tr.innerHTML = `Il manque <i class="gem-ico"></i>${cost - save.gems}`; sfx.hurt(); return; }
          save.gems -= cost; save.xp = save.xp || {}; save.xp[h.id] = Math.max(heroXp(h.id), xpFor(lv + 1));
          sfx.pickup(); persist(); renderHeroes();
        };
        card.appendChild(tr);
      }
      card.onclick = () => {
        if (selected) return;
        if (owned) { save.selected = h.id; sfx.button(); }
        else if (save.gems >= h.price) { save.gems -= h.price; save.owned.push(h.id); save.selected = h.id; sfx.pickup(); }
        else {
          card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); sfx.hurt();
          card.querySelector('.hero-price').innerHTML = `Il manque <i class="gem-ico"></i>${h.price - save.gems}`;
          return;
        }
        persist(); renderHeroes();
      };
      grid.appendChild(card);
    }
  }


  // ---------- Shop screen: upgrades, knives, outfits ----------
  let shopTab = 'upgrade';
  const SHOP_TITLES = { upgrade: 'AMÉLIORER', armory: 'ARMURERIE', outfits: 'TENUES' };
  const UPG_ICONS = {
    hp: '<path d="M24 41 8 25a9 9 0 0 1 16-11 9 9 0 0 1 16 11Z" fill="#ff4f5e"/>',
    spd: '<path d="M27 4 10 27h12l-3 17 19-25H26Z" fill="#ffd34d"/>',
    loot: '<path d="M14 8h20l8 10-18 24L6 18Z" fill="#2b8cff"/><path d="M6 18h36M24 42 17 18l7-10 7 10Z" fill="none" stroke="#bfe3ff" stroke-width="2.5"/>',
    crate: '<rect x="7" y="14" width="34" height="26" rx="3" fill="#3f6fd0"/><path d="M7 22h34M24 14v26" stroke="#ffd34d" stroke-width="4"/>',
    quiet: '<path d="M8 28c4-10 28-10 32 0-8 6-24 6-32 0Z" fill="#9b7bff"/><circle cx="24" cy="26" r="5" fill="#1c1a2b"/>',
  };
  const upgradeCost = u => (save.upg[u.id] < 5 ? UPG_COST[save.upg[u.id]] : 0);
  // what can be bought right now, for the "!" badges on the menu
  const canBuy = {
    heroes: () => HEROES.some(h => !save.owned.includes(h.id) && save.gems >= h.price),
    upgrade: () => UPGRADES.some(u => save.upg[u.id] < 5 && save.gems >= upgradeCost(u)),
    armory: () => KNIVES.some(k => !save.knives.includes(k.id) && save.gems >= k.price),
    outfits: () => OUTFITS.some(o => o.price && !(save.outfits[save.selected] || []).includes(o.id) && save.gems >= o.price),
  };
  function refreshBadges() {
    for (const k of Object.keys(canBuy)) $('badge-' + k).classList.toggle('hidden', !canBuy[k]());
  }
  // big purchases need a second tap, so a stray touch never spends thousands of diamonds
  let armed = null, armedT = 0;
  function confirmBuy(btn, key, price, done) {
    if (save.gems < price) {
      btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); sfx.hurt();
      btn.querySelector('.buy-lab').textContent = `Il manque ${price - save.gems}`;
      return;
    }
    if (armed !== key || performance.now() - armedT > 3000) {
      armed = key; armedT = performance.now(); sfx.tap();
      btn.classList.add('confirm'); btn.querySelector('.buy-lab').textContent = 'Confirmer ?';
      return;
    }
    armed = null;
    save.gems -= price; done(); persist();
    sfx.pickup(); vibrate(30);
    renderShop();
  }
  function shopRow(icon, name, desc, extra, action) {
    const row = document.createElement('div'); row.className = 'item';
    const ic = document.createElement('div'); ic.className = 'item-ico'; ic.appendChild(icon);
    const tx = document.createElement('div'); tx.className = 'item-txt';
    tx.innerHTML = `<b>${name}</b><small>${desc}</small>`;
    if (extra) tx.appendChild(extra);
    row.append(ic, tx, action);
    return row;
  }
  function buyBtn(label, price) {
    const b = document.createElement('button');
    b.className = 'buy' + (save.gems < price ? ' poor' : '');
    b.innerHTML = `<span class="buy-lab">${label}</span><span class="buy-val"><i class="gem-ico"></i>${price}</span>`;
    return b;
  }
  function stateBtn(label, cls) {
    const b = document.createElement('button'); b.className = 'buy ' + cls;
    b.innerHTML = `<span class="buy-lab">${label}</span>`;
    return b;
  }
  function renderShop() {
    $('shop-gems').textContent = save.gems;
    $('shop-title').textContent = SHOP_TITLES[shopTab];
    document.querySelectorAll('#shop .tab').forEach(t => { const on = t.dataset.tab === shopTab; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); });
    const list = $('shop-list'); list.innerHTML = '';
    const hero = currentHero();
    if (shopTab === 'upgrade') {
      $('shop-hint').textContent = 'Valable pour tous tes assassins.';
      for (const u of UPGRADES) {
        const lv = save.upg[u.id];
        const ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        ic.setAttribute('viewBox', '0 0 48 48'); ic.innerHTML = UPG_ICONS[u.id];
        const pips = document.createElement('span'); pips.className = 'pips';
        pips.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
        const desc = lv ? u.text(lv) + (lv < 5 ? ` → ${u.text(lv + 1)}` : '') : u.text(1);
        const act = lv >= 5 ? stateBtn('MAX', 'max') : buyBtn('Niveau ' + (lv + 1), upgradeCost(u));
        if (lv < 5) act.onclick = () => confirmBuy(act, 'u-' + u.id, upgradeCost(u), () => { save.upg[u.id]++; });
        list.appendChild(shopRow(ic, u.name, desc, pips, act));
      }
    } else if (shopTab === 'armory') {
      $('shop-hint').textContent = 'Un seul couteau équipé à la fois. Son bonus s\'ajoute aux améliorations.';
      for (const k of KNIVES) {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        art.drawKnifeIcon(c, k.blade || hero.look.blade || 'steel');
        const owned = save.knives.includes(k.id), on = save.knife === k.id;
        let act;
        if (on) act = stateBtn('ÉQUIPÉ', 'on');
        else if (owned) { act = stateBtn('ÉQUIPER', 'equip'); act.onclick = () => { save.knife = k.id; persist(); sfx.button(); renderShop(); }; }
        else { act = buyBtn('Acheter', k.price); act.onclick = () => confirmBuy(act, 'k-' + k.id, k.price, () => { save.knives.push(k.id); save.knife = k.id; }); }
        list.appendChild(shopRow(c, k.name, k.perk, null, act));
      }
    } else {
      $('shop-hint').textContent = `Tenues de ${hero.name}. Chaque assassin a sa propre garde-robe.`;
      const mine = save.outfits[hero.id] || [];
      for (const o of OUTFITS) {
        const owned = !o.price || mine.includes(o.id), on = (save.outfit[hero.id] || 'base') === o.id;
        const prev = save.outfit[hero.id]; save.outfit[hero.id] = o.id;
        const pic = heroPortrait(heroLook(hero, false), 56);
        save.outfit[hero.id] = prev;
        let act;
        if (on) act = stateBtn('PORTÉE', 'on');
        else if (owned) { act = stateBtn('PORTER', 'equip'); act.onclick = () => { save.outfit[hero.id] = o.id; persist(); sfx.button(); renderShop(); }; }
        else {
          act = buyBtn('Acheter', o.price);
          act.onclick = () => confirmBuy(act, 'o-' + hero.id + o.id, o.price, () => { save.outfits[hero.id] = [...mine, o.id]; save.outfit[hero.id] = o.id; });
        }
        list.appendChild(shopRow(pic, o.name, o.desc, null, act));
      }
    }
  }
  function openShop(tab) { shopTab = tab; armed = null; renderShop(); showScreen('shop'); }
  document.querySelectorAll('#shop .tab').forEach(t => t.addEventListener('click', () => { sfx.tap(); shopTab = t.dataset.tab; armed = null; renderShop(); }));

  function showResult(won) {
    hideTip();
    state = 'result';
    for (const g of fx.gems) levelGems++;
    fx.gems = [];
    const n = save.level;
    const k = player.hp / player.maxHp;
    const stars = won ? (!player.spotted ? 3 : k >= 0.5 ? 2 : 1) : 0;
    const bonus = won ? 5 * stars + 2 * n : 0;
    let chest = 0;
    if (won && levelKey) { save.keys = (save.keys || 0) + 1; if (save.keys >= 3) { save.keys = 0; chest = 100 + n * 5; } }
    // dying forfeits the diamonds picked up during the level: only a finished mission pays
    const total = won ? levelGems + bonus + chest : 0;
    save.gems += total;
    const killed = guards.filter(g => !g.alive);
    const xpGain = killed.length * 10 + killed.filter(g => g.boss).length * 60 + (won ? 25 : 0);
    const hero = currentHero();
    const leveled = addXp(hero.id, xpGain);
    if (won) { save.stars[n] = Math.max(save.stars[n] || 0, stars); save.level++; }
    if (won && !player.spotted) missionState('stealth').done = true;
    if (won && player.hp >= player.maxHp) missionState('nodmg').done = true;
    const ks = missionState('kills');
    ks.progress += guards.filter(g => !g.alive).length;
    if (ks.progress >= 25) ks.done = true;
    persist();
    lastGemShown = -1;
    const box = $('result');
    box.classList.toggle('lost', !won);
    $('result-title').textContent = won ? 'MISSION RÉUSSIE !' : 'REPÉRÉ !';
    $('result-sub').textContent = won ? (stars === 3 ? 'Assassin parfait : jamais repéré !' : 'Reste dans l\'ombre pour 3 étoiles')
      : `Gardes éliminés : ${guards.filter(g => !g.alive).length}/${guards.length}. ` + LOSS_TIPS[Math.floor(Math.random() * LOSS_TIPS.length)];
    const starEls = [...document.querySelectorAll('#result .star')];
    starEls.forEach(s => s.classList.remove('on'));
    $('result-stars').classList.toggle('hidden', !won);
    starEls.forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); sfx.star(i); }, 350 + i * 300); });
    $('result-bonus').innerHTML = (won
      ? `Butin ${levelGems}, bonus ${bonus}` + (chest ? `, coffre ${chest}` : '')
      : 'Mission échouée : rien n\'est gagné. Termine la mission pour garder ton butin.')
      + `<br>+${xpGain} XP` + (leveled ? `, ${hero.name} passe au niveau ${heroLevel(hero.id)}` : '');
    const el = $('result-gems');
    el.parentElement.classList.toggle('lost', !won);
    if (!won) el.textContent = '0';
    const t0 = performance.now();
    let lastShown = 0;
    if (won) (function count(now) {
      const p = Math.min(1, (now - t0) / 900);
      const v = Math.round(total * p);
      el.textContent = '+' + v;
      if (v !== lastShown && v % 3 === 0) sfx.coin();
      lastShown = v;
      if (p < 1 && state === 'result') requestAnimationFrame(count);
    })(t0);
    // "new assassin" progress: every win fills a tenth of the bar (the three cheapest heroes only), then the next one is free
    const next = HEROES.find(h => !save.owned.includes(h.id) && h.price <= 900);
    const ub = $('result-unlock');
    ub.classList.toggle('hidden', !next || !won);
    if (next && won) {
      const before = save.unlock || 0;
      save.unlock = Math.min(100, before + 10);
      const pic = ub.querySelector('.unlock-pic'); pic.innerHTML = '';
      const done = save.unlock >= 100;
      pic.appendChild(heroPortrait(next.look, 64, { locked: !done }));
      ub.classList.toggle('done', done);
      ub.querySelector('.unlock-title').textContent = done ? `${next.name.toUpperCase()} DÉBLOQUÉ !` : 'NOUVEL ASSASSIN';
      ub.querySelector('.unlock-pct').textContent = done ? next.label : `${save.unlock}%`;
      const bar = ub.querySelector('.unlock-bar i'); bar.style.transition = 'none'; bar.style.width = before + '%';
      setTimeout(() => { bar.style.transition = ''; bar.style.width = save.unlock + '%'; }, 60);
      if (done) { save.owned.push(next.id); save.unlock = 0; setTimeout(() => sfx.pickup(), 900); }
      persist();
    }
    // lucky wheel every 5 levels
    wheelReady = won && n % 5 === 0;
    $('btn-wheel').classList.toggle('hidden', !wheelReady);
    $('btn-result').textContent = won ? 'SUIVANT' : 'REJOUER';
    showScreen('result');
  }

  // ---------- Lucky wheel (no ads: offered every 5 levels) ----------
  const PRIZES = [
    { label: '50', gems: 50, color: '#8e5ad6' }, { label: 'CLÉ', key: 1, color: '#ffc93c' },
    { label: '100', gems: 100, color: '#8e5ad6' }, { label: 'XP+', xp: 120, color: '#ffc93c' },
    { label: '30', gems: 30, color: '#8e5ad6' }, { label: '250', gems: 250, color: '#ffc93c' },
    { label: '75', gems: 75, color: '#8e5ad6' }, { label: '150', gems: 150, color: '#ffc93c' },
  ];
  let wheelReady = false, wheelAngle = 0, spinning = false;
  function drawWheel(glow = -1, lit = 0) {
    const c = $('wheel-canvas'), g = c.getContext('2d'), R0 = c.width / 2;
    g.setTransform(1, 0, 0, 1, R0, R0); g.clearRect(-R0, -R0, c.width, c.height);
    g.rotate(wheelAngle);
    const n = PRIZES.length, sl = Math.PI * 2 / n;
    PRIZES.forEach((p, i) => {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0 - 14, i * sl - Math.PI / 2 - sl / 2, (i + 1) * sl - Math.PI / 2 - sl / 2); g.closePath();
      g.fillStyle = p.color; g.fill(); g.lineWidth = 6; g.strokeStyle = '#1c1a2b'; g.stroke();
      g.save(); g.rotate(i * sl); g.translate(0, -R0 * 0.62);
      g.font = '52px "Lilita One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 10; g.strokeStyle = '#1c1a2b'; g.strokeText(p.label, 0, 0); g.fillStyle = '#ffffff'; g.fillText(p.label, 0, 0);
      if (p.gems) { g.translate(0, 46); art.drawGem(g, 0, 0, 20, 0, 0.6); }
      g.restore();
    });
    // the winning slice glows once the wheel stops
    if (glow >= 0) {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0 - 14, glow * sl - Math.PI / 2 - sl / 2, (glow + 1) * sl - Math.PI / 2 - sl / 2); g.closePath();
      g.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(performance.now() / 90)})`; g.fill();
    }
    g.beginPath(); g.arc(0, 0, R0 - 8, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = '#1c1a2b'; g.stroke();
    g.lineWidth = 8; g.strokeStyle = '#ffd34d'; g.stroke();
    // marquee bulbs around the rim, blinking in turn
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      g.beginPath(); g.arc(Math.cos(a) * (R0 - 8), Math.sin(a) * (R0 - 8), 7, 0, Math.PI * 2);
      g.fillStyle = (i + lit) % 2 ? '#fff6c2' : '#b07a10'; g.fill();
    }
    g.beginPath(); g.arc(0, 0, 38, 0, Math.PI * 2); g.fillStyle = '#ffd34d'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#1c1a2b'; g.stroke();
  }
  function openWheel() {
    if (!wheelReady) return;
    showScreen('wheel'); $('wheel-result').textContent = '';
    $('btn-spin').classList.remove('hidden'); $('btn-wheel-close').classList.add('hidden');
    drawWheel();
  }
  function spinWheel() {
    if (spinning || !wheelReady) return;
    spinning = true; wheelReady = false; $('btn-wheel').classList.add('hidden');
    const n = PRIZES.length, win = Math.floor(Math.random() * n), sl = Math.PI * 2 / n;
    const start = wheelAngle, target = start - (start % (Math.PI * 2)) + Math.PI * 2 * 5 - win * sl;
    const t0 = performance.now(), dur = 3200;
    let lastTick = 0;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      wheelAngle = start + (target - start) * e;
      const tick = Math.floor(wheelAngle / sl);
      if (tick !== lastTick) {
        // each slice flicks the pin, like a real wheel catching on its pegs
        sfx.coin(); lastTick = tick;
        const pin = document.querySelector('.wheel-pin'); pin.classList.remove('flick'); void pin.offsetWidth; pin.classList.add('flick');
      }
      drawWheel(-1, Math.floor(now / 120));
      if (k < 1) return requestAnimationFrame(step);
      spinning = false;
      const p = PRIZES[win];
      if (p.gems) save.gems += p.gems;
      let chest = 0;
      if (p.key) { // a third key opens the chest right away instead of being lost
        save.keys = (save.keys || 0) + 1;
        if (save.keys >= 3) { save.keys = 0; chest = 100 + save.level * 5; save.gems += chest; }
      }
      if (p.xp) addXp(currentHero().id, p.xp);
      persist(); sfx.win(); vibrate(80);
      const t1 = performance.now();
      (function glow(now) { if (now - t1 < 1600 && !$('wheel').classList.contains('hidden')) { drawWheel(win, Math.floor(now / 80)); requestAnimationFrame(glow); } else drawWheel(win, 0); })(t1);
      const res = $('wheel-result'); res.classList.remove('pop'); void res.offsetWidth; res.classList.add('pop');
      $('wheel-result').textContent = p.gems ? `+${p.gems} diamants !` : p.key ? (chest ? `3e clé : coffre ouvert, +${chest} diamants !` : '+1 clé') : `+${p.xp} XP !`;
      $('btn-spin').classList.add('hidden'); $('btn-wheel-close').classList.remove('hidden');
    })(t0);
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
  click('btn-upgrade', () => openShop('upgrade'));
  click('btn-armory', () => openShop('armory'));
  click('btn-outfits', () => openShop('outfits'));
  click('btn-shop-close', showMenu);
  click('btn-result', startLevel);
  click('btn-wheel', openWheel);
  click('btn-spin', spinWheel);
  click('btn-wheel-close', () => showScreen('result'));
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
  let idleFrames = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    // behind the menu / pause / result screens, draw one frame and then let the GPU rest
    const live = state === 'playing' || state === 'won' || state === 'lost';
    if (live || idleFrames < 2) render();
    idleFrames = live ? 0 : idleFrames + 1;
    requestAnimationFrame(frame);
  }
  resize();
  showMenu();
  requestAnimationFrame(frame);

  // Hook for automated tests.
  window.__shadowStrike = {
    save, generateLevel, startLevel, kill, finish, triggerFreeze, canSee, findPath, isWallTile, angleDiff, GUARD_TYPES,
    tick(n, dt = 1 / 60) { for (let i = 0; i < n; i++) update(dt); },
    get level() { return L; }, get time() { return time; },
    get state() { return state; }, get guards() { return guards; }, get player() { return player; },
    heroLevel, get mines() { return mines; }, get hideSet() { return hideSet; }, inGrass: p => inGrass(p), get lasers() { return lasers; }, get bombs() { return bombs; },
  };
})();
