'use strict';
// Motion-design engine for the Shadow Strike videos (adapted from the kit's Valex ad).
// Everything is a pure function of time: render(t) puts every element where it belongs at t,
// so video/rendu.mjs can render frames in any order, on several pages at once.
// Gameplay clips come from video/enregistrer-partie.mjs; window.CLIPS (written by rendu.mjs) holds
// their frame count, fps and events, and window.CLIPS_ROOT the folder they live in.

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1080), H = +(Q.get('h') || 1920);
const stage = document.getElementById('stage');
stage.style.width = W + 'px'; stage.style.height = H + 'px';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  lin: x => x, out: x => 1 - Math.pow(1 - x, 3), in: x => x * x * x,
  inOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  expo: x => x >= 1 ? 1 : 1 - Math.pow(2, -11 * x),
  back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
// piecewise-linear map: [[t0, v0], [t1, v1], ...]
const pw = (pts, t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  return pts[pts.length - 1][1];
};

const els = [];
function mk(html, style = '', cls = '') {
  const d = document.createElement('div');
  d.className = 'abs ' + cls; d.style.cssText = style; d.innerHTML = html; stage.appendChild(d);
  const o = { el: d, anims: [], def: { x: 0, y: 0, s: 1, r: 0, o: 0, b: 0 }, from: -1e9, to: 1e9 };
  els.push(o); return o;
}
function A(o, t0, dur, props, ease = 'out') { o.anims.push({ t0, dur, props, ease }); return o; }
// visible only between t0 and t1 (hard cut), no fade
function cut(o, t0, t1) { o.from = t0; o.to = t1; o.def.o = 1; return o; }

// ---------- gameplay clips ----------
// clip(name, map, opts): map = [[videoT, clipT], ...] (time remapping: slow motion, speed-up, freeze)
// opts.cam: { z, at: 'hero' | [x, y] (clip pixels), ax, ay (where the point sits in the box, 0-1) }
//           z and at can be functions of the video time t.
function heroAt(c, ct) {
  const hs = c.hero; if (!hs.length) return [540, 960];
  // average over ±0.25 s so the camera glides instead of following every step
  let sx = 0, sy = 0, n = 0;
  for (const h of hs) if (Math.abs(h.t - ct) <= 0.25) { sx += h.x; sy += h.y; n++; }
  if (n) return [sx / n, sy / n];
  const near = hs.reduce((a, h) => Math.abs(h.t - ct) < Math.abs(a.t - ct) ? h : a);
  return [near.x, near.y];
}
function clip(name, map, { x = 0, y = 0, w = W, h = H, cam = {}, style = '', filter = '' } = {}) {
  const c = window.CLIPS[name];
  if (!c) throw new Error('clip inconnu : ' + name);
  if (!c.hero) c.hero = c.ev.filter(e => e.type === 'hero');
  const o = mk(`<img style="position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;${filter ? 'filter:' + filter : ''}">`,
    `left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;background:#222;${style}`);
  const img = o.el.firstChild;
  o.clipT = t => pw(map, t);
  o.tick = t => {
    const ct = o.clipT(t);
    const f = clamp(Math.round(ct * c.fps), 0, c.n - 1);
    const src = `${window.CLIPS_ROOT}/${name}/f${String(f).padStart(5, '0')}.jpg`;
    if (img.dataset.src !== src) { img.dataset.src = src; img.src = src; }
    const z = typeof cam.z === 'function' ? cam.z(t) : (cam.z || 1);
    const s = Math.max(w / 1080, h / 1920) * z;
    const at = cam.at === 'hero' ? heroAt(c, ct) : (typeof cam.at === 'function' ? cam.at(t, ct) : (cam.at || [540, 960]));
    let tx = (cam.ax ?? 0.5) * w - at[0] * s, ty = (cam.ay ?? 0.5) * h - at[1] * s;
    tx = clamp(tx, w - 1080 * s, 0); ty = clamp(ty, h - 1920 * s, 0);
    img.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    o.view = { s, tx, ty, ct }; // to place overlays on clip pixels
  };
  return o;
}
// clip pixel -> stage pixel, for an overlay placed on a clip
const onClip = (o, px, py) => [o.view.tx + px * o.view.s + parseFloat(o.el.style.left), o.view.ty + py * o.view.s + parseFloat(o.el.style.top)];
// is that stage point inside the clip's box? (overlays outside a gameplay card are hidden)
const inClip = (o, [x, y]) => { const l = parseFloat(o.el.style.left), t = parseFloat(o.el.style.top); return x > l && x < l + parseFloat(o.el.style.width) && y > t && y < t + parseFloat(o.el.style.height); };
// events of a clip that fall inside the part shown between t0 and t1, with their video time
function clipEvents(name, map, type) {
  const c = window.CLIPS[name], res = [];
  for (const e of c.ev) if (e.type === type) {
    for (let i = 1; i < map.length; i++) {
      const [ta, ca] = map[i - 1], [tb, cb] = map[i];
      if (cb !== ca && e.t >= Math.min(ca, cb) && e.t <= Math.max(ca, cb)) { res.push({ ...e, vt: ta + (tb - ta) * (e.t - ca) / (cb - ca) }); break; }
    }
  }
  return res;
}

// ---------- sound cues ----------
// the page lists its sound effects here; rendu.mjs saves them to sons.json for the mix (video/son.py)
window.SONS = [];
const sfx = (type, t, gain = 1) => { window.SONS.push({ type, t: +t.toFixed(3), gain }); };

// ---------- render ----------
async function render(t) {
  for (const o of els) {
    const live = t >= o.from && t < o.to;
    const st = { ...o.def }, set = {};
    for (const a of o.anims) for (const k in a.props) {
      const [f, to] = a.props[k];
      if (t >= a.t0) { st[k] = f + (to - f) * E[a.ease](clamp((t - a.t0) / a.dur)); set[k] = 1; }
      else if (!set[k]) { st[k] = f; set[k] = 1; }
    }
    const e = o.el, op = live ? clamp(st.o) : 0;
    e.style.opacity = op; e.style.visibility = op <= .002 ? 'hidden' : 'visible';
    if (op <= .002) continue;
    e.style.transform = `translate3d(${st.x}px,${st.y}px,0) rotate(${st.r + (o.def.r0 || 0)}deg) scale(${st.s})`;
    e.style.filter = st.b > .15 ? `blur(${st.b}px)` : '';
    if (o.tick) o.tick(t, e);
  }
  const imgs = [...stage.querySelectorAll('img')].filter(i => i.closest('.abs').style.visibility !== 'hidden' && i.src);
  await Promise.all(imgs.map(i => i.decode().catch(() => {})));
}
window.render = render;

// ---------- reusable pieces ----------
// giant word: slams in (scale 2.2 -> 1 with blur), keeps breathing a little
function slam(html, t0, t1, style, { from = 2.2, d = .26 } = {}) {
  const o = mk(html, style, 'type');
  cut(o, t0, t1); o.def.o = 0;
  A(o, t0, d, { o: [0, 1], s: [from, 1], b: [18, 0] }, 'expo');
  A(o, t0 + d, Math.max(.1, t1 - t0 - d), { s: [1, 1.04] }, 'lin');
  return o;
}
// small line that rises in
function rise(html, t0, t1, style, dy = 40) {
  const o = mk(html, style, 'type');
  cut(o, t0, t1); o.def.o = 0;
  A(o, t0, .32, { o: [0, 1], y: [dy, 0] }, 'out');
  return o;
}
// full-frame white flash (kill, title hit)
function flash(t0, d = .16, a = .85, col = '#fff') {
  const o = mk('', `left:0;top:0;width:${W}px;height:${H}px;background:${col};mix-blend-mode:screen`);
  cut(o, t0, t0 + d); A(o, t0, d, { o: [a, 0] }, 'out');
  return o;
}
// solid or gradient plate
function plate(bg, t0, t1) { const o = mk('', `left:0;top:0;width:${W}px;height:${H}px;background:${bg}`); return cut(o, t0, t1); }
// a white tap ring where the player taps (like the in-game ripple, bigger so it reads on a phone feed)
function tapRing(clipEl, ev, dur = .45) {
  const o = mk('<div style="width:100%;height:100%;border-radius:50%;border:10px solid #fff;box-shadow:0 0 24px rgba(0,0,0,.45)"></div>', 'width:120px;height:120px');
  cut(o, ev.vt, ev.vt + dur);
  o.tick = t => {
    const k = clamp((t - ev.vt) / dur), [px, py] = onClip(clipEl, ev.x, ev.y);
    o.el.style.left = px - 60 + 'px'; o.el.style.top = py - 60 + 'px';
    o.el.style.transform = `scale(${0.4 + k * 1.1})`; o.el.style.opacity = inClip(clipEl, [px, py]) ? 1 - k * k : 0;
  };
  return o;
}
// pointing hand (drawn here, white glove outline), taps at ev
function hand(clipEl, ev, dur = .5) {
  const svg = `<svg viewBox="0 0 100 120" width="150" height="180"><path d="M38 8c6 0 10 4 10 10v34l4-2c5-2 10 0 12 4l2 4 4-2c5-2 10 0 12 5l1 3 3-1c5-1 10 2 11 7l1 20c0 18-12 30-30 30H50c-10 0-18-5-23-13L9 78c-3-5-2-10 3-13 4-2 9-1 12 2l4 5V18c0-6 4-10 10-10z" fill="#fff" stroke="#16121f" stroke-width="5" stroke-linejoin="round"/></svg>`;
  const o = mk(svg, 'width:150px;height:180px;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))');
  cut(o, ev.vt - .3, ev.vt + dur);
  o.tick = t => {
    const [px, py] = onClip(clipEl, ev.x, ev.y);
    const k = t < ev.vt ? 1 - (ev.vt - t) / .3 : 1, press = t >= ev.vt && t < ev.vt + .12 ? .88 : 1;
    o.el.style.left = px - 40 + (1 - k) * 60 + 'px'; o.el.style.top = py - 8 + (1 - k) * 90 + 'px';
    o.el.style.transform = `scale(${press}) rotate(-12deg)`; o.el.style.opacity = inClip(clipEl, [px, py]) ? clamp(k * 2) : 0;
  };
  return o;
}
