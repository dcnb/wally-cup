// Thanksgiving track scenery and hazard zones. Plugged into tracks.js through theme.scenes / theme.zoneKinds.
import { tiles, tri, ell, hash } from './tracks.js';

const TAU = Math.PI * 2;
const INK = '#1b1b24';
const LEAVES = ['#d9622b', '#e0a02b', '#b3361f', '#c98a2b'];

function vgrad(g, y0, y1, c0, c1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  return gr;
}

function outlined(g, fill, lw = 3) { g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }

function pumpkin(g, x, y, r, col = '#e8792b') {
  g.save(); g.lineJoin = 'round';
  for (const k of [-0.55, 0.55, 0]) { g.beginPath(); g.ellipse(x + k * r, y - r * 0.8, r * (k === 0 ? 0.62 : 0.55), r * 0.82, 0, 0, TAU); outlined(g, k === 0 ? '#f08a3a' : col, 2.5); }
  g.fillStyle = '#4f7a2b'; g.strokeStyle = INK; g.lineWidth = 2.5;
  g.beginPath(); g.roundRect(x - r * 0.1, y - r * 1.75, r * 0.2, r * 0.38, 2); g.fill(); g.stroke();
  g.restore();
}

function autumnTree(g, x, y, h, seed) {
  g.fillStyle = '#5b3a1f'; g.fillRect(x - h * 0.05, y - h * 0.4, h * 0.1, h * 0.4);
  const c = LEAVES[Math.floor(hash(seed) * LEAVES.length)];
  ell(g, x, y - h * 0.62, h * 0.3, h * 0.26, c);
  ell(g, x - h * 0.17, y - h * 0.5, h * 0.2, h * 0.17, LEAVES[(seed + 1) % 4]);
  ell(g, x + h * 0.17, y - h * 0.52, h * 0.2, h * 0.17, LEAVES[(seed + 2) % 4]);
}

function cornStalk(g, x, y, h) {
  g.strokeStyle = '#8a8a2b'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke();
  g.fillStyle = '#b7b83a';
  for (const k of [-1, 1]) { g.beginPath(); g.moveTo(x, y - h * 0.45); g.quadraticCurveTo(x + k * h * 0.45, y - h * 0.8, x + k * h * 0.5, y - h * 0.45); g.quadraticCurveTo(x + k * h * 0.2, y - h * 0.55, x, y - h * 0.4); g.fill(); }
  ell(g, x + 4, y - h * 0.55, h * 0.06, h * 0.14, '#ffd24a');
}

function hayBale(g, x, y, w) {
  g.beginPath(); g.roundRect(x - w / 2, y - w * 0.6, w, w * 0.6, 4); outlined(g, '#e2b34a', 3);
  g.strokeStyle = '#a8761f'; g.lineWidth = 2;
  for (const k of [-0.25, 0.25]) { g.beginPath(); g.moveTo(x + k * w, y - w * 0.6); g.lineTo(x + k * w, y); g.stroke(); }
}

function leafPile(g, x, y, r) {
  for (let i = 0; i < 9; i++) ell(g, x + (hash(i + x) - 0.5) * r * 1.6, y - hash(i + 3) * r * 0.6, r * 0.34, r * 0.18, LEAVES[i % 4], hash(i) - 0.5);
}

function candle(g, x, y, h, t) {
  g.beginPath(); g.roundRect(x - h * 0.08, y - h, h * 0.16, h, 3); outlined(g, '#fff4dc', 2.5);
  const f = 1 + Math.sin(t * 9 + x) * 0.15;
  ell(g, x, y - h - h * 0.1, h * 0.06, h * 0.12 * f, '#ffb52e');
}

function goalpost(g, x, y, h) {
  g.strokeStyle = '#ffd42e'; g.lineWidth = Math.max(4, h * 0.05); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.5); g.moveTo(x - h * 0.28, y - h * 0.5); g.lineTo(x + h * 0.28, y - h * 0.5);
  g.moveTo(x - h * 0.28, y - h * 0.5); g.lineTo(x - h * 0.28, y - h); g.moveTo(x + h * 0.28, y - h * 0.5); g.lineTo(x + h * 0.28, y - h); g.stroke();
}

function crowd(g, W, y, scroll, hz) {
  tiles(26, scroll * 0.08, W, 20, (i, x) => {
    const cols = ['#a4262c', '#4b2e83', '#f6ecd6', '#ffc93c'];
    ell(g, x, y - 6 - hash(i) * 10, 8, 10, cols[Math.floor(hash(i + 4) * 4)]);
    ell(g, x, y - 20 - hash(i) * 10, 5, 5, '#f0c9a0');
  });
}

function fallingLeaves(g, W, H, scroll, t, n = 14) {
  for (let i = 0; i < n; i++) {
    const x = ((hash(i) * W - scroll * 0.6 + t * 20) % W + W) % W;
    const y = (hash(i + 1) * H + t * (30 + hash(i + 2) * 30)) % H;
    g.save(); g.translate(x, y); g.rotate(t + i); ell(g, 0, 0, 6, 3, LEAVES[i % 4]); g.restore();
  }
}

// ---------- scenes ----------
const patch = {
  rampColor: '#c98a4a',
  sky(g, W, H, hz, scroll, t) {
    g.fillStyle = vgrad(g, 0, hz, '#ffd9a0', '#fff2d6'); g.fillRect(0, 0, W, H);
    ell(g, W * 0.8, hz * 0.3, 40, 40, '#ffb24a');
    tiles(560, scroll * 0.03, W, 150, (i, x) => { const y = hz * (0.15 + hash(i) * 0.3); ell(g, x, y, 70, 15, 'rgba(255,255,255,0.7)'); });
    g.fillStyle = '#c98a4a'; g.beginPath(); g.moveTo(0, hz + 4);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 40 + Math.sin((x + scroll * 0.05) * 0.006) * 22);
    g.lineTo(W, hz + 4); g.fill();
    tiles(120, scroll * 0.14, W, 80, (i, x) => autumnTree(g, x, hz + 6, 80 + hash(i + 1) * 40, i));
  },
  mid(g, W, hz, scroll) {
    tiles(150, scroll * 0.4, W, 80, (i, x) => cornStalk(g, x, hz + 14, hz * (0.34 + hash(i + 2) * 0.2)));
  },
  ground(g, x, y, w, h, scroll, t, lane) {
    g.fillStyle = vgrad(g, y, y + h, '#7ea63a', '#7a4f26'); g.fillRect(x, y, w, h);
    tiles(80, scroll, w, 40, (i, sx) => ell(g, sx, y + h * (0.6 + hash(i + lane * 3) * 0.35), 14, 2.6, 'rgba(40,20,5,0.3)'));
  },
  scenery(g, x, y, w, h, scroll, t, lane, base) {
    tiles(210, scroll, w, 80, (i, sx) => {
      if (hash(i + lane * 13) < 0.55) pumpkin(g, sx, base + h * 0.1, h * (0.18 + hash(i) * 0.1));
      else cornStalk(g, sx, base + h * 0.08, h * (0.5 + hash(i + 1) * 0.2));
    });
  },
  foreground(g, W, H, scroll, t) {
    const u = H * 0.2;
    tiles(1250, scroll * 1.9, W, 260, (i, x) => { pumpkin(g, x, H + 10, u * 0.75); if (hash(i + 4) < 0.5) pumpkin(g, x + u * 1.3, H + 14, u * 0.5, '#d9622b'); });
  },
  tint: (p) => `rgba(230,120,40,${(p * 0.22).toFixed(3)})`,
  ambient(g, W, H, scroll, t) { fallingLeaves(g, W, H, scroll, t); },
};

const gravy = {
  rampColor: '#f2d8a6',
  sky(g, W, H, hz, scroll, t) {
    g.fillStyle = vgrad(g, 0, hz, '#ffe3b0', '#ffc78a'); g.fillRect(0, 0, W, H);
    tiles(500, scroll * 0.03, W, 150, (i, x) => { const y = hz * (0.2 + hash(i) * 0.3); ell(g, x, y, 60, 13, 'rgba(255,250,235,0.8)'); }); // steam clouds
    g.fillStyle = '#f6ecd0'; g.beginPath(); g.moveTo(0, hz + 4); // mashed potato hills
    for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 38 + Math.sin((x + scroll * 0.05) * 0.007) * 26);
    g.lineTo(W, hz + 4); g.fill();
    tiles(240, scroll * 0.15, W, 120, (i, x) => ell(g, x, hz - 26 - hash(i) * 12, 14, 6, '#ffd24a')); // butter pats
  },
  mid(g, W, hz, scroll) {
    tiles(190, scroll * 0.4, W, 90, (i, x) => {
      const h = hz * (0.24 + hash(i + 5) * 0.16);
      g.beginPath(); g.ellipse(x, hz + 12, 52 + hash(i) * 22, h, 0, Math.PI, 0); outlined(g, '#fbf2d9', 2.5);
      ell(g, x, hz + 12 - h * 0.9, 12, 5, '#ffd24a');
    });
  },
  ground(g, x, y, w, h, scroll, t, lane) {
    g.fillStyle = vgrad(g, y, y + h, '#c28a4a', '#7b4a1f'); g.fillRect(x, y, w, h);
    tiles(120, scroll * 1.2, w, 60, (i, sx) => ell(g, sx + Math.sin(t * 2 + i) * 6, y + h * (0.4 + hash(i + lane * 9) * 0.5), 30, 4, 'rgba(255,225,170,0.4)'));
  },
  scenery(g, x, y, w, h, scroll, t, lane, base) {
    tiles(220, scroll, w, 80, (i, sx) => {
      if (hash(i + lane * 7) < 0.5) { g.beginPath(); g.ellipse(sx, base + h * 0.1, h * 0.26, h * 0.2, 0, Math.PI, 0); outlined(g, '#fbf2d9', 2.5); ell(g, sx, base - h * 0.02, h * 0.07, h * 0.03, '#ffd24a'); }
      else { g.strokeStyle = '#4f9a4c'; g.lineWidth = 7; g.lineCap = 'round'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(sx + k * 8, base + h * 0.1); g.lineTo(sx + k * 14, base - h * 0.2); g.stroke(); } }
    });
  },
  foreground(g, W, H, scroll, t) {
    const u = H * 0.2;
    tiles(1250, scroll * 1.9, W, 260, (i, x) => { for (let k = 0; k < 4; k++) { const bx = x + (k - 1.5) * 26, by = H - ((t * 50 + k * 45 + i * 20) % (u * 1.2)); g.beginPath(); g.arc(bx, by, 6 + k * 2, 0, TAU); g.strokeStyle = 'rgba(255,230,180,0.85)'; g.lineWidth = 3; g.stroke(); } });
  },
  tint: (p) => `rgba(120,60,10,${(p * 0.22).toFixed(3)})`,
  ambient(g, W, H, scroll, t) {
    for (let i = 0; i < 16; i++) { const x = ((hash(i) * W - scroll * 0.7 + t * 25) % W + W) % W, y = H * 0.1 + ((hash(i + 1) * H * 0.8 - t * 20) % (H * 0.8) + H * 0.8) % (H * 0.8); g.fillStyle = 'rgba(255,248,230,0.35)'; g.beginPath(); g.arc(x, y, 3 + hash(i + 2) * 5, 0, TAU); g.fill(); }
  },
};

const bog = {
  rampColor: '#8a5a2e',
  sky(g, W, H, hz, scroll, t) {
    g.fillStyle = vgrad(g, 0, hz, '#b8d4e0', '#f4e6d0'); g.fillRect(0, 0, W, H);
    tiles(520, scroll * 0.03, W, 150, (i, x) => { const y = hz * (0.15 + hash(i) * 0.3); ell(g, x, y, 80, 16, 'rgba(255,255,255,0.75)'); });
    g.fillStyle = '#b98355'; g.beginPath(); g.moveTo(0, hz + 4);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 36 + Math.sin((x + scroll * 0.05) * 0.006) * 22);
    g.lineTo(W, hz + 4); g.fill();
    tiles(100, scroll * 0.12, W, 70, (i, x) => autumnTree(g, x, hz + 6, 70 + hash(i + 1) * 40, i + 2));
  },
  mid(g, W, hz, scroll) {
    tiles(120, scroll * 0.4, W, 80, (i, x) => autumnTree(g, x, hz + 14, 110 + hash(i + 3) * 50, i));
  },
  ground(g, x, y, w, h, scroll, t, lane) {
    g.fillStyle = vgrad(g, y, y + h, '#a3334a', '#5e1c2c'); g.fillRect(x, y, w, h);
    tiles(70, scroll, w, 40, (i, sx) => { const by = y + h * (0.3 + hash(i + lane * 11) * 0.6); ell(g, sx, by, 7, 7, '#d6304a'); ell(g, sx - 2, by - 2, 2, 2, '#ff8fa0'); });
  },
  scenery(g, x, y, w, h, scroll, t, lane, base) {
    tiles(190, scroll, w, 80, (i, sx) => {
      if (hash(i + lane * 17) < 0.65) autumnTree(g, sx, base + h * 0.06, h * (0.7 + hash(i + 1) * 0.3), i + lane);
      else leafPile(g, sx, base + h * 0.08, h * 0.3);
    });
  },
  foreground(g, W, H, scroll, t) {
    const u = H * 0.2;
    tiles(1250, scroll * 1.9, W, 260, (i, x) => { g.strokeStyle = '#6a5a2a'; g.lineWidth = 6; g.lineCap = 'round'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 18, H + 6); g.lineTo(x + k * 22, H - u * 1.2); g.stroke(); g.fillStyle = '#6b3a1a'; g.beginPath(); g.roundRect(x + k * 22 - 6, H - u * 1.3, 12, 28, 6); g.fill(); } });
  },
  tint: (p) => `rgba(120,30,40,${(p * 0.2).toFixed(3)})`,
  ambient(g, W, H, scroll, t) { fallingLeaves(g, W, H, scroll, t, 20); },
};

const field = {
  rampColor: '#f6ecd6',
  sky(g, W, H, hz, scroll, t) {
    g.fillStyle = vgrad(g, 0, hz, '#8fd0f4', '#e6f6ff'); g.fillRect(0, 0, W, H);
    tiles(480, scroll * 0.03, W, 150, (i, x) => { const y = hz * (0.15 + hash(i) * 0.3); ell(g, x, y, 70, 14, 'rgba(255,255,255,0.85)'); });
    g.fillStyle = '#3c3f4a'; g.fillRect(0, hz - 52, W, 60);                         // stadium stands
    crowd(g, W, hz - 6, scroll, hz); crowd(g, W, hz - 24, scroll + 13, hz);
    tiles(180, scroll * 0.06, W, 60, (i, x) => { g.fillStyle = i % 2 ? '#a4262c' : '#4b2e83'; g.beginPath(); g.moveTo(x, hz - 90); g.lineTo(x + 34, hz - 80); g.lineTo(x, hz - 70); g.closePath(); g.fill(); g.fillStyle = INK; g.fillRect(x - 2, hz - 94, 3, 44); }); // pennants
  },
  mid(g, W, hz, scroll) {
    tiles(300, scroll * 0.4, W, 100, (i, x) => goalpost(g, x, hz + 14, hz * 0.55));
  },
  ground(g, x, y, w, h, scroll, t, lane) {
    g.fillStyle = vgrad(g, y, y + h, '#4f9a4c', '#2f7a3a'); g.fillRect(x, y, w, h);
    tiles(160, scroll, w, 80, (i, sx) => { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(sx, y, 80, h); });
    tiles(240, scroll, w, 80, (i, sx) => { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(sx, y + h * 0.1, 5, h * 0.9); });
  },
  scenery(g, x, y, w, h, scroll, t, lane, base) {
    tiles(240, scroll, w, 80, (i, sx) => {
      if (hash(i + lane * 5) < 0.4) goalpost(g, sx, base + h * 0.1, h * 0.9);
      else { g.beginPath(); g.moveTo(sx - h * 0.1, base + h * 0.1); g.lineTo(sx, base - h * 0.15); g.lineTo(sx + h * 0.1, base + h * 0.1); g.closePath(); outlined(g, '#ff7a1f', 2.5); g.fillStyle = '#fff'; g.fillRect(sx - h * 0.05, base - h * 0.02, h * 0.1, h * 0.03); }
    });
  },
  foreground(g, W, H, scroll, t) {
    const u = H * 0.2;
    tiles(1250, scroll * 1.9, W, 260, (i, x) => { g.save(); g.translate(x, H - u * 0.3); g.rotate(0.5 + i); ell(g, 0, 0, u * 0.5, u * 0.3, '#8a4a1f'); g.restore(); });
  },
  tint: (p) => `rgba(40,30,90,${(p * 0.2).toFixed(3)})`,
  ambient(g, W, H, scroll, t) {
    for (let i = 0; i < 16; i++) { const x = ((hash(i) * W - scroll * 0.8 + t * 30) % W + W) % W, y = (hash(i + 1) * H + t * (20 + hash(i + 2) * 30)) % H; g.fillStyle = i % 2 ? '#ffc93c' : '#a4262c'; g.fillRect(x, y, 5, 3); } // confetti
  },
};

const table = {
  rampColor: '#ffc93c',
  sky(g, W, H, hz, scroll, t) {
    g.fillStyle = vgrad(g, 0, hz, '#6b2f2a', '#a8553a'); g.fillRect(0, 0, W, H);
    tiles(180, scroll * 0.03, W, 60, (i, x) => { g.fillStyle = 'rgba(255,220,160,0.08)'; g.fillRect(x, 0, 90, hz); }); // wallpaper stripes
    tiles(420, scroll * 0.04, W, 120, (i, x) => { g.beginPath(); g.roundRect(x - 60, hz * 0.18, 120, hz * 0.55, 6); outlined(g, '#2b3a63', 4); g.fillStyle = '#ffd98a'; g.fillRect(x - 3, hz * 0.18, 6, hz * 0.55); }); // windows
    g.fillStyle = '#4a2418'; g.fillRect(0, hz - 14, W, 30);
  },
  mid(g, W, hz, scroll, t) {
    tiles(140, scroll * 0.4, W, 80, (i, x) => { g.beginPath(); g.roundRect(x - 24, hz - 78, 48, 90, 6); outlined(g, '#6b3a20', 3); });
  },
  ground(g, x, y, w, h, scroll, t, lane) {
    g.fillStyle = '#fbf2dd'; g.fillRect(x, y, w, h);
    tiles(60, scroll, w, 60, (i, sx) => { g.fillStyle = 'rgba(180,60,40,0.22)'; g.fillRect(sx, y, 30, h); });
    g.fillStyle = 'rgba(180,60,40,0.22)'; for (let k = 0; k < 4; k++) g.fillRect(x, y + (k * h) / 4, w, h / 8);
  },
  scenery(g, x, y, w, h, scroll, t, lane, base) {
    tiles(210, scroll, w, 80, (i, sx) => {
      const r = hash(i + lane * 3);
      if (r < 0.45) candle(g, sx, base + h * 0.1, h * 0.55, t);
      else if (r < 0.75) { g.beginPath(); g.moveTo(sx - h * 0.1, base - h * 0.2); g.lineTo(sx + h * 0.1, base - h * 0.2); g.lineTo(sx + h * 0.05, base + h * 0.02); g.lineTo(sx - h * 0.05, base + h * 0.02); g.closePath(); outlined(g, 'rgba(210,230,255,0.9)', 2.5); ell(g, sx, base - h * 0.1, h * 0.07, h * 0.05, '#9a1f3a'); g.fillStyle = INK; g.fillRect(sx - 1.5, base + h * 0.02, 3, h * 0.08); }
      else { g.beginPath(); g.ellipse(sx, base + h * 0.08, h * 0.2, h * 0.07, 0, 0, TAU); outlined(g, '#f4f0e6', 2.5); }
    });
  },
  foreground(g, W, H, scroll, t) {
    const u = H * 0.2;
    tiles(1250, scroll * 1.9, W, 260, (i, x) => candle(g, x, H + 10, u * 1.4, t));
  },
  tint: (p) => `rgba(255,170,60,${(p * 0.16).toFixed(3)})`,
  ambient(g, W, H, scroll, t) {
    for (let i = 0; i < 12; i++) { const x = ((hash(i) * W - scroll * 0.8 + t * 20) % W + W) % W, y = H * 0.15 + hash(i + 1) * H * 0.7; g.fillStyle = `rgba(255,230,160,${0.2 + 0.3 * Math.abs(Math.sin(t * 2 + i))})`; g.fillRect(x, y, 3, 3); }
  },
};

export const SCENES_TDAY = { patch, gravy, bog, field, table };

// ---------- zone painters ----------
export const ZONES_TDAY = {
  // a heap of pumpkins to climb over
  pumpkins(g, { x0, w, gy, u, lane }) {
    g.fillStyle = 'rgba(120,70,30,0.3)'; g.fillRect(x0, gy - u * 0.1, w, u * 0.75);
    const n = Math.max(3, Math.floor(w / 70));
    for (let i = 0; i < n; i++) pumpkin(g, x0 + (i + 0.5) * (w / n) + (hash(i + lane) - 0.5) * 20, gy + u * (0.25 + hash(i + 2 + lane) * 0.3), u * (0.2 + hash(i + 3) * 0.1), i % 2 ? '#e8792b' : '#d9622b');
  },
  // hay bale maze
  hay(g, { x0, w, gy, u, lane }) {
    const n = Math.max(3, Math.floor(w / 64));
    for (let i = 0; i < n; i++) hayBale(g, x0 + (i + 0.5) * (w / n), i % 2 ? gy + u * 0.7 : gy + u * 0.1, u * 0.55);
  },
  // rushing gravy
  gravy(g, { x0, w, gy, u, t, lane }) {
    g.fillStyle = 'rgba(110,60,20,0.35)'; g.fillRect(x0, gy - u * 0.95, w, u * 1.9);
    g.strokeStyle = 'rgba(255,225,170,0.9)'; g.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const yy = gy - u * 0.85 + hash(i + lane * 2) * u * 1.7, len = 50 + hash(i + 3) * 60;
      const xx = x0 + (((hash(i + 7) * (w + len) + t * (320 + hash(i) * 160)) % (w + len)) - len);
      g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + len, yy); g.moveTo(xx + len - 10, yy - 7); g.lineTo(xx + len, yy); g.lineTo(xx + len - 10, yy + 7); g.stroke();
    }
  },
  // mashed potato mounds to slalom around
  mash(g, { x0, w, gy, u, lane }) {
    const n = Math.max(3, Math.floor(w / 66));
    for (let i = 0; i < n; i++) {
      const px = x0 + (i + 0.5) * (w / n), py = i % 2 ? gy + u * 0.72 : gy + u * 0.02, r = u * 0.3;
      g.beginPath(); g.ellipse(px, py, r * 1.2, r, 0, Math.PI, 0); outlined(g, '#fbf2d9', 3);
      ell(g, px, py - r * 0.7, r * 0.35, r * 0.15, '#ffd24a');
    }
  },
  // cranberry bog (floating berries over sticky water)
  bog(g, { x0, w, gy, u, t, lane }) {
    const n = Math.max(2, Math.floor(w / 100));
    for (let i = 0; i < n; i++) {
      const px = x0 + (i + 0.5) * (w / n), py = gy + u * (0.15 + hash(i + lane) * 0.3), r = u * (0.4 + hash(i + 2) * 0.2);
      g.beginPath(); g.ellipse(px, py, r * 1.6, r * 0.5, 0, 0, TAU); outlined(g, '#7a1f33', 3);
      for (let k = 0; k < 7; k++) { const bx = px + (k - 3) * r * 0.4, by = py + Math.sin(t * 2 + k + i) * 2 - 2; ell(g, bx, by, 6, 6, '#e0304f'); ell(g, bx - 2, by - 2, 2, 2, '#ff9aa8'); }
    }
  },
  // swirling leaf piles
  leaves(g, { x0, w, gy, u, lane, t }) {
    const n = Math.max(3, Math.floor(w / 64));
    for (let i = 0; i < n; i++) leafPile(g, x0 + (i + 0.5) * (w / n), gy + u * (0.3 + (i % 2) * 0.35), u * 0.5);
    for (let i = 0; i < 10; i++) { const x = x0 + ((hash(i + lane) * w + t * 120) % w), y = gy - u * 0.3 + Math.sin(t * 4 + i) * u * 0.3 + hash(i) * u * 0.8; ell(g, x, y, 6, 3, LEAVES[i % 4], t + i); }
  },
  // yard lines and a charging blitz
  yards(g, { x0, w, gy, u, t }) {
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x0, gy - u * 0.1, w, u * 0.75);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i++) g.fillRect(x0 + (i + 0.5) * (w / 6), gy - u * 0.1, 4, u * 0.75);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4;
    for (let i = 0; i < 8; i++) { const yy = gy - u * 0.05 + (i / 8) * u * 0.7, xx = x0 + ((t * 300 + i * 70) % w); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 40, yy); g.stroke(); }
  },
  // candlestick chicane
  candles(g, { x0, w, gy, u, t }) {
    const n = Math.max(3, Math.floor(w / 64));
    for (let i = 0; i < n; i++) candle(g, x0 + (i + 0.5) * (w / n), i % 2 ? gy + u * 0.78 : gy + u * 0.18, u * 0.6, t);
  },
  // crumbs and wrinkles in the tablecloth
  crumbs(g, { x0, w, gy, u, lane }) {
    g.fillStyle = 'rgba(160,110,60,0.25)'; g.fillRect(x0, gy - u * 0.1, w, u * 0.75);
    const n = Math.max(4, Math.floor(w / 46));
    for (let i = 0; i < n; i++) { const px = x0 + (i + 0.5) * (w / n), py = gy + u * (0.1 + hash(i + lane) * 0.5), r = u * (0.14 + hash(i + 3) * 0.1); g.beginPath(); g.ellipse(px, py, r * 1.3, r, 0, Math.PI, 0); outlined(g, '#e6c88c', 2.5); }
  },
};
