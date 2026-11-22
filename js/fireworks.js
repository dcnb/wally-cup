// Simple canvas fireworks: rockets rise, then burst into glowing sparks.
const COLORS = ['#ff4d4d', '#ffd23f', '#43e06b', '#38b6ff', '#b388ff', '#ff4fd8', '#ffffff', '#ff9a2e'];

export class Fireworks {
  constructor() { this.rockets = []; this.sparks = []; }

  // Launch a rocket from (x, H) that explodes near (tx, ty).
  launch(x, y0, tx, ty, color = COLORS[(Math.random() * COLORS.length) | 0]) {
    const dist = y0 - ty, t = 0.8 + Math.random() * 0.3;
    this.rockets.push({ x, y: y0, vx: (tx - x) / t, vy: -dist / t, life: t, color });
  }

  burst(x, y, color, n = 46) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2, sp = 160 + Math.random() * 200;
      this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1 + Math.random() * 0.7, color: Math.random() < 0.25 ? '#fff' : color });
    }
  }

  update(dt, onBurst) {
    for (const r of this.rockets) {
      r.x += r.vx * dt; r.y += r.vy * dt; r.life -= dt;
      this.sparks.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 20, vy: 30, life: 0, max: 0.35, color: '#ffe9a8' });
      if (r.life <= 0) { r.dead = true; this.burst(r.x, r.y, r.color); onBurst?.(r); }
    }
    this.rockets = this.rockets.filter((r) => !r.dead);
    for (const s of this.sparks) { s.life += dt; s.vy += 140 * dt; s.vx *= 1 - dt * 0.8; s.vy *= 1 - dt * 0.5; s.x += s.vx * dt; s.y += s.vy * dt; }
    this.sparks = this.sparks.filter((s) => s.life < s.max);
    if (this.sparks.length > 2500) this.sparks.splice(0, this.sparks.length - 2500);
  }

  draw(g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of this.sparks) {
      g.globalAlpha = Math.max(0, 1 - s.life / s.max);
      g.fillStyle = s.color; g.beginPath(); g.arc(s.x, s.y, 3, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
}
