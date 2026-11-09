// Prototype 2.2 concept renderer — approval sheets only.
// Original Ragdoll Rivals look: realistic 7.5-head proportions, tapered limbs,
// smooth shading, knees that bend toward the facing direction.
// Not a shipping renderer and not copied from any other game.

export const HEAD = 30;
const H = HEAD;
const ink = '#2a241e';
const gold = '#d4b25a';
const steel = '#c5d0ce';

export function shade(hex, amt) {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(v.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(v.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(v.slice(4, 6), 16) + amt));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function mix(a, b, t) { return a + (b - a) * t; }
function lerp(a, b, t) { return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function ang(a) { return { x: Math.cos(a), y: Math.sin(a) }; }

export function twoBone(origin, target, upper, lower, prefer) {
  const dx = target.x - origin.x, dy = target.y - origin.y;
  let dist = Math.hypot(dx, dy) || 1;
  const maxd = upper + lower - 1.4, mind = Math.abs(upper - lower) + 2;
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

export const STYLES = {
  aggressive: { lean: .22, hipDrop: .26, width: 1.38, weight: .34, guard: 1.05, shield: .35, bounce: 1, label: 'Aggressive' },
  defensive: { lean: -.08, hipDrop: .34, width: 1.68, weight: -.16, guard: .62, shield: .95, bounce: .35, label: 'Defensive' },
  counterattacker: { lean: .06, hipDrop: .38, width: .98, weight: -.1, guard: .78, shield: .55, bounce: .55, label: 'Counterattacker' },
  evasive: { lean: .1, hipDrop: .14, width: .88, weight: .1, guard: .95, shield: .28, bounce: 1.25, label: 'Evasive' },
  balanced: { lean: .08, hipDrop: .24, width: 1.22, weight: .12, guard: .92, shield: .55, bounce: .6, label: 'Balanced' },
  berserker: { lean: .26, hipDrop: .36, width: 1.52, weight: .32, guard: .7, shield: .15, bounce: .85, label: 'Berserker' },
  patient: { lean: -.04, hipDrop: .1, width: .86, weight: .22, guard: 1.28, shield: .4, bounce: .28, label: 'Patient duellist' }
};

export function styleIdle(style, t = 0) {
  const s = STYLES[style] || STYLES.balanced;
  const bob = Math.sin(t * s.bounce * Math.PI * 2) * 2.2;
  const breath = Math.sin(t * 1.6) * 1.1;
  return {
    style, lean: s.lean, hipDrop: s.hipDrop, stanceWidth: s.width, weight: s.weight,
    heelLift: style === 'evasive' ? 5 : style === 'patient' ? 1 : 2,
    guard: s.guard, shieldRaise: s.shield,
    hipBob: bob, chestBob: breath,
    weaponAngle: style === 'patient' ? .95 : style === 'berserker' ? .55 : .72,
    action: 'idle'
  };
}

export function displayIdle(t = 0) {
  return {
    style: 'balanced', lean: .035, hipDrop: .02, stanceWidth: .92, weight: .04,
    heelLift: 1, guard: 1.02, shieldRaise: .32, hipBob: Math.sin(t * 1.4) * 1.2,
    chestBob: Math.sin(t * 1.6) * .8, weaponAngle: .78, action: 'idle'
  };
}

export function walkPose(u, style = 'balanced') {
  const s = STYLES[style] || STYLES.balanced;
  const phase = ((u % 1) + 1) % 1;
  const stride = 1.12;
  const lead = Math.sin(phase * Math.PI * 2);
  // Lift the foot that is swinging forward; both feet plant at the extremes (contact).
  const liftL = Math.max(0, Math.cos(phase * Math.PI * 2)) * 16;
  const liftR = Math.max(0, -Math.cos(phase * Math.PI * 2)) * 16;
  return {
    style, lean: s.lean + lead * .05, hipDrop: s.hipDrop + 0.05, stanceWidth: s.width,
    weight: lead * .28, guard: s.guard, shieldRaise: s.shield * .7,
    footLead: { offset: lead * stride * .55, lift: liftL },
    footRear: { offset: -lead * stride * .55, lift: liftR },
    heelLift: 2, weaponAngle: .7 + lead * .06, hipBob: Math.abs(Math.cos(phase * Math.PI * 2)) * 2.2,
    action: 'walk', phase
  };
}

export function layout(pose = {}) {
  const facing = pose.facing ?? 1;
  const ground = pose.groundY ?? 420;
  const rootX = pose.rootX ?? 200;
  const hop = pose.hop ?? 0;
  const hipDrop = (pose.hipDrop ?? .22) * H;
  const lean = (pose.lean ?? .07) * facing;
  const width = (pose.stanceWidth ?? 1.18) * H;
  const weight = (pose.weight ?? .1) * facing * 7;
  const G = ground - hop;

  const pelvis = { x: rootX + Math.sin(lean) * 6 + weight, y: G - 3.5 * H + hipDrop + (pose.hipBob || 0) };
  const torsoLen = 2.5 * H;
  const shoulderC = { x: pelvis.x + Math.sin(lean) * torsoLen, y: pelvis.y - Math.cos(lean) * torsoLen + (pose.chestBob || 0) };
  const headC = { x: shoulderC.x + Math.sin(lean * .7) * H * .4, y: shoulderC.y - H * 1.0 };
  const hipLead = { x: pelvis.x + facing * H * .18, y: pelvis.y + 4 };
  const hipRear = { x: pelvis.x - facing * H * .2, y: pelvis.y + 2 };
  const shLead = { x: shoulderC.x + facing * H * .22, y: shoulderC.y + 4 };
  const shRear = { x: shoulderC.x - facing * H * .26, y: shoulderC.y + 2 };

  const leadOff = pose.footLead?.offset ?? .42;
  const rearOff = pose.footRear?.offset ?? -.52;
  const leadLift = pose.footLead?.lift ?? 0;
  const rearLift = pose.footRear?.lift ?? 0;
  const heel = pose.heelLift ?? 2;
  const ankleLead = { x: rootX + facing * width * leadOff, y: G - 7 - leadLift - (leadLift > 1 ? 0 : heel * .3) };
  const ankleRear = { x: rootX + facing * width * rearOff, y: G - 7 - rearLift - (rearLift > 1 ? 0 : heel) };
  const toeLead = { x: ankleLead.x + facing * 16, y: G - leadLift, planted: leadLift < 2 };
  const toeRear = { x: ankleRear.x + facing * 13, y: G - rearLift, planted: rearLift < 2 };

  const thigh = 2.02 * H, shin = 1.55 * H;
  const preferLeg = { x: facing * 1.15, y: -0.35 };
  const leadLeg = twoBone(hipLead, ankleLead, thigh, shin, preferLeg);
  const rearLeg = twoBone(hipRear, ankleRear, thigh, shin, preferLeg);

  const guard = pose.guard ?? .8;
  const shieldRaise = pose.shieldRaise ?? .7;
  const wAngle = pose.weaponAngle ?? .72;
  let handLead, handRear;
  if (pose.hands) {
    handLead = { x: shoulderC.x + pose.hands.lead.x * facing, y: shoulderC.y + pose.hands.lead.y };
    handRear = { x: shoulderC.x + pose.hands.rear.x * facing, y: shoulderC.y + pose.hands.rear.y };
  } else if (pose.action === 'slashWind') {
    handLead = { x: shoulderC.x - facing * H * .15, y: shoulderC.y - H * 1.55 };
    handRear = { x: shoulderC.x - facing * H * .05, y: shoulderC.y - H * .2 };
  } else if (pose.action === 'slashHit') {
    handLead = { x: shoulderC.x + facing * H * 2.05, y: shoulderC.y + H * .15 };
    handRear = { x: shoulderC.x + facing * H * .55, y: shoulderC.y + H * .1 };
  } else if (pose.action === 'slashFollow') {
    handLead = { x: shoulderC.x + facing * H * 1.7, y: shoulderC.y + H * 1.15 };
    handRear = { x: shoulderC.x + facing * H * .4, y: shoulderC.y + H * .55 };
  } else if (pose.action === 'overheadWind') {
    handLead = { x: shoulderC.x - facing * H * .35, y: shoulderC.y - H * 2.15 };
    handRear = { x: shoulderC.x - facing * H * .15, y: shoulderC.y - H * 1.7 };
  } else if (pose.action === 'overheadHit') {
    handLead = { x: shoulderC.x + facing * H * 1.55, y: shoulderC.y + H * .85 };
    handRear = { x: shoulderC.x + facing * H * .85, y: shoulderC.y + H * .45 };
  } else if (pose.action === 'overheadFollow') {
    handLead = { x: shoulderC.x + facing * H * 1.15, y: shoulderC.y + H * 1.55 };
    handRear = { x: shoulderC.x + facing * H * .55, y: shoulderC.y + H * 1.05 };
  } else if (pose.action === 'thrustWind') {
    handLead = { x: shoulderC.x - facing * H * .85, y: shoulderC.y - H * .15 };
    handRear = { x: shoulderC.x - facing * H * 1.25, y: shoulderC.y + H * .05 };
  } else if (pose.action === 'thrustHit') {
    handLead = { x: shoulderC.x + facing * H * 2.45, y: shoulderC.y - H * .05 };
    handRear = { x: shoulderC.x + facing * H * 1.55, y: shoulderC.y + H * .02 };
  } else if (pose.action === 'thrustFollow') {
    handLead = { x: shoulderC.x + facing * H * 2.15, y: shoulderC.y + H * .2 };
    handRear = { x: shoulderC.x + facing * H * 1.25, y: shoulderC.y + H * .18 };
  } else if (pose.action === 'dash') {
    handLead = { x: shoulderC.x + facing * H * 1.55, y: shoulderC.y - H * .1 };
    handRear = { x: shoulderC.x - facing * H * .15, y: shoulderC.y + H * .25 };
  } else if (pose.action === 'jumpAttack') {
    handLead = { x: shoulderC.x + facing * H * .2, y: shoulderC.y - H * 2.05 };
    handRear = { x: shoulderC.x + facing * H * .05, y: shoulderC.y - H * 1.55 };
  } else if (pose.action === 'sweep') {
    handLead = { x: shoulderC.x + facing * H * 2.15, y: G - 18 };
    handRear = { x: shoulderC.x + facing * H * .7, y: G - 36 };
  } else if (pose.action === 'blockHigh') {
    handLead = { x: shoulderC.x + facing * H * .85, y: shoulderC.y - H * .85 };
    handRear = { x: shoulderC.x + facing * H * .95, y: shoulderC.y - H * 1.05 };
  } else if (pose.action === 'blockLow') {
    handLead = { x: shoulderC.x + facing * H * .95, y: shoulderC.y + H * .85 };
    handRear = { x: shoulderC.x + facing * H * 1.05, y: shoulderC.y + H * .55 };
  } else if (pose.action === 'disarm') {
    handLead = { x: shoulderC.x + facing * H * 1.85, y: shoulderC.y - H * .35 };
    handRear = { x: shoulderC.x + facing * H * .55, y: shoulderC.y - H * .15 };
  } else {
    handLead = { x: shoulderC.x + facing * H * (1.15 + .85 * guard), y: shoulderC.y + H * (.35 - .15 * guard) };
    handRear = { x: shoulderC.x + facing * H * (.85 + .35 * shieldRaise), y: shoulderC.y + H * (.45 - .55 * shieldRaise) };
  }

  const upperA = 1.35 * H, lowerA = 1.2 * H;
  const preferArm = { x: -facing * 0.4, y: 1 };
  const leadArm = twoBone(shLead, handLead, upperA, lowerA, preferArm);
  const rearArm = twoBone(shRear, handRear, upperA, lowerA, preferArm);

  let weaponA = facing * wAngle;
  if (pose.action === 'slashWind' || pose.action === 'overheadWind' || pose.action === 'jumpAttack') weaponA = facing * -1.15;
  if (pose.action === 'slashHit') weaponA = facing * 1.55;
  if (pose.action === 'slashFollow') weaponA = facing * 2.15;
  if (pose.action === 'overheadHit') weaponA = facing * 1.85;
  if (pose.action === 'overheadFollow') weaponA = facing * 2.45;
  if (pose.action === 'thrustWind') weaponA = facing * 1.15;
  if (pose.action === 'thrustHit' || pose.action === 'thrustFollow') weaponA = facing * 1.35;
  if (pose.action === 'sweep') weaponA = facing * 2.15;
  if (pose.action === 'dash') weaponA = facing * .85;
  if (pose.action === 'blockHigh') weaponA = facing * .25;
  if (pose.action === 'blockLow') weaponA = facing * 1.15;
  if (pose.action === 'disarm') weaponA = facing * 1.25;
  if (pose.weaponAngleOverride != null) weaponA = pose.weaponAngleOverride;

  const reach = pose.reach ?? 78;
  const grip = leadArm.end;
  const weapon = { x: grip.x - Math.sin(weaponA) * reach * .38, y: grip.y + Math.cos(weaponA) * reach * .38, a: weaponA, reach };

  return {
    facing, ground: G, rootX, H, pelvis, shoulderC, headC, hipLead, hipRear, shLead, shRear,
    kneeLead: leadLeg.joint, ankleLead: leadLeg.end, toeLead,
    kneeRear: rearLeg.joint, ankleRear: rearLeg.end, toeRear,
    elbowLead: leadArm.joint, handLead: leadArm.end,
    elbowRear: rearArm.joint, handRear: rearArm.end,
    weapon, lean, hop
  };
}

function path(c, pts, fill, stroke = ink, width = 1.8) {
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function disc(c, x, y, r, fill, stroke = ink, w = 1.4) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = w; c.stroke(); }
}
function tapered(c, a, b, wa, wb, fill, light, dark) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const g = c.createLinearGradient(a.x - nx * wa, a.y - ny * wa, a.x + nx * wa, a.y + ny * wa);
  g.addColorStop(0, dark || shade(fill, -36));
  g.addColorStop(.35, fill);
  g.addColorStop(.7, light || shade(fill, 28));
  g.addColorStop(1, shade(fill, -18));
  path(c, [
    [a.x + nx * wa, a.y + ny * wa], [b.x + nx * wb, b.y + ny * wb],
    [b.x - nx * wb, b.y - ny * wb], [a.x - nx * wa, a.y - ny * wa]
  ], g, ink, 1.5);
}

function drawFoot(c, ankle, toe, facing, colour) {
  const tip = { x: toe.x + facing * 4, y: toe.y };
  const heel = { x: ankle.x - facing * 10, y: ankle.y + 5 };
  const top = { x: ankle.x + facing * 2, y: ankle.y - 5 };
  const g = c.createLinearGradient(heel.x, heel.y - 8, tip.x, tip.y);
  g.addColorStop(0, shade(colour, -20)); g.addColorStop(1, shade(colour, 10));
  path(c, [
    [heel.x, heel.y], [top.x - facing * 6, top.y], [top.x + facing * 8, top.y + 1],
    [tip.x, tip.y - 2], [tip.x + facing * 2, tip.y + 4], [heel.x - facing * 2, heel.y + 4]
  ], g);
}

function drawHead(c, L, build, hideFace) {
  const d = L.facing, h = L.headC, r = H * .5;
  c.save(); c.translate(h.x, h.y); c.rotate(L.lean * .45);
  const skin = build.skin, hair = build.hair;
  const sg = c.createRadialGradient(-r * .25, -r * .3, 3, 0, 2, r * 1.15);
  sg.addColorStop(0, shade(skin, 28)); sg.addColorStop(.55, skin); sg.addColorStop(1, shade(skin, -32));
  disc(c, 0, 2, r * 1.02, sg, ink, 1.6);
  path(c, [[-r * .15, r * .55], [d * r * .15, r * .95], [d * r * .55, r * .45], [d * r * .35, r * .15]], shade(skin, -8));
  path(c, [[d * r * .42, -r * .05], [d * r * .92, r * .12], [d * r * .5, r * .28]], skin, ink, 1.2);
  if (!hideFace) {
    c.fillStyle = '#f4efe6'; c.beginPath(); c.ellipse(d * r * .28, -r * .08, 5.2, 3.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2c241c'; c.beginPath(); c.ellipse(d * r * .34, -r * .08, 2.3, 2.3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(d * r * .4, -r * .16, 1.1, 0, Math.PI * 2); c.fill();
    c.strokeStyle = shade(skin, -40); c.lineWidth = 1.4; c.beginPath();
    c.moveTo(d * r * .12, -r * .28); c.quadraticCurveTo(d * r * .35, -r * .38, d * r * .55, -r * .18); c.stroke();
    c.strokeStyle = shade(skin, -50); c.beginPath(); c.moveTo(d * r * .2, r * .28); c.lineTo(d * r * .42, r * .24); c.stroke();
    disc(c, -d * r * .42, r * .05, 5.5, shade(skin, -12));
  }
  const hg = c.createLinearGradient(0, -r, 0, r * .2);
  hg.addColorStop(0, shade(hair, 20)); hg.addColorStop(1, shade(hair, -25));
  path(c, [[-r * .85, r * .05], [-r * .9, -r * .35], [-r * .4, -r * .95], [r * .15, -r * 1.02], [r * .75, -r * .55], [r * .7, -r * .05], [r * .2, -r * .45], [-r * .15, -r * .2]], hg);
  c.restore();
}

function drawHelmet(c, L, kind, cloth) {
  const d = L.facing, h = L.headC, r = H * .5;
  c.save(); c.translate(h.x, h.y); c.rotate(L.lean * .45);
  const metalG = c.createLinearGradient(-r, -r, r, r);
  metalG.addColorStop(0, '#e8eeea'); metalG.addColorStop(.45, '#9aaba8'); metalG.addColorStop(1, '#5e6e6c');
  if (kind === 'cap') {
    path(c, [[-r * 1.05, r * .05], [-r * .95, -r * .55], [-r * .2, -r * 1.05], [r * .55, -r * .9], [r * .95, -r * .25], [r * .85, r * .1], [r * .2, -r * .15], [-r * .3, -r * .05]], metalG);
    path(c, [[d * r * .35, -r * .15], [d * r * .55, -r * .1], [d * r * .52, r * .55], [d * r * .28, r * .5]], '#cfc6a2', ink, 1.2);
  } else {
    path(c, [[-r * 1.1, r * .1], [-r * 1.0, -r * .5], [-r * .35, -r * 1.12], [r * .45, -r * 1.08], [r * 1.05, -r * .4], [r * 1.05, r * .15], [r * .45, r * .35], [r * .25, -r * .05], [-r * .35, 0], [-r * .55, r * .3]], metalG);
    path(c, [[-r * .2, -r * 1.05], [0, -r * 1.28], [r * .3, -r * 1.02], [r * .18, -r * .15], [-r * .05, -r * .15]], '#e6d9a8', ink, 1.2);
    if (kind === 'helm') {
      path(c, [[-r * .95, r * .05], [r * .95, r * .05], [r * .9, r * .7], [r * .2, r * 1.15], [-r * .35, r * 1.08], [-r * .95, r * .6]], '#8b9d9a');
      c.fillStyle = '#1b2a28'; c.fillRect(-r * .7, r * .18, r * 1.4, 5);
      for (let x = -r * .5; x < r * .55; x += 7) c.fillRect(x, r * .55, 2.4, 8);
      c.fillStyle = gold; c.fillRect(-2.2, -r * .15, 4.4, r * 1.2);
      disc(c, d * r * .85, r * .35, 3.2, gold);
      path(c, [[4, -r * 1.05], [16, -r * 1.85], [6, -r * 1.1]], cloth, ink, 1.2);
    }
  }
  c.restore();
}

function drawTorso(c, L, build) {
  const d = L.facing;
  c.save();
  c.translate(L.pelvis.x, L.pelvis.y);
  c.rotate(L.lean);
  const s = H;
  const cloth = build.cloth;
  const outline = [
    [-.40 * s, .10 * s], [-.44 * s, -.22 * s], [-.36 * s, -1.22 * s], [-.32 * s, -2.15 * s],
    [-.14 * s, -2.58 * s], [.12 * s, -2.58 * s], [.42 * s, -2.23 * s], [.52 * s, -1.68 * s],
    [.38 * s, -1.12 * s], [.30 * s, -.52 * s], [.24 * s, -.08 * s], [.32 * s, .12 * s]
  ];
  const g = c.createLinearGradient(-.5 * s, 0, .55 * s, -s);
  g.addColorStop(0, shade(cloth, -40)); g.addColorStop(.4, cloth); g.addColorStop(1, shade(cloth, 22));
  path(c, outline, g, ink, 1.8);
  if (build.armour === 'leather') {
    path(c, [[-.28 * s, -2.38 * s], [.34 * s, -2.28 * s], [.34 * s, -.15 * s], [.12 * s, .22 * s], [-.22 * s, .18 * s], [-.30 * s, -.2 * s]], '#7a5130');
    c.fillStyle = gold; disc(c, -.18 * s, -1.85 * s, 1.6, gold, null); disc(c, .22 * s, -1.8 * s, 1.6, gold, null);
    disc(c, -.16 * s, -.4 * s, 1.6, gold, null); disc(c, .18 * s, -.35 * s, 1.6, gold, null);
  } else if (build.armour === 'mail') {
    path(c, [[-.30 * s, -2.42 * s], [.38 * s, -2.32 * s], [.38 * s, .05 * s], [-.32 * s, .08 * s]], '#6d7c79');
    c.strokeStyle = '#3d4c49'; c.lineWidth = 1;
    for (let y = -2.2 * s; y < 0; y += 5) for (let x = -.22 * s; x < .28 * s; x += 6) {
      c.beginPath(); c.arc(x + ((y / 5) % 2 ? 3 : 0), y, 2.1, 0, Math.PI); c.stroke();
    }
  } else if (build.armour === 'plate') {
    const pg = c.createLinearGradient(-.4 * s, -2 * s, .45 * s, .2 * s);
    pg.addColorStop(0, '#dfe7e4'); pg.addColorStop(.45, '#9aada9'); pg.addColorStop(1, '#667774');
    path(c, [[-.32 * s, -2.45 * s], [.38 * s, -2.35 * s], [.48 * s, -1.58 * s], [.28 * s, -.2 * s], [0, .15 * s], [-.30 * s, -.15 * s], [-.40 * s, -1.58 * s]], pg);
    path(c, [[-.22 * s, -2.32 * s], [.05 * s, -2.15 * s], [.08 * s, -.25 * s], [-.24 * s, -.3 * s]], 'rgba(255,255,255,.22)', null);
    path(c, [[-.26 * s, .05 * s], [.24 * s, .08 * s], [.28 * s, .28 * s], [-.28 * s, .26 * s]], '#8b9c98');
  }
  c.fillStyle = '#3c2c22'; c.fillRect(-.28 * s, .02 * s, .56 * s, 7);
  const buckle = c.createLinearGradient(-6, 0, 6, 0);
  buckle.addColorStop(0, '#8a7340'); buckle.addColorStop(.5, '#f0dd90'); buckle.addColorStop(1, '#8a7340');
  c.fillStyle = buckle; c.fillRect(-5, 1, 10, 9); c.strokeStyle = ink; c.strokeRect(-5, 1, 10, 9);
  c.restore();
}

function drawShield(c, L, kind, cloth) {
  if (!kind || kind === 'none') return;
  const p = L.handRear;
  c.save(); c.translate(p.x, p.y); c.rotate(L.lean * .2);
  if (kind === 'buckler') {
    const g = c.createRadialGradient(-4, -4, 2, 0, 0, 22);
    g.addColorStop(0, '#d8c07a'); g.addColorStop(.55, '#8a6a3c'); g.addColorStop(1, '#4a3420');
    disc(c, 0, 0, 21, g); disc(c, 0, 0, 8, steel);
  } else {
    const g = c.createLinearGradient(-22, -30, 18, 30);
    g.addColorStop(0, shade(cloth, 18)); g.addColorStop(1, shade(cloth, -30));
    path(c, [[-16, -22], [16, -22], [14, 10], [0, 28], [-14, 10]], g, ink, 2);
    path(c, [[-12, -18], [0, -18], [0, 24], [-11, 8]], '#d7c68a');
    c.fillStyle = gold; c.fillRect(-2.5, -18, 5, 40); c.fillRect(-12, -5, 24, 5);
  }
  c.restore();
}

function drawWeaponLocal(c, w, id) {
  if (!w || !id) return;
  const r = w.reach || 78;
  c.save(); c.translate(w.x, w.y); c.rotate(w.a || 0);
  const wood = '#6b4428', blade = steel;
  const shaft = (y1, y2, width = 6, colour = wood) => {
    c.fillStyle = colour; c.strokeStyle = ink; c.lineWidth = 1.6;
    c.fillRect(-width / 2, y1, width, y2 - y1); c.strokeRect(-width / 2, y1, width, y2 - y1);
  };
  const grip = (y1, y2, width = 7) => {
    shaft(y1, y2, width, '#8b5a32');
    c.strokeStyle = '#c19b68';
    for (let y = y1 + 3; y < y2; y += 5) { c.beginPath(); c.moveTo(-width / 2, y); c.lineTo(width / 2, y + 2); c.stroke(); }
  };
  const metal = (x, y, ww, hh) => {
    const g = c.createLinearGradient(x, y, x + ww, y);
    g.addColorStop(0, '#566a6c'); g.addColorStop(.4, '#dce4db'); g.addColorStop(1, '#899b9b');
    c.fillStyle = g; c.fillRect(x, y, ww, hh); c.strokeStyle = ink; c.strokeRect(x, y, ww, hh);
  };
  if (id === 'claymore') {
    const tip = -r * .48, lugs = -r * .05, grd = r * .10;
    path(c, [[-10, grd], [-9, lugs], [-6.5, tip + r * .12], [0, tip], [6.5, tip + r * .12], [9, lugs], [10, grd]], blade);
    c.strokeStyle = '#f3f7ee'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, lugs + 2); c.lineTo(0, tip + r * .14); c.stroke();
    metal(-32, grd - 5, 64, 10); grip(grd + 6, r * .40, 8); disc(c, 0, r * .46, 8, gold);
  } else if (id === 'spear') {
    shaft(-r * .36, r * .46, 6); grip(r * .22, r * .40, 7);
    path(c, [[0, -r * .50], [-9, -r * .35], [0, -r * .27], [9, -r * .35]], blade);
    metal(-11, -r * .36, 22, 4);
  } else if (id === 'axe') {
    shaft(-r * .28, r * .40, 6); grip(r * .16, r * .36, 7);
    path(c, [[3, -r * .36], [30, -r * .40], [32, -r * .16], [14, -r * .02], [3, -r * .14]], blade);
  } else if (id === 'mace') {
    shaft(-r * .24, r * .38, 6); grip(r * .14, r * .34, 7); disc(c, 0, -r * .34, 13, '#819494');
    for (let i = 0; i < 6; i++) { c.save(); c.translate(0, -r * .34); c.rotate(i * Math.PI / 3); path(c, [[9, -4], [18, 0], [9, 4]], steel); c.restore(); }
  } else {
    path(c, [[-5.5, r * .08], [-5, -r * .32], [0, -r * .50], [5, -r * .32], [5.5, r * .08]], blade);
    c.strokeStyle = '#f0f6e9'; c.beginPath(); c.moveTo(0, r * .04); c.lineTo(0, -r * .38); c.stroke();
    metal(-16, r * .07, 32, 5); grip(r * .13, r * .36, 6.5); disc(c, 0, r * .42, 4.5, gold);
  }
  c.restore();
}

export function drawShadow(c, L) {
  c.save(); c.fillStyle = 'rgba(28,24,18,.22)';
  c.beginPath(); c.ellipse(L.rootX + L.facing * 4, L.ground + L.hop + 4, 36 + L.hop * .15, 8, 0, 0, Math.PI * 2); c.fill();
  c.restore();
}

export function drawConcept(c, pose, build = {}) {
  const b = {
    skin: build.skin || '#c68642', hair: build.hair || '#2c1b12', cloth: build.cloth || '#3d5c4e',
    armour: build.armour || 'leather', helmet: build.helmet || 'helm', shield: build.shield || 'kite',
    weapon: build.weapon || 'sword'
  };
  const reach = b.weapon === 'claymore' ? 168 : b.weapon === 'spear' ? 190 : b.weapon === 'axe' ? 86 : 96;
  const L = layout({ ...pose, reach });
  const skin = b.skin;
  const leather = '#4a3426';
  const plate = '#9aaeaa';
  const legCol = b.armour === 'plate' ? plate : b.armour === 'mail' ? '#6a7874' : leather;
  const boot = '#2f241c';

  drawShadow(c, L);
  // rear (far) limbs first
  tapered(c, L.hipRear, L.kneeRear, H * .28, H * .2, shade(legCol, -22), shade(legCol, 4), shade(legCol, -48));
  tapered(c, L.kneeRear, L.ankleRear, H * .2, H * .12, shade(legCol, -28), shade(legCol, -4), shade(legCol, -52));
  disc(c, L.kneeRear.x, L.kneeRear.y, 6.2, shade(legCol, 8));
  drawFoot(c, L.ankleRear, L.toeRear, L.facing, boot);
  tapered(c, L.shRear, L.elbowRear, H * .17, H * .13, b.cloth, shade(b.cloth, 22), shade(b.cloth, -28));
  tapered(c, L.elbowRear, L.handRear, H * .13, H * .1, skin, shade(skin, 22), shade(skin, -28));
  disc(c, L.elbowRear.x, L.elbowRear.y, 5, shade(skin, -8));
  disc(c, L.handRear.x, L.handRear.y, 6.2, '#5a3d28');

  drawTorso(c, L, b);
  tapered(c, { x: L.shoulderC.x, y: L.shoulderC.y - 8 }, L.headC, 7, 6, skin, shade(skin, 18), shade(skin, -22));

  // lead (near) leg
  tapered(c, L.hipLead, L.kneeLead, H * .3, H * .21, shade(legCol, 6), shade(legCol, 28), shade(legCol, -26));
  tapered(c, L.kneeLead, L.ankleLead, H * .21, H * .13, shade(legCol, -2), shade(legCol, 18), shade(legCol, -30));
  disc(c, L.kneeLead.x, L.kneeLead.y, 6.6, shade(legCol, 12));
  drawFoot(c, L.ankleLead, L.toeLead, L.facing, boot);

  drawHead(c, L, b, b.helmet === 'helm');
  if (b.helmet && b.helmet !== 'none') drawHelmet(c, L, b.helmet, b.cloth);
  drawShield(c, L, b.shield, b.cloth);

  tapered(c, L.shLead, L.elbowLead, H * .18, H * .14, shade(b.cloth, 8), shade(b.cloth, 26), shade(b.cloth, -24));
  tapered(c, L.elbowLead, L.handLead, H * .14, H * .1, skin, shade(skin, 24), shade(skin, -26));
  disc(c, L.elbowLead.x, L.elbowLead.y, 5.2, shade(skin, -6));
  disc(c, L.handLead.x, L.handLead.y, 6.5, '#634528');
  // deltoids
  disc(c, L.shLead.x, L.shLead.y, 9, shade(b.armour === 'plate' ? plate : b.cloth, 10), ink, 1.3);
  disc(c, L.shRear.x, L.shRear.y, 8, shade(b.armour === 'plate' ? plate : b.cloth, -6), ink, 1.2);

  drawWeaponLocal(c, L.weapon, b.weapon);
  if (b.weapon === 'claymore' || pose.twoHand) {
    // second hand already near the shaft from overhead poses
  }
  return L;
}

export function studio(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#cfd4d0'); g.addColorStop(.45, '#ddd6c6'); g.addColorStop(1, '#c4b89c');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#b7aa8c'; c.fillRect(0, h * .72, w, h * .28);
  c.fillStyle = '#8d8166'; c.fillRect(0, h * .72, w, 3);
}

export function label(c, text, x, y, size = 18) {
  c.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
  c.textAlign = 'center'; c.textBaseline = 'top';
  c.fillStyle = '#3a3328'; c.fillText(text, x, y);
}

export function caption(c, text, x, y, size = 13) {
  c.font = `${size}px system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'top';
  c.fillStyle = '#5a5348'; c.fillText(text, x, y);
}

export function drawHeadRuler(c, x, groundY) {
  c.save(); c.strokeStyle = '#8a7d68'; c.fillStyle = '#6a6358'; c.font = '11px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
  for (let i = 0; i <= 15; i++) {
    const y = groundY - (i / 2) * H;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (i % 2 ? 8 : 16), y); c.stroke();
    if (i % 2 === 0 || i === 15) c.fillText(i === 15 ? '7.5' : String(i / 2), x - 6, y);
  }
  c.restore();
}

export function title(c, text, x, y) {
  c.font = '700 28px Georgia, serif'; c.fillStyle = '#2a241e'; c.textAlign = 'left';
  c.fillText(text, x, y);
  c.font = '13px system-ui, sans-serif'; c.fillStyle = '#6a6358';
  c.fillText('Ragdoll Rivals  2.2 concept  ·  original art  ·  not shipped', x, y + 26);
}
