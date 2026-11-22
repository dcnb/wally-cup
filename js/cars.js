// Procedural cartoon cars. Everything is drawn on a canvas, so there are no image files.
// Cars face RIGHT. Local coordinate space: x 0..200, y 0 is the ground, negative y is up.

import { theme } from './theme.js';

export const CAR_W = 200; // nominal width in local units

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function poly(g, pts, fill, stroke = '#1b1b24', lw = 3) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(); }
}

function rrect(g, x, y, w, h, r, fill, stroke = '#1b1b24', lw = 3) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
}

function ellipse(g, x, y, rx, ry, fill, stroke = '#1b1b24', lw = 3) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
}

function wheel(g, x, r, angle, opts = {}) {
  const cy = -r;
  g.save();
  g.translate(x, cy);
  ellipse(g, 0, 0, r, r, '#23232b', '#0d0d12', 2.5);
  if (opts.tread) {
    g.strokeStyle = '#3a3a45'; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + angle;
      g.beginPath(); g.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke();
    }
  }
  ellipse(g, 0, 0, r * 0.58, r * 0.58, opts.rim || '#d9dce3', '#2a2a33', 2);
  g.rotate(angle);
  g.strokeStyle = '#7b7f8c'; g.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    g.rotate((Math.PI * 2) / 5);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(r * 0.55, 0); g.stroke();
  }
  ellipse(g, 0, 0, r * 0.14, r * 0.14, '#555a66', null);
  g.restore();
}

// A little driver face. mood: happy | race | dizzy | sad | win
function face(g, x, y, s, mood, t) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  ellipse(g, 0, 0, 11, 11, '#ffe0b8', '#1b1b24', 2);
  g.lineCap = 'round';
  g.strokeStyle = '#1b1b24';
  g.fillStyle = '#1b1b24';
  g.lineWidth = 2;
  const eye = (ex, ey) => { g.beginPath(); g.arc(ex, ey, 1.9, 0, Math.PI * 2); g.fill(); };
  if (mood === 'dizzy') {
    for (const ex of [-4.5, 4.5]) {
      g.beginPath();
      for (let a = 0; a < 12; a += 0.4) {
        const r = a * 0.33;
        const px = ex + Math.cos(a + t * 12) * r, py = -2 + Math.sin(a + t * 12) * r;
        if (a === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.lineWidth = 1.3; g.stroke();
    }
    g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 5.5, 3, 2.2, 0, 0, Math.PI * 2); g.stroke();
  } else if (mood === 'sad') {
    eye(-4.5, -1); eye(4.5, -1);
    g.beginPath(); g.moveTo(-8, -6); g.lineTo(-2, -4); g.moveTo(8, -6); g.lineTo(2, -4); g.stroke(); // worried brows
    g.beginPath(); g.arc(0, 8.5, 4, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); // frown
    // tears
    const d = (t * 14) % 10;
    g.fillStyle = '#4fb8ff';
    g.beginPath(); g.ellipse(-5.5, 3 + d, 1.6, 2.4, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(5.5, 3 + ((d + 5) % 10), 1.6, 2.4, 0, 0, Math.PI * 2); g.fill();
  } else if (mood === 'race') {
    eye(-4, -1); eye(5, -1);
    g.beginPath(); g.moveTo(-8, -5.5); g.lineTo(-1.5, -3.2); g.moveTo(9, -5.5); g.lineTo(2.5, -3.2); g.stroke(); // determined brows
    g.beginPath(); g.moveTo(-3, 6); g.lineTo(5, 5); g.stroke();
  } else if (mood === 'win') {
    eye(-4.5, -2); eye(4.5, -2);
    g.beginPath(); g.moveTo(-6, 3); g.quadraticCurveTo(0, 13, 6, 3); g.closePath();
    g.fillStyle = '#7a1d2b'; g.fill(); g.stroke();
  } else {
    eye(-4.5, -1.5); eye(4.5, -1.5);
    g.beginPath(); g.arc(0, 3, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  }
  g.restore();
}

export const GLASS = '#bfe8ff';
export const CHROME = '#e9edf3';
export { shade, poly, rrect, ellipse, wheel, face };

// Each drawer paints one car body and returns its driver position {x, y}.
const DRAW = {
  // --- Wallace: low aerodynamic race car, lime green ---
  wallace(g, c, a) {
    const dark = shade(c, -0.35);
    // rear wing
    rrect(g, 6, -58, 34, 7, 2, dark);
    poly(g, [[16, -52], [20, -52], [22, -30], [18, -30]], '#2a2a33');
    poly(g, [[28, -52], [32, -52], [32, -30], [28, -30]], '#2a2a33');
    // body
    poly(g, [[8, -16], [14, -34], [70, -38], [112, -34], [172, -24], [198, -18], [198, -12], [8, -10]], c);
    poly(g, [[74, -38], [112, -34], [172, -24], [150, -30], [100, -32]], shade(c, 0.35), null);
    // stripe
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.moveTo(40, -27); g.lineTo(176, -19); g.stroke();
    // front wing
    poly(g, [[170, -9], [200, -9], [204, -4], [166, -4]], dark);
    // cockpit
    ellipse(g, 98, -42, 22, 18, GLASS);
    wheel(g, 48, 19, a, { rim: '#fff' });
    wheel(g, 150, 18, a, { rim: '#fff' });
    return { x: 98, y: -42, s: 0.95 };
  },

  // --- Agnes: VW Beetle (slug bug), hot pink: domed roof, sloped hood, round fenders ---
  agnes(g, c, a) {
    const dark = shade(c, -0.32), hi = shade(c, 0.4);
    // running board
    rrect(g, 38, -22, 126, 7, 3, '#2a2a33');
    // main body: steep rear slope, big round dome, gently falling hood
    g.beginPath();
    g.moveTo(10, -22);
    g.bezierCurveTo(2, -40, 16, -54, 46, -62);
    g.bezierCurveTo(62, -96, 134, -100, 152, -64);
    g.bezierCurveTo(172, -60, 194, -52, 198, -36);
    g.lineTo(198, -22);
    g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    // roof highlight
    g.strokeStyle = hi; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(72, -84); g.bezierCurveTo(92, -94, 122, -94, 136, -80); g.stroke();
    // wheel arches (dark) + round fender creases
    for (const wx of [52, 150]) {
      g.fillStyle = '#17171d'; g.beginPath(); g.arc(wx, -17, 23, Math.PI, 0); g.fill();
      g.strokeStyle = dark; g.lineWidth = 4; g.beginPath(); g.arc(wx, -17, 28, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    }
    // window dome with a pillar
    g.beginPath();
    g.moveTo(60, -63); g.bezierCurveTo(70, -88, 126, -92, 144, -66); g.closePath();
    g.fillStyle = GLASS; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#1b1b24'; g.stroke();
    g.beginPath(); g.moveTo(100, -88); g.lineTo(100, -65); g.stroke();
    // belt-line chrome + door line
    g.strokeStyle = CHROME; g.lineWidth = 3; g.beginPath(); g.moveTo(34, -44); g.quadraticCurveTo(100, -50, 176, -44); g.stroke();
    g.strokeStyle = dark; g.lineWidth = 2; g.beginPath(); g.moveTo(100, -62); g.lineTo(100, -26); g.stroke();
    // round headlight sitting on the front fender, round tail light, chrome bumpers
    ellipse(g, 186, -42, 8, 8, CHROME); ellipse(g, 187, -42, 5, 5, '#fff7b0'); ellipse(g, 188, -43, 1.8, 1.8, '#fff', null);
    ellipse(g, 15, -34, 4.5, 4.5, '#ff4a4a');
    rrect(g, 190, -26, 12, 6, 3, CHROME); rrect(g, 0, -26, 14, 6, 3, CHROME);
    // daisy on the door
    for (let k = 0; k < 6; k++) { const an = k * 1.047; ellipse(g, 78 + Math.cos(an) * 5, -38 + Math.sin(an) * 5, 3.2, 3.2, '#fff', null); }
    ellipse(g, 78, -38, 2.6, 2.6, '#ffd21f', null);
    wheel(g, 52, 17, a, { rim: CHROME }); wheel(g, 150, 17, a, { rim: CHROME });
    return { x: 100, y: -76, s: 0.78 };
  },

  // --- Kristin: Subaru wagon, black ---
  kristin(g, c, a) {
    const hi = shade(c, 0.35);
    // roof cargo: a box and a red cooler full of snacks, held on silver crossbars
    rrect(g, 30, -92, 62, 15, 6, '#5a5f6b');
    rrect(g, 98, -88, 26, 12, 3, '#e5483a'); rrect(g, 96, -92, 30, 5, 2, '#f6ecd6');
    rrect(g, 24, -78, 106, 4, 2, '#aab0bb', null);
    poly(g, [[44, -77], [44, -73], [48, -73], [48, -77]], '#aab0bb', null, 0);
    // body: boxy wagon roof running all the way back, upright tailgate, low hood
    poly(g, [[8, -18], [8, -44], [22, -72], [124, -72], [152, -44], [198, -37], [198, -18]], c);
    // rear spoiler over the tailgate window
    poly(g, [[8, -70], [26, -76], [30, -72], [14, -68]], '#1b1b24', null);
    // side windows: cargo quarter, rear door, front door
    poly(g, [[16, -47], [24, -68], [48, -68], [48, -47]], GLASS, '#0b0b10', 2.5);
    poly(g, [[54, -47], [54, -68], [92, -68], [92, -47]], GLASS, '#0b0b10', 2.5);
    poly(g, [[98, -47], [98, -68], [122, -68], [145, -47]], GLASS, '#0b0b10', 2.5);
    // door seams + handles
    g.strokeStyle = '#0b0b10'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(51, -46); g.lineTo(51, -20); g.moveTo(95, -46); g.lineTo(95, -20); g.stroke();
    rrect(g, 76, -41, 10, 3, 1.5, hi, null); rrect(g, 120, -41, 10, 3, 1.5, hi, null);
    // silver trim, black lower cladding (a very outdoorsy touch)
    g.strokeStyle = '#aab0bb'; g.lineWidth = 3; g.beginPath(); g.moveTo(12, -46); g.lineTo(148, -46); g.stroke();
    rrect(g, 6, -26, 194, 9, 3, '#3a3a45', null);
    // lights + hood scoop
    rrect(g, 186, -33, 12, 7, 3, '#fff7b0'); rrect(g, 8, -40, 6, 11, 2, '#ff4a4a');
    poly(g, [[166, -43], [186, -40], [186, -37], [166, -40]], '#15151b', null, 0);
    wheel(g, 50, 17, a); wheel(g, 150, 17, a);
    return { x: 118, y: -57, s: 0.72 };
  },


  // --- Devin: Range Rover, teal ---
  devin(g, c, a) {
    const dark = shade(c, -0.3);
    poly(g, [[10, -22], [10, -62], [32, -90], [150, -90], [174, -62], [196, -56], [196, -22]], c);
    poly(g, [[10, -36], [196, -36], [196, -22], [10, -22]], dark, null);
    g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -36); g.lineTo(196, -36); g.stroke();
    poly(g, [[38, -62], [46, -84], [88, -84], [88, -62]], GLASS, '#0b0b10', 2.5);
    poly(g, [[94, -62], [94, -84], [146, -84], [164, -62]], GLASS, '#0b0b10', 2.5);
    // roof rack
    rrect(g, 36, -96, 112, 5, 2, '#444', null);
    for (const x of [48, 90, 132]) rrect(g, x, -94, 4, 6, 1, '#444', null);
    rrect(g, 184, -50, 12, 8, 3, '#fff7b0');
    rrect(g, 190, -34, 8, 10, 2, CHROME);
    wheel(g, 50, 21, a, { tread: true }); wheel(g, 152, 21, a, { tread: true });
    return { x: 120, y: -73, s: 1.0 };
  },

  // --- Tyson: Cadillac sedan, gray, tail fins ---
  tyson(g, c, a) {
    const hi = shade(c, 0.35);
    // tail fin
    poly(g, [[8, -36], [4, -58], [34, -42]], c);
    poly(g, [[8, -16], [8, -40], [30, -42], [66, -44], [78, -66], [128, -66], [152, -44], [198, -38], [198, -16]], c);
    poly(g, [[82, -46], [90, -62], [124, -62], [140, -46]], GLASS, '#0b0b10', 2.5);
    g.strokeStyle = hi; g.lineWidth = 4; g.beginPath(); g.moveTo(16, -30); g.lineTo(190, -28); g.stroke();
    rrect(g, 0, -22, 22, 7, 3, CHROME); rrect(g, 180, -22, 20, 7, 3, CHROME);
    rrect(g, 190, -36, 8, 7, 2, '#fff7b0'); rrect(g, 6, -38, 6, 6, 2, '#ff4a4a');
    wheel(g, 48, 16, a, { rim: '#fff' }); wheel(g, 152, 16, a, { rim: '#fff' });
    return { x: 107, y: -55, s: 0.8 };
  },

  // --- Kady: Tesla sedan, blue ---
  kady(g, c, a) {
    g.beginPath();
    g.moveTo(8, -16); g.bezierCurveTo(6, -34, 20, -38, 50, -42);
    g.bezierCurveTo(74, -70, 140, -72, 160, -44);
    g.bezierCurveTo(186, -42, 198, -34, 198, -16);
    g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    g.beginPath();
    g.moveTo(62, -45); g.bezierCurveTo(84, -64, 130, -66, 150, -46); g.closePath();
    g.fillStyle = GLASS; g.fill(); g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = '#1b1b24'; g.lineWidth = 2; g.beginPath(); g.moveTo(104, -63); g.lineTo(104, -46); g.stroke();
    rrect(g, 182, -34, 14, 5, 2, '#e8f8ff');
    rrect(g, 8, -33, 8, 5, 2, '#ff4a4a');
    // T badge
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(174, -26); g.lineTo(182, -26); g.moveTo(178, -26); g.lineTo(178, -20); g.stroke();
    wheel(g, 50, 16, a); wheel(g, 150, 16, a);
    return { x: 104, y: -54, s: 0.8 };
  },

  // --- Nolan: dump truck, orange ---
  nolan(g, c, a) {
    const dark = shade(c, -0.3);
    // dump bed (tilted a bit)
    g.save(); g.translate(8, -44); g.rotate(-0.07);
    poly(g, [[0, 0], [118, 0], [118, -44], [-2, -48]], dark);
    g.strokeStyle = shade(c, -0.5); g.lineWidth = 3;
    for (let x = 22; x < 118; x += 26) { g.beginPath(); g.moveTo(x, -2); g.lineTo(x, -42); g.stroke(); }
    g.restore();
    // chassis
    rrect(g, 6, -44, 190, 14, 3, '#3a3a45');
    // cab
    poly(g, [[132, -30], [132, -80], [172, -80], [196, -52], [196, -30]], c);
    poly(g, [[140, -56], [140, -74], [168, -74], [184, -56]], GLASS, '#0b0b10', 2.5);
    rrect(g, 190, -48, 8, 8, 2, '#fff7b0');
    rrect(g, 186, -34, 14, 6, 2, '#444', null);
    // exhaust
    rrect(g, 126, -104, 6, 34, 3, '#555');
    wheel(g, 38, 18, a, { tread: true }); wheel(g, 76, 18, a, { tread: true }); wheel(g, 160, 19, a, { tread: true });
    return { x: 156, y: -64, s: 0.85 };
  },

  // --- Jack: Cybertruck, silver, super angular ---
  jack(g, c, a) {
    const hi = shade(c, 0.4), dark = shade(c, -0.25);
    poly(g, [[8, -20], [8, -46], [66, -52], [124, -84], [198, -38], [198, -20]], c);
    poly(g, [[66, -52], [124, -84], [124, -52]], hi, null);
    poly(g, [[8, -46], [66, -52], [124, -52], [198, -38], [198, -30], [8, -30]], dark, null);
    g.strokeStyle = '#1b1b24'; g.lineWidth = 3;
    poly(g, [[8, -20], [8, -46], [66, -52], [124, -84], [198, -38], [198, -20]], null);
    // window
    poly(g, [[90, -56], [122, -78], [160, -52], [160, -56]], '#222a33', '#0b0b10', 2.5);
    // light bar
    rrect(g, 176, -42, 22, 4, 2, '#e8f8ff', null);
    rrect(g, 6, -44, 10, 4, 2, '#ff4a4a', null);
    wheel(g, 50, 19, a, { rim: '#9aa1ad' }); wheel(g, 150, 19, a, { rim: '#9aa1ad' });
    return { x: 126, y: -62, s: 0.8 };
  },

  // --- Josie: ice cream truck, white + light blue ---
  josie(g, c, a) {
    const acc = '#79c8f0';
    // box
    rrect(g, 8, -92, 140, 68, 10, '#fff');
    rrect(g, 8, -52, 140, 14, 0, acc, null);
    // cab
    poly(g, [[148, -24], [148, -70], [176, -70], [198, -44], [198, -24]], acc);
    poly(g, [[154, -46], [154, -64], [172, -64], [186, -46]], GLASS, '#0b0b10', 2.5);
    // serving window + awning
    rrect(g, 40, -82, 56, 26, 4, '#2f4a68');
    for (let i = 0; i < 4; i++) rrect(g, 36 + i * 16, -90, 16, 12, 3, i % 2 ? '#ff7bb0' : '#fff', '#1b1b24', 2);
    // big ice cream on roof
    poly(g, [[102, -92], [124, -92], [113, -124]], '#e2a95a');
    ellipse(g, 113, -100, 15, 11, '#ff9bc4'); ellipse(g, 113, -112, 12, 9, '#fff1f6'); ellipse(g, 113, -122, 4, 4, '#ff3a5c', null);
    // stripe stars
    ellipse(g, 120, -44, 4, 4, '#fff', null); ellipse(g, 20, -44, 4, 4, '#fff', null);
    rrect(g, 192, -36, 8, 8, 2, '#fff7b0');
    wheel(g, 48, 17, a); wheel(g, 160, 17, a);
    return { x: 164, y: -55, s: 0.8 };
  },

  // --- Grandma Nancy: monster truck, yellow, giant wheels ---
  nancy(g, c, a) {
    const dark = shade(c, -0.3);
    // axles / suspension
    g.strokeStyle = '#444'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(44, -30); g.lineTo(60, -56); g.moveTo(156, -30); g.lineTo(140, -56); g.stroke();
    // body
    poly(g, [[28, -58], [30, -86], [76, -92], [92, -118], [150, -118], [168, -90], [196, -84], [196, -58]], c);
    poly(g, [[98, -92], [102, -112], [146, -112], [160, -92]], GLASS, '#0b0b10', 2.5);
    rrect(g, 28, -70, 168, 8, 0, dark, null);
    // flames
    for (let i = 0; i < 4; i++) poly(g, [[40 + i * 22, -62], [52 + i * 22, -66], [40 + i * 22 + 4, -76]], '#ff5a1f', null);
    rrect(g, 188, -78, 8, 8, 2, '#fff7b0');
    wheel(g, 46, 32, a, { tread: true, rim: '#ddd' }); wheel(g, 154, 32, a, { tread: true, rim: '#ddd' });
    return { x: 124, y: -100, s: 0.85 };
  },

  // --- Rufus: a tan dog on wheels. Snout hood, floppy ear, wagging tail ---
  rufus(g, c, a) {
    const dark = shade(c, -0.3), light = shade(c, 0.45), ear = shade(c, -0.5);
    const wag = Math.sin(a * 1.3) * 0.35;
    // tail (wags with the wheels)
    g.save(); g.translate(16, -52); g.rotate(-0.9 + wag);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -26, 8, -42); g.quadraticCurveTo(12, -22, 9, 0); g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    g.restore();
    // body: long dog torso
    g.beginPath();
    g.moveTo(12, -22); g.quadraticCurveTo(6, -62, 40, -66); g.lineTo(122, -66);
    g.quadraticCurveTo(144, -66, 146, -44); g.lineTo(146, -22); g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    // belly / chest patch
    g.beginPath(); g.moveTo(22, -22); g.quadraticCurveTo(70, -34, 132, -22); g.closePath(); g.fillStyle = light; g.fill();
    // spots
    ellipse(g, 46, -50, 9, 6, dark, null); ellipse(g, 78, -56, 7, 5, dark, null);
    // head + snout (the hood)
    ellipse(g, 150, -68, 27, 27, c);
    rrect(g, 150, -64, 48, 26, 12, c);
    rrect(g, 156, -50, 38, 12, 6, light, null);
    ellipse(g, 196, -56, 9, 7, '#1b1b24', '#1b1b24', 2);
    ellipse(g, 193, -58, 2.5, 2, '#6b6f80', null);
    g.strokeStyle = '#1b1b24'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(176, -45); g.quadraticCurveTo(186, -40, 194, -46); g.stroke(); // smile
    ellipse(g, 177, -43, 3, 5, '#ff7b9c', null); // tongue
    // dog eye + brow on the head
    ellipse(g, 168, -76, 4.2, 4.2, '#fff'); ellipse(g, 169.5, -76, 2.2, 2.2, '#1b1b24', null);
    // floppy ear
    g.save(); g.translate(138, -86); g.rotate(0.25 + wag * 0.15);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-22, 6, -16, 36); g.quadraticCurveTo(0, 42, 12, 20); g.quadraticCurveTo(14, 6, 0, 0);
    g.fillStyle = ear; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    g.restore();
    // collar + tag
    g.strokeStyle = '#e5483a'; g.lineWidth = 7; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(129, -74); g.quadraticCurveTo(138, -44, 134, -22); g.stroke();
    ellipse(g, 138, -34, 5, 5, '#ffc93c');
    // driver's window on the back
    g.beginPath(); g.moveTo(52, -66); g.quadraticCurveTo(58, -88, 84, -88); g.quadraticCurveTo(110, -88, 114, -66); g.closePath();
    g.fillStyle = GLASS; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#1b1b24'; g.stroke();
    // bone on the door
    g.fillStyle = '#fff'; g.strokeStyle = '#1b1b24'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(70, -40, 34, 7, 3.5); g.fill(); g.stroke();
    for (const [bx, by] of [[70, -42], [70, -31], [104, -42], [104, -31]]) { g.beginPath(); g.arc(bx, by + 0, 4, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = '#fff'; g.fillRect(72, -41, 30, 8);
    wheel(g, 52, 17, a, { rim: '#fff' }); wheel(g, 142, 17, a, { rim: '#fff' });
    return { x: 84, y: -77, s: 0.78 };
  },

  // --- Juju: golden retriever race car. Rufus's cousin: fluffier, sunnier, carries a tennis ball. ---
  juju(g, c, a) {
    const light = shade(c, 0.5), ear = shade(c, -0.38), fur = shade(c, -0.15);
    const wag = Math.sin(a * 1.6) * 0.5; // a bigger, happier wag than Rufus
    // feathery plume tail
    g.save(); g.translate(14, -50); g.rotate(-1.05 + wag);
    for (const [len, col] of [[52, fur], [44, c]]) {
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-18, -len * 0.5, -4, -len); g.quadraticCurveTo(10, -len * 0.55, 12, 0); g.closePath();
      g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    }
    g.restore();
    // body: long, low retriever torso
    g.beginPath();
    g.moveTo(12, -22); g.quadraticCurveTo(6, -60, 40, -64); g.lineTo(122, -64);
    g.quadraticCurveTo(144, -64, 146, -44); g.lineTo(146, -22); g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    // fluffy cream chest + feathered belly fringe
    g.beginPath(); g.moveTo(112, -24); g.quadraticCurveTo(138, -42, 146, -46); g.lineTo(146, -22); g.closePath(); g.fillStyle = light; g.fill();
    g.beginPath(); g.moveTo(18, -22);
    for (let x = 18; x <= 146; x += 14) { g.lineTo(x + 7, -14); g.lineTo(x + 14, -22); }
    g.closePath(); g.fillStyle = fur; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#1b1b24'; g.stroke();
    // head + snout (the hood)
    ellipse(g, 150, -66, 27, 27, c);
    rrect(g, 150, -62, 46, 26, 12, c);
    rrect(g, 156, -48, 36, 11, 6, light, null);
    ellipse(g, 194, -54, 9, 7, '#1b1b24', '#1b1b24', 2);
    ellipse(g, 191, -56, 2.5, 2, '#6b6f80', null);
    // tennis ball held in a big happy grin
    g.strokeStyle = '#1b1b24'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(172, -44); g.quadraticCurveTo(182, -38, 192, -44); g.stroke();
    ellipse(g, 183, -36, 10, 10, '#d9f24a');
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(178, -36, 9, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(188, -36, 9, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
    // sparkly dog eye
    ellipse(g, 168, -74, 4.6, 4.6, '#fff'); ellipse(g, 169.5, -74, 2.4, 2.4, '#1b1b24', null); ellipse(g, 170.3, -75, 0.9, 0.9, '#fff', null);
    // long feathered ear
    g.save(); g.translate(138, -84); g.rotate(0.2 + wag * 0.2);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-26, 4, -20, 40); g.lineTo(-10, 34); g.lineTo(-4, 46); g.quadraticCurveTo(10, 40, 14, 18); g.quadraticCurveTo(14, 6, 0, 0);
    g.fillStyle = ear; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1b24'; g.stroke();
    g.restore();
    // teal bandana instead of a collar
    poly(g, [[124, -70], [150, -64], [136, -34]], '#2e9aa0');
    for (const [bx, by] of [[134, -60], [140, -54], [136, -46]]) ellipse(g, bx, by, 2, 2, '#f6ecd6', null);
    // driver's window on the back
    g.beginPath(); g.moveTo(52, -64); g.quadraticCurveTo(58, -86, 84, -86); g.quadraticCurveTo(110, -86, 114, -64); g.closePath();
    g.fillStyle = GLASS; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#1b1b24'; g.stroke();
    // racing roundel with a J
    ellipse(g, 86, -38, 13, 13, '#fff');
    g.fillStyle = '#1b1b24'; g.font = '700 18px "Alfa Slab One", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('J', 86, -37);
    wheel(g, 52, 17, a, { rim: '#2e9aa0' }); wheel(g, 142, 17, a, { rim: '#2e9aa0' });
    return { x: 84, y: -75, s: 0.78 };
  },

  // --- Kim: bright red Lamborghini. Low, wide, wedge-shaped. ---
  kim(g, c, a) {
    const dark = shade(c, -0.45), hi = shade(c, 0.35);
    // rear wing
    rrect(g, 4, -50, 30, 6, 2, dark);
    poly(g, [[12, -44], [16, -44], [18, -30], [14, -30]], '#2a2a33');
    // wedge body: tall rear, cab-forward, nose drops to the ground
    poly(g, [[6, -14], [8, -34], [58, -40], [92, -42], [198, -24], [200, -14]], c);
    // hood highlight
    poly(g, [[100, -42], [194, -26], [194, -29], [110, -44]], hi, null);
    // glass canopy (driver face is drawn over this)
    poly(g, [[82, -41], [112, -65], [146, -50], [168, -36], [150, -33]], GLASS, '#1b1b24', 2.5);
    g.strokeStyle = '#1b1b24'; g.lineWidth = 2; g.beginPath(); g.moveTo(112, -65); g.lineTo(124, -37); g.stroke();
    // side crease + air intake
    g.strokeStyle = dark; g.lineWidth = 3; g.beginPath(); g.moveTo(16, -26); g.lineTo(100, -26); g.stroke();
    poly(g, [[88, -34], [132, -32], [132, -20], [96, -18]], '#15151b', '#1b1b24', 2.5);
    g.strokeStyle = '#3a3a45'; g.lineWidth = 2;
    for (let x = 100; x < 130; x += 7) { g.beginPath(); g.moveTo(x, -31); g.lineTo(x + 2, -21); g.stroke(); }
    // sharp headlight, taillight, front splitter, bull badge
    poly(g, [[174, -31], [196, -27], [196, -23], [168, -27]], '#fff7b0', '#1b1b24', 2);
    rrect(g, 6, -33, 16, 6, 2, '#ffb02e');
    poly(g, [[170, -14], [204, -14], [200, -9], [168, -9]], '#23232b');
    ellipse(g, 186, -20, 4, 4, '#ffc93c', '#1b1b24', 1.5);
    // wheels sit in dark arches
    for (const wx of [48, 152]) {
      g.save(); g.beginPath(); g.rect(wx - 26, -46, 52, 46); g.clip();
      ellipse(g, wx, -15, 20, 20, '#141418', null); g.restore();
    }
    wheel(g, 48, 15, a, { rim: '#ffc93c' }); wheel(g, 152, 15, a, { rim: '#ffc93c' });
    return { x: 118, y: -52, s: 0.72 };
  },

  // --- Grandma Ro: VW van, lavender ---
  ro(g, c, a) {
    const dark = shade(c, -0.25);
    rrect(g, 8, -86, 188, 64, 22, c);
    // white roof/top
    g.save(); g.beginPath(); g.roundRect(8, -86, 188, 64, 22); g.clip();
    g.fillStyle = '#fff'; g.fillRect(0, -90, 210, 30); g.restore();
    g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.beginPath(); g.roundRect(8, -86, 188, 64, 22); g.stroke();
    // V stripe on the nose
    poly(g, [[130, -58], [196, -58], [196, -50], [160, -42]], c, null);
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(20, -50); g.lineTo(180, -50); g.stroke();
    // windows
    rrect(g, 20, -80, 30, 22, 5, GLASS, '#0b0b10', 2.5);
    rrect(g, 56, -80, 30, 22, 5, GLASS, '#0b0b10', 2.5);
    rrect(g, 92, -80, 30, 22, 5, GLASS, '#0b0b10', 2.5);
    poly(g, [[132, -80], [132, -58], [190, -58], [186, -76], [170, -80]], GLASS, '#0b0b10', 2.5);
    g.strokeStyle = '#0b0b10'; g.lineWidth = 2; g.beginPath(); g.moveTo(160, -80); g.lineTo(160, -58); g.stroke();
    // flower
    for (let i = 0; i < 6; i++) { const ang = i * 1.047; ellipse(g, 48 + Math.cos(ang) * 6, -34 + Math.sin(ang) * 6, 4, 4, '#ff9bc4', null); }
    ellipse(g, 48, -34, 3.5, 3.5, '#ffd21f', null);
    ellipse(g, 190, -34, 6, 6, '#fff7b0'); rrect(g, 192, -26, 8, 6, 2, CHROME);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 146, y: -69, s: 0.8 };
  },
};

/**
 * Draw a car.
 *  g: 2D ctx, x/y: bottom-center ground position in canvas px, width: pixel width of car.
 *  opts: { t, wheel, mood, rot (radians, spin), bob, flip, alpha, shadow }
 */
export function drawCar(g, car, x, y, width, opts = {}) {
  const s = width / CAR_W;
  const { t = 0, wheel: wa = 0, mood = 'happy', rot = 0, bob = 0, shadow = true, alpha = 1, lean = 0, noFace = false } = opts;
  g.save();
  g.globalAlpha = alpha;
  if (shadow) {
    g.save();
    g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath(); g.ellipse(0, 2 * s, width * 0.48, 7 * s, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  g.translate(x, y - bob);
  if (rot) { g.translate(0, -30 * s); g.rotate(rot); g.translate(0, 30 * s); }
  if (lean) g.rotate(lean);
  g.scale(s, s);
  g.translate(-CAR_W / 2, 0);
  g.lineJoin = 'round';
  const d = (theme.DRAW?.[car.id] || DRAW[car.id])(g, car.color, wa);
  if (!noFace) face(g, d.x, d.y, d.s, mood, t);
  g.restore();
}

// Height of the tallest car, in local units — for layout.
export const CAR_H = 130;
