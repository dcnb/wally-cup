// The race screen: draws the simulation, runs the countdown, narrates the action.
import { createRace, step, standings, zoneAt, CONFIG } from './sim.js';
import { drawCar } from './cars.js';
import { sfx, music } from './sound.js';
import { announcer, LINES } from './announcer.js';
import { factFor, theme } from './theme.js';
import { createLinger } from './linger.js';
import { drawSky, drawLaneGround, drawLaneScenery, drawForeground, drawZone, drawZoneGate, drawRamp, drawZoneBanner, drawTint, drawAmbient } from './tracks.js';

const TAU = Math.PI * 2;
const fit = (s) => (s - 1) / 4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (n) => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

export function startRace({ cars, track, canvas, bubble, ticker, skipBtn, onDone, cfg = null, intro = null }) {
  const g = canvas.getContext('2d');
  const n = cars.length;

  // ---- layout: the canvas fills the window width; height follows the space left on screen ----
  const W = 1280;
  let H = 720, SKY_H = 144, laneH = 100, carW = 200, startX = 0, finishX = 0, finishLineX = 0;
  function layout() {
    const availW = Math.max(320, window.innerWidth);
    const availH = Math.max(320, window.innerHeight - 170);
    H = Math.round(clamp((W * availH) / availW, 440, 760));
    canvas.width = W; canvas.height = H;
    SKY_H = Math.round(H * 0.2);
    laneH = (H - SKY_H) / n;
    carW = Math.min(280, laneH * 1.3);
    startX = W * 0.1; finishX = W * 0.86;
    finishLineX = finishX + carW * 0.5;
  }
  layout();
  const onResize = () => layout();
  window.addEventListener('resize', onResize);
  const xOf = (p) => startX + p * (finishX - startX);

  const race = createRace(cars, track, Math.random, cfg);
  const vis = cars.map(() => ({ wheel: 0, rot: 0, smoke: [], sparkle: 0, shake: 0 }));
  const bannersSeen = new Set();

  let phase = 'ready'; // ready -> countdown -> racing -> done
  let phaseT = 0, lastCount = null;
  let scroll = 0, t = 0, last = performance.now(), raf = 0, stopped = false, finishing = 0;
  let introLane = -1, skipIntro = false;
  let shake = 0, flash = 0, slow = 1, commentT = 6, finalCalled = false;

  // One place that feeds the on-screen ticker AND the announcer, so they always match.
  const say = (html, cls = '', speech = null, prio = 2) => {
    ticker.innerHTML = `<span class="tick ${cls}">${html}</span>`;
    if (speech) announcer.say(speech, prio);
  };
  say('Cars at the starting line... get ready!');

  const nm = (lane) => `<b style="color:${cars[lane].color === '#26262b' ? '#9aa' : cars[lane].color}">${cars[lane].name}</b>`;
  const pn = (lane) => cars[lane].name;
  // Linger Cup only: the race can freeze while a family says goodbye (see js/linger.js).
  const lg = theme.linger ? createLinger({ cars, stage: canvas.parentElement, say }) : null;
  let lgWinnerDone = false;

  function showBubble(text, cls) {
    bubble.className = 'bubble ' + (cls || '');
    bubble.textContent = text;
    void bubble.offsetWidth; // restart animation
    bubble.classList.add('pop');
    bubble.hidden = false;
    if (cls === 'go') sfx.goBeep(); else sfx.countBeep();
  }

  function handle(ev) {
    if (race.winner && ev.type !== 'win') return; // once someone has won, stop narrating the stragglers
    switch (ev.type) {
      case 'spin':
        say(`💫 ${nm(ev.lane)} spins out${ev.zone ? ` in the ${ev.zone.name}` : ''}!`, 'bad', LINES.spin(pn(ev.lane), ev.zone?.name), 3);
        vis[ev.lane].shake = 1; shake = Math.max(shake, 7); sfx.spin(); break;
      case 'recover': say(`🔥 ${nm(ev.lane)} is back in the race!`, 'good', LINES.recover(pn(ev.lane)), 2); break;
      case 'lucky': vis[ev.lane].sparkle = 1.3; say(`🍀 ${nm(ev.lane)} catches a lucky break!`, 'good'); break;
      case 'lead': say(`🏁 ${nm(ev.lane)} takes the lead!`, 'lead', LINES.lead(pn(ev.lane)), 3); flash = 0.35; break;
      case 'zone':
        if (!bannersSeen.has(ev.zone.name)) { bannersSeen.add(ev.zone.name); say(`⚠️ ${ev.zone.name} ahead!`, 'zone', LINES.zone(ev.zone.name), 2); }
        break;
      case 'jump': say(`🚀 ${nm(ev.lane)} launches off the ramp!`, 'lead', LINES.jump(pn(ev.lane)), 2); sfx.jump(); break;
      case 'land': vis[ev.lane].sparkle = 0.8; shake = Math.max(shake, 3); sfx.land(); break;
      case 'crashland':
        say(`😵 ${nm(ev.lane)} lands badly and wobbles!`, 'bad', LINES.crashland(pn(ev.lane)), 3);
        vis[ev.lane].shake = 1; shake = Math.max(shake, 8); sfx.land(); break;
      case 'win':
        say(`🏆 ${nm(ev.lane)} crosses the finish line!`, 'lead', LINES.win(pn(ev.lane)), 3);
        shake = 10; flash = 0.6; sfx.finish(); music.stop(); break;
    }
  }

  // Pre-race: the announcer welcomes everyone and introduces each racer with a silly made-up fact.
  async function runIntro() {
    phase = 'intro';
    if (skipBtn) { skipBtn.hidden = false; skipBtn.onclick = () => { skipIntro = true; announcer.cancel(); }; }
    const steps = intro || [
      { lane: -1, html: `🎙️ Welcome to the ${theme.cupName} at ${track.name}!`, text: LINES.welcome(track.name) },
      ...cars.map((c, i) => {
        const fact = factFor(c);
        return { lane: i, html: `Lane ${i + 1}: ${nm(i)} — ${fact.replace(c.name, '').trim() || fact}`, text: `In lane ${i + 1} is ${c.name}. ${fact}` };
      }),
      { lane: -1, html: theme.readyHtml, text: LINES.ready() },
    ];
    for (const st of steps) {
      if (stopped || skipIntro) break;
      introLane = st.lane;
      ticker.innerHTML = `<span class="tick lead">${st.html}</span>`;
      if (st.lane >= 0) { vis[st.lane].sparkle = 1.4; sfx.honk(theme.CARS.findIndex((x) => x.id === cars[st.lane].id), cars[st.lane]); }
      await announcer.sayAsync(st.text);
      await new Promise((r) => setTimeout(r, 250));
    }
    introLane = -1;
    if (skipBtn) { skipBtn.hidden = true; skipBtn.onclick = null; }
    if (!stopped) { phase = 'countdown'; phaseT = 0; }
  }

  function leaderProgress() { return Math.max(...race.cars.map((s) => s.pos)) / CONFIG.length; }

  function update(rawDt) {
    // photo-finish slow motion (visual only; the simulation itself is unchanged)
    let target = 1;
    if (phase === 'racing' && !race.winner) {
      const sorted = [...race.cars].sort((a, b) => b.pos - a.pos);
      const lp = sorted[0].pos / CONFIG.length;
      if (lp > 0.88 && n > 1 && (sorted[0].pos - sorted[1].pos) / CONFIG.length < 0.035) target = 0.55;
    }
    slow += (target - slow) * Math.min(1, rawDt * 4);
    const dt = rawDt * slow;

    t += dt; phaseT += dt;
    shake = Math.max(0, shake - rawDt * 22);
    flash = Math.max(0, flash - rawDt * 1.6);

    if (phase === 'ready' && phaseT > 0.8) { phase = 'intro'; runIntro(); }
    if (phase === 'countdown') {
      const c = 3 - Math.floor(phaseT / 0.95);
      if (c !== lastCount) {
        lastCount = c;
        if (c > 0) showBubble(String(c), 'num');
        else {
          showBubble('GO!', 'go'); phase = 'racing'; phaseT = 0;
          music.start(); say("And they're off!", 'lead', LINES.start(), 3); shake = 6;
        }
      }
    }
    if (phase === 'racing') {
      if (phaseT > 0.9) bubble.hidden = true;
      if (lg?.active) lg.update(rawDt);
      else {
      const sdt = Math.min(dt, 0.05);
      step(race, sdt);
      for (const ev of race.events) handle(ev);
      race.events.length = 0;
      const lp = leaderProgress();
      if (lg) { // a Carlson/Altman winner starts a Linger at the line; a surprise one can also strike mid-race
        if (race.winner && !lgWinnerDone) { lgWinnerDone = true; lg.onWinner(race.winner.car); }
        else if (!race.winner) { const fam = lg.midRace(lp); if (fam) lg.start(fam, 'mid'); }
      }
      music.setIntensity(lp);
      // camera follows the leader's speed
      const lead = Math.max(...race.cars.map((c) => c.v));
      const avg = race.cars.reduce((a, c) => a + c.v, 0) / n;
      scroll += (lead * 0.6 + avg * 0.4) * 13 * dt;
      // color commentary
      commentT -= dt;
      if (commentT <= 0 && !race.winner) {
        commentT = 6 + Math.random() * 2;
        const o = [...race.cars].sort((a, b) => b.pos - a.pos);
        if (!finalCalled && lp > 0.85) { finalCalled = true; say('🏁 Final stretch!', 'lead', LINES.final(), 3); }
        else if (n > 1) say(`🎙️ ${nm(o[0].lane)} leads, ${nm(o[1].lane)} close behind`, 'lead', LINES.commentary(pn(o[0].lane), pn(o[1].lane)), 1);
      }
      if (!finalCalled && lp > 0.86) { finalCalled = true; say('🏁 Final stretch!', 'lead', LINES.final(), 2); }
      if (race.over) { phase = 'done'; phaseT = 0; }
      }
    } else if (phase === 'done') {
      finishing += dt;
      scroll += 40 * dt;
      if (finishing > 0.2 && !stopped) { stopped = true; finish(); }
    }
    // per-car visuals
    race.cars.forEach((s, i) => {
      const v = vis[i];
      v.wheel += (lg?.active ? 5 : phase === 'racing' || phase === 'done' ? s.v : phase === 'countdown' ? 25 + Math.sin(t * 40) * 6 : 6) * dt * 0.5;
      if (s.spinT > 0) v.rot += dt * 14;
      else { const tg = Math.round(v.rot / TAU) * TAU; v.rot += (tg - v.rot) * Math.min(1, dt * 10); }
      v.sparkle = Math.max(0, v.sparkle - dt);
      v.shake = Math.max(0, v.shake - dt * 2);
      // exhaust / dust trail while racing; fire when boosting; smoke when spinning
      const trail = phase === 'racing' && !lg?.active && !s.finished && s.spinT <= 0 && Math.random() < dt * 14;
      if (trail || ((s.spinT > 0 || s.boostT > 0.3) && Math.random() < dt * 30)) {
        v.smoke.push({ x: 0, y: 0, r: trail ? 4 + Math.random() * 4 : 8 + Math.random() * 8, a: trail ? 0.5 : 0.8, fire: s.spinT <= 0 && s.boostT > 0.3 });
      }
      v.smoke.forEach((p) => { p.x -= dt * 140; p.y -= dt * 30; p.r += dt * 18; p.a -= dt * 1.6; });
      v.smoke = v.smoke.filter((p) => p.a > 0);
    });
  }

  function cleanup() {
    window.removeEventListener('resize', onResize);
    if (skipBtn) { skipBtn.hidden = true; skipBtn.onclick = null; }
    music.stop(); announcer.cancel(); lg?.destroy();
  }

  function finish() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    music.stop(); lg?.destroy();
    onDone({ standings: standings(race).map((s) => s.car), winner: race.winner.car, track });
  }

  function draw() {
    g.save();
    if (shake > 0.4) {
      g.translate(W / 2, H / 2); g.scale(1.025, 1.025);
      g.translate(-W / 2 + (Math.random() - 0.5) * shake, -H / 2 + (Math.random() - 0.5) * shake);
    }
    g.clearRect(0, 0, W, H);
    drawSky(g, track, W, H, SKY_H, scroll, t);
    const order = standings(race);

    for (let i = 0; i < n; i++) {
      const laneY = SKY_H + i * laneH;
      const ls = scroll * (0.85 + 0.12 * i); // each lane slides at its own speed
      g.save();
      g.beginPath(); g.rect(0, laneY - (i === 0 ? 0 : 60), W, laneH + (i === 0 ? 0 : 60)); g.clip();
      drawLaneGround(g, track, 0, laneY + laneH * 0.28, W, laneH * 0.72, ls, t, i);
      g.restore();
      g.save();
      g.beginPath(); g.rect(0, laneY - 70, W, laneH + 70); g.clip();
      drawLaneScenery(g, track, 0, laneY, W, laneH, ls, t, i);
      g.restore();

      for (const z of track.zones) {
        drawZone(g, z, xOf(z.from), xOf(z.to), laneY + laneH * 0.5, laneH * 0.5, t, i);
        drawZoneGate(g, z, xOf(z.from) - carW * 0.38, laneY + laneH * 0.5, laneH * 0.5);
      }
      for (const jp of track.jumps || []) drawRamp(g, xOf(jp), laneY + laneH * 0.72 + 2, laneH, track);

      const sl = startX - carW * 0.55;
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(sl, laneY + laneH * 0.3, 6, laneH * 0.7);
      drawCheckers(g, finishLineX, laneY + laneH * 0.26, 22, laneH * 0.74);

      const s = race.cars[i];
      const v = vis[i];
      const base = laneY + laneH * 0.72;
      const cx = xOf(s.pos / CONFIG.length);
      let bob = Math.sin(t * (phase === 'racing' ? 22 : 38) + i) * (phase === 'ready' ? 0.4 : phase === 'countdown' ? 1.8 : 1.6);
      const z = zoneAt(track, s.pos / CONFIG.length);
      if (z && (z.kind === 'rocks' || z.kind === 'mud' || z.kind === 'sand') && s.spinT <= 0) {
        bob += Math.abs(Math.sin(t * 16 + i * 2)) * laneH * 0.07 * (1 - fit(s.car[z.stat]));
      }
      if (v.shake > 0) bob += Math.sin(t * 60) * 3 * v.shake;
      if (introLane === i) bob += Math.abs(Math.sin(t * 8)) * laneH * 0.08;
      let air = 0, lean = 0;
      if (s.jumpT > 0) {
        const k = 1 - s.jumpT / s.jumpDur;
        air = Math.sin(Math.PI * k) * laneH * (0.34 + 0.12 * fit(s.car.speed));
        lean = -0.28 * Math.cos(Math.PI * k);
        bob = 0;
      }
      const mood = introLane === i ? 'win' : s.spinT > 0 ? 'dizzy' : s.finished ? (s === race.winner ? 'win' : 'happy') : 'race';

      for (const p of v.smoke) {
        g.globalAlpha = Math.max(0, p.a);
        g.fillStyle = p.fire ? '#ffb02e' : track.id === 'rainbow' ? '#ffd6f6' : track.id === 'sea' ? '#d8f4ff' : track.id === 'desert' ? '#e8c890' : '#d8d2c0';
        g.beginPath(); g.arc(cx - carW * 0.45 + p.x, base - 10 + p.y, p.r, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
      if (introLane === i) { // spotlight on the racer being introduced
        const sg = g.createRadialGradient(cx, base - carW * 0.2, 10, cx, base - carW * 0.2, carW * 0.9);
        sg.addColorStop(0, 'rgba(255,240,170,0.65)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
        g.fillStyle = sg; g.fillRect(cx - carW, base - carW, carW * 2, carW * 1.3);
      }
      if (phase === 'racing' && !s.finished && s.v > 38 && s.spinT <= 0) {
        g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3; g.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const yy = base - 14 - k * laneH * 0.14, off = ((t * 700 + k * 90) % 120);
          g.beginPath(); g.moveTo(cx - carW * 0.5 - off, yy); g.lineTo(cx - carW * 0.5 - off - 36, yy); g.stroke();
        }
      }
      drawCar(g, s.car, cx, base, carW, { t, wheel: v.wheel, mood, rot: v.rot, bob: Math.max(0, bob) + air, lean });
      if (v.sparkle > 0) sparkles(g, cx, base - carW * 0.45, t, v.sparkle);
    }

    for (const z of track.zones) {
      const a = xOf(z.from), b = xOf(z.to);
      const active = race.cars.some((s) => s.pos / CONFIG.length >= z.from && s.pos / CONFIG.length < z.to);
      drawZoneBanner(g, z, a, b, SKY_H - 34, active);
    }

    drawForeground(g, track, W, H, scroll, t);
    if (phase === 'racing') screenStreaks(g, W, H, t, race.cars.reduce((a, c) => a + c.v, 0) / n);
    drawTint(g, track, W, H, leaderProgress());
    drawAmbient(g, track, W, H, scroll, t);
    drawHud();
    race.cars.forEach((s, i) => drawTag(s, i, order.indexOf(s)));
    if (lg?.active) race.cars.forEach((s, i) => drawChat(s, i));
    if (flash > 0) { g.fillStyle = `rgba(255,248,225,${flash})`; g.fillRect(0, 0, W, H); }
    g.restore();
  }

  function drawHud() {
    bunting(g, W, t);
    const y = 38, x0 = startX, x1 = finishX;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(x0 - 20, y - 14, x1 - x0 + 76, 28, 14); g.fill();
    g.fillStyle = '#fff'; g.font = '700 22px "Barlow Semi Condensed", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('🏁', x1 + 22, y + 1);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x0, y - 2, x1 - x0, 4);
    race.cars.forEach((s) => {
      const px = xOf(s.pos / CONFIG.length);
      g.fillStyle = s.car.color; g.strokeStyle = '#fff'; g.lineWidth = 3;
      g.beginPath(); g.arc(px, y, 9, 0, TAU); g.fill(); g.stroke();
    });
  }

  // Linger speech bubbles: everybody has something to say while the race is on hold.
  function drawChat(s, i) {
    const text = lg.bubbleFor(s.car, i);
    if (!text) return;
    const base = SKY_H + i * laneH + laneH * 0.72;
    const cx = clamp(xOf(s.pos / CONFIG.length), 90, W - 90);
    const y = base - Math.min(carW * 0.62, laneH * 0.9);
    g.save();
    g.font = '700 17px "Barlow Semi Condensed", sans-serif';
    const w = g.measureText(text).width + 22, h = 28;
    g.translate(cx, y);
    g.beginPath(); g.roundRect(-w / 2, -h, w, h, 9);
    g.fillStyle = '#fffaf0'; g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-7, -1); g.lineTo(0, 9); g.lineTo(7, -1); g.fillStyle = '#fffaf0'; g.fill();
    g.beginPath(); g.moveTo(-8, 0); g.lineTo(0, 9); g.lineTo(8, 0); g.stroke();
    g.fillRect(-6, -4, 12, 5);
    g.fillStyle = '#1b1b24'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, -h / 2 + 1);
    g.restore();
  }

  // Name plate hangs right under its car; the text is centered using real glyph metrics.
  function drawTag(s, i, place) {
    const laneY = SKY_H + i * laneH;
    const cx = xOf(s.pos / CONFIG.length);
    const top = laneY + laneH * 0.72 + 9;
    const PH = 24;
    const col = s.car.color === '#26262b' ? '#6b6f80' : s.car.color;
    const label = s.car.name.toUpperCase();
    g.font = '700 17px "Barlow Semi Condensed", sans-serif';
    const tw = Math.max(g.measureText(label).width + 52, 90);
    const m = g.measureText('H');
    const ty = PH / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2; // alphabetic baseline that centers caps
    g.save();
    g.translate(cx, top);
    g.fillStyle = col; g.strokeStyle = '#1b1b24'; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-8, 0); g.lineTo(0, -9); g.lineTo(8, 0); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-tw / 2, 0, tw, PH, 5); g.fillStyle = '#f6ecd6'; g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-tw / 2, 0, 28, PH, [5, 0, 0, 5]); g.fillStyle = col; g.fill(); g.stroke();
    g.fillStyle = isLight(col) ? '#1b1b24' : '#fff';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText(String(place + 1), -tw / 2 + 14, ty);
    g.fillStyle = '#1b1b24'; g.fillText(label, 14, ty);
    g.restore();
  }

  function loop(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame((now) => { last = now; loop(now); });

  return { stop() { stopped = true; cancelAnimationFrame(raf); bubble.hidden = true; cleanup(); }, race };
}

const isLight = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150; };

function drawCheckers(g, x, y, w, h) {
  const s = w / 2;
  for (let r = 0; r * s < h; r++) for (let c = 0; c < 2; c++) {
    g.fillStyle = (r + c) % 2 ? '#111' : '#fff';
    g.fillRect(x + c * s, y + r * s, s, Math.min(s, h - r * s));
  }
}

function sparkles(g, x, y, t, life) {
  g.save(); g.globalAlpha = Math.min(1, life);
  for (let k = 0; k < 5; k++) {
    const a = t * 3 + k * 1.26, r = 40 + Math.sin(t * 5 + k) * 8;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.6;
    g.fillStyle = k % 2 ? '#fff6a8' : '#7dffa8';
    g.save(); g.translate(px, py); g.rotate(t * 4 + k);
    g.fillRect(-2, -8, 4, 16); g.fillRect(-8, -2, 16, 4); g.restore();
  }
  g.restore();
}

// Long white streaks whipping across the whole screen when everyone is flying.
function screenStreaks(g, W, H, t, avg) {
  const k = clamp((avg - 34) / 6, 0, 1);
  if (k <= 0) return;
  g.save(); g.strokeStyle = `rgba(255,255,255,${0.22 * k})`; g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const y = H * (0.12 + hash(i) * 0.86), len = 120 + hash(i + 5) * 220;
    const x = W - (((t * (1500 + hash(i + 9) * 900)) + hash(i + 2) * W * 2) % (W + len * 2)) + len;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
  g.restore();
}

// Strings of paper flags across the top of the track.
function bunting(g, W, t) {
  const cols = ['#e5483a', '#f2c230', '#2e9aa0', '#f6ecd6'];
  const segs = Math.max(4, Math.round(W / 320));
  g.strokeStyle = '#1b1b24'; g.lineWidth = 2;
  for (let seg = 0; seg < segs; seg++) {
    const x0 = seg * (W / segs) - 4, x1 = (seg + 1) * (W / segs) + 4;
    const sag = (x) => 4 + Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 12;
    g.beginPath(); g.moveTo(x0, 4); for (let x = x0; x <= x1; x += 8) g.lineTo(x, sag(x)); g.stroke();
    for (let k = 0; k < 9; k++) {
      const x = x0 + 18 + k * ((x1 - x0 - 36) / 8), y = sag(x);
      const sw = Math.sin(t * 3 + k + seg) * 2;
      g.fillStyle = cols[(k + seg) % 4];
      g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x + 9, y); g.lineTo(x + sw, y + 20); g.closePath(); g.fill(); g.stroke();
    }
  }
}
