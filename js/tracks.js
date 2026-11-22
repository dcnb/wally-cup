// Procedural scenery for the tracks. All canvas, no images.
// A theme can supply its own scenery per track id (theme.scenes), which is checked first.
import { theme } from './theme.js';
const scene = (track) => theme.scenes?.[track.id];
export { tiles, tri, ell, hash };

const TAU = Math.PI * 2;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Call cb(i, screenX) for every item of a repeating world layer that is visible.
function tiles(period, offset, W, pad, cb) {
  const i0 = Math.floor((offset - pad) / period);
  const i1 = Math.ceil((offset + W + pad) / period);
  for (let i = i0; i <= i1; i++) cb(i, i * period + (hash(i * 3.3) - 0.5) * period * 0.6 - offset);
}

function tri(g, x, y, w, h, fill) {
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x, y - h); g.lineTo(x + w / 2, y); g.closePath();
  g.fillStyle = fill; g.fill();
}

function ell(g, x, y, rx, ry, fill, rot = 0) {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = fill; g.fill();
}

// ---------- SKY / FAR BACKGROUND (fills y from 0 down to the lanes) ----------

export function drawSky(g, track, W, H, horizon, scroll, t) {
  const S = scene(track);
  if (S) { S.sky(g, W, H, horizon, scroll, t); S.mid?.(g, W, horizon, scroll, t); return; }
  if (track.id === 'desert') skyDesert(g, W, H, horizon, scroll, t);
  else if (track.id === 'sea') skySea(g, W, H, horizon, scroll, t);
  else if (track.id === 'rainbow') skyRainbow(g, W, H, horizon, scroll, t);
  else skyForest(g, W, H, horizon, scroll, t);
  drawMid(g, track, W, horizon, scroll, t);
}

// Extra depth layers that slide faster than the far background but slower than the lanes.
function drawMid(g, track, W, hz, scroll, t) {
  const base = hz + 12;
  if (track.id === 'desert') {
    tiles(240, scroll * 0.24, W, 120, (i, x) => {
      const w = 70 + hash(i + 11) * 60, h = hz * (0.16 + hash(i + 12) * 0.14);
      g.fillStyle = '#c97b49'; g.beginPath(); g.moveTo(x - w, base); g.quadraticCurveTo(x - w * 0.6, base - h, x, base - h); g.quadraticCurveTo(x + w * 0.6, base - h, x + w, base); g.fill();
    });
    tiles(180, scroll * 0.42, W, 80, (i, x) => cactus(g, x, base + 4, hz * (0.22 + hash(i + 21) * 0.12)));
  } else if (track.id === 'rainbow') {
    tiles(380, scroll * 0.2, W, 200, (i, x) => rainbowArc(g, x, base + 30, 90 + hash(i + 41) * 70, hz * 0.07, 0.5));
    tiles(260, scroll * 0.42, W, 120, (i, x) => rainbowArc(g, x, base + 20, 50 + hash(i + 43) * 40, hz * 0.05, 0.8));
  } else if (track.id === 'sea') {
    tiles(200, scroll * 0.2, W, 120, (i, x) => {
      const h = hz * (0.2 + hash(i + 31) * 0.2);
      g.fillStyle = 'rgba(20,100,180,0.55)'; g.beginPath(); g.ellipse(x, base + 6, 70 + hash(i) * 30, h, 0, Math.PI, 0); g.fill();
    });
    tiles(150, scroll * 0.4, W, 60, (i, x) => { g.globalAlpha = 0.55; seaweed(g, x, base + 10, hz * (0.35 + hash(i + 8) * 0.25), t, i); g.globalAlpha = 1; });
  } else {
    tiles(110, scroll * 0.4, W, 80, (i, x) => pine(g, x, base + 8, 46 + hash(i + 3) * 14, 120 + hash(i + 4) * 60, '#17573a', '#124730'));
  }
}

// Big, fast, in-your-face objects along the bottom edge. Drawn over the lanes for a sense of speed.
export function drawForeground(g, track, W, H, scroll, t) {
  const S = scene(track);
  if (S) { S.foreground?.(g, W, H, scroll, t); return; }
  const sc = scroll * 1.9, u = H * 0.2;
  g.save(); g.lineJoin = 'round';
  tiles(1250, sc, W, 260, (i, x) => {
    if (track.id === 'desert') {
      if (hash(i + 4) < 0.6) cactus(g, x, H + 10, u * 1.2); else { g.fillStyle = '#8f949e'; g.strokeStyle = '#1b1b24'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, H + 8, u * 0.8, u * 0.55, 0, Math.PI, 0); g.fill(); g.stroke(); }
    } else if (track.id === 'rainbow') {
      glowStar(g, x, H - u * (0.35 + hash(i + 4) * 0.4), u * (0.35 + hash(i + 9) * 0.25), t + i, i);
    } else if (track.id === 'sea') {
      if (hash(i + 4) < 0.55) { g.globalAlpha = 0.95; seaweed(g, x, H + 8, u * 1.4, t, i); seaweed(g, x + 26, H + 8, u * 1.1, t, i + 3); g.globalAlpha = 1; }
      else for (let k = 0; k < 5; k++) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x + (k - 2) * 22, H - ((t * 60 + k * 40) % (u * 1.4)), 6 + k * 2, 0, TAU); g.stroke(); }
    } else {
      g.fillStyle = '#5b3a1f'; g.strokeStyle = '#1b1b24'; g.lineWidth = 4;
      g.beginPath(); g.rect(x - 20, H - u * 0.8, 40, u * 0.9); g.fill(); g.stroke();
      g.strokeStyle = '#3d2610'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 8, H - u * 0.7); g.lineTo(x - 8, H); g.moveTo(x + 8, H - u * 0.6); g.lineTo(x + 8, H); g.stroke();
      g.fillStyle = '#2a8a56'; g.strokeStyle = '#1b1b24'; g.lineWidth = 3;
      for (let k = -1; k <= 1; k += 2) { g.beginPath(); g.moveTo(x + k * 22, H + 4); g.quadraticCurveTo(x + k * 70, H - u * 0.7, x + k * 100, H - u * 0.2); g.quadraticCurveTo(x + k * 60, H - u * 0.2, x + k * 22, H + 4); g.fill(); g.stroke(); }
    }
  });
  g.restore();
}

function skyDesert(g, W, H, hz, scroll, t) {
  const gr = g.createLinearGradient(0, 0, 0, hz);
  gr.addColorStop(0, '#5cc0f5'); gr.addColorStop(1, '#ffe9b8');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // sun
  const sx = W * 0.82, sy = hz * 0.42;
  const sg = g.createRadialGradient(sx, sy, 10, sx, sy, hz * 0.8);
  sg.addColorStop(0, 'rgba(255,240,170,0.9)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
  g.fillStyle = sg; g.fillRect(0, 0, W, hz);
  ell(g, sx, sy, hz * 0.17, hz * 0.17, '#fff3a8');
  // clouds
  tiles(520, scroll * 0.03, W, 150, (i, x) => {
    const y = hz * (0.18 + hash(i) * 0.3), s = 0.7 + hash(i + 9) * 0.6;
    ell(g, x, y, 60 * s, 16 * s, 'rgba(255,255,255,0.85)'); ell(g, x + 30 * s, y - 10 * s, 36 * s, 16 * s, 'rgba(255,255,255,0.85)');
  });
  // mesas
  tiles(420, scroll * 0.06, W, 220, (i, x) => {
    const w = 150 + hash(i + 2) * 110, h = hz * (0.35 + hash(i + 5) * 0.25);
    g.fillStyle = '#d98a56';
    g.beginPath(); g.moveTo(x - w / 2, hz); g.lineTo(x - w / 2 + 18, hz - h); g.lineTo(x + w / 2 - 18, hz - h); g.lineTo(x + w / 2, hz); g.fill();
    g.fillStyle = '#c0703f'; g.fillRect(x - w / 2 + 14, hz - h * 0.5, w - 28, 5); g.fillRect(x - w / 2 + 8, hz - h * 0.25, w - 16, 5);
  });
  // dunes
  g.fillStyle = '#f2c777';
  g.beginPath(); g.moveTo(0, hz + 4);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 26 + Math.sin((x + scroll * 0.14) * 0.008) * 16 + Math.sin((x + scroll * 0.14) * 0.021) * 6);
  g.lineTo(W, hz + 4); g.fill();
}

// Rainbow Road uses the poster palette: tomato, orange, mustard, leaf green, teal, ink blue.
// No violet or magenta anywhere on this track.
const RAINBOW = ['#e5483a', '#ff8a3c', '#ffc93c', '#6fb552', '#2e9aa0', '#3d6fb0'];
const STAR_COLS = ['#ffc93c', '#f6ecd6', '#ff8a3c'];
const SPACE_INK = '#1d2145';

function rainbowArc(g, x, y, r, bw, alpha) {
  g.save(); g.globalAlpha = alpha; g.lineWidth = bw;
  RAINBOW.forEach((c, k) => { g.strokeStyle = c; g.beginPath(); g.arc(x, y, r - k * bw * 0.95, Math.PI, 0); g.stroke(); });
  g.restore();
}

function glowStar(g, x, y, r, rot, seed) {
  g.save(); g.translate(x, y); g.rotate(Math.sin(rot) * 0.4);
  g.fillStyle = STAR_COLS[seed % 3]; g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.lineJoin = 'round';
  g.beginPath();
  for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke();
  g.restore();
}

function skyRainbow(g, W, H, hz, scroll, t) {
  // flat night-ink poster sky, like the results stage
  g.fillStyle = SPACE_INK; g.fillRect(0, 0, W, H);
  // big slow sunburst behind the horizon, tone-on-tone
  g.save(); g.translate(W * 0.5, hz * 1.1); g.rotate(scroll * 0.0004 + t * 0.03);
  for (let k = 0; k < 20; k++) { g.rotate(TAU / 20); g.fillStyle = k % 2 ? 'rgba(229,72,58,0.10)' : 'rgba(255,201,60,0.07)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, -60); g.lineTo(W, 60); g.fill(); }
  g.restore();
  // paper-cream stars that twinkle (no glow)
  for (let i = 0; i < 60; i++) {
    const x = ((hash(i) * W - scroll * (0.03 + hash(i + 7) * 0.06)) % W + W) % W;
    const y = hash(i + 1) * hz * 1.05, z = 2 + hash(i + 3) * 2.5;
    g.fillStyle = Math.sin(t * (1 + hash(i + 2) * 2) + i) > -0.4 ? '#f6ecd6' : 'rgba(246,236,214,0.35)';
    g.fillRect(x, y, z, z);
  }
  // flat ringed planet, ink-outlined like the rest of the cartoon
  const px = ((W * 0.78 - scroll * 0.015) % (W + 300) + W + 300) % (W + 300) - 150, py = hz * 0.5, pr = hz * 0.22;
  g.strokeStyle = '#1b1b24'; g.lineWidth = 4;
  g.beginPath(); g.ellipse(px, py, pr * 1.95, pr * 0.45, -0.35, Math.PI, TAU); g.strokeStyle = '#f6ecd6'; g.stroke(); // back of ring
  g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fillStyle = '#e5483a'; g.fill(); g.strokeStyle = '#1b1b24'; g.stroke();
  g.fillStyle = '#ff8a3c'; g.beginPath(); g.arc(px, py, pr * 0.78, Math.PI * 0.15, Math.PI * 0.95); g.fill();
  g.beginPath(); g.ellipse(px, py, pr * 1.95, pr * 0.45, -0.35, 0, Math.PI); g.strokeStyle = '#f6ecd6'; g.lineWidth = 6; g.stroke(); // front of ring
}

function skySea(g, W, H, hz, scroll, t) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#39c3ff'); gr.addColorStop(0.55, '#0b7fd0'); gr.addColorStop(1, '#0a3f8c');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // light rays
  g.save();
  for (let i = 0; i < 6; i++) {
    const x = ((i * 260 + Math.sin(t * 0.3 + i) * 40 - scroll * 0.02) % (W + 300) + W + 300) % (W + 300) - 150;
    const rg = g.createLinearGradient(x, 0, x + 160, H * 0.8);
    rg.addColorStop(0, 'rgba(255,255,255,0.22)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x + 260, H * 0.8); g.lineTo(x + 120, H * 0.8); g.fill();
  }
  g.restore();
  // far coral / rocks
  tiles(300, scroll * 0.06, W, 160, (i, x) => {
    const h = hz * (0.5 + hash(i + 4) * 0.6);
    g.fillStyle = 'rgba(12,70,150,0.55)';
    g.beginPath(); g.moveTo(x - 60, hz + 20); g.quadraticCurveTo(x - 30, hz - h, x, hz - h * 0.7); g.quadraticCurveTo(x + 30, hz - h * 1.1, x + 62, hz + 20); g.fill();
  });
  fish(g, W, 0, hz + 40, scroll, t, 14, 1);
  // bubbles
  for (let i = 0; i < 22; i++) {
    const bx = (hash(i) * W + Math.sin(t * 0.8 + i) * 14 - scroll * 0.05 % W + W) % W;
    const by = H - ((t * (30 + hash(i + 1) * 40) + hash(i + 2) * H) % H);
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 2;
    g.beginPath(); g.arc(bx, by, 3 + hash(i + 3) * 6, 0, TAU); g.stroke();
  }
}

const FISH_COLORS = ['#ff6b35', '#ffd23f', '#ff5fa2', '#7bf1a8', '#ffffff', '#b388ff', '#ff3b3b', '#5ef0ff', '#ffb347'];
function fish(g, W, y0, y1, scroll, t, count, sizeMul) {
  for (let i = 0; i < count; i++) {
    const dir = hash(i + 50) > 0.35 ? -1 : 1;
    const sp = 25 + hash(i + 60) * 55;
    const size = (9 + hash(i + 70) * 16) * sizeMul;
    const span = W + 200;
    let x = ((hash(i) * span + dir * t * sp - scroll * 0.25) % span + span) % span - 100;
    const y = y0 + hash(i + 80) * (y1 - y0) + Math.sin(t * 2 + i) * 6;
    const col = FISH_COLORS[i % FISH_COLORS.length];
    g.save(); g.translate(x, y); g.scale(dir, 1);
    ell(g, 0, 0, size, size * 0.55, col);
    const wag = Math.sin(t * 9 + i) * size * 0.25;
    g.fillStyle = col; g.beginPath(); g.moveTo(-size * 0.8, 0); g.lineTo(-size * 1.6, -size * 0.55 + wag); g.lineTo(-size * 1.6, size * 0.55 + wag); g.fill();
    ell(g, size * 0.45, -size * 0.1, size * 0.14, size * 0.14, '#fff'); ell(g, size * 0.5, -size * 0.1, size * 0.06, size * 0.06, '#111');
    g.restore();
  }
}

function skyForest(g, W, H, hz, scroll, t) {
  const gr = g.createLinearGradient(0, 0, 0, hz);
  gr.addColorStop(0, '#9fdcff'); gr.addColorStop(1, '#e9f8d4');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  tiles(560, scroll * 0.03, W, 150, (i, x) => {
    const y = hz * (0.15 + hash(i) * 0.3);
    ell(g, x, y, 70, 17, 'rgba(255,255,255,0.8)'); ell(g, x + 34, y - 11, 40, 17, 'rgba(255,255,255,0.8)');
  });
  // misty hills
  g.fillStyle = '#7fb98f';
  g.beginPath(); g.moveTo(0, hz + 4);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 44 + Math.sin((x + scroll * 0.05) * 0.006) * 24);
  g.lineTo(W, hz + 4); g.fill();
  // pine layers (far then near)
  tiles(70, scroll * 0.1, W, 60, (i, x) => pine(g, x, hz + 6, 28 + hash(i) * 10, 70 + hash(i + 1) * 40, '#2f7a5a', '#245f48'));
  tiles(95, scroll * 0.22, W, 80, (i, x) => pine(g, x, hz + 14, 40 + hash(i + 7) * 14, 100 + hash(i + 2) * 55, '#1f6a47', '#17533a'));
}

function pine(g, x, y, w, h, c1, c2) {
  g.fillStyle = '#5b3a1f'; g.fillRect(x - w * 0.07, y - h * 0.18, w * 0.14, h * 0.18);
  const tiers = 3;
  for (let k = 0; k < tiers; k++) {
    const ty = y - h * 0.12 - (k * h * 0.27);
    tri(g, x, ty, w * (1 - k * 0.22), h * 0.42, k % 2 ? c2 : c1);
  }
}

// ---------- LANE GROUND ----------

export function drawLaneGround(g, track, x, y, w, h, scroll, t, lane) {
  const S = scene(track);
  if (S) S.ground(g, x, y, w, h, scroll, t, lane);
  else if (track.id === 'desert') {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#f7d995'); gr.addColorStop(1, '#e8b765');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(160,100,40,0.18)';
    tiles(90, scroll, w, 40, (i, sx) => { ell(g, sx, y + h * (0.65 + hash(i + lane * 7) * 0.3), 18 + hash(i) * 14, 3, 'rgba(160,100,40,0.18)'); });
  } else if (track.id === 'rainbow') {
    g.fillStyle = SPACE_INK; g.fillRect(x, y, w, h);
    // the road itself: slanted poster-color bands with ink seams streaming past
    const bw = 46, n = RAINBOW.length;
    tiles(bw, scroll * 1.0, w, bw * 2, (i, sx) => {
      g.fillStyle = RAINBOW[((i % n) + n) % n];
      g.beginPath(); g.moveTo(sx, y + h * 0.18); g.lineTo(sx + bw * 0.7, y + h * 0.18); g.lineTo(sx + bw * 0.7 - 14, y + h); g.lineTo(sx - 14, y + h); g.closePath(); g.fill();
      g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.stroke();
    });
    g.fillStyle = '#1b1b24'; g.fillRect(x, y + h * 0.14, w, 8);       // curb: ink with a cream stripe
    g.fillStyle = '#f6ecd6'; g.fillRect(x, y + h * 0.14 + 2, w, 3);
  } else if (track.id === 'sea') {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(231,206,150,0.0)'); gr.addColorStop(0.35, '#e8d09a'); gr.addColorStop(1, '#c9ab70');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    tiles(70, scroll, w, 40, (i, sx) => { ell(g, sx, y + h * (0.55 + hash(i + lane * 5) * 0.4), 5 + hash(i) * 6, 3, 'rgba(120,90,50,0.35)'); });
  } else {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#4f9a4c'); gr.addColorStop(0.28, '#8a5e34'); gr.addColorStop(1, '#6e4724');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    tiles(80, scroll, w, 40, (i, sx) => { ell(g, sx, y + h * (0.6 + hash(i + lane * 3) * 0.35), 14, 2.6, 'rgba(40,20,5,0.3)'); });
  }
  // lane divider (dashes scroll with the ground)
  g.fillStyle = 'rgba(255,255,255,0.55)';
  tiles(60, scroll, w, 40, (i, sx) => { g.fillRect(sx - 14, y + h - 4, 28, 3); });
}

// Scenery that sits behind the car in this lane, at the lane's far edge.
export function drawLaneScenery(g, track, x, y, w, h, scroll, t, lane) {
  const base = y + h * 0.58; // where plants sit
  const S = scene(track);
  if (S) { S.scenery(g, x, y, w, h, scroll, t, lane, base); return; }
  if (track.id === 'desert') {
    tiles(300, scroll, w, 80, (i, sx) => {
      const r = hash(i + lane * 11);
      if (r < 0.62) cactus(g, sx, base, h * (0.34 + hash(i + 1) * 0.2));
      else { ell(g, sx, base, h * 0.12, h * 0.08, '#b88a5a'); ell(g, sx - 4, base - 4, h * 0.08, h * 0.05, '#cfa070'); }
    });
  } else if (track.id === 'rainbow') {
    tiles(170, scroll, w, 80, (i, sx) => {
      const r = hash(i + lane * 19);
      if (r < 0.6) glowStar(g, sx, base - h * (0.05 + hash(i + 2) * 0.25), h * (0.1 + hash(i + 3) * 0.08), t * 1.5 + i, i + lane);
      else rainbowArc(g, sx, base + h * 0.1, h * 0.28, h * 0.035, 0.9);
    });
  } else if (track.id === 'sea') {
    tiles(210, scroll, w, 80, (i, sx) => {
      const r = hash(i + lane * 13);
      if (r < 0.5) seaweed(g, sx, base + h * 0.1, h * (0.35 + hash(i + 1) * 0.25), t, i);
      else coral(g, sx, base + h * 0.08, h * (0.22 + hash(i + 3) * 0.14), i);
    });
    fish(g, w, y + 4, y + h * 0.5, scroll + lane * 997, t, 7, Math.min(1.3, h / 130));
  } else {
    tiles(190, scroll, w, 80, (i, sx) => {
      const r = hash(i + lane * 17);
      const hh = h * (0.62 + hash(i + 1) * 0.3);
      if (r < 0.75) pine(g, sx, base + h * 0.06, hh * 0.46, hh, '#2a8a56', '#1f6f44');
      else { ell(g, sx, base + h * 0.04, h * 0.14, h * 0.09, '#7a7f86'); }
    });
  }
}

function cactus(g, x, y, h) {
  const w = h * 0.2;
  g.fillStyle = '#3f9a45'; g.strokeStyle = '#2a6e30'; g.lineWidth = 2.5;
  g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, w / 2); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(x - w * 1.5, y - h * 0.62, w * 0.8, h * 0.34, w * 0.4); g.fill(); g.stroke();
  g.fillRect(x - w * 1.5, y - h * 0.38, w * 1.2, w * 0.6); g.beginPath(); g.roundRect(x - w * 1.5, y - h * 0.4, w * 1.2, w * 0.7, w * 0.3); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(x + w * 0.7, y - h * 0.78, w * 0.8, h * 0.34, w * 0.4); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(x + w * 0.3, y - h * 0.5, w * 1.2, w * 0.7, w * 0.3); g.fill(); g.stroke();
  g.strokeStyle = '#2a6e30'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(x, y - h + 6); g.lineTo(x, y - 4); g.stroke();
  ell(g, x, y - h - 2, w * 0.28, w * 0.2, '#ff7bb0');
}

function seaweed(g, x, y, h, t, seed) {
  g.strokeStyle = seed % 2 ? '#2fbf5a' : '#1f9a6a'; g.lineWidth = 8; g.lineCap = 'round';
  for (let k = -1; k <= 1; k++) {
    g.beginPath(); g.moveTo(x + k * 10, y);
    for (let s = 1; s <= 6; s++) g.lineTo(x + k * 10 + Math.sin(t * 2 + s * 0.7 + seed + k) * 7 * (s / 6), y - (h * s) / 6 * (1 - Math.abs(k) * 0.2));
    g.stroke();
  }
}

function coral(g, x, y, h, seed) {
  const cols = ['#ff6fa5', '#ff8c42', '#b388ff'];
  g.strokeStyle = cols[seed % 3]; g.lineWidth = 7; g.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (k - 1.5) * h * 0.35, y - h * 0.5, x + (k - 1.5) * h * 0.5, y - h * (0.7 + (k % 2) * 0.3)); g.stroke();
  }
}

// ---------- ZONES (stretches of the course; drawn over the ground band of one lane) ----------

export function drawZone(g, zone, x0, x1, y, h, t, lane) {
  const custom = theme.zoneKinds?.[zone.kind];
  const w = x1 - x0;
  const gy = y + h * 0.44;          // the line the cars drive on
  const u = h;                       // size unit (half a lane)
  const INK = '#1b1b24';
  g.save();
  g.beginPath(); g.rect(x0 - 6, y - h * 0.95, w + 12, h * 2); g.clip();
  g.lineJoin = 'round'; g.lineCap = 'round';

  if (custom) {
    custom(g, { zone, x0, x1, w, y, h, gy, u, t, lane });
  } else if (zone.kind === 'rocks') {
    g.fillStyle = 'rgba(120,70,30,0.35)'; g.fillRect(x0, gy - u * 0.1, w, u * 0.75);
    const n = Math.max(3, Math.floor(w / 78));
    for (let i = 0; i < n; i++) {
      const px = x0 + (i + 0.5) * (w / n) + (hash(i + lane * 5) - 0.5) * 26;
      const r = u * (0.15 + hash(i + 5 + lane) * 0.12);
      const py = gy + u * (0.06 + hash(i + lane * 3) * 0.3);
      boulder(g, px, py, r);
    }
  } else if (zone.kind === 'sand') {
    g.fillStyle = 'rgba(255,238,180,0.6)'; g.fillRect(x0, gy - u * 0.15, w, u * 0.85);
    const n = Math.max(3, Math.floor(w / 70));
    for (let i = 0; i < n; i++) {
      const px = x0 + (i + 0.5) * (w / n), r = u * (0.22 + hash(i + lane) * 0.1);
      const py = gy + u * (0.12 + hash(i + 2 + lane) * 0.22);
      g.fillStyle = '#e6b45e'; g.strokeStyle = INK; g.lineWidth = 3;
      g.beginPath(); g.moveTo(px - r * 1.9, py + r * 0.3); g.quadraticCurveTo(px, py - r * 1.7, px + r * 1.9, py + r * 0.3); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(150,95,30,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px - r, py); g.quadraticCurveTo(px, py - r, px + r, py); g.stroke();
    }
    // blowing sand
    g.fillStyle = 'rgba(240,210,140,0.7)';
    for (let i = 0; i < 18; i++) { const sx = x0 + ((hash(i + lane) * w + t * 220) % w); g.fillRect(sx, gy - u * 0.4 + hash(i + 3) * u * 0.9, 12 + hash(i) * 14, 2.5); }
  } else if (zone.kind === 'current') {
    g.fillStyle = 'rgba(190,250,255,0.28)'; g.fillRect(x0, gy - u * 0.95, w, u * 1.9);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const yy = gy - u * 0.85 + hash(i + lane * 2) * u * 1.7, len = 50 + hash(i + 3) * 60;
      const xx = x0 + (((hash(i + 7) * (w + len) + t * (320 + hash(i) * 160)) % (w + len)) - len);
      g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + len, yy); g.moveTo(xx + len - 10, yy - 7); g.lineTo(xx + len, yy); g.lineTo(xx + len - 10, yy + 7); g.stroke();
    }
    for (let k = 0; k < 3; k++) { // whirly swirls on the sea floor
      const cx = x0 + w * (0.2 + k * 0.3), cy = gy + u * 0.3;
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath();
      for (let a = 0; a < 9; a += 0.3) { const r = a * 3.5; const px = cx + Math.cos(a - t * 6) * r, py = cy + Math.sin(a - t * 6) * r * 0.4; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke();
    }
  } else if (zone.kind === 'stars') {
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0, gy - u * 0.1, w, u * 0.75);
    const n = Math.max(3, Math.floor(w / 70));
    for (let i = 0; i < n; i++) glowStar(g, x0 + (i + 0.5) * (w / n), gy + u * (0.15 + hash(i + lane * 3) * 0.35), u * 0.2, t * 2 + i, i + lane);
  } else if (zone.kind === 'kelp') {
    const n = Math.max(3, Math.floor(w / 62));
    for (let i = 0; i < n; i++) bigKelp(g, x0 + (i + 0.5) * (w / n), gy + u * (0.3 + hash(i + lane) * 0.25), u * (0.75 + hash(i + 4) * 0.25), t, i);
  } else if (zone.kind === 'mud') {
    const n = Math.max(2, Math.floor(w / 100));
    for (let i = 0; i < n; i++) {
      const px = x0 + (i + 0.5) * (w / n), py = gy + u * (0.15 + hash(i + lane) * 0.3), r = u * (0.4 + hash(i + 2) * 0.2);
      g.fillStyle = '#4b3018'; g.strokeStyle = INK; g.lineWidth = 3;
      g.beginPath(); g.ellipse(px, py, r * 1.6, r * 0.5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#6b4524'; g.beginPath(); g.ellipse(px - r * 0.2, py - r * 0.1, r * 1.1, r * 0.3, 0, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 3; k++) { // bubbling
        const ph = (t * 1.3 + k * 0.33 + i * 0.2) % 1, bx = px + (k - 1) * r * 0.7;
        g.strokeStyle = '#a07a4a'; g.lineWidth = 2; g.beginPath(); g.arc(bx, py - ph * u * 0.25, 3 + ph * 4, 0, Math.PI * 2); g.stroke();
      }
    }
  } else if (zone.kind === 'signs') {
    const n = Math.max(3, Math.floor(w / 64));
    for (let i = 0; i < n; i++) {
      const px = x0 + (i + 0.5) * (w / n), left = i % 2 === 0;
      const py = left ? gy - u * 0.12 : gy + u * 0.62;
      const sw = u * 0.5, sh = u * 0.36;
      g.fillStyle = '#555a66'; g.fillRect(px - 2.5, py, 5, u * 0.3);
      g.fillStyle = '#ffcc1f'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.roundRect(px - sw / 2, py - sh, sw, sh, 4); g.fill(); g.stroke();
      g.strokeStyle = INK; g.lineWidth = 4; g.beginPath();
      const dir = left ? 1 : -1;
      g.moveTo(px - dir * sw * 0.22, py - sh * 0.8); g.lineTo(px + dir * sw * 0.18, py - sh * 0.5); g.lineTo(px - dir * sw * 0.22, py - sh * 0.2); g.stroke();
    }
  }
  g.restore();
}

function boulder(g, x, y, r) {
  g.fillStyle = '#8f949e'; g.strokeStyle = '#1b1b24'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(x - r * 1.2, y); g.quadraticCurveTo(x - r * 1.1, y - r * 1.5, x - r * 0.2, y - r * 1.4); g.quadraticCurveTo(x + r * 1.1, y - r * 1.5, x + r * 1.25, y); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#b4b9c3'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.85, r * 0.45, r * 0.25, -0.4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#5d626d'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + r * 0.2, y - r * 0.9); g.lineTo(x + r * 0.5, y - r * 0.4); g.lineTo(x + r * 0.3, y - r * 0.1); g.stroke();
}

function bigKelp(g, x, y, h, t, i) {
  g.strokeStyle = '#1b1b24'; g.lineWidth = 15; g.beginPath();
  for (let s = 0; s <= 8; s++) { const px = x + Math.sin(t * 2 + s * 0.6 + i) * 9 * (s / 8), py = y - (h * s) / 8; if (s === 0) g.moveTo(px, py); else g.lineTo(px, py); }
  g.stroke();
  g.strokeStyle = i % 2 ? '#2fbf5a' : '#1f9a6a'; g.lineWidth = 9; g.beginPath();
  for (let s = 0; s <= 8; s++) { const px = x + Math.sin(t * 2 + s * 0.6 + i) * 9 * (s / 8), py = y - (h * s) / 8; if (s === 0) g.moveTo(px, py); else g.lineTo(px, py); }
  g.stroke();
}

// Warning sign planted where a hazard begins, so you see it coming.
export function drawZoneGate(g, zone, x, y, h) {
  const gy = y + h * 0.44, sz = h * 0.55;
  g.save(); g.lineJoin = 'round';
  g.fillStyle = '#555a66'; g.fillRect(x - 3, gy - sz * 0.2, 6, sz * 1.2);
  g.fillStyle = '#ffcc1f'; g.strokeStyle = '#1b1b24'; g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(x, gy - sz * 1.2); g.lineTo(x + sz * 0.62, gy - sz * 0.1); g.lineTo(x - sz * 0.62, gy - sz * 0.1); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#1b1b24'; g.font = `700 ${Math.round(sz * 0.55)}px "Alfa Slab One", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('!', x, gy - sz * 0.5);
  g.restore();
}

// A stunt ramp. Cars launch from its lip.
export function drawRamp(g, x, groundY, laneH, track) {
  const w = laneH * 0.62, hh = laneH * 0.26;
  const col = scene(track)?.rampColor || (track.id === 'desert' ? '#c98a4a' : track.id === 'sea' ? '#ff7a6b' : track.id === 'rainbow' ? '#ffc93c' : '#8a5a2e');
  g.save(); g.lineJoin = 'round';
  g.translate(x, groundY);
  g.fillStyle = col; g.strokeStyle = '#1b1b24'; g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, -hh); g.lineTo(w / 2, 0); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = '#f6ecd6'; g.lineWidth = 4;
  for (let k = 1; k < 5; k++) { const fx = -w / 2 + (w * k) / 5; g.beginPath(); g.moveTo(fx, 0); g.lineTo(fx, -hh * (k / 5) * 1.0 - 0); g.stroke(); }
  g.fillStyle = '#e5483a'; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, -hh); g.lineTo(w / 2 + 3, -hh - 5); g.lineTo(-w / 2 - 2, -5); g.closePath(); g.fill(); g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.stroke();
  g.restore();
}

// A floating ribbon naming the zone, drawn above the lanes.
export function drawZoneBanner(g, zone, x0, x1, y, active) {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  g.save();
  g.globalAlpha = active ? 1 : 0.75;
  g.fillStyle = active ? '#e5483a' : 'rgba(27,27,36,0.7)';
  g.strokeStyle = '#fff'; g.lineWidth = 3;
  g.beginPath(); g.roundRect(x0, y, w, 26, 8); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.font = '700 15px "Barlow Semi Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(zone.name.toUpperCase(), cx, y + 14);
  g.restore();
}

// Mood lighting that changes as the race goes on.
export function drawTint(g, track, W, H, p) {
  let c;
  const S = scene(track);
  if (S) c = S.tint(p);
  else if (track.id === 'desert') c = `rgba(255,110,40,${(p * 0.28).toFixed(3)})`;
  else if (track.id === 'rainbow') c = `rgba(229,72,58,${(p * 0.12).toFixed(3)})`;
  else if (track.id === 'sea') c = `rgba(0,20,90,${(p * 0.3).toFixed(3)})`;
  else c = `rgba(230,140,40,${(p * 0.2).toFixed(3)})`;
  g.fillStyle = c; g.fillRect(0, 0, W, H);
}

// Falling leaves on the forest track / dust on desert, drawn over everything.
export function drawAmbient(g, track, W, H, scroll, t) {
  const S = scene(track);
  if (S) { S.ambient?.(g, W, H, scroll, t); return; }
  if (track.id === 'forest') {
    for (let i = 0; i < 14; i++) {
      const x = ((hash(i) * W - scroll * 0.6 + t * 20) % W + W) % W;
      const y = (hash(i + 1) * H + t * (30 + hash(i + 2) * 30)) % H;
      g.save(); g.translate(x, y); g.rotate(t + i);
      ell(g, 0, 0, 6, 3, i % 2 ? '#e09a2b' : '#c8501f'); g.restore();
    }
  } else if (track.id === 'rainbow') {
    for (let i = 0; i < 22; i++) {
      const x = ((hash(i) * W - scroll * 0.8 + t * 30) % W + W) % W;
      const y = (hash(i + 1) * H + t * (20 + hash(i + 2) * 40)) % H;
      g.fillStyle = i % 2 ? '#f6ecd6' : '#ffc93c'; g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i));
      g.fillRect(x, y, 4, 4);
    }
    g.globalAlpha = 1;
  } else if (track.id === 'desert') {
    g.fillStyle = 'rgba(255,230,170,0.35)';
    for (let i = 0; i < 18; i++) {
      const x = ((hash(i) * W - scroll * 0.9 + t * 40) % W + W) % W;
      const y = H * 0.3 + hash(i + 3) * H * 0.65;
      g.fillRect(x, y, 14 + hash(i) * 20, 2);
    }
  }
}

// Little static picture for the track-choice cards.
export function drawPreview(g, track, W, H, t = 0) {
  const hz = H * 0.5;
  drawSky(g, track, W, H, hz, 400, t);
  const gy = H * 0.5;
  drawLaneGround(g, track, 0, gy, W, H - gy, 400, t, 0);
  drawLaneScenery(g, track, 0, gy - H * 0.25, W, H * 0.5, 400, t, 0);
  const z = track.zones[0];
  drawZone(g, z, W * 0.45, W * 0.8, gy, (H - gy) * 0.9, t, 0);
}
