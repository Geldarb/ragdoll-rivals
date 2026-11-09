# 1.4 combat rhythm, spacing and weapon scale

## Clinch time

A clinch frame is any simulation tick whose fighter torsos are closer than 78 px. Before/after used the same definition. The 1.3.1 baseline ran six seeded sword duels per style against a balanced opponent. The 1.4 figures come from the mirrored style evaluation written to `docs/evidence/variety-1.4.0.json` (eight seeds, both sides).

| Style | 1.3.1 clinch fraction | 1.4 clinch fraction |
|---|---:|---:|
| aggressive | 18.3% | 0.49% |
| defensive | 6.7% | 0.00% |
| counterattacker | 5.0% | 0.05% |
| evasive | 11.3% | 0.05% |
| balanced | 7.7% | 0.27% |
| berserker | 66.0% | 0.85% |
| patient | 5.6% | 0.07% |
| overall (unweighted mean) | 17.2% | 0.25% |

Berserker clinching was the main source of stale fights; it dropped from about two thirds of the fight to under one percent. Fighters now keep a weapon-scaled distance band, disengage after exchanges, circle and re-enter, and break a clinch with a server-authoritative shove, barge, kick, bash, pommel or haft impulse.

## Signature moves per minute

From the same 1.4 style evaluation (sword vs sword, mirrored):

| Style | Signature rate (named moves / min) | Breakdown |
|---|---:|---|
| aggressive | 42.7 | lunge 20.5, combo 22.2 |
| defensive | 24.4 | bash 24.4 |
| counterattacker | 145.3 | parry 129.3, riposte 16.0 |
| evasive | 92.6 | roll 60.0, dart 32.6 |
| berserker | 41.3 | charge 39.9, spin 1.4 |
| patient | 78.4 | feint 46.2, thrust 32.1 |
| balanced | 37.5 | lunge 12.3, combo 11.1, thrust 12.3, bash 1.8 |

Disengage/re-entry cycles per minute: aggressive 2.1, defensive 8.0, counterattacker 5.3, evasive 9.7, balanced 3.4, berserker 10.8, patient 3.9.

Counterattacker parry counts every think-tick spent parrying an incoming attack, so that rate is higher than discrete flourish counts.

## Weapon scale

A standing fighter spawned by the sim is about 201 px tall (head top to foot bottom). Physics `reach` is the Matter body length and the art length:

| Weapon | Reach (px) | Notes |
|---|---:|---|
| dagger | 34 | short |
| twin short swords | 56 | short pair |
| mace | 60 | one-handed |
| axe | 66 | one-handed |
| sword | 74 | arming sword |
| flail | 82 | handle; chain/head stay physical |
| rapier | 104 | long thrust |
| warhammer | 136 | long two-handed haft |
| claymore | 188 | zweihander, slightly under fighter height, ricasso and parrying lugs |
| halberd | 204 | long polearm |
| spear | 216 | long polearm |

Rapier damage/interval/cost and spear damage/interval were retuned after the first 770-duel run so every weapon stayed inside the 35–65% field-rate band.

## Remaining limits

Close-up strike frames can still overlap limbs because the camera zooms in on contact; that is not the same as the old prolonged clinch. Cosmetic flying gear is still cosmetic. Phone captures are Chromium emulation. The free Render service may sleep.
