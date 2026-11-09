// Concept 2.3 motion — planted walk, spline-ish keyframes, forward-knee IK via draw.layout.
import { layout, weaponReach } from './draw.js';

export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const smoother = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = t => 1 - (1 - clamp(t, 0, 1)) ** 3;
export const easeIn = t => clamp(t, 0, 1) ** 3;
export const overshoot = t => {
  t = clamp(t, 0, 1);
  return t < 0.78 ? smooth(t / 0.78) * 1.08 : mix(1.08, 1, smooth((t - 0.78) / 0.22));
};

function deepMix(a, b, t) {
  if (a == null) return b;
  if (b == null) return a;
  if (typeof a === 'number' && typeof b === 'number') return mix(a, b, t);
  if (typeof a === 'object' && typeof b === 'object') {
    const out = Array.isArray(a) ? [] : {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) out[k] = deepMix(a[k], b[k], t);
    return out;
  }
  return t < 0.5 ? a : b;
}

export function sampleKeys(keys, t) {
  if (!keys.length) return {};
  if (t <= keys[0].t) return keys[0].pose;
  if (t >= keys[keys.length - 1].t) return keys[keys.length - 1].pose;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t < t) i++;
  const a = keys[i], b = keys[i + 1];
  let u = (t - a.t) / Math.max(1e-6, b.t - a.t);
  const ease = b.ease || a.ease || 'smooth';
  if (ease === 'smoother') u = smoother(u);
  else if (ease === 'out') u = easeOut(u);
  else if (ease === 'in') u = easeIn(u);
  else if (ease === 'overshoot') u = overshoot(u);
  else if (ease === 'linear') u = clamp(u, 0, 1);
  else u = smooth(u);
  return deepMix(a.pose, b.pose, u);
}

const stanceHands = {
  lead: { x: 22, y: 38 },
  rear: { x: 16, y: 22 },
};

export function stancePose(t = 0, extra = {}) {
  const breath = Math.sin(t * 1.55) * 1.15;
  return {
    lean: 0.055,
    hipDrop: 0.10,
    stanceWidth: 1.06,
    weight: 0.08,
    hipBob: breath * 0.35,
    chestBob: breath,
    hipYaw: Math.sin(t * 1.55) * 0.08,
    heelLift: 1.2,
    weaponAngle: 0.68,
    shieldRaise: 0.55,
    tabard: Math.sin(t * 1.55) * 2.2,
    hop: 0,
    hands: {
      lead: { x: 24, y: 40 + breath * 0.6 },
      rear: { x: 18, y: 24 + breath * 0.4 },
    },
    ...extra,
  };
}

function heelToe(plantT, facing) {
  if (plantT < 0.16) return facing * mix(-0.32, 0, plantT / 0.16);
  if (plantT < 0.70) return 0;
  return facing * mix(0, 0.38, (plantT - 0.70) / 0.30);
}

export function createGait() {
  return { phase: 0, plantX: { L: null, R: null }, swingFrom: { L: null, R: null } };
}

function footDuringWalk(elapsed, rest0, facing, ground, side, cadence, stride) {
  const off = side === 'R' ? 0.5 : 0;
  const tau = elapsed * cadence + off;
  const cycle = Math.floor(tau);
  const frac = tau - cycle;
  const plant = (k) => rest0 + k * stride * facing;
  if (frac < 0.56) {
    return { x: plant(cycle), y: ground, angle: heelToe(frac / 0.56, facing), lift: 0, planted: true };
  }
  const swing = (frac - 0.56) / 0.44;
  const u = smooth(swing);
  return {
    x: mix(plant(cycle), plant(cycle + 1), u),
    y: ground - 17 * Math.sin(Math.PI * swing),
    angle: facing * mix(0.38, -0.28, u),
    lift: 17 * Math.sin(Math.PI * swing),
    planted: false,
  };
}

// Deterministic from time so seeking cannot introduce foot slide.
export function walkFeetAt(t, walkStart, walkEnd, startX, endX, facing, ground, cadence, stride) {
  const stanceW = 1.12 * 28;
  const out = {};
  for (const side of ['L', 'R']) {
    const sign = side === 'R' ? 1 : -1;
    const rest0 = startX + facing * sign * stanceW * 0.42;
    const rest1 = endX + facing * sign * stanceW * 0.42;
    if (t <= walkStart) {
      out[side] = { x: rest0, y: ground, angle: 0, lift: 0, planted: true };
    } else if (t < walkEnd) {
      out[side] = footDuringWalk(t - walkStart, rest0, facing, ground, side, cadence, stride);
    } else {
      const last = footDuringWalk(walkEnd - walkStart, rest0, facing, ground, side, cadence, stride);
      const u = smoother(clamp((t - walkEnd) / 0.42, 0, 1));
      out[side] = { x: mix(last.x, rest1, u), y: ground, angle: mix(last.angle || 0, 0, u), lift: 0, planted: true };
    }
  }
  return out;
}

export function walkFeet(gait, rootX, facing, ground, dt, cadence, stride, moving) {
  // kept for older callers; prefer walkFeetAt
  if (moving) gait.phase = (gait.phase + cadence * dt) % 1;
  return walkFeetAt(moving ? gait.phase / Math.max(cadence, 1e-6) : 99, 0, 80, rootX, rootX, facing, ground, cadence, stride);
}

export function applyFeet(pose, feet, rootX, facing, ground) {
  const out = { ...pose };
  if (feet) {
    out.footR = { x: feet.R.x, y: feet.R.y, angle: feet.R.angle, lift: feet.R.lift };
    out.footL = { x: feet.L.x, y: feet.L.y, angle: feet.L.angle, lift: feet.L.lift };
  } else {
    const w = (pose.stanceWidth ?? 1.18) * 28;
    out.footR = { x: rootX + facing * w * 0.42, y: ground - (pose.hop || 0), angle: 0, lift: 0 };
    out.footL = { x: rootX - facing * w * 0.38, y: ground - (pose.hop || 0), angle: 0, lift: 0 };
  }
  return out;
}

// Authored attack / reaction poses. Numbers are facing-invariant (x in facing space).
function hands(lx, ly, rx, ry) { return { lead: { x: lx, y: ly }, rear: { x: rx, y: ry } }; }

export const POSES = {
  stance: t => stancePose(t),
  guard: () => ({
    lean: 0.04, hipDrop: 0.24, stanceWidth: 1.22, weight: 0.04, weaponAngle: 0.55,
    shieldRaise: 0.85, hands: hands(18, 28, 22, 8), hipYaw: -0.12, tabard: -2,
  }),
  slashWind: () => ({
    lean: -0.10, hipDrop: 0.22, stanceWidth: 1.2, weight: -0.18, weaponAngle: -0.55,
    shieldRaise: 0.4, hands: hands(8, -8, 10, 18), hipYaw: 0.2, tabard: 8,
  }),
  slashHit: () => ({
    lean: 0.22, hipDrop: 0.18, stanceWidth: 1.35, weight: 0.42, weaponAngle: 1.55,
    shieldRaise: 0.25, hands: hands(52, 36, 20, 22), hipYaw: -0.22, tabard: -14,
  }),
  slashFollow: () => ({
    lean: 0.16, hipDrop: 0.2, stanceWidth: 1.28, weight: 0.28, weaponAngle: 1.85,
    shieldRaise: 0.3, hands: hands(48, 48, 16, 28), hipYaw: -0.12, tabard: -8,
  }),
  slash2Wind: () => ({
    lean: -0.02, hipDrop: 0.2, stanceWidth: 1.18, weight: 0.05, weaponAngle: -0.15,
    shieldRaise: 0.35, hands: hands(16, 4, 12, 20), hipYaw: 0.1, tabard: 4,
  }),
  overheadWind: () => ({
    lean: -0.16, hipDrop: 0.16, stanceWidth: 1.08, weight: -0.28, weaponAngle: -1.25,
    shieldRaise: 0.2, hands: hands(-4, -46, 6, -18), hipYaw: 0.28, tabard: 12,
  }),
  overheadHit: () => ({
    lean: 0.28, hipDrop: 0.26, stanceWidth: 1.42, weight: 0.48, weaponAngle: 1.72,
    shieldRaise: 0.15, hands: hands(46, 52, 18, 30), hipYaw: -0.3, tabard: -16,
  }),
  overheadFollow: () => ({
    lean: 0.18, hipDrop: 0.28, stanceWidth: 1.32, weight: 0.22, weaponAngle: 1.95,
    shieldRaise: 0.2, hands: hands(38, 62, 14, 36), hipYaw: -0.16, tabard: -10,
  }),
  thrustWind: () => ({
    lean: -0.08, hipDrop: 0.22, stanceWidth: 1.15, weight: -0.16, weaponAngle: 0.15,
    shieldRaise: 0.5, hands: hands(4, 16, 14, 20), hipYaw: 0.16, tabard: 6,
  }),
  thrustHit: () => ({
    lean: 0.26, hipDrop: 0.14, stanceWidth: 1.48, weight: 0.55, weaponAngle: 1.42,
    shieldRaise: 0.3, hands: hands(64, 18, 28, 16), hipYaw: -0.18, tabard: -12,
  }),
  block: () => ({
    lean: -0.06, hipDrop: 0.28, stanceWidth: 1.32, weight: -0.08, weaponAngle: 0.35,
    shieldRaise: 1.15, hands: hands(14, 22, 28, -4), hipYaw: -0.08, tabard: 3,
  }),
  dodge: () => ({
    lean: -0.22, hipDrop: 0.12, stanceWidth: 1.05, weight: -0.35, weaponAngle: 0.5,
    shieldRaise: 0.3, hands: hands(10, 28, 8, 16), hipYaw: 0.18, hop: 16, tabard: 18,
  }),
  stagger: () => ({
    lean: -0.18, hipDrop: 0.32, stanceWidth: 1.25, weight: -0.3, weaponAngle: 0.95,
    shieldRaise: 0.15, hands: hands(6, 46, 4, 28), hipYaw: 0.12, tabard: 14,
  }),
  down: () => ({
    lean: -0.62, hipDrop: 1.72, stanceWidth: 1.7, weight: -0.22, weaponAngle: 1.55,
    shieldRaise: 0.1, hands: hands(18, 88, -20, 92), hipYaw: 0.05, tabard: 20,
  }),
  kneelUp: () => ({
    lean: 0.12, hipDrop: 1.05, stanceWidth: 1.12, weight: -0.08, weaponAngle: 0.85,
    shieldRaise: 0.2, hands: hands(14, 50, -6, 62), hipYaw: 0.06, tabard: 8,
  }),
  getUp: () => ({
    lean: 0.1, hipDrop: 0.55, stanceWidth: 1.2, weight: 0.08, weaponAngle: 0.75,
    shieldRaise: 0.35, hands: hands(20, 36, 8, 42), hipYaw: 0.04, tabard: 2,
  }),
};

function track(pairs) {
  return pairs.map(([t, name, ease]) => ({ t, pose: typeof name === 'string' ? POSES[name](0) : name, ease }));
}

export const CLIPS = {
  lightCombo: track([
    [0, 'stance', 'smooth'],
    [0.16, 'slashWind', 'smoother'],
    [0.32, 'slashHit', 'overshoot'],
    [0.48, 'slashFollow', 'smooth'],
    [0.62, 'slash2Wind', 'smoother'],
    [0.78, 'slashHit', 'overshoot'],
    [0.96, 'slashFollow', 'smooth'],
    [1.22, 'stance', 'out'],
  ]),
  heavyOverhead: track([
    [0, 'stance', 'smooth'],
    [0.22, 'slashWind', 'in'],
    [0.55, 'overheadWind', 'smoother'],
    [0.92, 'overheadHit', 'overshoot'],
    [1.18, 'overheadFollow', 'smooth'],
    [1.55, 'stance', 'out'],
  ]),
  thrust: track([
    [0, 'stance', 'smooth'],
    [0.18, 'thrustWind', 'smoother'],
    [0.38, 'thrustHit', 'overshoot'],
    [0.62, 'slashFollow', 'smooth'],
    [0.95, 'stance', 'out'],
  ]),
  block: track([
    [0, 'stance'],
    [0.10, 'block', 'out'],
    [0.55, 'block'],
    [0.85, 'stance', 'smooth'],
  ]),
  dodge: track([
    [0, 'stance'],
    [0.08, 'dodge', 'out'],
    [0.32, 'dodge'],
    [0.55, 'stance', 'smooth'],
  ]),
  stagger: track([
    [0, 'stance'],
    [0.08, 'stagger', 'out'],
    [0.42, 'stagger'],
    [0.85, 'stance', 'smooth'],
  ]),
  knockdown: track([
    [0, 'stagger', 'in'],
    [0.22, 'down', 'smoother'],
    [0.85, 'down'],
    [1.15, 'kneelUp', 'smoother'],
    [1.55, 'getUp', 'smooth'],
    [2.05, 'stance', 'out'],
  ]),
};

export function sampleClip(name, localT) {
  return sampleKeys(CLIPS[name], localT);
}

export const DURATION = 13.6;

// Director: two fighters, walk in, exchange, knockdown.
export function sampleWorld(t) {
  const ground = 458;
  const p1Start = 268, p1End = 382;
  const p2Start = 658, p2End = 544;

  function travel(t0, t1, a, b) {
    // Linear while walking so constant velocity matches a constant stride
    // (smoother ease only on the short settle after walkEnd).
    const u = clamp((t - t0) / (t1 - t0), 0, 1);
    return mix(a, b, u);
  }

  const walkStart = 0.18, walkEnd = 2.50;
  const p1x = t < walkStart ? p1Start : t < walkEnd ? travel(walkStart, walkEnd, p1Start, p1End) : p1End;
  const p2x = t < walkStart ? p2Start : t < walkEnd ? travel(walkStart, walkEnd, p2Start, p2End) : p2End;
  const moving = t >= walkStart && t < walkEnd;
  const dist = p1End - p1Start;
  const walkDur = walkEnd - walkStart;
  const cadence = 1.05;
  const stride = dist / (cadence * walkDur);

  return {
    t, ground, p1x, p2x, moving, cadence, stride,
    // events (start, duration, clip, who, extras)
    events: [
      { at: 3.25, dur: 1.22, who: 'p2', clip: 'lightCombo' },
      { at: 3.42, dur: 0.9, who: 'p1', clip: 'block' },
      { at: 4.85, dur: 1.55, who: 'p1', clip: 'heavyOverhead' },
      { at: 5.55, dur: 0.85, who: 'p2', clip: 'block' },
      { at: 6.75, dur: 0.95, who: 'p2', clip: 'thrust' },
      { at: 6.95, dur: 0.55, who: 'p1', clip: 'dodge', root: -42 },
      { at: 7.85, dur: 0.7, who: 'p1', clip: 'stance' },
      { at: 8.35, dur: 1.22, who: 'p1', clip: 'lightCombo' },
      { at: 8.62, dur: 0.85, who: 'p2', clip: 'stagger', root: -30 },
      { at: 9.85, dur: 1.55, who: 'p1', clip: 'heavyOverhead' },
      { at: 10.55, dur: 2.05, who: 'p2', clip: 'knockdown', root: -58 },
    ],
  };
}

export function poseFor(who, world) {
  const facing = who === 'p1' ? 1 : -1;
  const startX = who === 'p1' ? 268 : 658;
  const endX = who === 'p1' ? 382 : 544;
  const baseX = who === 'p1' ? world.p1x : world.p2x;
  let rootShift = 0;
  let pose = stancePose(world.t);
  let overrideFeet = false;
  if (world.moving) {
    const phase = (world.t - 0.18) * world.cadence;
    pose.hipBob = Math.abs(Math.cos(phase * Math.PI * 2)) * 3.4;
    pose.hipYaw = Math.sin(phase * Math.PI * 2) * 0.38;
    pose.lean = 0.07 + Math.sin(phase * Math.PI * 2) * 0.045;
    pose.chestBob = Math.sin(phase * Math.PI * 2 + Math.PI) * 1.4;
    pose.tabard = Math.sin(phase * Math.PI * 2 - 0.55) * 11;
    pose.hands = {
      lead: { x: 22, y: 36 + Math.sin(phase * Math.PI * 2 + Math.PI) * 7 },
      rear: { x: 15, y: 22 + Math.sin(phase * Math.PI * 2) * 7 },
    };
    pose.weaponAngle = 0.66 + Math.sin(phase * Math.PI * 2) * 0.1;
  }

  for (const ev of world.events) {
    if (ev.who !== who) continue;
    if (world.t < ev.at || world.t > ev.at + ev.dur) continue;
    const local = world.t - ev.at;
    const clipPose = ev.clip === 'stance' ? stancePose(world.t) : sampleClip(ev.clip, local);
    pose = { ...pose, ...clipPose };
    if (ev.root) {
      const u = smoother(clamp(local / Math.min(0.38, ev.dur * 0.5), 0, 1));
      rootShift = ev.root * facing * u;
    }
    overrideFeet = ev.clip === 'knockdown' || ev.clip === 'dodge';
  }

  const rootX = baseX + rootShift;
  const feet = walkFeetAt(world.t, 0.18, 2.50, startX, endX, facing, world.ground, world.cadence, world.stride);
  // After settle (t>2.92) keep stance feet attached to current root so authored
  // root shifts (dodge/stagger) carry the whole body without a planted slide.
  if (world.t > 2.92 && !world.moving) {
    const w = (pose.stanceWidth ?? 1.18) * 28;
    feet.R = { x: rootX + facing * w * 0.42, y: world.ground, angle: 0, lift: 0, planted: true };
    feet.L = { x: rootX - facing * w * 0.38, y: world.ground, angle: 0, lift: 0, planted: true };
  }
  pose = applyFeet(pose, feet, rootX, facing, world.ground);

  pose.hop = pose.hop || 0;
  if (pose.hop) {
    pose.footR = { ...pose.footR, y: world.ground - pose.hop * 0.45 };
    pose.footL = { ...pose.footL, y: world.ground - pose.hop * 0.7 };
  }
  if (overrideFeet && pose.hipDrop > 1) {
    const down = clamp((pose.hipDrop - 0.4) / 1.5, 0, 1);
    pose.footR = { x: rootX + facing * mix(22, -6, down), y: world.ground, angle: facing * -0.15 * down, lift: 0 };
    pose.footL = { x: rootX + facing * mix(-26, -50, down), y: world.ground, angle: facing * -0.55 * down, lift: 0 };
  }

  pose.facing = facing;
  pose.rootX = rootX;
  pose.groundY = world.ground;
  pose.tabard = (pose.tabard || 0) + Math.sin(world.t * 1.55 + (who === 'p1' ? 0 : 1)) * 1.4;
  return pose;
}

export function validatePose(pose, build) {
  const L = layout(pose, build);
  const ax = L.ankleR.x, ay = L.ankleR.y;
  const bx = L.ankleL.x, by = L.ankleL.y;
  const { ok, sR, sL } = (awaitImportKnees(L));
  const weaponHand = Math.hypot(L.weapon.x - L.handR.x, L.weapon.y - L.handR.y);
  return { L, kneesOk: ok, sR, sL, weaponHand, footGap: Math.abs(ax - bx) };
}

function awaitImportKnees(L) {
  const ax = L.ankleR.x - L.hipR.x, ay = L.ankleR.y - L.hipR.y;
  const kx = L.kneeR.x - L.hipR.x, ky = L.kneeR.y - L.hipR.y;
  const sR = ax * ky - ay * kx;
  const a2 = L.ankleL.x - L.hipL.x, b2 = L.ankleL.y - L.hipL.y;
  const c2 = L.kneeL.x - L.hipL.x, d2 = L.kneeL.y - L.hipL.y;
  const sL = a2 * d2 - b2 * c2;
  const want = -Math.sign(L.facing || 1);
  const nearStraight = (s) => Math.abs(s) < 120;
  const okR = nearStraight(sR) || Math.sign(sR) === want;
  const okL = nearStraight(sL) || Math.sign(sL) === want;
  return { ok: okR && okL, sR, sL };
}
