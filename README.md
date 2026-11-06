# Ragdoll Rivals

Bradley Errock's original automatic medieval ragdoll fighting game. Configure a fighter, spend exactly 15 points, choose one of seven styles and any legal equipment, then watch the server-authoritative duel. No copied assets, in-fight controls, unlocks or paid advantages.

## Run locally

```sh
npm ci
npm start
```

Open http://localhost:3000. `GET /health` returns `{"ok":true,"version":"1.3.0","commit":"local"}` (Render supplies the deployed Git SHA).

## Verify

```sh
npm test
npx playwright install chromium
npm run test:browser
node tests/variety-browser.js
npm run test:balance
```

The browser suite saves desktop, phone portrait and short landscape screenshots in `screenshots/`. It checks allocation, legal equipment, computer combat, Back navigation, overflow and console errors.

## Architecture

- `shared/rules.js` (copied to `public/rules.js` for the browser): strict build validation, gear and derived stats.
- `server/combat.js`: Matter.js articulated fighters, style decisions, bounded attack hits, stamina and results.
- `server/rooms.js`: six-character private rooms, 30 Hz simulation, 30 Hz compact snapshots with 100 ms client interpolation, disconnects and rematches.
- `server/index.js`: Express static hosting, health and `ws` transport.
- `server/styles.js`, `poses.js`, `locomotion.js`, `joint-limits.js`: tactical style decisions, authored active-ragdoll motion, fatigue and physiological constraints.
- `public/`: original detailed Canvas art, adaptive follow camera, synthesised audio, legal presets, animated builder, snapshot replay, fight-stat results and install metadata.

Design decisions and limits are recorded in `docs/design.md`; the staged implementation plan is in `docs/plan.md`. V1 has no reconnect token, persistence, accounts or spectators. Fights can draw at the time limit. Balance needs playtesting.

## Deployment

`render.yaml` describes one free Node web service. A free service may sleep. Rooms live in memory and are lost on restart.

## v1.3 live evidence

Live: https://ragdoll-rivals.onrender.com (the same single free service). Expanded to eleven unlocked weapons; all seven styles and five stats influence motion as well as rules. Release measurements and limitations: `docs/design.md`, `docs/evidence/variety-1.3.json`, `screenshots/live-1.3/`. `tests/variety-browser.js`, `tests/capture-variety.js` and `tests/live-websocket.js` accept `LIVE_URL` and `SHOTS` for reproducible live checks.
