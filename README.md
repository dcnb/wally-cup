# 🏆 The Wally Cup

A family racing game for the Beckers + Ro. Pick a track, pick 2–4 racers (their stats are secret!), and watch the race.

**Play:** enable GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/ (root)`), then open `https://dcnb.github.io/wally-cup/`.

No server, no build. Plain HTML/CSS/JS with canvas. The only storage is the browser's `localStorage`, used by Tournament mode.

## Tournament mode
Hit **🏆 TOURNAMENT** on the home screen. Pick who's in (4+), and everyone is shuffled into a random single-elimination bracket (byes are handed out when the field isn't a power of 2). Each match gets a random track when the bracket is drawn; the championship is always on Rainbow Road.

- Click any lit-up match to run it, whenever you like. Progress is saved in this browser, so you can close the tab and come back.
- Every race gets announcer hype; the champion is serenaded with fireworks.
- **Export JSON** from the bracket screen (or the champion screen) to save a copy, **Import JSON** to load one back, and **New tournament** (click twice) to clear and start over.
- Tournament races use `TOURNEY_CONFIG` in `js/sim.js`: every racer's hidden stats are squeezed toward the middle and re-rolled at the start of each race, plus extra luck, so upsets are common. Wallace keeps a modest edge. Tune `statSquash` (1 = real stats, 0 = identical) and `statJitter` to taste.

## Run locally
```
python3 -m http.server 8080   # then open http://localhost:8080
```
(ES modules need a web server; opening index.html directly from disk won't work.)

**No server?** Double-click `play.html`. It loads a single bundled script (`dist/game.js`), so it works from disk. After editing anything in `js/`, run `npm run build` (or `node tools/bundle.mjs`) to refresh it. The Thanksgiving page still needs a server.

## Tweak it
- `js/data.js` — cars (stats 1–5, colors) and tracks (what stats matter, hazard zones)
- `js/sim.js` — `CONFIG` holds luck, spin-out and comeback knobs
- `node test/balance.mjs` — runs thousands of headless races to check the balance
- `node test/bracket.mjs` — checks bracket building, byes, advancement and export
