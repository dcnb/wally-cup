// Championship celebration: fireworks all around the champion while the announcer sings.
import { drawCar } from './cars.js';
import { Confetti } from './confetti.js';
import { Fireworks } from './fireworks.js';
import { sfx } from './sound.js';
import { announcer, LINES } from './announcer.js';

const W = 1280, H = 720, TAU = Math.PI * 2;

export function showChampion({ canvas, car, runnerUp = null }) {
  const g = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const fw = new Fireworks(), confetti = new Confetti();
  const px = W / 2, pBase = 500;
  let t = 0, last = performance.now(), raf = 0, stopped = false, acc = 0, singing = 0, verse = '';
  let boomCd = 0;

  const volley = () => {
    // rockets from the bottom corners and edges, bursting in a ring around the champion
    const a = Math.random() * TAU, rx = 330 + Math.random() * 130, ry = 190 + Math.random() * 70;
    const tx = px + Math.cos(a) * rx, ty = Math.max(70, pBase - 150 + Math.sin(a) * ry);
    fw.launch(tx + (Math.random() - 0.5) * 300, H + 10, tx, ty);
  };

  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; acc += dt; boomCd -= dt;
    if (acc > 0.28) { acc = 0; volley(); if (Math.random() < 0.5) volley(); }
    fw.update(dt, () => { if (boomCd <= 0) { sfx.firework(); boomCd = 0.45; } });
    confetti.update(dt, H);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    g.fillStyle = '#1d2145'; g.fillRect(0, 0, W, H); // same ink stage as the podium screen
    for (let i = 0; i < 50; i++) { // paper-cream stars
      g.fillStyle = `rgba(246,236,214,${0.25 + 0.6 * Math.abs(Math.sin(t * 2 + i))})`;
      g.fillRect((i * 211) % W, (i * 97) % (H * 0.7), 3, 3);
    }
    g.save(); g.translate(px, 330); g.rotate(t * 0.12);
    for (let i = 0; i < 18; i++) { g.rotate(TAU / 18); g.fillStyle = i % 2 ? 'rgba(229,72,58,0.28)' : 'rgba(255,201,60,0.16)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(760, -45); g.lineTo(760, 45); g.fill(); }
    g.restore();

    fw.draw(g);
    confetti.draw(g);

    // title
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const pulse = 1 + Math.sin(t * 5) * 0.03;
    g.save(); g.translate(W / 2, 62); g.scale(pulse, pulse);
    g.font = '54px "Alfa Slab One", serif'; g.lineWidth = 10; g.strokeStyle = '#e5483a'; g.lineJoin = 'round';
    g.strokeText('🏆 WALLY CUP CHAMPION! 🏆', 0, 0);
    g.fillStyle = '#ffc93c'; g.fillText('🏆 WALLY CUP CHAMPION! 🏆', 0, 0);
    g.restore();

    // podium + car
    g.fillStyle = '#ffd21f'; g.strokeStyle = '#a87c00'; g.lineWidth = 5;
    g.beginPath(); g.roundRect(px - 230, pBase, 460, 62, 12); g.fill(); g.stroke();
    g.fillStyle = '#a87c00'; g.font = '700 40px "Barlow Semi Condensed", sans-serif'; g.fillText('1', px, pBase + 33);
    const jump = Math.abs(Math.sin(t * 4.5)) * 24;
    drawCar(g, car, px, pBase, 330, { t, wheel: t * 3, mood: 'win', bob: jump, lean: Math.sin(t * 4.5) * 0.03 });
    const cy = pBase - 255 - jump;
    g.save(); g.translate(px + 10, cy); g.rotate(Math.sin(t * 3) * 0.08);
    g.fillStyle = '#ffd21f'; g.strokeStyle = '#a87c00'; g.lineWidth = 4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-40, 28); g.lineTo(-48, -14); g.lineTo(-22, 6); g.lineTo(0, -26); g.lineTo(22, 6); g.lineTo(48, -14); g.lineTo(40, 28); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ff3b6b'; g.beginPath(); g.arc(0, 14, 6, 0, TAU); g.fill();
    g.restore();

    // name banner
    g.save(); g.translate(px, pBase + 100);
    g.font = '40px "Alfa Slab One", serif';
    const label = car.name.toUpperCase(), bw = g.measureText(label).width + 90;
    g.fillStyle = '#e5483a'; g.strokeStyle = '#f6ecd6'; g.lineWidth = 5;
    g.beginPath(); g.roundRect(-bw / 2, -28, bw, 56, 28); g.fill(); g.stroke();
    g.fillStyle = '#f6ecd6'; g.fillText(label, 0, 3);
    g.restore();

    // the lyrics
    if (verse) {
      g.font = '700 30px "Barlow Semi Condensed", sans-serif';
      const tw = g.measureText(`♪ ${verse} ♪`).width + 50;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.roundRect(W / 2 - tw / 2, 108, tw, 46, 23); g.fill();
      g.fillStyle = '#ffe9a8'; g.fillText(`♪ ${verse} ♪`, W / 2, 132);
    }
    if (runnerUp) { g.font = '600 20px "Barlow Semi Condensed", sans-serif'; g.fillStyle = 'rgba(246,236,214,0.8)'; g.fillText(`Runner-up: ${runnerUp.name}`, px, H - 18); }
  }

  async function sing() {
    const my = ++singing;
    const lines = LINES.championSong(car.name);
    for (const line of lines) {
      if (stopped || my !== singing) return;
      verse = line;
      sfx.championStab();
      confetti.burst(px, H * 0.55, 60, { spread: Math.PI * 2, power: 0.8 });
      for (let k = 0; k < 3; k++) volley();
      await announcer.sayAsync(line, { rate: 0.78, pitch: 1.65 });
      await new Promise((r) => setTimeout(r, 250));
    }
    if (my === singing) verse = '';
  }

  for (let i = 0; i < 6; i++) setTimeout(volley, i * 150);
  raf = requestAnimationFrame((now) => { last = now; frame(now); });
  setTimeout(sing, 700);
  return {
    sing,
    stop() { stopped = true; singing++; cancelAnimationFrame(raf); announcer.cancel(); },
  };
}
