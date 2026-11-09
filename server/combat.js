import {chooseIntent,motionStats,emptySignatures} from './styles.js';
import {spawnRagdoll,stepRagdollWorld,sampleRagdoll,destroyRagdoll,impulseRagdoll} from './ragdoll.js';
import {evaluateFighter,createPart,MIN_SEPARATION} from '../shared/animation.js';
import {deriveStats,GEAR,CLINCH_DISTANCE} from '../shared/rules.js';
const DT=1/30;
function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

function makeParts(build,index,x){
 const facing=index===0?1:-1,d=deriveStats(build),parts={},reach=d.reach;
 const bladeWidth=build.weapon==='claymore'?14:build.weapon==='rapier'?6:build.weapon==='dagger'?8:10;
 parts.torso=createPart(`${index}:torso`,x,330,0,34,68);
 parts.pelvis=createPart(`${index}:pelvis`,x,367,0,30,20);
 parts.head=createPart(`${index}:head`,x,276,0,38,38);
 for(const side of ['L','R']){
  const s=side==='L'?-1:1;
  parts['upperArm'+side]=createPart(`${index}:upperArm${side}`,x+s*23,330,0,13,43);
  parts['lowerArm'+side]=createPart(`${index}:lowerArm${side}`,x+s*24,372,0,11,40);
  parts['hand'+side]=createPart(`${index}:hand${side}`,x+s*24,392,0,12,12);
  parts['thigh'+side]=createPart(`${index}:thigh${side}`,x+s*11,390,0,16,48);
  parts['shin'+side]=createPart(`${index}:shin${side}`,x+s*11,432,0,13,43);
  parts['foot'+side]=createPart(`${index}:foot${side}`,x+s*11,453,0,26,10);
 }
 parts.weapon=createPart(`${index}:weapon`,x+facing*42,356,0,bladeWidth,reach);
 if(GEAR.weapons[build.weapon].dual)parts.offWeapon=createPart(`${index}:offWeapon`,x-35,350,0,8,reach);
 if(build.weapon==='flail'){parts.chain0=createPart(`${index}:chain0`,x+42,310,0,6,6);parts.chain1=createPart(`${index}:chain1`,x+42,298,0,6,6);parts.flailHead=createPart(`${index}:flailHead`,x+42,280,0,22,22);}
 return {parts,derived:d,facing,reach};
}

function makeGrips(f){
 const w=GEAR.weapons[f.build.weapon],reach=f.derived.reach,grips=[],locals=[];
 grips.push({bodyA:f.parts.handR,bodyB:f.parts.weapon,pointB:{x:0,y:reach*(f.build.weapon==='claymore'?.36:.38)}});
 locals.push({x:0,y:reach*(f.build.weapon==='claymore'?.36:.38)});
 if(w.twoHanded){grips.push({bodyA:f.parts.handL,bodyB:f.parts.weapon,pointB:{x:0,y:reach*(f.build.weapon==='claymore'?.18:.20)}});locals.push({x:0,y:reach*(f.build.weapon==='claymore'?.18:.20)});}
 if(w.dual){grips.push({bodyA:f.parts.handL,bodyB:f.parts.offWeapon,pointB:{x:0,y:reach*.38}});locals.push({x:0,y:reach*.38});}
 f.grips=grips;f.gripLocals=locals;
}

function makeFighter(build,index,x){
 const {parts,derived,facing}=makeParts(build,index,x);
 const joints=[{},{},{},{},{},{},{},{},{}];
 const f={build,derived,facing,index,rootX:x,parts,joints,limbs:Object.values(parts),
  health:derived.maxHealth,stamina:derived.maxStamina,cooldown:.3,attack:0,attackId:0,hitAttack:-1,hitBeat:0,attackDuration:.38,
  guard:false,think:0,previousX:x,movement:0,action:'',shove:0,shoveCooldown:0,recoil:0,needDisengage:false,exhausted:false,
  stagger:0,recovery:1,flash:0,mode:'animated',ragdoll:null,getUpBlend:null,anim:{states:{}},
  gait:{phase:0,planted:false,stance:{L:false,R:false}},
  pose:{state:'guard',progress:0,motorStrength:1},
  metrics:{decisions:0,approach:0,retreat:0,guard:0,attack:0,hits:0,blocks:0,damage:0,knockdowns:0,dodges:0,feints:0,travel:0,spacing:0,samples:0,clinchFrames:0,disengages:0,reentries:0,shoves:0,signatures:emptySignatures()}};
 makeGrips(f);evaluateFighter(f,0);return f;
}

export function applyImpact(f,damage,direction){
 if(damage<18){f.recoil=Math.max(f.recoil||0,.22);return;}
 const b=f.build.stats.balance;
 f.stagger=Math.max(f.stagger||0,(1.45-b*.065)*Math.min(1.5,Math.max(.7,damage/35))*(1+f.derived.weight*.002));
 f.recovery=0;f.pose={...(f.pose||{}),state:'stagger',motorStrength:0};
 if(f.match)spawnRagdoll(f.match,f,direction,damage);
 else f.mode='ragdoll';
}

function alignPartsToRoot(f){const dx=f.rootX-f.parts.torso.position.x;if(Math.abs(dx)<1e-6)return;for(const p of Object.values(f.parts)){p.x+=dx;p.position.x+=dx;if(p.bounds){p.bounds.min.x+=dx;p.bounds.max.x+=dx;}}}
function startGetUp(m,f){
 if(f.health<=0)return;
 const from=destroyRagdoll(m,f);
 f.rootX=Math.max(48,Math.min(752,f.rootX));
 f.getUpBlend={from,t:0,duration:.36};
 f.mode='blend';f.recovery=0;
}

function segmentHits(p0,p1,c,r){const dx=p1.x-p0.x,dy=p1.y-p0.y,l2=dx*dx+dy*dy;const t=l2<1e-8?0:Math.max(0,Math.min(1,((c.x-p0.x)*dx+(c.y-p0.y)*dy)/l2));return Math.hypot(p0.x+dx*t-c.x,p0.y+dy*t-c.y)<=r;}
function bladePoints(a){
 const w=a.parts.weapon,reach=a.derived.reach,tip={x:w.position.x+Math.sin(w.angle)*reach*.5,y:w.position.y-Math.cos(w.angle)*reach*.5};
 const butt={x:w.position.x-Math.sin(w.angle)*reach*.5,y:w.position.y+Math.cos(w.angle)*reach*.5};
 const segs=[[butt,tip]];if(a.prevTip)segs.push([a.prevTip,tip]);
 const extra=a.parts.offWeapon;if(extra){const et={x:extra.position.x+Math.sin(extra.angle)*reach*.5,y:extra.position.y-Math.cos(extra.angle)*reach*.5};segs.push([{x:extra.position.x,y:extra.position.y},et]);}
 const head=a.parts.flailHead;if(head)segs.push([{x:head.position.x,y:head.position.y},{x:head.position.x,y:head.position.y}]);
 a.prevTip=tip;return segs;
}

function hit(m,a,b,ai){
 if(a.attack<=0||a.pose?.state!=='strike')return;
 const progress=1-a.attack/(a.attackDuration||.38),beat=a.attackChoice==='combo'?(progress<.58?1:2):1;
 if(a.hitAttack===a.attackId&&(a.hitBeat||0)>=beat)return;
 const segs=bladePoints(a);
 for(const part of ['head','torso']){
  const p=b.parts[part],radius=(part==='head'?27:34)+22;
  const c={x:p.position.x,y:p.position.y};
  if(!segs.some(([p0,p1])=>segmentHits(p0,p1,c,radius)))continue;
  a.hitAttack=a.attackId;a.hitBeat=beat;const d=a.derived,bd=b.derived;
  let mitigation=bd.armour*(1-(GEAR.weapons[a.build.weapon].armourBypass||0));if(part==='head')mitigation=1-(1-mitigation)*(1-bd.helmet);
  let blocked=false;if(b.guard&&b.mode==='animated'&&m.rng()<Math.min(.85,(bd.block+.20)*(GEAR.weapons[a.build.weapon].blockFactor||1))){blocked=true;mitigation=1-(1-mitigation)*.35;}
  const amount=Math.max(2,d.damage*1.15*(.85+m.rng()*.3)*(1-mitigation)*(a.attackChoice==='combo'&&beat===2?.72:1));
  b.health=Math.max(0,b.health-amount);b.flash=.15;
  a.metrics.hits++;a.metrics.damage+=amount;if(blocked){b.metrics.blocks++;b.riposteUntil=m.time+.65;}
  const wasDown=b.stagger>0;const direction=ai===0?1:-1;
  applyImpact(b,amount,direction);
  if(b.health<=0&&b.mode!=='ragdoll')spawnRagdoll(m,b,direction,amount);
  a.recoil=blocked?.14:.10;b.recoil=blocked?.18:.22;a.needDisengage=true;b.needDisengage=true;
  if(!wasDown&&b.stagger>0)b.metrics.knockdowns++;if(amount>=22&&!blocked){m.hitStop=2;m.slowTicks=8;}
  const debris=amount>=25&&!blocked?(part==='head'&&b.build.helmet!=='none'?'helmet':m.tick%3===0?'weapon':null):null;
  m.events.push({type:'hit',tick:m.tick,a:ai,part,amount:Math.round(amount),blocked,debris,x:p.position.x,y:p.position.y});return;
 }
}

const SPACING_GAP=92,COMBAT_GAP=84;
function separate(a,b){
 if(a.mode==='ragdoll'||b.mode==='ragdoll')return;
 const dx=b.rootX-a.rootX,gap=Math.abs(dx),sign=dx>=0?1:-1,mid=(a.rootX+b.rootX)/2;
 if(gap<MIN_SEPARATION){a.rootX=mid-sign*MIN_SEPARATION/2;b.rootX=mid+sign*MIN_SEPARATION/2;}
 else if(gap<COMBAT_GAP){const push=Math.min(20,COMBAT_GAP-gap);a.rootX-=sign*push/2;b.rootX+=sign*push/2;}
 else if(gap<SPACING_GAP){const push=Math.min(10,(SPACING_GAP-gap)*.55);a.rootX-=sign*push/2;b.rootX+=sign*push/2;}
 if(!a.freeX)a.rootX=Math.max(48,Math.min(752,a.rootX));
 if(!b.freeX)b.rootX=Math.max(48,Math.min(752,b.rootX));
}

function snapshot(m){return {type:'snapshot',tick:m.tick,time:m.time,motionRate:m.motionRate??1,status:m.status,winner:m.winner,fighters:m.fighters.map(f=>({name:f.build.name,health:f.health,maxHealth:f.derived.maxHealth,stamina:f.stamina,maxStamina:f.derived.maxStamina,build:f.build,attack:f.attack,guard:f.guard,flash:f.flash,pose:f.pose?.state||'guard',poseProgress:f.pose?.progress||0,motorStrength:f.pose?.motorStrength??1,clip:f.pose?.state||'guard',animT:f.pose?.progress||0,blend:f.getUpBlend?Math.min(1,f.getUpBlend.t/f.getUpBlend.duration):1,rootX:f.rootX,facing:f.facing,mode:f.mode,parts:Object.fromEntries(Object.entries(f.parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]))})),events:m.events.splice(0)};}

export function isolateOpponent(m,dx=2500){const o=m.fighters[1];o.rootX+=dx;o.freeX=true;evaluateFighter(o,0);}

export function createMatch(a,b,{seed=Date.now(),mode='computer'}={}){
 const m={engine:null,fighters:[makeFighter(a,0,245),makeFighter(b,1,555)],time:0,tick:0,status:'fighting',winner:null,events:[{type:'start'}],rng:random(seed),mode,seed};
 for(const f of m.fighters)f.match=m;
 return m;
}

export function stepMatch(m){
 if(m.status!=='fighting')return snapshot(m);
 m.tick++;m.time+=DT;
 if(m.hitStop>0){m.hitStop--;m.motionRate=0;return snapshot(m);}
 const dt=m.slowTicks>0?DT*.65:DT;m.motionRate=dt/DT;if(m.slowTicks>0)m.slowTicks--;
 m.fighters.forEach((f,i)=>{
  const o=m.fighters[1-i];
  f.cooldown=Math.max(0,f.cooldown-dt);f.attack=Math.max(0,f.attack-dt);f.flash=Math.max(0,f.flash-dt);
  f.shove=Math.max(0,(f.shove||0)-dt);f.shoveCooldown=Math.max(0,(f.shoveCooldown||0)-dt);f.recoil=Math.max(0,(f.recoil||0)-dt);
  if(f.health>0){f.stagger=Math.max(0,f.stagger-dt);if(f.stagger===0)f.recovery=Math.min(1,f.recovery+dt*(.8+f.build.stats.balance*.18));}
  if(f.stagger===0&&f.ragdoll&&f.health>0)startGetUp(m,f);
  f.think-=dt;if(f.think<=0){f.think=.15;if(f.mode!=='ragdoll'&&!f.getUpBlend)chooseIntent(m,f,o,i);}
  if(f.attack<=0)f.stamina=Math.min(f.derived.maxStamina,f.stamina+f.derived.regen*dt);
  if(f.mode!=='ragdoll'&&!f.getUpBlend){
   const movement=f.movement||0;
   f.rootX+=movement*f.derived.moveSpeed*dt*(f.exhausted?.55:1)*(f.recovery||1);
   if(!f.freeX)f.rootX=Math.max(48,Math.min(752,f.rootX));
  }
  if(f.shove>0&&f.shove<=.18&&!f.shoveLanded&&f.stagger===0){
   f.shoveLanded=true;const dir=i===0?1:-1,kind=f.shoveType||'shove';
   const pixels=kind==='barge'?28:kind==='kick'?22:kind==='bash'?18:16;
   if(o.mode==='ragdoll')impulseRagdoll(o,dir,kind==='barge'?.048:kind==='kick'?.04:kind==='bash'?.036:.032);
   else o.rootX+=dir*pixels;
   f.rootX-=dir*pixels*.22;f.needDisengage=true;m.events.push({type:'shove',tick:m.tick,a:i,kind});
  }
  if(f.shove===0)f.shoveLanded=false;
 });
 separate(...m.fighters);
 if(m.fighters.some(f=>f.ragdoll))stepRagdollWorld(m,dt);
 for(const f of m.fighters){
  if(f.ragdoll){sampleRagdoll(f);f.pose={...(f.pose||{}),state:'stagger',motorStrength:0};}
  else{evaluateFighter(f,dt);if(f.mode!=='ragdoll')alignPartsToRoot(f);}
  const o=m.fighters[1-f.index];
  const gap=Math.abs(f.parts.torso.position.x-o.parts.torso.position.x);
  f.metrics.spacing+=gap;f.metrics.samples++;if(gap<CLINCH_DISTANCE&&f.mode!=='ragdoll'&&o.mode!=='ragdoll'&&f.mode!=='blend'&&o.mode!=='blend')f.metrics.clinchFrames++;
  f.metrics.travel+=Math.abs(f.parts.torso.position.x-f.previousX);f.previousX=f.parts.torso.position.x;
 }
 hit(m,m.fighters[0],m.fighters[1],0);hit(m,m.fighters[1],m.fighters[0],1);
 if(m.fighters.some(f=>f.health<=0)||m.time>=75){m.status='finished';const [a,b]=m.fighters;if(a.health===b.health)m.winner=-1;else m.winner=a.health>b.health?0:1;m.events.push({type:'finished',winner:m.winner});}
 return snapshot(m);
}
