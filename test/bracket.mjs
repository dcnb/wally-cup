// Headless bracket checks: node test/bracket.mjs
import { CARS, FINAL_TRACK, RACE_TRACKS } from '../js/data.js';
import { buildBracket, isReady, nextReady, recordResult, toCSV, allMatches } from '../js/bracket.js';
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
  const seen = new Set(t.rounds[0].flatMap((m) => [m.a, m.b]).filter(Boolean));
  ok(seen.size === n, `${n}: everyone placed once`);
  // play it out with random results, in random order
  let guard = 0;
  while (!t.champion && guard++ < 100) {
    const ready = ms.filter(isReady);
    ok(ready.length > 0, `${n}: something playable`);
    const m = ready[Math.floor(rng() * ready.length)];
    recordResult(t, m.id, rng() < 0.5 ? m.a : m.b, [m.a, m.b]);
  }
  ok(!!t.champion && ids.includes(t.champion), `${n}: champion crowned`);
  ok(nextReady(t) === null, `${n}: nothing left`);
  const csv = toCSV(t);
  ok(csv.split('\n').length >= ms.length + 2, `${n}: csv rows`);
  ok(JSON.parse(JSON.stringify(t)).champion === t.champion, `${n}: json round trip`);
}
console.log(failed ? 'FAILED' : 'bracket tests ok');
process.exit(failed ? 1 : 0);
