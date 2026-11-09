import test from 'node:test';import assert from 'node:assert/strict';
import {createMatch,stepMatch,isolateOpponent,applyImpact} from '../server/combat.js';
import {DEFAULT_BUILD} from '../shared/rules.js';
import {MIN_SEPARATION as GAP} from '../shared/animation.js';

test('fighters never overlap outside ragdoll',()=>{
 for(const seed of [1,4,7,19,33]){
  const m=createMatch({...structuredClone(DEFAULT_BUILD),style:'berserker'},{...structuredClone(DEFAULT_BUILD),style:'aggressive'},{seed});
  for(let i=0;i<900&&m.status==='fighting';i++){
   stepMatch(m);
   const [a,b]=m.fighters;
   if(a.mode==='ragdoll'||b.mode==='ragdoll')continue;
   const gap=Math.abs(a.parts.torso.position.x-b.parts.torso.position.x);
   assert.ok(gap+1e-6>=GAP,`seed ${seed} tick ${m.tick} gap ${gap}`);
  }
 }
});

test('ragdoll is entered only on knockdown or KO',()=>{
 const m=createMatch({...structuredClone(DEFAULT_BUILD),style:'aggressive'},{...structuredClone(DEFAULT_BUILD),style:'defensive'},{seed:12});
 const entered={0:0,1:0};
 for(let i=0;i<1200&&m.status==='fighting';i++){
  const before=m.fighters.map(f=>f.mode);
  const health=m.fighters.map(f=>f.health);
  stepMatch(m);
  m.fighters.forEach((f,idx)=>{
   if(before[idx]!=='ragdoll'&&f.mode==='ragdoll'){
    entered[idx]++;
    assert.ok(f.stagger>0||f.health<=0||health[idx]<=0,`fighter ${idx} ragdolled without knockdown or KO`);
   }
  });
 }
 const walk=createMatch(DEFAULT_BUILD,DEFAULT_BUILD,{seed:3});
 isolateOpponent(walk);
 for(let i=0;i<180;i++)stepMatch(walk);
 assert.equal(walk.fighters[0].mode,'animated');
 applyImpact(walk.fighters[0],10,1);
 assert.notEqual(walk.fighters[0].mode,'ragdoll');
 applyImpact(walk.fighters[0],35,1);
 assert.equal(walk.fighters[0].mode,'ragdoll');
});

test('the same seed replays an identical compact fight',()=>{
 const trail=seed=>{
  const m=createMatch({...structuredClone(DEFAULT_BUILD),style:'aggressive',weapon:'axe'},{...structuredClone(DEFAULT_BUILD),style:'patient',weapon:'spear',shield:'none'},{seed});
  const frames=[];
  for(let i=0;i<240;i++){stepMatch(m);frames.push(m.fighters.map(f=>[f.health,f.stamina,f.rootX,f.pose.state,f.mode,+f.parts.handR.position.x.toFixed(3),+f.parts.weapon.angle.toFixed(4)]));}
  return frames;
 };
 assert.deepEqual(trail(11),trail(11));
 const a=trail(11),b=trail(12);
 assert.notDeepEqual(a,b);
});

test('capsule separation constant is exported for tests',()=>{assert.equal(GAP,58);assert.ok(GAP<78);});
