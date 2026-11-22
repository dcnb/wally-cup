// Tournament mode: setup, bracket screen, match flow, export, champion celebration.
import { theme, factFor } from './theme.js';
import { buildBracket, isReady, nextReady, recordResult, roundCount, validateTournament } from './bracket.js';
import { loadTournament, saveTournament, clearTournament, downloadFile } from './storage.js';
import { startRace } from './race.js';
import { TOURNEY_CONFIG } from './sim.js';
import { showChampion } from './champion.js';
import { sfx } from './sound.js';
import { announcer, LINES } from './announcer.js';

const $ = (id) => document.getElementById(id);
const car = (id) => theme.CARS.find((c) => c.id === id);
const track = (id) => theme.TRACKS.find((t) => t.id === id);
const dotColor = (c) => (c.color === '#26262b' ? '#6b6f80' : c.color);

export function initTournament({ show, setRaceRun, setResultRun }) {
  let t = loadTournament();
  let picks = new Set(theme.CARS.map((c) => c.id));
  let current = null;      // match on the race screen
  let confirmTimer = 0;

  // ---------- setup ----------
  function renderSetup() {
    const wrap = $('tRoster');
    wrap.innerHTML = '';
    for (const c of theme.CARS) {
      const b = document.createElement('button');
      b.className = 't-chip' + (picks.has(c.id) ? ' on' : '');
      b.setAttribute('aria-pressed', picks.has(c.id));
      b.innerHTML = `<span class="dot" style="background:${c.color}"></span>${c.name}`;
      b.addEventListener('click', () => { picks.has(c.id) ? picks.delete(c.id) : picks.add(c.id); sfx.pick(); renderSetup(); });
      wrap.appendChild(b);
    }
    const n = picks.size;
    $('tCount').textContent = `${n} racers in`;
    $('tBuild').disabled = n < 4;
    $('tBuild').textContent = n < 4 ? 'Pick at least 4 racers' : `🎲 DRAW THE BRACKET (${n})`;
  }

  // ---------- bracket ----------
  const roundLabel = (r) => LINES.roundName(r, roundCount(t)).replace(/^the /, '').toUpperCase();

  function side(m, id, other) {
    if (!id) return `<div class="side tbd">${m.round === 0 ? 'BYE' : 'TBD'}</div>`;
    const c = car(id);
    const cls = m.winner ? (m.winner === id ? 'win' : 'lose') : '';
    return `<div class="side ${cls}"><span class="dot" style="background:${c.color}"></span>${c.name}</div>`;
  }

  function renderBracket() {
    const root = $('bracket');
    root.innerHTML = '';
    t.rounds.forEach((ms, r) => {
      const col = document.createElement('div');
      col.className = 'b-round' + (r === t.rounds.length - 1 ? ' final' : '');
      col.innerHTML = `<h3>${roundLabel(r)}</h3>`;
      const list = document.createElement('div'); list.className = 'b-matches';
      for (const m of ms) {
        const el = document.createElement(isReady(m) ? 'button' : 'div');
        el.className = 'match' + (isReady(m) ? ' ready' : '') + (m.bye ? ' bye' : '') + (r === t.rounds.length - 1 ? ' final' : '');
        el.innerHTML = `<div class="trk">${r === t.rounds.length - 1 ? theme.finalIcon + ' ' : ''}${track(m.track).name}</div>${side(m, m.a)}${side(m, m.b)}${isReady(m) ? '<span class="go">RACE!</span>' : ''}`;
        if (isReady(m)) el.addEventListener('click', () => openModal(m));
        list.appendChild(el);
      }
      col.appendChild(list);
      root.appendChild(col);
    });
    const all = t.rounds.flat();
    const played = all.filter((m) => m.winner && !m.bye).length, total = all.filter((m) => !m.bye).length;
    $('tStatus').textContent = t.champion ? `🏆 ${car(t.champion).name} is the champion!` : `${played} of ${total} races run — click any lit-up match to race it.`;
    $('tNext').hidden = !!t.champion;
    $('tCelebrate').hidden = !t.champion;
  }

  function openBracket() { renderBracket(); show('tBracket'); }

  // ---------- match modal (the hype card) ----------
  function hypeText(m) {
    const a = car(m.a).name, b = car(m.b).name, tr = track(m.track).name;
    const rn = LINES.roundName(m.round, roundCount(t));
    return m.round === roundCount(t) - 1 ? LINES.finalHype(a, b) : LINES.matchup(a, b, rn, tr);
  }

  function openModal(m) {
    current = m;
    const isFinal = m.round === roundCount(t) - 1;
    m._hype = hypeText(m);
    $('mmRound').textContent = isFinal ? `${theme.finalIcon} THE CHAMPIONSHIP ${theme.finalIcon}` : `${LINES.roundName(m.round, roundCount(t))} · Match ${m.index + 1}`;
    $('mmVs').textContent = `${car(m.a).name}  vs  ${car(m.b).name}`;
    $('mmTrack').textContent = `📍 ${track(m.track).name}`;
    $('mmHype').textContent = `“${m._hype}”`;
    document.querySelector('.modal-card').classList.toggle('final', isFinal);
    $('matchModal').hidden = false;
    sfx.click();
    $('mmGo').focus();
  }
  const closeModal = () => { $('matchModal').hidden = true; };

  function runMatch() {
    const m = current;
    closeModal();
    const cars = [car(m.a), car(m.b)];
    const tr = track(m.track);
    const isFinal = m.round === roundCount(t) - 1;
    const rn = LINES.roundName(m.round, roundCount(t));
    show('race');
    $('raceTitle').textContent = isFinal ? `${theme.finalIcon} CHAMPIONSHIP · ${tr.name}` : `${rn.replace(/^the /, '')} · ${tr.name}`;
    const intro = [
      { lane: -1, html: `🎙️ ${isFinal ? 'THE CHAMPIONSHIP' : rn.toUpperCase()}: ${cars[0].name} vs ${cars[1].name}!`, text: m._hype },
      ...cars.map((c, i) => { const f = factFor(c); return { lane: i, html: `Lane ${i + 1}: <b>${c.name}</b> — ${f.replace(c.name, '').trim() || f}`, text: `In lane ${i + 1} is ${c.name}. ${f}` }; }),
      { lane: -1, html: theme.readyHtml, text: LINES.ready() },
    ];
    inRace = true;
    setRaceRun(startRace({
      cars, track: tr, canvas: $('raceCanvas'), bubble: $('bubble'), ticker: $('ticker'), skipBtn: $('skipIntro'),
      cfg: TOURNEY_CONFIG, intro,
      onDone: (res) => {
        inRace = false; setRaceRun(null);
        recordResult(t, m.id, res.winner.id, res.standings.map((c) => c.id));
        saveTournament(t);
        current = null;
        if (t.champion) { openChampion(); return; }
        openBracket(); sfx.fanfare();
        setTimeout(() => announcer.say(LINES.advance(res.winner.name), 3), 400);
      },
    }));
  }
  let inRace = false;

  // ---------- champion ----------
  function openChampion() {
    show('tChampion');
    sfx.fanfare();
    setResultRun(showChampion({ canvas: $('champCanvas'), car: car(t.champion), runnerUp: t.runnerUp ? car(t.runnerUp) : null }));
  }

  // ---------- export / clear ----------
  const stamp = () => new Date().toISOString().slice(0, 10);
  const exportJSON = () => { if (t) downloadFile(`${theme.exportPrefix}-${stamp()}.json`, JSON.stringify(t, null, 2), 'application/json'); };

  function armClear(btn, label) {
    if (btn.dataset.armed) {
      clearTimeout(confirmTimer); delete btn.dataset.armed; btn.textContent = label;
      clearTournament(); t = null; picks = new Set(theme.CARS.map((c) => c.id));
      renderSetup(); show('tSetup');
      return;
    }
    btn.dataset.armed = '1'; btn.textContent = '⚠ Click again to erase';
    confirmTimer = setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; }, 4000);
  }

  // ---------- import ----------
  let importTimer = 0, pending = null;
  function note(msg) {
    const el = $('importToast'); el.textContent = msg; el.hidden = false;
    clearTimeout(importTimer); importTimer = setTimeout(() => (el.hidden = true), 5000);
  }
  const summary = (x) => {
    const total = x.rounds.flat().filter((m) => !m.bye).length, done = x.rounds.flat().filter((m) => m.winner && !m.bye).length;
    return x.champion ? `finished, won by ${car(x.champion).name}` : `${done} of ${total} races run`;
  };
  function applyImport(x) {
    t = x; saveTournament(t); pending = null;
    $('importModal').hidden = true;
    note(`Imported! Tournament ${summary(t)}.`);
    openBracket();
  }
  async function onFile(file) {
    if (!file) return;
    let x;
    try {
      if (file.size > 2e6) throw new Error('That file is too big to be a tournament.');
      let parsed;
      try { parsed = JSON.parse(await file.text()); } catch { throw new Error("That isn't valid JSON."); }
      x = validateTournament(parsed, theme.CARS.map((c) => c.id), theme.TRACKS.map((tr) => tr.id));
    } catch (err) { sfx.nope(); note(`Couldn't import: ${err.message}`); return; }
    if (t && !t.champion || (t && t.champion && t.id !== x.id)) {
      pending = x;
      $('imMsg').textContent = `You have a tournament saved here (${summary(t)}). Importing replaces it with one that's ${summary(x)}. Export first if you want to keep it.`;
      $('importModal').hidden = false;
      $('imCancel').focus();
    } else applyImport(x);
  }
  const pickFile = () => { sfx.unlock(); $('importFile').value = ''; $('importFile').click(); };
  $('tImport').addEventListener('click', pickFile);
  $('tImportSetup').addEventListener('click', pickFile);
  $('importFile').addEventListener('change', (e) => onFile(e.target.files[0]));
  $('imGo').addEventListener('click', () => pending && applyImport(pending));
  $('imCancel').addEventListener('click', () => { pending = null; $('importModal').hidden = true; });

  // ---------- wiring ----------
  $('tourneyBtn').addEventListener('click', () => {
    sfx.unlock(); sfx.click();
    if (t) openBracket(); else { renderSetup(); show('tSetup'); }
  });
  $('tAll').addEventListener('click', () => { picks = new Set(theme.CARS.map((c) => c.id)); renderSetup(); });
  $('tNone').addEventListener('click', () => { picks = new Set(); renderSetup(); });
  $('tBuild').addEventListener('click', () => {
    t = buildBracket([...picks]);
    saveTournament(t);
    sfx.fanfare();
    openBracket();
    setTimeout(() => announcer.say(LINES.bracketReady(), 3), 300);
  });
  $('tNext').addEventListener('click', () => { const m = nextReady(t); if (m) openModal(m); });
  $('mmGo').addEventListener('click', runMatch);
  $('mmCancel').addEventListener('click', closeModal);
  $('matchModal').addEventListener('click', (e) => { if (e.target.id === 'matchModal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('matchModal').hidden) closeModal(); });
  $('tJson').addEventListener('click', exportJSON);
  $('champJson').addEventListener('click', exportJSON);
  $('tClear').addEventListener('click', (e) => armClear(e.currentTarget, '🗑 New tournament'));
  $('champNew').addEventListener('click', (e) => armClear(e.currentTarget, '🆕 New tournament'));
  $('tCelebrate').addEventListener('click', openChampion);
  $('champBracket').addEventListener('click', openBracket);
  $('champSing').addEventListener('click', () => { sfx.unlock(); setResultRun(null); openChampion(); });

  renderSetup();
  return {
    // Returns true if the quit button was handled (we were in a tournament match).
    handleQuit() { if (!inRace) return false; inRace = false; current = null; openBracket(); return true; },
  };
}
