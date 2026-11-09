# 1.3.1 arm stability evidence

## Matched measurements

Original 1.3 simulation/interpolator reconstructed from immutable commit `e92816d3751caad64436fa6472e359ff4bc600a6`; same 36 seeded fixtures before/after: 12 each of walk, held guard and clash (sword, flail, twin swords and claymore × seeds 5/19/37), ten-second high-HP probes per fixture to prevent early termination; walk/guard isolate the opponent, while clashes retain the real AI and damage/impact rules. Six upper/lower arm/hand angles, wrapped derivatives. Server sampled at 30 Hz; the actual production interpolator sampled at 60 Hz with identical scripted TCP arrival jitter. Acceleration is mean absolute angular acceleration in rad/s². Reversals/s count consecutive angular velocities with opposite signs when both exceed .3 rad/s. Real authored swing/gait acceleration is intentionally retained in the metric; this is not a pure high-pass noise measurement.

Primary table uses body motor strength >.95, identically before/after. Full-ragdoll-inclusive metrics are also reported below and in JSON; no frames are secretly removed to hide impacts.

| Phase | Server acceleration before→after | Server reversals/s before→after | Render acceleration before→after | Render reversals/s before→after |
|---|---:|---:|---:|---:|
| walk | 212.96 → 12.61 | 10.916 → 0.180 | 213.91 → 10.99 | 8.721 → 0.004 |
| guard | 80.17 → 3.61 | 10.046 → 0.008 | 81.47 → 4.27 | 6.732 → 0.000 |
| clash | 229.73 → 31.30 | 10.850 → 0.912 | 229.40 → 27.94 | 9.005 → 0.634 |

Including every intentional ragdoll frame in clashes: server acceleration 201.23 → 35.04; rendered 201.24 → 29.42. Full per-limb metrics, sample counts and source fingerprints are in the two jitter JSON files.

Regression gate: every phase, both server/render, with both normal-only and all-frame masks, must remain below **30% of the recorded 1.3 acceleration AND reversal rate**. Individual-limb acceleration caps are 40/12/85 rad/s² and reversal caps 2/1/3.5 per second for walk/guard/clash, so an aggregate improvement cannot hide one bad arm. The remaining rate includes intended swings/physical hit reactions; zero movement is not the target. Tests also verify monotonic critically damped target response, legal rig/grip geometry, all eleven weapons' actual damage/block registration against a controlled held guard, physical release/200 ms blend, and bounded soft elbow torque rather than angular snapping.

## Controller decisions

- Authored arm/hand/blade bodies are kinematic (Matter static sensors moved continuously). Normal shoulder/elbow/grip constraints are disabled to prevent the contact solver from fighting the animation. Two-hand grip geometry remains exact; flail links/head remain physically simulated but cannot pull a kinematic hand around. Authoritative blade hit volumes and block/damage rules still run on the server. Normal blades use hit sensors/analytic volumes rather than an infinite-mass solid collider; their damage impulse supplies the physical reaction.
- Relative hand/root/weapon targets use exact critically damped filtering (ω48/s normal targets, bounded 650 px/s and 14 rad/s; root separately filtered). On impact the arm bodies become dynamic with inherited bounded velocity. Critical mass/inertia-aware PD support fades out over 180 ms, leaving real ragdoll physics; returning arms blend over 200 ms. During physical release elbow limits use bounded soft torque, never a per-tick Body.setAngle correction. Matter solver iterations increased 8/6→10/8; two 60 Hz substeps remain because normal arm stability no longer needs extra simulation work.
- Client uses bounded monotone Hermite positions, shortest-arc cubic angle interpolation, 30 ms limb-angle exponential smoothing, a 100–180 ms buffer driven by arrival variance, asymptotically eased prediction limited to an 80 ms horizon, and 150 ms recovery correction rather than an underrun snap. All of this is presentation only: neither client can change damage/winners.

## Final balance rerun

Same seven-style mirrored round-robin, rotating armour, 770 duels / 140 appearances per weapon; draws count half. No outcome correction or matchup multipliers. The first authored-arm run put dagger at 65.7%, so its base damage alone changed 7→6.5. All other gear numbers and rules remain unchanged.

| Weapon | Wins / matches | Field rate |
|---|---:|---:|
| dagger | 87/140 | 62.1% |
| sword | 59/140 | 42.1% |
| axe | 86/140 | 61.4% |
| mace | 69/140 | 49.3% |
| claymore | 59/140 | 42.1% |
| spear | 69/140 | 49.3% |
| flail | 71/140 | 50.7% |
| warhammer | 66/140 | 47.1% |
| halberd | 59/140 | 42.1% |
| rapier | 74/140 | 52.9% |
| twinSwords | 71/140 | 50.7% |

770 knockouts, 0 time limits, 0 draws; mean duration 18.39 seconds. Each field rate lies within 35–65%. This finite sample is a tuning gate, not proof of balance for every allocation or matchup.

## Verification limits

Clean install, all previous tests and new tests are rerun before merge; live health, browser/real-socket results, phone video and live random-seed jitter evidence go in `screenshots/live-1.3.1/`. Matched seeded evidence is the causal before/after comparison; live random fights can only corroborate it. Physical Samsung Browser is not available here. Impact ragdolls/legs and real network outages can still move abruptly; client prediction is deliberately short and cannot invent an indefinitely missing fight. Cosmetic flying gear remains cosmetic.
