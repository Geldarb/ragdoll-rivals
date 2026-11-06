import Matter from 'matter-js';
import {deriveStats,GEAR} from '../shared/rules.js';
const {Body,Vector}=Matter;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const profiles={
 aggressive:[2.2,32,19,3,24,.27,17],defensive:[1.35,18,25,7,37,.38,4],counterattacker:[1.55,21,21,3,32,.22,12],
 evasive:[2.65,36,16,9,22,.25,20],balanced:[1.8,25,20,2,28,.32,10],berserker:[1.65,34,29,6,20,.41,24],patient:[1.4,20,18,1,34,.36,6]
};
export function poseProfile(build){const [cadence,stride,stance,crouch,guardHeight,windup,lunge]=profiles[build.style];const weight=deriveStats(build).weight;const factor=1/(1+weight*.018);return {cadence:cadence*factor,stride:stride*factor,stance,crouch,guardHeight,windup:Math.min(.48,windup+weight*.002),lunge:lunge*factor};}
const swingKeys={
 dagger:{wind:[20,-23,.8],strike:[68,-19,1.4]},sword:{wind:[15,-45,-.7],strike:[64,-6,1.5]},
 axe:{wind:[4,-60,-.45],strike:[58,-2,1.4]},mace:{wind:[8,-54,-.3],strike:[54,0,1.65]},claymore:{wind:[3,-47,-.8],strike:[60,-8,1.8]},spear:{wind:[12,-18,1.1],strike:[70,-22,1.55]},flail:{wind:[8,-52,-1.1],strike:[58,-9,1.9]},warhammer:{wind:[4,-64,-.7],strike:[54,6,1.8]},halberd:{wind:[0,-52,-.95],strike:[62,-1,1.55]},rapier:{wind:[24,-28,1.0],strike:[72,-25,1.52]},twinSwords:{wind:[19,-41,-.5],strike:[61,-13,1.75]}
};
export function targetPose(f,direction,movement){
 const profile=poseProfile(f.build),phase=f.gait?.phase||0,bob=Math.sin(phase*Math.PI*2)*2;
 let state=movement===0?'guard':movement===direction?'advance':'retreat';
 let hand={x:36,y:-profile.guardHeight+bob},angle=.45;
 if(f.guard){state='block';hand={x:30,y:-40};angle=.2;}
 if(f.build.style==='evasive'&&movement===-direction){state='dodge';hand={x:22,y:-20};angle=.75;}
 if(f.attack>0){const duration=f.attackDuration||.38,progress=clamp(1-f.attack/duration,0,1),keys=swingKeys[f.build.weapon];let a,b,t;
  if(progress<profile.windup){state='wind-up';a=[36,-profile.guardHeight,.45];b=keys.wind;t=smooth(progress/profile.windup);}
  else if(progress<.72){state='strike';a=keys.wind;b=keys.strike;t=smooth((progress-profile.windup)/(.72-profile.windup));}
  else{state='recovery';a=keys.strike;b=[36,-profile.guardHeight,.45];t=smooth((progress-.72)/.28);}
  hand={x:mix(a[0],b[0],t)+(state==='strike'?profile.lunge*Math.sin(t*Math.PI):0),y:mix(a[1],b[1],t)};angle=mix(a[2],b[2],t);
 }
 let motorStrength=f.recovery??1;
 if(f.stagger>0){state='stagger';motorStrength=0;}else if(motorStrength<.95){state='get-up';hand.y=mix(18,hand.y,smooth(motorStrength));hand.x=mix(18,hand.x,smooth(motorStrength));}
 const right={x:hand.x*direction,y:hand.y},left={x:direction*29,y:-(f.guard?43:profile.guardHeight-2)};
 return {state,progress:f.attack>0?1-f.attack/(f.attackDuration||.38):0,motorStrength,profile,right,left,weaponAngle:direction*angle,crouch:profile.crouch+(state==='dodge'?10:state==='get-up'?20*(1-motorStrength):0),lean:state==='dodge'?-direction*.18:0};
}
function torque(body,target,power){const error=Math.atan2(Math.sin(target-body.angle),Math.cos(target-body.angle));body.torque+=body.inertia*clamp((error*.0025-body.angularVelocity*.0025)*power,-.0015,.0015);}
function force(body,target,power){Body.applyForce(body,body.position,{x:clamp((target.x-body.position.x)*.0018-body.velocity.x*.0005,-.065,.065)*power,y:clamp((target.y-body.position.y)*.0018-body.velocity.y*.0005,-.065,.065)*power});}
function arm(f,side,handTarget,direction,power){
 const p=f.parts,shoulderLocal={x:direction*(side==='R'?12:-12),y:-24},shoulder=Vector.add(p.torso.position,Vector.rotate(shoulderLocal,p.torso.angle));
 const delta=Vector.sub(handTarget,shoulder),distance=clamp(Vector.magnitude(delta),5,78),unit=Vector.normalise(delta),mid=Vector.add(shoulder,Vector.mult(unit,distance*.5));
 const elbow=Vector.add(mid,{x:-unit.y*Math.sqrt(40*40-distance*distance/4)*direction,y:unit.x*Math.sqrt(40*40-distance*distance/4)*direction});
 const upper=Vector.mult(Vector.add(shoulder,elbow),.5),lower=Vector.mult(Vector.add(elbow,handTarget),.5);
 force(p['upperArm'+side],upper,power);force(p['lowerArm'+side],lower,power);force(p['hand'+side],handTarget,power);
 torque(p['upperArm'+side],Math.atan2(shoulder.x-elbow.x,elbow.y-shoulder.y),power);torque(p['lowerArm'+side],Math.atan2(elbow.x-handTarget.x,handTarget.y-elbow.y),power);
}
export function drivePose(f,direction,movement){
 const pose=targetPose(f,direction,movement);f.pose=pose;
 const power=pose.motorStrength;if(power<=0)return;
 const origin=f.parts.torso.position,right=Vector.add(origin,pose.right);let left=Vector.add(origin,pose.left);
 if(GEAR.weapons[f.build.weapon].twoHanded){left=Vector.add(right,Vector.rotate({x:0,y:-f.derived.reach*.18},pose.weaponAngle));}
 if(GEAR.weapons[f.build.weapon].dual){left=Vector.add(origin,{x:direction*(pose.state==='strike'?58:30),y:pose.state==='strike'?-34:-22});torque(f.parts.offWeapon,-pose.weaponAngle*.8,power);}
 arm(f,'R',right,direction,power);arm(f,'L',left,direction,power);torque(f.parts.weapon,pose.weaponAngle,power);
}
