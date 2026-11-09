// Concept 2.3b motion — upright stance, planted walk, proper knockdown.
import { HEAD } from './draw.js';

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
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = deepMix(a[k], b[k], t);
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

export function stancePose(t = 0, extra = {}) {
  const breath = Math.sin(t * 1.45) * 1.35;
  return {
    lean: 0.03,
    hipDrop: 0.02,
    stanceWidth: 0.82,
    weight: 0.05,
    hipBob: breath * 0.25,
    chestBob: breath,
    hipYaw: Math.sin(t * 1.45) * 0.05,
    weaponAngle: 0.66,
    shieldRaise: 0.5,
    tabard: Math.sin(t * 1.45) * 2.6,
    hop: 0, lie: 0, kneel: 0,
    hands: {
      lead: { x: 32, y: 50 + breath * 0.7 },
      rear: { x: 22, y: 28 + breath * 0.45 },
    },
    ...extra,
  };
}

function heelToe(plantT, facing) {
  if (plantT < 0.16) return facing * mix(-0.28, 0, plantT / 0.16);
  if (plantT < 0.72) return 0;
  return facing * mix(0, 0.34, (plantT - 0.72) / 0.28);
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
  const lift = 22 * Math.sin(Math.PI * swing);
  return {
    x: mix(plant(cycle), plant(cycle + 1), u),
    y: ground - lift,
    angle: facing * mix(0.34, -0.24, u),
    lift, planted: false,
  };
}

export const RING = {
  p1Start: 260, p1End: 428,
  p2Start: 764, p2End: 596,
  walkStart: 0.20, walkEnd: 2.60,
  ground: 520,
};

export function walkFeetAt(t, walkStart, walkEnd, startX, endX, facing, ground, cadence, stride) {
  const half = 0.32 * HEAD;
  const out = {};
  for (const side of ['L', 'R']) {
    const sign = side === 'R' ? 1 : -1;
    const rest0 = startX + facing * sign * half;
    const rest1 = endX + facing * sign * half;
    if (t <= walkStart) {
      out[side] = { x: rest0, y: ground, angle: 0, lift: 0, planted: true };
    } else if (t < walkEnd) {
      out[side] = footDuringWalk(t - walkStart, rest0, facing, ground, side, cadence, stride);
    } else {
      const last = footDuringWalk(walkEnd - walkStart, rest0, facing, ground, side, cadence, stride);
      const u = smoother(clamp((t - walkEnd) / 0.45, 0, 1));
      out[side] = { x: mix(last.x, rest1, u), y: ground, angle: mix(last.angle || 0, 0, u), lift: 0, planted: true };
    }
  }
  return out;
}

export function applyFeet(pose, feet, rootX, facing, ground) {
  const out = { ...pose };
  if (feet) {
    out.footR = { x: feet.R.x, y: feet.R.y, angle: feet.R.angle, lift: feet.R.lift };
    out.footL = { x: feet.L.x, y: feet.L.y, angle: feet.L.angle, lift: feet.L.lift };
  } else {
    out.footR = { x: rootX + facing * HEAD * 0.34, y: ground, angle: 0, lift: 0 };
    out.footL = { x: rootX - facing * HEAD * 0.30, y: ground, angle: 0, lift: 0 };
  }
  return out;
}

function hands(lx, ly, rx, ry) { return { lead: { x: lx, y: ly }, rear: { x: rx, y: ry } }; }

export const POSES = {
  stance: t => stancePose(t),
  guard: () => ({
    lean: 0.02, hipDrop: 0.04, stanceWidth: 0.9, weight: 0.02, weaponAngle: 0.5,
    shieldRaise: 0.9, hands: hands(24, 36, 28, 10), hipYaw: -0.08, tabard: -3, lie: 0, kneel: 0,
  }),
  slashWind: () => ({
    lean: -0.08, hipDrop: 0.05, stanceWidth: 0.88, weight: -0.16, weaponAngle: -0.52,
    shieldRaise: 0.35, hands: hands(10, -12, 14, 22), hipYaw: 0.18, tabard: 10, lie: 0, kneel: 0,
  }),
  slashHit: () => ({
    lean: 0.16, hipDrop: 0.04, stanceWidth: 1.05, weight: 0.38, weaponAngle: 1.52,
    shieldRaise: 0.22, hands: hands(72, 48, 28, 30), hipYaw: -0.2, tabard: -16, lie: 0, kneel: 0,
  }),
  slashFollow: () => ({
    lean: 0.12, hipDrop: 0.05, stanceWidth: 0.98, weight: 0.24, weaponAngle: 1.82,
    shieldRaise: 0.28, hands: hands(66, 62, 22, 36), hipYaw: -0.1, tabard: -10, lie: 0, kneel: 0,
  }),
  slash2Wind: () => ({
    lean: -0.02, hipDrop: 0.04, stanceWidth: 0.88, weight: 0.04, weaponAngle: -0.12,
    shieldRaise: 0.32, hands: hands(22, 6, 16, 26), hipYaw: 0.08, tabard: 5, lie: 0, kneel: 0,
  }),
  overheadWind: () => ({
    lean: -0.12, hipDrop: 0.03, stanceWidth: 0.82, weight: -0.24, weaponAngle: -1.22,
    shieldRaise: 0.18, hands: hands(-6, -64, 10, -26), hipYaw: 0.24, tabard: 14, lie: 0, kneel: 0,
  }),
  overheadHit: () => ({
    lean: 0.2, hipDrop: 0.08, stanceWidth: 1.12, weight: 0.42, weaponAngle: 1.7,
    shieldRaise: 0.14, hands: hands(64, 70, 26, 40), hipYaw: -0.26, tabard: -18, lie: 0, kneel: 0,
  }),
  overheadFollow: () => ({
    lean: 0.14, hipDrop: 0.1, stanceWidth: 1.02, weight: 0.2, weaponAngle: 1.92,
    shieldRaise: 0.18, hands: hands(52, 82, 20, 48), hipYaw: -0.14, tabard: -12, lie: 0, kneel: 0,
  }),
  thrustWind: () => ({
    lean: -0.06, hipDrop: 0.05, stanceWidth: 0.86, weight: -0.14, weaponAngle: 0.12,
    shieldRaise: 0.48, hands: hands(8, 22, 18, 26), hipYaw: 0.14, tabard: 7, lie: 0, kneel: 0,
  }),
  thrustHit: () => ({
    lean: 0.2, hipDrop: 0.03, stanceWidth: 1.18, weight: 0.5, weaponAngle: 1.4,
    shieldRaise: 0.28, hands: hands(88, 24, 38, 22), hipYaw: -0.16, tabard: -14, lie: 0, kneel: 0,
  }),
  block: () => ({
    lean: -0.04, hipDrop: 0.06, stanceWidth: 1.0, weight: -0.06, weaponAngle: 0.32,
    shieldRaise: 1.15, hands: hands(20, 30, 36, -6), hipYaw: -0.06, tabard: 4, lie: 0, kneel: 0,
  }),
  dodge: () => ({
    lean: -0.18, hipDrop: 0.04, stanceWidth: 0.8, weight: -0.3, weaponAngle: 0.48,
    shieldRaise: 0.28, hands: hands(14, 36, 12, 22), hipYaw: 0.16, hop: 22, tabard: 20, lie: 0, kneel: 0,
  }),
  stagger: () => ({
    lean: -0.2, hipDrop: 0.14, stanceWidth: 0.95, weight: -0.28, weaponAngle: 0.9,
    shieldRaise: 0.14, hands: hands(10, 58, 8, 36), hipYaw: 0.1, tabard: 16, lie: 0.05, kneel: 0,
  }),
  falling: () => ({
    lean: -0.78, hipDrop: 1.85, stanceWidth: 1.25, weight: -0.22, weaponAngle: 1.28,
    shieldRaise: 0.1, hands: hands(40, 70, -16, 78), hipYaw: 0.04, tabard: 18, lie: 0.6, kneel: 0,
  }),
  flat: () => ({
    lean: -1.48, hipDrop: 3.62, stanceWidth: 1.5, weight: -0.1, weaponAngle: 1.55,
    shieldRaise: 0.08, hands: hands(74, 26, -28, 24), hipYaw: 0.02, tabard: 10, lie: 1, kneel: 0,
  }),
  pushUp: () => ({
    lean: -0.48, hipDrop: 2.55, stanceWidth: 1.15, weight: -0.08, weaponAngle: 1.05,
    shieldRaise: 0.12, hands: hands(16, 78, -22, 96), hipYaw: 0.06, tabard: 10, lie: 0.35, kneel: 0.4,
  }),
  kneelUp: () => ({
    lean: 0.06, hipDrop: 2.02, stanceWidth: 0.95, weight: 0.02, weaponAngle: 0.82,
    shieldRaise: 0.2, hands: hands(20, 58, -8, 72), hipYaw: 0.05, tabard: 8, lie: 0, kneel: 1,
  }),
  getUp: () => ({
    lean: 0.05, hipDrop: 0.45, stanceWidth: 0.9, weight: 0.06, weaponAngle: 0.7,
    shieldRaise: 0.32, hands: hands(28, 46, 12, 50), hipYaw: 0.03, tabard: 3, lie: 0, kneel: 0.25,
  }),
};

function track(pairs) {
  return pairs.map(([t, name, ease]) => ({
    t, pose: typeof name === 'string' ? POSES[name](0) : name, ease,
  }));
}

export const CLIPS = {
  lightCombo: track([
    [0, 'stance', 'smooth'],
    [0.16, 'slashWind', 'smoother'],
    [0.34, 'slashHit', 'overshoot'],
    [0.50, 'slashFollow', 'smooth'],
    [0.66, 'slash2Wind', 'smoother'],
    [0.82, 'slashHit', 'overshoot'],
    [1.00, 'slashFollow', 'smooth'],
    [1.28, 'stance', 'out'],
  ]),
  heavyOverhead: track([
    [0, 'stance', 'smooth'],
    [0.24, 'slashWind', 'in'],
    [0.58, 'overheadWind', 'smoother'],
    [0.98, 'overheadHit', 'overshoot'],
    [1.26, 'overheadFollow', 'smooth'],
    [1.65, 'stance', 'out'],
  ]),
  thrust: track([
    [0, 'stance', 'smooth'],
    [0.20, 'thrustWind', 'smoother'],
    [0.40, 'thrustHit', 'overshoot'],
    [0.66, 'slashFollow', 'smooth'],
    [1.00, 'stance', 'out'],
  ]),
  block: track([
    [0, 'stance'], [0.10, 'block', 'out'], [0.58, 'block'], [0.90, 'stance', 'smooth'],
  ]),
  dodge: track([
    [0, 'stance'], [0.08, 'dodge', 'out'], [0.34, 'dodge'], [0.58, 'stance', 'smooth'],
  ]),
  stagger: track([
    [0, 'stance'], [0.08, 'stagger', 'out'], [0.44, 'stagger'], [0.88, 'stance', 'smooth'],
  ]),
  knockdown: track([
    [0.00, 'stagger', 'in'],
    [0.22, 'falling', 'smoother'],
    [0.48, 'flat', 'out'],
    [1.15, 'flat'],
    [1.48, 'pushUp', 'smoother'],
    [1.88, 'kneelUp', 'smooth'],
    [2.35, 'getUp', 'smoother'],
    [2.85, 'stance', 'out'],
  ]),
};

export function sampleClip(name, localT) {
  return sampleKeys(CLIPS[name], localT);
}

export const DURATION = 15.0;

export function sampleWorld(t) {
  const { p1Start, p1End, p2Start, p2End, walkStart, walkEnd, ground } = RING;
  const travel = (t0, t1, a, b) => mix(a, b, clamp((t - t0) / (t1 - t0), 0, 1));
  const p1x = t < walkStart ? p1Start : t < walkEnd ? travel(walkStart, walkEnd, p1Start, p1End) : p1End;
  const p2x = t < walkStart ? p2Start : t < walkEnd ? travel(walkStart, walkEnd, p2Start, p2End) : p2End;
  const moving = t >= walkStart && t < walkEnd;
  const dist = p1End - p1Start;
  const cadence = 1.02;
  const stride = dist / (cadence * (walkEnd - walkStart));
  return {
    t, ground, p1x, p2x, moving, cadence, stride, walkStart, walkEnd,
    events: [
      { at: 3.35, dur: 1.28, who: 'p2', clip: 'lightCombo' },
      { at: 3.52, dur: 0.92, who: 'p1', clip: 'block' },
      { at: 5.05, dur: 1.65, who: 'p1', clip: 'heavyOverhead' },
      { at: 5.78, dur: 0.90, who: 'p2', clip: 'block' },
      { at: 7.10, dur: 1.00, who: 'p2', clip: 'thrust' },
      { at: 7.28, dur: 0.58, who: 'p1', clip: 'dodge', root: -48 },
      { at: 8.20, dur: 0.55, who: 'p1', clip: 'stance' },
      { at: 8.75, dur: 1.28, who: 'p1', clip: 'lightCombo' },
      { at: 9.02, dur: 0.88, who: 'p2', clip: 'stagger', root: -36 },
      { at: 10.35, dur: 1.65, who: 'p1', clip: 'heavyOverhead' },
      { at: 11.05, dur: 2.85, who: 'p2', clip: 'knockdown', root: -72 },
    ],
  };
}

function knockdownFeet(pose, rootX, facing, ground) {
  const lie = pose.lie || 0;
  const kneel = pose.kneel || 0;
  if (lie > 0.2) {
    return {
      R: { x: rootX + facing * mix(18, 150, lie), y: ground, angle: facing * mix(0, 0.18, lie), lift: 0 },
      L: { x: rootX + facing * mix(-26, 128, lie), y: ground, angle: facing * mix(0, 0.10, lie), lift: 0 },
    };
  }
  if (kneel > 0.15) {
    return {
      R: { x: rootX + facing * mix(14, 40, kneel), y: ground, angle: 0, lift: 0 },
      L: { x: rootX + facing * mix(-26, -8, kneel), y: ground, angle: facing * 0.85 * kneel, lift: 0 },
    };
  }
  return null;
}

export function poseFor(who, world) {
  const facing = who === 'p1' ? 1 : -1;
  const startX = who === 'p1' ? RING.p1Start : RING.p2Start;
  const endX = who === 'p1' ? RING.p1End : RING.p2End;
  const baseX = who === 'p1' ? world.p1x : world.p2x;
  let rootShift = 0;
  let pose = stancePose(world.t);
  let inKnock = false;

  if (world.moving) {
    const phase = (world.t - world.walkStart) * world.cadence;
    pose.hipBob = Math.abs(Math.cos(phase * Math.PI * 2)) * 2.6;
    pose.hipYaw = Math.sin(phase * Math.PI * 2) * 0.32;
    pose.lean = 0.05 + Math.sin(phase * Math.PI * 2) * 0.035;
    pose.chestBob = Math.sin(phase * Math.PI * 2 + Math.PI) * 1.6;
    pose.tabard = Math.sin(phase * Math.PI * 2 - 0.55) * 14;
    pose.hands = {
      lead: { x: 30, y: 48 + Math.sin(phase * Math.PI * 2 + Math.PI) * 9 },
      rear: { x: 20, y: 28 + Math.sin(phase * Math.PI * 2) * 9 },
    };
    pose.weaponAngle = 0.64 + Math.sin(phase * Math.PI * 2) * 0.1;
  }

  for (const ev of world.events) {
    if (ev.who !== who) continue;
    if (world.t < ev.at || world.t > ev.at + ev.dur) continue;
    const local = world.t - ev.at;
    const clipPose = ev.clip === 'stance' ? stancePose(world.t) : sampleClip(ev.clip, local);
    pose = { ...pose, ...clipPose };
    if (ev.root) {
      const u = smoother(clamp(local / Math.min(0.42, ev.dur * 0.45), 0, 1));
      rootShift = ev.root * facing * u;
    }
    if (ev.clip === 'knockdown') inKnock = true;
  }

  const rootX = baseX + rootShift;
  const feet = walkFeetAt(world.t, world.walkStart, world.walkEnd, startX, endX, facing, world.ground, world.cadence, world.stride);
  if (world.t > world.walkEnd + 0.45 && !world.moving) {
    feet.R = { x: rootX + facing * HEAD * 0.34, y: world.ground, angle: 0, lift: 0, planted: true };
    feet.L = { x: rootX - facing * HEAD * 0.30, y: world.ground, angle: 0, lift: 0, planted: true };
  }
  const kd = inKnock ? knockdownFeet(pose, rootX, facing, world.ground) : null;
  pose = applyFeet(pose, kd || feet, rootX, facing, world.ground);

  pose.hop = pose.hop || 0;
  if (pose.hop) {
    pose.footR = { ...pose.footR, y: world.ground - pose.hop * 0.4 };
    pose.footL = { ...pose.footL, y: world.ground - pose.hop * 0.65 };
  }

  pose.facing = facing;
  pose.rootX = rootX;
  pose.groundY = world.ground;
  pose.tabard = (pose.tabard || 0) + Math.sin(world.t * 1.45 + (who === 'p1' ? 0 : 1.1)) * 1.6;
  return pose;
}
