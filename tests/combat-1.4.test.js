import test from 'node:test';import assert from 'node:assert/strict';
import {createMatch,stepMatch} from '../server/combat.js';
import {DEFAULT_BUILD,GEAR,STYLES,CLINCH_DISTANCE} from '../shared/rules.js';
import {styleEvaluation} from './evaluate-variety.js';
import {SIGNATURES} from '../server/styles.js';

test('clinch time stays low for every style after spacing and breaks',()=>{
 const rows=styleEvaluation(5);
 const caps={aggressive:.16,defensive:.12,counterattacker:.12,evasive:.14,balanced:.14,berserker:.22,patient:.12};
 for(const style of STYLES)assert.ok(rows[style].clinchFraction<caps[style],`${style} clinch ${rows[style].clinchFraction}`);
});

test('each style uses its signature moves at a measurable rate',()=>{
 const rows=styleEvaluation(5);
 for(const style of STYLES){
  const rate=SIGNATURES[style].reduce((sum,name)=>sum+(rows[style].signaturesPerMinute[name]||0),0);
  assert.ok(rate>3,`${style} signature rate ${rate} from ${JSON.stringify(rows[style].signaturesPerMinute)}`);
 }
});

test('disengage and re-entry cycles happen several times a minute',()=>{
 const rows=styleEvaluation(5);
 for(const style of STYLES){
  assert.ok(rows[style].disengagesPerMinute>3,`${style} disengages ${rows[style].disengagesPerMinute}`);
  assert.ok(rows[style].cyclesPerMinute>2,`${style} cycles ${rows[style].cyclesPerMinute}`);
 }
});

test('weapon physics reach matches the intended art scale versus a fighter',()=>{
 const m=createMatch(DEFAULT_BUILD,DEFAULT_BUILD,{seed:1}),f=m.fighters[0];
 const fighterHeight=(f.parts.footR.position.y+5)-(f.parts.head.position.y-19);
 assert.ok(fighterHeight>190&&fighterHeight<215,`fighter height ${fighterHeight}`);
 assert.ok(GEAR.weapons.claymore.reach>=fighterHeight*.85,`claymore ${GEAR.weapons.claymore.reach} vs height ${fighterHeight}`);
 assert.ok(GEAR.weapons.claymore.reach<=fighterHeight*1.05);
 assert.ok(GEAR.weapons.spear.reach>GEAR.weapons.claymore.reach);
 assert.ok(GEAR.weapons.halberd.reach>GEAR.weapons.warhammer.reach);
 assert.ok(GEAR.weapons.warhammer.reach>GEAR.weapons.sword.reach);
 assert.ok(GEAR.weapons.dagger.reach<GEAR.weapons.sword.reach);
 assert.ok(GEAR.weapons.sword.reach<GEAR.weapons.rapier.reach);
 assert.ok(GEAR.weapons.rapier.reach<GEAR.weapons.claymore.reach);
 for(const weapon of Object.keys(GEAR.weapons)){
  const shield=GEAR.weapons[weapon].twoHanded||GEAR.weapons[weapon].dual?'none':'buckler';
  const duel=createMatch({...structuredClone(DEFAULT_BUILD),weapon,shield},DEFAULT_BUILD,{seed:1});
  const w=duel.fighters[0].parts.weapon,len=w.bounds.max.y-w.bounds.min.y;
  assert.ok(Math.abs(len-GEAR.weapons[weapon].reach)<2.5,`${weapon} body ${len} vs reach ${GEAR.weapons[weapon].reach}`);
 }
});

test('a forced clinch produces a shove that separates the torsos',()=>{
 const m=createMatch({...structuredClone(DEFAULT_BUILD),style:'defensive'},{...structuredClone(DEFAULT_BUILD),style:'berserker'},{seed:4});
 const [a,b]=m.fighters;
 b.rootX=a.rootX+56;b.parts.torso.position.x=b.rootX;b.parts.torso.x=b.rootX;
 const before=Math.abs(b.parts.torso.position.x-a.parts.torso.position.x);
 let shoved=false;
 for(let i=0;i<90;i++){const snap=stepMatch(m);if(snap.events.some(e=>e.type==='shove'))shoved=true;}
 const after=Math.abs(b.parts.torso.position.x-a.parts.torso.position.x);
 assert.ok(shoved,'expected a shove event');
 assert.ok(after>before-2,`separation ${before} -> ${after}`);
 assert.equal(CLINCH_DISTANCE,78);
});
