import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,isolateOpponent,applyImpact} from '../server/combat.js';
import {DEFAULT_BUILD,STYLES,GEAR} from '../shared/rules.js';
import {attackHeightOf,STYLE_STANCE} from '../shared/animation.js';
import {emptySignatures} from '../server/styles.js';
import {styleEvaluation} from './evaluate-variety.js';

const clone=(extra={})=>({...structuredClone(DEFAULT_BUILD),...extra});

function freezeAI(...fighters){for(const f of fighters){f.think=1e9;f.cooldown=1e9;}}
function place(m,gap=120){const [a,b]=m.fighters;a.rootX=400-gap/2;b.rootX=400+gap/2;a.facing=1;b.facing=-1;}
function forceStrike(f,choice,duration=.7,progress=.5){
  f.attackChoice=choice;f.attackHeight=attackHeightOf(choice);f.attackTier='special';
  f.attackDuration=duration;f.attack=duration*(1-progress);f.attackId=(f.attackId||0)+1;
  f.hitAttack=-1;f.hitBeat=0;f.mode='animated';f.stagger=0;f.recovery=1;f.dash=0;
}

test('every style has its own fighting stance profile',()=>{
  assert.equal(Object.keys(STYLE_STANCE).length,7);
  const keys=STYLES.map(s=>[STYLE_STANCE[s].lean,STYLE_STANCE[s].bounce,STYLE_STANCE[s].knees,STYLE_STANCE[s].guardY,STYLE_STANCE[s].width].join(','));
  assert.equal(new Set(keys).size,7);
});

test('planted feet do not slide while walking',()=>{
  const m=createMatch(clone({style:'balanced'}),clone({name:'Bors'}),{seed:8});
  isolateOpponent(m);
  const f=m.fighters[0];f.think=1e9;f.cooldown=1e9;f.guard=false;f.movement=1;
  let maxDrift=0,samples=0,last={L:null,R:null};
  for(let i=0;i<120;i++){
    stepMatch(m);
    for(const side of ['L','R']){
      if(f.gait?.stance?.[side]&&(f.airborne||0)<=0&&!(f.dash>0)){
        const x=f.parts['foot'+side].position.x;
        if(last[side]!=null){maxDrift=Math.max(maxDrift,Math.abs(x-last[side]));samples++;}
        last[side]=x;
      }else last[side]=null;
    }
  }
  assert.ok(samples>20,`expected planted samples, got ${samples}`);
  assert.ok(maxDrift<2.5,`planted-foot drift ${maxDrift}`);
});

test('sweep hits only when not blocked low or jumped',()=>{
  const run=(setup)=>{
    const m=createMatch(clone({style:'defensive',weapon:'sword'}),clone({style:'balanced',name:'Bors'}),{seed:21});
    const [a,b]=m.fighters;place(m,110);freezeAI(a,b);setup(a,b,m);
    forceStrike(a,'sweep');
    let hit=null;
    for(let i=0;i<12;i++){const snap=stepMatch(m);const e=snap.events.find(ev=>ev.type==='hit'&&ev.a===0);if(e){hit=e;break;}}
    return {hit,health:b.health,stagger:b.stagger,mode:b.mode,max:b.derived.maxHealth};
  };
  const blocked=run((a,b)=>{b.guard=true;b.guardLevel='low';b.mode='animated';b.airborne=0;mRng(b);});
  function mRng(b){b.match.rng=()=>0;}
  const open=run((a,b)=>{b.guard=false;b.guardLevel='high';b.airborne=0;});
  const highGuard=run((a,b)=>{b.guard=true;b.guardLevel='high';b.mode='animated';b.airborne=0;b.match.rng=()=>0;});
  const jumped=run((a,b)=>{b.guard=false;b.airborne=.35;b.jumpDuration=.42;});
  assert.ok(blocked.hit,'low guard should still register a contact');
  assert.equal(blocked.hit.blocked,true);
  assert.equal(blocked.stagger,0);
  assert.ok(open.hit&&!open.hit.blocked,'unblocked sweep should land');
  assert.ok(open.stagger>0||open.mode==='ragdoll','unblocked sweep knocks down');
  assert.ok(highGuard.hit&&!highGuard.hit.blocked,'high guard does not stop a sweep');
  assert.equal(jumped.hit,null,'airborne target is jumped over');
  assert.equal(jumped.health,jumped.max);
});

test('disarm is mechanical: drop, backup dagger, pickup restores the original weapon',()=>{
  const m=createMatch(clone({weapon:'sword'}),clone({weapon:'axe',name:'Bors'}),{seed:9});
  const [a,b]=m.fighters;place(m,110);freezeAI(a,b);b.guard=false;b.health=b.derived.maxHealth*.25;
  forceStrike(a,'disarm');
  let disarmed=false;
  for(let i=0;i<20;i++){
    const snap=stepMatch(m);
    if(snap.events.some(e=>e.type==='disarm')||b.disarmed){disarmed=true;break;}
  }
  assert.ok(disarmed,'expected a disarm');
  assert.equal(b.held,'dagger');
  assert.equal(b.build.weapon,'axe');
  assert.ok((m.loot||[]).some(item=>item.weapon==='axe'));
  assert.ok(Object.keys(GEAR.weapons).includes('axe'));
  assert.equal(Object.keys(GEAR.weapons).includes('unarmed'),false);
  const item=m.loot.find(x=>x.weapon==='axe');
  b.rootX=item.x;b.attack=0;b.airborne=0;b.mode='animated';
  let picked=false;
  for(let i=0;i<30;i++){const snap=stepMatch(m);if(snap.events.some(e=>e.type==='pickup')||!b.disarmed){picked=true;break;}}
  assert.ok(picked,'expected pickup');
  assert.equal(b.disarmed,false);
  assert.equal(b.held,'axe');
  assert.equal(b.derived.reach,GEAR.weapons.axe.reach);
});

test('styles mix the new moves differently',()=>{
  const rows=styleEvaluation(5);
  const rate=(style,name)=>rows[style].signaturesPerMinute[name]||0;
  const mix=style=>['sweep','dash','hop','slam','disarm','jumpAttack'].map(k=>rate(style,k));
  const dist=(a,b)=>a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0);
  let diffs=0;
  for(let i=0;i<STYLES.length;i++)for(let j=i+1;j<STYLES.length;j++){
    if(dist(mix(STYLES[i]),mix(STYLES[j]))>.35)diffs++;
  }
  assert.ok(diffs>=10,`expected style move-mix differences, got ${diffs} ${JSON.stringify(Object.fromEntries(STYLES.map(s=>[s,mix(s)])))}`);
  assert.ok(rate('evasive','hop')+rate('evasive','dash')>rate('defensive','hop')+rate('defensive','dash')*.5,'evasive should dash and hop more');
  assert.ok(rate('defensive','sweep')>=rate('berserker','sweep'),'defensive should sweep at least as often as berserker');
});

test('empty signature table includes the new moves without dropping old names',()=>{
  const s=emptySignatures();
  for(const name of ['lunge','combo','sweep','dash','hop','slam','disarm','jumpAttack'])assert.equal(s[name],0);
});

test('fighters still never overlap outside ragdoll after the new locomotion',()=>{
  const m=createMatch(clone({style:'berserker'}),clone({style:'evasive',name:'Bors'}),{seed:17});
  for(let i=0;i<700&&m.status==='fighting';i++){
    stepMatch(m);
    const [a,b]=m.fighters;
    if(a.mode==='ragdoll'||b.mode==='ragdoll')continue;
    const gap=Math.abs(a.parts.torso.position.x-b.parts.torso.position.x);
    assert.ok(gap+1e-6>=58,`overlap gap ${gap} at tick ${m.tick}`);
  }
});

test('ragdoll still only starts on knockdown or KO',()=>{
  const m=createMatch(clone({style:'aggressive'}),clone({style:'patient',name:'Bors'}),{seed:12});
  isolateOpponent(m);
  applyImpact(m.fighters[0],10,1);
  assert.notEqual(m.fighters[0].mode,'ragdoll');
  applyImpact(m.fighters[0],35,1);
  assert.equal(m.fighters[0].mode,'ragdoll');
});
