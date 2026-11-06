# Ragdoll Rivals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This approved run explicitly uses inline local execution; cloud agents are forbidden.

**Goal:** Locally verify an original autonomous ragdoll duel with character builds, computer matches and private-code rooms.

**Architecture:** Pure shared rules derive legal builds. Matter.js authoritative combat feeds a room service; a dependency-free browser client renders setup and Canvas fights.

**Tech Stack:** Node 24, Express 5, Matter.js 0.20, ws 8, Node test runner, Playwright, vanilla JavaScript.

## Global Constraints
Exactly 15 points; five stats; seven styles; all gear unlocked; no claymore shield; no fight controls; one service; original art; British English; no remote repo/deploy.

### Task 1 — Shared rules
**Files:** `shared/rules.js`, `tests/rules.test.js`, `package.json`.
**Produces:** `validateBuild(value)`, `normaliseBuild(value)`, `deriveStats(build)`, `GEAR`, `STYLES`.
- [ ] Test 15 points valid, 14/16 invalid, claymore shield invalid and plate slower than mail. Run and observe missing-module failure.
- [ ] Implement strict integer/name/gear checks and documented formulas. Run green; commit `feat: add shared fighter build rules`.

### Task 2 — Physics and style AI
**Files:** `server/combat.js`, `tests/combat.test.js`.
**Produces:** `createMatch(a,b,{seed,mode})`, `stepMatch(match)`, status/winner/metrics.
- [ ] Test real jointed duel result, all seven style counters and aggressive/evasive aggregate differences. Observe missing-module failure.
- [ ] Implement connected bodies, ground, weapon constraints, bounded hit damage, stamina, AI and 75-second result. Run seeded tests green; commit `feat: simulate autonomous jointed ragdoll battles`.

### Task 3 — HTTP and real WebSocket rooms
**Files:** `server/index.js`, `server/rooms.js`, `tests/rooms.test.js`.
**Produces:** `createServer()` and the documented protocol.
- [ ] Two real clients test create/join/snapshot, invalid code, disconnect and rematch; add computer. Observe missing-module failure.
- [ ] Implement 30 Hz match, 15 Hz broadcast, 32 KiB JSON, lifecycle and result. Run green with closed handles; commit `feat: add private room and computer match server`.

### Task 4 — Responsive original browser client
**Files:** `public/*`, generated icons, `tests/browser.js`.
- [ ] Playwright asserts desktop/mobile setup, allocator, illegal gear prevention, computer start/Back/result, no overflow or console errors. Observe missing-page failure.
- [ ] Implement vector equipment/ragdolls, interpolation, HUD, room/rematch, fullscreen/install metadata. Run green and save/inspect screenshots; commit `feat: add responsive ragdoll arena interface`.

### Task 5 — Final evidence
**Files:** `render.yaml`, `README.md`.
- [ ] Run clean `npm ci`, full tests and browser suite; record counts.
- [ ] Start service and verify `/health`, page, manifest and worker. Check `git diff --check` and status; commit and report HEAD. No remote, push or deploy.
