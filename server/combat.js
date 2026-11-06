import Matter from 'matter-js';
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
 return {build,derived:d,parts,plants,grips,attackDuration:.38,stagger:0,recovery:1,gait:{phase:0,planted:false,stance:{L:false,R:false}},limbs:Object.values(parts),joints,health:d.maxHealth,stamina:d.maxStamina,cooldown:.3,attack:0,attackId:0,hitAttack:-1,guard:false,think:0,metrics:{approach:0,retreat:0,guard:0,attack:0},flash:0};
}
function decide(m,f,o,index){
 const s=STYLE_DATA[f.build.style],distance=Math.abs(f.parts.torso.position.x-o.parts.torso.position.x),range=78+f.derived.reach*.75*s.range;
 const opening=o.attack>0&&o.attack<.22,phase=Math.floor(m.time*1.3+index)%4;
 f.guard=['defensive','counterattacker','patient'].includes(f.build.style)&&(f.stamina<f.derived.maxStamina*.65||o.attack>0);
 let dir=0;
 if(f.build.style==='evasive'&&phase===0)dir=index===0?-1:1;
 else if((f.build.style==='defensive'||f.build.style==='patient')&&f.stamina<f.derived.maxStamina*.4)dir=index===0?-1:1;
 else if(distance>range)dir=index===0?1:-1;
 else if(distance<range*.52&&f.build.style!=='berserker')dir=index===0?-1:1;
 f.metrics[dir===(index===0?1:-1)?'approach':'retreat']++;
 if(f.guard)f.metrics.guard++;
 const staminaOK=f.stamina>=f.derived.attackCost*(f.build.style==='berserker'?.45:1);
 let chance=s.chance;if(f.build.style==='counterattacker'&&opening)chance=1;if(f.build.style==='patient'&&!opening)chance*=.45;
 if(f.stagger===0&&distance<100+f.derived.reach&&f.cooldown<=0&&staminaOK&&m.rng()<chance){f.attackDuration=Math.min(1.1,f.derived.interval*.8);f.attack=f.attackDuration;f.attackId++;f.stamina=Math.max(0,f.stamina-f.derived.attackCost);f.cooldown=f.derived.interval;f.metrics.attack++;}
}
function hit(m,a,b,ai){
 if(a.attack<=0||a.pose?.state!=='strike'||a.hitAttack===a.attackId)return;
 const w=a.parts.weapon,tip={x:w.position.x+Math.sin(w.angle)*a.derived.reach*.5,y:w.position.y-Math.cos(w.angle)*a.derived.reach*.5};
 for(const part of ['head','torso']){
  const p=b.parts[part],radius=part==='head'?27:34;
  if(Math.hypot(tip.x-p.position.x,tip.y-p.position.y)>radius&&Math.hypot(w.position.x-p.position.x,w.position.y-p.position.y)>90)continue;
  a.hitAttack=a.attackId;const d=a.derived,bd=b.derived;let mitigation=d.armour||bd.armour;
  mitigation=bd.armour*(1-(GEAR.weapons[a.build.weapon].armourBypass||0));if(part==='head')mitigation=1-(1-mitigation)*(1-bd.helmet);
  let blocked=false;if(b.guard&&m.rng()<bd.block){blocked=true;mitigation=1-(1-mitigation)*.35;}
  const amount=Math.max(2,d.damage*(.85+m.rng()*.3)*(1-mitigation));b.health=Math.max(0,b.health-amount);b.flash=.15;
  const direction=a===m.fighters[0]?1:-1;applyImpact(b,amount,direction);Body.applyForce(b.parts.torso,p.position,{x:direction*(.012+a.build.stats.strength*.0015)*(1-bd.balance*.35),y:-.009});
  m.events.push({type:'hit',tick:m.tick,a:ai,part,amount:Math.round(amount),blocked,x:tip.x,y:tip.y});return;
 }
}
function snapshot(m){return {type:'snapshot',tick:m.tick,time:m.time,status:m.status,winner:m.winner,fighters:m.fighters.map(f=>({name:f.build.name,health:f.health,maxHealth:f.derived.maxHealth,stamina:f.stamina,maxStamina:f.derived.maxStamina,build:f.build,attack:f.attack,guard:f.guard,flash:f.flash,pose:f.pose?.state||'guard',poseProgress:f.pose?.progress||0,motorStrength:f.pose?.motorStrength??1,parts:Object.fromEntries(Object.entries(f.parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]))})),events:m.events.splice(0)};}
export function createMatch(a,b,{seed=Date.now(),mode='computer'}={}){
 const engine=Engine.create({gravity:{x:0,y:1,scale:.001}});engine.positionIterations=8;engine.velocityIterations=6;
 const ground=Bodies.rectangle(400,478,900,40,{isStatic:true,friction:.9,label:'ground'});Composite.add(engine.world,[ground,Bodies.rectangle(-25,250,50,600,{isStatic:true}),Bodies.rectangle(925,250,50,600,{isStatic:true})]);
 const m={engine,fighters:[fighter(engine,a,0,245),fighter(engine,b,1,555)],time:0,tick:0,status:'fighting',winner:null,events:[{type:'start'}],rng:random(seed),mode,seed};
 return m;
}
export function stepMatch(m){
 if(m.status!=='fighting')return snapshot(m);m.tick++;m.time+=DT;
 m.fighters.forEach((f,i)=>{const o=m.fighters[1-i];f.cooldown=Math.max(0,f.cooldown-DT);f.attack=Math.max(0,f.attack-DT);f.flash=Math.max(0,f.flash-DT);f.think-=DT;if(f.think<=0){f.think=.15;decide(m,f,o,i);}if(f.attack<=0)f.stamina=Math.min(f.derived.maxStamina,f.stamina+f.derived.regen*DT);
 const torso=f.parts.torso,dir=i===0?1:-1,distance=Math.abs(torso.position.x-o.parts.torso.position.x),range=100+f.derived.reach*STYLE_DATA[f.build.style].range;
 let movement=distance>range?dir:0;if(f.build.style==='evasive'&&Math.floor(m.time*1.3+i)%4===0)movement=-dir;if(f.build.style==='berserker')movement=dir;
 locomotion(f,movement,DT);
 drivePose(f,i===0?1:-1,movement);
 });
 Engine.update(m.engine,1000/60);Engine.update(m.engine,1000/60);hit(m,m.fighters[0],m.fighters[1],0);hit(m,m.fighters[1],m.fighters[0],1);
 if(m.fighters.some(f=>f.health<=0)||m.time>=75){m.status='finished';const [a,b]=m.fighters;if(a.health===b.health)m.winner=-1;else m.winner=a.health>b.health?0:1;m.events.push({type:'finished',winner:m.winner});}
 return snapshot(m);
}
