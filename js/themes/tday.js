// The Turkey Cup: a Thanksgiving edition of the race. Same engine, new roster, tracks, commentary and look.
// Ratings are 1-5 and never shown to players. `voice: 'honk'` keeps every non-dog on the horn.
import { DRAW_TDAY } from '../cars-tday.js';
import { SCENES_TDAY, ZONES_TDAY } from '../tracks-tday.js';
import { LINES_TDAY } from '../lines-tday.js';

const H = 'honk';
export const CARS = [
  { id: 'allen', name: 'Allen', quip: "The boss brought pie. Don't argue.", type: 'Apple pie truck', speed: 4, handling: 3, offroad: 3, intangibles: 3, color: '#d9953a', voice: H, pitch: 300 },
  { id: 'frank', name: 'Frank', quip: "Fluffy, historic, and slightly sticky.", type: 'White fluffy cake', speed: 2, handling: 3, offroad: 3, intangibles: 3, color: '#fffaf0', voice: H, pitch: 520 },
  { id: 'zanni', name: 'Zanni', quip: "Roses are red, my casserole is green.", type: 'Green bean casserole', speed: 2, handling: 3, offroad: 4, intangibles: 4, color: '#5fae4a', voice: H, pitch: 360 },
  { id: 'alex', name: 'Alex', quip: "Tall, golden, and carved two ways.", type: 'Roast turkey', speed: 4, handling: 2, offroad: 3, intangibles: 3, color: '#c4772a', voice: H, pitch: 140 },
  { id: 'heidi', name: 'Heidi', quip: "Throws a discus. Rolls a cheese wheel.", type: 'Cheese wheel', speed: 4, handling: 3, offroad: 5, intangibles: 3, color: '#f2c14e', voice: H, pitch: 250 },
  { id: 'fain', name: 'Fain', quip: "Freshman energy. Rhubarb attitude.", type: 'Rhubarb pie', speed: 3, handling: 4, offroad: 2, intangibles: 3, color: '#d6456b', voice: H, pitch: 400 },
  { id: 'bode', name: 'Bode', quip: "Do not make Bode eat the broccoli.", type: 'Broccoli', speed: 4, handling: 2, offroad: 3, intangibles: 3, color: '#3d8a3a', voice: H, pitch: 220 },
  { id: 'devin', name: 'Devin', quip: "Posh and a little muddy. Also orange.", type: 'Carrot car', speed: 4, handling: 5, offroad: 3, intangibles: 3, color: '#f07f1f', voice: H, pitch: 280 },
  { id: 'kristin', name: 'Kristin', quip: "Packed snacks. Packed ambition. Whipped cream.", type: 'Pumpkin pie slice', speed: 1, handling: 4, offroad: 4, intangibles: 3, color: '#e8903a', voice: H, pitch: 330 },
  { id: 'ro', name: 'Grandma Ro', quip: "Peace, love, and cheese ball.", type: 'Cheeseball', speed: 1, handling: 3, offroad: 3, intangibles: 3, color: '#b99be8', voice: H, pitch: 700 },
  { id: 'agnes', name: 'Agnes', quip: "Cute. Suspiciously cute. Sprinkles.", type: 'Cupcake', speed: 2, handling: 4, offroad: 3, intangibles: 5, color: '#ff3fa4', voice: H, pitch: 600 },
  { id: 'wallace', name: 'Wallace', quip: "Zero to zoom. Brick by brick.", type: 'Battleship on wheels', speed: 5, handling: 5, offroad: 5, intangibles: 5, color: '#9be22b', voice: H, pitch: 440 },
  { id: 'rufus', name: 'Rufus', quip: "Good boy. Fast enough. Has a drumstick.", type: 'Drumstick dog', speed: 3, handling: 4, offroad: 3, intangibles: 3, color: '#d2a15f', voice: 'bark' },
  { id: 'fika', name: 'Fika', quip: "Small poodle. Big opinions. Black as coffee.", type: 'Poodle on a roll', speed: 3, handling: 4, offroad: 2, intangibles: 4, color: '#26262b', voice: 'yip' },
];

export const TRACKS = [
  {
    id: 'patch', name: 'Pumpkin Patch Pass',
    blurb: 'A bumpy run through a harvest field of pumpkins, corn stalks and hay bales. Watch out for the big orange ones!',
    hint: 'Rewards dishes that can climb over rough terrain.',
    tags: ['Orange', 'Bumpy', 'Corny'],
    jumps: [0.43],
    weights: { speed: 0.2, handling: 0.25, offroad: 0.55 },
    zones: [
      { from: 0.2, to: 0.36, stat: 'offroad', name: 'Pumpkin Pile', kind: 'pumpkins' },
      { from: 0.5, to: 0.64, stat: 'handling', name: 'Hay Bale Maze', kind: 'hay' },
      { from: 0.76, to: 0.9, stat: 'offroad', name: 'Squash Bumps', kind: 'pumpkins' },
    ],
  },
  {
    id: 'gravy', name: 'Gravy River Run',
    blurb: 'A rushing river of gravy winding past mashed potato mountains with butter on top. Hold on to your napkin!',
    hint: 'Rewards dishes that are fast, fast, fast.',
    tags: ['Saucy', 'Buttery', 'Zoomy'],
    jumps: [0.41],
    weights: { speed: 0.55, handling: 0.25, offroad: 0.2 },
    zones: [
      { from: 0.2, to: 0.34, stat: 'speed', name: 'Gravy Rapids', kind: 'gravy' },
      { from: 0.48, to: 0.62, stat: 'handling', name: 'Mashed Potato Slalom', kind: 'mash' },
      { from: 0.75, to: 0.9, stat: 'speed', name: 'Gravy Falls', kind: 'gravy' },
    ],
  },
  {
    id: 'bog', name: 'Cranberry Bog Trail',
    blurb: 'A winding trail through autumn trees and a squishy cranberry bog. Twisty turns and leaf piles everywhere!',
    hint: 'Rewards dishes that handle the twists and turns well.',
    tags: ['Twisty', 'Leafy', 'Squishy'],
    jumps: [0.39],
    weights: { speed: 0.25, handling: 0.55, offroad: 0.2 },
    zones: [
      { from: 0.18, to: 0.32, stat: 'handling', name: 'Leaf Pile Switchbacks', kind: 'leaves' },
      { from: 0.46, to: 0.6, stat: 'offroad', name: 'Cranberry Bog', kind: 'bog' },
      { from: 0.74, to: 0.88, stat: 'handling', name: 'Hairpin Turkey Crossing', kind: 'signs' },
    ],
  },
  {
    id: 'field', name: 'Football Field Dash',
    blurb: 'A race up the gridiron under the lights, past goalposts, banners and a very loud crowd. Hut hut, gravy!',
    hint: 'A little bit of everything, with a fast finish.',
    tags: ['Gridiron', 'Loud', 'Cheesy'],
    jumps: [0.42],
    weights: { speed: 0.5, handling: 0.3, offroad: 0.2 },
    zones: [
      { from: 0.2, to: 0.34, stat: 'speed', name: 'Fifty Yard Dash', kind: 'yards' },
      { from: 0.48, to: 0.62, stat: 'handling', name: 'Blitz Line', kind: 'signs' },
      { from: 0.75, to: 0.9, stat: 'offroad', name: 'Muddy Goal Line', kind: 'mud' },
    ],
  },
  {
    id: 'table', name: 'The Long Table', finalOnly: true,
    blurb: 'The championship course: all the way down the dining table, between candles, past the wine glasses, and straight to the pie.',
    hint: 'A true all-rounder test: speed, handling and rough patches all matter.',
    tags: ['Candlelit', 'Fancy', 'Legendary'],
    jumps: [0.4],
    weights: { speed: 0.34, handling: 0.33, offroad: 0.33 },
    zones: [
      { from: 0.18, to: 0.32, stat: 'speed', name: 'Gravy Boat Stream', kind: 'gravy' },
      { from: 0.48, to: 0.62, stat: 'offroad', name: 'Crumb Field', kind: 'crumbs' },
      { from: 0.74, to: 0.88, stat: 'handling', name: 'Candle Chicane', kind: 'candles' },
    ],
  },
];
export const RACE_TRACKS = TRACKS.filter((t) => !t.finalOnly);
export const FINAL_TRACK = TRACKS.find((t) => t.finalOnly);

// Silly facts read before each race. {n} becomes the racer's name. Heidi and Alex are the Huskies fans.
export const FACTS = {
  allen: [
    '{n} is the boss, and she brought two kinds of pie.',
    '{n} brought the apple pie, the pumpkin pie, the spinach Gü, and also the table gear.',
    '{n} has never once been late to a pie.',
    '{n} signs off on the gravy before anyone else gets to touch it, and her word is final.',
    '{n} thinks the table gear is a very serious department.',
    '{n} says a good boss always cuts the first slice, evenly.',
  ],
  frank: [
    '{n} can tell you what year the first Thanksgiving race was held, and it is wrong.',
    '{n} is carrying Grandma Miller\'s white fluffy cake, and nobody is allowed to look at it funny.',
    '{n} knows more about the Pilgrims than the Pilgrims did.',
    '{n} is helping with the smashed potatoes, but Heidi has the ingredients.',
    '{n} reads the historical plaque on every dessert.',
    '{n} thinks the cake deserves a museum.',
  ],
  zanni: [
    '{n} wrote a poem about green beans, and she says it rhymes with everything.',
    '{n} brought bread, a green bean casserole, and maybe a mango pie. Maybe.',
    '{n} recites sonnets to the crispy onions.',
    '{n} says the casserole has a soul and a crunchy top.',
    '{n} is a very good poet, and her bread dunking is even better.',
    '{n} has promised mango pie, but nobody will believe it until they see it.',
  ],
  alex: [
    '{n} is very tall, so he carves the turkey from a great height.',
    '{n} brought turkey two ways, wine, and the glasses to drink it from.',
    '{n} has never once bumped into a doorway, but it is close.',
    '{n} is a Huskies fan, and he has learned to change the subject when Penn State comes up.',
    '{n} says the Huskies earned that win. The rest of the table says luck, and a few friendly refs.',
    '{n} carves a turkey from a standing start without a stepladder.',
  ],
  heidi: [
    '{n} threw the discus, and the cheese wheel is next.',
    '{n} brought cheeses, crackers, cured meats, cranberry sauce, cauliflower gratin, harissa brussels sprouts, stuffing, and the potato ingredients.',
    '{n} is a Huskies fan, and she has heard everything there is to hear about hometown refs.',
    '{n} insists the Huskies won fair and square, and refuses to discuss Penn State.',
    '{n} made the cranberry sauce from scratch and is not taking questions.',
    '{n} has never met a charcuterie board that could not be won.',
  ],
  fain: [
    '{n} is a new college student, and he has strong opinions about everything.',
    '{n} brought a rhubarb pie, and a plan to install the table leaves.',
    '{n} puts the table leaves in, and takes them out again, without complaining. Much.',
    '{n} knows exactly where every chair should go.',
    '{n} says college is just thanksgiving with homework.',
    '{n} thinks rhubarb is a vegetable that got very lucky.',
  ],
  bode: [
    '{n} is a teenager, and also a piece of broccoli. Both are exhausting, he says.',
    '{n} brought a rhubarb pie, but is racing as broccoli because it is funnier.',
    '{n} helps with the table leaves and the chairs, and sighs the whole time.',
    '{n} says broccoli is the cool vegetable.',
    '{n} wishes everyone would stop asking him to be a good example.',
    '{n} will eat anything, as long as it is not served at the kids table.',
  ],
  devin: [
    '{n} drinks tea with a pinky out.',
    '{n} brought a carrot casserole, a squash thing, and some very delicious soup.',
    '{n} has a favorite puddle, and a favorite soup.',
    '{n} thinks mud is a spa treatment.',
    '{n} has a very fancy horn that plays one note.',
    '{n} orders carrots just to be difficult.',
    '{n} is a Hoosier fan who says Indiana is the best at football.',
  ],
  kristin: [
    '{n} has seven snacks hidden in the glove box.',
    '{n} brought a pumpkin chiffon pie, a salad, a vegetable dish, and a block of Cougar Gold.',
    '{n} knows every campsite by its smell, and every cheese by its can.',
    '{n} says the Cougar Gold is the best cheese in the Pacific Northwest.',
    '{n} carries a spare pair of wool socks for emergencies.',
    '{n} thinks mountains are just very big speed bumps.',
  ],
  ro: [
    '{n} created a cheeseball, and refuses to be rushed.',
    '{n} knits tiny sweaters for the other dishes.',
    '{n} has a cracker for every occasion.',
    '{n} makes the best peace sign in the whole race.',
    '{n} says a cheeseball is just a hug you can slice.',
    '{n} once hugged a tree to say thank you.',
  ],
  agnes: [
    '{n} made the place cards, and each one has a tiny drawing.',
    '{n} set the table, and counted the forks twice.',
    '{n} collects tiny hats for bugs.',
    '{n} believes pink is a flavor.',
    '{n} honked at a cloud for being too slow.',
    '{n} thinks every cupcake deserves a cherry and a getaway car.',
  ],
  wallace: [
    '{n} brought battleship sculptures to the table, and they are very seaworthy.',
    '{n} helped set the table and sank the competition, B7 and all.',
    '{n} likes corn!',
    '{n} thinks every road is a runway.',
    '{n} sleeps with the headlights on.',
    '{n} says the secret ingredient is lime pudding.',
  ],
  rufus: [
    '{n} is a very good boy.',
    '{n} has been staring at the turkey since breakfast.',
    '{n} will race for a tennis ball, or a drumstick.',
    '{n} wags that tail whenever going around a corner.',
    '{n} has strong opinions about who is dropping crumbs.',
    '{n} would like a belly rub at the next pit stop.',
  ],
  fika: [
    '{n} is a small black poodle with a very big opinion.',
    '{n} rides a dinner roll because the floor is for amateurs.',
    '{n} yips at the oven when no one is looking.',
    '{n} is fluffy, fast, and slightly suspicious of the gravy.',
    '{n} has one goal, and it is the turkey skin.',
    '{n} is sure to be much bigger than Rufus.',
  ],
};
export const SPARE_FACTS = [
  '{n} is afraid of cranberry sauce, but only on Tuesdays.',
  '{n} once raced a gravy boat, and the gravy boat won.',
  '{n} has a secret handshake with the pie.',
];

export const tdayTheme = {
  id: 'tday',
  CARS, TRACKS, RACE_TRACKS, FINAL_TRACK, FACTS, SPARE_FACTS,
  DRAW: DRAW_TDAY, scenes: SCENES_TDAY, zoneKinds: ZONES_TDAY, lines: LINES_TDAY,
  cupName: 'Turkey Cup',
  noun: 'dish', nouns: 'dishes',
  finalIcon: '🕯️',
  champIcon: '🦃',
  shouts: ['GOBBLE!', 'PASS THE GRAVY!', 'SECONDS!', 'YUM!'],
  storageKey: 'turkeycup.tournament.v1',
  exportPrefix: 'turkey-cup',
  readyHtml: '🦃 Drivers, start your ovens!',
  canvas: { mat: 'rgba(80,40,20,0.12)', matStripe: '#b3361f', label: '#3b2417', shout: '#ffc93c', shoutInk: '#3b2417' },
};
