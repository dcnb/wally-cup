// The Linger: the race freezes for 5-8 seconds while a family says goodbye. And then says it again.
// Carlsons and Altmans linger (opinions differ on who is longer). The Beckers do not linger. They just leave.
// Only active when the theme defines `linger` (see js/themes/carlson.js); every other version is untouched.
import { theme } from './theme.js';
import { announcer, pick } from './announcer.js';
import { sfx } from './sound.js';

// Running score for the whole page session, so the announcer can argue about who is longer.
const tally = { carlson: 0, altman: 0, becker: 0, seconds: { carlson: 0, altman: 0 } };

const TEXT = {
  carlson: {
    open: ['Attention, everyone. The Carlson Linger is now in effect.', 'Warning. This is a Carlson Linger. Please remain seated.', 'It has begun. The Carlson Linger is in effect.'],
    mid: ['Someone just said, one more thing.', 'A Carlson is standing at the door. Not leaving.', 'The coats are on. Nobody has moved.', 'Somebody found one more cat photo.', 'They have hugged twice. They are about to hug again.'],
    end: ['And the Carlson Linger finally lifts.', 'The Linger is over. Probably. Nobody move.', 'Okay! The Carlson Linger has ended. For now.'],
    sub: ['Everyone is saying goodbye. Again.', 'Just one more thing.', 'Coats are on. Nobody is going anywhere.'],
    bubbles: ['one more thing…', 'oh wait!', 'anyway…', 'did I tell you…', 'okay bye! (not bye)', 'we should go…', 'hold on, a photo?', 'bye! bye! …bye!'],
  },
  altman: {
    open: ['Attention, everyone. The Altman Linger is now in effect.', 'Warning. This is an Altman Linger. Please remain seated.', 'It has begun. The Altman Linger is in effect.'],
    mid: ['Someone just said, anyway, as they say.', 'An Altman is standing in the driveway, waving. Still waving.', 'Somebody is telling the story. The second telling.', 'The goodbye has a second act.', 'They have said goodbye. They are now saying it again at the car.'],
    end: ['And the Altman Linger finally lifts.', 'The Linger is over. Probably. Do not make eye contact.', 'Okay! The Altman Linger has ended. For now.'],
    sub: ['Standing in the driveway, waving. Still.', 'One more story. Then one more.', 'Goodbye, part two of five.'],
    bubbles: ['so anyway…', 'one more story!', 'bye! bye! …bye!', 'oh, and another thing', 'okay, we really should go', 'wait, the leftovers!', 'it was so good to see you!', '(still waving)'],
  },
  becker: ['Bye!', 'Already left.', 'We are leaving.', 'Thanks, bye!', 'Got my coat.', '(is in the driveway)'],
  rival: ['Our Linger is longer.', 'Ours is longer, actually.', 'We have not even started.', 'Amateurs.'],
  rivalry: ['Experts disagree on which Linger is longer.', 'The Linger scoreboard is closer than anyone will admit.', 'The debate on whose Linger is longer continues, and it will linger.'],
  becker_line: ['The Beckers do not linger. They just leave.', 'No Linger today. The Beckers are already in the car.', 'A Becker win. Everyone is gone before the confetti lands.'],
};

const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const forced = (() => { try { return new URLSearchParams(location.search).get('linger'); } catch { return null; } })();

export function createLinger({ cars, stage, say }) {
  const cfg = theme.linger;
  const fams = new Set(cars.map((c) => c.family).filter((f) => f === 'carlson' || f === 'altman'));
  // Maybe schedule a surprise linger somewhere in the middle of this race.
  // At most ONE linger per race, and most races have none. Decide up front: mid-race, at the finish, or not at all.
  // (?linger=1 forces a mid-race one, ?linger=finish forces the finish one, for testing.)
  let midAt = null, atFinish = false, used = false;
  if (fams.size) {
    const roll = Math.random();
    if (forced === '1') midAt = 0.2;
    else if (forced === 'finish') atFinish = true;
    else if (roll < cfg.midRaceChance) midAt = 0.3 + Math.random() * 0.4;
    else if (roll < cfg.midRaceChance + cfg.finishChance) atFinish = true;
  }

  const el = document.createElement('div');
  el.className = 'linger'; el.hidden = true; el.setAttribute('role', 'alert');
  el.innerHTML = `<div class="linger-tag"></div><div class="linger-sub"></div><div class="linger-bar"><i></i></div><div class="linger-skip">tap to skip</div>`;
  stage.appendChild(el);
  const q = (s) => el.querySelector(s);

  const lg = {
    active: false, kind: null, t: 0, dur: 0, spoke: 0,
    update(dt) {
      if (!this.active) return;
      this.t += dt;
      q('.linger-bar i').style.transform = `scaleX(${Math.max(0, 1 - this.t / this.dur)})`;
      if (this.spoke === 0 && this.t > this.dur * 0.35) { this.spoke = 1; announcer.say(pick(TEXT[this.kind].mid, 'lgmid'), 2); }
      if (this.t >= this.dur) this.stop(true);
    },
    start(kind, why) {
      if (this.active || used) return;
      used = true;
      this.active = true; this.kind = kind; this.t = 0; this.spoke = 0;
      this.dur = cfg.minSeconds + Math.random() * (cfg.maxSeconds - cfg.minSeconds);
      tally[kind]++;
      const f = cfg.families[kind];
      q('.linger-tag').textContent = `⚠ ${f.name.toUpperCase()} LINGER IN EFFECT ⚠`;
      q('.linger-sub').textContent = pick(TEXT[kind].sub, 'lgsub');
      q('.linger-bar i').style.transform = 'scaleX(1)';
      el.className = `linger ${kind}${REDUCED ? ' still' : ''}`; el.hidden = false;
      sfx.linger();
      say(`⚠️ ${f.name} Linger in effect. Nobody is leaving.`, 'zone', pick(TEXT[kind].open, 'lgopen'), why === 'finish' ? 2 : 3);
      el.onclick = () => { announcer.cancel(); this.stop(true, true); };
    },
    stop(announce, skipped) {
      if (!this.active) return;
      this.active = false; el.hidden = true; el.onclick = null;
      tally.seconds[this.kind] += Math.min(this.t, this.dur);
      if (announce && !skipped) say(`The ${cfg.families[this.kind].name} Linger has ended. (Probably.)`, 'good', pick(TEXT[this.kind].end, 'lgend'), 2);
      this.kind = null;
    },
    // Called once when a racer crosses the line. Returns true if a linger starts.
    onWinner(car) {
      if (atFinish && (car.family === 'carlson' || car.family === 'altman')) { this.start(car.family, 'finish'); return true; }
      return false;
    },
    // Called while racing. Returns the family to linger if the random mid-race moment has arrived.
    midRace(progress) {
      if (midAt == null || used || progress < midAt) return null;
      const list = [...fams];
      return list[(Math.random() * list.length) | 0];
    },
    // What a racer says while the linger is on. `t` is seconds into the linger.
    bubbleFor(car, lane) {
      if (!this.active) return null;
      const idx = Math.floor(this.t / 1.5 + lane);
      if (car.family === 'becker') return TEXT.becker[idx % TEXT.becker.length];
      if (car.family === this.kind) return TEXT[this.kind].bubbles[idx % TEXT[this.kind].bubbles.length];
      if (car.family === 'carlson' || car.family === 'altman') return TEXT.rival[idx % TEXT.rival.length];
      return null;
    },
    destroy() { el.remove(); },
  };
  return lg;
}
