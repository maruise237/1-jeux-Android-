// The level-solving bot, shared by verify-levels.mjs and the video recorder.
// installBot runs inside the page (page.evaluate(installBot)) and defines window.__botStep().
export function installBot() {
  const s = window.__shadowStrike;
  const W = 11; const H = () => s.level.H;
  function botStep() {
    const P = s.player, G = s.guards.filter(g => g.alive);
    if (!G.length) return;
    const seen = pt => G.some(g => g.frozen <= 0 && s.canSee(g, pt));
    const near = pt => G.some(g => g.frozen <= 0 && !g.sleep && Math.hypot(g.x - pt.x, g.y - pt.y) < 1.2 && Math.abs(s.angleDiff(g.angle, Math.atan2(pt.y - g.y, pt.x - g.x))) < 1.2);
    const onLaser = pt => s.lasers.some(l => {
      const ph = (s.time + l.phase) % l.period;
      const hot = ph < l.on + 0.25 || ph > l.period - 0.7;
      const hit = l.h ? Math.abs(pt.y - l.c) < 0.45 && pt.x > l.a - 0.2 && pt.x < l.b + 0.2 : Math.abs(pt.x - l.c) < 0.45 && pt.y > l.a - 0.2 && pt.y < l.b + 0.2;
      return hot && hit;
    });
    const nearBomb = pt => (s.bombs || []).some(b => b.state !== 'done' && Math.hypot(b.x - pt.x, b.y - pt.y) < (b.state === 'fuse' ? 2.4 : 0.85))
      || s.mines.some(m => m.state !== 'used' && Math.hypot(m.x - pt.x, m.y - pt.y) < (m.state === 'fuse' ? 2.6 : 0.8));
    const unsafe = pt => seen(pt) || near(pt) || onLaser(pt) || nearBomb(pt);
    const pathUnsafe = (path, look = 1.4) => {
      let prev = { x: P.x, y: P.y }, acc = 0;
      for (const q of path) {
        const d = Math.hypot(q.x - prev.x, q.y - prev.y), n = Math.max(1, Math.ceil(d / 0.25));
        for (let i = 1; i <= n; i++) {
          const pt = { x: prev.x + (q.x - prev.x) * i / n, y: prev.y + (q.y - prev.y) * i / n };
          acc += d / n; if (acc > look) return false;
          if (unsafe(pt)) return true;
        }
        prev = q;
      }
      return false;
    };
    // pick the best victim: frozen, or back turned, closest first
    let best = null, bs = 1e9;
    for (const g of G) {
      const back = Math.abs(s.angleDiff(g.angle, Math.atan2(P.y - g.y, P.x - g.x))) > 1.7;
      const sc = Math.hypot(g.x - P.x, g.y - P.y) + Math.random() * window.__noise + (g.frozen > 0 ? -5 : 0) + (back ? 0 : 4) + (g.shield && g.frozen <= 0 ? 3 : 0);
      if (sc < bs) { bs = sc; best = g; }
    }
    const attackPath = s.findPath(P, Math.floor(best.x), Math.floor(best.y));
    const back = Math.abs(s.angleDiff(best.angle, Math.atan2(P.y - best.y, P.x - best.x))) > 1.3;
    const okShield = !best.shield || best.frozen > 0 || back;
    if (attackPath && okShield && !pathUnsafe(attackPath, Math.hypot(best.x - P.x, best.y - P.y) < 1.6 ? 0.5 : 1.4)) {
      P.chase = best; P.repath = 0; return;
    }
    // otherwise hide: safe cell close to the target
    const here = { x: P.x, y: P.y };
    let spot = null, ss = 1e9;
    for (let y = 1; y < H() - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (s.isWallTile(x, y)) continue;
      const c = { x: x + 0.5, y: y + 0.5 };
      const dp = Math.hypot(c.x - P.x, c.y - P.y); if (dp > 6) continue;
      if (unsafe(c)) continue;
      const exposure = G.reduce((a, g) => a + (Math.hypot(g.x - c.x, g.y - c.y) < g.range + 0.5 ? 1 : 0), 0);
      const sc = dp * 0.6 + Math.hypot(c.x - best.x, c.y - best.y) * 0.5 + exposure * 1.2 + Math.random() * window.__noise;
      if (sc < ss) { ss = sc; spot = { x, y, c }; }
    }
    P.chase = null;
    if (!unsafe(here) && (!spot || Math.hypot(spot.c.x - P.x, spot.c.y - P.y) < 0.6)) { P.path = null; return; }
    if (spot) { const path = s.findPath(P, spot.x, spot.y); if (path && path.length) { P.path = path; P.pi = 0; window.__goal = { ...spot, t: 0 }; } }
  }

  window.__botStep = botStep;
  window.__noise = window.__noise || 0;
}
