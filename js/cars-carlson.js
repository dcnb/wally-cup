// Family cars for the Linger Cup. Same conventions as cars.js: face RIGHT, x 0..200, y 0 = ground, up is negative.
// Each drawer takes (ctx, colorHex, wheelAngle) and returns the driver face anchor {x, y, s}.
// Lots of these reuse the Wally Cup drawers (recolored) and then add a family-specific detail on top.
import { DRAW, shade, poly, rrect, ellipse, wheel, GLASS, CHROME } from './cars.js';

const INK = '#1b1b24';

// A drawer that runs `base` first, then paints extras on top. `extra` gets the base's face anchor.
const plus = (base, extra) => (g, c, a) => { const d = base(g, c, a); g.save(); extra(g, c, a, d); g.restore(); return d; };
const emo = (g, ch, x, y, size = 18) => { g.font = `${size}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(ch, x, y); };
const label = (g, text, x, y, size, fill = '#fff', stroke = INK) => {
  g.font = `${size}px "Alfa Slab One", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = stroke; g.strokeText(text, x, y); g.fillStyle = fill; g.fillText(text, x, y);
};
const sparkle4 = (g, x, y, r, fill = '#fff') => {
  g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fillStyle = fill; g.fill();
};

// Scale a drawer around the middle of the car (Munija is small but fierce).
const scaled = (base, k, extra) => (g, c, a) => {
  g.save(); g.translate(100, 0); g.scale(k, k); g.translate(-100, 0);
  const d = base(g, c, a);
  if (extra) extra(g, c, a, d);
  g.restore();
  return { x: 100 + (d.x - 100) * k, y: d.y * k, s: d.s * k };
};

// ---------- compact cars: Mini Cooper, Prius, Volvo wagon, Audi ----------
const SHAPES = {
  mini:  { body: [[8, -20], [8, -42], [22, -50], [40, -80], [136, -80], [156, -54], [198, -46], [198, -20]], win: [[44, -52], [50, -74], [88, -74], [88, -52]], win2: [[94, -52], [94, -74], [132, -74], [148, -52]], roof: [[38, -80], [138, -80], [142, -74], [34, -74]] },
  prius: { body: [[8, -20], [8, -46], [30, -58], [58, -84], [122, -84], [150, -56], [198, -44], [198, -20]], win: [[40, -58], [60, -78], [86, -78], [86, -58]], win2: [[92, -58], [92, -78], [120, -78], [142, -58]], roof: null },
  volvo: { body: [[8, -20], [8, -48], [16, -80], [136, -80], [160, -52], [198, -44], [198, -20]], win: [[22, -52], [24, -74], [60, -74], [60, -52]], win2: [[66, -52], [66, -74], [130, -74], [150, -52]], roof: null },
  audi:  { body: [[8, -20], [8, -44], [24, -54], [52, -80], [128, -80], [156, -54], [198, -44], [198, -20]], win: [[34, -54], [56, -75], [88, -75], [88, -54]], win2: [[94, -54], [94, -75], [126, -75], [148, -54]], roof: null },
};
function compact(kind, o = {}) {
  const S = SHAPES[kind];
  return (g, c, a) => {
    if (o.before) o.before(g, c, a);
    poly(g, S.body, c);
    if (S.roof) poly(g, S.roof, '#fffaf0', INK, 3);
    poly(g, S.win, GLASS, '#0b0b10', 2.5);
    poly(g, S.win2, GLASS, '#0b0b10', 2.5);
    g.strokeStyle = '#0b0b10'; g.lineWidth = 2; g.beginPath(); g.moveTo(91, -52); g.lineTo(91, -22); g.stroke();
    rrect(g, 70, -40, 10, 3, 1.5, shade(c, 0.4), null); rrect(g, 108, -40, 10, 3, 1.5, shade(c, 0.4), null);
    rrect(g, 6, -26, 194, 6, 3, shade(c, -0.25), null);
    if (kind === 'mini') {
      ellipse(g, 186, -38, 9, 9, '#fff7b0'); ellipse(g, 186, -38, 4, 4, CHROME, null);
      g.strokeStyle = '#fffaf0'; g.lineWidth = 6; g.beginPath(); g.moveTo(104, -80); g.lineTo(156, -54); g.stroke(); // hood stripe
    } else rrect(g, 186, -36, 12, 7, 3, '#fff7b0');
    rrect(g, 6, -40, 6, 11, 2, '#ff4a4a');
    wheel(g, 50, 16, a, o.rim ? { rim: o.rim } : {}); wheel(g, 150, 16, a, o.rim ? { rim: o.rim } : {});
    if (o.extra) o.extra(g, c, a);
    return { x: 112, y: -63, s: 0.66 };
  };
}

// ---------- jeep: boxy, roll bar, spare tire ----------
function jeep(g, c, a) {
  const dark = shade(c, -0.3);
  rrect(g, 8, -58, 190, 36, 6, c);
  rrect(g, 8, -34, 190, 12, 3, dark, null);
  // roll cage + flat windshield
  g.strokeStyle = '#2a2a33'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(24, -58); g.lineTo(34, -96); g.lineTo(120, -96); g.lineTo(130, -58); g.stroke();
  poly(g, [[128, -58], [136, -94], [144, -94], [152, -58]], GLASS, '#0b0b10', 2.5);
  rrect(g, 44, -92, 70, 24, 6, shade(c, 0.35), null); // driver's seat shows through the open top
  // fender flares, round lights, grille slots
  rrect(g, 24, -62, 52, 8, 4, '#2a2a33', null); rrect(g, 126, -62, 52, 8, 4, '#2a2a33', null);
  ellipse(g, 190, -46, 7, 7, '#fff7b0');
  g.strokeStyle = INK; g.lineWidth = 3; for (const x of [172, 178, 184]) { g.beginPath(); g.moveTo(x, -34); g.lineTo(x, -26); g.stroke(); }
  // spare tire on the back
  ellipse(g, 6, -44, 14, 14, '#23232b', '#0d0d12'); ellipse(g, 6, -44, 7, 7, shade(c, 0.2), '#0d0d12', 2);
  wheel(g, 50, 19, a, { tread: true }); wheel(g, 150, 19, a, { tread: true });
  return { x: 82, y: -84, s: 0.66 };
}

// ---------- sports cars ----------
function sports(g, c, a, o = {}) {
  const dark = shade(c, -0.3);
  poly(g, [[8, -20], [10, -38], [62, -44], [100, -50], [158, -42], [198, -34], [198, -20]], c);
  if (o.convertible) {
    poly(g, [[110, -50], [132, -66], [140, -66], [152, -46]], GLASS, '#0b0b10', 2.5); // low windshield
    rrect(g, 44, -62, 54, 20, 8, shade(c, 0.3), null); // seat back
    rrect(g, 40, -70, 14, 8, 3, shade(c, 0.1));         // headrest
  } else {
    poly(g, [[62, -44], [92, -70], [134, -70], [158, -44]], c);
    poly(g, [[76, -48], [96, -66], [130, -66], [148, -48]], GLASS, '#0b0b10', 2.5);
  }
  if (o.stripes) { g.strokeStyle = '#f6f6f0'; g.lineWidth = 6; g.beginPath(); g.moveTo(14, -34); g.lineTo(190, -30); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(14, -40); g.lineTo(100, -48); g.stroke(); }
  rrect(g, 6, -26, 194, 6, 3, dark, null);
  poly(g, [[176, -38], [196, -35], [196, -30], [172, -32]], '#fff7b0', INK, 2);
  rrect(g, 6, -38, 14, 6, 2, '#ff4a4a');
  wheel(g, 50, 17, a, { rim: o.rim || '#d9dce3' }); wheel(g, 150, 17, a, { rim: o.rim || '#d9dce3' });
  return { x: o.convertible ? 70 : 112, y: o.convertible ? -70 : -58, s: o.convertible ? 0.8 : 0.62 };
}

// ---------- trucks: pickup, dump truck, box truck ----------
function cab(g, c, x0) { // front cab shared by all the trucks, nose to the right
  poly(g, [[x0, -26], [x0 + 4, -74], [x0 + 32, -86], [x0 + 56, -70], [198, -50], [198, -26]], c);
  poly(g, [[x0 + 12, -50], [x0 + 15, -72], [x0 + 32, -78], [x0 + 46, -68], [x0 + 56, -50]], GLASS, '#0b0b10', 2.5);
  rrect(g, 186, -42, 12, 8, 3, '#fff7b0'); rrect(g, 190, -32, 8, 8, 2, CHROME);
}
function pickup(o = {}) {
  return (g, c, a) => {
    const dark = shade(c, -0.3);
    rrect(g, 6, -30, 192, 12, 4, '#2a2a33', null);
    if (o.bed === 'dump') {
      poly(g, [[6, -66], [112, -86], [116, -34], [6, -34]], o.bedColor || dark);
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(112, -86); g.lineTo(116, -34); g.stroke();
      rrect(g, 100, -36, 22, 8, 2, '#2a2a33', null); // hinge
      if (o.bedFill) o.bedFill(g);
    } else {
      rrect(g, 6, -54, 110, 26, 3, c);
      rrect(g, 12, -50, 98, 14, 2, dark, null);
      if (o.bedFill) o.bedFill(g);
    }
    cab(g, c, 118);
    if (o.rust) for (const [x, y, r] of o.rust) ellipse(g, x, y, r, r * 0.6, '#8a4b24', null);
    wheel(g, 44, 20, a, { tread: true }); wheel(g, 152, 20, a, { tread: true });
    if (o.extra) o.extra(g, c, a);
    return { x: 154, y: -66, s: 0.6 };
  };
}
function boxTruck(g, c, a) { // Erik: a moving truck with a mural he installed himself
  rrect(g, 4, -112, 120, 86, 6, '#fffaf0');
  rrect(g, 4, -40, 120, 14, 0, '#e8742a', null);
  g.save(); g.beginPath(); g.roundRect(8, -108, 112, 64, 4); g.clip();
  // the public art: a sun, hills and a big flower
  ellipse(g, 38, -84, 14, 14, '#ffc93c', null);
  g.fillStyle = '#2e9aa0'; g.beginPath(); g.moveTo(8, -44); g.quadraticCurveTo(40, -86, 76, -44); g.fill();
  g.fillStyle = '#6fb552'; g.beginPath(); g.moveTo(50, -44); g.quadraticCurveTo(92, -96, 124, -44); g.fill();
  for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2; ellipse(g, 96 + Math.cos(an) * 8, -78 + Math.sin(an) * 8, 5, 5, '#e5483a', null); }
  ellipse(g, 96, -78, 5, 5, '#ffc93c', null);
  g.restore();
  rrect(g, 4, -112, 120, 86, 6, null);
  cab(g, c, 128);
  wheel(g, 44, 20, a, { tread: true }); wheel(g, 152, 20, a, { tread: true });
  return { x: 162, y: -66, s: 0.58 };
}

// ---------- vans and buses ----------
function mystery(g, c, a) { // Lucas: the Mystery Machine, with Pikachu ears on the roof
  // Pikachu ears (behind the roof)
  for (const [x, dir] of [[52, -1], [96, 1]]) {
    poly(g, [[x, -92], [x + dir * 10 - 5, -122], [x + 16, -92]], '#ffd21f');
    poly(g, [[x + dir * 7 - 1, -113], [x + dir * 10 - 5, -122], [x + dir * 10 + 5, -109]], INK, null, 0);
  }
  rrect(g, 6, -98, 188, 76, [30, 40, 8, 8], c);
  g.save(); g.beginPath(); g.roundRect(6, -98, 188, 76, [30, 40, 8, 8]); g.clip();
  g.fillStyle = '#e8742a'; g.fillRect(0, -48, 210, 8);   // orange stripe
  g.fillStyle = '#2a5db0'; g.fillRect(0, -40, 210, 10);  // blue stripe
  g.restore();
  rrect(g, 6, -98, 188, 76, [30, 40, 8, 8], null);
  for (const [x, y, col] of [[30, -58, '#ff7ab8'], [60, -54, '#ffc93c'], [90, -58, '#ff7ab8'], [120, -54, '#ffc93c']]) { // flower power
    for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2; ellipse(g, x + Math.cos(an) * 5, y + Math.sin(an) * 5, 3.5, 3.5, col, null); }
    ellipse(g, x, y, 3, 3, '#fff', null);
  }
  poly(g, [[16, -90], [16, -64], [60, -64], [60, -90]], GLASS, '#0b0b10', 2.5);
  poly(g, [[70, -90], [70, -64], [118, -64], [118, -90]], GLASS, '#0b0b10', 2.5);
  poly(g, [[150, -90], [172, -88], [186, -64], [150, -64]], GLASS, '#0b0b10', 2.5);
  rrect(g, 184, -50, 12, 8, 3, '#fff7b0');
  emo(g, '⚡', 140, -34, 20);
  wheel(g, 48, 19, a); wheel(g, 150, 19, a);
  return { x: 40, y: -77, s: 0.55 };
}
function bus(g, c, a) { // Pato: long yellow bus with a camera on the side
  rrect(g, 2, -102, 196, 80, 10, c);
  g.fillStyle = '#1b1b24'; g.fillRect(4, -50, 192, 6);
  for (let k = 0; k < 6; k++) poly(g, [[12 + k * 24, -96], [12 + k * 24, -66], [32 + k * 24, -66], [32 + k * 24, -96]], GLASS, '#0b0b10', 2.5);
  poly(g, [[158, -96], [158, -66], [188, -66], [194, -80], [186, -96]], GLASS, '#0b0b10', 2.5);
  rrect(g, 188, -46, 10, 8, 3, '#fff7b0');
  ellipse(g, 100, -34, 11, 11, '#23232b'); ellipse(g, 100, -34, 6, 6, '#6b7f9a', null); ellipse(g, 98, -36, 2, 2, '#fff', null); // camera lens
  wheel(g, 44, 19, a, { tread: true }); wheel(g, 150, 19, a, { tread: true });
  return { x: 100, y: -81, s: 0.62 };
}

// ---------- Kristin's limo: long, low, dark purple, with a moon roof ----------
function limo(g, c, a) {
  const hi = shade(c, 0.4);
  poly(g, [[2, -20], [2, -48], [16, -62], [40, -70], [136, -70], [158, -58], [198, -46], [198, -20]], c);
  for (let k = 0; k < 4; k++) poly(g, [[22 + k * 28, -50], [26 + k * 28, -66], [46 + k * 28, -66], [46 + k * 28, -50]], '#14122a', '#0b0b10', 2.5);
  poly(g, [[134, -50], [136, -66], [148, -64], [158, -50]], GLASS, '#0b0b10', 2.5);
  g.strokeStyle = '#ffc93c'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, -44); g.lineTo(190, -42); g.stroke(); // gold pinstripe
  rrect(g, 60, -36, 10, 3, 1.5, hi, null); rrect(g, 120, -36, 10, 3, 1.5, hi, null);
  rrect(g, 0, -26, 200, 6, 3, shade(c, -0.4), null);
  rrect(g, 186, -38, 12, 7, 3, '#fff7b0'); rrect(g, 2, -40, 6, 11, 2, '#ff4a4a');
  // a little flag on the fender
  g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(176, -50); g.lineTo(176, -76); g.stroke();
  poly(g, [[176, -76], [194, -70], [176, -64]], '#2e9aa0', INK, 2);
  wheel(g, 34, 16, a, { rim: '#ffc93c' }); wheel(g, 96, 16, a, { rim: '#ffc93c' }); wheel(g, 160, 16, a, { rim: '#ffc93c' });
  emo(g, '🥦', 164, -34, 16);
  return { x: 38, y: -60, s: 0.62 };
}

// ---------- Greg's orange Segway, with a kayak strapped on behind ----------
function segway(g, c, a) {
  const dark = shade(c, -0.3);
  // kayak
  g.save(); g.translate(6, -86); g.rotate(-0.18);
  g.beginPath(); g.moveTo(-4, 0); g.quadraticCurveTo(40, -18, 100, 0); g.quadraticCurveTo(40, 14, -4, 0); g.closePath();
  g.fillStyle = '#ffc93c'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -22); g.lineTo(88, 18); g.stroke(); // paddle
  rrect(g, 4, -30, 14, 10, 3, '#2e9aa0'); rrect(g, 80, 12, 14, 10, 3, '#2e9aa0');
  g.restore();
  // rider's torso (the face is drawn on top by the engine)
  rrect(g, 76, -104, 40, 56, 16, c);
  rrect(g, 80, -66, 32, 10, 4, dark, null);
  // platform + stem + handlebar
  rrect(g, 56, -40, 90, 12, 6, '#2a2a33');
  g.strokeStyle = '#2a2a33'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(138, -34); g.lineTo(150, -108); g.stroke();
  rrect(g, 142, -118, 30, 9, 4, '#2a2a33');
  rrect(g, 100, -60, 44, 7, 3, shade(c, 0.2), null);
  wheel(g, 100, 26, a, { rim: c });
  return { x: 96, y: -118, s: 0.72 };
}

// ---------- the cats: the Wally Cup tabby (Chuck) with per-cat coats ----------
function cat(o) {
  return (g, c, a) => {
    const dark = o.stripe, light = o.belly || '#fbfaf5';
    const swish = Math.sin(a * 1.1) * 0.25;
    const open = (Math.sin(a * 2.2) + 1) / 2;
    // tail
    g.save(); g.translate(14, -46); g.rotate(-0.15 + swish);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-26, -20, -14, -52); g.quadraticCurveTo(-8, -66, 4, -60); g.quadraticCurveTo(-4, -54, -2, -40); g.quadraticCurveTo(2, -18, 12, -4); g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    if (dark) { g.save(); g.clip(); g.fillStyle = dark; g.fillRect(-30, -70, 40, 22); g.restore(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
    g.restore();
    // torso
    g.beginPath();
    g.moveTo(12, -22); g.quadraticCurveTo(6, -62, 40, -66); g.lineTo(120, -66);
    g.quadraticCurveTo(146, -66, 148, -44); g.lineTo(148, -22); g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    if (o.patches) { // white-and-gray coat: big gray patches
      g.save(); g.clip(); ellipse(g, 52, -56, 24, 16, o.patches, null); ellipse(g, 112, -50, 20, 14, o.patches, null); g.restore();
    }
    if (dark) { g.strokeStyle = dark; g.lineWidth = 5; g.lineCap = 'round'; for (const x of [34, 52, 70, 88, 106]) { g.beginPath(); g.moveTo(x, -64); g.quadraticCurveTo(x + 3, -54, x - 1, -42); g.stroke(); } }
    g.beginPath(); g.moveTo(22, -22); g.quadraticCurveTo(70, -36, 134, -22); g.closePath(); g.fillStyle = light; g.fill();
    g.beginPath(); g.moveTo(118, -24); g.quadraticCurveTo(136, -44, 148, -48); g.lineTo(148, -22); g.closePath(); g.fillStyle = o.chest || light; g.fill();
    // head + ears
    ellipse(g, 152, -68, 28, 26, c);
    poly(g, [[132, -86], [134, -112], [152, -92]], c); poly(g, [[158, -92], [172, -112], [178, -84]], c);
    poly(g, [[135, -90], [136, -105], [147, -92]], '#ff9bb0', null); poly(g, [[163, -92], [171, -105], [174, -88]], '#ff9bb0', null);
    if (o.patches) ellipse(g, 144, -78, 12, 9, o.patches, null);
    if (dark) { g.strokeStyle = dark; g.lineWidth = 3.5; g.lineCap = 'round'; for (const dx of [-5, 3, 11]) { g.beginPath(); g.moveTo(152 + dx, -92); g.lineTo(152 + dx + 1, -83); g.stroke(); } }
    ellipse(g, 176, -58, 15, 12, light);
    ellipse(g, 188, -64, 4, 3, '#ff7b9c', INK, 1.5);
    g.beginPath(); g.ellipse(182, -50, 7, 2 + open * 8, 0, 0, Math.PI * 2); g.fillStyle = '#5b1020'; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
    if (open > 0.4) ellipse(g, 182, -46 + open * 2, 4, 2.6, '#ff7b9c', null);
    g.strokeStyle = INK; g.lineWidth = 1.6;
    for (const dy of [-4, 2]) { g.beginPath(); g.moveTo(188, -58 + dy * 0.5); g.lineTo(214, -62 + dy * 2.6); g.stroke(); }
    // eye + brow
    ellipse(g, 168, -74, 6, 5, o.eye || '#b8f06a');
    g.fillStyle = INK; g.beginPath(); g.ellipse(169.5, -74, 1.5, 4.4, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath();
    if (o.mischief) { g.moveTo(160, -83); g.lineTo(176, -76); } else { g.moveTo(160, -80); g.lineTo(176, -77); }
    g.stroke();
    if (o.mischief) { // sly grin, one tiny fang
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(170, -50); g.quadraticCurveTo(178, -44, 186, -52); g.stroke();
      poly(g, [[175, -47], [178, -41], [181, -47]], '#fff', INK, 1);
    }
    // collar + roundel with the cat's initial
    g.strokeStyle = o.collar; g.lineWidth = 7; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(130, -76); g.quadraticCurveTo(140, -48, 136, -24); g.stroke();
    ellipse(g, 139, -38, 7, 7, '#ffc93c', INK, 2);
    g.beginPath(); g.moveTo(52, -66); g.quadraticCurveTo(58, -88, 84, -88); g.quadraticCurveTo(110, -88, 114, -66); g.closePath();
    g.fillStyle = GLASS; g.fill(); g.lineWidth = 2.5; g.strokeStyle = INK; g.stroke();
    ellipse(g, 86, -40, 13, 13, o.collar);
    g.fillStyle = '#fff'; g.font = '700 18px "Alfa Slab One", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.letter, 86, -39);
    wheel(g, 52, 17, a, { rim: '#ffc93c' }); wheel(g, 142, 17, a, { rim: '#ffc93c' });
    return { x: 84, y: -77, s: 0.78 };
  };
}

// Munija: tiny, red-eyed, spiked collar, a lot of teeth.
const fierce = (g, c, a, d) => {
  ellipse(g, 168, -76, 5.5, 5.5, '#e5231a'); ellipse(g, 169.5, -76, 2, 2, '#1b1b24', null);
  g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(158, -86); g.lineTo(178, -78); g.stroke();
  for (const x of [178, 184, 190]) poly(g, [[x - 2.5, -46], [x, -38], [x + 2.5, -46]], '#fff', INK, 1.2);
  g.strokeStyle = '#2a2a33'; g.lineWidth = 7; g.lineCap = 'butt'; g.beginPath(); g.moveTo(129, -74); g.quadraticCurveTo(138, -44, 134, -22); g.stroke();
  for (const [x, y] of [[131, -66], [136, -54], [136, -42], [134, -30]]) poly(g, [[x - 3, y + 3], [x + 6, y - 6], [x + 3, y + 4]], '#cfd3da', INK, 1.5);
};

// ---------- the roster's drawers ----------
export const DRAW_CARLSON = {
  // Beckers
  devin: plus(DRAW.kristin, (g) => { // hot pink Subaru wagon, Connect 4 stickers
    for (const [x, col] of [[64, '#e5231a'], [78, '#ffd21f'], [92, '#e5231a'], [106, '#ffd21f']]) ellipse(g, x, -33, 5.5, 5.5, col, INK, 1.5);
  }),
  kristin: limo,
  agnes: plus(DRAW.agnes, (g) => emo(g, '💰', 98, -86, 22)),
  wallace: plus(DRAW.wallace, (g) => { // braces on the nose
    rrect(g, 172, -14, 26, 7, 3, '#cfd3da', INK, 2);
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(174, -10.5); g.lineTo(196, -10.5); g.stroke();
    for (const x of [177, 184, 191]) rrect(g, x, -13, 4, 5, 1, '#fff', INK, 1);
  }),
  rufus: DRAW.rufus,
  // Carlsons
  rosemary: plus(jeep, (g) => { emo(g, '🧶', 6, -44, 18); emo(g, '🧵', 70, -34, 16); }),
  andrew: compact('mini', { extra: (g) => { label(g, 'BOSS', 112, -36, 15, '#fff'); emo(g, '👑', 92, -90, 20); } }),
  claudette: compact('audi', { rim: '#fff', extra: (g, c, a) => {
    const s = (k, x, y, r) => sparkle4(g, x, y, r * (0.5 + 0.5 * Math.abs(Math.sin(a * 0.7 + k))), '#fff');
    s(0, 40, -34, 9); s(1.7, 120, -66, 8); s(3.1, 164, -38, 7); s(4.4, 76, -64, 6);
    emo(g, '🐈', 112, -34, 17);
  } }),
  max: plus((g, c, a) => sports(g, c, a, { stripes: true }), (g) => emo(g, '🥩', 118, -34, 18)),
  lucas: mystery,
  natalie: plus((g, c, a) => sports(g, c, a, { convertible: true }), (g) => { emo(g, '🎖️', 106, -30, 16); emo(g, '🪡', 150, -58, 15); }),
  erik: boxTruck,
  erica: pickup({ rust: [[60, -42, 8], [92, -36, 6], [150, -42, 7]], bedFill: (g) => { // a bed of poetry and cattails
    for (const x of [24, 40, 56]) { g.strokeStyle = '#6b7f3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, -50); g.lineTo(x + 4, -84); g.stroke(); rrect(g, x + 1, -90, 6, 14, 3, '#6b4423', INK, 1.5); }
    emo(g, '✒️', 86, -56, 16);
  } }),
  ilsa: plus(DRAW.kim, (g) => { emo(g, '🌸', 100, -34, 18); sparkle4(g, 60, -50, 7, '#fff'); }),
  nico:   cat({ stripe: '#4a4d57', collar: '#2e6fb0', letter: 'N' }),
  nordic: cat({ stripe: null, patches: '#9aa0aa', collar: '#e5483a', letter: 'N', eye: '#8fd3ff' }),
  seth: pickup({ bed: 'dump', bedColor: '#8a5a2e', extra: (g) => { label(g, 'NEWS', 62, -44, 14, '#fffaf0'); emo(g, '📰', 30, -56, 16); } }),
  lucy:   cat({ stripe: '#b4631a', belly: '#fff2e0', collar: '#2e9aa0', letter: 'L', eye: '#f2c230' }),
  iggy:   cat({ stripe: '#5b606b', chest: '#ffffff', collar: '#6fb552', letter: 'I' }),
  lonija: cat({ stripe: '#4a4d57', collar: '#ff4fa8', letter: 'L', mischief: true, eye: '#ffd21f' }),
  // Altmans
  marian: compact('prius', { extra: (g) => { // needlepoint pillow on the roof
    rrect(g, 58, -102, 50, 20, 7, '#e5483a');
    g.strokeStyle = '#ffd21f'; g.lineWidth = 2; for (let x = 66; x < 104; x += 8) { g.beginPath(); g.moveTo(x, -98); g.lineTo(x + 4, -86); g.stroke(); }
    g.fillStyle = '#fff'; for (const x of [70, 83, 96]) { g.beginPath(); g.arc(x, -92, 2, 0, 7); g.fill(); }
  } }),
  mark: plus(DRAW.devin, (g) => emo(g, '🦴', 96, -48, 20)),
  brian: plus(DRAW.ro, (g) => emo(g, '⛵', 100, -94, 22)),
  greg: segway,
  deborah: pickup({ bedFill: (g) => { // a surfboard sticking up out of the bed
    g.save(); g.translate(60, -52); g.rotate(-0.12);
    g.beginPath(); g.ellipse(0, -30, 11, 38, 0, 0, Math.PI * 2); g.fillStyle = '#fffaf0'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = '#2e9aa0'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -64); g.lineTo(0, 4); g.stroke();
    g.restore();
  } }),
  matilda: compact('volvo', { extra: (g) => { // Swedish flag on the door
    rrect(g, 98, -44, 30, 20, 2, '#1f5fb0', INK, 2);
    g.fillStyle = '#ffd21f'; g.fillRect(106, -44, 6, 20); g.fillRect(98, -36, 30, 6);
  } }),
  rio: DRAW.rufus,
  munija: scaled(DRAW.rufus, 0.8, fierce),
  pato: bus,
  cynthia: compact('volvo', { extra: (g) => { // a little sail and a lifebuoy
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(96, -80); g.lineTo(96, -128); g.stroke();
    poly(g, [[98, -126], [98, -86], [142, -86]], '#fffaf0', INK, 3);
    poly(g, [[94, -120], [94, -88], [60, -88]], '#e8eef8', INK, 3);
    ellipse(g, 110, -36, 11, 11, '#e5483a'); ellipse(g, 110, -36, 5, 5, '#fffaf0', INK, 2);
  } }),
  lily: compact('mini', { extra: (g) => { // two giant crochet needles and a ball of yarn
    for (const [x, rot] of [[60, -0.5], [88, 0.4]]) {
      g.save(); g.translate(x, -82); g.rotate(rot);
      rrect(g, -3, -62, 6, 62, 3, '#d9a441', INK, 2.5); ellipse(g, 0, -62, 6, 5, '#d9a441', INK, 2.5);
      g.restore();
    }
    ellipse(g, 120, -92, 13, 13, '#ff7ab8'); g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(120, -92, 8, 0.3, 2.4); g.stroke(); g.beginPath(); g.arc(120, -92, 5, 3.5, 5.6); g.stroke();
  } }),
};
