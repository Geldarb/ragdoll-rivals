import { drawFighter, drawLineupBackdrop, drawDuskArena, drawDuskGround, BUILDS, kneesForward, layout, characterHeight } from './draw.js';
import { sampleWorld, poseFor, DURATION, stancePose, RING } from './anim.js';

export { DURATION };

export const LINEUP = [
  { build: BUILDS.lightRapier, x: 118 },
  { build: BUILDS.mediumSword, x: 350 },
  { build: BUILDS.mediumAxe, x: 582 },
  { build: BUILDS.heavyMace, x: 820 },
  { build: BUILDS.heavyClaymore, x: 1068 },
];

export function drawLineup(c, w, h) {
  drawLineupBackdrop(c, w, h);
  const ground = h * 0.80;
  c.font = '14px Georgia, serif';
  c.fillStyle = '#c4b49a';
  c.textAlign = 'center';
  c.fillText('Ragdoll Rivals  ·  2.3b concept  ·  upright grit, original drawings', w / 2, 38);
  for (const item of LINEUP) {
    const pose = stancePose(0.9);
    pose.facing = 1;
    pose.rootX = item.x;
    pose.groundY = ground;
    pose.footR = { x: item.x + 0.34 * 40, y: ground, angle: 0, lift: 0 };
    pose.footL = { x: item.x - 0.30 * 40, y: ground, angle: 0, lift: 0 };
    drawFighter(c, pose, item.build);
    c.fillStyle = '#c8b8a0';
    c.font = '12px Georgia, serif';
    c.fillText(item.build.label, item.x, ground + 32);
  }
}

export function frameDuel(c, w, h) {
  const focusX = (RING.p1End + RING.p2End) / 2;
  const ground = RING.ground;
  // Desktop: ~1.05 so a 300px fighter is ~44% of 720. Phone: 0.88 → ~40% of 664.
  const scale = w < 500 ? 0.88 : 1.05;
  c.translate(w / 2, h * 0.82);
  c.scale(scale, scale);
  c.translate(-focusX, -ground);
  return scale;
}

export function drawDuel(c, w, h, t) {
  drawDuskArena(c, w, h);
  c.save();
  frameDuel(c, w, h);
  drawDuskGround(c, RING.ground);
  const world = sampleWorld(t);
  const p1 = poseFor('p1', world);
  const p2 = poseFor('p2', world);
  drawFighter(c, p1, BUILDS.heavyClaymore);
  drawFighter(c, p2, BUILDS.mediumSword);
  c.restore();
  return { p1, p2, world };
}

export function validateAt(t) {
  const world = sampleWorld(t);
  const out = {};
  for (const who of ['p1', 'p2']) {
    const pose = poseFor(who, world);
    const build = who === 'p1' ? BUILDS.heavyClaymore : BUILDS.mediumSword;
    const L = layout(pose, build);
    const k = kneesForward(L, pose);
    const grip = Math.hypot(L.weapon.x - L.handR.x, L.weapon.y - L.handR.y);
    out[who] = { knees: k, grip, rootX: pose.rootX, height: characterHeight(L), hipDrop: pose.hipDrop, lean: pose.lean };
  }
  return out;
}
