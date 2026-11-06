import Matter from 'matter-js';
import {prepareArms} from './arm-motion.js';
import {motionStats} from './styles.js';
import {deriveStats,GEAR} from '../shared/rules.js';
const {Body,Vector}=Matter;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const profiles={
 aggressive:[2.2,32,19,3,24,.27,17],defensive:[1.35,18,25,7,37,.38,4],counterattacker:[1.55,21,21,3,32,.22,12],
 evasive:[2.65,36,16,9,22,.25,20],balanced:[1.8,25,20,2,28,.32,10],berserker:[1.65,34,29,6,20,.41,24],patient:[1.4,20,18,1,34,.36,6]
};
export function poseProfile(build){const [cadence,stride,stance,crouch,guardHeight,windup,lunge]=profiles[build.style];const weight=deriveStats(build).weight;const motion=motionStats(build);const factor=motion.weight;return {cadence:cadence*motion.cadence,stride:stride*factor*(.8+build.stats.speed*.05),stance,crouch,guardHeight,windup:Math.min(.48,windup+weight*.002),lunge:lunge*factor};}
const swingKeys={
 dagger:{wind:[20,-23,.8],strike:[68,-19,1.4]},sword:{wind:[15,-45,-.7],strike:[64,-6,1.5]},
 axe:{wind:[4,-60,-.45],strike:[58,-2,1.4]},mace:{wind:[8,-54,-.3],strike:[54,0,1.65]},claymore:{wind:[3,-47,-.8],strike:[60,-8,1.8]},spear:{wind:[12,-18,1.1],strike:[70,-22,1.55]},flail:{wind:[8,-52,-1.1],strike:[58,-9,1.9]},warhammer:{wind:[4,-64,-.7],strike:[54,6,1.8]},halberd:{wind:[0,-52,-.95],strike:[62,-1,1.55]},rapier:{wind:[24,-28,1.0],strike:[72,-25,1.52]},twinSwords:{wind:[19,-41,-.5],strike:[61,-13,1.75]}
};
export function targetPose(f,direction,movement){
 const profile=poseProfile(f.build),motion=motionStats(f.build,f.stamina/f.derived.maxStamina),phase=f.gait?.phase||0,bob=Math.sin(phase*Math.PI*2)*2;
 let state=movement===0?'guard':movement*direction>0?'advance':'retreat';
 let hand={x:36,y:-profile.guardHeight+bob},angle=.45;
 if(f.guard){state='block';hand={x:30,y:-40};angle=.2;}
 if(f.action==='dodge'||(f.build.style==='evasive'&&movement*direction<0)){state='dodge';hand={x:22,y:-20};angle=.75;}
 if(f.attack>0){const duration=f.attackDuration||.38,progress=clamp(1-f.attack/duration,0,1),keys=swingKeys[f.build.weapon];let a,b,t;
  if(progress<profile.windup){state='wind-up';a=[36,-profile.guardHeight,.45];b=keys.wind;t=smooth(progress/profile.windup);}
  else if(progress<.72){state='strike';a=keys.wind;b=keys.strike;t=smooth((progress-profile.windup)/(.72-profile.windup));}
  else{state='recovery';a=keys.strike;b=[36,-profile.guardHeight,.45];t=smooth((progress-.72)/.28);}
  hand={x:mix(a[0],b[0],t)+(state==='strike'?profile.lunge*motion.swing*Math.sin(t*Math.PI):0),y:mix(a[1],b[1],t)};angle=mix(a[2],b[2],t)*(.85+f.build.stats.strength*.04);if(f.attackChoice==='thrust'){hand.x+=12*Math.sin(progress*Math.PI);angle=mix(angle,1.45,.55);}if(f.attackChoice==='spin')angle+=Math.sin(progress*Math.PI*2)*1.1;
 }
 if(f.action==='feint'){state='feint';angle=-.2;hand.x-=8;}if(f.action==='stumble'){state='stumble';hand.y+=15;}if(f.exhausted){state='exhausted';hand.y+=30;angle=.8;}
 let motorStrength=f.recovery??1;
 if(f.stagger>0){state='stagger';motorStrength=0;}else if(motorStrength<.95){state='get-up';hand.y=mix(18,hand.y,smooth(motorStrength));hand.x=mix(18,hand.x,smooth(motorStrength));}
 if(hand.y>-30)hand.x=Math.max(28,hand.x);const right={x:hand.x*direction,y:hand.y},left={x:direction*29,y:-(f.guard?43:profile.guardHeight-2)};
 return {state,progress:f.attack>0?1-f.attack/(f.attackDuration||.38):0,motorStrength,profile,right,left,weaponAngle:direction*angle,crouch:profile.crouch+(f.exhausted?14:0)+(state==='dodge'?10:state==='get-up'?20*(1-motorStrength):0),lean:state==='dodge'?-direction*.18:0};
}
export function drivePose(f,direction,movement){const pose=targetPose(f,direction,movement);f.pose=pose;prepareArms(f,pose,direction);}
