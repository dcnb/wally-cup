// Headless bracket checks: node test/bracket.mjs [tday]
import { setTheme, theme } from '../js/theme.js';
if (process.argv[2] === 'tday') setTheme((await import('../js/themes/tday.js')).tdayTheme);
if (process.argv[2] === 'carlson') setTheme((await import('../js/themes/carlson.js')).carlsonTheme);
const { CARS, TRACKS, FINAL_TRACK, RACE_TRACKS } = theme;
import { buildBracket, isReady, nextReady, recordResult, allMatches, validateTournament, racersOf } from '../js/bracket.js';
import { mulberry32 } from '../js/sim.js';

let failed = false;
const ok = (c, msg) => { if (!c) { failed = true; console.log('BAD', msg); } };

for (let n = 2; n <= CARS.length; n++) {
  const rng = mulberry32(n * 7);
  const ids = CARS.slice(0, n).map((c) => c.id);
  const t = buildBracket(ids, rng);
  const ms = allMatches(t);
  ok(t.rounds.at(-1).length === 1, `${n}: single final`);
  ok(t.rounds.at(-1)[0].track === FINAL_TRACK.id, `${n}: final on rainbow`);
  ok(ms.filter((m) => m !== t.rounds.at(-1)[0]).every((m) => m.track !== FINAL_TRACK.id && RACE_TRACKS.some((x) => x.id === m.track)), `${n}: normal tracks`);
  ok(t.rounds[0].every((m) => !(m.a === null && m.b === null)), `${n}: no double byes`);
  const seen = new Set(t.rounds[0].flatMap((m) => [m.a, m.b, m.c]).filter(Boolean));
  if (!t.threeWay) ok(seen.size === n, `${n}: everyone placed once`);
  else {
    const placed = [...t.rounds[0].flatMap(racersOf), ...t.rounds[1].flatMap((m) => [m.a, m.b]).filter((x) => x && !t.rounds[0].some((f) => racersOf(f).includes(x)))];
    ok(new Set(placed).size === n && placed.length === n, `${n}: everyone placed once (three-way)`);
    ok(t.rounds[0].every((m) => racersOf(m).length >= 2), `${n}: first-round races have 2-3 racers`);
    ok(t.rounds.slice(1).every((ms, i) => ms.length === 2 ** (t.rounds.length - 2 - i)), `${n}: later rounds are head-to-head`);
  }
  // play it out with random results, in random order
  let guard = 0;
  while (!t.champion && guard++ < 100) {
    const ready = ms.filter(isReady);
    ok(ready.length > 0, `${n}: something playable`);
    const m = ready[Math.floor(rng() * ready.length)];
    const rs = racersOf(m); recordResult(t, m.id, rs[Math.floor(rng() * rs.length)], rs);
  }
  ok(!!t.champion && ids.includes(t.champion), `${n}: champion crowned`);
  ok(nextReady(t) === null, `${n}: nothing left`);
  ok(JSON.parse(JSON.stringify(t)).champion === t.champion, `${n}: json round trip`);
}
// import validation
{
  const carIds = CARS.map((c) => c.id), trackIds = TRACKS.map((x) => x.id);
  const rng = mulberry32(99);
  const t = buildBracket(carIds, rng);
  const m0 = t.rounds[0].find(isReady);
  recordResult(t, m0.id, m0.a, racersOf(m0));
  const rt = validateTournament(JSON.parse(JSON.stringify(t)), carIds, trackIds);
  ok(JSON.stringify(rt) === JSON.stringify(t), 'import round trip keeps everything');
  const clone = () => JSON.parse(JSON.stringify(t));
  const rejects = (mut, label) => { const c = clone(); mut(c); try { validateTournament(c, carIds, trackIds); ok(false, 'should reject: ' + label); } catch { /* expected */ } };
  rejects((c) => { c.rounds[0][0].track = 'moon'; }, 'unknown track');
  rejects((c) => { c.rounds[0][0].a = 'nobody'; }, 'unknown racer');
  rejects((c) => { c.rounds[0].pop(); }, 'wrong match count');
  rejects((c) => { c.rounds[1][0].a = carIds[0]; c.rounds[1][0].b = carIds[1]; c.rounds[1][0].winner = carIds[0]; }, 'played before feeders');
  rejects((c) => { c.champion = carIds[0]; }, 'champion without final');
  rejects((c) => { delete c.rounds; }, 'no rounds');
  try { validateTournament('hi', carIds, trackIds); ok(false, 'string'); } catch { /* expected */ }
  try { validateTournament(null, carIds, trackIds); ok(false, 'null'); } catch { /* expected */ }
}
console.log(failed ? 'FAILED' : 'bracket tests ok');
process.exit(failed ? 1 : 0);
