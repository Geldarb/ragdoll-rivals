# Ragdoll Rivals 1.3 Implementation Plan

> Inline local execution is explicitly approved; cloud agents are unavailable. Each stage is committed separately and verified before merge.

**Goal:** visibly distinct weapons/styles/stats, less folding, richer original art and cinematic but authoritative presentation.
**Architecture:** shared immutable catalogue; pure style/pose profiles plus physical rig; bounded separation/joint solver; existing authoritative 30 Hz rooms; modular Canvas art and presentation/audio layered over snapshots.
**Tech:** Node, Matter.js, ws, Canvas 2D, WebAudio, Node test runner, Playwright.

## Constraints
Exactly fifteen points, every weapon unlocked, legal handedness on both sides, one existing free service, no copied assets, same duel state for both clients. User additionally approved camera/impact/pacing/replay/presets/results.

## Stages
- [ ] 1. `shared/rules.js`, `tests/variety.test.js`: six weapon definitions and handedness tests; real flail chain and twin rig; commit after legality/rig tests.
- [ ] 2. `server/styles.js`, `server/poses.js`, `server/locomotion.js`, `server/joint-limits.js`: style-specific decisions and authored poses; speed/strength/exhaustion effects; spacing/joint constraints; seeded quantitative tests. Preserve prior tests, updating catalogue expectations.
- [ ] 3. `tests/evaluate-variety.js`: mirrored seeded weapon round robin and style/stat metrics, draw rate, table JSON. Tune only from measured results. Report sample sizes and uncertainty, not universal balance claims.
- [ ] 4. `public/art.js`, `public/preview.js`: original shaded anatomy, heraldry, detailed gear, new models and readable courtyard; inspect actual 390x664/1280x800 captures and montage. Commit.
- [ ] 5. `public/presentation.js`, `public/audio.js`, client/screens and server hit timing: follow/zoom camera, hit-stop/slow-mo/events, sparks/light blood/debris, synthetic muteable sound, replay, presets/randomise/live preview, winner and fight stats. Tests for authoritative metrics/events, mute persistence and setup/rematch. Commit.
- [ ] 6. clean install/full tests/browser checks; version root metadata 1.3.0 only; PR and approved merge; same service auto-deploy; commit-aware health, live browser/WebSockets, live montage and evidence under screenshots/live-1.3.

## Evidence policy
Weapon win rates count draws as half a win and state the draw rate separately. Evaluation mirrors sides and rotates styles/armour; a 35–65% target is a finite-sample release gate, not proof of perfect balance. Style differentiation uses actual simulated spacing/attack/block/travel/dodge measurements, not merely different constants. Screenshots must include combat and setup, and be inspected before reporting quality.
