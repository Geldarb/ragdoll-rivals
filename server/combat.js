import Matter from 'matter-js';
import {chooseIntent,motionStats} from './styles.js';
import {limitJoints,separateFighters} from './joint-limits.js';
import {drivePose,poseProfile} from './poses.js';
import {locomotion,applyImpact} from './locomotion.js';
import { deriveStats, GEAR, STYLE_DATA } from '../shared/rules.js';
const {Engine,Bodies,Body,Composite,Constraint}=Matter;
const DT=1/30;
function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function fighter(engine,build,index,x){
 const facing=index===0?1:-1;const d=deriveStats(build),group=Body.nextGroup(true),parts={},joints=[];
 const opt={collisionFilter:{group},friction:.7,frictionAir:.035,restitution:.08,density:.002};
 parts.torso=Bodies.rectangle(x,330,34,68,{...opt,chamfer:{radius:12},label:`${index}:torso`});
 parts.pelvis=Bodies.rectangle(x,367,30,20,{...opt,label:`${index}:pelvis`});
 parts.head=Bodies.circle(x,276,19,{...opt,label:`${index}:head`});
 const limb=(name,px,py,w,h)=>parts[name]=Bodies.rectangle(px,py,w,h,{...opt,chamfer:{radius:5},label:`${index}:${name}`});
 for(const side of [-1,1]){const s=side<0?'L':'R';limb('upperArm'+s,x+side*23,330,13,43);limb('lowerArm'+s,x+side*24,372,11,40);limb('thigh'+s,x+side*11,390,16,48);limb('shin'+s,x+side*11,432,13,43);}
 const joint=(a,b,pa,pb,stiffness=.72)=>joints.push(Constraint.create({bodyA:a,bodyB:b,pointA:pa,pointB:pb,length:2,stiffness,damping:.12}));
 joint(parts.torso,parts.pelvis,{x:0,y:33},{x:0,y:-10},.95);
 joint(parts.torso,parts.head,{x:0,y:-34},{x:0,y:17},.85);
 for(const side of [-1,1]){const s=side<0?'L':'R';joint(parts.torso,parts['upperArm'+s],{x:facing*(s==='R'?12:-12),y:-24},{x:0,y:-19});joint(parts['upperArm'+s],parts['lowerArm'+s],{x:0,y:19},{x:0,y:-18},.65);joint(parts.pelvis,parts['thigh'+s],{x:side*10,y:5},{x:0,y:-22},.98);joint(parts['thigh'+s],parts['shin'+s],{x:0,y:22},{x:0,y:-19},.98);parts['hand'+s]=Bodies.circle(x+side*24,392,6,{...opt,label:`${index}:hand${s}`});joint(parts['lowerArm'+s],parts['hand'+s],{x:0,y:18},{x:0,y:0},.98);limb('foot'+s,x+side*11,453,26,10);joint(parts['shin'+s],parts['foot'+s],{x:0,y:21},{x:0,y:-3},.98);}
 const reach=d.reach;
 parts.weapon=Bodies.rectangle(x+(index? -1:1)*42,356,10,reach,{...opt,density:.0015,label:`${index}:weapon`});
 const grips=[];joint(parts.handR,parts.weapon,{x:0,y:0},{x:0,y:reach*.38},.98);grips.push(joints.at(-1));if(GEAR.weapons[build.weapon].twoHanded){joint(parts.handL,parts.weapon,{x:0,y:0},{x:0,y:reach*.20},.98);grips.push(joints.at(-1));}
 if(GEAR.weapons[build.weapon].dual){parts.offWeapon=Bodies.rectangle(x-35,350,8,reach,{...opt,density:.0015,label:`${index}:offWeapon`});joint(parts.handL,parts.offWeapon,{x:0,y:0},{x:0,y:reach*.38},.98);grips.push(joints.at(-1));}
 if(build.weapon==='flail'){for(let i=0;i<2;i++)parts['chain'+i]=Bodies.circle(x+42,310-i*12,3,{...opt,density:.002,label:`${index}:chain${i}`});parts.flailHead=Bodies.circle(x+42,280,11,{...opt,density:.005,label:`${index}:flailHead`});joint(parts.weapon,parts.chain0,{x:0,y:-reach*.45},{x:0,y:0},.7);joint(parts.chain0,parts.chain1,{x:0,y:0},{x:0,y:0},.7);joints.at(-1).length=12;joint(parts.chain1,parts.flailHead,{x:0,y:0},{x:0,y:0},.7);joints.at(-1).length=16;}
 const plants={};for(const side of ['L','R']){plants[side]=Constraint.create({bodyB:parts['foot'+side],pointA:{x:parts['foot'+side].position.x,y:453},length:0,stiffness:0,damping:.2});}
 Composite.add(engine.world,[...Object.values(parts),...joints,...Object.values(plants)]);
 return {build,derived:d,parts,plants,grips,attackDuration:.38,stagger:0,recovery:1,gait:{phase:0,planted:false,stance:{L:false,R:false}},limbs:Object.values(parts),joints,health:d.maxHealth,stamina:d.maxStamina,cooldown:.3,attack:0,attackId:0,hitAttack:-1,guard:false,think:0,previousX:x,movement:0,action:'',exhausted:false,metrics:{decisions:0,approach:0,retreat:0,guard:0,attack:0,hits:0,blocks:0,damage:0,knockdowns:0,dodges:0,feints:0,travel:0,spacing:0,samples:0},flash:0};
}
function hit(m,a,b,ai){
 if(a.attack<=0||a.pose?.state!=='strike'||a.hitAttack===a.attackId)return;
 const w=a.parts.weapon,tip={x:w.position.x+Math.sin(w.angle)*a.derived.reach*.5,y:w.position.y-Math.cos(w.angle)*a.derived.reach*.5};
 for(const part of ['head','torso']){
  const p=b.parts[part],radius=part==='head'?27:34;
  const head=a.parts.flailHead;const extra=a.parts.offWeapon;const bladeDistance=Math.min(Math.hypot(tip.x-p.position.x,tip.y-p.position.y),Math.hypot(w.position.x-p.position.x,w.position.y-p.position.y),head?Math.hypot(head.position.x-p.position.x,head.position.y-p.position.y):999,extra?Math.hypot(extra.position.x-p.position.x,extra.position.y-p.position.y):999);if(bladeDistance>radius+22)continue;
  a.hitAttack=a.attackId;const d=a.derived,bd=b.derived;let mitigation=d.armour||bd.armour;
  mitigation=bd.armour*(1-(GEAR.weapons[a.build.weapon].armourBypass||0));if(part==='head')mitigation=1-(1-mitigation)*(1-bd.helmet);
  let blocked=false;if(b.guard&&m.rng()<Math.min(.85,(bd.block+.20)*(GEAR.weapons[a.build.weapon].blockFactor||1))){blocked=true;mitigation=1-(1-mitigation)*.35;}
  const amount=Math.max(2,d.damage*1.15*(.85+m.rng()*.3)*(1-mitigation));b.health=Math.max(0,b.health-amount);b.flash=.15;
  a.metrics.hits++;a.metrics.damage+=amount;if(blocked){b.metrics.blocks++;b.riposteUntil=m.time+.65;}const wasDown=b.stagger>0;const direction=a===m.fighters[0]?1:-1;applyImpact(b,amount,direction);Body.applyForce(b.parts.torso,p.position,{x:direction*motionStats(a.build).impulse*(1-bd.balance*.35),y:-.009});
  if(!wasDown&&b.stagger>0)b.metrics.knockdowns++;if(amount>=22&&!blocked){m.hitStop=2;m.slowTicks=8;}const debris=amount>=25&&!blocked?(part==='head'&&b.build.helmet!=='none'?'helmet':m.tick%3===0?'weapon':null):null;m.events.push({type:'hit',tick:m.tick,a:ai,part,amount:Math.round(amount),blocked,debris,x:p.position.x,y:p.position.y});return;
 }
}
function snapshot(m){return {type:'snapshot',tick:m.tick,time:m.time,motionRate:m.motionRate??1,status:m.status,winner:m.winner,fighters:m.fighters.map(f=>({name:f.build.name,health:f.health,maxHealth:f.derived.maxHealth,stamina:f.stamina,maxStamina:f.derived.maxStamina,build:f.build,attack:f.attack,guard:f.guard,flash:f.flash,pose:f.pose?.state||'guard',poseProgress:f.pose?.progress||0,motorStrength:f.pose?.motorStrength??1,parts:Object.fromEntries(Object.entries(f.parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]))})),events:m.events.splice(0)};}
export function createMatch(a,b,{seed=Date.now(),mode='computer'}={}){
 const engine=Engine.create({gravity:{x:0,y:1,scale:.001}});engine.positionIterations=8;engine.velocityIterations=6;
 const ground=Bodies.rectangle(400,478,900,40,{isStatic:true,friction:.9,label:'ground'});Composite.add(engine.world,[ground,Bodies.rectangle(-25,250,50,600,{isStatic:true}),Bodies.rectangle(925,250,50,600,{isStatic:true})]);
 const m={engine,fighters:[fighter(engine,a,0,245),fighter(engine,b,1,555)],time:0,tick:0,status:'fighting',winner:null,events:[{type:'start'}],rng:random(seed),mode,seed};
 return m;
}
export function stepMatch(m){
 if(m.status!=='fighting')return snapshot(m);m.tick++;m.time+=DT;if(m.hitStop>0){m.hitStop--;m.motionRate=0;return snapshot(m);}const dt=m.slowTicks>0?DT*.65:DT;m.motionRate=dt/DT;if(m.slowTicks>0)m.slowTicks--;
 m.fighters.forEach((f,i)=>{const o=m.fighters[1-i];f.cooldown=Math.max(0,f.cooldown-dt);f.attack=Math.max(0,f.attack-dt);f.flash=Math.max(0,f.flash-dt);f.think-=dt;if(f.think<=0){f.think=.15;chooseIntent(m,f,o,i);}if(f.attack<=0)f.stamina=Math.min(f.derived.maxStamina,f.stamina+f.derived.regen*dt);
 const movement=f.movement||0;
 if(f.action==='shove'&&f.guard&&f.stagger===0)Body.applyForce(o.parts.torso,o.parts.torso.position,{x:(i===0?1:-1)*.012,y:0});locomotion(f,movement,dt);drivePose(f,i===0?1:-1,movement);limitJoints(f,i===0?1:-1);
 f.metrics.spacing+=Math.abs(f.parts.torso.position.x-o.parts.torso.position.x);f.metrics.samples++;

 });
 separateFighters(...m.fighters);Engine.update(m.engine,dt*500);Engine.update(m.engine,dt*500);for(const f of m.fighters){f.metrics.travel+=Math.abs(f.parts.torso.position.x-f.previousX);f.previousX=f.parts.torso.position.x;}hit(m,m.fighters[0],m.fighters[1],0);hit(m,m.fighters[1],m.fighters[0],1);
 if(m.fighters.some(f=>f.health<=0)||m.time>=75){m.status='finished';const [a,b]=m.fighters;if(a.health===b.health)m.winner=-1;else m.winner=a.health>b.health?0:1;m.events.push({type:'finished',winner:m.winner});}
 return snapshot(m);
}
