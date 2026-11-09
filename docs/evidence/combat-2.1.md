# Combat 2.1 evidence

Bradley chose 1c / 2a / 3a on 9 November 2026: a mix of weighty grounded weapon motion and snappy punchy combos; a proper bouncing or breathing fighting stance per style; and jumps, dashes, sweeps plus slam and disarm finishers. Shadow Fight 4 and Mortal Kombat were feel references only. No assets, animation data or names were copied.

Standing combat remains a server-authoritative animation state machine. Ragdoll still spawns only on knockdown or KO. Planted feet lock in world X with stride tied to root speed. Each of the seven styles has its own lean, bounce, knee bend, guard height and stance width. Combos are 2–4 hit strings by weapon class, with a 180 ms cancel window after an unblocked hit, contact hit-stop, and light / heavy / special tiers. High and low guard: sweeps must be blocked low and miss airborne targets; overheads, jump attacks and slams must be blocked high.

A disarm knocks the held weapon into loot, switches the victim to a backup dagger (not a builder-catalogue item), and lets them pick the original weapon up again. Slam and disarm require the opponent to be below about 32% health and share an 8-second cooldown plus long recovery.

The only numerical gear retune for the 770-duel 35–65% field-rate gate was rapier base damage 6 → 7.2. Sample: 770 duels, 0 draws, 35 timeouts, mean duration 26.73 s. See `variety-2.1.0.json`. Jitter remains under the 1.3.1 30% gates; see `jitter-after-2.1.0.json`.
