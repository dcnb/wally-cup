import { CARS, RACE_TRACKS } from './data.js';
import { drawCar } from './cars.js';
import { drawPreview } from './tracks.js';
import { startHome } from './home.js';
import { startRace } from './race.js';
import { showResults } from './results.js';
import { sfx } from './sound.js';
import { announcer, LINES } from './announcer.js';
import { initTournament } from './tournament.js';

const $ = (id) => document.getElementById(id);
const state = { track: null, picks: [] };
let homeScene = null, raceRun = null, resultRun = null;

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
  if (homeScene) { homeScene.stop(); homeScene = null; }
  if (raceRun) { raceRun.stop(); raceRun = null; }
  if (resultRun) { resultRun.stop(); resultRun = null; }
  if (id === 'home') homeScene = startHome($('homeCanvas'));
}

document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));
$('startBtn').addEventListener('click', () => { sfx.unlock(); sfx.click(); show('tracks'); });
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
$('micBtn').addEventListener('click', () => {
  announcer.setEnabled(!announcer.enabled);
  $('micBtn').style.opacity = announcer.enabled ? 1 : 0.45;
  $('micBtn').title = announcer.enabled ? 'Announcer on' : 'Announcer off';
});
if (!announcer.supported) $('micBtn').hidden = true;
$('muteBtn').addEventListener('click', () => {
  sfx.setMuted(!sfx.muted);
  $('muteBtn').textContent = sfx.muted ? '🔇' : '🔊';
  if (!sfx.muted) sfx.click();
});

// ---------- tracks ----------
function buildTracks() {
  const wrap = $('trackCards');
  wrap.innerHTML = '';
  for (const tr of RACE_TRACKS) {
    const btn = document.createElement('button');
    btn.className = 'track-card';
    btn.innerHTML = `<canvas width="640" height="360"></canvas>
      <div class="body"><h3>${tr.name}</h3>
      <div class="tags">${tr.tags.map((x) => `<span class="tag">${x}</span>`).join('')}</div>
      <p>${tr.blurb}</p><p class="hint">💡 ${tr.hint}</p></div>`;
    drawPreview(btn.querySelector('canvas').getContext('2d'), tr, 640, 360, 1);
    btn.addEventListener('click', () => { sfx.click(); state.track = tr; state.picks = []; buildRacers(); show('racers'); });
    wrap.appendChild(btn);
  }
}

// ---------- racers ----------
function buildRacers() {
  $('trackChip').textContent = `Track: ${state.track.name}`;
  const grid = $('racerGrid');
  grid.innerHTML = '';
  for (const car of CARS) {
    const b = document.createElement('button');
    b.className = 'racer';
    b.dataset.id = car.id;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="badge"></span><canvas width="440" height="260"></canvas>
      <div class="nm">${car.name}</div><div class="ty">${car.type}</div><div class="quip">“${car.quip}”</div>
      <div class="mystery" title="Find out on the track!"><span>?</span><span>?</span><span>?</span></div>`;
    b._canvas = b.querySelector('canvas');
    paintRacer(b, car, 0, 'happy');
    b.addEventListener('click', () => togglePick(car, b));
    grid.appendChild(b);
  }
  refreshPicks();
}

function paintRacer(b, car, t, mood) {
  const g = b._canvas.getContext('2d');
  g.clearRect(0, 0, 440, 260);
  drawCar(g, car, 220, 200, 340, { t, wheel: t * 6, mood, bob: mood === 'race' ? Math.abs(Math.sin(t * 30)) * 2 : 0 });
}

function togglePick(car, el) {
  const i = state.picks.indexOf(car.id);
  if (i >= 0) { state.picks.splice(i, 1); sfx.unpick(); }
  else if (state.picks.length >= 4) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    sfx.nope();
    toast('4 racers is the max — tap a car to take it out first!');
    return;
  } else { state.picks.push(car.id); sfx.pick(); sfx.honk(CARS.indexOf(car)); }
  refreshPicks();
}

let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200);
}

function refreshPicks() {
  document.querySelectorAll('.racer').forEach((b) => {
    const i = state.picks.indexOf(b.dataset.id);
    b.classList.toggle('selected', i >= 0);
    b.setAttribute('aria-pressed', i >= 0);
    b.querySelector('.badge').textContent = i + 1;
  });
  const n = state.picks.length;
  $('pickCount').textContent = `${n} of 4 picked`;
  const btn = $('raceBtn');
  btn.disabled = n < 2;
  btn.textContent = n < 2 ? 'Pick at least 2 cars' : `🏁 RACE ${n} CARS!`;
}

// Rev up the selected cars on the racer screen.
let rafSel = 0;
function selLoop(now) {
  if ($('racers').classList.contains('active')) {
    const t = now / 1000;
    document.querySelectorAll('.racer.selected').forEach((b) => paintRacer(b, CARS.find((c) => c.id === b.dataset.id), t, 'race'));
    document.querySelectorAll('.racer:not(.selected)').forEach((b) => { if (b._dirty) { paintRacer(b, CARS.find((c) => c.id === b.dataset.id), 0, 'happy'); b._dirty = false; } });
    document.querySelectorAll('.racer.selected').forEach((b) => (b._dirty = true));
  }
  rafSel = requestAnimationFrame(selLoop);
}
rafSel = requestAnimationFrame(selLoop);

// ---------- race ----------
function runRace() {
  const cars = state.picks.map((id) => CARS.find((c) => c.id === id));
  show('race');
  $('raceTitle').textContent = state.track.name;
  raceRun = startRace({
    cars, track: state.track, canvas: $('raceCanvas'), bubble: $('bubble'), ticker: $('ticker'), skipBtn: $('skipIntro'),
    onDone: (res) => { raceRun = null; show('results'); sfx.fanfare(); setTimeout(() => { sfx.sadTrombone(); const l = res.standings[res.standings.length - 1]; if (res.standings.length > 1) announcer.say(LINES.loser(l.name), 2); }, 2600); resultRun = showResults({ canvas: $('resultCanvas'), ...res }); },
  });
}

$('raceBtn').addEventListener('click', () => { sfx.click(); runRace(); });
$('againBtn').addEventListener('click', runRace);
$('newCarsBtn').addEventListener('click', () => { state.picks = []; buildRacers(); show('racers'); });
$('newTrackBtn').addEventListener('click', () => show('tracks'));
$('homeBtn').addEventListener('click', () => show('home'));
const tour = initTournament({ show, setRaceRun: (r) => { raceRun = r; }, setResultRun: (r) => { if (resultRun) resultRun.stop(); resultRun = r; } });
$('quitRace').addEventListener('click', () => { if (!tour.handleQuit()) show('racers'); });

buildTracks();
show('home');
