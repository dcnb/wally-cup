// Play-by-play announcer using the browser's built-in speech synthesis.
// No server and no audio files. If the browser has no voices, everything quietly does nothing.
import { sfx, music } from './sound.js';
import { theme } from './theme.js';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let enabled = true, voice = null, speaking = false, pending = null, lastEnd = 0, currentFin = null;

const PREFERRED = ['Google UK English Male', 'Daniel', 'Microsoft Guy', 'Microsoft David', 'Alex', 'Fred', 'Aaron', 'Google US English', 'Samantha'];

function pickVoice() {
  if (!supported) return;
  const list = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  if (!list.length) return;
  voice = PREFERRED.map((n) => list.find((v) => v.name.includes(n))).find(Boolean) || list.find((v) => /en-(US|GB)/i.test(v.lang)) || list[0];
}
if (supported) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }

function speak(text, cb, opts = {}) {
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang || 'en-US';
  u.rate = opts.rate ?? 1.18; u.pitch = opts.pitch ?? 1.08; u.volume = 1;
  u.onstart = () => { speaking = true; music.duck(true); };
  const done = () => {
    speaking = false; lastEnd = performance.now(); music.duck(false);
    if (pending && performance.now() - pending.at < 2500) { const p = pending; pending = null; speak(p.text); }
    pending = null;
    cb?.();
  };
  u.onend = done; u.onerror = done;
  speechSynthesis.speak(u);
}

export const announcer = {
  get supported() { return supported; },
  get enabled() { return enabled; },
  setEnabled(v) { enabled = v; if (!v) this.cancel(); },

  // prio 3 = big moment (interrupts), 2 = normal (queued briefly), 1 = filler (only when quiet)
  say(text, prio = 2) {
    if (!supported || !enabled || sfx.muted || !text) return;
    if (prio >= 3) {
      pending = null;
      speechSynthesis.cancel();
      setTimeout(() => speak(text), 40);
      return;
    }
    if (speaking || speechSynthesis.speaking) {
      if (prio === 2) pending = { text, at: performance.now() };
      return;
    }
    if (prio === 1 && performance.now() - lastEnd < 2500) return;
    speak(text);
  },
  // Speak one line and resolve when it has finished (or after a reading-time fallback if voice is off/unsupported).
  sayAsync(text, opts = {}) {
    return new Promise((resolve) => {
      let finished = false;
      const fin = () => { if (!finished) { finished = true; currentFin = null; resolve(); } };
      currentFin = fin;
      const fallback = Math.max(2200, text.length * 75);
      if (!supported || !enabled || sfx.muted) { setTimeout(fin, fallback); return; }
      pending = null;
      speechSynthesis.cancel();
      setTimeout(() => speak(text, fin, opts), 40);
      setTimeout(fin, fallback + 5000); // safety net if the browser never fires onend
    });
  },
  cancel() {
    currentFin?.();
    if (!supported) return;
    pending = null; speaking = false;
    speechSynthesis.cancel();
    music.duck(false);
  },
};

// ---- lines ----
// Every kind of call has lots of variants, and we never repeat the same one twice in a row.
const lastPick = {};
export function pick(arr, key) {
  let i = (Math.random() * arr.length) | 0;
  if (key && arr.length > 1 && i === lastPick[key]) i = (i + 1 + ((Math.random() * (arr.length - 1)) | 0)) % arr.length;
  if (key) lastPick[key] = i;
  return arr[i];
}

const BASE_LINES = {
  welcome: (tr) => pick([
    `Welcome, everybody, to the Wally Cup at ${tr}!`,
    `Ladies and gentlemen, the Wally Cup is here, at ${tr}!`,
    `Hello, racing fans! We are live at ${tr}!`,
    `What a day for a race! Welcome to ${tr}!`,
    `Gather round, folks! It's the Wally Cup at ${tr}!`,
    `Good day, race fans! ${tr} is buzzing today!`,
    `Hold on to your hats! The Wally Cup at ${tr} is about to begin!`,
    `It's a beautiful day at ${tr}, and the cup is on the line!`,
  ], 'welcome'),
  ready: () => pick([
    'Drivers, start your engines!',
    'Racers, get ready!',
    'Buckle up, everybody!',
    'Engines on! Here we go!',
    'Let us see what these cars can do!',
    "Mirrors checked, snacks packed. Let's race!",
    'Gentle people, start your engines!',
    'Everyone to the line! This is it!',
  ], 'ready'),
  start: () => pick([
    "And they're off!",
    'Green flag! Here we go!',
    'Engines roaring, and away they go!',
    'There goes the starting flag!',
    'Go go go! The race is on!',
    'And the Wally Cup is underway!',
    'Off they zoom!',
    'Tires screeching, and they are gone!',
    'The lights go out and the race is on!',
  ], 'start'),
  lead: (n) => pick([
    `${n} takes the lead!`,
    `Here comes ${n}! Into first place!`,
    `${n} storms to the front!`,
    `${n} pulls ahead!`,
    `New leader! It's ${n}!`,
    `${n} zooms right past the pack!`,
    `Look at ${n} go! First place!`,
    `${n} grabs the top spot!`,
    `${n} sneaks into the lead!`,
    `And just like that, ${n} is out in front!`,
    `The lead changes hands! ${n} is on top!`,
    `${n} says, move over, I'm first!`,
  ], 'lead'),
  spin: (n, zone) => pick([
    `Oh no! ${n} spins out${zone ? ` in the ${zone}` : ''}!`,
    `${n} lost control! Round and round!`,
    `Whoa! ${n} is spinning like a top!`,
    `${n} is doing donuts! Not on purpose!`,
    `Uh oh! ${n} is going for a spin${zone ? ` in the ${zone}` : ''}!`,
    `Wheeeee! ${n} twirls out of control!`,
    `${n} is dizzy! Very, very dizzy!`,
    `That is a wipeout for ${n}!`,
    `${n} slides sideways and spins away!`,
    `Ooh, that has to hurt! ${n} spins out!`,
    `${n} has lost the plot and the steering!`,
    `Yikes! ${n} is spinning like a pancake on a griddle!`,
    `${n} takes the scenic route, backwards and in circles!`,
  ], 'spin'),
  recover: (n) => pick([
    `${n} is back in it!`,
    `And ${n} is rolling again!`,
    `Don't count ${n} out!`,
    `${n} shakes it off and charges ahead!`,
    `Here comes ${n}, with a comeback!`,
    `${n} is not done yet!`,
    `Back on the road goes ${n}!`,
    `${n} says, that was just a warm up!`,
    `And ${n} gets going with a roar!`,
    `Never give up, says ${n}!`,
  ], 'recover'),
  jump: (n) => pick([
    `${n} goes airborne!`,
    `Look at ${n} fly!`,
    `${n} hits the ramp!`,
    `Up, up, and away goes ${n}!`,
    `${n} is flying through the air!`,
    `Big air for ${n}!`,
    `${n} takes off like a rocket!`,
    `Is it a bird? Is it a plane? It's ${n}!`,
    `${n} jumps for joy, and for the ramp!`,
    `${n} soars over the ramp!`,
  ], 'jump'),
  crashland: (n) => pick([
    `Ooh, rough landing for ${n}!`,
    `${n} lands badly! Wobbling!`,
    `${n} comes down with a thud!`,
    `Not the prettiest landing from ${n}!`,
    `Oof! ${n} did not stick that landing!`,
    `${n} bounces and wobbles! Yikes!`,
    `The landing gear was not ready! Poor ${n}!`,
  ], 'crashland'),
  zone: (z) => pick([
    `${z} coming up!`,
    `Watch out! ${z} ahead!`,
    `Here comes the ${z}!`,
    `Hold on tight, it's the ${z}!`,
    `Next up, the ${z}!`,
    `The ${z} is just ahead! This could get messy!`,
    `Uh oh, the ${z}! Who has got the skills?`,
    `And now, the dreaded ${z}!`,
    `Cars are heading into the ${z}!`,
    `Here we go, into the ${z}!`,
  ], 'zone'),
  commentary: (a, b) => pick([
    `${a} leads, with ${b} right behind.`,
    `It's ${a} out front, ${b} giving chase!`,
    `${b} is closing in on ${a}!`,
    `${a} is out front, but ${b} is not giving up!`,
    `What a race! ${a} in front, ${b} on the bumper!`,
    `${a} is in the lead, and ${b} is hot on the tail!`,
    `Nose to tail! ${a} ahead, with ${b} breathing down the neck!`,
    `${b} wants first place, but ${a} says no way!`,
    `This is anybody's race! ${a} leads for now!`,
    `${a} is cruising, and ${b} is hunting!`,
    `${a} leads the way while ${b} stays close!`,
    `Keep an eye on ${b}! ${a} still has the lead!`,
  ], 'commentary'),
  solo: (a) => pick([`${a} is flying!`, `${a} leads the way!`, `${a} is on a roll!`], 'solo'),
  final: () => pick([
    'Here comes the finish!',
    'Final stretch! Anything can happen!',
    "It's coming down to the wire!",
    'The finish line is in sight!',
    'Almost there! Who wants it more?',
    'Down the home stretch they go!',
    "Here we go! It's anybody's cup!",
    'The checkered flag is waiting!',
  ], 'final'),
  win: (n) => pick([
    `${n} wins the Wally Cup!`,
    `It's ${n}! ${n} takes the cup!`,
    `${n} is the champion!`,
    `And the winner is ${n}!`,
    `${n} crosses the line first! What a race!`,
    `Hooray for ${n}! The Wally Cup is yours!`,
    `${n} does it! A champion is crowned!`,
    `Confetti for ${n}! Winner, winner!`,
    `It's all over! ${n} takes home the cup!`,
    `Take a bow, ${n}! Champion of the Wally Cup!`,
  ], 'win'),
  // ---- tournament ----
  roundName: (round, total) => {
    const left = total - 1 - round; // 0 = final
    return left === 0 ? 'the Championship' : left === 1 ? 'the Semifinals' : left === 2 ? 'the Quarterfinals' : `Round ${round + 1}`;
  },
  matchup: (a, b, rn, tr) => pick([
    `${rn}! ${a} versus ${b} at ${tr}! Only one of them survives, and the other goes home to think about what they've done!`,
    `Ladies and gentlemen, hold onto your snacks! It is ${a} against ${b} in ${rn}, live at ${tr}!`,
    `The tension is unbelievable! ${a} and ${b} meet at ${tr}! This is ${rn}, and nobody is smiling!`,
    `Dreams will be made and hearts will be broken! ${a}, ${b}, ${tr}, ${rn}! Let's go!`,
    `Two cars enter, one car advances! ${a} versus ${b}, ${rn}, at ${tr}!`,
    `Rivals at last! ${a} lines up against ${b} at ${tr}! This is the moment ${rn} was made for!`,
    `Breaking news! ${a} and ${b} have been spotted at ${tr}! ${rn} is about to get wild!`,
    `${a} says they were born for this. ${b} says hold my snack. ${rn} at ${tr}, right now!`,
  ], 'matchup'),
  finalHype: (a, b) => pick([
    `This is it, folks! The one we've all been waiting for! ${a} versus ${b} for the Wally Cup, on legendary Rainbow Road! Glory awaits, and so does a very large trophy!`,
    `The stars are aligned, the road is glowing, and the cup is shining! ${a} and ${b} will race for everything on Rainbow Road! Nobody leaves this stadium the same!`,
    `Welcome to Rainbow Road, the most sparkly, most dangerous, most important race track in the galaxy! ${a} against ${b}, winner takes the Wally Cup!`,
    `Grandmas are crying, dogs are barking, and the whole world is watching! ${a} versus ${b}! The championship! Rainbow Road! It does not get bigger than this!`,
  ], 'finalHype'),
  bye: (n) => pick([
    `${n} gets a bye this round and advances without lifting a tire!`,
    `Lucky ${n} skips ahead with a bye!`,
  ], 'bye'),
  bracketReady: () => pick([
    'The bracket is set! May the luckiest car win!',
    'The draw is done! Let the madness begin!',
    'Slots have been drawn at random! Who will take the Wally Cup?',
  ], 'bracketReady'),
  advance: (n) => pick([
    `${n} moves on!`, `${n} advances! The crowd goes wild!`, `And ${n} is through to the next round!`,
    `Survive and advance! That's ${n}!`,
  ], 'advance'),
  // The champion song. Each verse is sung on its own line.
  championSong: (n) => [
    `${n} is the champion, my friends!`,
    `And ${n} keeps on racing, till the end!`,
    `${n} is the champion, my friends!`,
    `No time for losers, cause ${n} is the champion!`,
    `Of the Wally Cup!`,
    `${n} is the champion, my friends! ${n} is the champion!`,
  ],
  loser: (n) => pick([
    `Better luck next time, ${n}.`,
    `Poor ${n}. Maybe next race.`,
    `Aw, ${n} is feeling blue.`,
    `Chin up, ${n}! There's always next time.`,
    `${n} did a good job. Sort of.`,
    `${n} says, I demand a rematch!`,
    `It was a tough one for ${n}.`,
    `Don't cry, ${n}. Have a snack.`,
  ], 'loser'),
};

// Theme overrides win; anything a theme doesn't define falls back to the Wally Cup lines.
export const LINES = new Proxy(BASE_LINES, {
  get: (base, k) => theme.lines?.[k] ?? base[k],
});
