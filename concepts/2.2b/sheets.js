import {drawKnight, studio, title, label, caption} from './draw.js';
import {MAIN_SHEET, COMPARE_POSES, DEFAULT_BUILD, idle, walkFrame, runFrame, overheadRaise, overheadChop, slash, shieldGuard} from './poses.js';
import {drawBackdrop, drawGround} from '/art.js';

const Red = { ...DEFAULT_BUILD, cloth: '#6b2a2a', trim: '#c9a24a' };
const Teal = { ...DEFAULT_BUILD, cloth: '#1e4a4a', trim: '#d2b15a' };

export function poseSheet(ctx, w, h) {
  studio(ctx, w, h, true);
  ctx.fillStyle = '#1c1814';
  ctx.font = '700 28px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('Key poses  ·  procedural rig', 40, 48);
  ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#6a6358';
  ctx.fillText('Same layout language as the painted sheet: idle, walk, run, attacks, crouch, kneel, get-up, guard, ground strike.', 40, 74);
  const cols = 6, rows = 4, cellW = (w - 80) / cols, padTop = 110, cellH = (h - padTop - 40) / rows;
  MAIN_SHEET.forEach((pose, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = 40 + col * cellW + cellW / 2;
    const y = padTop + row * cellH + cellH * 0.78;
    drawKnight(ctx, { ...pose, rootX: x, groundY: y, facing: 1 }, Red);
    label(ctx, pose.name, x, y + 14, 13);
  });
}

export function gearVariants(ctx, w, h) {
  studio(ctx, w, h);
  title(ctx, 'Gear and armour variants', 48, 36);
  caption(ctx, 'Same plate language across weapons. Light leather and medium mail keep the dark metal / gold-bronze trim. Tabard colour tints the surcoat, crest and shield.', 1100, 80, 15);
  const weapons = [
    { title: 'Sword and heater', weapon: 'sword', shield: 'heater' },
    { title: 'Zweihander', weapon: 'claymore', shield: 'none', twoHand: true },
    { title: 'Spear', weapon: 'spear', shield: 'none' },
    { title: 'Axe and buckler', weapon: 'axe', shield: 'buckler' },
    { title: 'Mace and heater', weapon: 'mace', shield: 'heater' },
    { title: 'Twin swords', weapon: 'twinSwords', shield: 'none' }
  ];
  weapons.forEach((g, i) => {
    const x = 180 + i * 360;
    drawKnight(ctx, { ...idle(), rootX: x, groundY: 520, facing: 1, twoHand: g.twoHand }, { ...Red, ...g });
    label(ctx, g.title, x, 548, 16);
  });
  const armours = [
    { title: 'Light  ·  dark leather, bronze trim', armour: 'leather', helmet: 'cap', shield: 'buckler', weapon: 'sword', cloth: '#3d2a18', trim: '#b08a40' },
    { title: 'Medium  ·  mail, bronze trim', armour: 'mail', helmet: 'cap', shield: 'heater', weapon: 'axe', cloth: '#2a3a48', trim: '#c4a05a' },
    { title: 'Heavy  ·  blackened plate, gold trim', armour: 'plate', helmet: 'great', shield: 'heater', weapon: 'sword', cloth: '#6b2a2a', trim: '#c9a24a' },
    { title: 'Heavy  ·  teal tabard (second fighter)', armour: 'plate', helmet: 'great', shield: 'heater', weapon: 'sword', cloth: '#1e4a4a', trim: '#d2b15a' }
  ];
  armours.forEach((a, i) => {
    const x = 280 + i * 520;
    drawKnight(ctx, { ...idle(), rootX: x, groundY: 1080, facing: 1 }, a);
    label(ctx, a.title, x, 1110, 16);
  });
}

function fightPair(ctx, w, h) {
  drawBackdrop(ctx, w, h, 460);
  ctx.save();
  const portrait = w < 600;
  const midX = 460;
  ctx.translate(w / 2, h * (portrait ? 0.62 : 0.58));
  const zoom = portrait ? 0.95 : Math.min(1.18, w / 480, h / 400);
  ctx.scale(zoom, zoom);
  ctx.translate(-midX, portrait ? -370 : -352);
  drawGround(ctx);
  const gap = portrait ? 72 : 100;
  drawKnight(ctx, { ...idle(), rootX: midX - gap, groundY: 458, facing: 1 }, Red);
  drawKnight(ctx, { ...shieldGuard(), rootX: midX + gap, groundY: 458, facing: -1 }, Teal);
  ctx.restore();
}

export function inArena(ctx, w, h) {
  ctx.fillStyle = '#1a1814'; ctx.fillRect(0, 0, w, h);
  title(ctx, 'In the courtyard', 48, 36);
  caption(ctx, 'Two distinguishable fighters (crimson vs teal tabards) at game camera scale.', 900, 80, 15);

  ctx.save();
  ctx.translate(60, 120);
  ctx.beginPath(); ctx.rect(0, 0, 390, 664); ctx.clip();
  drawBackdrop(ctx, 390, 664, 450);
  ctx.fillStyle = '#bcaa7b'; ctx.fillRect(0, 495, 390, 180);
  ctx.fillStyle = '#796a47'; ctx.fillRect(0, 495, 390, 3);
  drawKnight(ctx, { ...idle(), rootX: 140, groundY: 495, facing: 1 }, Red);
  drawKnight(ctx, { ...shieldGuard(), rootX: 275, groundY: 495, facing: -1 }, Teal);
  ctx.restore();
  ctx.strokeStyle = '#cfc6b0'; ctx.lineWidth = 2; ctx.strokeRect(60, 120, 390, 664);
  label(ctx, '390 × 664', 255, 792, 16);

  ctx.save();
  ctx.translate(500, 180);
  ctx.beginPath(); ctx.rect(0, 0, 1280, 800); ctx.clip();
  fightPair(ctx, 1280, 800);
  ctx.restore();
  ctx.strokeStyle = '#cfc6b0'; ctx.lineWidth = 2; ctx.strokeRect(500, 180, 1280, 800);
  label(ctx, '1280 × 800', 1140, 990, 16);
}

export function compareReference(ctx, w, h, refImage) {
  studio(ctx, w, h, true);
  ctx.fillStyle = '#1c1814';
  ctx.font = '700 28px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('Reference  beside  the rig', 40, 48);
  ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#6a6358';
  ctx.fillText(refImage
    ? 'Left: crop from Bradley’s painted sheet. Right: the matching procedural pose.'
    : 'Reference image was not available at capture time — rig poses only. Re-run capture once the painted sheet is on disk.', 40, 74);
  const rows = COMPARE_POSES.length;
  const rowH = (h - 120) / rows;
  COMPARE_POSES.forEach((pose, i) => {
    const y = 110 + i * rowH;
    ctx.fillStyle = '#f3f1ea';
    ctx.fillRect(40, y, w - 80, rowH - 10);
    ctx.strokeStyle = '#ddd6c6'; ctx.strokeRect(40, y, w - 80, rowH - 10);
    if (refImage && window.__refBoxes && window.__refBoxes[i]) {
      const box = window.__refBoxes[i];
      const destH = rowH - 30, destW = destH * (box.w / box.h);
      ctx.drawImage(refImage, box.x, box.y, box.w, box.h, 80, y + 10, destW, destH);
    } else {
      ctx.fillStyle = '#b0a898'; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(refImage ? 'crop' : 'no reference crop', 220, y + rowH / 2);
    }
    drawKnight(ctx, { ...pose, rootX: 620, groundY: y + rowH - 28, facing: 1 }, Red);
    ctx.fillStyle = '#2c261e'; ctx.font = '600 16px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText(pose.name, 820, y + rowH / 2 - 8);
  });
}

export function previewFrame(ctx, w, h, kind, t) {
  studio(ctx, w, h);
  const build = Red;
  if (kind === 'walk') {
    drawKnight(ctx, { ...walkFrame(t * 6 % 6, 6), rootX: 640, groundY: 560, facing: 1 }, build);
    label(ctx, 'Walk', 640, 590, 22);
  } else if (kind === 'run') {
    drawKnight(ctx, { ...runFrame(t * 6 % 6, 6), rootX: 640, groundY: 560, facing: 1 }, build);
    label(ctx, 'Run', 640, 590, 22);
  } else if (kind === 'combo') {
    const u = t % 1;
    const pose = u < 0.28 ? overheadRaise() : u < 0.55 ? overheadChop() : u < 0.82 ? slash() : idle();
    drawKnight(ctx, { ...pose, rootX: 640, groundY: 560, facing: 1 }, build);
    label(ctx, 'Attack combo', 640, 590, 22);
  } else {
    drawKnight(ctx, { ...idle(), rootX: 640, groundY: 560, facing: 1, hipBob: Math.sin(t * Math.PI * 2) * 1.4 }, build);
    label(ctx, 'Idle', 640, 590, 22);
  }
  ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#5a5348'; ctx.textAlign = 'center';
  ctx.fillText('Ragdoll Rivals  2.2b concept preview  ·  original rig', 640, 40);
}

export const SHEETS = {
  'pose-sheet': { w: 2400, h: 1680, fn: 'poseSheet' },
  'gear-variants': { w: 2360, h: 1280, fn: 'gearVariants' },
  'in-arena': { w: 1860, h: 1080, fn: 'inArena' },
  'compare-reference': { w: 1200, h: 4200, fn: 'compareReference' }
};
