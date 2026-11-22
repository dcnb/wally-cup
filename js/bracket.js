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

// ---- export ----
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(t, nameOf = (x) => x, trackName = (x) => x) {
  const head = ['tournament_id', 'round', 'match', 'track', 'racer_a', 'racer_b', 'winner', 'bye', 'order_played', 'played_at'];
  const total = t.rounds.length;
  const rows = allMatches(t).map((m) => [
    t.id,
    m.round === total - 1 ? 'Championship' : `Round ${m.round + 1}`,
    m.index + 1, trackName(m.track), m.a ? nameOf(m.a) : '', m.b ? nameOf(m.b) : '',
    m.winner ? nameOf(m.winner) : '', m.bye ? 'yes' : 'no', m.order ?? '', m.playedAt ?? '',
  ]);
  rows.push([]);
  rows.push([t.id, 'CHAMPION', '', '', '', '', t.champion ? nameOf(t.champion) : '', '', '', '']);
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
