// All sound is synthesized with WebAudio (no audio files). Starts on first user tap.
// Sound effects are kept few and soft; the race has a procedural soundtrack instead.
let ctx = null, master = null, musicBus = null, muted = false, noiseBuf = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.0001;
    musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ f = 440, f2 = null, dur = 0.2, type = 'square', vol = 0.2, delay = 0, attack = 0.01, dest = null, at = null }) {
  if (!ensure()) return;
  const t0 = at ?? ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.3, vol = 0.15, freq = 1500, delay = 0, type = 'bandpass', dest = null, at = null }) {
  if (!ensure()) return;
  const t0 = at ?? ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(dest || master);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
}

export const sfx = {
  unlock() { ensure(); },
  get muted() { return muted; },
  setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; },

  click() { tone({ f: 660, f2: 880, dur: 0.08, type: 'triangle', vol: 0.15 }); },
  pick() { tone({ f: 520, dur: 0.07, type: 'triangle', vol: 0.16 }); tone({ f: 780, dur: 0.1, type: 'triangle', vol: 0.16, delay: 0.06 }); },
  unpick() { tone({ f: 600, f2: 380, dur: 0.12, type: 'triangle', vol: 0.14 }); },
  nope() { tone({ f: 200, dur: 0.12, type: 'sawtooth', vol: 0.1 }); tone({ f: 160, dur: 0.16, type: 'sawtooth', vol: 0.1, delay: 0.1 }); },

  // Each car has its own honk pitch.
  honk(i = 0, car = null) {
    const voice = car?.voice ?? (i === 11 && !car?.pitch ? 'bark' : null);
    if (voice === 'bark' || voice === 'yip') { // dogs bark instead of honking (yip = small dog)
      const hi = voice === 'yip' ? 1.7 : 1;
      [0, 0.2].forEach((d) => { tone({ f: 420 * hi, f2: 190 * hi, dur: voice === 'yip' ? 0.09 : 0.12, type: 'sawtooth', vol: 0.12, delay: d }); noise({ dur: 0.1, vol: 0.06, freq: 900 * hi, delay: d }); });
      return;
    }
    const base = car?.pitch ?? [440, 520, 330, 300, 250, 400, 140, 360, 700, 120, 280][i % 11];
    tone({ f: base, f2: base * 0.96, dur: 0.28, type: 'square', vol: 0.1 });
    tone({ f: base * 1.26, f2: base * 1.2, dur: 0.28, type: 'square', vol: 0.08 });
    if (i === 8) [784, 659, 698, 523].forEach((f, k) => tone({ f, dur: 0.14, type: 'triangle', vol: 0.12, delay: 0.3 + k * 0.15 }));
  },
  rev() { tone({ f: 70, f2: 190, dur: 0.5, type: 'sawtooth', vol: 0.07 }); noise({ dur: 0.5, vol: 0.03, freq: 300 }); },

  countBeep() { tone({ f: 440, dur: 0.22, type: 'square', vol: 0.12 }); },
  goBeep() { tone({ f: 880, dur: 0.55, type: 'square', vol: 0.14 }); tone({ f: 1320, dur: 0.55, type: 'square', vol: 0.07 }); },

  spin() { tone({ f: 1100, f2: 220, dur: 0.5, type: 'sine', vol: 0.07 }); },
  jump() { tone({ f: 260, f2: 640, dur: 0.3, type: 'triangle', vol: 0.1 }); },
  land() { noise({ dur: 0.15, vol: 0.1, freq: 400 }); tone({ f: 110, f2: 60, dur: 0.16, type: 'sine', vol: 0.14 }); },
  finish() { noise({ dur: 0.8, vol: 0.08, freq: 2500 }); },

  fanfare() {
    const n = [[523, 0], [523, 0.14], [523, 0.28], [659, 0.42], [784, 0.7], [659, 0.95], [784, 1.1], [1046, 1.4]];
    n.forEach(([f, d], k) => {
      const last = k === n.length - 1;
      tone({ f, dur: last ? 0.9 : 0.2, type: 'square', vol: 0.12, delay: d });
      tone({ f: f / 2, dur: last ? 0.9 : 0.2, type: 'triangle', vol: 0.12, delay: d });
    });
    noise({ dur: 1.6, vol: 0.04, freq: 5000, delay: 0.3 });
  },
  // Rocket whistle + boom for fireworks.
  firework() {
    tone({ f: 500, f2: 1600, dur: 0.45, type: 'sine', vol: 0.05 });
    noise({ dur: 0.6, vol: 0.12, freq: 700, delay: 0.45, type: 'lowpass' });
    noise({ dur: 0.9, vol: 0.05, freq: 6000, delay: 0.5, type: 'highpass' });
    tone({ f: 120, f2: 40, dur: 0.4, type: 'sine', vol: 0.2, delay: 0.45 });
  },
  // Big triumphant chord stab used between sung verses.
  championStab() {
    [[392, 0], [494, 0], [587, 0], [784, 0.02]].forEach(([f, d]) => tone({ f, dur: 0.7, type: 'sawtooth', vol: 0.05, delay: d, attack: 0.02 }));
    tone({ f: 196, dur: 0.7, type: 'triangle', vol: 0.12 });
  },
  sadTrombone() {
    [[311, 0, 0.45], [294, 0.5, 0.45], [277, 1.0, 0.45], [262, 1.5, 1.1]].forEach(([f, d, du], k) => {
      tone({ f, f2: k === 3 ? f * 0.8 : f * 0.99, dur: du, type: 'sawtooth', vol: 0.08, delay: d, attack: 0.05 });
    });
  },
};

// ---------------------------------------------------------------------------
// Race soundtrack: a driving spy-chase groove in A minor, built from oscillators.
// Layers are added as the race heats up.
// ---------------------------------------------------------------------------
const BPM = 152, STEP = 60 / BPM / 4;
const BASS = [0, null, null, 0, null, null, 0, null, 3, null, null, 3, null, 5, null, 7,
              0, null, null, 0, null, null, 0, null, 10, null, 8, null, 7, null, 5, null];
const ROOTS = [0, 3, 5, -2];              // chord root per 8 steps
const ARP = [0, 7, 12, 7, 0, 7, 12, 15];
const LEAD = [0, null, null, 3, null, 7, null, null, 5, null, 3, null, 0, null, null, null,
              0, null, null, 3, null, 7, null, 12, 10, null, 8, null, 7, null, null, null];
const hz = (base, semis) => base * Math.pow(2, semis / 12);

let timer = null, nextTime = 0, stepIdx = 0, level = 0, shift = 0, playing = false, ducked = false;

function scheduleStep(i, at) {
  const bar = i % 32;
  const sh = shift;
  const d = musicBus;
  // drums
  if (i % 4 === 0) tone({ f: 150, f2: 45, dur: 0.16, type: 'sine', vol: 0.9, at, dest: d, attack: 0.002 });
  if (i % 8 === 4) { noise({ dur: 0.13, vol: 0.45, freq: 1900, at, dest: d }); tone({ f: 190, f2: 120, dur: 0.1, type: 'triangle', vol: 0.3, at, dest: d }); }
  if (level >= 2 ? true : i % 2 === 0) noise({ dur: 0.04, vol: i % 4 === 2 ? 0.28 : 0.15, freq: 7500, type: 'highpass', at, dest: d });
  // bass
  const b = BASS[bar];
  if (b !== null) tone({ f: hz(55, b + sh), dur: STEP * 2.2, type: 'sawtooth', vol: 0.32, at, dest: d, attack: 0.005 });
  // arpeggio
  if (level >= 1) {
    const root = ROOTS[Math.floor(bar / 8)];
    tone({ f: hz(220, root + ARP[bar % 8] + sh), dur: STEP * 0.9, type: 'square', vol: 0.09, at, dest: d, attack: 0.003 });
  }
  // lead
  if (level >= 2) {
    const l = LEAD[bar];
    if (l !== null) tone({ f: hz(440, l + sh), dur: STEP * 2.6, type: 'triangle', vol: 0.3, at, dest: d, attack: 0.01 });
  }
}

export const music = {
  start() {
    if (!ensure() || playing) return;
    playing = true; level = 0; shift = 0; stepIdx = 0;
    nextTime = ctx.currentTime + 0.06;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(ducked ? 0.1 : 0.26, ctx.currentTime, 0.2);
    timer = setInterval(() => {
      while (nextTime < ctx.currentTime + 0.15) { scheduleStep(stepIdx, nextTime); stepIdx++; nextTime += STEP; }
    }, 25);
  },
  // progress 0..1 -> adds layers; the last stretch goes up a step
  setIntensity(p) {
    level = p < 0.35 ? 0 : p < 0.72 ? 1 : 2;
    shift = p > 0.88 ? 2 : 0;
  },
  duck(on) {
    ducked = on;
    if (playing && musicBus) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.26, ctx.currentTime, 0.12);
  },
  stop() {
    if (!playing) return;
    playing = false; clearInterval(timer); timer = null;
    if (musicBus) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25); }
  },
  get playing() { return playing; },
};
