# Ragdoll Rivals

Bradley Errock's original automatic medieval ragdoll fighting game. Configure a fighter, spend exactly 15 points, choose one of seven styles and any legal equipment, then watch the server-authoritative duel. No copied assets, in-fight controls, unlocks or paid advantages.

## Run locally

```sh
npm ci
npm start
```

Open http://localhost:3000. `GET /health` returns `{"ok":true,"version":"1.0.0"}`.

## Verify

```sh
npm test
npx playwright install chromium
npm run test:browser
```

The browser suite saves desktop, phone portrait and short landscape screenshots in `screenshots/`. It checks allocation, legal equipment, computer combat, Back navigation, overflow and console errors.

## Architecture

- `shared/rules.js` (copied to `public/rules.js` for the browser): strict build validation, gear and derived stats.
- `server/combat.js`: Matter.js articulated fighters, style decisions, bounded attack hits, stamina and results.
- `server/rooms.js`: six-character private rooms, 30 Hz simulation, 15 Hz snapshots, disconnects and rematches.
- `server/index.js`: Express static hosting, health and `ws` transport.
- `public/`: original Canvas vector art, responsive builder, HUD and install metadata.

Design decisions and limits are recorded in `docs/design.md`; the staged implementation plan is in `docs/plan.md`. V1 has no reconnect token, persistence, accounts or spectators. Fights can draw at the time limit. Balance needs playtesting.

## Deployment

`render.yaml` describes one free Node web service. A free service may sleep. Rooms live in memory and are lost on restart.
