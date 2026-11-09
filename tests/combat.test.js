import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, stepMatch } from '../server/combat.js';
import { DEFAULT_BUILD } from '../shared/rules.js';

const build=(changes={})=>structuredClone({...DEFAULT_BUILD,...changes});
const run=(a,b,seed=42,limit=2500)=>{const m=createMatch(a,b,{seed});m.allEvents=[];for(let i=0;i<limit&&m.status==='fighting';i++){m.allEvents.push(...stepMatch(m).events);}return m;};

test('match has a complete animated skeleton on both fighters',()=>{
 const m=createMatch(build(),build({name:'Enemy'}),{seed:1});
 assert.equal(m.fighters.length,2);assert.equal(m.fighters[0].limbs.length,16);
 for(const name of ['torso','pelvis','head','upperArmR','lowerArmR','handR','weapon','footR'])assert.ok(m.fighters[0].parts[name]);
});
test('headless computer fight finishes with a non-draw winner',()=>{
 const m=run(build({style:'aggressive'}),build({name:'Bors',style:'defensive'}),8);
 assert.equal(m.status,'finished');assert.ok([0,1].includes(m.winner));assert.ok(m.allEvents.some(e=>e.type==='hit'));
});
test('each style drives approach, guard or attack decisions',()=>{
 for(const style of ['aggressive','defensive','counterattacker','evasive','balanced','berserker','patient']){
  const m=createMatch(build({style}),build({style:'balanced'}),{seed:2});for(let i=0;i<150;i++)stepMatch(m);
  assert.ok(m.fighters[0].metrics.approach+m.fighters[0].metrics.retreat>0,style);
 }
});
test('evasive retreats measurably more than aggressive over seeds',()=>{
 let aggressive=0,evasive=0;
 for(let seed=1;seed<=4;seed++){
  const a=createMatch(build({style:'aggressive'}),build(),{seed});const e=createMatch(build({style:'evasive'}),build(),{seed});
  for(let i=0;i<180;i++){stepMatch(a);stepMatch(e);} aggressive+=a.fighters[0].metrics.retreat;evasive+=e.fighters[0].metrics.retreat;
 }
 assert.ok(evasive>aggressive*2,`${evasive} vs ${aggressive}`);
});
test('zero health and timeout settle match without extra damage',()=>{
 const m=createMatch(build(),build(),{seed:1});m.fighters[1].health=0;stepMatch(m);assert.equal(m.winner,0);assert.equal(m.status,'finished');
 const t=createMatch(build(),build(),{seed:1});t.time=75;stepMatch(t);assert.equal(t.status,'finished');assert.equal(t.winner,-1);
});
test('same seed produces identical snapshots',()=>{
 const a=createMatch(build(),build(),{seed:7}),b=createMatch(build(),build(),{seed:7});for(let i=0;i<40;i++){stepMatch(a);stepMatch(b);}assert.deepEqual(a.fighters.map(f=>[f.health,f.stamina]),b.fighters.map(f=>[f.health,f.stamina]));
});
