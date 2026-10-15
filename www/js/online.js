// Offline-first link to the KamTech server: anonymous stats are queued on the phone and sent
// whenever there is a connection; announcements are fetched, cached, and shown from the menu only.
(() => {
  const cfg = window.SHADOW_ONLINE || {};
  const API = (cfg.api || '').replace(/\/+$/, '');
  const VERSION = String(cfg.version || '1.0.0').slice(0, 20);
  const QKEY = 'shadowstrike-queue', IDKEY = 'shadowstrike-device', PKEY = 'shadowstrike-promos', SEENKEY = 'shadowstrike-promo-seen';
  const MAX_QUEUE = 400, BATCH = 50, PROMO_TTL = 3 * 3600e3;

  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } };

  // random install id: says nothing about the person, only lets the stats count players
  let device = read(IDKEY, null);
  if (typeof device !== 'string' || device.length < 8) {
    const r = (crypto && crypto.getRandomValues) ? [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('') : String(Math.random()).slice(2) + Date.now();
    device = 'd' + r; write(IDKEY, device);
  }

  let queue = read(QKEY, []);
  if (!Array.isArray(queue)) queue = [];
  let sending = false;

  function track(type, level, data) {
    if (!API) return;
    queue.push({ t: Date.now(), type, level: Number.isFinite(level) ? level : null, data: data || {} });
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    write(QKEY, queue);
    if (queue.length >= 10) flush();
  }

  const payload = batch => JSON.stringify({ device, version: VERSION, events: batch });

  async function flush() {
    if (!API || sending || !queue.length || navigator.onLine === false) return;
    sending = true;
    const batch = queue.slice(0, BATCH);
    try {
      // text/plain keeps this a "simple" request: no CORS preflight, one round trip
      const r = await fetch(API + '/api/events', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: payload(batch), keepalive: true });
      // 4xx means the server will never accept these events: drop them instead of retrying forever
      if (r.ok || (r.status >= 400 && r.status < 500)) { queue.splice(0, batch.length); write(QKEY, queue); }
    } catch (e) { /* offline: keep the queue for later */ }
    sending = false;
    if (queue.length && navigator.onLine !== false) setTimeout(flush, 1500);
  }
  // when the app goes to the background, hand the queue to the browser so it survives the app being killed
  function flushOnHide() {
    if (!API || !queue.length || !navigator.sendBeacon) return;
    const batch = queue.slice(0, BATCH);
    if (navigator.sendBeacon(API + '/api/events', new Blob([payload(batch)], { type: 'text/plain' }))) { queue.splice(0, batch.length); write(QKEY, queue); }
  }
  window.addEventListener('online', () => { flush(); refreshPromos(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushOnHide(); else { flush(); refreshPromos(); } });
  setInterval(flush, 60e3);

  // ---------- announcements ----------
  let cache = read(PKEY, { at: 0, list: [] });
  if (!cache || !Array.isArray(cache.list)) cache = { at: 0, list: [] };
  async function refreshPromos(force) {
    if (!API || navigator.onLine === false) return;
    if (!force && Date.now() - cache.at < PROMO_TTL) return;
    try {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl && setTimeout(() => ctl.abort(), 6000);
      const r = await fetch(API + '/api/promos', { signal: ctl && ctl.signal });
      if (timer) clearTimeout(timer);
      if (!r.ok) return;
      const j = await r.json();
      cache = { at: Date.now(), list: Array.isArray(j.promos) ? j.promos : [] };
      write(PKEY, cache);
    } catch (e) { /* keep the cached list */ }
  }

  const safeUrl = u => typeof u === 'string' && /^https:\/\/[^\s]+$/i.test(u) ? u : null;
  // pick the announcement to show now: live, level reached, not seen within its cool-down
  function pickPromo(level) {
    const seen = read(SEENKEY, {}), now = Date.now();
    const ok = cache.list.filter(p => p && safeUrl(p.url) && p.title
      && level >= (p.min_level || 1)
      && (!p.starts_at || Date.parse(p.starts_at) <= now) && (!p.ends_at || Date.parse(p.ends_at) > now)
      && now - (seen[p.id] || 0) >= (p.every_hours || 24) * 3600e3);
    ok.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return ok[0] || null;
  }
  function markSeen(id) { const seen = read(SEENKEY, {}); seen[id] = Date.now(); write(SEENKEY, seen); }

  function openLink(url) {
    // Capacitor hands non-app URLs to the system browser; on the web this opens a new tab
    // ('noopener' in the features would make window.open return null and trigger the fallback)
    const w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* cross-origin */ } } else location.href = url;
  }

  window.KamOnline = {
    enabled: !!API, device, track, flush, refreshPromos, pickPromo, markSeen, openLink, safeUrl,
    get queued() { return queue.length; },
  };
  if (API) { track('session', null, { lang: (navigator.language || '').slice(0, 8), w: Math.round(screen.width), h: Math.round(screen.height) }); flush(); refreshPromos(); }
})();
