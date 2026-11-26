// Pure tournament logic (no DOM) so it can run in the browser and in Node tests.
import { theme } from './theme.js';

const shuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Slot order for a power-of-two bracket so byes spread across different matches.
// e.g. 8 slots -> seed order 1,8,4,5,2,7,3,6. Seeds beyond the field size become byes.
function seedOrder(size) {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

// Three-way start (theme.threeWayStart): round 1 is a mix of 3-car (and a few 2-car) races that cuts the field
// down to a power of two; everyone else gets a bye. Then the normal head-to-head bracket takes over.
// Match shape is unchanged except round-1 matches may have a third car `c` and a `feeds` link to the next-round slot.
function buildThreeWay(carIds, rng) {
  const n = carIds.length;
  let T = 2; while (T * 2 < n) T *= 2;            // largest power of two below n
  const elim = n - T;                              // racers that must be knocked out in round 1
  const threes = Math.floor(elim / 2), twos = elim % 2;
  const shuffled = shuffle(carIds, rng);
  const t = { id: 't' + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36), createdAt: new Date().toISOString(), racers: [...carIds], rounds: [], champion: null, runnerUp: null, seq: 0, threeWay: true };
  const pickTrack = () => theme.RACE_TRACKS[Math.floor(rng() * theme.RACE_TRACKS.length)].id;
  const first = []; let k = 0;
  for (let i = 0; i < threes + twos; i++) {
    const size = i < threes ? 3 : 2;
    const grp = shuffled.slice(k, k + size); k += size;
    first.push({ id: `r0m${i}`, round: 0, index: i, a: grp[0], b: grp[1], ...(size === 3 ? { c: grp[2] } : {}), track: pickTrack(), winner: null, standings: null, playedAt: null, order: null, bye: false });
  }
  // entrants for the head-to-head bracket: each first-round race (winner pending) or a bye racer
  const entrants = shuffle([...first.map((m) => ({ m })), ...shuffled.slice(k).map((id) => ({ id }))], rng);
  const rounds = Math.log2(T);
  t.rounds.push(first);
  for (let r = 1; r <= rounds; r++) {
    const count = T / 2 ** r, isFinal = r === rounds, ms = [];
    for (let i = 0; i < count; i++) {
      ms.push({ id: `r${r}m${i}`, round: r, index: i, a: null, b: null, track: isFinal ? theme.FINAL_TRACK.id : pickTrack(), winner: null, standings: null, playedAt: null, order: null, bye: false });
    }
    t.rounds.push(ms);
  }
  entrants.forEach((e, i) => {
    const slot = t.rounds[1][Math.floor(i / 2)], key = i % 2 ? 'b' : 'a';
    if (e.m) e.m.feeds = { match: slot.id, slot: key }; else slot[key] = e.id;
  });
  return t;
}

export function buildBracket(carIds, rng = Math.random) {
  if (carIds.length < 2) throw new Error('Need at least 2 racers');
  if (theme.threeWayStart && carIds.length >= 3) return buildThreeWay(carIds, rng);
  let size = 2;
  while (size < carIds.length) size *= 2;
  const rounds = Math.log2(size);
  const shuffled = shuffle(carIds, rng); // random slot assignment
  const slots = seedOrder(size).map((seed) => shuffled[seed - 1] ?? null); // null = bye

  const tournament = {
    id: 't' + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36),
    createdAt: new Date().toISOString(),
    racers: [...carIds],
    rounds: [],
    champion: null,
    runnerUp: null,
    seq: 0,
  };
  for (let r = 0; r < rounds; r++) {
    const count = size / 2 ** (r + 1);
    const isFinal = r === rounds - 1;
    const ms = [];
    for (let m = 0; m < count; m++) {
      ms.push({
        id: `r${r}m${m}`, round: r, index: m,
        a: r === 0 ? slots[m * 2] : null,
        b: r === 0 ? slots[m * 2 + 1] : null,
        track: isFinal ? theme.FINAL_TRACK.id : theme.RACE_TRACKS[Math.floor(rng() * theme.RACE_TRACKS.length)].id,
        winner: null, standings: null, playedAt: null, order: null, bye: false,
      });
    }
    tournament.rounds.push(ms);
  }
  // resolve byes in round 0
  for (const m of tournament.rounds[0]) if ((m.a === null) !== (m.b === null)) autoAdvance(tournament, m);
  return tournament;
}

function autoAdvance(t, m) {
  m.bye = true;
  m.winner = m.a ?? m.b;
  m.playedAt = null;
  advance(t, m);
}

function advance(t, m) {
  if (m.feeds) { findMatch(t, m.feeds.match)[m.feeds.slot] = m.winner; return; }
  const next = t.rounds[m.round + 1]?.[Math.floor(m.index / 2)];
  if (!next) { t.champion = m.winner; t.runnerUp = m.a === m.winner ? m.b : m.a; return; }
  if (m.index % 2 === 0) next.a = m.winner; else next.b = m.winner;
  // a later-round match can also be a bye only if both feeders were byes; impossible with correct seeding
}

export const isReady = (m) => !!m.a && !!m.b && (m.c === undefined || !!m.c) && !m.winner;
export const racersOf = (m) => [m.a, m.b, m.c].filter(Boolean);
export const allMatches = (t) => t.rounds.flat();
export const findMatch = (t, id) => allMatches(t).find((m) => m.id === id);
export const nextReady = (t) => allMatches(t).find(isReady) || null;
export const roundCount = (t) => t.rounds.length;

export function recordResult(t, matchId, winnerId, standings = null) {
  const m = findMatch(t, matchId);
  if (!m || !isReady(m)) throw new Error('Match not playable');
  if (!racersOf(m).includes(winnerId)) throw new Error('Winner is not in this match');
  m.winner = winnerId;
  m.standings = standings;
  m.playedAt = new Date().toISOString();
  m.order = ++t.seq;
  advance(t, m);
  return t;
}

// ---- import ----
// Checks an imported object really is a tournament this game could have made.
// Returns the tournament, or throws an Error with a human-readable reason.
export function validateTournament(t, carIds, trackIds) {
  const bad = (msg) => { throw new Error(msg); };
  if (!t || typeof t !== 'object' || Array.isArray(t)) bad('That file is not a tournament.');
  if (typeof t.id !== 'string') bad('Missing tournament id.');
  if (!Array.isArray(t.rounds) || !t.rounds.length || t.rounds.some((r) => !Array.isArray(r))) bad('Missing bracket rounds.');
  const rounds = t.rounds.length;
  const okCar = (x) => x === null || carIds.includes(x);
  const tw = t.threeWay === true;
  if (tw && rounds < 2) bad('Bracket is too short.');
  t.rounds.forEach((ms, r) => {
    if (tw && r === 0) { if (!ms.length || ms.length > 64) bad('Round 1 has the wrong number of matches.'); }
    else if (ms.length !== 2 ** (rounds - 1 - r)) bad(`Round ${r + 1} has the wrong number of matches.`);
    ms.forEach((m, i) => {
      if (!m || m.round !== r || m.index !== i || m.id !== `r${r}m${i}`) bad(`Match ${r + 1}.${i + 1} is malformed.`);
      if (!trackIds.includes(m.track)) bad(`Unknown track "${m.track}".`);
      if (!okCar(m.a) || !okCar(m.b) || !okCar(m.winner ?? null) || (m.c !== undefined && !okCar(m.c))) bad(`Unknown racer in match ${r + 1}.${i + 1}.`);
      if (m.winner && m.winner !== m.a && m.winner !== m.b && m.winner !== m.c) bad(`Winner isn't in match ${r + 1}.${i + 1}.`);
      if (tw && r === 0) {
        const f = m.feeds, tgt = t.rounds[1].find((x) => x.id === f?.match);
        if (!tgt || (f.slot !== 'a' && f.slot !== 'b')) bad(`Match 1.${i + 1} feeds nowhere.`);
        if (!m.a || !m.b) bad(`Match 1.${i + 1} is missing racers.`);
      } else if (tw && r === 1) {
        for (const key of ['a', 'b']) {
          const feeder = t.rounds[0].find((x) => x.feeds && x.feeds.match === m.id && x.feeds.slot === key);
          if (feeder ? (m[key] ?? null) !== (feeder.winner ?? null) : !m[key]) bad(`Match 2.${i + 1} doesn't match its feeder matches.`);
        }
      } else if (r > 0) { // racers must be exactly the winners of the two feeder matches
        const [fa, fb] = t.rounds[r - 1].slice(i * 2, i * 2 + 2);
        if ((m.a ?? null) !== (fa.winner ?? null) || (m.b ?? null) !== (fb.winner ?? null)) bad(`Match ${r + 1}.${i + 1} doesn't match its feeder matches.`);
      }
    });
  });
  const fin = t.rounds[rounds - 1][0];
  if ((t.champion ?? null) !== (fin.winner ?? null)) bad('Champion does not match the final.');
  return {
    ...t,
    ...(tw ? { threeWay: true } : {}),
    racers: Array.isArray(t.racers) ? t.racers.filter((x) => carIds.includes(x)) : [],
    champion: t.champion ?? null,
    runnerUp: t.runnerUp ?? null,
    seq: Number.isFinite(t.seq) ? t.seq : 0,
  };
}
