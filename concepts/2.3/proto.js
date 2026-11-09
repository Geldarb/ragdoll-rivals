import { drawBackdrop, drawGround } from '/art.js';
import { drawFighter, drawLineupBackdrop, BUILDS, kneesForward, layout } from './draw.js';
import { sampleWorld, poseFor, DURATION, stancePose } from './anim.js';

export { DURATION };

export const LINEUP = [
  { build: BUILDS.lightRapier, x: 128 },
  { build: BUILDS.mediumSword, x: 354 },
  { build: BUILDS.mediumAxe, x: 580 },
  { build: BUILDS.heavyMace, x: 812 },
  { build: BUILDS.heavyClaymore, x: 1055 },
];

export function drawLineup(c, w, h) {
  drawLineupBackdrop(c, w, h);
  const ground = h * 0.78;
  c.font = '13px Georgia, serif';
  c.fillStyle = '#d4c8b4';
  c.textAlign = 'center';
  c.fillText('Ragdoll Rivals  ·  2.3 concept  ·  grit, realistic proportions, original drawings', w / 2, 42);
  for (const item of LINEUP) {
    const pose = stancePose(0.8, { facing: 1, rootX: item.x, groundY: ground, lean: 0.05 });
    pose.facing = 1; pose.rootX = item.x; pose.groundY = ground;
    const w28 = 1.12 * 28;
    pose.footR = { x: item.x + w28 * 0.42, y: ground, angle: 0, lift: 0 };
    pose.footL = { x: item.x - w28 * 0.38, y: ground, angle: 0, lift: 0 };
    drawFighter(c, pose, item.build);
    c.fillStyle = '#c8bba8';
    c.font = '12px Georgia, serif';
    c.fillText(item.build.label, item.x, ground + 36);
  }
}

export function drawDuel(c, w, h, t) {
  drawBackdrop(c, w, h, 450);
  c.save();
  const zoom = w < 500 ? 0.92 : 0.94;
  c.translate(w / 2, h * 0.57);
  c.scale(zoom, zoom);
  c.translate(-460, -340);
  drawGround(c);
  const world = sampleWorld(t);
  const p1 = poseFor('p1', world);
  const p2 = poseFor('p2', world);
  // draw far-to-near: P1 (left) then P2, weapons naturally overlap at contact
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
    const k = kneesForward(L);
    const grip = Math.hypot(L.weapon.x - L.handR.x, L.weapon.y - L.handR.y);
    out[who] = { knees: k, grip, rootX: pose.rootX, footR: pose.footR?.x, footL: pose.footL?.x };
  }
  return out;
}
