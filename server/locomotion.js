import Matter from 'matter-js';
import {poseProfile} from './poses.js';
const {Body}=Matter;
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function muscle(body,target,gain,power){const torque=body.inertia*power*(wrap(target-body.angle)*gain-body.angularVelocity*.0018);body.torque=clamp(body.torque+torque,-body.inertia*.0012,body.inertia*.0012);}
function servo(body,x,y,k,power){Body.applyForce(body,body.position,{x:clamp((x-body.position.x)*k-body.velocity.x*.00035,-.1,.1)*power,y:clamp((y-body.position.y)*k-body.velocity.y*.0005,-.16,.16)*power});}
export function applyImpact(f,damage,direction){
 if(damage<18)return;
 const b=f.build.stats.balance;
 f.stagger=Math.max(f.stagger||0,(1.45-b*.065)*Math.min(1.5,Math.max(.7,damage/35))*(1+f.derived.weight*.002));
 f.recovery=0;
 for(const side of ['L','R']){f.plants[side].stiffness=0;f.gait.stance[side]=false;}
 Body.setAngularVelocity(f.parts.torso,f.parts.torso.angularVelocity+direction*.19/(1+b*.025));
 Body.applyForce(f.parts.torso,f.parts.torso.position,{x:direction*.032,y:-.018});
}
export function locomotion(f,movement,dt){
 f.stagger=Math.max(0,f.stagger-dt);
 const b=f.build.stats.balance,p=f.parts;
 if(f.stagger>0){f.gait.planted=false;for(const side of ['L','R']){f.plants[side].stiffness=0;f.gait.stance[side]=false;}return;}
 f.recovery=Math.min(1,f.recovery+dt*(.8+b*.18));
 const power=f.recovery*(.8+b*.045),vx=movement*f.derived.moveSpeed*.019;
 const profile=poseProfile(f.build);f.gait.phase+=(movement===0?.6:profile.cadence)*dt;f.gait.planted=false;
 // Finite balance muscles support body height, but remain off during stagger.
 muscle(p.torso,f.pose?.lean||0,.0015,power);muscle(p.head,0,.0011,power);muscle(p.pelvis,0,.0015,power);
 servo(p.torso,p.torso.position.x+(vx-p.torso.velocity.x)*16,323+(f.pose?.crouch??profile.crouch),.0011,power);
 servo(p.pelvis,p.pelvis.position.x,367,.0007,power);
 for(const [side,offset] of [['L',0],['R',.5]]){
  const phase=(f.gait.phase+offset)%1,stance=phase<.58,foot=p['foot'+side],anchor=f.plants[side];
  if(stance){if(!f.gait.stance[side]){anchor.pointA={x:foot.position.x,y:453};}anchor.stiffness=foot.position.y>442?.8:0;f.gait.planted ||=anchor.stiffness>0;servo(foot,anchor.pointA.x,453,.0008,power);}
  else{anchor.stiffness=0;const swing=(phase-.58)/.42;const x=p.pelvis.position.x+(side==='L'?-profile.stance*.5:profile.stance*.5)+movement*profile.stride*(-.6+1.8*swing);const y=453-34*Math.sin(Math.PI*swing);servo(foot,x,y,.004,power);}
  f.gait.stance[side]=stance;
  const thigh=p['thigh'+side],shin=p['shin'+side];
  const dx=foot.position.x-p.pelvis.position.x,dy=Math.max(20,foot.position.y-p.pelvis.position.y);
  const bend=Math.acos(clamp(Math.hypot(dx,dy)/88,.2,1));const centre=-Math.atan2(dx,dy);
  muscle(thigh,centre-bend,.0018,power);muscle(shin,centre+bend,.0018,power);muscle(foot,0,.0015,power);
  // Soft physiological limits: no hyperextended knees or backwards hips.
  const hip=wrap(thigh.angle-p.pelvis.angle),knee=wrap(shin.angle-thigh.angle);
  if(Math.abs(hip)>1.15)muscle(thigh,p.pelvis.angle+clamp(hip,-1.15,1.15),.003,power);
  if(knee<-.15||knee>1.9)muscle(shin,thigh.angle+clamp(knee,-.15,1.9),.003,power);
 }
}
