# 2.0 animation-first combat

Bradley approved this design on 9 November 2026: fully authored standing animation, with Matter.js ragdoll only on knockdown or KO.

## What changed

Standing movement and fighting no longer use physics motors, arm drives or joint-limit projection. A deterministic server-side animation state machine evaluates skeletal poses from eased clips (guard, walk, circle, weapon attacks, blocks, dodges, shoves, hit reactions and get-up). Critically damped hand/weapon filters keep motion continuous. Hit detection sweeps the animated weapon segment against head and torso hitboxes. A capsule push-out (`MIN_SEPARATION` 58 px) prevents body overlap while animated; a wider combat spring keeps preferred spacing so standing fighters do not live inside the 78 px clinch band.

Ragdoll starts only when a hit knocks a fighter down (damage, balance and weight) or scores a KO. Bodies are seeded from the current pose and velocities plus a hit impulse. Knockdown blends back to get-up in about 360 ms. A KO stays ragdoll for the final-blow replay.

1.4 weapon art and sizes, including the zweihander-scale claymore, are unchanged. Style signatures, distance bands, burst/recover rhythm and stat/weight effects on cadence, stride and swing remain.

## Clinch time

A clinch frame is still any animated tick whose torsos are closer than 78 px. Ragdoll and get-up blend frames are excluded (a downed body is not a clinch). From `docs/evidence/variety-2.0.0.json` (eight seeds, both sides):

| Style | 1.4 clinch fraction | 2.0 clinch fraction |
|---|---:|---:|
| aggressive | 0.49% | 0.00% |
| defensive | 0.00% | 0.00% |
| counterattacker | 0.05% | 0.00% |
| evasive | 0.05% | 0.00% |
| balanced | 0.27% | 0.00% |
| berserker | 0.85% | 0.00% |
| patient | 0.07% | 0.00% |
| overall (unweighted mean) | 0.25% | 0.00% |

Standing fighters no longer enter the 78 px band because the combat spring holds them near 84–92 px. A forced close still produces a shove. This is tighter than 1.4's "near zero" result, not a claim that no clinch can ever occur if the spring is later relaxed.

## Jitter

Seeded walk / guard / clash probes, same method as 1.3.1 (`docs/evidence/jitter-after-2.0.0.json`). Gates remain "30% of the reconstructed 1.3.0 baseline" plus per-limb caps.

| Phase | 1.3.1 server accel / rev/s | 2.0 server accel / rev/s |
|---|---|---|
| walk | 12.61 / 0.180 | 8.34 / 0.042 |
| guard | 3.61 / 0.008 | ~0 / 0 |
| clash | 31.30 / 0.912 | 37.56 / 1.414 |

Guard is now a still authored pose, so measured acceleration is numerical noise. Clash is slightly busier than 1.3.1 because full authored strike arcs remain active, but it stays under the 1.3.0×0.30 gate (accel 68.9, reversals 3.26).

## Balance (770 mirrored duels)

Draws count half a win. Field-rate gate 35–65%. 0 draws, 0 timeouts, mean fight 17.5 s.

| Weapon | Win rate | Wins | Matches |
|---|---:|---:|---:|
| Dagger | 37.9% | 53 | 140 |
| Sword | 61.4% | 86 | 140 |
| Axe | 44.3% | 62 | 140 |
| Mace | 51.4% | 72 | 140 |
| Claymore | 49.3% | 69 | 140 |
| Spear | 55.7% | 78 | 140 |
| Flail | 59.3% | 83 | 140 |
| Warhammer | 53.6% | 75 | 140 |
| Halberd | 45.7% | 64 | 140 |
| Rapier | 42.1% | 59 | 140 |
| Twin short swords | 49.3% | 69 | 140 |

All eleven stay inside 35–65%. Sword is the strongest sampled field weapon; dagger is the weakest. This finite seeded sample is a tuning gate, not proof that every individual matchup is 50:50.

## Remaining issues

Authored motion is readable and weapons stay in hand, but it is still a compact 2D silhouette game: walk cycles are a bit mechanical, tall weapons can be cropped by the close-up camera, and 2D swords/shields can overlap in depth during a clash. Ragdoll impulses were softened so the including-ragdoll jitter gate still passes; knockdowns flop, then sit and get up, rather than flying across the arena. Natural shoves are rarer than in 1.4 because standing fighters seldom dip below 84 px. Rooms, rematch and disconnect behaviour are unchanged.
