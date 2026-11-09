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
 dagger:{wind:[18,-20,.85],strike:[62,-16,1.35]},sword:{wind:[12,-48,-.75],strike:[66,-8,1.55]},
 axe:{wind:[2,-62,-.5],strike:[60,-2,1.42]},mace:{wind:[6,-56,-.35],strike:[56,2,1.68]},claymore:{wind:[-2,-58,-1.05],strike:[78,-14,1.95]},spear:{wind:[14,-18,1.12],strike:[74,-24,1.52]},flail:{wind:[6,-54,-1.15],strike:[60,-10,1.95]},warhammer:{wind:[0,-68,-.85],strike:[64,4,1.85]},halberd:{wind:[-2,-52,-.98],strike:[74,-4,1.55]},rapier:{wind:[26,-30,1.05],strike:[86,-28,1.55]},twinSwords:{wind:[18,-42,-.55],strike:[62,-14,1.78]}
};
export function targetPose(f,direction,movement){
 const profile=poseProfile(f.build),motion=motionStats(f.build,f.stamina/f.derived.maxStamina),phase=f.gait?.phase||0,bob=Math.sin(phase*Math.PI*2)*2;
 let state=movement===0?'guard':movement*direction>0?'advance':'retreat';
 let hand={x:36,y:-profile.guardHeight+bob},angle=.45,lean=0,crouch=profile.crouch+(f.exhausted?14:0);
 if(f.guard){state='block';hand={x:30,y:-40};angle=.2;}
 if(f.action==='dodge'||f.action==='roll'||(f.build.style==='evasive'&&movement*direction<0&&(f.shove||0)<=0&&f.attack<=0)){state='dodge';hand={x:22,y:f.action==='roll'?-8:-20};angle=.75;lean=-direction*(f.action==='roll'?.28:.18);if(f.action==='roll')crouch+=16;}
 if(f.attack>0){const duration=f.attackDuration||.38,progress=clamp(1-f.attack/duration,0,1),keys=swingKeys[f.build.weapon];let a,b,t;
  if(progress<profile.windup){state='wind-up';a=[36,-profile.guardHeight,.45];b=keys.wind;t=smooth(progress/profile.windup);lean=-direction*.08*t;}
  else if(progress<.72){state='strike';a=keys.wind;b=keys.strike;t=smooth((progress-profile.windup)/(.72-profile.windup));lean=direction*.12*Math.sin(t*Math.PI);}
  else{state='recovery';const follow=[keys.strike[0]+10,keys.strike[1]+6,keys.strike[2]+.15];const u=(progress-.72)/.28;if(u<.35){a=keys.strike;b=follow;t=smooth(u/.35);}else{a=follow;b=[36,-profile.guardHeight,.45];t=smooth((u-.35)/.65);}}
  hand={x:mix(a[0],b[0],t)+(state==='strike'?profile.lunge*motion.swing*Math.sin(t*Math.PI):0),y:mix(a[1],b[1],t)};angle=mix(a[2],b[2],t)*(.85+f.build.stats.strength*.04);
  if(f.attackChoice==='thrust'){hand.x+=16*Math.sin(progress*Math.PI);angle=mix(angle,1.45,.55);}
  if(f.attackChoice==='spin'){angle+=Math.sin(progress*Math.PI*2)*1.1;hand.x+=8*Math.sin(progress*Math.PI);}
  if(f.attackChoice==='lunge'){hand.x+=18*Math.sin(Math.min(1,progress/.75)*Math.PI);lean=direction*.2;crouch+=3;}
  if(f.attackChoice==='combo'&&state==='strike'){hand.x+=10*Math.sin(progress*Math.PI*4);angle+=.35*Math.sin(progress*Math.PI*4);}
  if(f.attackChoice==='charge'){hand.x+=14;lean=direction*.26;crouch+=2;}
  if(f.attackChoice==='dart'){hand.x+=8;lean=direction*.1;}
 }
 if((f.shove||0)>0){const kind=f.shoveType||'shove',u=1-(f.shove/.34);state=kind==='kick'||kind==='barge'||kind==='bash'?kind:'shove';
  if(kind==='kick'){hand={x:28,y:-32};angle=.15;crouch+=10;lean=direction*.12;}
  else if(kind==='barge'){hand={x:44,y:-18};angle=.9;lean=direction*.3;crouch+=4;}
  else{hand={x:50+8*Math.sin(u*Math.PI),y:-16};angle=1.15;lean=direction*.18;}
 }
 if(f.action==='feint'&&f.attack<=0){state='feint';angle=-.35;hand={x:28,y:-44};lean=-direction*.08;}
 if(f.action==='stumble'){state='stumble';hand.y+=15;lean=-direction*.1;crouch+=6;}
 if(f.exhausted){state='exhausted';hand.y+=30;angle=.8;crouch+=8;}
 if((f.recoil||0)>0){const u=smooth(f.recoil/.2);hand={x:hand.x-14*u,y:hand.y+6*u};angle=mix(angle,.15,u);lean+=-direction*.16*u;if(f.attack<=0&&(f.shove||0)<=0)state='recoil';}
 let motorStrength=f.recovery??1;
 if(f.stagger>0){state='stagger';motorStrength=0;crouch+=18;lean+=direction*.05;}
 else if(motorStrength<.95){state='get-up';const u=smooth(motorStrength);hand.y=mix(22,hand.y,u);hand.x=mix(16,hand.x,u);crouch+=20*(1-u);lean=mix(direction*.12,lean,u);}
 if(hand.y>-30)hand.x=Math.max(28,hand.x);const right={x:hand.x*direction,y:hand.y},left={x:direction*(f.guard||f.attackChoice==='bash'?34:29),y:-(f.guard?43:f.attackChoice==='bash'?28:profile.guardHeight-2)};
 return {state,progress:f.attack>0?1-f.attack/(f.attackDuration||.38):((f.shove||0)>0?1-f.shove/.34:0),motorStrength,profile,right,left,weaponAngle:direction*angle,crouch,lean};
}
export function drivePose(f,direction,movement){const pose=targetPose(f,direction,movement);f.pose=pose;prepareArms(f,pose,direction);}
