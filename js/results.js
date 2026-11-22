// Podium screen: confetti for the champion, rain clouds for everybody else.
import { drawCar } from './cars.js';
import { Confetti } from './confetti.js';

const W = 1280, H = 720, TAU = Math.PI * 2;
const ORDINAL = ['1st', '2nd', '3rd', '4th'];

export function showResults({ canvas, standings, track }) {
  const g = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const winner = standings[0];
  const losers = standings.slice(1);
  const confetti = new Confetti();
  let t = 0, last = performance.now(), raf = 0, stopped = false, acc = 0, shots = 0;

  const shoot = (big) => {
    confetti.burst(W * 0.12, H + 10, big ? 70 : 14, { angle: -Math.PI * 0.40, spread: 0.7 });
    confetti.burst(W * 0.88, H + 10, big ? 70 : 14, { angle: -Math.PI * 0.60, spread: 0.7 });
    confetti.burst(W * 0.34, H * 0.7, big ? 60 : 10, { angle: -Math.PI * 0.5, spread: 1.2, power: 0.9 });
    confetti.burst(W * 0.66, H * 0.7, big ? 60 : 10, { angle: -Math.PI * 0.5, spread: 1.2, power: 0.9 });
    if (big) confetti.burst(W * 0.5, H * 0.45, 80, { angle: -Math.PI * 0.5, spread: Math.PI * 2, power: 0.8 });
  };
  shoot(true);

  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    acc += dt;
    if (acc > 0.14) { acc = 0; shoot(false); }
    if (t > 1.2 && shots === 0) { shots = 1; shoot(true); }
    if (t > 3 && shots === 1) { shots = 2; shoot(true); }
    confetti.update(dt, H);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    // stage
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1d2145'); bg.addColorStop(1, '#1d2145');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // spotlights
    for (const [sx, dir] of [[W * 0.3, 1], [W * 0.7, -1]]) {
      const sg = g.createLinearGradient(sx, 0, W * 0.5, H * 0.6);
      sg.addColorStop(0, 'rgba(255,240,170,0.3)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
      g.fillStyle = sg;
      g.beginPath(); g.moveTo(sx - 20, 0); g.lineTo(sx + 20, 0); g.lineTo(W * 0.5 + dir * -250, H * 0.62); g.lineTo(W * 0.5 + dir * 250, H * 0.62); g.fill();
    }
    // sunburst
    g.save(); g.translate(W / 2, 330); g.rotate(t * 0.15);
    for (let i = 0; i < 16; i++) {
      g.rotate(TAU / 16);
      g.fillStyle = i % 2 ? 'rgba(229,72,58,0.28)' : 'rgba(255,201,60,0.16)';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(700, -50); g.lineTo(700, 50); g.fill();
    }
    g.restore();

    confetti.draw(g); // behind the winner

    // title
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const pulse = 1 + Math.sin(t * 5) * 0.03;
    g.save(); g.translate(W / 2, 62); g.scale(pulse, pulse);
    g.font = '56px "Alfa Slab One", serif';
    g.lineWidth = 10; g.strokeStyle = '#e5483a'; g.lineJoin = 'round';
    g.strokeText('🏆 CHAMPION! 🏆', 0, 0);
    g.fillStyle = '#ffc93c'; g.fillText('🏆 CHAMPION! 🏆', 0, 0);
    g.restore();

    // podium
    const px = W / 2, pBase = 350;
    g.fillStyle = '#ffd21f'; g.strokeStyle = '#a87c00'; g.lineWidth = 5;
    g.beginPath(); g.roundRect(px - 200, pBase, 400, 56, 12); g.fill(); g.stroke();
    g.fillStyle = '#a87c00'; g.font = '700 38px "Barlow Semi Condensed", sans-serif';
    g.fillText('1', px, pBase + 30);

    // winner
    const jump = Math.abs(Math.sin(t * 4.5)) * 22;
    drawCar(g, winner, px, pBase, 290, { t, wheel: t * 3, mood: 'win', bob: jump, lean: Math.sin(t * 4.5) * 0.03 });
    // crown
    const cy = pBase - 225 - jump;
    g.save(); g.translate(px + 10, cy); g.rotate(Math.sin(t * 3) * 0.08);
    g.fillStyle = '#ffd21f'; g.strokeStyle = '#a87c00'; g.lineWidth = 4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-40, 28); g.lineTo(-48, -14); g.lineTo(-22, 6); g.lineTo(0, -26); g.lineTo(22, 6); g.lineTo(48, -14); g.lineTo(40, 28); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ff3b6b'; g.beginPath(); g.arc(0, 14, 6, 0, TAU); g.fill();
    g.restore();

    // name banner
    g.save(); g.translate(px, pBase + 92);
    g.font = '38px "Alfa Slab One", serif';
    const label = winner.name.toUpperCase();
    const bw = g.measureText(label).width + 80;
    g.fillStyle = '#e5483a'; g.strokeStyle = '#f6ecd6'; g.lineWidth = 5;
    g.beginPath(); g.roundRect(-bw / 2, -26, bw, 52, 26); g.fill(); g.stroke();
    g.fillStyle = '#f6ecd6'; g.fillText(label, 0, 2);
    g.restore();
    g.font = '600 20px "Barlow Semi Condensed", sans-serif'; g.fillStyle = '#f6ecd6';
    g.fillText(`wins the Wally Cup at ${track.name}!`, px, pBase + 140);

    // losers (sad!)
    const n = losers.length;
    const lw = Math.min(165, 760 / n);
    const gap = Math.min(300, (W - 200) / Math.max(1, n));
    losers.forEach((car, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * gap;
      const base = 676;
      // rain cloud
      const cx = x, cyy = base - lw * 0.78;
      for (let k = 0; k < 14; k++) {
        const rx = cx - 50 + ((k * 37 + t * 260) % 100), ry = cyy + 12 + ((k * 53 + t * 340) % 70);
        g.strokeStyle = 'rgba(140,200,255,0.8)'; g.lineWidth = 2.5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 3, ry + 9); g.stroke();
      }
      g.fillStyle = '#7d869a';
      for (const [dx, dy, r] of [[-28, 0, 22], [0, -9, 28], [30, 0, 22], [8, 6, 22], [-12, 8, 20]]) { g.beginPath(); g.arc(cx + dx, cyy + dy, r, 0, TAU); g.fill(); }
      drawCar(g, car, x, base, lw, { t: t + i, wheel: 0, mood: 'sad', bob: -2 + Math.sin(t * 1.6 + i) * 2, lean: 0.045 + Math.sin(t * 1.3 + i) * 0.01, alpha: 0.92 });
      g.font = '700 22px "Barlow Semi Condensed", sans-serif'; g.fillStyle = '#f6ecd6'; g.textAlign = 'center';
      g.fillText(`${ORDINAL[i + 1]} · ${car.name}`, x, base + 30);
    });
  }

  raf = requestAnimationFrame((now) => { last = now; frame(now); });
  return { stop() { stopped = true; cancelAnimationFrame(raf); } };
}
