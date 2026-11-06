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

One Node service uses Express, `ws` and Matter.js. The server advances a fixed **30 Hz** and broadcasts compact body/equipment snapshots at **15 Hz**; clients interpolate. Clients only send validated build, room and rematch messages, never positions or damage. `GET /health` returns `{ok:true,version:"1.0.0"}`.

Client messages: `createRoom`, `joinRoom`, `computer`, `rematch`. Server: `roomCreated`, `joined`, `started`, `snapshot`, `finished`, `rematchStatus`, `error`. Six-character codes exclude `0/O/1/I`. Create validates the host and waits. Join validates the guest and immediately starts. Invalid/full/unknown codes produce readable errors. Computer mode starts one authoritative match against a generated legal build. Payloads are capped at 32 KiB.

One socket owns one slot. If a battler disconnects, the other wins after **10 seconds**. V1 has no reconnect tokens: refreshing loses the slot; this is disclosed. A waiting room closes if its host leaves. Finished fights stop their timers. Human rematch requires both votes and starts fresh with the same builds and a new seed; computer rematch needs one. Closing both sockets deletes the room.

At 75 seconds, higher health wins; exact equality draws. Collision damage has a per-swing hit cooldown, so one contact cannot damage every physics tick. Rooms are ephemeral memory only; restart loses them. Room codes are invitations, not authentication. No accounts, chat, spectators, persistence or more than two fighters.

## Interface and shipping

Original Canvas art uses inked silhouettes, a sand arena, visible joints and equipment, health/stamina bars, result and rematch. Setup has cosmetic choices, all gear, five allocators and seven explained styles. Native labelled controls support keyboard/touch. Desktop is two-column; mobile panels scroll inside a non-scrolling `100dvh` viewport with safe-area padding. Non-menu screens have Back; fullscreen is offered where supported. Manifest, original icons and network-first service worker support installation.

One repo, later one free Render web service using `npm ci`, `npm start` and `/health`; it may sleep. This run stays local. Repository visibility remains Bradley's decision.

## Reviewed v1 boundaries

No reconnection, durable accounts or spectator mode. Chaotic fights can draw and balance needs real playtesting. Tests use seeded aggregate intent, not exact paths. Forced-low-health fixtures test terminal logic, while separate real duels test autonomous damage. Clients render server joint positions and item IDs; physics is never shared mutable state.
