import Matter from 'matter-js';
import { deriveStats, GEAR, STYLE_DATA } from '../shared/rules.js';
const {Engine,Bodies,Body,Composite,Constraint}=Matter;
const DT=1/30;
function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function fighter(engine,build,index,x){
 const d=deriveStats(build),group=Body.nextGroup(true),parts={},joints=[];
 const opt={collisionFilter:{group},friction:.7,frictionAir:.035,restitution:.08,density:.002};
 parts.torso=Bodies.rectangle(x,330,34,68,{...opt,chamfer:{radius:12},label:`${index}:torso`});
 parts.head=Bodies.circle(x,276,19,{...opt,label:`${index}:head`});
 const limb=(name,px,py,w,h)=>parts[name]=Bodies.rectangle(px,py,w,h,{...opt,chamfer:{radius:5},label:`${index}:${name}`});
 for(const side of [-1,1]){const s=side<0?'L':'R';limb('upperArm'+s,x+side*23,330,13,43);limb('lowerArm'+s,x+side*24,372,11,40);limb('thigh'+s,x+side*11,390,16,48);limb('shin'+s,x+side*11,432,13,43);}
 const joint=(a,b,pa,pb,stiffness=.72)=>joints.push(Constraint.create({bodyA:a,bodyB:b,pointA:pa,pointB:pb,length:2,stiffness,damping:.12}));
 joint(parts.torso,parts.head,{x:0,y:-34},{x:0,y:17},.85);
 for(const side of [-1,1]){const s=side<0?'L':'R';joint(parts.torso,parts['upperArm'+s],{x:side*18,y:-24},{x:0,y:-19});joint(parts['upperArm'+s],parts['lowerArm'+s],{x:0,y:19},{x:0,y:-18},.65);joint(parts.torso,parts['thigh'+s],{x:side*10,y:30},{x:0,y:-22},.85);joint(parts['thigh'+s],parts['shin'+s],{x:0,y:22},{x:0,y:-19},.8);}
 const reach=d.reach;
 parts.weapon=Bodies.rectangle(x+(index? -1:1)*42,356,10,reach,{...opt,density:.0015,label:`${index}:weapon`});
 joint(parts.lowerArmR,parts.weapon,{x:0,y:17},{x:0,y:-reach*.36},.92);
 Composite.add(engine.world,[...Object.values(parts),...joints]);
 return {build,derived:d,parts,limbs:Object.values(parts),joints,health:d.maxHealth,stamina:d.maxStamina,cooldown:.3,attack:0,attackId:0,hitAttack:-1,guard:false,think:0,metrics:{approach:0,retreat:0,guard:0,attack:0},flash:0};
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
 if(distance<100+f.derived.reach&&f.cooldown<=0&&staminaOK&&m.rng()<chance){f.attack=.38;f.attackId++;f.stamina=Math.max(0,f.stamina-f.derived.attackCost);f.cooldown=f.derived.interval;f.metrics.attack++;}
}
function hit(m,a,b,ai){
 if(a.attack<=0||a.attack>.25||a.hitAttack===a.attackId)return;
 const w=a.parts.weapon,tip={x:w.position.x+Math.sin(w.angle)*a.derived.reach*.48,y:w.position.y-Math.cos(w.angle)*a.derived.reach*.48};
 for(const part of ['head','torso']){
  const p=b.parts[part],radius=part==='head'?27:34;
  if(Math.hypot(tip.x-p.position.x,tip.y-p.position.y)>radius&&Math.hypot(w.position.x-p.position.x,w.position.y-p.position.y)>90)continue;
  a.hitAttack=a.attackId;const d=a.derived,bd=b.derived;let mitigation=d.armour||bd.armour;
  mitigation=bd.armour*(1-(GEAR.weapons[a.build.weapon].armourBypass||0));if(part==='head')mitigation=1-(1-mitigation)*(1-bd.helmet);
  let blocked=false;if(b.guard&&m.rng()<bd.block){blocked=true;mitigation=1-(1-mitigation)*.35;}
  const amount=Math.max(2,d.damage*(.85+m.rng()*.3)*(1-mitigation));b.health=Math.max(0,b.health-amount);b.flash=.15;
  const direction=a===m.fighters[0]?1:-1;Body.applyForce(b.parts.torso,p.position,{x:direction*(.012+a.build.stats.strength*.0015)*(1-bd.balance*.35),y:-.009});
  m.events.push({type:'hit',tick:m.tick,a:ai,part,amount:Math.round(amount),blocked,x:tip.x,y:tip.y});return;
 }
}
function snapshot(m){return {type:'snapshot',tick:m.tick,time:m.time,status:m.status,winner:m.winner,fighters:m.fighters.map(f=>({name:f.build.name,health:f.health,maxHealth:f.derived.maxHealth,stamina:f.stamina,maxStamina:f.derived.maxStamina,build:f.build,attack:f.attack,guard:f.guard,flash:f.flash,parts:Object.fromEntries(Object.entries(f.parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]))})),events:m.events.splice(0)};}
export function createMatch(a,b,{seed=Date.now(),mode='computer'}={}){
 const engine=Engine.create({gravity:{x:0,y:1,scale:.001}});engine.positionIterations=8;engine.velocityIterations=6;
 const ground=Bodies.rectangle(400,478,900,40,{isStatic:true,friction:.9,label:'ground'});Composite.add(engine.world,ground);
 const m={engine,fighters:[fighter(engine,a,0,245),fighter(engine,b,1,555)],time:0,tick:0,status:'fighting',winner:null,events:[{type:'start'}],rng:random(seed),mode,seed};
 return m;
}
export function stepMatch(m){
 if(m.status!=='fighting')return snapshot(m);m.tick++;m.time+=DT;
 m.fighters.forEach((f,i)=>{const o=m.fighters[1-i];f.cooldown=Math.max(0,f.cooldown-DT);f.attack=Math.max(0,f.attack-DT);f.flash=Math.max(0,f.flash-DT);f.think-=DT;if(f.think<=0){f.think=.15;decide(m,f,o,i);}if(f.attack<=0)f.stamina=Math.min(f.derived.maxStamina,f.stamina+f.derived.regen*DT);
 const torso=f.parts.torso,dir=i===0?1:-1,distance=Math.abs(torso.position.x-o.parts.torso.position.x),range=100+f.derived.reach*STYLE_DATA[f.build.style].range;
 let movement=distance>range?dir:0;if(f.build.style==='evasive'&&Math.floor(m.time*1.3+i)%4===0)movement=-dir;if(f.build.style==='berserker')movement=dir;
 const target=movement*f.derived.moveSpeed*.019;Body.setVelocity(torso,{x:torso.velocity.x*.82+target*.18,y:torso.velocity.y});torso.torque+=(-torso.angle*f.derived.balance-torso.angularVelocity*.6)*.045;
 for(const side of ['L','R']){const arm=f.parts['upperArm'+side];if(side==='R'){const target=f.attack>0?(i===0?-1.7:1.7):(i===0?-.45:.45);arm.torque+=(target-arm.angle)*.13-arm.angularVelocity*.035;}else arm.torque+=(-arm.angle*.03-arm.angularVelocity*.015);}
 });
 Engine.update(m.engine,1000/60);Engine.update(m.engine,1000/60);hit(m,m.fighters[0],m.fighters[1],0);hit(m,m.fighters[1],m.fighters[0],1);
 if(m.fighters.some(f=>f.health<=0)||m.time>=75){m.status='finished';const [a,b]=m.fighters;if(a.health===b.health)m.winner=-1;else m.winner=a.health>b.health?0:1;m.events.push({type:'finished',winner:m.winner});}
 return snapshot(m);
}
