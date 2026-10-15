'use strict';
// Sound effects: short CC0 recordings (www/sfx, ~220 KB, see README credits) with synthesized
// fallbacks while they load; synthesized music (Web Audio).
window.KT = window.KT || {};
KT.audio = (() => {
  let ctx = null, sfxGain = null, musicGain = null, noiseBuf = null;
  const MUSIC = 0.26;
  const settings = { sfx: true, music: true };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // master bus: gentle glue compressor -> make-up gain -> brick-wall limiter.
    // (the browser's default compressor squashed every hit by ~12 dB, so the game sounded thin and quiet)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.18;
    const makeup = ctx.createGain(); makeup.gain.value = 1.9;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08;
    comp.connect(makeup); makeup.connect(limiter); limiter.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.connect(comp);
    musicGain = ctx.createGain(); musicGain.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    apply();
    startMusic();
    loadSamples();
  }

  // ---------- Recorded samples ----------
  const SAMPLES = ['pistol', 'smg', 'rifle', 'shotgun', 'cannon', 'slash1', 'slash2', 'draw', 'hit1', 'hit2', 'body',
    'clang', 'shatter', 'hurt', 'freeze', 'boom', 'crunch', 'zap', 'click', 'latch', 'coins', 'chest', 'ui', 'ui2',
    'step0', 'step1', 'step2', 'step3', 'grass0', 'grass1', 'combo', 'levelup', 'confirm'];
  const buf = {};
  function loadSamples() {
    for (const n of SAMPLES) {
      fetch('sfx/' + n + '.mp3').then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then(a => new Promise((ok, ko) => ctx.decodeAudioData(a, ok, ko)))
        .then(b => { buf[n] = normalize(b); }).catch(() => { /* keep the synthesized fallback */ });
    }
  }
  // every recording peaks at the same level, so a quiet file (the blade draw is ~-22 dB) still cuts through
  function normalize(b) {
    let peak = 0;
    for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; } }
    const k = peak > 0.001 ? Math.min(12, 0.95 / peak) : 1;
    if (k > 1.05) for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
    return b;
  }
  // plays a sample with a little random pitch so repeated sounds never feel robotic; false if not loaded yet
  // the same sample fired again within 40 ms is dropped, and at most 14 samples play at once:
  // bursts (several kills, gem showers) stay clean instead of turning into noise
  const lastPlay = {};
  let voices = 0;
  function play(name, { v = 1, rate = 1, vary = 0.08, at = 0 } = {}) {
    const b = buf[name];
    if (!ctx || !b) return false;
    const now = ctx.currentTime;
    if (!at && lastPlay[name] && now - lastPlay[name] < 0.04) return true;
    if (voices >= 14) return true;
    lastPlay[name] = now; voices++;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
    g.gain.value = v;
    s.connect(g); g.connect(sfxGain);
    s.onended = () => { voices--; };
    s.start(Math.max(ctx.currentTime, at || 0));
    return true;
  }
  const any = (...names) => names[Math.floor(Math.random() * names.length)];

  function apply() {
    if (!ctx) return;
    sfxGain.gain.value = settings.sfx ? 1 : 0;
    musicGain.gain.value = settings.music ? MUSIC : 0;
  }
  function set(s) { Object.assign(settings, s); apply(); }
  // music dips under big events (explosions) then comes back smoothly
  function duck(depth = 0.25, hold = 0.6) {
    if (!ctx || !settings.music) return;
    const g = musicGain.gain, t = ctx.currentTime, base = MUSIC;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(base * depth, t + 0.05);
    g.setValueAtTime(base * depth, t + hold);
    g.linearRampToValueAtTime(base, t + hold + 1.2);
  }
  // 0 = sneaking, 1 = spotted: adds a pulsing tension layer to the music, faded in and out
  let tension = 0, tensionTarget = 0;
  function setTension(v) { tensionTarget = v; }
  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function tone({ type = 'sine', f = 440, f2 = 0, t = 0.1, v = 0.3, at = 0, out = sfxGain, attack = 0.005 }) {
    if (!ctx) return;
    const now = Math.max(ctx.currentTime, at || ctx.currentTime);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + t);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    o.connect(g); g.connect(out);
    o.start(now); o.stop(now + t + 0.02);
  }

  function noise({ t = 0.1, v = 0.3, type = 'highpass', f = 1000, f2 = 0, q = 1, at = 0, out = sfxGain }) {
    if (!ctx) return;
    const now = Math.max(ctx.currentTime, at || ctx.currentTime);
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter();
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, now);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    s.connect(fl); fl.connect(g); g.connect(out);
    s.start(now, Math.random() * 0.5); s.stop(now + t + 0.02);
  }

  const later = s => (ctx ? ctx.currentTime + s : 0);
  // cinematic low-end hit layered under the big moments: a sub drop plus a dull thud of filtered noise
  function impact(v = 0.6, at = 0) {
    tone({ type: 'sine', f: 120, f2: 36, t: 0.28, v, at, attack: 0.002 });
    noise({ t: 0.12, v: v * 0.6, type: 'lowpass', f: 900, f2: 150, at });
  }

  const sfx = {
    tap() { play('ui', { v: 0.8 }) || tone({ type: 'triangle', f: 900, f2: 600, t: 0.05, v: 0.2 }); },
    button() { play('ui2', { v: 1 }) || tone({ type: 'triangle', f: 660, f2: 990, t: 0.08, v: 0.28 }); },
    slash() { play(any('slash1', 'slash2'), { v: 1 }) || noise({ t: 0.13, v: 0.5, type: 'bandpass', f: 7000, f2: 1500, q: 0.8 }); },
    // knife stab: blade whoosh, then the thud of the hit and the body falling
    kill() {
      impact(0.75, later(0.03));
      if (play(any('slash1', 'slash2'), { v: 1 })) {
        play(any('hit1', 'hit2'), { v: 1, at: later(0.04) });
        play('body', { v: 1, rate: 0.8, at: later(0.22) });
        return;
      }
      noise({ t: 0.13, v: 0.5, type: 'bandpass', f: 7000, f2: 1500, q: 0.8 });
      tone({ type: 'sine', f: 170, f2: 45, t: 0.22, v: 0.7 });
    },
    // consecutive gems climb in pitch, so a big pile of loot rings up like a jackpot
    gem(streak = 0) {
      const p = (1 + Math.min(streak, 20) * 0.035) * (1 + Math.random() * 0.05);
      tone({ type: 'triangle', f: 1300 * p, f2: 2100 * p, t: 0.08, v: 0.26 });
      tone({ type: 'sine', f: 2600 * p, t: 0.14, v: 0.1, at: later(0.03) });
    },
    // each weapon has its own real gunshot; far shots are quieter
    shot(weapon = 'pistol', dist = 0) {
      const v = Math.max(0.5, 1 - dist * 0.06);
      const name = weapon === 'energy' ? 'zap' : weapon;
      if (play(name, { v, rate: weapon === 'energy' ? 0.7 : 1, vary: 0.05 })) return;
      noise({ t: 0.16, v: 0.7, type: 'bandpass', f: 2200, f2: 400, q: 0.7 });
      tone({ type: 'square', f: 130, f2: 40, t: 0.1, v: 0.22 });
    },
    // spotted: a hard low stab under a two-note siren, so being seen feels like danger
    alert() {
      tone({ type: 'sawtooth', f: 110, f2: 82, t: 0.35, v: 0.28 });
      tone({ type: 'square', f: 880, t: 0.08, v: 0.18 });
      tone({ type: 'square', f: 1320, t: 0.12, v: 0.18, at: later(0.08) });
    },
    // soft "hm?" when a guard hears something
    suspect() { tone({ type: 'triangle', f: 520, f2: 760, t: 0.18, v: 0.18 }); },
    hurt() { impact(0.45); play('hurt', { v: 1 }) || tone({ type: 'sawtooth', f: 240, f2: 90, t: 0.2, v: 0.22 }); },
    freeze() {
      if (play('freeze', { v: 0.9, rate: 1.1 })) { play('shatter', { v: 0.35, rate: 1.6 }); return; }
      noise({ t: 0.7, v: 0.35, type: 'highpass', f: 1500, f2: 9000 });
      tone({ type: 'sine', f: 320, f2: 70, t: 0.35, v: 0.45 });
    },
    shatter() {
      if (play('shatter', { v: 1 })) { play('body', { v: 0.5, at: later(0.1) }); return; }
      noise({ t: 0.3, v: 0.5, type: 'highpass', f: 3000 });
      tone({ type: 'sine', f: 150, f2: 50, t: 0.18, v: 0.5 });
    },
    laser() { play('zap', { v: 0.8 }) || tone({ type: 'sawtooth', f: 200, f2: 110, t: 0.3, v: 0.16 }); },
    // opening shot: a soft rising whoosh, then a bright ping when the ring lands on the hero
    whoosh() { noise({ t: 0.6, v: 0.4, type: 'bandpass', f: 400, f2: 2400, q: 0.9 }); },
    spawn() {
      impact(0.5);
      tone({ type: 'sine', f: 520, f2: 1040, t: 0.18, v: 0.3 });
      tone({ type: 'triangle', f: 1560, t: 0.3, v: 0.16, at: later(0.08) });
    },
    // loot ring filling: short ticks that climb with the progress
    fillTick(k = 0) { tone({ type: 'triangle', f: 700 + k * 900, t: 0.05, v: 0.2 }); },
    // crate bursting open: wood crunch, a pop, then a bright sparkle run
    crate() {
      play('crunch', { v: 0.8, rate: 1.5 }) || noise({ t: 0.15, v: 0.6, type: 'bandpass', f: 1200, q: 0.8 });
      play('chest', { v: 0.9, rate: 1.2 });
      impact(0.6);
      [1047, 1319, 1568, 2093].forEach((f, i) => tone({ type: 'triangle', f, t: 0.14, v: 0.2, at: later(0.05 + i * 0.05) }));
    },
    pickup() { play('chest', { v: 0.9, rate: 1.3 }); play('confirm', { v: 0.8 }); [880, 1175, 1568].forEach((f, i) => tone({ type: 'triangle', f, t: 0.12, v: 0.22, at: later(i * 0.06) })); },
    win() {
      play('levelup', { v: 0.9, at: later(0.5) });
      impact(0.6);
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f, t: 0.25, v: 0.32, at: later(i * 0.11) }));
      tone({ type: 'triangle', f: 1319, t: 0.8, v: 0.28, at: later(0.46) });
      tone({ type: 'sawtooth', f: 262, t: 0.8, v: 0.08, at: later(0.46) });
    },
    lose() { impact(0.7); [392, 330, 262, 196].forEach((f, i) => tone({ type: 'sawtooth', f, t: 0.32, v: 0.2, at: later(i * 0.16) })); },
    star(i) { impact(0.35); tone({ type: 'triangle', f: 880 * Math.pow(1.26, i), t: 0.22, v: 0.32 }); tone({ type: 'sine', f: 1760 * Math.pow(1.26, i), t: 0.3, v: 0.12 }); },
    // mine countdown: a sharp electronic "tit" that climbs as the fuse burns down (ice mines chirp higher and softer)
    tick(k = 0, ice = false) {
      const f = (ice ? 2600 : 1900) * (1 + k * 0.5);
      tone({ type: 'square', f, t: 0.045, v: ice ? 0.16 : 0.24, attack: 0.001 });
      tone({ type: 'sine', f: f * 2, t: 0.03, v: 0.08, attack: 0.001 });
    },
    beep() { play('click', { v: 0.7, rate: 1.4 }) || tone({ type: 'square', f: 1750, t: 0.06, v: 0.12 }); },
    explosion() {
      duck(0.2, 0.8);
      impact(1);
      if (play('boom', { v: 1, vary: 0.03 })) { play('crunch', { v: 1 }); return; }
      noise({ t: 1.2, v: 0.9, type: 'lowpass', f: 900, f2: 120 });
      tone({ type: 'sine', f: 90, f2: 30, t: 0.9, v: 0.9 });
    },
    clang() {
      if (play('clang', { v: 1 })) return;
      noise({ t: 0.18, v: 0.45, type: 'bandpass', f: 4200, q: 6 });
      [1250, 1870, 2730].forEach((f, i) => tone({ type: 'square', f, t: 0.25, v: 0.06 / (i + 1) }));
    },
    coin() { play('coins', { v: 0.55, rate: 1.2 }) || tone({ type: 'square', f: 1600, f2: 2000, t: 0.04, v: 0.1 }); },
    heart() {
      tone({ type: 'sine', f: 62, f2: 40, t: 0.14, v: 0.55 });
      tone({ type: 'sine', f: 58, f2: 38, t: 0.12, v: 0.4, at: later(0.2) });
    },
    combo(n) {
      if (play('combo', { v: 0.9, rate: 1 + (n - 2) * 0.12, vary: 0 })) return;
      [0, 4, 7, 12].slice(0, Math.min(4, n + 1)).forEach((st, i) => tone({ type: 'triangle', f: 660 * Math.pow(2, st / 12), t: 0.12, v: 0.13, at: later(i * 0.05) }));
    },
    step(grass) { play(grass ? any('grass0', 'grass1') : any('step0', 'step1', 'step2', 'step3'), { v: grass ? 0.35 : 0.28, vary: 0.12 }); },
    unsheathe() { play('draw', { v: 0.8 }); },
    arm() { play('latch', { v: 1 }); },
  };

  // ---------- Music: stealthy minor groove, scheduled ahead ----------
  const BPM = 100, STEP = 60 / BPM / 4;
  const CHORDS = [[57, 3], [53, 4], [48, 4], [55, 4]];   // Am F C G (root, third)
  const BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
  const ARP = [0, 1, 2, 1, 3, 2, 1, 2];
  let step = 0, bar = 0, nextTime = 0, timer = null;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function scheduleStep(t) {
    const [root, third] = CHORDS[bar % 4];
    tension += (tensionTarget - tension) * (tensionTarget > tension ? 0.25 : 0.04);
    if (tension > 0.05) {
      tone({ type: 'square', f: midi(root - 24), t: STEP * 0.8, v: 0.1 * tension, at: t, out: musicGain });
      noise({ t: 0.025, v: 0.1 * tension, type: 'highpass', f: 9000, at: t, out: musicGain });
      if (step % 4 === 0) tone({ type: 'sawtooth', f: midi(root + 12 + (bar % 2 ? 1 : 0)), t: STEP * 3, v: 0.03 * tension, at: t, out: musicGain });
    }
    if (step === 0 || step === 8) tone({ type: 'sine', f: 120, f2: 42, t: 0.18, v: 0.6, at: t, out: musicGain });
    if (step === 4 || step === 12) noise({ t: 0.1, v: 0.18, type: 'bandpass', f: 1800, q: 0.6, at: t, out: musicGain });
    if (step % 2 === 1) noise({ t: 0.03, v: step % 4 === 3 ? 0.14 : 0.08, type: 'highpass', f: 8000, at: t, out: musicGain });
    if (BASS[step]) tone({ type: 'triangle', f: midi(root - 24 + (step === 11 ? 7 : 0)), t: STEP * 1.8, v: 0.45, at: t, out: musicGain });
    if (step % 2 === 0) {
      const notes = [root, root + third, root + 7, root + 12];
      const n = notes[ARP[(step / 2) % ARP.length]];
      tone({ type: 'sine', f: midi(n + 12), t: STEP * 1.6, v: bar % 8 < 4 ? 0.05 : 0.08, at: t, out: musicGain });
    }
  }

  function startMusic() {
    if (timer || !ctx) return;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + 0.15) {
        scheduleStep(nextTime);
        nextTime += STEP;
        step = (step + 1) % 16;
        if (step === 0) bar++;
      }
    }, 30);
  }

  return { init, set, settings, sfx, suspend, resume, duck, setTension };
})();
