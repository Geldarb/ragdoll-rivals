import Matter from 'matter-js';
import {captureParts} from '../shared/animation.js';
const {Engine,Bodies,Body,Composite,Constraint}=Matter;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function ensureWorld(m){
 if(m.engine)return m.engine;
 const engine=Engine.create({gravity:{x:0,y:1,scale:.001}});
 engine.positionIterations=10;engine.velocityIterations=8;
 Composite.add(engine.world,[
  Bodies.rectangle(400,478,900,40,{isStatic:true,friction:.95,label:'ground'}),
  Bodies.rectangle(-25,250,50,600,{isStatic:true}),
  Bodies.rectangle(925,250,50,600,{isStatic:true})
 ]);
 m.engine=engine;return engine;
}

function joint(list,a,b,pa,pb,stiffness=.72){list.push(Constraint.create({bodyA:a,bodyB:b,pointA:pa,pointB:pb,length:2,stiffness,damping:.12}));}

export function spawnRagdoll(m,f,direction,damage){
 if(f.ragdoll){
  const torso=f.ragdoll.bodies.torso;
  Body.applyForce(torso,torso.position,{x:direction*.02,y:-.012});
  Body.setAngularVelocity(torso,torso.angularVelocity+direction*.12);
  return f.ragdoll;
 }
 const engine=ensureWorld(m),group=Body.nextGroup(true),p=f.parts,bodies={},joints=[];
 const opt={collisionFilter:{group},friction:.7,frictionAir:.11,restitution:.1,density:.002};
 const place=(name,factory)=>{const src=p[name];if(!src)return null;const b=factory(src);Body.setVelocity(b,{x:clamp(src.velocity?.x||0,-6,6),y:clamp(src.velocity?.y||0,-6,6)});Body.setAngularVelocity(b,clamp(src.angularVelocity||0,-.2,.2));bodies[name]=b;return b;};
 place('torso',s=>Bodies.rectangle(s.x,s.y,34,68,{...opt,chamfer:{radius:12},label:s.label,angle:s.a}));
 place('pelvis',s=>Bodies.rectangle(s.x,s.y,30,20,{...opt,label:s.label,angle:s.a}));
 place('head',s=>Bodies.circle(s.x,s.y,19,{...opt,label:s.label}));
 for(const side of ['L','R']){
  place('upperArm'+side,s=>Bodies.rectangle(s.x,s.y,13,43,{...opt,chamfer:{radius:5},label:s.label,angle:s.a}));
  place('lowerArm'+side,s=>Bodies.rectangle(s.x,s.y,11,40,{...opt,chamfer:{radius:5},label:s.label,angle:s.a}));
  place('hand'+side,s=>Bodies.circle(s.x,s.y,6,{...opt,label:s.label}));
  place('thigh'+side,s=>Bodies.rectangle(s.x,s.y,16,48,{...opt,chamfer:{radius:5},label:s.label,angle:s.a}));
  place('shin'+side,s=>Bodies.rectangle(s.x,s.y,13,43,{...opt,chamfer:{radius:5},label:s.label,angle:s.a}));
  place('foot'+side,s=>Bodies.rectangle(s.x,s.y,26,10,{...opt,label:s.label,angle:s.a}));
 }
 const bladeWidth=f.build.weapon==='claymore'?14:f.build.weapon==='rapier'?6:f.build.weapon==='dagger'?8:10;
 place('weapon',s=>Bodies.rectangle(s.x,s.y,bladeWidth,f.derived.reach,{...opt,density:.0015,label:s.label,angle:s.a}));
 if(p.offWeapon)place('offWeapon',s=>Bodies.rectangle(s.x,s.y,8,f.derived.reach,{...opt,density:.0015,label:s.label,angle:s.a}));
 if(p.chain0){place('chain0',s=>Bodies.circle(s.x,s.y,3,{...opt,density:.002,label:s.label}));place('chain1',s=>Bodies.circle(s.x,s.y,3,{...opt,density:.002,label:s.label}));place('flailHead',s=>Bodies.circle(s.x,s.y,11,{...opt,density:.005,label:s.label}));}
 const b=bodies,facing=f.facing;
 joint(joints,b.torso,b.pelvis,{x:0,y:33},{x:0,y:-10},.95);
 joint(joints,b.torso,b.head,{x:0,y:-34},{x:0,y:17},.85);
 for(const side of ['L','R']){
  joint(joints,b.torso,b['upperArm'+side],{x:facing*(side==='R'?12:-12),y:-24},{x:0,y:-19});
  joint(joints,b['upperArm'+side],b['lowerArm'+side],{x:0,y:19},{x:0,y:-18},.65);
  joint(joints,b['lowerArm'+side],b['hand'+side],{x:0,y:18},{x:0,y:0},.98);
  joint(joints,b.pelvis,b['thigh'+side],{x:(side==='L'?-1:1)*10,y:5},{x:0,y:-22},.98);
  joint(joints,b['thigh'+side],b['shin'+side],{x:0,y:22},{x:0,y:-19},.98);
  joint(joints,b['shin'+side],b['foot'+side],{x:0,y:21},{x:0,y:-3},.98);
 }
 joint(joints,b.handR,b.weapon,{x:0,y:0},{x:0,y:f.derived.reach*(f.build.weapon==='claymore'?.36:.38)},.98);
 if(p.offWeapon)joint(joints,b.handL,b.offWeapon,{x:0,y:0},{x:0,y:f.derived.reach*.38},.98);
 else if(GEAR_TWO_HANDED(f))joint(joints,b.handL,b.weapon,{x:0,y:0},{x:0,y:f.derived.reach*(f.build.weapon==='claymore'?.18:.20)},.98);
 if(b.chain0){joint(joints,b.weapon,b.chain0,{x:0,y:-f.derived.reach*.45},{x:0,y:0},.7);joint(joints,b.chain0,b.chain1,{x:0,y:0},{x:0,y:0},.7);joints.at(-1).length=12;joint(joints,b.chain1,b.flailHead,{x:0,y:0},{x:0,y:0},.7);joints.at(-1).length=16;}
 Composite.add(engine.world,[...Object.values(bodies),...joints]);
 Body.applyForce(b.torso,b.torso.position,{x:direction*.022*(.8+Math.min(1,damage/32)),y:-.012});
 Body.setAngularVelocity(b.torso,b.torso.angularVelocity+direction*.12/(1+f.build.stats.balance*.025));
 f.ragdoll={bodies,joints};f.mode='ragdoll';
 for(const part of Object.values(f.parts))part.isStatic=false;
 return f.ragdoll;
}
function GEAR_TWO_HANDED(f){return f.build.weapon==='claymore'||f.build.weapon==='spear'||f.build.weapon==='warhammer'||f.build.weapon==='halberd';}

export function stepRagdollWorld(m,dt){if(!m.engine)return;for(let i=0;i<2;i++)Engine.update(m.engine,dt*500);}

export function sampleRagdoll(f){
 if(!f.ragdoll)return;
 for(const [name,body] of Object.entries(f.ragdoll.bodies)){
  const p=f.parts[name];if(!p)continue;
  p.x=body.position.x;p.y=body.position.y;p.a=body.angle;p.position.x=body.position.x;p.position.y=body.position.y;p.angle=body.angle;
  p.velocity={...body.velocity};p.angularVelocity=body.angularVelocity;p.isStatic=false;
  p.bounds={min:{...body.bounds.min},max:{...body.bounds.max}};
 }
 f.rootX=f.parts.torso.position.x;
}

export function destroyRagdoll(m,f){
 const from=captureParts(f.parts);
 if(f.ragdoll&&m.engine)Composite.remove(m.engine.world,[...Object.values(f.ragdoll.bodies),...f.ragdoll.joints]);
 f.ragdoll=null;return from;
}

export function impulseRagdoll(f,direction,power){
 if(!f.ragdoll)return;
 const torso=f.ragdoll.bodies.torso;
 Body.applyForce(torso,torso.position,{x:direction*power,y:-.007});
}
