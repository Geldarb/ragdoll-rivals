// Concept 2.3 renderer — approval sheets only.
// Gritty realistic original art: 7.5-head proportions, muted steel/leather/cloth,
// layered plate and mail. Not shipping code; nothing copied from other games.

export const HEAD = 28;
const H = HEAD;
const INK = '#1c1916';

export function shade(hex, amt) {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(v.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(v.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(v.slice(4, 6), 16) + amt));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function twoBone(origin, target, upper, lower, prefer) {
  const dx = target.x - origin.x, dy = target.y - origin.y;
  let dist = Math.hypot(dx, dy) || 1;
  const maxd = upper + lower - 1.5, mind = Math.abs(upper - lower) + 2;
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
    cloth: '#6a5340', skin: '#8b6a52', hair: '#2a221c',
  },
  mediumSword: {
    id: 'mediumSword', label: 'Medium  ·  mail  ·  sword & shield',
    armour: 'mail', weapon: 'sword', shield: 'heater', twoHanded: false,
    cloth: '#4a3a38', skin: '#7d5e48', hair: '#1c1814',
  },
  mediumAxe: {
    id: 'mediumAxe', label: 'Medium  ·  mail  ·  axe',
    armour: 'mail', weapon: 'axe', shield: 'none', twoHanded: false,
    cloth: '#3e4540', skin: '#82644c', hair: '#241c16',
  },
  heavyMace: {
    id: 'heavyMace', label: 'Heavy  ·  plate  ·  mace & shield',
    armour: 'plate', weapon: 'mace', shield: 'heater', twoHanded: false,
    cloth: '#3a3330', skin: '#745844', hair: '#161310',
  },
  heavyClaymore: {
    id: 'heavyClaymore', label: 'Heavy  ·  plate  ·  claymore',
    armour: 'plate', weapon: 'claymore', shield: 'none', twoHanded: true,
    cloth: '#3d3332', skin: '#7a5c46', hair: '#1a1612',
  },
};

export function palette(build = {}) {
  const cloth = build.cloth || '#5a4840';
  if (build.armour === 'leather') {
    return {
      armour: 'leather', cloth, skin: build.skin || '#8b6a52', hair: build.hair || '#2a221c',
      plate: { dark: '#2a1c14', mid: '#5a3c28', light: '#8a6244', shine: '#b08a62' },
      metal: { dark: '#2a2824', mid: '#5a564c', light: '#8a8680', shine: '#c4c0b4' },
      leather: { dark: '#241810', mid: '#4a3224', light: '#7a5640', shine: '#b08a62' },
      pad: { dark: '#4a4030', mid: '#6e6250', light: '#9a8a70', shine: '#c4b490' },
    };
  }
  if (build.armour === 'mail') {
    return {
      armour: 'mail', cloth, skin: build.skin || '#7d5e48', hair: build.hair || '#1c1814',
      plate: { dark: '#2a2e32', mid: '#4a5258', light: '#7a848c', shine: '#b4bcc2' },
      metal: { dark: '#26282c', mid: '#4e5458', light: '#8a9096', shine: '#c8ccd0' },
      leather: { dark: '#2a1e16', mid: '#4a3428', light: '#6a4c38', shine: '#8a6a50' },
      pad: { dark: '#3a3e40', mid: '#5a6064', light: '#8a9094', shine: '#b8c0c4' },
    };
  }
  return {
    armour: 'plate', cloth, skin: build.skin || '#745844', hair: build.hair || '#161310',
    plate: { dark: '#2c3034', mid: '#4a5158', light: '#7c868e', shine: '#c2c8cc' },
    metal: { dark: '#26282c', mid: '#4c5258', light: '#8a9298', shine: '#d0d4d6' },
    leather: { dark: '#221a14', mid: '#3e2e24', light: '#6a5040', shine: '#8a6e58' },
    pad: { dark: '#32363a', mid: '#4e5458', light: '#7a8084', shine: '#b4bcc0' },
  };
}

export function weaponReach(id) {
  if (id === 'claymore') return 6.15 * H;
  if (id === 'rapier') return 4.15 * H;
  if (id === 'sword') return 3.55 * H;
  if (id === 'axe') return 3.35 * H;
  if (id === 'mace') return 3.05 * H;
  if (id === 'dagger') return 2.15 * H;
  return 3.4 * H;
}

function path(c, pts, fill, stroke = INK, width = 1.5) {
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function disc(c, x, y, r, fill, stroke = INK, w = 1.2) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = w; c.stroke(); }
}
function across(c, a, b, wa, pal) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const g = c.createLinearGradient(a.x - nx * wa, a.y - ny * wa, a.x + nx * wa, a.y + ny * wa);
  g.addColorStop(0, pal.dark);
  g.addColorStop(0.28, pal.mid);
  g.addColorStop(0.55, pal.light);
  g.addColorStop(0.78, pal.shine || pal.light);
  g.addColorStop(1, pal.dark);
  return { g, nx, ny, len };
}
function bone(c, a, b, wa, wb, pal, strokeW = 1.45) {
  const { g, nx, ny } = across(c, a, b, wa, pal);
  path(c, [
    [a.x + nx * wa, a.y + ny * wa], [b.x + nx * wb, b.y + ny * wb],
    [b.x - nx * wb, b.y - ny * wb], [a.x - nx * wa, a.y - ny * wa],
  ], g, INK, strokeW);
}

function rivets(c, pts, r = 1.15) {
  c.fillStyle = '#c4c0b088';
  for (const [x, y] of pts) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a282466';
    c.beginPath(); c.arc(x + 0.4, y + 0.4, r * 0.45, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c4c0b088';
  }
}

export function layout(pose = {}, build = {}) {
  const facing = pose.facing ?? 1;
  const ground = pose.groundY ?? 458;
  const rootX = pose.rootX ?? 200;
  const hop = pose.hop ?? 0;
  const hipDrop = (pose.hipDrop ?? 0.18) * H;
  const lean = (pose.lean ?? 0.06) * facing;
  const width = (pose.stanceWidth ?? 1.12) * H;
  const weight = (pose.weight ?? 0.06) * facing * H * 0.28;
  const G = ground - hop;
  const yaw = (pose.hipYaw ?? 0) * facing;

  const pelvis = {
    x: rootX + Math.sin(lean) * 7 + weight,
    y: G - 3.52 * H + hipDrop + (pose.hipBob || 0),
  };
  const torsoLen = 2.32 * H;
  const shoulderC = {
    x: pelvis.x + Math.sin(lean) * torsoLen,
    y: pelvis.y - Math.cos(lean) * torsoLen + (pose.chestBob || 0),
  };
  const headC = {
    x: shoulderC.x + Math.sin(lean * 0.55) * H * 0.22,
    y: shoulderC.y - H * 0.92,
  };

  const hipR = { x: pelvis.x + facing * H * 0.22 + yaw * 5, y: pelvis.y + 4 };
  const hipL = { x: pelvis.x - facing * H * 0.24 - yaw * 5, y: pelvis.y + 3 };
  const shR = { x: shoulderC.x + facing * H * 0.40 - yaw * 4, y: shoulderC.y + 5 };
  const shL = { x: shoulderC.x - facing * H * 0.42 + yaw * 4, y: shoulderC.y + 4 };

  const footR = pose.footR || { x: rootX + facing * width * 0.42, y: G, angle: 0 };
  const footL = pose.footL || { x: rootX - facing * width * 0.38, y: G, angle: 0 };
  const ankleR = { x: footR.x, y: (footR.y ?? G) - 7 };
  const ankleL = { x: footL.x, y: (footL.y ?? G) - 7 };
  const toeR = {
    x: ankleR.x + facing * 16 * Math.cos(footR.angle || 0),
    y: G - (footR.lift || 0) + facing * 10 * Math.sin(footR.angle || 0),
  };
  const toeL = {
    x: ankleL.x + facing * 14 * Math.cos(footL.angle || 0),
    y: G - (footL.lift || 0) + facing * 8 * Math.sin(footL.angle || 0),
  };

  const thigh = 1.92 * H, shin = 1.50 * H;
  // Knees must point toward facing (forward), never behind the hip-ankle line.
  const preferLeg = { x: facing * 1.35, y: -0.28 };
  const legR = twoBone(hipR, ankleR, thigh, shin, preferLeg);
  const legL = twoBone(hipL, ankleL, thigh, shin, preferLeg);

  let handR, handL;
  if (pose.hands) {
    handR = { x: shoulderC.x + pose.hands.lead.x * facing, y: shoulderC.y + pose.hands.lead.y };
    handL = { x: shoulderC.x + pose.hands.rear.x * facing, y: shoulderC.y + pose.hands.rear.y };
  } else {
    handR = { x: shoulderC.x + facing * H * 0.62, y: shoulderC.y + H * 1.42 };
    handL = { x: shoulderC.x + facing * H * 0.48, y: shoulderC.y + H * 0.72 };
  }

  const upperA = 1.30 * H, lowerA = 1.16 * H;
  // Elbows drop below the shoulder-hand line (natural hinge), not hyperextended.
  const preferArm = { x: -facing * 0.22, y: 1.05 };
  let armR = twoBone(shR, handR, upperA, lowerA, preferArm);
  let armL = twoBone(shL, handL, upperA, lowerA, preferArm);

  const id = build.weapon || 'sword';
  const reach = pose.reach ?? weaponReach(id);
  let weaponA = pose.weaponAngleOverride != null
    ? pose.weaponAngleOverride
    : facing * (pose.weaponAngle ?? 0.72);
  let grip = armR.end;

  if (build.twoHanded) {
    const along = 0.20 * reach;
    handL = {
      x: grip.x + Math.sin(weaponA) * along,
      y: grip.y - Math.cos(weaponA) * along,
    };
    armL = twoBone(shL, handL, upperA, lowerA, preferArm);
  }

  const gripLocal = reach * (id === 'claymore' ? 0.22 : 0.26);
  const weapon = {
    x: grip.x + Math.sin(weaponA) * gripLocal,
    y: grip.y - Math.cos(weaponA) * gripLocal,
    a: weaponA,
    reach,
    id,
  };

  return {
    facing, ground: G, rootX, H, pelvis, shoulderC, headC,
    hipR, hipL, shR, shL,
    kneeR: legR.joint, ankleR: legR.end, toeR, footR, footL,
    kneeL: legL.joint, ankleL: legL.end, toeL,
    elbowR: armR.joint, handR: armR.end,
    elbowL: armL.joint, handL: armL.end,
    weapon, lean, hop, tabard: pose.tabard || 0, shieldRaise: pose.shieldRaise ?? 0.4,
  };
}

export function kneeSign(hip, knee, ankle) {
  const ax = ankle.x - hip.x, ay = ankle.y - hip.y;
  const kx = knee.x - hip.x, ky = knee.y - hip.y;
  return ax * ky - ay * kx;
}

export function kneesForward(L) {
  // Facing right wants cross < 0 (knee to the +x side of a downward hip-ankle).
  const sR = kneeSign(L.hipR, L.kneeR, L.ankleR);
  const sL = kneeSign(L.hipL, L.kneeL, L.ankleL);
  const want = -Math.sign(L.facing || 1);
  const okR = Math.abs(sR) < 80 || Math.sign(sR) === want || Math.sign(sR) === 0;
  const okL = Math.abs(sL) < 80 || Math.sign(sL) === want || Math.sign(sL) === 0;
  return { ok: okR && okL, sR, sL, okR, okL };
}

function drawShadow(c, L) {
  const x = (L.ankleR.x + L.ankleL.x) * 0.5;
  const spread = Math.max(22, Math.abs(L.ankleR.x - L.ankleL.x) * 0.55 + 16);
  c.fillStyle = 'rgba(18,16,12,0.28)';
  c.beginPath();
  c.ellipse(x, L.ground + 3, spread, 6.5, 0, 0, Math.PI * 2);
  c.fill();
}

function drawBoot(c, ankle, toe, facing, pal, plated) {
  const tip = { x: toe.x + facing * 5, y: toe.y };
  const heel = { x: ankle.x - facing * 10, y: ankle.y + 6 };
  const top = { x: ankle.x + facing * 2, y: ankle.y - 5 };
  const g = c.createLinearGradient(heel.x, heel.y - 8, tip.x, tip.y);
  if (plated) {
    g.addColorStop(0, pal.plate.dark); g.addColorStop(0.45, pal.plate.mid); g.addColorStop(1, pal.plate.light);
  } else {
    g.addColorStop(0, pal.leather.dark); g.addColorStop(0.5, pal.leather.mid); g.addColorStop(1, pal.leather.light);
  }
  path(c, [
    [heel.x, heel.y], [top.x - facing * 6, top.y], [top.x + facing * 9, top.y + 1],
    [tip.x, tip.y - 1], [tip.x + facing * 3, tip.y + 5], [heel.x - facing * 2, heel.y + 5],
  ], g);
  if (plated) {
    c.strokeStyle = shade(pal.plate.light, -25); c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const t = 0.28 + i * 0.2;
      const x = top.x + (tip.x - top.x) * t, y = top.y + (tip.y - top.y) * t;
      c.beginPath(); c.moveTo(x - facing * 2, y - 3); c.lineTo(x + facing * 5, y + 3); c.stroke();
    }
  }
}

function drawMailPatch(c, pts, pal) {
  path(c, pts, pal.plate.mid);
  c.save();
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.clip();
  c.strokeStyle = pal.plate.dark; c.lineWidth = 0.9;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  for (let y = minY; y < maxY; y += 4.2) {
    for (let x = minX; x < maxX; x += 5.2) {
      c.beginPath();
      c.arc(x + ((Math.floor(y / 4.2) % 2) ? 2.5 : 0), y, 1.85, 0, Math.PI);
      c.stroke();
    }
  }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.35;
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.stroke();
}

function drawQuilt(c, pts, pal) {
  path(c, pts, pal.pad.mid);
  c.save();
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.clip();
  c.strokeStyle = pal.pad.dark; c.lineWidth = 0.8;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  for (let y = minY; y < maxY; y += 7) {
    c.beginPath(); c.moveTo(minX, y); c.lineTo(maxX, y); c.stroke();
  }
  for (let x = minX; x < maxX; x += 7) {
    c.beginPath(); c.moveTo(x, minY); c.lineTo(x, maxY); c.stroke();
  }
  c.fillStyle = pal.pad.dark;
  for (let y = minY + 3.5; y < maxY; y += 7) {
    for (let x = minX + 3.5; x < maxX; x += 7) {
      c.beginPath(); c.arc(x, y, 0.8, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.35;
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.stroke();
}

function drawJoint(c, p, r, pal) {
  const g = c.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, r);
  g.addColorStop(0, pal.shine); g.addColorStop(0.45, pal.mid); g.addColorStop(1, pal.dark);
  disc(c, p.x, p.y, r, g);
}

function drawTorso(c, L, pal, build) {
  const d = L.facing, s = H;
  c.save();
  c.translate(L.pelvis.x, L.pelvis.y);
  c.rotate(L.lean);
  const outline = [
    [-0.46 * s, 0.20 * s], [-0.50 * s, -0.22 * s], [-0.40 * s, -1.12 * s], [-0.36 * s, -1.92 * s],
    [-0.15 * s, -2.38 * s], [0.16 * s, -2.38 * s], [0.48 * s, -2.02 * s], [0.58 * s, -1.42 * s],
    [0.44 * s, -0.92 * s], [0.34 * s, -0.36 * s], [0.28 * s, 0.04 * s], [0.38 * s, 0.24 * s],
  ];
  if (pal.armour === 'mail') drawMailPatch(c, outline, pal);
  else if (pal.armour === 'leather') drawQuilt(c, outline, pal);
  else {
    const g = c.createLinearGradient(-0.55 * s, 0, 0.55 * s, -s);
    g.addColorStop(0, pal.plate.dark);
    g.addColorStop(0.38, pal.plate.mid);
    g.addColorStop(0.68, pal.plate.light);
    g.addColorStop(1, pal.plate.dark);
    path(c, outline, g, INK, 1.7);
    path(c, [
      [-0.22 * s, -2.15 * s], [0.02 * s, -2.22 * s], [0.08 * s, -0.55 * s],
      [-0.02 * s, -0.15 * s], [-0.28 * s, -0.55 * s],
    ], pal.plate.light, null);
    c.globalAlpha = 0.28; path(c, [
      [-0.22 * s, -2.15 * s], [0.02 * s, -2.22 * s], [0.08 * s, -0.55 * s],
      [-0.02 * s, -0.15 * s], [-0.28 * s, -0.55 * s],
    ], pal.plate.shine, null); c.globalAlpha = 1;
    // faulds
    for (let i = 0; i < 3; i++) {
      const y = 0.02 * s + i * 0.22 * s;
      path(c, [
        [-0.42 * s, y], [0.32 * s, y], [0.40 * s, y + 0.2 * s], [-0.46 * s, y + 0.2 * s],
      ], i % 2 ? pal.plate.mid : pal.plate.light);
    }
    rivets(c, [[-0.28 * s, -2.05 * s], [0.22 * s, -2.05 * s], [-0.30 * s, -0.4 * s], [0.22 * s, -0.35 * s]]);
  }

  if (pal.armour === 'leather') {
    path(c, [
      [-0.38 * s, -1.85 * s], [0.34 * s, -1.85 * s], [0.38 * s, -0.15 * s], [-0.40 * s, -0.12 * s],
    ], pal.leather.mid);
    c.strokeStyle = pal.leather.dark; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-0.22 * s, -1.8 * s); c.lineTo(0.18 * s, -0.2 * s); c.stroke();
    rivets(c, [[-0.30 * s, -1.5 * s], [0.26 * s, -1.5 * s], [-0.30 * s, -0.55 * s], [0.26 * s, -0.5 * s]], 1.3);
  }

  // belt
  path(c, [[-0.42 * s, 0.02 * s], [0.36 * s, 0.02 * s], [0.38 * s, 0.22 * s], [-0.44 * s, 0.22 * s]], pal.leather.mid);
  disc(c, 0.02 * s, 0.12 * s, 3.2, pal.metal.light);

  // tabard / faded cloth hanging, delayed sway
  const sway = L.tabard || 0;
  path(c, [
    [-0.18 * s, -0.85 * s], [0.16 * s, -0.85 * s],
    [0.28 * s + sway, 1.15 * s], [0.04 * s + sway * 0.6, 1.35 * s],
    [-0.22 * s + sway, 1.18 * s],
  ], build.cloth || pal.cloth, INK, 1.3);
  c.globalAlpha = 0.18;
  path(c, [
    [-0.08 * s, -0.8 * s], [0.06 * s, -0.8 * s], [0.12 * s + sway * 0.5, 1.1 * s], [-0.04 * s + sway * 0.5, 1.1 * s],
  ], '#d8d0c0', null);
  c.globalAlpha = 1;

  // straps
  c.strokeStyle = pal.leather.dark; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-0.32 * s, -1.9 * s); c.lineTo(-0.18 * s, 0.08 * s);
  c.moveTo(0.28 * s, -1.85 * s); c.lineTo(0.16 * s, 0.08 * s);
  c.stroke();
  c.restore();
}

function drawHead(c, L, pal, build) {
  c.save();
  c.translate(L.headC.x, L.headC.y);
  c.rotate(L.lean * 0.45);
  const d = L.facing;
  disc(c, 0, 2, 12.4, pal.skin);
  c.fillStyle = '#2a201888';
  c.beginPath(); c.ellipse(d * 3.5, 1, 7.5, 10, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  c.fillStyle = pal.hair;
  path(c, [[-11, 0], [-12, -10], [-6, -16], [5, -16], [12, -8], [11, 0], [6, -8], [-4, -7]], pal.hair);
  c.fillStyle = INK;
  c.fillRect(d * 3.2, -1.2, 3.1, 1.7);
  c.strokeStyle = '#5a4030'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(d * 2.2, 4.5); c.lineTo(d * 7.5, 3.6); c.stroke();
  c.beginPath(); c.moveTo(d * 2, 8.2); c.quadraticCurveTo(d * 5, 10, d * 8, 7.8); c.stroke();

  if (build.armour === 'plate') {
    const g = c.createLinearGradient(-12, -14, 12, 10);
    g.addColorStop(0, pal.plate.dark); g.addColorStop(0.45, pal.plate.mid);
    g.addColorStop(0.75, pal.plate.light); g.addColorStop(1, pal.plate.dark);
    path(c, [
      [-13, 2], [-12, -10], [-6, -17], [6, -16], [13, -8], [14, 4],
      [8, 8], [6, -2], [-6, -2], [-9, 8],
    ], g);
    path(c, [[-7, -1], [7, -1], [6, 10], [2, 14], [-3, 14], [-7, 9]], pal.plate.mid);
    c.fillStyle = '#141416';
    c.fillRect(-6.5, 1.2, 13, 3.2);
    for (let x = -5; x <= 4; x += 3.2) c.fillRect(x, 6.5, 1.5, 4);
    rivets(c, [[-8, -8], [8, -7], [-9, 4], [9, 4]]);
  } else if (build.armour === 'mail') {
    drawMailPatch(c, [[-12, 4], [-11, -6], [-5, -12], [6, -11], [12, -3], [11, 6], [4, 2], [-5, 2]], pal);
    path(c, [[-10, -6], [-6, -14], [6, -13], [11, -4], [10, 2], [-9, 1]], pal.plate.mid);
    path(c, [[d * 2, -2], [d * 5, -8], [d * 6, 8], [d * 2, 9]], pal.plate.light);
  } else {
    path(c, [[-11, -2], [-10, -12], [-3, -16], [7, -14], [12, -6], [10, 2]], pal.leather.mid);
    c.strokeStyle = pal.leather.dark; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-8, -2); c.lineTo(8, -2); c.stroke();
  }
  c.restore();
}

function drawShield(c, L, pal, build) {
  if (!build.shield || build.shield === 'none') return;
  const h = L.handL;
  c.save();
  c.translate(h.x, h.y);
  c.rotate(L.lean * 0.3 + L.facing * (0.15 - L.shieldRaise * 0.2));
  const g = c.createLinearGradient(-20, -24, 16, 28);
  g.addColorStop(0, pal.leather.dark);
  g.addColorStop(0.45, shade(build.cloth || pal.cloth, -20));
  g.addColorStop(1, pal.leather.mid);
  path(c, [[-20, -26], [18, -24], [16, 10], [0, 32], [-18, 12]], g, INK, 1.8);
  path(c, [[-14, -18], [0, -18], [0, 22], [-12, 8]], pal.metal.mid, null);
  c.globalAlpha = 0.25;
  path(c, [[-14, -18], [0, -18], [0, 22], [-12, 8]], pal.metal.shine, null);
  c.globalAlpha = 1;
  disc(c, -2, -2, 5, pal.metal.light);
  rivets(c, [[-16, -20], [12, -18], [-14, 8], [10, 6], [0, 24]]);
  c.restore();
}

export function drawWeapon(c, w) {
  if (!w || !w.id) return;
  const r = w.reach, id = w.id;
  c.save();
  c.translate(w.x, w.y);
  c.rotate(w.a || 0);
  const wood = '#4a3424', wrap = '#5a4030';
  const bladeG = c.createLinearGradient(-8, 0, 8, 0);
  bladeG.addColorStop(0, '#4a5054');
  bladeG.addColorStop(0.45, '#c8ccc8');
  bladeG.addColorStop(0.7, '#8a9094');
  bladeG.addColorStop(1, '#3a4044');
  const shaft = (y1, y2, width = 5.5, col = wood) => {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.3;
    c.fillRect(-width / 2, y1, width, y2 - y1); c.strokeRect(-width / 2, y1, width, y2 - y1);
  };
  const grip = (y1, y2, width = 6.5) => {
    shaft(y1, y2, width, wrap);
    c.strokeStyle = '#7a5a40'; c.lineWidth = 1;
    for (let y = y1 + 2; y < y2; y += 4) {
      c.beginPath(); c.moveTo(-width / 2, y); c.lineTo(width / 2, y + 1.6); c.stroke();
    }
  };

  if (id === 'claymore') {
    const tip = -r * 0.52, ric = -r * 0.06, grd = r * 0.10, end = r * 0.42, pom = r * 0.48;
    path(c, [[-9, grd], [-8.2, ric], [-6, tip + r * 0.14], [0, tip], [6, tip + r * 0.14], [8.2, ric], [9, grd]], bladeG);
    c.strokeStyle = '#e8ece8'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, ric + 2); c.lineTo(0, tip + r * 0.16); c.stroke();
    path(c, [[-7.5, grd], [-7.5, ric], [7.5, ric], [7.5, grd]], '#8a9094');
    path(c, [[-8, ric + 2], [-26, ric - 10], [-28, ric - 2], [-8, ric + 10]], '#6a7278');
    path(c, [[8, ric + 2], [26, ric - 10], [28, ric - 2], [8, ric + 10]], '#6a7278');
    c.fillStyle = '#5a6066'; c.fillRect(-30, grd - 4, 60, 8); c.strokeStyle = INK; c.strokeRect(-30, grd - 4, 60, 8);
    grip(grd + 5, end, 7.4);
    disc(c, 0, pom, 7.2, '#6a6460'); disc(c, 0, pom, 3.2, '#8a8078');
  } else if (id === 'rapier') {
    path(c, [[-2.1, r * 0.07], [-1.8, -r * 0.38], [0, -r * 0.52], [1.8, -r * 0.38], [2.1, r * 0.07]], bladeG);
    c.strokeStyle = '#dde2dc'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, r * 0.02); c.lineTo(0, -r * 0.42); c.stroke();
    c.beginPath(); c.ellipse(0, r * 0.15, 11, 8, -0.12, 0, Math.PI * 2);
    c.strokeStyle = '#6a6458'; c.lineWidth = 2.4; c.stroke();
    grip(r * 0.20, r * 0.38, 4.8); disc(c, 0, r * 0.43, 3.3, '#6a6458');
  } else if (id === 'sword') {
    path(c, [[-5, r * 0.08], [-4.6, -r * 0.34], [0, -r * 0.50], [4.6, -r * 0.34], [5, r * 0.08]], bladeG);
    c.strokeStyle = '#e4e8e2'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, r * 0.04); c.lineTo(0, -r * 0.38); c.stroke();
    c.fillStyle = '#5a6066'; c.fillRect(-15, r * 0.06, 30, 5); c.strokeRect(-15, r * 0.06, 30, 5);
    grip(r * 0.13, r * 0.35, 6); disc(c, 0, r * 0.41, 4.2, '#6a6460');
  } else if (id === 'axe') {
    shaft(-r * 0.28, r * 0.40, 5.6); grip(r * 0.16, r * 0.36, 6.4);
    path(c, [[3, -r * 0.34], [28, -r * 0.40], [30, -r * 0.16], [12, -r * 0.02], [3, -r * 0.14]], bladeG);
    c.strokeStyle = '#dfe4dc'; c.beginPath(); c.moveTo(27, -r * 0.36); c.lineTo(28, -r * 0.18); c.stroke();
    disc(c, 0, r * 0.43, 3.6, '#4a3424');
  } else if (id === 'mace') {
    shaft(-r * 0.22, r * 0.38, 5.8); grip(r * 0.14, r * 0.34, 6.6);
    disc(c, 0, -r * 0.32, 11.5, '#6a7278');
    for (let i = 0; i < 6; i++) {
      c.save(); c.translate(0, -r * 0.32); c.rotate(i * Math.PI / 3);
      path(c, [[8, -3.4], [16.5, 0], [8, 3.4]], '#7a8288');
      c.restore();
    }
    disc(c, 0, r * 0.42, 3.6, '#4a3424');
  } else {
    path(c, [[-3.2, r * 0.1], [-2.8, -r * 0.26], [0, -r * 0.46], [2.8, -r * 0.26], [3.2, r * 0.1]], bladeG);
    c.fillStyle = '#5a6066'; c.fillRect(-9, r * 0.08, 18, 4);
    grip(r * 0.14, r * 0.32, 5.4); disc(c, 0, r * 0.38, 3.2, '#6a6460');
  }
  c.restore();
}

function drawArm(c, sh, elbow, hand, pal, build, facing) {
  const skin = { dark: shade(pal.skin, -30), mid: pal.skin, light: shade(pal.skin, 24), shine: shade(pal.skin, 40) };
  if (build.armour === 'plate') {
    bone(c, sh, elbow, 9.5, 7.6, pal.plate);
    bone(c, elbow, hand, 7.2, 5.6, pal.plate);
    drawJoint(c, elbow, 6.2, pal.plate);
    drawJoint(c, hand, 6.6, pal.plate);
    for (let i = -1; i <= 1; i++) disc(c, hand.x + facing * 5.5, hand.y + i * 3.1, 2.1, pal.plate.light, INK, 1);
  } else if (build.armour === 'mail') {
    bone(c, sh, elbow, 8.6, 7.0, pal.plate);
    bone(c, elbow, hand, 6.6, 5.2, pal.leather);
    drawJoint(c, elbow, 5.4, pal.plate);
    drawJoint(c, hand, 5.8, pal.leather);
  } else {
    bone(c, sh, elbow, 8.2, 6.8, pal.pad);
    bone(c, elbow, hand, 6.2, 5.0, pal.leather);
    drawJoint(c, elbow, 5.0, pal.leather);
    drawJoint(c, hand, 5.6, skin);
  }
}

function drawLeg(c, hip, knee, ankle, toe, pal, build, facing) {
  if (build.armour === 'plate') {
    bone(c, hip, knee, 11.2, 9.0, pal.plate);
    bone(c, knee, ankle, 8.4, 6.4, pal.plate);
    drawJoint(c, knee, 7.6, pal.plate);
    path(c, [
      [knee.x - facing * 2, knee.y - 3],
      [knee.x - facing * 14, knee.y - 1],
      [knee.x - facing * 13, knee.y + 6],
      [knee.x - facing * 1, knee.y + 5],
    ], pal.plate.mid);
    drawBoot(c, ankle, toe, facing, pal, true);
  } else if (build.armour === 'mail') {
    bone(c, hip, knee, 10.4, 8.4, pal.plate);
    bone(c, knee, ankle, 7.6, 6.0, pal.leather);
    drawJoint(c, knee, 6.6, pal.plate);
    drawBoot(c, ankle, toe, facing, pal, false);
  } else {
    bone(c, hip, knee, 10.0, 8.2, pal.pad);
    bone(c, knee, ankle, 7.2, 5.8, pal.leather);
    drawJoint(c, knee, 6.0, pal.leather);
    drawBoot(c, ankle, toe, facing, pal, false);
  }
}

function drawPauldron(c, sh, facing, pal) {
  if (pal.armour === 'leather') return;
  c.save(); c.translate(sh.x, sh.y);
  const s = pal.armour === 'plate' ? 11.5 : 9.2;
  const g = c.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, pal.plate.dark); g.addColorStop(0.4, pal.plate.mid);
  g.addColorStop(0.72, pal.plate.shine); g.addColorStop(1, pal.plate.dark);
  path(c, [
    [-s * 1.1, -s * 0.1], [-s * 0.85, -s * 1.0], [s * 0.2, -s * 1.15],
    [s * 1.15, -s * 0.45], [s * 1.2, s * 0.4], [s * 0.3, s * 0.8], [-s * 0.5, s * 0.5],
  ], g);
  c.restore();
}

export function drawFighter(c, pose, build) {
  const pal = palette(build);
  const L = layout(pose, build);
  drawShadow(c, L);
  // far side first
  drawLeg(c, L.hipL, L.kneeL, L.ankleL, L.toeL, pal, build, L.facing);
  drawArm(c, L.shL, L.elbowL, L.handL, pal, build, L.facing);
  if (build.shield && build.shield !== 'none') drawShield(c, L, pal, build);
  drawTorso(c, L, pal, build);
  drawPauldron(c, L.shL, -L.facing, pal);
  drawLeg(c, L.hipR, L.kneeR, L.ankleR, L.toeR, pal, build, L.facing);
  drawHead(c, L, pal, build);
  drawPauldron(c, L.shR, L.facing, pal);
  drawArm(c, L.shR, L.elbowR, L.handR, pal, build, L.facing);
  drawWeapon(c, L.weapon);
  return L;
}

export function drawLineupBackdrop(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a2c2e');
  g.addColorStop(0.55, '#3c3a36');
  g.addColorStop(1, '#2a2622');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const vg = c.createRadialGradient(w * 0.5, h * 0.42, 80, w * 0.5, h * 0.5, w * 0.72);
  vg.addColorStop(0, 'rgba(255,220,170,0.05)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
  c.fillStyle = '#3a3530'; c.fillRect(0, h * 0.78, w, h);
  c.fillStyle = '#2a2622'; c.fillRect(0, h * 0.78, w, 3);
}
