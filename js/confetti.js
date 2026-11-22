const COLORS = ['#e5483a', '#ffc93c', '#2e9aa0', '#f6ecd6', '#ff8a3c', '#1d2145'];

export class Confetti {
  constructor() { this.p = []; this.acc = 0; }

  burst(x, y, n, { spread = Math.PI * 0.9, power = 1, angle = -Math.PI / 2 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const sp = (380 + Math.random() * 620) * power;
      this.p.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: 6 + Math.random() * 8, h: 10 + Math.random() * 10,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14,
        flip: Math.random() * 6.28, vf: 4 + Math.random() * 8,
        c: COLORS[(Math.random() * COLORS.length) | 0], life: 0,
      });
    }
    if (this.p.length > 900) this.p.splice(0, this.p.length - 900);
  }

  update(dt, H) {
    for (const q of this.p) {
      q.life += dt;
      q.vy += 620 * dt;
      q.vx *= 1 - Math.min(1, dt * 0.7);
      q.vy *= 1 - Math.min(1, dt * 0.35);
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.rot += q.vr * dt; q.flip += q.vf * dt;
    }
    this.p = this.p.filter((q) => q.y < H + 40);
  }

  draw(g) {
    for (const q of this.p) {
      g.save();
      g.translate(q.x, q.y); g.rotate(q.rot); g.scale(1, Math.cos(q.flip));
      g.fillStyle = q.c; g.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      g.restore();
    }
  }
}
