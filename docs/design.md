# Ragdoll Rivals — approved design and decisions

**Local implementation record, 6 November 2026.** Ragdoll Rivals is Bradley Errock's original browser-based automatic medieval ragdoll fighting game. Its physical comedy is inspired by *Bloody Bastards* by Tibith (Android reference https://play.google.com/store/apps/details?hl=en&id=com.tibith.badboxing), but title, art, characters, code and branding are entirely original. No extracted or copied assets.

Players configure a fighter then watch: **no in-fight controls**. Side-on 2D Matter.js bodies are joined at neck, shoulders, hips, elbows and knees. Momentum, floppy constraints and collisions can upset any plan. Computer and human fights use identical authoritative combat rules.

## Fighter rules

Every stat starts at **1**, with **exactly 15 additional points** across strength, vitality, speed, stamina and balance. Each final stat is 1–11. Names are 1–20 characters. Skin, hair and cloth colour are cosmetic.

| Stat | Per allocated point | Effect |
|---|---:|---|
| Strength | +1 | +1.7 base weapon damage and stronger impact impulse |
| Vitality | +1 | +6 maximum health (base 70 at vitality 0) |
| Speed | +1 | +6 desired movement speed (base 115 before weight) |
| Stamina | +1 | +5 maximum stamina (base 70 at stamina 0) |
| Balance | +1 | +0.01 upright correction (base .08); +1.5% knockdown resistance |

Total gear weight multiplies desired speed by `1/(1+.03*weight)` and adds `.35*weight` attack stamina. Stamina regenerates at `8 + stamina*.35` per second outside attack recovery.

## All gear, immediately

No levels, unlocks, purchases or paid advantages. These are v1 tuning values, not claims of perfect balance.

| Item | Weight | Protection / damage | Reach | Seconds | Stamina |
|---|---:|---:|---:|---:|---:|
| Dagger | 1 | 7 | 38 | .52 | 8 |
| Sword | 3 | 12 | 61 | .78 | 12 |
| Axe | 5 | 18 | 55 | 1.02 | 16 |
| Mace | 6 | 16 (25% armour bypass) | 51 | .94 | 15 |
| Claymore (two hands) | 8 | 25 | 82 | 1.38 | 23 |
| Cloth / leather / mail / plate | 1/4/8/13 | 2/10/21/35% reduction | — | — | — |
| No helmet / cap / helm | 0/1/3 | 0/5/15% extra head reduction | — | — | — |
| No shield / buckler / kite | 0/3/6 | 0/18/32% frontal block | — | — | — |

Claymore with a shield is illegal. The shared validator rejects unknown gear, malformed values, non-integers, missing or excess allocation and out-of-range stats. Weight affects speed. Armour, helmet, shield and five recognisable weapon silhouettes are drawn on the jointed body.

## Seven styles, different decisions

Every 150 ms the AI examines range, health, stamina, recovery and enemy attack state. Aggressive: 75% preferred reach, fast approach, .78 attack chance. Defensive: 105%, guard, retreat under 40% stamina, .90. Counterattacker: 100%, .82, strongly prefers post-attack openings. Evasive: 120%, .86, alternating retreats and approaches. Balanced: 95%, .84. Berserker: 65%, .65, attacks with low stamina and rarely retreats. Patient duellist: 110%, .94, conserves stamina and waits for long openings. Seeded metrics of approaches, retreats, guards and attacks make behaviour measurable. Randomness perturbs collisions/timing, never legality or budget.

## Netcode and rooms

One Node service uses Express, `ws` and Matter.js. The server advances a fixed **30 Hz** and broadcasts compact body/equipment snapshots at **30 Hz**; clients interpolate. Clients only send validated build, room and rematch messages, never positions or damage. `GET /health` returns `{ok:true,version:"2.0.0",commit:"<deployed Git SHA>"}`.

Client messages: `createRoom`, `joinRoom`, `computer`, `rematch`. Server: `roomCreated`, `joined`, `started`, `snapshot`, `finished`, `rematchStatus`, `error`. Six-character codes exclude `0/O/1/I`. Create validates the host and waits. Join validates the guest and immediately starts. Invalid/full/unknown codes produce readable errors. Computer mode starts one authoritative match against a generated legal build. Payloads are capped at 32 KiB.

One socket owns one slot. If a battler disconnects, the other wins after **10 seconds**. V1 has no reconnect tokens: refreshing loses the slot; this is disclosed. A waiting room closes if its host leaves. Finished fights stop their timers. Human rematch requires both votes and starts fresh with the same builds and a new seed; computer rematch needs one. Closing both sockets deletes the room.

At 75 seconds, higher health wins; exact equality draws. Collision damage has a per-swing hit cooldown, so one contact cannot damage every physics tick. Rooms are ephemeral memory only; restart loses them. Room codes are invitations, not authentication. No accounts, chat, spectators, persistence or more than two fighters.

## Interface and shipping

Original Canvas art uses inked silhouettes, a sand arena, visible joints and equipment, health/stamina bars, result and rematch. Setup has cosmetic choices, all gear, five allocators and seven explained styles. Native labelled controls support keyboard/touch. Desktop is two-column; mobile panels scroll inside a non-scrolling `100dvh` viewport with safe-area padding. Non-menu screens have Back; fullscreen is offered where supported. Manifest, original icons and network-first service worker support installation.

One repo, later one free Render web service using `npm ci`, `npm start` and `/health`; it may sleep. Bradley approved the public repository and the existing single free Render service. The current v1.3 decisions below supersede the original v1 tuning above.

## Reviewed v1 boundaries

No reconnection, durable accounts or spectator mode. Chaotic fights can draw and balance needs real playtesting. Tests use seeded aggregate intent, not exact paths. Forced-low-health fixtures test terminal logic, while separate real duels test autonomous damage. Clients render server joint positions and item IDs; physics is never shared mutable state.


## v1.3 approved expansion (6 November 2026)

All original brief requirements above remain: entirely original assets/code, no manual combat controls, exactly 15 points, no unlocks or paid advantages, legal equipment and server-authoritative shared duels. Bradley additionally approved camera changes, impact presentation, synthesised sound, punchier knockout pacing, final-blow replay, quick-start presets and richer results. These were **not** slipped into the earlier restricted 1.1/1.2 scope.

### Extended equipment

All eleven weapons are immediately available. Spear, warhammer, halberd and claymore require two hands; twin short swords occupy both hands. All reject shields on client and server. Flail and rapier may use either shield. Flail has two dynamic jointed chain links and a physical spiked head; twin swords have two physical blades with separate hand grips. Every class has its own wind-up/strike/recovery keys. See `shared/rules.js` for the complete numerical source of truth.

| New weapon | Weight | Base damage | Reach | Interval | Stamina | Special |
|---|---:|---:|---:|---:|---:|---|
| Spear | 6 | 13 | 112 | .93 | 14 | Two-handed thrust |
| Flail | 5 | 14 | 70 | .98 | 15 | Jointed chain; block probability ×.45 |
| Warhammer | 10 | 24 | 65 | 1.30 | 22 | Two hands; 55% armour bypass |
| Halberd | 9 | 19 | 105 | 1.20 | 20 | Two-handed polearm chop |
| Rapier | 2 | 8 | 75 | .60 | 9 | Fast, precise thrust |
| Twin short swords | 5 | 10 | 49 | .52 | 11 | Dual blades; no shield |

Mace base damage is now 15 (rather than the original 16). Damage has an explicitly shared ×1.15 pacing factor, not weapon-specific outcome correction. No hidden matchup bonuses, artificial win assignment or paid equipment.

### Styles and motion

`server/styles.js` now decides actual movement, guarding, attack selection and timing. Aggressive alternates forward pressure with fast combos; defensive turtles/shoves and punishes recovery; counterattacker guards until recovery/parry creates a fast riposte window; evasive alternates crouched backsteps and darting entries; balanced mixes; berserker charges/spins, occasionally stumbles, and spends stamina to zero; patient uses measured spacing, circling-like 2D footwork, feints and thrusts. There is no depth axis: sidesteps/rolls are stylised crouched lateral evasions, not a separate 3D dodge system.

Each has a different gait cadence, stride/stance width, crouch, guard height, wind-up fraction and lunge. Strength also scales swing excursion (`.75 + .055*strength`) and knockback (`.008 + .004*strength`). Speed multiplies gait by `.65 + .11*speed` and shortens attack duration via `1.3 - .045*speed`. Gear weight multiplies cadence/stride by `1/(1+.022*weight)` and extends wind-up/duration. Fatigue causes slumped guard, crouch, reduced cadence/advance and slower attacks; stamina governs capacity and regeneration. Vitality affects maximum HP and slight visible torso bulk. Balance governs stagger duration and get-up blend speed.

The authored pose remains tracked by finite PD muscle forces. Heavy impacts disable those drives, then blend through get-up. Mirrored elbow and leg angular projections, outward hand/forearm exclusion forces and a bounded inter-fighter push-apart reduce clinch folding. Limits permit transient collision overshoot rather than teleporting fighters apart or forbidding knockdowns. Regression measurements cover post-physics active frames, not only desired pose constants.

### Synchronous spectacle and interface

The server owns heavy-hit freeze (two 30 Hz ticks), short .65× simulation slow motion, hits, blocks, knockout results and fight totals. Snapshot timestamps remain monotonic at 30 Hz and clients interpolate 100 ms behind. Camera framing, shake, original sparks/light blood/damage numbers and flying gear debris are presentation only. Flying equipment is **cosmetic debris**, not a persistent disarm/armour-loss mechanic: authoritative grip constraints and protection remain intact. Replay reuses actual last-blow snapshots at .4× speed; it cannot change the winner or rematch state.

Original vector artwork has shaded cloth/skin, faces, nasal caps/visors, riveted leather, mail, plate, designed shields, distinct weapon profiles and a parallax castle courtyard/sand. WebAudio synthesises clangs, thuds, grunts and a subdued crowd from oscillators/noise; no copied samples. Sound unlocks on a gesture and mute is saved locally. Knight, Brute, Rogue and Duellist are legal quick-start builds; randomise always allocates exactly 15 points. Builder preview animates stance/gait and swings. Results display a victory pose plus actual hits, blocks, knockdowns suffered and damage dealt, with one-tap computer rematch/two-vote PvP rematch.

### Evidence and remaining limits

`npm test` retains all prior rule, upright/impact recovery, pose, real-WebSocket and scheduler regressions, plus new catalogue/rig/style/stat/joint/presentation tests. `npm run test:balance` runs mirrored round-robin duels across all seven styles and rotating armour, counts draws as half a win and fails if any weapon's sampled field rate leaves 35–65%. See `docs/evidence/variety-1.3.json` for raw data. This finite seeded sample is a tuning gate, **not proof** of universal balance or a statistical claim that every individual matchup is 50:50. Phone screenshots are Chromium touch emulation, not a physical Samsung-device test. Some transient limb overlap during real impacts remains intentional/possible. The free service may sleep; rooms remain ephemeral and refresh still forfeits the slot.


## v1.3.1 arm-stability correction (approved 6 November 2026)

Normal arms, hands and blades now follow continuous authored kinematic targets with critically damped/slew-limited target state, rather than competing PD forces, elbow angle projection, contact solver and grip pulls. Blades are kinematic sensors during authored motion; server hit volumes/blocks/damage impulses remain authoritative. Real hit reactions release arms to dynamic physics (180 ms support fade), then return through a 200 ms pose blend. Physical elbow limits are soft bounded torque. Torso, head and legs remain physical; the flail chain/head stays physical. Solver iterations are 10 position / 8 velocity, with two substeps per 30 Hz snapshot.

Rendering uses Hermite position interpolation, wrapped cubic angles and light limb-angle smoothing. Arrival variance adapts the base 100 ms buffer up to 180 ms; brief underruns ease through a bounded 80 ms prediction horizon and ease back on packet recovery. No client sends positions/damage or decides outcomes. Dagger base damage is 6.5 (previously 7), the sole numerical gear retune required by the full band gate. Complete measured before/after evidence, including intentional ragdoll frames, thresholds and final weapon rates: `docs/evidence/arm-stability-1.3.1.md`.


## v1.4 combat rhythm, spacing and weapon scale (approved 9 November 2026)

Fights were going stale because fighters, especially berserkers, clinched and stayed there. Each style now keeps a preferred distance band derived from its weapon reach, disengages after an exchange, circles, then re-enters. A clinch is any frame whose torsos are closer than `CLINCH_DISTANCE` (78 px). When they close inside that band they throw a server-authoritative shove, shoulder-barge, kick, shield-bash, pommel or haft break with an authored animation and a single physical impulse.

Signature attacks are weapon-aware: aggressive lunges and multi-hit combos; defensive bash / pommel / haft; counterattacker parry then riposte; evasive roll or backstep and hit-and-run darts; berserker spin and running charge; patient feint and long thrust; balanced mixes those. Combat rises and falls in bursts, recovery pauses and repositioning. Animations add clearer wind-up, follow-through, recoil on landed or blocked hits, stumble and the existing stagger/get-up blend.

All eleven weapons were redrawn with more detail and realistic scale versus a fighter about 201 px tall. The claymore is a zweihander: roughly the fighter's height, with a long ricasso, parrying lugs, a long two-handed grip, wide cross-guard and pommel. Spear and halberd are long polearms; the warhammer has a long haft; the dagger stays short. Physics `reach` and weapon body length match that art. Gear numbers were retuned so the 770-duel field rates stay inside 35–65%. 1.3.1 arm smoothing, 30 Hz authoritative snapshots and identical PvP clients are unchanged.

Evidence: `docs/evidence/variety-1.4.0.json`, `docs/evidence/combat-1.4.md`, `screenshots/live-1.4/`.


## v2.0 animation-first combat (approved 9 November 2026)

Bradley reviewed 1.4 and judged standing combat still janky: physics arms, solver pull and camera-stacked strike frames did not read like a fighting game. He chose **fully animated combat, with ragdoll only on knockdown or KO**.

Standing fighters are skeletal rigs driven by a deterministic, server-authoritative animation-and-combat state machine. Authored keyframe clips (idle/guard, walk forward/back, circle, every weapon's wind-up/strike/follow-through/recovery, blocks and parries, dodges/rolls/backsteps, shoves/barges/kicks/bashes, light flinch, heavy recoil, stagger stumble and get-up) use eased curves, critically damped target filters and crossfades. Style signature moves, distance bands, burst/recover rhythm, and stat/weight effects on cadence, stride, wind-up and swing survive from 1.4. Weapon art and sizes, including the zweihander-scale claymore, are unchanged.

Hit detection sweeps the animated weapon segment against head and torso hitboxes at the server tick, with an analytic reach window. Blocks and parries resolve deterministically from guard state plus the existing seeded RNG, so outcomes stay a little unpredictable. Spacing is movement logic plus a body-pushout capsule (`MIN_SEPARATION` 58 px so fighters never overlap while animated, with a wider combat spring so they do not live in a clinch).

Ragdoll is spawned only when a hit causes a knockdown (damage, balance and weight, same threshold family as before) or a KO. Matter.js bodies are seeded from the current pose and velocities plus a hit impulse. After a knockdown the fighter pose-matches back to the get-up clip over about 360 ms. A KO stays ragdoll for the final-blow replay.

The network snapshot is compact (anim clip id, time, blend weights, root position, facing, mode) and still includes the evaluated part transforms so both PvP clients interpolate identically. Physics arm drives and joint-limit projection are retired. Tests keep style differentiation, stat effects, clinch, signatures, 35–65% balance, draws, legality and rooms, and add no-overlap outside ragdoll, ragdoll-only-on-knockdown-or-KO, deterministic seeded replay, and the 1.3.1 jitter gates.

Evidence: `docs/evidence/variety-2.0.0.json`, `docs/evidence/combat-2.0.md`, `screenshots/live-2.0/`.
