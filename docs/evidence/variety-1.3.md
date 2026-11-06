# v1.3 measured balance and style evidence

The raw JSON alongside this file fingerprints the actual simulation sources with SHA-256. Mirrored sides, seven seeded styles per weapon pairing, rotating armour, 140 appearances per weapon: **770 actual duels**, draws worth half a win. No assigned outcomes or matchup correction. This is a finite-sample tuning check, not universal balance proof.

| Weapon | Wins / matches | Field win rate |
|---|---:|---:|
| dagger | 90/140 | 64.3% |
| sword | 77/140 | 55.0% |
| axe | 88/140 | 62.9% |
| mace | 79/140 | 56.4% |
| claymore | 58/140 | 41.4% |
| spear | 68/140 | 48.6% |
| flail | 55/140 | 39.3% |
| warhammer | 64/140 | 45.7% |
| halberd | 57/140 | 40.7% |
| rapier | 64/140 | 45.7% |
| twinSwords | 70/140 | 50.0% |

Draws: 0/770; knockouts: 769; time limits: 1; mean duration: 17.57 seconds. Every sampled weapon lies in the 35–65% gate.

Style data: 24 mirrored actual duels per style against balanced sword, common seeds/equipment. Travel is measured torso displacement and includes impact motion; guard is fraction of decision samples; dodges/feints are active decision samples per second, not distinct complete animation cycles. The automated pairwise check uses a normalised multimetric separation threshold; it does not claim statistical significance of every individual metric.

| Style | Mean gap (px) | Attacks/s | Blocks/s | Guard | Travel px/s | Dodge samples/s | Feint samples/s |
|---|---:|---:|---:|---:|---:|---:|---:|
| aggressive | 100.5 | 0.594 | 0.000 | 0.0% | 78.9 | 0.00 | 0.00 |
| defensive | 110.2 | 0.537 | 0.137 | 85.2% | 61.8 | 0.00 | 0.00 |
| counterattacker | 108.7 | 0.481 | 0.148 | 83.0% | 60.9 | 0.00 | 0.00 |
| evasive | 112.8 | 0.582 | 0.000 | 0.0% | 85.1 | 2.06 | 0.00 |
| balanced | 100.0 | 0.566 | 0.030 | 16.3% | 74.0 | 0.00 | 0.00 |
| berserker | 89.8 | 0.619 | 0.000 | 0.0% | 87.7 | 0.00 | 0.00 |
| patient | 108.4 | 0.579 | 0.055 | 47.2% | 60.4 | 0.00 | 0.76 |

## Verification and limits

Clean `npm ci` passes with zero audited vulnerabilities. Unit/integration and browser logs are recorded separately in the executor report. All eleven weapons pass guard-hand/floor-clearance checks. Active-frame elbow and hand-through-torso tests bound transient collision overshoot/penetration; they are not a guarantee of perfect rigid anatomical contact during a knockdown. Equipment flight is server-triggered cosmetic loss/debris, not a persistent disarm mechanic. Lateral evasions are authored 2D crouch/backstep moves, not 3D sidesteps. Live phone captures are emulated Chromium; physical Samsung Browser performance still needs Bradley’s retest.
