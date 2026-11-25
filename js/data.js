// Cars and tracks for The Wally Cup.
// Ratings are 1-5. They are intentionally never shown to players.

export const CARS = [
  { id: 'wallace', quip: "Zero to zoom.", name: 'Wallace', speed: 5, handling: 5, offroad: 5, intangibles: 5, type: 'Aerodynamic race car', color: '#9be22b' },
  { id: 'agnes', quip: "Cute. Suspiciously cute.", name: 'Agnes', speed: 2, handling: 4, offroad: 3, intangibles: 5, type: 'Slug bug', color: '#ff3fa4' },
  { id: 'kristin', quip: "Packed snacks. Packed ambition.", name: 'Kristin', speed: 1, handling: 4, offroad: 4, intangibles: 3, type: 'Subaru wagon', color: '#26262b' },
  { id: 'devin', quip: "Posh and a little muddy.", name: 'Devin', speed: 4, handling: 5, offroad: 3, intangibles: 3, type: 'Range Rover', color: '#13a8a0' },
  { id: 'tyson', quip: "Floats like a couch.", name: 'Tyson', speed: 1, handling: 1, offroad: 1, intangibles: 3, type: 'Cadillac sedan', color: '#8e949c' },
  { id: 'kady', quip: "Silent, but smug.", name: 'Kady', speed: 4, handling: 3, offroad: 2, intangibles: 3, type: 'Tesla sedan', color: '#2f6fe4' },
  { id: 'nolan', quip: "Will dump on anyone.", name: 'Nolan', speed: 2, handling: 2, offroad: 2, intangibles: 3, type: 'Dump truck', color: '#ff8a1f' },
  { id: 'jack', quip: "Pointy. Very pointy.", name: 'Jack', speed: 5, handling: 3, offroad: 3, intangibles: 3, type: 'Cybertruck', color: '#c5ccd4' },
  { id: 'josie', quip: "Ding-a-ling, here I come!", name: 'Josie', speed: 2, handling: 1, offroad: 1, intangibles: 3, type: 'Ice cream truck', color: '#e9f6ff', accent: '#79c8f0' },
  { id: 'nancy', quip: "Crushes cars. Also cookies.", name: 'Grandma Nancy', speed: 3, handling: 1, offroad: 1, intangibles: 3, type: 'Monster truck', color: '#ffd21f' },
  { id: 'ro', quip: "Peace, love, and tailgating.", name: 'Grandma Ro', speed: 1, handling: 3, offroad: 3, intangibles: 3, type: 'VW van', color: '#b99be8' },
  { id: 'rufus', quip: "Good boy. Fast enough. Very good boy.", name: 'Rufus', speed: 3, handling: 4, offroad: 3, intangibles: 3, type: 'Dog car', color: '#d2a15f' },
  { id: 'juju', quip: "Everyone is my best friend. Yes, you too.", name: 'Juju', speed: 3, handling: 3, offroad: 4, intangibles: 4, type: 'Golden retriever car', color: '#e9a93a' },
  { id: 'archie', quip: "Chonky boss. Ignores you. Ate your lunch.", name: 'Archie', speed: 2, handling: 2, offroad: 3, intangibles: 4, type: 'Counter-surfing dog car', color: '#2b2b35', voice: 'woof' },
  { id: 'chuck', quip: "MEOW. Meow. MEOW MEOW.", name: 'Chuck', speed: 3, handling: 4, offroad: 2, intangibles: 3, type: 'Loudmouth tabby cat car', color: '#7a808c', voice: 'meow' },
  { id: 'kim', quip: "Fast. Loud. Very, very red.", name: 'Kim', speed: 5, handling: 4, offroad: 1, intangibles: 3, type: 'Lamborghini', color: '#ff2a1a' },
];

// `weights` say how much each car stat matters on that track (they sum to 1).
// `zones` are stretches of the course where one stat matters even more,
// and where cars are more likely to spin out if they are weak at it.
export const TRACKS = [
  {
    id: 'desert',
    name: 'Cactus Canyon',
    blurb: 'A scorching desert run through cactuses, sand dunes and boulder fields. Rocks, bumps and loose sand everywhere!',
    hint: 'Rewards cars that can climb over rocks and rough terrain.',
    tags: ['Rocky', 'Sandy', 'Bumpy'],
    jumps: [0.43],
    weights: { speed: 0.2, handling: 0.25, offroad: 0.55 },
    zones: [
      { from: 0.2, to: 0.36, stat: 'offroad', name: 'Boulder Field', kind: 'rocks' },
      { from: 0.5, to: 0.64, stat: 'offroad', name: 'Soft Sand Pit', kind: 'sand' },
      { from: 0.76, to: 0.9, stat: 'offroad', name: 'Rocky Ridge', kind: 'rocks' },
    ],
  },
  {
    id: 'sea',
    name: 'Deep Blue Dash',
    blurb: 'A race on the ocean floor with water all around and schools of colorful fish zipping past. Bubbles, currents and a whole lot of splash!',
    hint: 'Rewards cars that are fast, fast, fast.',
    tags: ['Underwater', 'Fishy', 'Zoomy'],
    jumps: [0.41],
    weights: { speed: 0.55, handling: 0.25, offroad: 0.2 },
    zones: [
      { from: 0.2, to: 0.34, stat: 'speed', name: 'Rip Current', kind: 'current' },
      { from: 0.48, to: 0.62, stat: 'handling', name: 'Kelp Slalom', kind: 'kelp' },
      { from: 0.75, to: 0.9, stat: 'speed', name: 'Rocket Stream', kind: 'current' },
    ],
  },
  {
    id: 'forest',
    name: 'Pine Ridge Trail',
    blurb: 'A winding trail through tall pine trees. Twisty turns, tight switchbacks and muddy patches test every driver.',
    hint: 'Rewards cars that handle the twists and turns well.',
    tags: ['Twisty', 'Piney', 'Muddy'],
    jumps: [0.39],
    weights: { speed: 0.25, handling: 0.55, offroad: 0.2 },
    zones: [
      { from: 0.18, to: 0.32, stat: 'handling', name: 'Hairpin Turns', kind: 'signs' },
      { from: 0.46, to: 0.6, stat: 'offroad', name: 'Mud Pit', kind: 'mud' },
      { from: 0.74, to: 0.88, stat: 'handling', name: 'Switchbacks', kind: 'signs' },
    ],
  },
  // Championship-only track (hidden from the free-play track picker).
  {
    id: 'rainbow',
    name: 'Rainbow Road',
    finalOnly: true,
    blurb: 'A glowing ribbon of color winding through outer space. Only the very best ever race here.',
    hint: 'A true all-rounder test: speed, handling and rough patches all matter.',
    tags: ['Cosmic', 'Sparkly', 'Legendary'],
    jumps: [0.4],
    weights: { speed: 0.34, handling: 0.33, offroad: 0.33 },
    zones: [
      { from: 0.18, to: 0.32, stat: 'speed', name: 'Warp Stream', kind: 'current' },
      { from: 0.48, to: 0.62, stat: 'offroad', name: 'Star Bumps', kind: 'stars' },
      { from: 0.74, to: 0.88, stat: 'handling', name: 'Neon Chicane', kind: 'signs' },
    ],
  },
];

export const STAT_NAMES = ['speed', 'handling', 'offroad'];

export const RACE_TRACKS = TRACKS.filter((t) => !t.finalOnly);
export const FINAL_TRACK = TRACKS.find((t) => t.finalOnly);
