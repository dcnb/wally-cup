// Thanksgiving food vehicles. Same conventions as cars.js: face RIGHT, x 0..200, y 0 = ground, up is negative.
// Each drawer takes (ctx, colorHex, wheelAngle) and returns the driver face anchor {x, y, s}.
import { shade, poly, rrect, ellipse, wheel, CHROME } from './cars.js';

const INK = '#1b1b24';
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function circ(g, x, y, r, fill, lw = 3) { ellipse(g, x, y, r, r, fill, INK, lw); }

// Pie crust dome with a woven lattice across it.
function lattice(g, cx, cy, rx, ry, crust) {
  ellipse(g, cx, cy, rx, ry, crust, INK, 3);
  g.save();
  g.beginPath(); g.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2); g.clip();
  g.strokeStyle = shade(crust, -0.35); g.lineWidth = 3;
  for (let k = -6; k <= 6; k++) {
    g.beginPath(); g.moveTo(cx + k * 16 - 30, cy - ry); g.lineTo(cx + k * 16 + 30, cy + ry); g.stroke();
    g.beginPath(); g.moveTo(cx + k * 16 + 30, cy - ry); g.lineTo(cx + k * 16 - 30, cy + ry); g.stroke();
  }
  g.restore();
}

export const DRAW_TDAY = {
  // Allen: apple pie in a foil tin, lattice top
  allen(g, c, a) {
    poly(g, [[28, -18], [172, -18], [184, -52], [16, -52]], '#cfd3da');
    g.strokeStyle = '#8f949e'; g.lineWidth = 2;
    for (let x = 36; x < 176; x += 14) { g.beginPath(); g.moveTo(x, -20); g.lineTo(x - 5 + (x - 100) * 0.08, -50); g.stroke(); }
    lattice(g, 100, -58, 84, 28, c);
    for (const [x, y] of [[34, -50], [60, -34], [152, -36], [176, -50]]) circ(g, x, y, 5, '#c8312b', 2);
    ellipse(g, 188, -34, 6, 6, '#fff7b0'); rrect(g, 184, -26, 14, 6, 2, CHROME);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 122, y: -66, s: 0.8 };
  },
  // Frank: Grandma Miller's white fluffy cake
  frank(g, c, a) {
    rrect(g, 20, -48, 160, 32, 6, '#fffaf0');
    for (let x = 30; x <= 170; x += 20) circ(g, x, -48, 11, '#fffaf0', 2.5); // fluffy scallops
    rrect(g, 50, -80, 100, 34, 6, '#fffaf0');
    for (let x = 58; x <= 142; x += 17) circ(g, x, -80, 9, '#fffaf0', 2.5);
    g.strokeStyle = '#f3a6b8'; g.lineWidth = 4; g.beginPath(); g.moveTo(22, -34); g.lineTo(178, -34); g.stroke();
    circ(g, 100, -96, 8, '#c8312b', 2.5); rrect(g, 98, -112, 4, 14, 1, '#4f9a4c', null);
    ellipse(g, 188, -34, 6, 6, '#fff7b0'); rrect(g, 182, -24, 14, 6, 2, CHROME);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 100, y: -62, s: 0.8 };
  },
  // Zanni: green bean casserole in a glass dish, crispy onions on top
  zanni(g, c, a) {
    rrect(g, 24, -62, 152, 44, 8, '#e6f3f0', INK, 3);
    rrect(g, 12, -56, 14, 8, 3, '#e6f3f0'); rrect(g, 174, -56, 14, 8, 3, '#e6f3f0'); // handles
    rrect(g, 30, -66, 140, 16, 7, c, INK, 3);
    for (let i = 0; i < 9; i++) rrect(g, 36 + i * 15, -76 - hash(i) * 6, 14, 8, 4, '#d9a03a', INK, 2); // crispy onions
    for (let i = 0; i < 5; i++) { g.strokeStyle = '#2f7d37'; g.lineWidth = 3; g.beginPath(); g.moveTo(42 + i * 30, -66); g.lineTo(52 + i * 30, -80 - hash(i + 4) * 4); g.stroke(); }
    ellipse(g, 188, -34, 6, 6, '#fff7b0'); rrect(g, 182, -26, 14, 6, 2, CHROME);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 100, y: -44, s: 0.8 };
  },
  // Alex: very tall roast turkey with a pilgrim hat (the tallest ride on the track)
  alex(g, c, a) {
    rrect(g, 12, -24, 176, 10, 5, '#d9dde3');
    ellipse(g, 100, -62, 82, 44, c, INK, 3);
    ellipse(g, 100, -48, 70, 26, shade(c, 0.22), null);
    for (const x of [16, 184]) { // drumsticks
      ellipse(g, x, -40, 15, 21, shade(c, -0.08), INK, 3);
      rrect(g, x - 5, -22, 10, 12, 4, '#fff1d4', INK, 2.5);
    }
    // pilgrim hat
    rrect(g, 66, -108, 68, 6, 3, '#26262b'); poly(g, [[78, -108], [122, -108], [118, -150], [82, -150]], '#26262b');
    rrect(g, 80, -122, 40, 8, 2, '#ffc93c', '#1b1b24', 2);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 122, y: -74, s: 0.85 };
  },
  // Heidi: a wheel of cheese that rolls like a discus
  heidi(g, c, a) {
    ellipse(g, 100, -24, 78, 12, shade(c, -0.25), INK, 3);
    rrect(g, 22, -66, 156, 44, 6, c, INK, 3);
    ellipse(g, 100, -66, 78, 15, shade(c, 0.28), INK, 3);
    for (const [x, y, r] of [[48, -42, 6], [78, -34, 4], [132, -40, 7], [160, -32, 4], [66, -58, 4]]) ellipse(g, x, y, r, r * 0.8, shade(c, -0.35), INK, 2);
    // a wedge cut out, with a cranberry bumper
    poly(g, [[140, -66], [178, -66], [178, -22]], shade(c, -0.15), INK, 2.5);
    for (const [x, y] of [[184, -30], [190, -40], [184, -48]]) circ(g, x, y, 6, '#b3203a', 2);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 100, y: -46, s: 0.85 };
  },
  // Fain: rhubarb pie with stalks sticking out and a college pennant
  fain(g, c, a) {
    poly(g, [[28, -18], [172, -18], [184, -50], [16, -50]], '#e8c9a0');
    ellipse(g, 100, -52, 84, 18, '#d9a35c', INK, 3);
    for (let i = 0; i < 7; i++) { // rhubarb stalks
      const x = 36 + i * 22, tilt = (i - 3) * 3;
      poly(g, [[x - 5, -52], [x + 5, -52], [x + 5 + tilt, -82 - hash(i) * 12], [x - 5 + tilt, -82 - hash(i) * 12]], i % 2 ? c : shade(c, -0.15), INK, 2.5);
    }
    // pennant on a pole
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(34, -60); g.lineTo(34, -118); g.stroke();
    poly(g, [[34, -118], [34, -96], [74, -107]], '#3d6fb0', INK, 2.5);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 126, y: -62, s: 0.78 };
  },
  // Bode: a piece of broccoli
  bode(g, c, a) {
    poly(g, [[66, -18], [134, -18], [124, -58], [76, -58]], '#a9d36b', INK, 3);
    g.strokeStyle = '#7da54a'; g.lineWidth = 2.5;
    for (const x of [88, 100, 112]) { g.beginPath(); g.moveTo(x, -20); g.lineTo(x, -56); g.stroke(); }
    const puffs = [[40, -78, 24], [70, -98, 28], [104, -108, 30], [138, -98, 28], [162, -78, 24], [100, -74, 34], [60, -70, 24], [144, -70, 24]];
    puffs.forEach(([x, y, r], i) => circ(g, x, y, r, i % 3 === 0 ? shade(c, 0.12) : c, 3));
    for (let i = 0; i < 16; i++) circ(g, 36 + hash(i) * 130, -112 + hash(i + 5) * 60, 3, shade(c, -0.25), 0);
    ellipse(g, 188, -34, 6, 6, '#fff7b0'); rrect(g, 182, -26, 14, 6, 2, CHROME);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 100, y: -44, s: 0.8 };
  },
  // Devin: a carrot car, leaves streaming out the back
  devin(g, c, a) {
    for (const [dx, dy, r] of [[-6, -18, -0.5], [-10, 0, 0], [-6, 16, 0.5]]) {
      g.save(); g.translate(24, -72); g.rotate(r - 0.5); ellipse(g, dx - 14, dy - 6, 20, 7, '#4f9a4c', INK, 2.5); g.restore();
    }
    poly(g, [[26, -74], [190, -40], [190, -30], [26, -18]], c, INK, 3);
    ellipse(g, 28, -46, 10, 28, c, INK, 3);
    g.strokeStyle = shade(c, -0.3); g.lineWidth = 2.5;
    for (const x of [70, 118, 150]) { g.beginPath(); g.moveTo(x, -64 + (x - 70) * 0.18); g.lineTo(x + 8, -58 + (x - 70) * 0.18); g.stroke(); }
    ellipse(g, 192, -34, 4, 4, '#fff7b0');
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 84, y: -50, s: 0.85 };
  },
  // Kristin: a slice of pumpkin pie with whipped cream
  kristin(g, c, a) {
    poly(g, [[30, -16], [30, -80], [188, -34], [188, -16]], c, INK, 3);
    rrect(g, 18, -86, 22, 72, 8, '#d9a35c', INK, 3);                 // crust edge
    rrect(g, 30, -26, 158, 10, 4, '#d9a35c', INK, 2.5);              // bottom crust
    ellipse(g, 74, -86, 22, 12, '#fffaf0', INK, 2.5); ellipse(g, 74, -98, 14, 9, '#fffaf0', INK, 2.5);
    ellipse(g, 74, -108, 7, 6, '#fffaf0', INK, 2.5);
    g.strokeStyle = shade(c, -0.25); g.lineWidth = 2;
    g.beginPath(); g.moveTo(52, -34); g.lineTo(176, -30); g.stroke();
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 98, y: -52, s: 0.82 };
  },
  // Grandma Ro: a nut-crusted cheeseball
  ro(g, c, a) {
    ellipse(g, 100, -56, 70, 48, '#f1dca0', INK, 3);
    for (let i = 0; i < 46; i++) {
      const ang = hash(i) * 6.28, rr = Math.sqrt(hash(i + 9));
      ellipse(g, 100 + Math.cos(ang) * rr * 62, -56 + Math.sin(ang) * rr * 40, 4.5, 3, i % 2 ? '#a8693a' : '#7b4a26', null);
    }
    // cracker spoiler and a parsley sprig
    g.save(); g.translate(30, -84); g.rotate(-0.35); rrect(g, -14, -10, 28, 20, 3, '#e6c88c', INK, 2.5); g.restore();
    circ(g, 100, -104, 7, '#4f9a4c', 2.5); circ(g, 110, -108, 6, '#6fb552', 2.5);
    wheel(g, 52, 16, a, { rim: c }); wheel(g, 150, 16, a, { rim: c });
    return { x: 116, y: -56, s: 0.82 };
  },
  // Agnes: a cupcake, pink wrapper, swirled frosting and sprinkles
  agnes(g, c, a) {
    poly(g, [[44, -18], [156, -18], [168, -58], [32, -58]], c, INK, 3);
    g.strokeStyle = shade(c, -0.3); g.lineWidth = 2.5;
    for (let x = 52; x <= 150; x += 14) { g.beginPath(); g.moveTo(x, -20); g.lineTo(x + (x - 100) * 0.12, -56); g.stroke(); }
    ellipse(g, 100, -66, 74, 16, '#fff0d6', INK, 3);
    ellipse(g, 100, -82, 56, 15, '#ffd4e6', INK, 3);
    ellipse(g, 100, -98, 36, 14, '#fff0d6', INK, 3);
    circ(g, 100, -112, 9, '#c8312b', 2.5);
    ['#3d6fb0', '#ffc93c', '#6fb552', '#e5483a'].forEach((col, k) => { for (let i = 0; i < 4; i++) rrect(g, 56 + k * 12 + i * 22, -88 + ((k + i) % 3) * 10, 7, 3, 1, col, null); });
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 104, y: -38, s: 0.8 };
  },
  // Wallace: a battleship on wheels (tonight's game is Battleship)
  wallace(g, c, a) {
    poly(g, [[8, -34], [190, -34], [178, -14], [24, -14]], c, INK, 3);              // hull
    rrect(g, 22, -26, 156, 5, 2, shade(c, -0.25), null);                              // waterline stripe
    rrect(g, 60, -50, 80, 16, 3, '#c9ced6', INK, 3);                                  // deck
    rrect(g, 88, -70, 38, 22, 3, '#aab1bc', INK, 3);                                  // bridge
    for (const x of [96, 107, 118]) rrect(g, x - 3, -64, 6, 6, 1, '#7fc4ff', INK, 1.5); // windows
    rrect(g, 104, -88, 4, 18, 1, '#26262b', INK, 1.5);                                // mast
    poly(g, [[108, -88], [124, -84], [108, -80]], '#e5483a', INK, 2);                 // flag
    // front and rear gun turrets with barrels
    ellipse(g, 154, -50, 14, 9, '#8a919d', INK, 3); rrect(g, 160, -54, 36, 6, 3, '#4a505a', INK, 2.5);
    ellipse(g, 44, -50, 12, 8, '#8a919d', INK, 3); rrect(g, 24, -53, 28, 5, 2.5, '#4a505a', INK, 2.5);
    // battleship peg
    circ(g, 70, -58, 4, '#e5483a', 2);
    wheel(g, 52, 16, a); wheel(g, 150, 16, a);
    return { x: 107, y: -60, s: 0.5 };
  },
  // Rufus: a turkey-drumstick dog car (still a very good boy)
  rufus(g, c, a) {
    ellipse(g, 92, -46, 64, 34, '#b8651f', INK, 3);
    ellipse(g, 84, -56, 36, 12, '#d98a3a', null);
    rrect(g, 14, -50, 34, 10, 5, '#fff1d4', INK, 2.5); circ(g, 14, -54, 7, '#fff1d4', 2.5); circ(g, 14, -42, 7, '#fff1d4', 2.5); // bone end
    ellipse(g, 162, -64, 24, 22, c, INK, 3);                                    // dog head
    rrect(g, 172, -62, 26, 18, 8, shade(c, 0.15), INK, 3); circ(g, 197, -57, 4.5, '#26262b', 0);
    g.save(); g.translate(146, -64); g.rotate(0.3 + Math.sin(a * 3) * 0.1); ellipse(g, 0, 8, 9, 17, shade(c, -0.3), INK, 2.5); g.restore(); // floppy ear
    wheel(g, 50, 16, a); wheel(g, 128, 16, a);
    return { x: 160, y: -70, s: 0.62 };
  },
  // Fika: a small black poodle riding a dinner roll
  fika(g, c, a) {
    ellipse(g, 100, -28, 80, 24, '#d9a45a', INK, 3);
    ellipse(g, 100, -36, 66, 12, '#e9be7c', null);
    g.strokeStyle = '#a8742f'; g.lineWidth = 2.5;
    for (const x of [64, 100, 136]) { g.beginPath(); g.moveTo(x, -50); g.lineTo(x - 4, -34); g.stroke(); }
    // poodle puffs
    for (const [x, y, r] of [[56, -58, 16], [86, -62, 20], [118, -58, 18], [32, -72, 11]]) circ(g, x, y, r, c, 3);
    circ(g, 142, -78, 21, c, 3);
    circ(g, 126, -88, 11, c, 3); circ(g, 158, -92, 9, c, 3);                    // ear puffs and topknot
    circ(g, 142, -104, 10, c, 3);
    ellipse(g, 172, -72, 14, 9, shade(c, 0.12), INK, 3); circ(g, 184, -72, 3.5, '#0d0d12', 0); // snout
    g.strokeStyle = shade(c, 0.35); g.lineWidth = 2; g.beginPath(); g.arc(142, -78, 14, 3.6, 4.7); g.stroke();
    wheel(g, 52, 14, a); wheel(g, 148, 14, a);
    return { x: 140, y: -78, s: 0.58 };
  },
};
