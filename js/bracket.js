// Pure tournament logic (no DOM) so it can run in the browser and in Node tests.
import { RACE_TRACKS, FINAL_TRACK } from './data.js';

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

export function buildBracket(carIds, rng = Math.random) {
  if (carIds.length < 2) throw new Error('Need at least 2 racers');
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
        track: isFinal ? FINAL_TRACK.id : RACE_TRACKS[Math.floor(rng() * RACE_TRACKS.length)].id,
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
  const next = t.rounds[m.round + 1]?.[Math.floor(m.index / 2)];
  if (!next) { t.champion = m.winner; t.runnerUp = m.a === m.winner ? m.b : m.a; return; }
  if (m.index % 2 === 0) next.a = m.winner; else next.b = m.winner;
  // a later-round match can also be a bye only if both feeders were byes; impossible with correct seeding
}

export const isReady = (m) => !!m.a && !!m.b && !m.winner;
export const allMatches = (t) => t.rounds.flat();
export const findMatch = (t, id) => allMatches(t).find((m) => m.id === id);
export const nextReady = (t) => allMatches(t).find(isReady) || null;
export const roundCount = (t) => t.rounds.length;

export function recordResult(t, matchId, winnerId, standings = null) {
  const m = findMatch(t, matchId);
  if (!m || !isReady(m)) throw new Error('Match not playable');
  if (winnerId !== m.a && winnerId !== m.b) throw new Error('Winner is not in this match');
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
  t.rounds.forEach((ms, r) => {
    if (ms.length !== 2 ** (rounds - 1 - r)) bad(`Round ${r + 1} has the wrong number of matches.`);
    ms.forEach((m, i) => {
      if (!m || m.round !== r || m.index !== i || m.id !== `r${r}m${i}`) bad(`Match ${r + 1}.${i + 1} is malformed.`);
      if (!trackIds.includes(m.track)) bad(`Unknown track "${m.track}".`);
      if (!okCar(m.a) || !okCar(m.b) || !okCar(m.winner ?? null)) bad(`Unknown racer in match ${r + 1}.${i + 1}.`);
      if (m.winner && m.winner !== m.a && m.winner !== m.b) bad(`Winner isn't in match ${r + 1}.${i + 1}.`);
      if (r > 0) { // racers must be exactly the winners of the two feeder matches
        const [fa, fb] = t.rounds[r - 1].slice(i * 2, i * 2 + 2);
        if ((m.a ?? null) !== (fa.winner ?? null) || (m.b ?? null) !== (fb.winner ?? null)) bad(`Match ${r + 1}.${i + 1} doesn't match its feeder matches.`);
      }
    });
  });
  const fin = t.rounds[rounds - 1][0];
  if ((t.champion ?? null) !== (fin.winner ?? null)) bad('Champion does not match the final.');
  return {
    ...t,
    racers: Array.isArray(t.racers) ? t.racers.filter((x) => carIds.includes(x)) : [],
    champion: t.champion ?? null,
    runnerUp: t.runnerUp ?? null,
    seq: Number.isFinite(t.seq) ? t.seq : 0,
  };
}
