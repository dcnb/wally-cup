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

// Staged format (theme.stagedStart): short multi-car races up front, then head-to-head.
//   Round 1: four-car races (winner advances)      Round 2: up to four races of 3 cars (or 2 / a bye)
//   Semifinals: two 1-on-1 races                    Final: 1-on-1 on the final track
// Racers who don't need to race a round get a bye straight to the next one. Every match has up to four slots
// `a b c d` (only the first `size` are used), and a `feeds` link saying where its winner goes next.
const SLOTS = ['a', 'b', 'c', 'd'];
function buildStaged(carIds, rng) {
  const n = carIds.length;
  const shuffled = shuffle(carIds, rng);
  const t = { id: 't' + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36), createdAt: new Date().toISOString(), racers: [...carIds], rounds: [], champion: null, runnerUp: null, seq: 0, format: 'staged' };
  const pickTrack = () => theme.RACE_TRACKS[Math.floor(rng() * theme.RACE_TRACKS.length)].id;
  const mk = (r, i, size, track) => ({ id: `r${r}m${i}`, round: r, index: i, size, a: null, b: null, ...(size > 2 ? { c: null } : {}), ...(size > 3 ? { d: null } : {}), track, winner: null, standings: null, playedAt: null, order: null, bye: false });
  // how many four-car races until at most 12 racers are left (4 races of up to 3)
  const g1 = n > 12 ? Math.ceil((n - 12) / 3) : 0;
  const entering = n - 3 * g1;                      // racers (and pending winners) entering round 2
  const pending = [];                               // round-1 matches whose winners are still to come
  let k = 0;
  const rounds = [];
  if (g1) {
    const r1 = [];
    for (let i = 0; i < g1; i++) {
      const m = mk(0, i, 4, pickTrack());
      SLOTS.forEach((sl) => { m[sl] = shuffled[k++]; });
      r1.push(m); pending.push(m);
    }
    rounds.push(r1);
  }
  const r2n = rounds.length;
  const entrants = shuffle([...pending.map((m) => ({ m })), ...shuffled.slice(k).map((id) => ({ id }))], rng);
  if (entrants.length > 4) { // round 2: four races, entrants dealt out evenly
    const groups = [0, 1, 2, 3].map(() => []);
    entrants.forEach((e, i) => groups[i % 4].push(e));
    const r2 = groups.map((grp, i) => {
      const m = mk(r2n, i, grp.length, pickTrack());
      grp.forEach((e, j) => { if (e.m) e.m.feeds = { match: m.id, slot: SLOTS[j] }; else m[SLOTS[j]] = e.id; });
      return m;
    });
    rounds.push(r2);
  }
  const winnersOf = rounds.length ? rounds[rounds.length - 1] : null;
  // semifinals + final get head-to-head slots
  const semiEntrants = winnersOf ? winnersOf.map((m) => ({ m })) : entrants;
  const sr = rounds.length;
  const semis = [0, 1].map((i) => mk(sr, i, 2, pickTrack()));
  const fin = mk(sr + 1, 0, 2, theme.FINAL_TRACK.id);
  semiEntrants.forEach((e, i) => {
    const sm = semis[Math.floor(i / 2)], sl = SLOTS[i % 2];
    if (e.m) e.m.feeds = { match: sm.id, slot: sl }; else sm[sl] = e.id;
  });
  semis.forEach((m, i) => { m.feeds = { match: fin.id, slot: SLOTS[i] }; });
  rounds.push(semis, [fin]);
  t.rounds = rounds;
  // a one-slot match is a bye: that racer walks straight through
  for (const m of rounds.flat()) if (m.size === 1 && m.a) autoAdvance(t, m);
  void entering;
  return t;
}

export function buildBracket(carIds, rng = Math.random) {
  if (carIds.length < 2) throw new Error('Need at least 2 racers');
  if (theme.stagedStart && carIds.length >= 4) return buildStaged(carIds, rng);
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
  m.winner = m.a ?? m.b ?? m.c ?? m.d;
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

const slotsOf = (m) => SLOTS.slice(0, m.size ?? 2).map((k) => m[k]);
export const isReady = (m) => !m.winner && !m.bye && slotsOf(m).every(Boolean);
export const racersOf = (m) => slotsOf(m).filter(Boolean);
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
  const staged = t.format === 'staged';
  if (staged) {
    if (rounds < 2 || rounds > 4) bad('Bracket has the wrong number of rounds.');
    const all = t.rounds.flat(), byId = new Map(all.map((m) => [m.id, m]));
    const fed = new Set();
    t.rounds.forEach((ms, r) => {
      if (!ms.length || ms.length > 64) bad(`Round ${r + 1} has the wrong number of matches.`);
      ms.forEach((m, i) => {
        if (!m || m.round !== r || m.index !== i || m.id !== `r${r}m${i}`) bad(`Match ${r + 1}.${i + 1} is malformed.`);
        if (!Number.isInteger(m.size) || m.size < 1 || m.size > 4) bad(`Match ${r + 1}.${i + 1} has a bad size.`);
        if (!trackIds.includes(m.track)) bad(`Unknown track "${m.track}".`);
        if (SLOTS.some((k) => !okCar(m[k] ?? null)) || !okCar(m.winner ?? null)) bad(`Unknown racer in match ${r + 1}.${i + 1}.`);
        if (m.winner && !SLOTS.slice(0, m.size).some((k) => m[k] === m.winner)) bad(`Winner isn't in match ${r + 1}.${i + 1}.`);
        if (r === rounds - 1) { if (m.feeds) bad('The final cannot feed another match.'); }
        else {
          const tgt = byId.get(m.feeds?.match), si = SLOTS.indexOf(m.feeds?.slot);
          if (!tgt || tgt.round !== r + 1 || si < 0 || si >= tgt.size) bad(`Match ${r + 1}.${i + 1} feeds nowhere.`);
          const key = tgt.id + m.feeds.slot;
          if (fed.has(key)) bad(`Two matches feed the same slot.`);
          fed.add(key);
        }
      });
    });
    // every slot is either a fixed racer or exactly the winner of its feeder
    for (const m of all) for (const k of SLOTS.slice(0, m.size)) {
      const feeder = all.find((x) => x.feeds && x.feeds.match === m.id && x.feeds.slot === k);
      if (feeder ? (m[k] ?? null) !== (feeder.winner ?? null) : !m[k]) bad(`Match ${m.round + 1}.${m.index + 1} doesn't match its feeder matches.`);
    }
  } else t.rounds.forEach((ms, r) => {
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
    ...(staged ? { format: 'staged' } : {}),
    racers: Array.isArray(t.racers) ? t.racers.filter((x) => carIds.includes(x)) : [],
    champion: t.champion ?? null,
    runnerUp: t.runnerUp ?? null,
    seq: Number.isFinite(t.seq) ? t.seq : 0,
  };
}
