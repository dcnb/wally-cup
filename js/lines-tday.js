// Thanksgiving announcer lines. Anything not defined here falls back to the Wally Cup lines.
// Running gag, kept light: Heidi and Alex are Huskies fans, so the Huskies get the occasional general dig.
// The Huskies beat the Hoosiers on lucky breaks and (probably hired) hometown refs, then lost to Penn State,
// and Penn State lost to Rutgers. The digs show up a bit more when Heidi or Alex race, and never name anyone else.
import { pick } from './announcer.js';

const HUSKY_FANS = ['Heidi', 'Alex'];
const isFan = (...names) => names.some((n) => HUSKY_FANS.includes(n));
const chance = (p) => Math.random() < p;

// General digs at the Huskies, usable anywhere.
const JABS = [
  `Meanwhile, somewhere, the Huskies are still thanking their hometown refs.`,
  `Fair officiating today, unlike certain Huskies games.`,
  `Not a single hometown ref out here. The Huskies would be lost.`,
  `A little luck never hurt anybody. Ask the Huskies.`,
  `The Huskies lost to Penn State, and Penn State lost to Rutgers. Just saying.`,
  `Those refs must be on a different payroll than the Huskies' refs.`,
];

// Shorter digs for when Heidi or Alex are in the race.
const FAN_DIGS = [
  `Huskies fans, check for hometown refs.`,
  `Luck is a very Huskies thing.`,
  `No friendly refs today, Huskies fans!`,
  `Somebody tell the Huskies that Penn State lost to Rutgers.`,
];
const fanDig = () => pick(FAN_DIGS, 'fandig');

// Always used when Heidi or Alex win: they probably paid the refs, just like the Huskies did against IU.
const PAID_REFS = (n) => [
  `And we suspect ${n} paid the refs, just like the Huskies did against IU.`,
  `Word is ${n} slipped the refs a little something, the same way the Huskies did against IU.`,
  `Let the record show ${n} likely paid the refs, exactly like the Huskies did against IU.`,
  `Nobody can prove ${n} paid the refs, but the Huskies did that against IU too.`,
];

const turkeyLead = (n) => [
  `${n} takes the lead!`, `Here comes ${n}! Into first place, with gravy flying!`, `${n} storms to the front!`,
  `${n} pulls ahead like the last roll in the basket!`, `New leader! It's ${n}, and the table is cheering!`,
  `${n} zooms past the pack! Pass it forward!`, `${n} grabs the top spot, and the seconds too!`,
  `The lead changes hands! ${n} is on top!`, `${n} is out in front, and smells delicious!`,
  `${n} says, move over, I'm first in line for pie!`,
];

export const LINES_TDAY = {
  welcome: (tr) => pick([
    `Welcome, everybody, to the Turkey Cup at ${tr}! The gravy is hot and so are the racers!`,
    `Ladies and gentlemen, happy Thanksgiving! It's the Turkey Cup, live at ${tr}!`,
    `Hello, hungry fans! We are live at ${tr}, and the whole table is here!`,
    `Gather round, folks! The Turkey Cup is on at ${tr}, and nobody leaves before pie!`,
    `What a day for a race! Welcome to ${tr}, where the leftovers are already planning their getaway!`,
    `Good afternoon, family and friends! The Turkey Cup at ${tr} is about to begin!`,
    `Loosen your belts, because the Turkey Cup at ${tr} is about to get fast!`,
  ], 'welcome') + (chance(0.12) ? ` ${pick(JABS, 'jab')}` : ''),
  ready: () => pick([
    'Drivers, start your ovens!', 'Racers, get ready, and tuck in your napkins!', 'Buckle up, everybody! Elbows off the table!',
    'Engines on! Here we go, no cutting in line at the buffet!', "Gravy boats ready? Let's race!",
    'Everyone to the line! The turkey is resting, and so are the rules!',
  ], 'ready'),
  start: () => pick([
    `And they're off, like Grandma Ro heading for the cheese!`, 'Green flag! Pass the gas!', 'Go go go! The Turkey Cup is underway!',
    'The dinner bell rings and they are gone!', 'Off they roll! Somebody grab the cranberries!', 'The wishbone is snapped, and the race is on!',
  ], 'start'),
  lead: (n) => (isFan(n) && chance(0.2)) ? `${pick(turkeyLead(n), 'lead')} ${fanDig()}` : chance(0.04) ? `${pick(turkeyLead(n), 'lead')} ${pick(JABS, 'jab')}` : pick(turkeyLead(n), 'lead'),
  spin: (n, zone) => pick([
    `Oh no! ${n} spins out${zone ? ` in the ${zone}` : ''}!`,
    `${n} is spinning like a pie on a turntable!`,
    `Whoa! ${n} is going around like a dreidel at a pie party!`,
    `${n} sloshes sideways! There goes the gravy!`,
    `${n} lost control and the gravy is everywhere!`,
    `That is a wipeout for ${n}! Somebody get a napkin!`,
    `${n} is dizzy! Very, very dizzy! Too much stuffing!`,
    `Yikes! ${n} is spinning like a mixer on high!`,
    `${n} takes the scenic route, backwards and covered in cranberry!`,
  ], 'spin'),
  recover: (n) => pick([
    `${n} is back in it!`, `And ${n} is rolling again! Second helping!`, `Don't count ${n} out! There's always room for pie!`,
    `${n} shakes it off and charges ahead!`, `Here comes ${n}, with a comeback bigger than a leftovers sandwich!`,
    `Never give up, says ${n}! There's still pie!`,
  ], 'recover'),
  jump: (n) => pick([
    `${n} goes airborne!`, `Look at ${n} fly over the table leaf!`, `${n} hits the ramp like a drumstick off the platter!`,
    `Up, up, and away goes ${n}! Pass the potatoes, please!`, `Big air for ${n}!`, `${n} soars like a parade balloon!`,
  ], 'jump'),
  crashland: (n) => pick([
    `Ooh, rough landing for ${n}! Splat!`, `${n} lands like a dropped casserole!`, `${n} comes down with a thud, and a side of crumbs!`,
    `Oof! ${n} did not stick that landing!`, `${n} wobbles like jello on a plate!`,
  ], 'crashland'),
  commentary: (a, b) => {
    const plain = pick([
      `${a} leads, with ${b} right behind.`, `It's ${a} out front, ${b} giving chase!`, `${b} is closing in on ${a}!`,
      `What a race! ${a} in front, ${b} on the bumper!`, `Nose to tail! ${a} ahead, ${b} breathing down the neck!`,
      `${b} wants first place, but ${a} says no seconds!`, `This is anybody's cup! ${a} leads for now!`,
      `${a} is cruising, and ${b} is hunting for the last roll!`, `Keep an eye on ${b}! ${a} still has the lead!`,
    ], 'commentary');
    if (isFan(a, b) && chance(0.2)) return `${plain} ${fanDig()}`;
    if (chance(0.05)) return `${plain} ${pick(JABS, 'jab')}`;
    return plain;
  },
  final: () => pick([
    'Here comes the finish!', 'Final stretch! Save room for pie!', "It's coming down to the wire! Or the wishbone!",
    'The finish line is in sight, and so is dessert!', 'Down the home stretch they go!', "Here we go! It's anybody's cup!",
  ], 'final'),
  win: (n) => { const w = pick([
    `${n} wins the Turkey Cup!`, `It's ${n}! ${n} takes the cup, and the first slice!`, `${n} is the champion! Give that person the drumstick!`,
    `And the winner is ${n}! Gobble gobble!`, `${n} crosses the line first! What a race!`, `Hooray for ${n}! The Turkey Cup is yours!`,
    `Confetti for ${n}! Winner, winner, turkey dinner!`, `Take a bow, ${n}! Champion of the Turkey Cup!`,
  ], 'win'); return isFan(n) ? `${w} ${pick(PAID_REFS(n), 'paidrefs')}` : chance(0.06) ? `${w} ${pick(JABS, 'jab')}` : w; },
  loser: (n) => { const l = pick([
    `Better luck next time, ${n}.`, `Poor ${n}. Maybe next race.`, `Aw, ${n} is feeling a little deflated.`, `Chin up, ${n}! There's always pie.`,
    `${n} did a good job. Sort of.`, `${n} says, I demand a rematch, and a rematch of dessert!`, `Don't cry, ${n}. Have a roll.`,
  ], 'loser'); return isFan(n) && chance(0.25) ? `${l} The refs were not on your side this time.` : l; },
  matchup: (a, b, rn, tr) => {
    const base = pick([
      `${rn}! ${a} versus ${b} at ${tr}! One advances, and the other gets seconds as a consolation!`,
      `Ladies and gentlemen, loosen your belts! It is ${a} against ${b} in ${rn}, live at ${tr}!`,
      `The tension is unbelievable! ${a} and ${b} meet at ${tr}! This is ${rn}, and nobody is passing the potatoes!`,
      `Two dishes enter, one dish advances! ${a} versus ${b}, ${rn}, at ${tr}!`,
      `Rivals at last! ${a} lines up against ${b} at ${tr}! This is the moment ${rn} was made for!`,
      `${a} says they were born for this. ${b} says hold my gravy. ${rn} at ${tr}, right now!`,
    ], 'matchup');
    if (isFan(a, b) && chance(0.3)) return `${base} ${fanDig()}`;
    return chance(0.06) ? `${base} ${pick(JABS, 'jab')}` : base;
  },
  finalHype: (a, b) => {
    const base = pick([
      `This is it, folks! The one we've all been waiting for! ${a} versus ${b} for the Turkey Cup, on the Long Table! Glory awaits, and so does a very large pie!`,
      `The candles are lit, the table is set, and the cup is shining! ${a} and ${b} race for everything on the Long Table! Nobody leaves this dinner the same!`,
      `Welcome to the Long Table, the most delicious, most dangerous, most important race track in the house! ${a} against ${b}, winner takes the Turkey Cup!`,
      `Grandmas are cheering, dogs are begging, and the whole table is watching! ${a} versus ${b}! The championship! It does not get bigger than this!`,
    ], 'finalHype');
    return isFan(a, b) ? (chance(0.5) ? `${base} ${fanDig()}` : base) : chance(0.2) ? `${base} ${pick(JABS, 'jab')}` : base;
  },
  bracketReady: () => pick([
    'The bracket is set! May the best dish win!', 'The draw is done! Let the feast begin!', 'Slots drawn at random! Who takes the Turkey Cup?',
      ], 'bracketReady'),
  championSong: (n) => {
    const verses = [
    `${n} is the champion, my friends!`,
    `And ${n} keeps on feasting, till the end!`,
    `${n} is the champion, my friends!`,
    `No time for leftovers, cause ${n} is the champion!`,
    `Of the Turkey Cup!`,
    `${n} is the champion, my friends! ${n} is the champion!`,
    ];
    if (isFan(n)) verses.splice(5, 0, `${n} probably paid the refs, just like the Huskies did against IU!`);
    return verses;
  },
};
