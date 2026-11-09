import {studio, title, label, caption, drawConcept, styleIdle, displayIdle, walkPose, STYLES, drawHeadRuler} from './draw.js';
import {drawBody} from '/art.js';

const Rowan = {skin:'#c68642', hair:'#2c1b12', cloth:'#3d5c4e'};

export function characterTurnaround(ctx, w, h) {
  studio(ctx, w, h);
  title(ctx, 'Character turnaround  ·  7.5-head proportions', 48, 36);
  caption(ctx, 'One original fighter. Top: light, medium and heavy armour, each with helmet, shield and weapon. Bottom: skin, hair and tabard variants.', 1100, 80, 15);
  const armours = [
    {title:'Light  ·  cloth and leather', armour:'leather', helmet:'cap', shield:'buckler', weapon:'sword', cloth:'#3d5c4e'},
    {title:'Medium  ·  mail', armour:'mail', helmet:'helm', shield:'kite', weapon:'axe', cloth:'#4a5e6a'},
    {title:'Heavy  ·  plate', armour:'plate', helmet:'helm', shield:'kite', weapon:'mace', cloth:'#5a4a3a'}
  ];
  drawHeadRuler(ctx, 248, 560);
  caption(ctx, 'heads', 248, 568, 11);
  armours.forEach((a, i) => {
    const x = 400 + i * 560;
    drawConcept(ctx, {...displayIdle(.2), rootX:x, groundY:560, facing:1}, {...Rowan, ...a});
    label(ctx, a.title, x, 588, 18);
  });
  const looks = [
    {title:'Umber skin  ·  dark hair  ·  moss', skin:'#8d5524', hair:'#1a120c', cloth:'#3d5c4e', armour:'leather', helmet:'none', shield:'buckler', weapon:'sword'},
    {title:'Ivory skin  ·  copper hair  ·  royal', skin:'#e0b894', hair:'#8a3b1e', cloth:'#6b3a5a', armour:'leather', helmet:'cap', shield:'kite', weapon:'sword'},
    {title:'Copper skin  ·  black hair  ·  gold tabard', skin:'#c68642', hair:'#1c1410', cloth:'#b08a2a', armour:'leather', helmet:'helm', shield:'kite', weapon:'sword'}
  ];
  looks.forEach((a, i) => {
    const x = 400 + i * 560;
    drawConcept(ctx, {...displayIdle(.4 + i * .1), rootX:x, groundY:1080, facing:1}, a);
    label(ctx, a.title, x, 1110, 16);
  });
}

export function stanceSheet(ctx, w, h) {
  studio(ctx, w, h);
  title(ctx, 'Fighting stances  ·  seven styles', 48, 34);
  caption(ctx, 'Bent knees point forward. Each style keeps its own lean, base, guard height and weight.', 1230, 78, 15);
  const names = Object.keys(STYLES);
  const cloths = ['#6b3030','#2f5a48','#3a4a62','#5a6b3a','#4a4a48','#5a2e22','#4a3f6a'];
  names.forEach((style, i) => {
    const x = 170 + i * 340;
    drawConcept(ctx, {...styleIdle(style, .12 + i * .05), rootX:x, groundY:740, facing:1}, {
      ...Rowan, cloth: cloths[i],
      armour: style === 'defensive' || style === 'balanced' ? 'mail' : 'leather',
      helmet: style === 'patient' ? 'none' : 'helm',
      shield: style === 'berserker' ? 'none' : style === 'defensive' ? 'kite' : 'buckler',
      weapon: style === 'berserker' ? 'axe' : 'sword'
    });
    label(ctx, STYLES[style].label, x, 768, 17);
  });
}

export function walkSheet(ctx, w, h) {
  studio(ctx, w, h);
  title(ctx, 'Fighting walk  ·  eight key frames', 48, 34);
  caption(ctx, 'Stance-preserving step. Planted feet stay on the ground; the swinging knee travels forward, toward the facing direction.', 1230, 78, 15);
  for (let i = 0; i < 8; i++) {
    const x = 155 + i * 300;
    drawConcept(ctx, {...walkPose(i / 8, 'balanced'), rootX:x, groundY:660, facing:1}, {...Rowan, armour:'leather', helmet:'helm', shield:'buckler', weapon:'sword'});
    label(ctx, String(i + 1), x, 688, 18);
  }
}

export function attackSheet(ctx, w, h) {
  studio(ctx, w, h);
  title(ctx, 'Attack keyframes', 48, 34);
  caption(ctx, 'Anticipation, strike, follow-through and recovery. Weapon arcs stay readable; weight shifts through the hips; knees stay forward.', 1130, 78, 15);
  const rows = [
    {name:'Sword slash', weapon:'sword', shield:'buckler', armour:'leather', acts:['slashWind','slashHit','slashFollow', null], extras:[
      {lean:.1, hipDrop:.26, weight:-.18, stanceWidth:1.25},
      {lean:.18, hipDrop:.22, weight:.3, stanceWidth:1.3},
      {lean:.1, hipDrop:.24, weight:.18, stanceWidth:1.22},
      {lean:.07, hipDrop:.23, weight:.08, stanceWidth:1.18}
    ]},
    {name:'Zweihander overhead', weapon:'claymore', shield:'none', armour:'mail', acts:['overheadWind','overheadHit','overheadFollow', null], extras:[
      {lean:-.1, hipDrop:.36, weight:-.22, stanceWidth:1.2},
      {lean:.18, hipDrop:.28, weight:.32, stanceWidth:1.28},
      {lean:.12, hipDrop:.3, weight:.16, stanceWidth:1.22},
      {lean:.05, hipDrop:.24, weight:.06, stanceWidth:1.15}
    ]},
    {name:'Spear thrust', weapon:'spear', shield:'none', armour:'leather', acts:['thrustWind','thrustHit','thrustFollow', null], extras:[
      {lean:.02, hipDrop:.22, stanceWidth:1.45, weight:-.2},
      {lean:.16, hipDrop:.2, stanceWidth:1.55, weight:.34},
      {lean:.12, hipDrop:.22, stanceWidth:1.48, weight:.22},
      {lean:.05, hipDrop:.2, stanceWidth:1.28, weight:.06}
    ]}
  ];
  const cols = ['Anticipation', 'Strike', 'Follow-through', 'Recovery'];
  rows.forEach((row, ri) => {
    const y = 420 + ri * 430;
    ctx.save(); ctx.font = '600 20px Georgia, serif'; ctx.fillStyle = '#2a241e'; ctx.textAlign = 'left';
    ctx.fillText(row.name, 56, y - 168); ctx.restore();
    cols.forEach((col, ci) => {
      const x = 300 + ci * 510;
      const act = row.acts[ci];
      const extra = row.extras[ci];
      const pose = act
        ? {action:act, facing:1, rootX:x, groundY:y, ...extra}
        : {...styleIdle('balanced', .18), rootX:x, groundY:y, facing:1, ...extra};
      drawConcept(ctx, pose, {...Rowan, weapon:row.weapon, shield:row.shield, armour:row.armour, helmet:'helm'});
      if (ri === 0) label(ctx, col, x, 128, 17);
    });
  });
}

export function movesSheet(ctx, w, h) {
  studio(ctx, w, h);
  title(ctx, 'Movement and specials', 48, 34);
  caption(ctx, 'Dash, jump attack, low sweep, high and low guard, and a mechanical disarm (weapon knocked away).', 1180, 78, 15);
  const base = {...Rowan, armour:'leather', helmet:'helm', shield:'buckler', weapon:'sword'};
  const items = [
    {title:'Dash', x:300, y:460, pose:{action:'dash', lean:.34, hipDrop:.18, stanceWidth:1.85, weight:.48, footLead:{offset:.82, lift:12}, footRear:{offset:-.88, lift:0}}},
    {title:'Jump attack', x:900, y:460, pose:{action:'jumpAttack', hop:88, lean:.06, hipDrop:.04, stanceWidth:.7, footLead:{offset:.3, lift:20}, footRear:{offset:-.24, lift:18}}},
    {title:'Low sweep', x:1500, y:460, pose:{action:'sweep', lean:.38, hipDrop:.78, stanceWidth:1.82, weight:.34, footLead:{offset:.82, lift:0}, footRear:{offset:-.55, lift:0}}},
    {title:'Block high', x:2060, y:430, pose:{action:'blockHigh', lean:-.05, hipDrop:.26, stanceWidth:1.22, weight:-.12}}
  ];
  items.forEach(cell => {
    drawConcept(ctx, {...cell.pose, rootX:cell.x, groundY:cell.y, facing:1}, base);
    label(ctx, cell.title, cell.x, cell.y + 28, 18);
  });
  drawConcept(ctx, {action:'blockLow', lean:.07, hipDrop:.44, stanceWidth:1.38, weight:.04, rootX:520, groundY:1120, facing:1}, base);
  label(ctx, 'Block low', 520, 1148, 18);
  drawConcept(ctx, {action:'disarm', lean:.16, hipDrop:.22, stanceWidth:1.28, weight:.24, rootX:1280, groundY:1120, facing:1}, base);
  drawConcept(ctx, {action:'slashHit', lean:-.12, hipDrop:.28, stanceWidth:1.1, weight:-.16, rootX:1860, groundY:1120, facing:-1, hands:{lead:{x:30,y:10}, rear:{x:8,y:-20}}}, {...base, cloth:'#6b3030', weapon:'sword', shield:'none'});
  ctx.save(); ctx.translate(2040, 980); ctx.rotate(1.05);
  ctx.fillStyle = '#c5d0ce'; ctx.strokeStyle = '#2a241e'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(-5, -42); ctx.lineTo(0, -58); ctx.lineTo(5, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  label(ctx, 'Disarm  ·  the hit, and the weapon knocked away', 1570, 1148, 18);
}

export function sideBySide(ctx, w, h, old) {
  studio(ctx, w, h);
  title(ctx, 'Current 2.1   beside   the 2.2 concept', 48, 36);
  caption(ctx, 'Same idea of a ready stance. Left is the shipping 2.1 silhouette. Right is the proposed 7.5-head figure with tapered limbs and forward knees.', 900, 80, 15);
  ctx.save();
  ctx.translate(160, 780 - 453);
  drawBody(ctx, old);
  ctx.restore();
  label(ctx, '2.1  ·  shipping now', 420, 800, 20);
  caption(ctx, 'Shorter, stick-like limbs. Knees tend to fold backward.', 420, 832, 14);
  drawHeadRuler(ctx, 1095, 780);
  drawConcept(ctx, {...styleIdle('balanced', .2), rootX: 1280, groundY: 780, facing:1}, {...Rowan, armour:'leather', helmet:'helm', shield:'buckler', weapon:'sword'});
  label(ctx, '2.2  ·  proposed look', 1280, 800, 20);
  caption(ctx, '7.5 heads tall. Shaped torso, tapered limbs, knees toward the foe.', 1280, 832, 14);
  ctx.strokeStyle = '#7a7264'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(900, 140); ctx.lineTo(900, 860); ctx.stroke();
  ctx.setLineDash([]);
}

export function previewFrame(ctx, w, h, kind, t) {
  studio(ctx, w, h);
  const build = {...Rowan, armour:'leather', helmet:'helm', shield:'buckler', weapon:'sword'};
  if (kind === 'idle') {
    drawConcept(ctx, {...styleIdle('balanced', t), rootX:640, groundY:560, facing:1}, build);
    label(ctx, 'Idle stance', 640, 590, 22);
  } else {
    drawConcept(ctx, {...walkPose(t, 'balanced'), rootX:640, groundY:560, facing:1}, build);
    label(ctx, 'Fighting walk', 640, 590, 22);
  }
  ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#5a5348'; ctx.textAlign = 'center';
  ctx.fillText('Ragdoll Rivals  2.2 concept preview  ·  original art', 640, 40);
}

const SHEETS = {
  'character-turnaround': {w:2200, h:1280, fn:'characterTurnaround'},
  'stance-sheet': {w:2460, h:920, fn:'stanceSheet'},
  'walk-cycle': {w:2460, h:840, fn:'walkSheet'},
  'attack-keyframes': {w:2260, h:1780, fn:'attackSheet'},
  'moves-sheet': {w:2360, h:1520, fn:'movesSheet'},
  'side-by-side': {w:1800, h:980, fn:'sideBySide'}
};

export function sheetSize(name) { return SHEETS[name]; }
