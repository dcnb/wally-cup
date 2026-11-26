// Theme registry. The Wally Cup is the default; tday.html swaps in the Thanksgiving theme
// (see js/main-tday.js) before the rest of the game loads. Modules read from `theme` at call time.
import { CARS, TRACKS, RACE_TRACKS, FINAL_TRACK } from './data.js';
import { FACTS, SPARE_FACTS } from './facts.js';

export const theme = {
  id: 'wally',
  CARS, TRACKS, RACE_TRACKS, FINAL_TRACK,
  FACTS, SPARE_FACTS,
  cupName: 'Wally Cup',
  noun: 'car', nouns: 'cars',
  finalIcon: '🌈',
  champIcon: '🏆',
  shouts: ['BEEP!', 'HONK!', 'VROOM!', 'BEEP BEEP!'],
  storageKey: 'wallycup.tournament.v1',
  exportPrefix: 'wally-cup',
  readyHtml: '🏁 Drivers, start your engines!',
  linger: null, // the Linger Cup sets this (see js/linger.js); null means no lingering
  homeCols: 4,
  DRAW: null,   // extra car drawers (id -> fn), looked up before the built-in ones
  scenes: null, // per-track scenery overrides (track id -> hooks), see tracks.js
  zoneKinds: null, // extra zone painters (kind -> fn)
  lines: null,  // announcer line overrides
  canvas: { mat: 'rgba(40,40,80,0.10)', matStripe: '#e5483a', label: '#26264a', shout: '#ffc93c', shoutInk: '#26264a' },
};

export function setTheme(t) { Object.assign(theme, t); }

// Pick a silly pre-race fact for a car.
export function factFor(car) {
  const pool = theme.FACTS[car.id] || theme.SPARE_FACTS;
  return pool[(Math.random() * pool.length) | 0].replaceAll('{n}', car.name);
}
