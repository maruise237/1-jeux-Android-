'use strict';
// Sound effects: short CC0 recordings (www/sfx, ~220 KB, see README credits) with synthesized
// fallbacks while they load; synthesized music (Web Audio).
window.KT = window.KT || {};
KT.audio = (() => {
  let ctx = null, sfxGain = null, musicGain = null, noiseBuf = null;
  const settings = { sfx: true, music: true };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
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
    'step0', 'step1', 'step2', 'step3', 'grass0', 'grass1'];
  const buf = {};
  function loadSamples() {
    for (const n of SAMPLES) {
      fetch('sfx/' + n + '.mp3').then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then(a => new Promise((ok, ko) => ctx.decodeAudioData(a, ok, ko)))
        .then(b => { buf[n] = b; }).catch(() => { /* keep the synthesized fallback */ });
    }
  }
  // plays a sample with a little random pitch so repeated sounds never feel robotic; false if not loaded yet
  function play(name, { v = 1, rate = 1, vary = 0.08, at = 0 } = {}) {
    const b = buf[name];
    if (!ctx || !b) return false;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
    g.gain.value = v;
    s.connect(g); g.connect(sfxGain);
    s.start(Math.max(ctx.currentTime, at || 0));
    return true;
  }
  const any = (...names) => names[Math.floor(Math.random() * names.length)];

  function apply() {
    if (!ctx) return;
    sfxGain.gain.value = settings.sfx ? 0.8 : 0;
    musicGain.gain.value = settings.music ? 0.2 : 0;
  }
  function set(s) { Object.assign(settings, s); apply(); }
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

  const sfx = {
    tap() { play('ui', { v: 0.6 }) || tone({ type: 'triangle', f: 900, f2: 600, t: 0.05, v: 0.12 }); },
    button() { play('ui2', { v: 0.8 }) || tone({ type: 'triangle', f: 660, f2: 990, t: 0.08, v: 0.18 }); },
    slash() { play(any('slash1', 'slash2'), { v: 0.9 }) || noise({ t: 0.13, v: 0.5, type: 'bandpass', f: 7000, f2: 1500, q: 0.8 }); },
    // knife stab: blade whoosh, then the thud of the hit and the body falling
    kill() {
      if (play(any('slash1', 'slash2'), { v: 0.9 })) {
        play(any('hit1', 'hit2'), { v: 0.9, at: later(0.04) });
        play('body', { v: 0.7, rate: 0.85, at: later(0.22) });
        return;
      }
      noise({ t: 0.13, v: 0.5, type: 'bandpass', f: 7000, f2: 1500, q: 0.8 });
      tone({ type: 'sine', f: 170, f2: 45, t: 0.22, v: 0.7 });
    },
    gem() {
      const p = 1 + Math.random() * 0.2;
      tone({ type: 'triangle', f: 1300 * p, f2: 2100 * p, t: 0.08, v: 0.14 });
      tone({ type: 'sine', f: 2600 * p, t: 0.12, v: 0.05, at: later(0.03) });
    },
    // each weapon has its own real gunshot; far shots are quieter
    shot(weapon = 'pistol', dist = 0) {
      const v = Math.max(0.35, 1 - dist * 0.08);
      const name = weapon === 'energy' ? 'zap' : weapon;
      if (play(name, { v: weapon === 'energy' ? v : v * 0.85, rate: weapon === 'energy' ? 0.7 : 1, vary: 0.05 })) return;
      noise({ t: 0.16, v: 0.7, type: 'bandpass', f: 2200, f2: 400, q: 0.7 });
      tone({ type: 'square', f: 130, f2: 40, t: 0.1, v: 0.22 });
    },
    alert() {
      tone({ type: 'square', f: 880, t: 0.07, v: 0.1 });
      tone({ type: 'square', f: 1320, t: 0.1, v: 0.1, at: later(0.08) });
    },
    // soft "hm?" when a guard hears something
    suspect() { tone({ type: 'triangle', f: 520, f2: 760, t: 0.18, v: 0.09 }); },
    hurt() { play('hurt', { v: 1 }) || tone({ type: 'sawtooth', f: 240, f2: 90, t: 0.2, v: 0.22 }); },
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
    pickup() { play('chest', { v: 0.6, rate: 1.3 }); [880, 1175, 1568].forEach((f, i) => tone({ type: 'triangle', f, t: 0.12, v: 0.12, at: later(i * 0.06) })); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f, t: 0.25, v: 0.22, at: later(i * 0.11) }));
      tone({ type: 'triangle', f: 1319, t: 0.7, v: 0.18, at: later(0.46) });
    },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone({ type: 'sawtooth', f, t: 0.3, v: 0.1, at: later(i * 0.16) })); },
    star(i) { tone({ type: 'triangle', f: 880 * Math.pow(1.26, i), t: 0.2, v: 0.2 }); tone({ type: 'sine', f: 1760 * Math.pow(1.26, i), t: 0.3, v: 0.06 }); },
    beep() { play('click', { v: 0.7, rate: 1.4 }) || tone({ type: 'square', f: 1750, t: 0.06, v: 0.12 }); },
    explosion() {
      if (play('boom', { v: 1, vary: 0.03 })) { play('crunch', { v: 0.8 }); return; }
      noise({ t: 1.2, v: 0.9, type: 'lowpass', f: 900, f2: 120 });
      tone({ type: 'sine', f: 90, f2: 30, t: 0.9, v: 0.9 });
    },
    clang() {
      if (play('clang', { v: 1 })) return;
      noise({ t: 0.18, v: 0.45, type: 'bandpass', f: 4200, q: 6 });
      [1250, 1870, 2730].forEach((f, i) => tone({ type: 'square', f, t: 0.25, v: 0.06 / (i + 1) }));
    },
    coin() { play('coins', { v: 0.35, rate: 1.2 }) || tone({ type: 'square', f: 1600, f2: 2000, t: 0.04, v: 0.05 }); },
    step(grass) { play(grass ? any('grass0', 'grass1') : any('step0', 'step1', 'step2', 'step3'), { v: grass ? 0.25 : 0.18, vary: 0.12 }); },
    unsheathe() { play('draw', { v: 0.5 }); },
    arm() { play('latch', { v: 0.8 }); },
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

  return { init, set, settings, sfx, suspend, resume };
})();
