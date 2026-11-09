// Prototype 2.2b renderer — approval sheets only.
// Original Ragdoll Rivals rig in Bradley's painted-knight art language:
// blackened plate, gold trim, great-helm, chunky side-on silhouette.
// Not shipping code and not copied from any other game.

export const HEAD = 32;
const H = HEAD;
const ink = '#12100e';

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
  const maxd = upper + lower - 1.6, mind = Math.abs(upper - lower) + 2;
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

export function palette(build = {}) {
  const armour = build.armour || 'plate';
  const cloth = build.cloth || '#6b2a2a';
  const trim = build.trim || '#c9a24a';
  if (armour === 'leather') {
    return {
      armour, cloth, trim,
      plate: { dark: '#1a120c', mid: '#3a2418', light: '#6e4a30', shine: '#a07850' },
      metal: { dark: '#2a2218', mid: '#5a4630', light: '#b08950', shine: '#e2c080' },
      trimDark: shade(trim, -50), trimLight: shade(trim, 40)
    };
  }
  if (armour === 'mail') {
    return {
      armour, cloth, trim,
      plate: { dark: '#17191c', mid: '#3a4146', light: '#7a848c', shine: '#c0c6cc' },
      metal: { dark: '#1c1e20', mid: '#4a5054', light: '#8a9298', shine: '#d0d4d6' },
      trimDark: shade(trim, -50), trimLight: shade(trim, 40)
    };
  }
  return {
    armour, cloth, trim,
    plate: { dark: '#0d0e10', mid: '#23262b', light: '#6a717a', shine: '#c5ccd4' },
    metal: { dark: '#101114', mid: '#2a2e34', light: '#7c848c', shine: '#d5dbe0' },
    trimDark: shade(trim, -55), trimLight: shade(trim, 45)
  };
}

function path(c, pts, fill, stroke = ink, width = 1.7) {
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function disc(c, x, y, r, fill, stroke = ink, w = 1.5) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = w; c.stroke(); }
}
function gradAcross(c, a, b, wa, pal) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const g = c.createLinearGradient(a.x - nx * wa, a.y - ny * wa, a.x + nx * wa, a.y + ny * wa);
  g.addColorStop(0, pal.dark);
  g.addColorStop(0.32, pal.mid);
  g.addColorStop(0.62, pal.light);
  g.addColorStop(0.82, pal.shine);
  g.addColorStop(1, pal.dark);
  return { g, nx, ny, len };
}
function plateBone(c, a, b, wa, wb, pal, goldHex) {
  const { g, nx, ny } = gradAcross(c, a, b, wa, pal);
  path(c, [
    [a.x + nx * wa, a.y + ny * wa], [b.x + nx * wb, b.y + ny * wb],
    [b.x - nx * wb, b.y - ny * wb], [a.x - nx * wa, a.y - ny * wa]
  ], g, ink, 1.6);
  if (goldHex) {
    c.strokeStyle = goldHex; c.lineWidth = 1.5; c.globalAlpha = 0.85;
    c.beginPath();
    c.moveTo(a.x + nx * (wa - 1.4), a.y + ny * (wa - 1.4));
    c.lineTo(b.x + nx * (wb - 1.2), b.y + ny * (wb - 1.2));
    c.stroke();
    c.globalAlpha = 1;
  }
}

export function layout(pose = {}) {
  const facing = pose.facing ?? 1;
  const ground = pose.groundY ?? 420;
  const rootX = pose.rootX ?? 200;
  const hop = pose.hop ?? 0;
  const hipDrop = (pose.hipDrop ?? 0.16) * H;
  const lean = (pose.lean ?? 0.04) * facing;
  const width = (pose.stanceWidth ?? 1.15) * H;
  const weight = (pose.weight ?? 0.08) * facing * 8;
  const G = ground - hop;

  const pelvis = { x: rootX + Math.sin(lean) * 8 + weight, y: G - 3.45 * H + hipDrop + (pose.hipBob || 0) };
  const torsoLen = 2.35 * H;
  const shoulderC = { x: pelvis.x + Math.sin(lean) * torsoLen, y: pelvis.y - Math.cos(lean) * torsoLen + (pose.chestBob || 0) };
  const headC = { x: shoulderC.x + Math.sin(lean * 0.6) * H * 0.25, y: shoulderC.y - H * 0.95 };
  const hipLead = { x: pelvis.x + facing * H * 0.22, y: pelvis.y + 5 };
  const hipRear = { x: pelvis.x - facing * H * 0.24, y: pelvis.y + 3 };
  const shLead = { x: shoulderC.x + facing * H * 0.38, y: shoulderC.y + 6 };
  const shRear = { x: shoulderC.x - facing * H * 0.4, y: shoulderC.y + 4 };

  const leadOff = pose.footLead?.offset ?? 0.38;
  const rearOff = pose.footRear?.offset ?? -0.48;
  const leadLift = pose.footLead?.lift ?? 0;
  const rearLift = pose.footRear?.lift ?? 0;
  const heel = pose.heelLift ?? 1;
  const ankleLead = { x: rootX + facing * width * leadOff, y: G - 8 - leadLift };
  const ankleRear = { x: rootX + facing * width * rearOff, y: G - 8 - rearLift - (rearLift > 1 ? 0 : heel) };
  const toeLead = { x: ankleLead.x + facing * 18, y: G - leadLift };
  const toeRear = { x: ankleRear.x + facing * 15, y: G - rearLift };

  const thigh = 1.95 * H, shin = 1.52 * H;
  const preferLeg = { x: facing * 1.2, y: -0.32 };
  const leadLeg = twoBone(hipLead, ankleLead, thigh, shin, preferLeg);
  const rearLeg = twoBone(hipRear, ankleRear, thigh, shin, preferLeg);

  let handLead, handRear;
  if (pose.hands) {
    handLead = { x: shoulderC.x + pose.hands.lead.x * facing, y: shoulderC.y + pose.hands.lead.y };
    handRear = { x: shoulderC.x + pose.hands.rear.x * facing, y: shoulderC.y + pose.hands.rear.y };
  } else {
    handLead = { x: shoulderC.x + facing * H * 0.55, y: shoulderC.y + H * 1.55 };
    handRear = { x: shoulderC.x + facing * H * 0.7, y: shoulderC.y + H * 0.55 };
  }

  const upperA = 1.32 * H, lowerA = 1.18 * H;
  const preferArm = { x: -facing * 0.35, y: 1 };
  const leadArm = twoBone(shLead, handLead, upperA, lowerA, preferArm);
  const rearArm = twoBone(shRear, handRear, upperA, lowerA, preferArm);

  const wAngle = pose.weaponAngle ?? 2.35;
  let weaponA = pose.weaponAngleOverride != null ? pose.weaponAngleOverride : facing * wAngle;
  const reach = pose.reach ?? 100;
  const grip = leadArm.end;
  const gripLocal = reach * 0.26;
  const weapon = {
    x: grip.x + Math.sin(weaponA) * gripLocal,
    y: grip.y - Math.cos(weaponA) * gripLocal,
    a: weaponA, reach
  };

  return {
    facing, ground: G, rootX, H, pelvis, shoulderC, headC, hipLead, hipRear, shLead, shRear,
    kneeLead: leadLeg.joint, ankleLead: leadLeg.end, toeLead,
    kneeRear: rearLeg.joint, ankleRear: rearLeg.end, toeRear,
    elbowLead: leadArm.joint, handLead: leadArm.end,
    elbowRear: rearArm.joint, handRear: rearArm.end,
    weapon, lean, hop
  };
}

function drawSabaton(c, ankle, toe, facing, pal, trim) {
  const tip = { x: toe.x + facing * 6, y: toe.y };
  const heel = { x: ankle.x - facing * 11, y: ankle.y + 6 };
  const top = { x: ankle.x + facing * 2, y: ankle.y - 6 };
  const g = c.createLinearGradient(heel.x, heel.y - 10, tip.x, tip.y);
  g.addColorStop(0, pal.dark); g.addColorStop(0.45, pal.mid); g.addColorStop(1, pal.light);
  path(c, [
    [heel.x, heel.y], [top.x - facing * 7, top.y], [top.x + facing * 10, top.y + 1],
    [tip.x, tip.y - 2], [tip.x + facing * 3, tip.y + 5], [heel.x - facing * 2, heel.y + 5]
  ], g);
  c.strokeStyle = trim; c.lineWidth = 1.2; c.globalAlpha = 0.8;
  c.beginPath(); c.moveTo(top.x - facing * 2, top.y + 2); c.lineTo(tip.x - facing * 2, tip.y); c.stroke();
  c.globalAlpha = 1;
  // lames
  c.strokeStyle = shade(pal.light, -20); c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const t = 0.25 + i * 0.22;
    const x = top.x + (tip.x - top.x) * t, y = top.y + (tip.y - top.y) * t;
    c.beginPath(); c.moveTo(x - facing * 2, y - 3); c.lineTo(x + facing * 6, y + 4); c.stroke();
  }
}

function drawPoleyn(c, knee, facing, pal, trim) {
  const g = c.createRadialGradient(knee.x - facing * 2, knee.y - 3, 2, knee.x, knee.y, 11);
  g.addColorStop(0, pal.shine); g.addColorStop(0.45, pal.mid); g.addColorStop(1, pal.dark);
  disc(c, knee.x, knee.y, 8.5, g);
  path(c, [
    [knee.x - facing * 2, knee.y - 4],
    [knee.x - facing * 16, knee.y - 2],
    [knee.x - facing * 15, knee.y + 6],
    [knee.x - facing * 1, knee.y + 5]
  ], pal.mid);
  c.strokeStyle = trim; c.lineWidth = 1.3;
  c.beginPath(); c.arc(knee.x, knee.y, 6.2, -0.6, 2.2); c.stroke();
}

function drawGauntlet(c, hand, facing, pal, trim) {
  const g = c.createRadialGradient(hand.x - 2, hand.y - 2, 1, hand.x, hand.y, 10);
  g.addColorStop(0, pal.shine); g.addColorStop(0.5, pal.mid); g.addColorStop(1, pal.dark);
  disc(c, hand.x, hand.y, 7.4, g);
  for (let i = -1; i <= 1; i++) {
    disc(c, hand.x + facing * 6, hand.y + i * 3.4, 2.3, pal.light, ink, 1);
  }
  c.strokeStyle = trim; c.lineWidth = 1.2;
  c.beginPath(); c.arc(hand.x, hand.y, 5.5, -1, 2); c.stroke();
}

function drawCouter(c, elbow, pal, trim) {
  const g = c.createRadialGradient(elbow.x - 2, elbow.y - 2, 1, elbow.x, elbow.y, 8);
  g.addColorStop(0, pal.shine); g.addColorStop(0.5, pal.mid); g.addColorStop(1, pal.dark);
  disc(c, elbow.x, elbow.y, 6.4, g);
  c.strokeStyle = trim; c.lineWidth = 1.2;
  c.beginPath(); c.arc(elbow.x, elbow.y, 4.6, 0.2, 2.6); c.stroke();
}

function drawPauldron(c, sh, facing, pal, trim, scale = 1) {
  c.save(); c.translate(sh.x, sh.y);
  const s = 11 * scale;
  const g = c.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, pal.dark); g.addColorStop(0.4, pal.mid); g.addColorStop(0.7, pal.shine); g.addColorStop(1, pal.dark);
  path(c, [
    [-s * 1.15, -s * 0.15], [-s * 0.9, -s * 1.05], [s * 0.15, -s * 1.2],
    [s * 1.15, -s * 0.55], [s * 1.25, s * 0.45], [s * 0.35, s * 0.85],
    [-s * 0.55, s * 0.55]
  ], g);
  path(c, [
    [-s * 0.7, -s * 0.05], [-s * 0.45, -s * 0.75], [s * 0.35, -s * 0.7], [s * 0.55, s * 0.15]
  ], pal.light, null);
  c.globalAlpha = 0.35; path(c, [[-s * 0.7, -s * 0.05], [-s * 0.45, -s * 0.75], [s * 0.35, -s * 0.7], [s * 0.55, s * 0.15]], pal.shine, null); c.globalAlpha = 1;
  c.strokeStyle = trim; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-s * 0.85, -s * 0.85); c.quadraticCurveTo(s * 0.1, -s * 1.25, s * 1.05, -s * 0.4); c.stroke();
  c.restore();
}

function drawMailFill(c, pts, pal) {
  path(c, pts, pal.mid);
  c.save();
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.clip();
  c.strokeStyle = pal.dark; c.lineWidth = 1;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  for (let y = minY; y < maxY; y += 5) {
    for (let x = minX; x < maxX; x += 6) {
      c.beginPath(); c.arc(x + ((y / 5) % 2 ? 3 : 0), y, 2.1, 0, Math.PI); c.stroke();
    }
  }
  c.restore();
  c.strokeStyle = ink; c.lineWidth = 1.6;
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke();
}

function drawTorso(c, L, pal, build) {
  const d = L.facing, s = H;
  c.save(); c.translate(L.pelvis.x, L.pelvis.y); c.rotate(L.lean);
  const outline = [
    [-0.48 * s, 0.18 * s], [-0.52 * s, -0.25 * s], [-0.42 * s, -1.15 * s], [-0.38 * s, -1.95 * s],
    [-0.16 * s, -2.42 * s], [0.14 * s, -2.42 * s], [0.50 * s, -2.05 * s], [0.62 * s, -1.45 * s],
    [0.46 * s, -0.95 * s], [0.36 * s, -0.38 * s], [0.30 * s, 0.02 * s], [0.40 * s, 0.22 * s]
  ];
  if (pal.armour === 'mail') {
    drawMailFill(c, outline, pal.plate);
  } else {
    const g = c.createLinearGradient(-0.55 * s, 0, 0.6 * s, -s);
    g.addColorStop(0, pal.plate.dark); g.addColorStop(0.4, pal.plate.mid);
    g.addColorStop(0.72, pal.plate.light); g.addColorStop(1, pal.plate.dark);
    path(c, outline, g, ink, 1.8);
  }
  // breast highlight
  path(c, [[-0.18 * s, -2.25 * s], [0.08 * s, -2.15 * s], [0.12 * s, -0.85 * s], [-0.16 * s, -0.9 * s]], 'rgba(255,255,255,0.10)', null);
  // gold filigree on chest
  c.strokeStyle = pal.trim; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-0.08 * s, -2.18 * s); c.quadraticCurveTo(0.22 * s, -1.7 * s, 0.08 * s, -0.95 * s);
  c.stroke();
  c.beginPath(); c.moveTo(-0.22 * s, -1.85 * s); c.lineTo(0.28 * s, -1.75 * s); c.stroke();
  // faulds
  for (let i = 0; i < 3; i++) {
    const y = -0.15 * s + i * 0.16 * s;
    const g = c.createLinearGradient(-0.4 * s, y, 0.4 * s, y);
    g.addColorStop(0, pal.plate.dark); g.addColorStop(0.5, pal.plate.light); g.addColorStop(1, pal.plate.dark);
    path(c, [[-0.40 * s, y], [0.34 * s, y], [0.38 * s, y + 0.15 * s], [-0.44 * s, y + 0.14 * s]], g);
  }
  // tassets
  path(c, [[-0.38 * s, 0.28 * s], [-0.08 * s, 0.30 * s], [-0.12 * s, 0.72 * s], [-0.42 * s, 0.62 * s]], pal.plate.mid);
  path(c, [[0.04 * s, 0.28 * s], [0.34 * s, 0.30 * s], [0.38 * s, 0.68 * s], [0.06 * s, 0.62 * s]], pal.plate.mid);
  c.strokeStyle = pal.trim; c.lineWidth = 1.3;
  c.strokeRect(-0.36 * s, 0.32 * s, 0.24 * s, 0.24 * s);
  c.strokeRect(0.08 * s, 0.32 * s, 0.22 * s, 0.22 * s);
  // tabard / surcoat flap in fighter colour
  path(c, [
    [-0.16 * s, 0.22 * s], [0.16 * s, 0.22 * s], [0.20 * s, 0.95 * s],
    [0, 1.12 * s], [-0.20 * s, 0.92 * s]
  ], pal.cloth, ink, 1.4);
  c.strokeStyle = pal.trim; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, 0.28 * s); c.lineTo(0, 1.02 * s); c.stroke();
  // belt
  c.fillStyle = '#2a2016'; c.fillRect(-0.36 * s, 0.16 * s, 0.74 * s, 8);
  const buckle = c.createLinearGradient(-6, 0, 6, 0);
  buckle.addColorStop(0, pal.trimDark); buckle.addColorStop(0.5, pal.trimLight); buckle.addColorStop(1, pal.trimDark);
  c.fillStyle = buckle; c.fillRect(-6, 0.17 * s, 12, 10); c.strokeStyle = ink; c.strokeRect(-6, 0.17 * s, 12, 10);
  c.restore();
}

function drawGreatHelm(c, L, pal, build) {
  const d = L.facing, h = L.headC, r = H * 0.58;
  c.save(); c.translate(h.x, h.y); c.rotate(L.lean * 0.4);
  const g = c.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, pal.plate.dark); g.addColorStop(0.4, pal.plate.mid);
  g.addColorStop(0.68, pal.plate.light); g.addColorStop(1, pal.plate.dark);
  path(c, [
    [-r * 1.05, r * 0.05], [-r * 0.95, -r * 0.55], [-r * 0.35, -r * 1.18],
    [r * 0.45, -r * 1.22], [r * 1.08, -r * 0.55], [r * 1.18, r * 0.15],
    [r * 1.05, r * 0.95], [r * 0.35, r * 1.28], [-r * 0.45, r * 1.18], [-r * 1.02, r * 0.55]
  ], g, ink, 1.8);
  // visor face
  path(c, [
    [d * r * 0.15, -r * 0.55], [d * r * 1.05, -r * 0.4], [d * r * 1.1, r * 0.55],
    [d * r * 0.25, r * 0.85], [d * r * 0.05, r * 0.15]
  ], pal.plate.mid);
  // eye slit
  const slitX = d > 0 ? d * r * 0.18 : -r * 0.92;
  c.fillStyle = '#050607';
  c.fillRect(slitX, -r * 0.14, r * 0.78, 7);
  c.strokeStyle = pal.trim; c.lineWidth = 2;
  c.strokeRect(slitX, -r * 0.14, r * 0.78, 7);
  // brow filigree
  c.beginPath(); c.moveTo(-r * 0.2, -r * 0.7); c.quadraticCurveTo(d * r * 0.4, -r * 0.95, d * r * 0.95, -r * 0.45); c.stroke();
  // crown ridge
  path(c, [[-r * 0.15, -r * 1.12], [r * 0.12, -r * 1.38], [r * 0.35, -r * 1.12]], pal.trim, ink, 1.2);
  if (build.crest !== false) {
    path(c, [[4, -r * 1.2], [18, -r * 2.15], [8, -r * 1.22]], pal.cloth, ink, 1.3);
    c.strokeStyle = pal.trim; c.beginPath(); c.moveTo(6, -r * 1.25); c.lineTo(16, -r * 2.0); c.stroke();
  }
  // neck bevor
  path(c, [[-r * 0.7, r * 0.85], [r * 0.55, r * 0.95], [r * 0.4, r * 1.45], [-r * 0.5, r * 1.38]], pal.plate.mid);
  c.restore();
}

function drawCapHelm(c, L, pal, build) {
  const d = L.facing, h = L.headC, r = H * 0.52;
  c.save(); c.translate(h.x, h.y); c.rotate(L.lean * 0.4);
  const g = c.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, pal.plate.dark); g.addColorStop(0.5, pal.plate.mid); g.addColorStop(1, pal.plate.light);
  path(c, [
    [-r * 1.05, r * 0.1], [-r * 0.9, -r * 0.55], [-r * 0.2, -r * 1.05],
    [r * 0.55, -r * 0.9], [r * 0.95, -r * 0.2], [r * 0.85, r * 0.15]
  ], g);
  c.fillStyle = '#07080a'; c.fillRect(d * r * 0.2 - (d < 0 ? r * 0.5 : 0), -r * 0.05, r * 0.5, 4);
  c.strokeStyle = pal.trim; c.strokeRect(d * r * 0.2 - (d < 0 ? r * 0.5 : 0), -r * 0.05, r * 0.5, 4);
  if (build.crest !== false) path(c, [[2, -r * 0.95], [14, -r * 1.7], [5, -r * 0.95]], pal.cloth, ink, 1.2);
  c.restore();
}

function drawHeater(c, L, pal) {
  const p = L.handRear;
  c.save(); c.translate(p.x, p.y); c.rotate(L.lean * 0.15);
  const g = c.createLinearGradient(-20, -28, 16, 28);
  g.addColorStop(0, shade(pal.cloth, 18)); g.addColorStop(1, shade(pal.cloth, -35));
  path(c, [[-18, -26], [20, -24], [18, 10], [2, 32], [-16, 10]], g, ink, 2);
  path(c, [[-14, -22], [2, -21], [2, 26], [-12, 8]], shade(pal.cloth, 8), null);
  c.fillStyle = pal.trim; c.fillRect(-2.5, -22, 5.2, 46); c.fillRect(-14, -6, 30, 5);
  disc(c, 2, -4, 5, pal.metal.light);
  c.restore();
}

function drawBuckler(c, L, pal) {
  const p = L.handRear;
  c.save(); c.translate(p.x, p.y);
  const g = c.createRadialGradient(-4, -4, 2, 0, 0, 20);
  g.addColorStop(0, pal.trimLight); g.addColorStop(0.45, pal.plate.mid); g.addColorStop(1, pal.plate.dark);
  disc(c, 0, 0, 19, g); disc(c, 0, 0, 7, pal.metal.light);
  c.restore();
}

function drawWeaponLocal(c, w, id, pal) {
  if (!w || !id) return;
  const r = w.reach || 100;
  c.save(); c.translate(w.x, w.y); c.rotate(w.a || 0);
  const wood = '#4a2e18', bladeDark = '#8a9694', bladeLite = '#e8eeea';
  const shaft = (y1, y2, width = 6, colour = wood) => {
    c.fillStyle = colour; c.strokeStyle = ink; c.lineWidth = 1.6;
    c.fillRect(-width / 2, y1, width, y2 - y1); c.strokeRect(-width / 2, y1, width, y2 - y1);
  };
  const grip = (y1, y2, width = 7) => {
    shaft(y1, y2, width, '#6b3e22');
    c.strokeStyle = pal.trim;
    for (let y = y1 + 3; y < y2; y += 5) { c.beginPath(); c.moveTo(-width / 2, y); c.lineTo(width / 2, y + 2); c.stroke(); }
  };
  const metalBar = (x, y, ww, hh) => {
    const g = c.createLinearGradient(x, y, x + ww, y);
    g.addColorStop(0, pal.trimDark); g.addColorStop(0.45, pal.trimLight); g.addColorStop(1, pal.trimDark);
    c.fillStyle = g; c.fillRect(x, y, ww, hh); c.strokeStyle = ink; c.strokeRect(x, y, ww, hh);
  };
  const blade = (pts) => {
    const g = c.createLinearGradient(-8, 0, 8, 0);
    g.addColorStop(0, bladeDark); g.addColorStop(0.45, bladeLite); g.addColorStop(1, bladeDark);
    path(c, pts, g);
  };
  if (id === 'claymore') {
    blade([[-11, r * 0.10], [-10, -r * 0.04], [-7, -r * 0.36], [0, -r * 0.50], [7, -r * 0.36], [10, -r * 0.04], [11, r * 0.10]]);
    c.strokeStyle = '#f6f8f2'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, r * 0.04); c.lineTo(0, -r * 0.38); c.stroke();
    metalBar(-34, r * 0.08, 68, 10); grip(r * 0.18, r * 0.40, 8); disc(c, 0, r * 0.46, 8, pal.trim);
  } else if (id === 'spear') {
    shaft(-r * 0.36, r * 0.46, 6); grip(r * 0.22, r * 0.40, 7);
    blade([[0, -r * 0.50], [-9, -r * 0.34], [0, -r * 0.26], [9, -r * 0.34]]);
    metalBar(-11, -r * 0.36, 22, 4);
  } else if (id === 'axe') {
    shaft(-r * 0.28, r * 0.40, 6); grip(r * 0.16, r * 0.36, 7);
    blade([[3, -r * 0.36], [32, -r * 0.42], [34, -r * 0.14], [14, 0], [3, -r * 0.12]]);
  } else if (id === 'mace') {
    shaft(-r * 0.24, r * 0.38, 6); grip(r * 0.14, r * 0.34, 7);
    disc(c, 0, -r * 0.34, 14, pal.plate.mid);
    for (let i = 0; i < 6; i++) { c.save(); c.translate(0, -r * 0.34); c.rotate(i * Math.PI / 3); path(c, [[9, -4], [19, 0], [9, 4]], bladeLite); c.restore(); }
  } else {
    blade([[-6, r * 0.08], [-5.5, -r * 0.32], [0, -r * 0.50], [5.5, -r * 0.32], [6, r * 0.08]]);
    c.strokeStyle = '#f4f7ef'; c.beginPath(); c.moveTo(0, r * 0.04); c.lineTo(0, -r * 0.38); c.stroke();
    metalBar(-18, r * 0.07, 36, 5); grip(r * 0.13, r * 0.36, 6.5); disc(c, 0, r * 0.42, 4.8, pal.trim);
  }
  c.restore();
}

function drawSlashTrail(c, L) {
  const w = L.weapon;
  c.save();
  c.translate(L.shoulderC.x, L.shoulderC.y + 8);
  c.strokeStyle = 'rgba(232, 214, 140, 0.55)';
  c.lineWidth = 26; c.lineCap = 'round';
  c.beginPath();
  const r = Math.hypot(w.x - L.shoulderC.x, w.y - L.shoulderC.y) + 36;
  const a1 = L.facing > 0 ? -1.85 : Math.PI + 1.85;
  const a2 = L.facing > 0 ? 0.65 : Math.PI - 0.65;
  c.arc(0, 0, r * 0.78, a1, a2, L.facing < 0);
  c.stroke();
  c.strokeStyle = 'rgba(255, 250, 230, 0.32)'; c.lineWidth = 10; c.stroke();
  c.restore();
}

function drawDebris(c, L) {
  const x = L.weapon.x + L.facing * 18, y = L.ground - 4;
  const bits = [[0, 0, 7], [12, -8, 5], [-10, -6, 4], [18, -2, 3], [-16, -3, 3], [6, -14, 3]];
  for (const [dx, dy, r] of bits) {
    path(c, [[x + dx, y + dy], [x + dx + r, y + dy - 2], [x + dx + r * 0.4, y + dy + r * 0.6]], '#6a5a3a');
  }
  c.fillStyle = 'rgba(90,70,40,0.35)';
  c.beginPath(); c.ellipse(x, y + 4, 28, 6, 0, 0, Math.PI * 2); c.fill();
}

function drawShadow(c, L) {
  c.save(); c.fillStyle = 'rgba(20,16,12,0.28)';
  c.beginPath(); c.ellipse(L.rootX + L.facing * 6, L.ground + L.hop + 4, 42 + L.hop * 0.12, 8, 0, 0, Math.PI * 2); c.fill();
  c.restore();
}

export function drawKnight(c, pose, build = {}) {
  const b = {
    armour: build.armour || 'plate',
    helmet: build.helmet ?? 'great',
    shield: build.shield ?? 'heater',
    weapon: build.weapon || 'sword',
    cloth: build.cloth || '#6b2a2a',
    trim: build.trim || '#c9a24a',
    crest: build.crest,
    twoHand: build.twoHand || pose.twoHand
  };
  const pal = palette(b);
  const reach = b.weapon === 'claymore' ? 172 : b.weapon === 'spear' ? 198 : b.weapon === 'axe' ? 92 : 104;
  const L = layout({ ...pose, reach });
  const plate = pal.plate;

  drawShadow(c, L);
  if (pose.trail) drawSlashTrail(c, L);

  // far leg
  plateBone(c, L.hipRear, L.kneeRear, H * 0.32, H * 0.24, plate, pal.trim);
  drawPoleyn(c, L.kneeRear, L.facing, plate, pal.trim);
  plateBone(c, L.kneeRear, L.ankleRear, H * 0.22, H * 0.15, plate, pal.trim);
  drawSabaton(c, L.ankleRear, L.toeRear, L.facing, plate, pal.trim);

  // far arm
  plateBone(c, L.shRear, L.elbowRear, H * 0.2, H * 0.16, plate, pal.trim);
  drawCouter(c, L.elbowRear, plate, pal.trim);
  plateBone(c, L.elbowRear, L.handRear, H * 0.16, H * 0.12, plate, pal.trim);
  drawGauntlet(c, L.handRear, L.facing, plate, pal.trim);
  drawPauldron(c, L.shRear, L.facing, plate, pal.trim, 0.82);

  drawTorso(c, L, pal, b);
  plateBone(c, { x: L.shoulderC.x, y: L.shoulderC.y - 6 }, L.headC, 8, 7, plate);

  // near leg
  plateBone(c, L.hipLead, L.kneeLead, H * 0.34, H * 0.25, plate, pal.trim);
  drawPoleyn(c, L.kneeLead, L.facing, plate, pal.trim);
  plateBone(c, L.kneeLead, L.ankleLead, H * 0.24, H * 0.16, plate, pal.trim);
  drawSabaton(c, L.ankleLead, L.toeLead, L.facing, plate, pal.trim);

  if (b.helmet === 'none') {
    disc(c, L.headC.x, L.headC.y, H * 0.48, '#c68642', ink, 1.5);
  } else if (b.helmet === 'cap') {
    disc(c, L.headC.x, L.headC.y, H * 0.46, '#c68642', ink, 1.4);
    drawCapHelm(c, L, pal, b);
  } else {
    drawGreatHelm(c, L, pal, b);
  }

  if (b.shield === 'heater') drawHeater(c, L, pal);
  else if (b.shield === 'buckler') drawBuckler(c, L, pal);

  plateBone(c, L.shLead, L.elbowLead, H * 0.22, H * 0.17, plate, pal.trim);
  drawCouter(c, L.elbowLead, plate, pal.trim);
  plateBone(c, L.elbowLead, L.handLead, H * 0.17, H * 0.13, plate, pal.trim);
  drawGauntlet(c, L.handLead, L.facing, plate, pal.trim);
  drawPauldron(c, L.shLead, L.facing, plate, pal.trim, 1.05);

  if (b.weapon === 'twinSwords') {
    drawWeaponLocal(c, L.weapon, 'sword', pal);
    const off = { ...L.weapon, x: L.handRear.x - Math.sin(L.weapon.a + 0.25) * L.weapon.reach * 0.38, y: L.handRear.y + Math.cos(L.weapon.a + 0.25) * L.weapon.reach * 0.38, a: L.weapon.a + 0.35 * L.facing };
    drawWeaponLocal(c, off, 'sword', pal);
  } else {
    drawWeaponLocal(c, L.weapon, b.weapon, pal);
  }
  if (pose.debris) drawDebris(c, L);
  return L;
}

export function studio(c, w, h, white = false) {
  if (white) { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); return; }
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#d5d2cc'); g.addColorStop(0.5, '#e4dccb'); g.addColorStop(1, '#cbbd9e');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#b7aa8c'; c.fillRect(0, h * 0.72, w, h * 0.28);
  c.fillStyle = '#8d8166'; c.fillRect(0, h * 0.72, w, 3);
}

export function label(c, text, x, y, size = 16) {
  c.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
  c.textAlign = 'center'; c.textBaseline = 'top';
  c.fillStyle = '#2c261e'; c.fillText(text, x, y);
}
export function caption(c, text, x, y, size = 13) {
  c.font = `${size}px system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'top';
  c.fillStyle = '#5a5348'; c.fillText(text, x, y);
}
export function title(c, text, x, y) {
  c.font = '700 28px Georgia, serif'; c.fillStyle = '#1c1814'; c.textAlign = 'left';
  c.fillText(text, x, y);
  c.font = '13px system-ui, sans-serif'; c.fillStyle = '#6a6358';
  c.fillText('Ragdoll Rivals  2.2b concept  ·  original rig  ·  not shipped', x, y + 26);
}
