// Headless balance check: node test/balance.mjs [tday]
import { setTheme, theme } from '../js/theme.js';
const TDAY = process.argv[2] === 'tday';
if (TDAY) setTheme((await import('../js/themes/tday.js')).tdayTheme);
const CARS = theme.CARS, TRACKS = theme.RACE_TRACKS;
import { simulate, mulberry32, baseFitness, TOURNEY_CONFIG } from '../js/sim.js';

const N = 4000;
let failed = false;
const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';

for (const track of TRACKS) {
  const rng = mulberry32(42);
  const appear = {}, wins = {};
  let favWins = 0, favWins2 = 0, n2 = 0, n4 = 0, time = 0, spins = 0;
  for (let i = 0; i < N; i++) {
    const k = 2 + Math.floor(rng() * 3);
    const pool = [...CARS].sort(() => rng() - 0.5).slice(0, k);
    const fav = [...pool].sort((a, b) => baseFitness(b, track) - baseFitness(a, track))[0];
    const r = simulate(pool, track, i + 1);
    time += r.time; spins += r.spins.reduce((a, b) => a + b, 0) / k;
    for (const c of pool) appear[c.id] = (appear[c.id] || 0) + 1;
    wins[r.winner] = (wins[r.winner] || 0) + 1;
    if (r.winner === fav.id) { if (k === 2) favWins2++; if (k === 4) favWins++; }
    if (k === 2) n2++; if (k === 4) n4++;
  }
  console.log(`\n== ${track.name}: avg ${(time / N).toFixed(1)}s, ${(spins / N).toFixed(2)} spins/car`);
  console.log(`   favorite wins: 2-car ${pct(favWins2 / n2)}, 4-car ${pct(favWins / n4)}`);
  const rows = CARS.map((c) => [c.name, (wins[c.id] || 0) / appear[c.id]]).sort((a, b) => b[1] - a[1]);
  console.log('   win rate when entered: ' + rows.map(([n, w]) => `${n} ${pct(w).trim()}`).join(' | '));
  if (favWins2 / n2 > 0.9 || favWins / n4 > 0.75) { console.log('   ! too lopsided'); failed = true; }
  if (favWins2 / n2 < 0.6 || favWins / n4 < 0.35) { console.log('   ! too random'); failed = true; }
  if (rows.at(-1)[1] < 0.02) { console.log('   ! worst car basically never wins'); failed = true; }
}

function field(ids, track, label, expectId) {
  const cars = ids.map((id) => CARS.find((c) => c.id === id));
  const wins = {}; const M = 2000;
  for (let i = 0; i < M; i++) { const w = simulate(cars, track, 500 + i).winner; wins[w] = (wins[w] || 0) + 1; }
  const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  const ok = sorted[0][0] === expectId;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok ' : 'BAD'} ${label}: ` + sorted.map(([k, v]) => `${k} ${pct(v / M).trim()}`).join(', '));
}
console.log('\n-- stat sanity (4-car fields) --');
if (TDAY) {
  field(['zanni', 'heidi', 'ro', 'kristin'], TRACKS[0], 'patch favors off-road (Heidi)', 'heidi');
  field(['kristin', 'bode', 'ro', 'frank'], TRACKS[1], 'gravy favors speed (Bode)', 'bode');
  field(['devin', 'kristin', 'ro', 'frank'], TRACKS[2], 'bog favors handling (Devin)', 'devin');
} else {
field(['kristin', 'jack', 'nancy', 'tyson'], TRACKS[0], 'desert favors off-road (Kristin)', 'kristin');
field(['kristin', 'jack', 'josie', 'tyson'], TRACKS[1], 'sea favors speed (Jack)', 'jack');
field(['kristin', 'jack', 'nancy', 'tyson'], TRACKS[2], 'forest favors handling (Kristin)', 'kristin');
}

// Tournament mode: stats are squeezed + re-rolled per race. The field should be close to even,
// with Wallace (maxed stats) only modestly ahead.
console.log('\n-- tournament evenness (1v1) --');
{
  const rng = mulberry32(7); const wins = {}, app = {}; let n = 0, fav = 0, favFree = 0;
  for (let i = 0; i < 6000; i++) {
    const track = TRACKS[i % TRACKS.length];
    const pool = [...CARS].sort(() => rng() - 0.5).slice(0, 2);
    const f = [...pool].sort((a, b) => baseFitness(b, track) - baseFitness(a, track))[0].id;
    const w = simulate(pool, track, i + 1, TOURNEY_CONFIG).winner;
    if (w === f) fav++;
    if (simulate(pool, track, i + 1).winner === f) favFree++;
    for (const c of pool) app[c.id] = (app[c.id] || 0) + 1;
    wins[w] = (wins[w] || 0) + 1; n++;
  }
  const rates = CARS.map((c) => [c.name, (wins[c.id] || 0) / app[c.id]]).sort((a, b) => b[1] - a[1]);
  console.log(`favorite wins: free-play ${pct(favFree / n)}, tournament ${pct(fav / n)}`);
  console.log('1v1 win rate: ' + rates.map(([k, v]) => `${k} ${pct(v).trim()}`).join(' | '));
  const wally = rates.find(([k]) => k === 'Wallace')[1];
  if (fav / n > 0.62 || fav / n < 0.48) { console.log('BAD favorite win rate out of band'); failed = true; }
  if (wally < 0.53 || wally > 0.66) { console.log('BAD Wallace should be only slightly ahead'); failed = true; }
  if (rates.at(-1)[1] < 0.4) { console.log('BAD weakest car too hopeless'); failed = true; }
  if (rates.slice(1).some(([, v]) => v > wally)) { console.log('BAD someone out-rates Wallace'); failed = true; }
}
process.exit(failed ? 1 : 0);
