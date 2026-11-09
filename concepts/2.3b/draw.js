// Concept 2.3b renderer — taller upright humans, organic limbs, grit.
// Original art only. Not shipping code.

export const HEAD = 40;
const H = HEAD;
const INK = '#141210';

export function shade(hex, amt) {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(v.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(v.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(v.slice(4, 6), 16) + amt));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function twoBone(origin, target, upper, lower, prefer) {
  const dx = target.x - origin.x, dy = target.y - origin.y;
  let dist = Math.hypot(dx, dy) || 1;
  const maxd = upper + lower - 1.8, mind = Math.abs(upper - lower) + 2.4;
  let tx = target.x, ty = target.y;
  if (dist > maxd) { const s = maxd / dist; tx = origin.x + dx * s; ty = origin.y + dy * s; dist = maxd; }
  if (dist < mind) dist = mind;
  const ux = (tx - origin.x) / dist, uy = (ty - origin.y) / dist;
  const a = (dist * dist + upper * upper - lower * lower) / (2 * dist);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const mx = origin.x + ux * a, my = origin.y + uy * a;
  const p1 = { x: -uy, y: ux }, p2 = { x: uy, y: -ux };
  const d1 = p1.x * prefer.x + p1.y * prefer.y;
  const d2 = p2.x * prefer.x + p2.y * prefer.y;
  const p = d1 >= d2 ? p1 : p2;
  return { joint: { x: mx + p.x * h, y: my + p.y * h }, end: { x: origin.x + ux * dist, y: origin.y + uy * dist } };
}

export const BUILDS = {
  lightRapier: {
    id: 'lightRapier', label: 'Light  ·  padded leather  ·  rapier',
    armour: 'leather', weapon: 'rapier', shield: 'none', twoHanded: false,
    cloth: '#5a4a3a', skin: '#8a6a52', hair: '#2a221c',
  },
  mediumSword: {
    id: 'mediumSword', label: 'Medium  ·  mail  ·  sword & shield',
    armour: 'mail', weapon: 'sword', shield: 'heater', twoHanded: false,
    cloth: '#3e3834', skin: '#7a5c48', hair: '#1a1612',
  },
  mediumAxe: {
    id: 'mediumAxe', label: 'Medium  ·  mail  ·  axe',
    armour: 'mail', weapon: 'axe', shield: 'none', twoHanded: false,
    cloth: '#3a403c', skin: '#80644c', hair: '#221c16',
  },
  heavyMace: {
    id: 'heavyMace', label: 'Heavy  ·  plate  ·  mace & shield',
    armour: 'plate', weapon: 'mace', shield: 'heater', twoHanded: false,
    cloth: '#3a342e', skin: '#705644', hair: '#14110e',
  },
  heavyClaymore: {
    id: 'heavyClaymore', label: 'Heavy  ·  plate  ·  claymore',
    armour: 'plate', weapon: 'claymore', shield: 'none', twoHanded: true,
    cloth: '#3c322e', skin: '#785a46', hair: '#181410',
  },
};

export function palette(build = {}) {
  const cloth = build.cloth || '#4a4038';
  if (build.armour === 'leather') {
    return {
      armour: 'leather', cloth, skin: build.skin || '#8a6a52', hair: build.hair || '#2a221c',
      plate: { dark: '#2a1e16', mid: '#4e3828', light: '#7a5840', shine: '#a07858' },
      metal: { dark: '#2a2824', mid: '#4e4a44', light: '#7a7670', shine: '#b0aaa0' },
      leather: { dark: '#1e1610', mid: '#3e2c20', light: '#6a4c36', shine: '#8a6848' },
      pad: { dark: '#3a3428', mid: '#5a5040', light: '#8a7a60', shine: '#b0a080' },
    };
  }
  if (build.armour === 'mail') {
    return {
      armour: 'mail', cloth, skin: build.skin || '#7a5c48', hair: build.hair || '#1a1612',
      plate: { dark: '#24282c', mid: '#3e464c', light: '#6a7278', shine: '#9aa2a6' },
      metal: { dark: '#222428', mid: '#444a4e', light: '#787e82', shine: '#b0b4b6' },
      leather: { dark: '#221a14', mid: '#3e2c22', light: '#5e4636', shine: '#7a5c44' },
      pad: { dark: '#2e3234', mid: '#4a5054', light: '#72787c', shine: '#a4aaae' },
    };
  }
  return {
    armour: 'plate', cloth, skin: build.skin || '#705644', hair: build.hair || '#14110e',
    plate: { dark: '#1c2024', mid: '#3a4248', light: '#6a7278', shine: '#9aa0a4' },
    metal: { dark: '#1e2024', mid: '#3e4448', light: '#72787e', shine: '#b4b8ba' },
    leather: { dark: '#1a1410', mid: '#32261c', light: '#5a4434', shine: '#7a5c44' },
    pad: { dark: '#2a2e32', mid: '#444a50', light: '#6e7478', shine: '#a2a8ac' },
  };
}

export function weaponReach(id) {
  if (id === 'claymore') return 6.55 * H;
  if (id === 'rapier') return 4.25 * H;
  if (id === 'sword') return 3.65 * H;
  if (id === 'axe') return 3.45 * H;
  if (id === 'mace') return 3.15 * H;
  return 3.5 * H;
}

function path(c, pts, fill, stroke = INK, width = 1.35) {
  if (!pts.length) return;
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function clipPath(c, pts) {
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.clip();
}

function grit(c, pts, seed = 1) {
  if (!pts.length) return;
  c.save();
  clipPath(c, pts);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  for (let y = minY; y < maxY; y += 2.4) {
    for (let x = minX; x < maxX; x += 2.4) {
      const n = hash(x * 0.37 + seed, y * 0.51 + seed * 2.1);
      if (n > 0.62) {
        c.fillStyle = `rgba(8,6,4,${0.14 + (n - 0.62) * 0.55})`;
        c.fillRect(x, y, 1.4, 1.4);
      } else if (n < 0.09) {
        c.fillStyle = `rgba(96,46,24,${0.16 + n * 1.4})`;
        c.fillRect(x, y, 2.1, 1.7);
      }
    }
  }
  c.strokeStyle = 'rgba(10,8,6,0.38)';
  c.lineWidth = 0.9;
  for (let i = 0; i < 9; i++) {
    const n = hash(seed * 9 + i, seed * 3);
    const x0 = minX + n * (maxX - minX);
    const y0 = minY + hash(i, seed) * (maxY - minY);
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 + 8 + n * 14, y0 + (hash(i, 4) - 0.5) * 7);
    c.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const n = hash(seed * 4.2 + i, seed + 11);
    c.fillStyle = `rgba(12,10,8,${0.16 + n * 0.2})`;
    c.beginPath();
    c.ellipse(minX + n * (maxX - minX), minY + hash(i, seed + 2) * (maxY - minY), 3.5 + n * 4, 2 + n * 2, n * 2, 0, Math.PI * 2);
    c.fill();
  }
  // dirt near the bottom of the shape
  const g = c.createLinearGradient(0, minY, 0, maxY);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.55, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(20,14,8,0.34)');
  c.fillStyle = g;
  c.fillRect(minX, minY, maxX - minX, maxY - minY);
  c.restore();
}

function rim(c, edge, color = 'rgba(210,200,180,0.22)') {
  c.strokeStyle = color; c.lineWidth = 1.3;
  c.beginPath();
  edge.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.stroke();
}

function profileW(profile, t) {
  let a = profile[0], b = profile[profile.length - 1];
  for (let i = 0; i < profile.length - 1; i++) {
    if (t >= profile[i].t && t <= profile[i + 1].t) { a = profile[i]; b = profile[i + 1]; break; }
  }
  const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return a.w + (b.w - a.w) * u;
}

function organicLimb(c, a, b, profile, pal, seed = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const left = [], right = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const w = profileW(profile, t);
    const x = a.x + ux * len * t, y = a.y + uy * len * t;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  }
  const pts = left.concat(right.slice().reverse());
  const g = c.createLinearGradient(a.x - nx * 16, a.y - ny * 16, a.x + nx * 16, a.y + ny * 16);
  g.addColorStop(0, pal.dark);
  g.addColorStop(0.28, pal.mid);
  g.addColorStop(0.58, pal.light);
  g.addColorStop(0.82, pal.mid);
  g.addColorStop(1, pal.dark);
  path(c, pts, g, INK, 1.25);
  grit(c, pts, seed);
  rim(c, left);
  return pts;
}

export function layout(pose = {}, build = {}) {
  const facing = pose.facing ?? 1;
  const ground = pose.groundY ?? 520;
  const rootX = pose.rootX ?? 200;
  const hop = pose.hop ?? 0;
  const hipDrop = (pose.hipDrop ?? 0.02) * H;
  const lean = (pose.lean ?? 0.03) * facing;
  const weight = (pose.weight ?? 0.04) * facing * H * 0.22;
  const G = ground - hop;
  const yaw = (pose.hipYaw ?? 0) * facing;

  // Long-legged 7.5-head stand: crotch ~4 heads up, shoulders ~6.25, crown ~7.5.
  const pelvis = {
    x: rootX + Math.sin(lean) * 6 + weight,
    y: G - 4.05 * H + hipDrop + (pose.hipBob || 0),
  };
  const torsoLen = 2.18 * H;
  const shoulderC = {
    x: pelvis.x + Math.sin(lean) * torsoLen,
    y: pelvis.y - Math.cos(lean) * torsoLen + (pose.chestBob || 0),
  };
  // Head follows the spine so a back-lean becomes a true lie-down, not a sit.
  // Small stances keep the head more upright (chin up) than the torso lean.
  const leanAmt = pose.lean ?? 0.03;
  const headLean = Math.abs(leanAmt) > 0.45 ? lean : lean * 0.22;
  const headC = {
    x: shoulderC.x + Math.sin(headLean) * H * 0.82,
    y: Math.min(G - 0.52 * H, shoulderC.y - Math.cos(headLean) * H * 0.82),
  };

  const hipR = { x: pelvis.x + facing * H * 0.20 + yaw * 6, y: pelvis.y + 3 };
  const hipL = { x: pelvis.x - facing * H * 0.22 - yaw * 6, y: pelvis.y + 2 };
  const shR = { x: shoulderC.x + facing * H * 0.42 - yaw * 5, y: shoulderC.y + 4 };
  const shL = { x: shoulderC.x - facing * H * 0.44 + yaw * 5, y: shoulderC.y + 3 };

  const footR = pose.footR || { x: rootX + facing * H * 0.34, y: G, angle: 0 };
  const footL = pose.footL || { x: rootX - facing * H * 0.30, y: G, angle: 0 };
  const ankleR = { x: footR.x, y: (footR.y ?? G) - 9 };
  const ankleL = { x: footL.x, y: (footL.y ?? G) - 9 };
  const toeR = {
    x: ankleR.x + facing * 18 * Math.cos(footR.angle || 0),
    y: (footR.y ?? G) - (footR.lift || 0) + 8 * Math.sin(footR.angle || 0),
  };
  const toeL = {
    x: ankleL.x + facing * 16 * Math.cos(footL.angle || 0),
    y: (footL.y ?? G) - (footL.lift || 0) + 7 * Math.sin(footL.angle || 0),
  };

  const thigh = 2.05 * H, shin = 1.86 * H;
  const preferLeg = (pose.lie || 0) > 0.35
    ? { x: 0, y: -1.25 }
    : { x: facing * 1.4, y: -0.22 };
  const legR = twoBone(hipR, ankleR, thigh, shin, preferLeg);
  const legL = twoBone(hipL, ankleL, thigh, shin, preferLeg);

  let handR, handL;
  if (pose.hands) {
    handR = { x: shoulderC.x + pose.hands.lead.x * facing, y: shoulderC.y + pose.hands.lead.y };
    handL = { x: shoulderC.x + pose.hands.rear.x * facing, y: shoulderC.y + pose.hands.rear.y };
  } else {
    handR = { x: shoulderC.x + facing * H * 0.70, y: shoulderC.y + H * 1.28 };
    handL = { x: shoulderC.x + facing * H * 0.48, y: shoulderC.y + H * 0.70 };
  }
  handR = { ...handR, y: Math.min(handR.y, G - 6) };
  handL = { ...handL, y: Math.min(handL.y, G - 6) };

  const upperA = 1.38 * H, lowerA = 1.22 * H;
  const preferArm = { x: -facing * 0.18, y: 1.05 };
  let armR = twoBone(shR, handR, upperA, lowerA, preferArm);
  let armL = twoBone(shL, handL, upperA, lowerA, preferArm);

  const id = build.weapon || 'sword';
  const reach = pose.reach ?? weaponReach(id);
  const weaponA = pose.weaponAngleOverride != null
    ? pose.weaponAngleOverride
    : facing * (pose.weaponAngle ?? 0.70);
  const grip = armR.end;

  if (build.twoHanded) {
    const along = 0.19 * reach;
    handL = { x: grip.x + Math.sin(weaponA) * along, y: grip.y - Math.cos(weaponA) * along };
    armL = twoBone(shL, handL, upperA, lowerA, preferArm);
  }

  const gripLocal = reach * (id === 'claymore' ? 0.21 : 0.25);
  const weapon = {
    x: grip.x + Math.sin(weaponA) * gripLocal,
    y: grip.y - Math.cos(weaponA) * gripLocal,
    a: weaponA, reach, id,
  };

  return {
    facing, ground: G, rootX, H, pelvis, shoulderC, headC,
    hipR, hipL, shR, shL,
    kneeR: legR.joint, ankleR: legR.end, toeR, footR, footL,
    kneeL: legL.joint, ankleL: legL.end, toeL,
    elbowR: armR.joint, handR: armR.end,
    elbowL: armL.joint, handL: armL.end,
    weapon, lean, hop, tabard: pose.tabard || 0, shieldRaise: pose.shieldRaise ?? 0.45,
  };
}

export function kneeSign(hip, knee, ankle) {
  return (ankle.x - hip.x) * (knee.y - hip.y) - (ankle.y - hip.y) * (knee.x - hip.x);
}

export function kneesForward(L, pose = {}) {
  const sR = kneeSign(L.hipR, L.kneeR, L.ankleR);
  const sL = kneeSign(L.hipL, L.kneeL, L.ankleL);
  const want = -Math.sign(L.facing || 1);
  // Recumbent: just keep knees off the dirt and on the sky side of the bones.
  if ((pose.lie || 0) > 0.3 || (L.ground - L.pelvis.y) < 48) {
    const up = (knee, hip, ankle) => knee.y <= Math.max(hip.y, ankle.y) + 6 && knee.y < L.ground - 3;
    const okR = up(L.kneeR, L.hipR, L.ankleR);
    const okL = up(L.kneeL, L.hipL, L.ankleL);
    return { ok: okR && okL, sR, sL, okR, okL };
  }
  const okR = Math.abs(sR) < 220 || Math.sign(sR) === want || Math.sign(sR) === 0;
  const okL = Math.abs(sL) < 220 || Math.sign(sL) === want || Math.sign(sL) === 0;
  return { ok: okR && okL, sR, sL, okR, okL };
}

export function characterHeight(L) {
  return L.ground - (L.headC.y - 0.48 * L.H);
}

function drawShadow(c, L) {
  const x = (L.ankleR.x + L.ankleL.x) * 0.5;
  const spread = Math.max(28, Math.abs(L.ankleR.x - L.ankleL.x) * 0.58 + 22);
  const g = c.createRadialGradient(x, L.ground + 2, 4, x, L.ground + 2, spread);
  g.addColorStop(0, 'rgba(8,6,4,0.45)');
  g.addColorStop(1, 'rgba(8,6,4,0)');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, L.ground + 3, spread, 8, 0, 0, Math.PI * 2);
  c.fill();
}

function drawBoot(c, ankle, toe, facing, pal, plated, seed) {
  const tip = { x: toe.x + facing * 6, y: toe.y };
  const heel = { x: ankle.x - facing * 12, y: ankle.y + 8 };
  const top = { x: ankle.x + facing * 2, y: ankle.y - 6 };
  const pts = [
    [heel.x, heel.y], [top.x - facing * 7, top.y], [top.x + facing * 10, top.y + 1],
    [tip.x, tip.y - 1], [tip.x + facing * 4, tip.y + 6], [heel.x - facing * 2, heel.y + 6],
  ];
  const g = c.createLinearGradient(heel.x, heel.y - 10, tip.x, tip.y);
  const src = plated ? pal.plate : pal.leather;
  g.addColorStop(0, src.dark); g.addColorStop(0.45, src.mid); g.addColorStop(1, src.light);
  path(c, pts, g);
  grit(c, pts, seed);
}

function mailFill(c, pts, pal) {
  path(c, pts, pal.plate.mid);
  c.save(); clipPath(c, pts);
  c.strokeStyle = pal.plate.dark; c.lineWidth = 0.85;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  for (let y = minY; y < maxY; y += 4.6) {
    for (let x = minX; x < maxX; x += 5.6) {
      c.beginPath();
      c.arc(x + ((Math.floor(y / 4.6) % 2) ? 2.6 : 0), y, 2.0, 0, Math.PI);
      c.stroke();
    }
  }
  c.restore();
  grit(c, pts, 11);
  c.strokeStyle = INK; c.lineWidth = 1.3;
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.stroke();
}

function quiltFill(c, pts, pal) {
  path(c, pts, pal.pad.mid);
  c.save(); clipPath(c, pts);
  c.strokeStyle = pal.pad.dark; c.lineWidth = 0.75;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  for (let y = minY; y < maxY; y += 8) { c.beginPath(); c.moveTo(minX, y); c.lineTo(maxX, y); c.stroke(); }
  for (let x = minX; x < maxX; x += 8) { c.beginPath(); c.moveTo(x, minY); c.lineTo(x, maxY); c.stroke(); }
  c.fillStyle = pal.pad.dark;
  for (let y = minY + 4; y < maxY; y += 8)
    for (let x = minX + 4; x < maxX; x += 8) { c.beginPath(); c.arc(x, y, 0.9, 0, Math.PI * 2); c.fill(); }
  c.restore();
  grit(c, pts, 7);
  c.strokeStyle = INK; c.lineWidth = 1.25;
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.stroke();
}

function drawTorso(c, L, pal, build) {
  const s = H;
  c.save();
  c.translate(L.pelvis.x, L.pelvis.y);
  c.rotate(L.lean);
  // Human torso: broader shoulders, narrower waist — not a robot box.
  const outline = [
    [-0.38 * s, 0.16 * s], [-0.42 * s, -0.28 * s], [-0.48 * s, -1.15 * s], [-0.50 * s, -1.95 * s],
    [-0.22 * s, -2.22 * s], [0.20 * s, -2.22 * s], [0.52 * s, -1.95 * s], [0.50 * s, -1.15 * s],
    [0.40 * s, -0.32 * s], [0.30 * s, 0.04 * s], [0.34 * s, 0.20 * s],
  ];
  if (pal.armour === 'mail') mailFill(c, outline, pal);
  else if (pal.armour === 'leather') quiltFill(c, outline, pal);
  else {
    const g = c.createLinearGradient(-0.55 * s, -s, 0.55 * s, 0);
    g.addColorStop(0, pal.plate.dark);
    g.addColorStop(0.35, pal.plate.mid);
    g.addColorStop(0.62, pal.plate.light);
    g.addColorStop(1, pal.plate.dark);
    path(c, outline, g, INK, 1.5);
    path(c, [
      [-0.18 * s, -2.05 * s], [0.04 * s, -2.12 * s], [0.10 * s, -0.55 * s],
      [-0.02 * s, -0.18 * s], [-0.24 * s, -0.58 * s],
    ], pal.plate.light, null);
    c.globalAlpha = 0.22;
    path(c, [
      [-0.18 * s, -2.05 * s], [0.04 * s, -2.12 * s], [0.10 * s, -0.55 * s],
      [-0.02 * s, -0.18 * s], [-0.24 * s, -0.58 * s],
    ], pal.plate.shine, null);
    c.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const y = 0.00 * s + i * 0.18 * s;
      path(c, [
        [-0.36 * s, y], [0.28 * s, y], [0.34 * s, y + 0.16 * s], [-0.40 * s, y + 0.16 * s],
      ], i % 2 ? pal.plate.mid : pal.plate.light);
    }
    grit(c, outline, 19);
  }

  if (pal.armour === 'leather') {
    const jerkin = [[-0.34 * s, -1.85 * s], [0.32 * s, -1.85 * s], [0.34 * s, -0.12 * s], [-0.36 * s, -0.10 * s]];
    path(c, jerkin, pal.leather.mid);
    grit(c, jerkin, 5);
  }

  path(c, [[-0.38 * s, 0.00 * s], [0.32 * s, 0.00 * s], [0.34 * s, 0.18 * s], [-0.40 * s, 0.18 * s]], pal.leather.mid);
  c.beginPath(); c.arc(0.02 * s, 0.10 * s, 3.4, 0, Math.PI * 2);
  c.fillStyle = pal.metal.light; c.fill();

  const sway = L.tabard || 0;
  const cloth = [
    [-0.16 * s, -0.75 * s], [0.14 * s, -0.75 * s],
    [0.26 * s + sway * 0.08, 1.35 * s], [0.04 * s + sway * 0.05, 1.58 * s],
    [-0.20 * s + sway * 0.08, 1.38 * s],
  ];
  path(c, cloth, build.cloth || pal.cloth, INK, 1.2);
  grit(c, cloth, 23);
  // frayed hem
  c.strokeStyle = shade(build.cloth || pal.cloth, -30); c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = (-0.18 + t * 0.42) * s + sway * 0.07;
    c.beginPath(); c.moveTo(x, 1.42 * s); c.lineTo(x + (i % 2 ? 2 : -2), 1.62 * s); c.stroke();
  }
  c.strokeStyle = pal.leather.dark; c.lineWidth = 2.1;
  c.beginPath();
  c.moveTo(-0.30 * s, -1.85 * s); c.lineTo(-0.16 * s, 0.06 * s);
  c.moveTo(0.26 * s, -1.82 * s); c.lineTo(0.14 * s, 0.06 * s);
  c.stroke();
  c.restore();
}

function drawHead(c, L, pal, build) {
  c.save();
  c.translate(L.headC.x, L.headC.y);
  c.rotate(L.lean * 0.2);
  const d = L.facing;
  // Oval head, not a ball — jaw slightly narrower.
  c.beginPath(); c.ellipse(0, 2, 11.5, 13.8, 0, 0, Math.PI * 2);
  c.fillStyle = pal.skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = '#2a1c1488';
  c.beginPath(); c.ellipse(d * 3.8, 1.5, 6.5, 10.5, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  path(c, [[-10, 1], [-11, -9], [-5, -16], [5, -15], [11, -7], [10, 2], [5, -7], [-4, -6]], pal.hair);
  c.fillStyle = INK; c.fillRect(d * 3.4, -1.4, 3.2, 1.6);
  c.strokeStyle = '#4a3228'; c.lineWidth = 1.15;
  c.beginPath(); c.moveTo(d * 2.4, 4.2); c.lineTo(d * 7.8, 3.2); c.stroke();
  c.beginPath(); c.moveTo(d * 2.2, 8.4); c.quadraticCurveTo(d * 5.2, 10.4, d * 8.2, 7.8); c.stroke();

  if (build.armour === 'plate') {
    const helm = [
      [-13, 3], [-12, -9], [-6, -17], [6, -16], [13, -8], [14, 5],
      [8, 9], [6, -1], [-6, -1], [-9, 9],
    ];
    const g = c.createLinearGradient(-12, -16, 12, 10);
    g.addColorStop(0, pal.plate.dark); g.addColorStop(0.45, pal.plate.mid);
    g.addColorStop(0.72, pal.plate.light); g.addColorStop(1, pal.plate.dark);
    path(c, helm, g);
    path(c, [[-7, 0], [7, 0], [6, 11], [2, 15], [-3, 15], [-7, 10]], pal.plate.mid);
    c.fillStyle = '#101012'; c.fillRect(-6.5, 2.0, 13, 3.1);
    for (let x = -5; x <= 4; x += 3.4) c.fillRect(x, 7.2, 1.6, 4.2);
    grit(c, helm, 29);
  } else if (build.armour === 'mail') {
    const coif = [[-12, 5], [-11, -6], [-5, -13], [6, -12], [12, -3], [11, 7], [4, 3], [-5, 3]];
    mailFill(c, coif, pal);
    path(c, [[d * 2, -2], [d * 5.5, -8], [d * 6.2, 9], [d * 2, 10]], pal.plate.light);
  } else {
    const cap = [[-11, -1], [-10, -12], [-3, -16], [7, -14], [12, -5], [10, 3]];
    path(c, cap, pal.leather.mid);
    grit(c, cap, 3);
  }
  c.restore();
}

function drawShield(c, L, pal, build) {
  if (!build.shield || build.shield === 'none') return;
  const h = L.handL;
  c.save();
  c.translate(h.x, h.y);
  c.rotate(L.lean * 0.25 + L.facing * (0.12 - L.shieldRaise * 0.18));
  const pts = [[-22, -30], [20, -27], [18, 12], [0, 38], [-20, 14]];
  const g = c.createLinearGradient(-22, -28, 16, 32);
  g.addColorStop(0, pal.leather.dark);
  g.addColorStop(0.45, shade(build.cloth || pal.cloth, -25));
  g.addColorStop(1, pal.leather.mid);
  path(c, pts, g, INK, 1.7);
  grit(c, pts, 31);
  path(c, [[-15, -20], [0, -20], [0, 26], [-13, 10]], pal.metal.mid, null);
  c.beginPath(); c.arc(-2, -2, 5.5, 0, Math.PI * 2);
  c.fillStyle = pal.metal.light; c.fill(); c.stroke();
  c.restore();
}

export function drawWeapon(c, w) {
  if (!w || !w.id) return;
  const r = w.reach, id = w.id;
  c.save(); c.translate(w.x, w.y); c.rotate(w.a || 0);
  const wood = '#3e2c1e', wrap = '#4a3428';
  const bladeG = c.createLinearGradient(-9, 0, 9, 0);
  bladeG.addColorStop(0, '#3a4044'); bladeG.addColorStop(0.42, '#b8bcb6');
  bladeG.addColorStop(0.7, '#7a8084'); bladeG.addColorStop(1, '#2e3438');
  const shaft = (y1, y2, width = 5.8, col = wood) => {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2;
    c.fillRect(-width / 2, y1, width, y2 - y1); c.strokeRect(-width / 2, y1, width, y2 - y1);
  };
  const grip = (y1, y2, width = 6.8) => {
    shaft(y1, y2, width, wrap);
    c.strokeStyle = '#6a4a34'; c.lineWidth = 1;
    for (let y = y1 + 2; y < y2; y += 4.2) {
      c.beginPath(); c.moveTo(-width / 2, y); c.lineTo(width / 2, y + 1.5); c.stroke();
    }
  };
  if (id === 'claymore') {
    const tip = -r * 0.52, ric = -r * 0.06, grd = r * 0.10, end = r * 0.42, pom = r * 0.48;
    const blade = [[-9.5, grd], [-8.6, ric], [-6.2, tip + r * 0.14], [0, tip], [6.2, tip + r * 0.14], [8.6, ric], [9.5, grd]];
    path(c, blade, bladeG);
    grit(c, blade, 41);
    c.strokeStyle = '#d8dcd6'; c.lineWidth = 1.15;
    c.beginPath(); c.moveTo(0, ric + 2); c.lineTo(0, tip + r * 0.16); c.stroke();
    path(c, [[-8, grd], [-8, ric], [8, ric], [8, grd]], '#6a7074');
    path(c, [[-8, ric + 2], [-28, ric - 11], [-30, ric - 2], [-8, ric + 11]], '#5a6268');
    path(c, [[8, ric + 2], [28, ric - 11], [30, ric - 2], [8, ric + 11]], '#5a6268');
    c.fillStyle = '#4a5056'; c.fillRect(-32, grd - 4, 64, 8); c.strokeStyle = INK; c.strokeRect(-32, grd - 4, 64, 8);
    grip(grd + 5, end, 7.8);
    c.beginPath(); c.arc(0, pom, 7.6, 0, Math.PI * 2); c.fillStyle = '#5a544e'; c.fill(); c.stroke();
  } else if (id === 'rapier') {
    path(c, [[-2.2, r * 0.07], [-1.9, -r * 0.38], [0, -r * 0.52], [1.9, -r * 0.38], [2.2, r * 0.07]], bladeG);
    c.beginPath(); c.ellipse(0, r * 0.15, 12, 8.5, -0.12, 0, Math.PI * 2);
    c.strokeStyle = '#5a544c'; c.lineWidth = 2.5; c.stroke();
    grip(r * 0.20, r * 0.38, 5); c.beginPath(); c.arc(0, r * 0.43, 3.4, 0, Math.PI * 2); c.fillStyle = '#5a544c'; c.fill();
  } else if (id === 'sword') {
    const blade = [[-5.2, r * 0.08], [-4.8, -r * 0.34], [0, -r * 0.50], [4.8, -r * 0.34], [5.2, r * 0.08]];
    path(c, blade, bladeG); grit(c, blade, 17);
    c.fillStyle = '#4e5458'; c.fillRect(-16, r * 0.06, 32, 5); c.strokeRect(-16, r * 0.06, 32, 5);
    grip(r * 0.13, r * 0.35, 6.2); c.beginPath(); c.arc(0, r * 0.41, 4.4, 0, Math.PI * 2); c.fillStyle = '#5a544e'; c.fill(); c.stroke();
  } else if (id === 'axe') {
    shaft(-r * 0.28, r * 0.40, 5.8); grip(r * 0.16, r * 0.36, 6.6);
    const head = [[3, -r * 0.34], [30, -r * 0.40], [32, -r * 0.16], [13, -r * 0.02], [3, -r * 0.14]];
    path(c, head, bladeG); grit(c, head, 13);
  } else if (id === 'mace') {
    shaft(-r * 0.22, r * 0.38, 6); grip(r * 0.14, r * 0.34, 6.8);
    c.beginPath(); c.arc(0, -r * 0.32, 12.2, 0, Math.PI * 2); c.fillStyle = '#5a6268'; c.fill(); c.stroke();
    for (let i = 0; i < 6; i++) {
      c.save(); c.translate(0, -r * 0.32); c.rotate(i * Math.PI / 3);
      path(c, [[8.5, -3.6], [17.5, 0], [8.5, 3.6]], '#6a7278'); c.restore();
    }
  } else {
    path(c, [[-3.4, r * 0.1], [-3, -r * 0.26], [0, -r * 0.46], [3, -r * 0.26], [3.4, r * 0.1]], bladeG);
    grip(r * 0.14, r * 0.32, 5.6);
  }
  c.restore();
}

function drawArm(c, sh, elbow, hand, pal, build, facing, seed) {
  const k = H / 40;
  const skin = { dark: shade(pal.skin, -28), mid: pal.skin, light: shade(pal.skin, 22), shine: shade(pal.skin, 36) };
  if (build.armour === 'plate') {
    organicLimb(c, sh, elbow, [{ t: 0, w: 11 * k }, { t: 0.4, w: 12 * k }, { t: 1, w: 8.2 * k }], pal.plate, seed);
    organicLimb(c, elbow, hand, [{ t: 0, w: 8 * k }, { t: 0.45, w: 8.6 * k }, { t: 1, w: 6 * k }], pal.plate, seed + 1);
  } else if (build.armour === 'mail') {
    organicLimb(c, sh, elbow, [{ t: 0, w: 10 * k }, { t: 0.45, w: 10.6 * k }, { t: 1, w: 7.6 * k }], pal.plate, seed);
    organicLimb(c, elbow, hand, [{ t: 0, w: 7.4 * k }, { t: 0.4, w: 8 * k }, { t: 1, w: 5.6 * k }], pal.leather, seed + 1);
  } else {
    organicLimb(c, sh, elbow, [{ t: 0, w: 9.6 * k }, { t: 0.4, w: 10.4 * k }, { t: 1, w: 7.2 * k }], pal.pad, seed);
    organicLimb(c, elbow, hand, [{ t: 0, w: 7 * k }, { t: 0.45, w: 7.6 * k }, { t: 1, w: 5.4 * k }], pal.leather, seed + 1);
  }
  // gauntlet / hand as a tapered mitt, not a ball
  const mitt = pal.armour === 'leather' ? skin : (build.armour === 'plate' ? pal.plate : pal.leather);
  organicLimb(c, hand, { x: hand.x + facing * 8 * k, y: hand.y + 1 }, [{ t: 0, w: 6.2 * k }, { t: 1, w: 3.4 * k }], mitt, seed + 2);
}

function drawLeg(c, hip, knee, ankle, toe, pal, build, facing, seed) {
  const k = H / 40;
  if (build.armour === 'plate') {
    organicLimb(c, hip, knee, [{ t: 0, w: 13.5 * k }, { t: 0.38, w: 14.5 * k }, { t: 1, w: 9.2 * k }], pal.plate, seed);
    organicLimb(c, knee, ankle, [{ t: 0, w: 9 * k }, { t: 0.38, w: 11.4 * k }, { t: 1, w: 6.4 * k }], pal.plate, seed + 1);
    // poleyn as a short overlapping lame, not a disc
    organicLimb(c, { x: knee.x, y: knee.y - 6 * k }, { x: knee.x, y: knee.y + 7 * k },
      [{ t: 0, w: 8 * k }, { t: 0.5, w: 10 * k }, { t: 1, w: 8 * k }], pal.plate, seed + 3);
    drawBoot(c, ankle, toe, facing, pal, true, seed + 4);
  } else if (build.armour === 'mail') {
    organicLimb(c, hip, knee, [{ t: 0, w: 12.6 * k }, { t: 0.4, w: 13.6 * k }, { t: 1, w: 8.6 * k }], pal.plate, seed);
    organicLimb(c, knee, ankle, [{ t: 0, w: 8.4 * k }, { t: 0.4, w: 10.8 * k }, { t: 1, w: 6 * k }], pal.leather, seed + 1);
    drawBoot(c, ankle, toe, facing, pal, false, seed + 4);
  } else {
    organicLimb(c, hip, knee, [{ t: 0, w: 12.2 * k }, { t: 0.38, w: 13.4 * k }, { t: 1, w: 8.4 * k }], pal.pad, seed);
    organicLimb(c, knee, ankle, [{ t: 0, w: 8.2 * k }, { t: 0.4, w: 10.6 * k }, { t: 1, w: 5.8 * k }], pal.leather, seed + 1);
    drawBoot(c, ankle, toe, facing, pal, false, seed + 4);
  }
}

function drawPauldron(c, sh, facing, pal) {
  if (pal.armour === 'leather') return;
  c.save(); c.translate(sh.x, sh.y);
  const s = pal.armour === 'plate' ? 13.5 : 11;
  const pts = [
    [-s * 1.05, -s * 0.05], [-s * 0.8, -s * 0.95], [s * 0.25, -s * 1.1],
    [s * 1.15, -s * 0.4], [s * 1.15, s * 0.4], [s * 0.25, s * 0.75], [-s * 0.45, s * 0.45],
  ];
  const g = c.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, pal.plate.dark); g.addColorStop(0.4, pal.plate.mid);
  g.addColorStop(0.7, pal.plate.shine); g.addColorStop(1, pal.plate.dark);
  path(c, pts, g);
  grit(c, pts, 37);
  c.restore();
}

export function drawFighter(c, pose, build) {
  const pal = palette(build);
  const L = layout(pose, build);
  drawShadow(c, L);
  drawLeg(c, L.hipL, L.kneeL, L.ankleL, L.toeL, pal, build, L.facing, 2);
  drawArm(c, L.shL, L.elbowL, L.handL, pal, build, L.facing, 4);
  if (build.shield && build.shield !== 'none') drawShield(c, L, pal, build);
  drawTorso(c, L, pal, build);
  drawPauldron(c, L.shL, -L.facing, pal);
  drawLeg(c, L.hipR, L.kneeR, L.ankleR, L.toeR, pal, build, L.facing, 3);
  drawHead(c, L, pal, build);
  drawPauldron(c, L.shR, L.facing, pal);
  drawArm(c, L.shR, L.elbowR, L.handR, pal, build, L.facing, 5);
  drawWeapon(c, L.weapon);
  return L;
}

export function drawLineupBackdrop(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#14161a');
  g.addColorStop(0.5, '#242018');
  g.addColorStop(1, '#1a1612');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const torch = c.createRadialGradient(w * 0.22, h * 0.3, 20, w * 0.22, h * 0.35, w * 0.55);
  torch.addColorStop(0, 'rgba(180,110,50,0.16)');
  torch.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = torch; c.fillRect(0, 0, w, h);
  const vg = c.createRadialGradient(w * 0.5, h * 0.45, 60, w * 0.5, h * 0.5, w * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
  c.fillStyle = '#2a241c'; c.fillRect(0, h * 0.80, w, h);
  c.fillStyle = '#1a1612'; c.fillRect(0, h * 0.80, w, 3);
  drawDust(c, w, h);
}

export function drawDuskArena(c, w, h) {
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#121820');
  sky.addColorStop(0.45, '#2a2824');
  sky.addColorStop(1, '#1c1814');
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  // castle blocks
  for (let i = -1; i < 8; i++) {
    const x = i * 210 - 40;
    c.fillStyle = i % 2 ? '#1e2424' : '#252823';
    c.fillRect(x, 90 + (i % 2) * 28, 190, 360);
    c.fillStyle = '#161c1c';
    for (let j = 0; j < 5; j++) c.fillRect(x + j * 38, 78 + (i % 2) * 28, 24, 20);
    c.fillStyle = '#0e1414';
    c.beginPath(); c.roundRect(x + 70, 190 + (i % 2) * 18, 42, 90, [18, 18, 0, 0]); c.fill();
    if (i % 2 === 0) {
      // torch
      const tx = x + 150, ty = 210;
      const glow = c.createRadialGradient(tx, ty, 4, tx, ty, 70);
      glow.addColorStop(0, 'rgba(255,170,80,0.55)');
      glow.addColorStop(0.35, 'rgba(180,80,30,0.18)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = glow; c.beginPath(); c.arc(tx, ty, 70, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6a3a22'; c.fillRect(tx - 3, ty, 6, 22);
      c.fillStyle = '#e8a050'; c.beginPath(); c.arc(tx, ty - 2, 5, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = '#2e3430'; c.lineWidth = 1;
    for (let y = 120; y < 440; y += 24) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 190, y); c.stroke(); }
  }
  // haze
  const haze = c.createLinearGradient(0, 280, 0, h);
  haze.addColorStop(0, 'rgba(40,32,24,0)');
  haze.addColorStop(1, 'rgba(30,24,16,0.35)');
  c.fillStyle = haze; c.fillRect(0, 0, w, h);
  const vg = c.createRadialGradient(w * 0.5, h * 0.55, 80, w * 0.5, h * 0.6, w * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
  drawDust(c, w, h);
}

export function drawDuskGround(c, groundY, span = 4000) {
  c.fillStyle = '#2c261c'; c.fillRect(-span / 2, groundY, span, 900);
  c.fillStyle = '#1a1610'; c.fillRect(-span / 2, groundY, span, 4);
  for (let x = -800; x < 1600; x += 22) {
    c.fillStyle = x % 3 ? '#3a3226' : '#242018';
    c.fillRect(x, groundY + 10 + Math.abs(x * 11 % 50), 5 + Math.abs(x % 9), 2);
  }
}

function drawDust(c, w, h) {
  for (let i = 0; i < 90; i++) {
    const n = hash(i * 13.7, i * 8.2);
    const x = hash(i, 3.1) * w;
    const y = hash(i, 7.4) * h * 0.78;
    c.fillStyle = `rgba(200,176,140,${0.035 + n * 0.09})`;
    c.beginPath(); c.arc(x, y, 0.5 + n * 1.6, 0, Math.PI * 2); c.fill();
  }
}
