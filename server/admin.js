// Shadow Strike admin panel: stats + announcements. Talks to /api/admin/* on the same Vercel project.
(() => {
  const $ = id => document.getElementById(id);
  const TOKEN = 'kam-admin-token';
  let token = null;
  try { token = sessionStorage.getItem(TOKEN); } catch (e) { /* private mode */ }
  const nf = new Intl.NumberFormat('fr-FR');
  const fmt = n => n == null ? '–' : nf.format(n);

  async function api(path, opts = {}) {
    const r = await fetch(path, {
      ...opts,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) },
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== '/api/admin/login') { logout(); throw new Error(j.error || 'Session expirée'); }
    if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status);
    return j;
  }

  // ---------- login ----------
  function showLogin() { $('app').classList.add('hidden'); $('login').classList.remove('hidden'); $('pw').focus(); }
  function logout() { token = null; try { sessionStorage.removeItem(TOKEN); } catch (e) { /* ignore */ } showLogin(); }
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('button');
    btn.disabled = true; $('login-error').textContent = '';
    try {
      const j = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: $('pw').value }) });
      token = j.token; try { sessionStorage.setItem(TOKEN, token); } catch (err) { /* ignore */ }
      $('pw').value = ''; start();
    } catch (err) { $('login-error').textContent = err.message; }
    btn.disabled = false;
  });
  $('logout').addEventListener('click', logout);

  // ---------- navigation ----------
  let view = 'stats';
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  function setView(v) {
    view = v;
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === v)));
    $('view-stats').classList.toggle('hidden', v !== 'stats');
    $('view-promos').classList.toggle('hidden', v !== 'promos');
    $('days').closest('.period').classList.toggle('hidden', v !== 'stats');
    if (v === 'stats') loadStats(); else loadPromos();
  }
  $('days').addEventListener('change', loadStats);

  function start() { $('login').classList.add('hidden'); $('app').classList.remove('hidden'); setView(view); }

  // ---------- tooltip ----------
  const tip = $('tooltip');
  function showTip(text, x, y) { tip.textContent = text; tip.hidden = false; const w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + 'px'; tip.style.top = (y - 44) + 'px'; }
  const hideTip = () => { tip.hidden = true; };

  // ---------- bar chart (single series, so no legend: the title names it) ----------
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  function niceMax(v) { if (v <= 4) return 4; const p = 10 ** Math.floor(Math.log10(v)); const m = v / p; return (m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function barChart(box, items, label, describe) {
    box.innerHTML = '';
    const W = box.clientWidth || 600, H = box.clientHeight || 220, L = 36, B = 22, T = 8, R = 4;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label }, box);
    const max = niceMax(Math.max(0, ...items.map(d => d.v)));
    const y = v => T + (H - T - B) * (1 - v / max);
    const g = el('g', { class: 'grid' }, svg), ax = el('g', { class: 'axis' }, svg);
    for (let i = 0; i <= 4; i++) {
      const v = max * i / 4;
      el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v) }, g);
      const t = el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, ax); t.textContent = v >= 1000 ? nf.format(v / 1000) + 'k' : nf.format(v);
    }
    if (!items.length || max === 0 && items.every(d => !d.v)) {
      const t = el('text', { x: (L + W) / 2, y: H / 2, 'text-anchor': 'middle', class: 'nodata' }, svg); t.textContent = 'Pas encore de données sur cette période';
    }
    const band = (W - L - R) / Math.max(1, items.length), bw = Math.min(24, Math.max(2, band - 2));
    const every = Math.ceil(items.length / Math.max(1, Math.floor((W - L) / 64)));
    items.forEach((d, i) => {
      const cx = L + band * i + band / 2;
      const grp = el('g', { tabindex: 0, 'aria-label': describe(d) }, svg);
      el('rect', { class: 'hit', x: L + band * i, y: T, width: band, height: H - T - B }, grp);
      if (d.v > 0) {
        const h = Math.max(1, y(0) - y(d.v)), x0 = cx - bw / 2, y0 = y(d.v), r = Math.min(4, bw / 2, h);
        // rounded data end, square at the baseline
        el('path', { class: 'bar', d: `M${x0},${y0 + h}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + bw - r}Q${x0 + bw},${y0} ${x0 + bw},${y0 + r}V${y0 + h}Z` }, grp);
      }
      if (i % every === 0) { const t = el('text', { x: cx, y: H - 6, 'text-anchor': 'middle' }, ax); t.textContent = d.k; }
      const on = () => { grp.classList.add('on'); const b = grp.getBoundingClientRect(); showTip(describe(d), b.left + b.width / 2, box.getBoundingClientRect().top + y(d.v)); };
      const off = () => { grp.classList.remove('on'); hideTip(); };
      grp.addEventListener('pointerenter', on); grp.addEventListener('pointerleave', off);
      grp.addEventListener('focus', on); grp.addEventListener('blur', off);
    });
  }

  // ---------- tables ----------
  function table(t, cols, rows) {
    t.innerHTML = '';
    const head = t.createTHead().insertRow();
    for (const c of cols) { const th = document.createElement('th'); th.textContent = c.h; if (c.num) th.className = 'num'; head.appendChild(th); }
    const body = t.createTBody();
    if (!rows.length) { const td = body.insertRow().insertCell(); td.colSpan = cols.length; td.textContent = 'Rien sur cette période'; td.style.color = 'var(--muted)'; return; }
    for (const r of rows) {
      const tr = body.insertRow();
      for (const c of cols) { const td = tr.insertCell(); if (c.num) td.className = 'num'; const v = c.v(r); if (v instanceof Node) td.appendChild(v); else td.textContent = v; }
    }
  }
  const WARN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 15 14H1Z" fill="currentColor"/><path d="M8 6v3.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".9" fill="#fff"/></svg>';
  function rateCell(p) {
    const w = document.createElement('div'); w.className = 'rate';
    const bar = document.createElement('i'), fill = document.createElement('b'); fill.style.width = (p ?? 0) + '%'; bar.appendChild(fill);
    const s = document.createElement('span'); s.textContent = p == null ? '–' : p + ' %';
    w.append(bar, s); return w;
  }
  const ITEM_NAMES = { 'u-hp': 'Amélioration Endurance', 'u-spd': 'Amélioration Agilité', 'u-loot': 'Amélioration Pillage', 'u-crate': 'Amélioration Crochetage', 'u-quiet': 'Amélioration Discrétion' };
  function itemName(k) {
    if (!k) return '?';
    if (ITEM_NAMES[k]) return ITEM_NAMES[k];
    const [kind, ...rest] = k.split('-'), id = rest.join('-');
    return ({ k: 'Couteau', o: 'Tenue', h: 'Assassin', train: 'Entraînement' }[kind] || kind) + ' ' + id;
  }

  // ---------- stats ----------
  async function loadStats() {
    let s;
    try { s = await api('/api/admin/stats?days=' + $('days').value); } catch (e) { $('kpis').textContent = e.message; return; }
    $('stats-empty').classList.toggle('hidden', s.players_total > 0);
    const winRate = s.games ? Math.round(100 * s.wins / s.games) : null;
    const k = $('kpis'); k.innerHTML = '';
    const kpi = (l, v, h, lead) => { const d = document.createElement('div'); d.className = 'kpi' + (lead ? ' lead' : ''); d.innerHTML = '<span class="l"></span><span class="v"></span><span class="h"></span>'; d.querySelector('.l').textContent = l; d.querySelector('.v').textContent = v; d.querySelector('.h').textContent = h || ''; k.appendChild(d); };
    kpi('Joueurs au total', fmt(s.players_total), 'depuis le lancement', true);
    kpi('Actifs 24 h', fmt(s.active_1d));
    kpi('Actifs 7 jours', fmt(s.active_7d));
    kpi('Parties jouées', fmt(s.games), 'sur la période');
    kpi('Taux de victoire', winRate == null ? '–' : winRate + ' %');
    kpi('Reviennent le lendemain', s.retention_d1 == null ? '–' : s.retention_d1 + ' %', 'rétention J1');
    kpi('Reviennent après 7 jours', s.retention_d7 == null ? '–' : s.retention_d7 + ' %', 'rétention J7');

    const day = d => new Date(d.day + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    barChart($('chart-active'), s.daily.map(d => ({ k: day(d), v: d.active, d })), 'Joueurs actifs par jour', x => `${x.k} : ${fmt(x.v)} joueurs, ${fmt(x.d.games)} parties`);
    barChart($('chart-installs'), s.daily.map(d => ({ k: day(d), v: d.installs })), 'Nouveaux joueurs par jour', x => `${x.k} : ${fmt(x.v)} nouveaux`);
    barChart($('chart-reach'), s.reach.map(r => ({ k: String(r.level), v: r.players })), 'Joueurs par niveau maximum atteint', x => `Niveau ${x.k} : ${fmt(x.v)} joueurs arrêtés ici`);

    table($('t-levels'), [
      { h: 'Niveau', v: r => r.level },
      { h: 'Parties', num: true, v: r => fmt(r.wins + r.losses) },
      { h: 'Victoires', num: true, v: r => fmt(r.wins) },
      { h: 'Défaites', num: true, v: r => fmt(r.losses) },
      { h: 'Taux de victoire', v: r => rateCell(r.wins + r.losses ? Math.round(100 * r.wins / (r.wins + r.losses)) : null) },
      { h: 'Temps moyen', num: true, v: r => r.avg_secs == null ? '–' : `${Math.floor(r.avg_secs / 60)} min ${String(r.avg_secs % 60).padStart(2, '0')}` },
      { h: '', v: r => { const n = r.wins + r.losses; if (n < 5 || r.wins / n >= 0.35) return ''; const f = document.createElement('span'); f.className = 'flag'; f.innerHTML = WARN + 'Bloquant'; return f; } },
    ], s.levels);
    table($('t-buys'), [
      { h: 'Objet', v: r => itemName(r.item) },
      { h: 'Achats', num: true, v: r => fmt(r.n) },
      { h: 'Diamants dépensés', num: true, v: r => fmt(r.gems) },
    ], s.purchases);
    table($('t-versions'), [
      { h: 'Version', v: r => r.version },
      { h: 'Joueurs', num: true, v: r => fmt(r.players) },
    ], s.versions);
  }
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (view === 'stats' && token) loadStats(); }, 250); });

  // ---------- announcements ----------
  let promos = [];
  async function loadPromos() {
    const list = $('promo-list');
    try { promos = (await api('/api/admin/promos')).promos; } catch (e) { list.textContent = e.message; return; }
    list.innerHTML = '';
    if (!promos.length) {
      const d = document.createElement('div'); d.className = 'empty';
      d.innerHTML = '<h2>Aucune annonce</h2><p>Crée ta première annonce : un titre, un court texte et le lien vers ton outil. Elle n\'apparaît dans le jeu qu\'une fois activée.</p>';
      list.appendChild(d); return;
    }
    const now = Date.now();
    for (const p of promos) {
      const row = document.createElement('div'); row.className = 'promo-row';
      const sw = document.createElement('button'); sw.className = 'switch'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', String(p.active)); sw.setAttribute('aria-label', (p.active ? 'Désactiver ' : 'Activer ') + p.title);
      sw.onclick = async () => { sw.disabled = true; try { await api('/api/admin/promos?id=' + p.id, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) }); } catch (e) { alert(e.message); } loadPromos(); };
      const info = document.createElement('div');
      const h = document.createElement('h3'); h.textContent = p.title;
      const ended = p.ends_at && Date.parse(p.ends_at) <= now, future = p.starts_at && Date.parse(p.starts_at) > now;
      const st = document.createElement('span'); st.className = 'state' + (p.active && !ended && !future ? ' live' : '');
      st.textContent = !p.active ? 'Désactivée' : ended ? 'Terminée' : future ? 'Programmée le ' + new Date(p.starts_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'En ligne';
      const meta = document.createElement('div'); meta.className = 'meta';
      const a = document.createElement('a'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = p.url;
      meta.append(st, ' · dès le niveau ' + p.min_level + ' · ', a);
      info.append(h, meta);
      const nums = document.createElement('div'); nums.className = 'nums';
      const ctr = p.views ? Math.round(1000 * p.clicks / p.views) / 10 : null;
      for (const [v, l] of [[fmt(p.views), 'vues'], [fmt(p.clicks), 'clics'], [ctr == null ? '–' : ctr + ' %', 'taux de clic']]) {
        const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; const s = document.createElement('span'); s.textContent = l; d.append(b, s); nums.appendChild(d);
      }
      const btns = document.createElement('div'); btns.className = 'btns';
      const ed = document.createElement('button'); ed.className = 'ghost'; ed.textContent = 'Modifier'; ed.onclick = () => openEditor(p);
      const del = document.createElement('button'); del.className = 'ghost danger'; del.textContent = 'Supprimer';
      del.onclick = async () => { if (!confirm(`Supprimer « ${p.title} » ?`)) return; try { await api('/api/admin/promos?id=' + p.id, { method: 'DELETE' }); } catch (e) { alert(e.message); } loadPromos(); };
      btns.append(ed, del);
      row.append(sw, info, nums, btns);
      list.appendChild(row);
    }
  }

  // ---------- editor with live preview ----------
  const form = $('promo-form'), dlg = $('editor');
  let editing = null;
  const toLocal = iso => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 16); };
  function openEditor(p) {
    editing = p || null;
    $('editor-title').textContent = p ? 'Modifier l\'annonce' : 'Nouvelle annonce';
    form.reset();
    const f = form.elements;
    if (p) {
      for (const k of ['title', 'body', 'cta_label', 'url', 'min_level', 'priority']) f[k].value = p[k] ?? '';
      f.image_url.value = p.image_url || ''; f.starts_at.value = toLocal(p.starts_at); f.ends_at.value = toLocal(p.ends_at);
      f.every_hours.value = String(p.every_hours); if (!f.every_hours.value) { const o = new Option(p.every_hours + ' heures', p.every_hours); f.every_hours.add(o); f.every_hours.value = String(p.every_hours); }
      f.active.checked = p.active;
    }
    $('form-error').textContent = '';
    preview(); dlg.showModal(); f.title.focus();
  }
  function preview() {
    const f = form.elements;
    $('pv-title').textContent = f.title.value || 'Ton titre ici';
    $('pv-body').textContent = f.body.value; $('pv-body').hidden = !f.body.value;
    $('pv-cta').textContent = f.cta_label.value || 'En savoir plus';
    const img = $('pv-img'), src = /^https:\/\/\S+$/i.test(f.image_url.value) ? f.image_url.value : '';
    if (!src) img.hidden = true; else if (img.getAttribute('src') !== src) { img.hidden = true; img.onload = () => { img.hidden = false; }; img.onerror = () => { img.hidden = true; }; img.src = src; }
  }
  form.addEventListener('input', preview);
  $('new-promo').addEventListener('click', () => openEditor(null));
  $('cancel').addEventListener('click', () => dlg.close());
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = form.elements;
    const body = {
      title: f.title.value, body: f.body.value, cta_label: f.cta_label.value || 'En savoir plus', url: f.url.value, image_url: f.image_url.value || null,
      starts_at: f.starts_at.value ? new Date(f.starts_at.value).toISOString() : null, ends_at: f.ends_at.value ? new Date(f.ends_at.value).toISOString() : null,
      min_level: f.min_level.value, every_hours: f.every_hours.value, priority: f.priority.value, active: f.active.checked,
    };
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await api('/api/admin/promos' + (editing ? '?id=' + editing.id : ''), { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) });
      dlg.close(); loadPromos();
    } catch (err) { $('form-error').textContent = err.message; }
    btn.disabled = false;
  });

  if (token) start(); else showLogin();
})();
