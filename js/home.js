// Home screen: every car revving in the garage.
import { theme } from './theme.js';
import { drawCar } from './cars.js';
import { sfx } from './sound.js';

const TAU = Math.PI * 2;

export function startHome(canvas) {
  const g = canvas.getContext('2d');
  const CARS = theme.CARS, K = theme.canvas;
  const narrow = window.matchMedia('(max-width: 760px)').matches;
  const cols = narrow ? 3 : (theme.homeCols || 4);
  const rows = Math.ceil(CARS.length / cols);
  const cellW = 320, cellH = 200;
  const W = cols * cellW, H = rows * cellH + 30;
  canvas.width = W; canvas.height = H;

  const state = CARS.map((c, i) => ({ car: c, puffs: [], phase: i * 1.7, rev: 0, nextRev: 0.5 + Math.random() * 2.5 }));
  const shouts = [];
  let t = 0, last = performance.now(), raf = 0, stopped = false;

  const pos = (i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = Math.min(cols, CARS.length - r * cols);
    const offset = ((cols - inRow) * cellW) / 2;
    return { x: offset + c * cellW + cellW / 2, y: 22 + r * cellH + 128 };
  };

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W, my = ((e.clientY - rect.top) / rect.height) * H;
    state.forEach((s, i) => { const p = pos(i); if (Math.abs(mx - p.x) < 110 && my > p.y - 130 && my < p.y + 50) { s.rev = 1; sfx.honk(i, s.car); sfx.rev(); shouts.push({ x: p.x + 40, y: p.y - 110, t: 0, w: theme.shouts[(Math.random() * theme.shouts.length) | 0] }); } });
  };

  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    g.clearRect(0, 0, W, H);
    state.forEach((s, i) => {
      const p = pos(i);
      s.nextRev -= dt;
      if (s.nextRev <= 0) { s.rev = 1; s.nextRev = 2 + Math.random() * 3.5; }
      s.rev = Math.max(0, s.rev - dt * 0.9);
      const r = s.rev;
      // garage mat
      g.fillStyle = K.mat; g.beginPath(); g.roundRect(p.x - 135, p.y - 6, 270, 54, 14); g.fill();
      g.fillStyle = K.matStripe; g.fillRect(p.x - 120, p.y + 40, 240, 4);
      // exhaust
      if (Math.random() < dt * (10 + r * 40)) s.puffs.push({ x: p.x - 96, y: p.y - 10, r: 5 + Math.random() * 5, a: 0.55 + r * 0.3, vx: -30 - r * 60 });
      s.puffs.forEach((q) => { q.x += q.vx * dt; q.y -= dt * 25; q.r += dt * 14; q.a -= dt * 0.9; });
      s.puffs = s.puffs.filter((q) => q.a > 0);
      for (const q of s.puffs) { g.fillStyle = `rgba(120,120,140,${q.a * 0.7})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.fill(); }
      const shake = Math.sin(t * (45 + r * 30) + s.phase) * (0.8 + r * 2.6);
      drawCar(g, s.car, p.x + (r > 0.05 ? Math.sin(t * 70 + i) * r * 2 : 0), p.y + 40, 190, {
        t, wheel: t * (8 + r * 30) + s.phase, mood: r > 0.2 ? 'race' : 'happy', bob: Math.max(0, shake), shadow: true,
      });
      g.font = '700 20px "Barlow Semi Condensed", sans-serif'; g.textAlign = 'center'; g.fillStyle = K.label;
      g.fillText(s.car.name.toUpperCase(), p.x, p.y + 74);
    });
    for (const sh of shouts) {
      sh.t += dt;
      const k = Math.min(1, sh.t / 0.2), a = 1 - Math.max(0, (sh.t - 0.7) / 0.4);
      g.save(); g.globalAlpha = Math.max(0, a); g.translate(sh.x, sh.y - sh.t * 40); g.rotate(-0.12); g.scale(k * 1.1, k * 1.1);
      g.font = '28px "Alfa Slab One", serif'; g.textAlign = 'center';
      g.lineWidth = 7; g.strokeStyle = K.shoutInk; g.lineJoin = 'round'; g.strokeText(sh.w, 0, 0);
      g.fillStyle = K.shout; g.fillText(sh.w, 0, 0); g.restore();
    }
    while (shouts.length && shouts[0].t > 1.2) shouts.shift();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame((n) => { last = n; frame(n); });
  return { stop() { stopped = true; cancelAnimationFrame(raf); canvas.onclick = null; } };
}
