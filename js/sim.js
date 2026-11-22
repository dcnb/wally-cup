// Pure race simulation (no DOM) so it can run in the browser AND in Node for balance testing.

export const CONFIG = {
  length: 1000,          // race length in "units"
  vMin: 34,              // speed (units/sec) of the worst-fit car
  vMax: 39,              // speed of the best-fit car
  zoneBlend: 0.6,        // how strongly a zone's stat overrides track weights while inside it
  surgeAmp: 0.2,
  form: 0.07,            // per-race random 'good day / bad day' for each car        // random +/- speed swings
  surgeEvery: [0.5, 1.1],// seconds between new swing targets
  luckBias: 0.016,       // permanent speed bias per intangibles point above/below 3
  luckyBreakRate: 0.012, // per second, scaled by intangibles
  luckyBreakBoost: 0.3,
  luckyBreakTime: 1.3,
  spinBase: 0.02,       // baseline spin-out chance per second
  spinHandling: 0.03,    // extra spin chance per second for a bad-handling car
  spinZone: 0.13,        // extra spin chance per second in a zone for cars weak at the zone's stat
  spinTime: [1.4, 2.6],  // seconds spinning
  luckSpinRelief: 0.1,   // each intangibles point above 3 cuts spin chance + time by this much
  recoverBoost: 0.25,    // comeback boost after a spin
  recoverTime: 1.8,
  rubber: 0.45,          // catch-up help per fraction-of-track behind the leader
  rubberMax: 0.13,
  immunity: 2.5,         // seconds after a spin before another can happen
  accel: 3.2,
  jumpAir: [0.85, 1.3],   // air time: slow car -> fast car
  landCrash: 0.03,       // base chance of a wobbly landing
  landCrashHandling: 0.16,// extra chance for a bad-handling car
  landBoost: 0.2,        // smooth landing speed bump
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fit = (stat) => (stat - 1) / 4; // 1..5 -> 0..1

export function baseFitness(car, track) {
  const w = track.weights;
  return fit(car.speed) * w.speed + fit(car.handling) * w.handling + fit(car.offroad) * w.offroad;
}

export function zoneAt(track, progress) {
  return track.zones.find((z) => progress >= z.from && progress < z.to) || null;
}

// Tournament mode: more chaos so underdogs have a real shot.
export const TOURNEY_CONFIG = {
  form: 0.24,
  surgeAmp: 0.4,
  luckyBreakRate: 0.03,
  luckyBreakBoost: 0.4,
  spinBase: 0.04,
  rubber: 0.8,
  rubberMax: 0.2,
};

export function createRace(cars, track, rng = Math.random, cfg = null) {
  const range = (a, b) => a + (b - a) * rng();
  const C = cfg ? { ...CONFIG, ...cfg } : CONFIG;
  return {
    t: 0,
    cfg: C,
    track,
    rng,
    range,
    over: false,
    winner: null,
    afterWin: 0,
    leader: -1,
    lastLeadChange: -10,
    cars: cars.map((car, i) => ({
      car,
      lane: i,
      pos: 0,
      v: 0,
      surge: 0,
      form: (rng() * 2 - 1) * C.form,
      surgeTarget: 0,
      surgeTimer: 0,
      spinT: 0,
      spins: 0,
      boostT: 0,
      luckyT: 0,
      immune: 1.5,
      finished: false,
      finishTime: null,
      zoneId: null,
      jumpIdx: 0,
      jumpT: 0,
      jumpDur: 1,
    })),
    events: [],
  };
}

// Advance the race by dt seconds. Returns nothing; pushes to race.events.
export function step(race, dt) {
  const { cars, track, rng, range } = race;
  const C = race.cfg || CONFIG;
  race.t += dt;

  const maxPos = Math.max(...cars.map((c) => c.pos));
  const leaderPos = maxPos;

  for (const s of cars) {
    if (s.finished) {
      // coast over the line
      s.v *= 1 - Math.min(1, dt * 0.6);
      s.pos += s.v * dt;
      continue;
    }
    const luck = s.car.intangibles;
    const progress = s.pos / C.length;
    const zone = zoneAt(track, progress);
    const f = baseFitness(s.car, track);
    const hFit = fit(s.car.handling);
    let fEff = f;
    let zoneFit = 0;
    if (zone) {
      zoneFit = fit(s.car[zone.stat]);
      fEff = f * (1 - C.zoneBlend) + zoneFit * C.zoneBlend;
    }

    // announce zone entry once per car (for UI hype)
    const zid = zone ? zone.name : null;
    if (zid !== s.zoneId) {
      s.zoneId = zid;
      if (zone) race.events.push({ t: race.t, type: 'zone', lane: s.lane, zone });
    }

    s.immune -= dt;

    // --- ramps: launch, fly, land ---
    const jumps = track.jumps || [];
    if (s.jumpT <= 0 && s.spinT <= 0 && s.jumpIdx < jumps.length && progress >= jumps[s.jumpIdx]) {
      s.jumpIdx++;
      s.jumpDur = C.jumpAir[0] + (C.jumpAir[1] - C.jumpAir[0]) * fit(s.car.speed);
      s.jumpT = s.jumpDur;
      s.immune = Math.max(s.immune, s.jumpDur + 0.3);
      race.events.push({ t: race.t, type: 'jump', lane: s.lane });
    }
    if (s.jumpT > 0) {
      s.jumpT -= dt;
      if (s.jumpT <= 0) {
        s.jumpT = 0;
        const relief = Math.max(0.3, 1 - C.luckSpinRelief * (luck - 3));
        if (rng() < (C.landCrash + C.landCrashHandling * (1 - hFit)) * relief) {
          s.spinT = 0.9; s.spins++;
          race.events.push({ t: race.t, type: 'crashland', lane: s.lane });
        } else {
          s.boostT = Math.max(s.boostT, 1.0);
          race.events.push({ t: race.t, type: 'land', lane: s.lane });
        }
      }
    }

    if (s.spinT > 0) {
      s.spinT -= dt;
      s.v *= 1 - Math.min(1, dt * 5);
      if (s.spinT <= 0) {
        s.boostT = C.recoverTime;
        s.immune = C.immunity;
        race.events.push({ t: race.t, type: 'recover', lane: s.lane });
      }
    } else {
      // --- luck: random swings with a bias for lucky cars ---
      s.surgeTimer -= dt;
      if (s.surgeTimer <= 0) {
        s.surgeTarget = (rng() * 2 - 1) * C.surgeAmp + (luck - 3) * C.luckBias;
        s.surgeTimer = range(C.surgeEvery[0], C.surgeEvery[1]);
      }
      s.surge += (s.surgeTarget - s.surge) * Math.min(1, dt * 4);

      // lucky break
      if (s.luckyT <= 0 && rng() < dt * C.luckyBreakRate * (luck / 3) && progress < 0.95) {
        s.luckyT = C.luckyBreakTime;
        race.events.push({ t: race.t, type: 'lucky', lane: s.lane });
      }

      // --- spin out? ---
      if (s.immune <= 0 && progress > 0.04 && progress < 0.96) {
        let rate = C.spinBase + C.spinHandling * (1 - hFit);
        if (zone) rate += C.spinZone * (1 - zoneFit);
        rate *= Math.max(0.3, 1 - C.luckSpinRelief * (luck - 3));
        if (rng() < rate * dt) {
          s.spinT = range(C.spinTime[0], C.spinTime[1]) * Math.max(0.5, 1 - C.luckSpinRelief * (luck - 3));
          s.spins++;
          race.events.push({ t: race.t, type: 'spin', lane: s.lane, zone });
        }
      }

      let mult = 1 + s.surge + s.form;
      if (s.boostT > 0) {
        mult += C.recoverBoost * (s.boostT / C.recoverTime);
        s.boostT -= dt;
      }
      if (s.luckyT > 0) {
        mult += C.luckyBreakBoost * Math.min(1, s.luckyT / 0.4);
        s.luckyT -= dt;
      }
      const behind = (leaderPos - s.pos) / C.length;
      if (behind > 0) mult += Math.min(C.rubberMax, behind * C.rubber);

      const base = C.vMin + (C.vMax - C.vMin) * fEff;
      const target = base * mult;
      if (race.t < 0.8) s.v += (target - s.v) * Math.min(1, dt * 2.5); // quick start
      else s.v += (target - s.v) * Math.min(1, dt * C.accel);
    }

    s.pos += s.v * dt;
    if (s.pos >= C.length) {
      s.pos = C.length;
      s.finished = true;
      s.finishTime = race.t;
      if (!race.winner) {
        race.winner = s;
        race.events.push({ t: race.t, type: 'win', lane: s.lane });
      }
    }
  }

  // lead changes
  let best = 0;
  for (let i = 1; i < cars.length; i++) if (cars[i].pos > cars[best].pos) best = i;
  if (race.leader !== best && cars[best].pos / C.length > 0.05) {
    if (race.leader !== -1 && race.t - race.lastLeadChange > 1.5 && !race.winner) {
      race.events.push({ t: race.t, type: 'lead', lane: best, from: race.leader });
      race.lastLeadChange = race.t;
    }
    race.leader = best;
  }

  if (race.winner) {
    race.afterWin += dt;
    if (race.afterWin > 2.2) race.over = true;
  }
}

export function standings(race) {
  return [...race.cars].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.pos - a.pos;
  });
}

// Run a whole race headlessly (used for balance testing).
export function simulate(cars, track, seed = 1, cfg = null) {
  const race = createRace(cars, track, mulberry32(seed), cfg);
  const dt = 1 / 30;
  while (!race.winner && race.t < 120) step(race, dt);
  return { winner: race.winner.car.id, time: race.t, spins: race.cars.map((c) => c.spins), standings: standings(race).map((s) => s.car.id) };
}
