# Arm stability 1.3.1 Implementation Plan

> Execute inline: cloud agents are explicitly unavailable/forbidden. Verify each stage before committing.

Goal: replace visibly jittery arms with smooth authored normal motion, physical hit reactions and robust render interpolation, without changing authoritative outcomes between clients.

Architecture: first fingerprint reproducible seeded walk/guard/clash fixtures and old live render measurements. Separate authored arm geometry and critically damped target state from Matter contact dynamics. Normal arm/hand/blade bodies follow continuous authored targets, while hit reactions release them to physics and blend over 200 ms. Use short swept weapon hit volumes so a substep cannot skip a contact. Render with bounded cubic interpolation, adaptive arrival-variance buffering and short eased extrapolation; gameplay remains wholly server-owned.

Tech stack: existing Node/Matter/ws/Canvas/Playwright; no new service or paid resource.

Global constraints: preserve all builds/validation/styles and 30 Hz snapshots; version 1.3.1; existing free Render service srv-dbn4535bedkc73a6vvbg only; public repo Geldarb/ragdoll-rivals; branch/PR/approved merge through gh. Do not launch a cloud agent. British English.

## Stages
- [ ] Measure baseline. Add tests/jitter-metrics.js (angle unwrap, rad/s² acceleration and significant direction reversals/s), tests/measure-jitter.js (identical seeded walk, guard and clash fixtures; server 30 Hz/client 60 Hz with fixed TCP arrival jitter). Save fingerprinted before data in docs/evidence/jitter-before-1.3.1.json. Record old live phone rendering before deployment.
- [ ] Failing tests: seeded arm jitter budget; smooth target step response/no overshoot; all rigs' normal pose envelope and grip alignment; physical release and 150–250 ms takeover/recovery; blade contacts/block events. Run RED first.
- [ ] Implement server/arm-motion.js: critically damped target filters with angular/linear slew bounds, two-bone IK, bounded drives and 200 ms mode transitions. Update server/poses.js, combat.js and joint-limits.js so constraints/projection/contact impulses cannot fight the authored arms. Increase cheap substeps to 4 and measure timing. Test all old pose/locomotion/hit rules; commit.
- [ ] Failing interpolation tests: cubic velocity continuity, wrapped angles, adaptive buffer bounds, short underrun prediction/ease and recovery without snaps. Update public/interpolation.js and replay handling as needed, preserving buffer semantics and real timestamps. Gate seeded client jitter against recorded old implementation; commit.
- [ ] Run exact original matchup sim across 770 mirrored duels and all seven styles, count draws/timeouts/knockouts. Tune only documented weapon animation/contact/stamina parameters if necessary to preserve 35–65% field rates; never assign outcomes. Save before/after jitter including active vs ragdoll frames so real impacts are not labelled noise.
- [ ] Bump root package/lock/rules/worker versions only, update design and evidence. Clean npm ci; full Node/browser suites; inspect phone/desktop frames/video. Push stages, PR, merge only after gates pass. Auto-deploy existing service and fetch exact live health SHA.
- [ ] Live 26 browser + 9 socket checks, new phone jitter measurement and video/screenshots under screenshots/live-1.3.1/. Report real numbers, test counts, balance table, PR/SHA/health and remaining issues, including physical-device measurement limits.
