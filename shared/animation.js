import {deriveStats,GEAR} from './rules.js';
export const GROUND_Y=453,MIN_SEPARATION=58;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const profiles={
 aggressive:[2.2,32,19,3,24,.27,17],defensive:[1.35,18,25,7,37,.38,4],counterattacker:[1.55,21,21,3,32,.22,12],
 evasive:[2.65,36,16,9,22,.25,20],balanced:[1.8,25,20,2,28,.32,10],berserker:[1.65,34,29,6,20,.41,24],patient:[1.4,20,18,1,34,.36,6]
};
const swingKeys={
 dagger:{wind:[18,-20,.85],strike:[62,-16,1.35]},sword:{wind:[12,-48,-.75],strike:[66,-8,1.55]},
 axe:{wind:[2,-62,-.5],strike:[60,-2,1.42]},mace:{wind:[6,-56,-.35],strike:[56,2,1.68]},claymore:{wind:[-2,-58,-1.05],strike:[78,-14,1.95]},spear:{wind:[14,-18,1.12],strike:[74,-24,1.52]},flail:{wind:[6,-54,-1.15],strike:[60,-10,1.95]},warhammer:{wind:[0,-68,-.85],strike:[64,4,1.85]},halberd:{wind:[-2,-52,-.98],strike:[74,-4,1.55]},rapier:{wind:[26,-30,1.05],strike:[86,-28,1.55]},twinSwords:{wind:[18,-42,-.55],strike:[62,-14,1.78]}
};
export function dampedStep(state,target,dt,omega=45,maxSpeed=650){const e=state.value-target,v=state.velocity,c=v+omega*e,decay=Math.exp(-omega*dt);let next=target+(e+c*dt)*decay,velocity=(v-omega*c*dt)*decay;const change=clamp(next-state.value,-maxSpeed*dt,maxSpeed*dt);if(change!==next-state.value){next=state.value+change;velocity=change/dt;}return {value:next,velocity:clamp(velocity,-maxSpeed,maxSpeed)};}
export function motionProfile(build,staminaFraction=1){const d=deriveStats(build),s=build.stats,tired=staminaFraction<.18,weight=1/(1+d.weight*.022);return {cadence:(.65+s.speed*.11)*weight*(tired?.56:1),windupScale:(1.3-s.speed*.045)*(1+d.weight*.012)*(tired?1.5:1),impulse:(.008+s.strength*.004),swing:.75+s.strength*.055,weight,tired};}
export function poseProfile(build){const [cadence,stride,stance,crouch,guardHeight,windup,lunge]=profiles[build.style];const weight=deriveStats(build).weight;const motion=motionProfile(build);const factor=motion.weight;return {cadence:cadence*motion.cadence,stride:stride*factor*(.8+build.stats.speed*.05),stance,crouch,guardHeight,windup:Math.min(.48,windup+weight*.002),lunge:lunge*factor};}
export function targetPose(f,direction,movement){
 const profile=poseProfile(f.build),motion=motionProfile(f.build,f.stamina/f.derived.maxStamina),phase=f.gait?.phase||0,bob=Math.sin(phase*Math.PI*2)*2;
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
function rotate(x,y,a){const c=Math.cos(a),s=Math.sin(a);return {x:x*c-y*s,y:x*s+y*c};}
function add(a,b){return {x:a.x+b.x,y:a.y+b.y};}
function sub(a,b){return {x:a.x-b.x,y:a.y-b.y};}
function mag(v){return Math.hypot(v.x,v.y);}
function reachable(hand,origin,length=77){const d=sub(hand,origin),r=mag(d);return r>length?add(origin,{x:d.x*length/r,y:d.y*length/r}):hand;}
function twoBone(origin,hand,upper=40,lower=38,dir=1){
 const d=sub(hand,origin);let dist=clamp(mag(d),4,upper+lower-2);const ux=d.x/Math.max(1e-6,mag(d)),uy=d.y/Math.max(1e-6,mag(d));
 const reach=add(origin,{x:ux*dist,y:uy*dist});
 const mid=add(origin,{x:ux*dist*.5,y:uy*dist*.5});
 const height=Math.sqrt(Math.max(0,upper*upper-dist*dist/4));
 const elbow=add(mid,{x:-uy*height*dir,y:ux*height*dir});
 return {elbow,hand:reach};
}
function segment(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,a:Math.atan2(a.x-b.x,b.y-a.y)};}
function aabb(x,y,w,h){return {min:{x:x-w/2,y:y-h/2},max:{x:x+w/2,y:y+h/2}};}
export function createPart(label,x,y,a,w,h){return {label,x,y,a,w,h,position:{x,y},angle:a,velocity:{x:0,y:0},angularVelocity:0,isStatic:true,bounds:aabb(x,y,w,h)};}
export function writePart(p,x,y,a,dt=1/30){if(!p)return;const px=p.x,py=p.y,pa=p.a;p.x=x;p.y=y;p.a=a;p.position.x=x;p.position.y=y;p.angle=a;p.velocity={x:dt>0?(x-px)/dt:0,y:dt>0?(y-py)/dt:0};p.angularVelocity=dt>0?wrap(a-pa)/dt:0;p.bounds=aabb(x,y,p.w,p.h);}
function filterToward(anim,key,target,dt,angle=false,omega=48,maxSpeed=650){const s=anim.states[key]||{value:target,velocity:0};if(angle)target=s.value+wrap(target-s.value);const next=dampedStep(s,target,dt,omega,maxSpeed);anim.states[key]=next;return next.value;}
export function buildSkeleton(f,pose){
 const dir=f.facing,rootX=f.rootX,crouch=pose.crouch||0,lean=pose.lean||0,bob=Math.sin((f.gait?.phase||0)*Math.PI*2)*2;
 const torso={x:rootX,y:330+crouch*.35+bob,a:lean},pelvis={x:rootX+Math.sin(lean)*6,y:367+crouch*.2+bob,a:lean*.2},head={x:rootX+Math.sin(lean)*10,y:torso.y-54,a:lean*.45};
 const profile=pose.profile||poseProfile(f.build),phase=f.gait?.phase||0,movement=f.movement||0;
 const out={torso,pelvis,head};
 let planted=false;
 for(const [side,sign,off] of [['L',-1,0],['R',1,.5]]){
  const hip=add(pelvis,rotate(sign*10,5,pelvis.a));
  const walk=(phase+off)%1,stance=walk<.58;
  let foot;
  if(stance){foot={x:hip.x+sign*profile.stance*.15+movement*profile.stride*.08,y:GROUND_Y,a:lean*.05};planted=true;}
  else{const swing=(walk-.58)/.42;foot={x:hip.x+sign*profile.stance*.5+movement*profile.stride*(-.6+1.8*swing),y:GROUND_Y-34*Math.sin(Math.PI*swing),a:-sign*movement*.08*Math.sin(Math.PI*swing)};}
  const leg=twoBone(hip,foot,44,42,dir);const knee=leg.elbow;
  out['thigh'+side]=segment(hip,knee);out['shin'+side]=segment(knee,foot);out['foot'+side]=foot;
  if(f.gait)f.gait.stance[side]=stance;
 }
 if(f.gait)f.gait.planted=planted;
 const weapon=GEAR.weapons[f.build.weapon],reach=f.derived.reach;
 const sr=add(torso,rotate(dir*12,-24,torso.a)),sl=add(torso,rotate(dir*-12,-24,torso.a));
 let right=add(torso,pose.right),left=add(torso,pose.left),angle=pose.weaponAngle,offAngle=-pose.weaponAngle*.8;
 if(weapon.dual)left=add(torso,{x:dir*(pose.state==='strike'?58:30),y:pose.state==='strike'?-34:-22});
 for(let i=0;i<3;i++){right=reachable(right,sr);if(weapon.twoHanded){left=add(right,rotate(0,-reach*.18,angle));const adjusted=reachable(left,sl);right=add(right,sub(adjusted,left));left=adjusted;}else left=reachable(left,sl);}
 for(const [side,hand,sh] of [['R',right,sr],['L',left,sl]]){const bones=twoBone(sh,hand,40,38,dir);const upper=segment(sh,bones.elbow),lower=segment(bones.elbow,bones.hand);const rel=wrap(lower.a-upper.a);if(rel<-2.6||rel>.5)lower.a=upper.a+Math.max(-2.6,Math.min(.5,rel));out['upperArm'+side]=upper;out['lowerArm'+side]=lower;out['hand'+side]={...bones.hand,a:lower.a};}
 right=out.handR;left=out.handL;const grip=rotate(0,reach*.38,angle);out.weapon={x:right.x-grip.x,y:right.y-grip.y,a:angle};
 if(weapon.dual){const g=rotate(0,reach*.38,offAngle);out.offWeapon={x:left.x-g.x,y:left.y-g.y,a:offAngle};}
 if(f.build.weapon==='flail'){const tip={x:out.weapon.x+Math.sin(angle)*reach*.45,y:out.weapon.y-Math.cos(angle)*reach*.45};const sway=Math.sin((f.gait?.phase||0)*Math.PI*2+f.attack*6)*(pose.state==='strike'?16:7);out.chain0={x:tip.x+sway*.45,y:tip.y+11,a:0};out.chain1={x:out.chain0.x+sway*.7,y:out.chain0.y+12,a:0};out.flailHead={x:out.chain1.x+sway,y:out.chain1.y+13,a:0};}
 return out;
}
export function applySkeleton(parts,pose,dt=1/30){for(const [name,src] of Object.entries(pose))if(parts[name])writePart(parts[name],src.x,src.y,src.a,dt);}
export function captureParts(parts){return Object.fromEntries(Object.entries(parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]));}
export function mixParts(parts,from,to,t,dt=1/30){for(const [k,dst] of Object.entries(parts)){const a=from[k],b=to[k];if(!a||!b)continue;writePart(dst,mix(a.x,b.x,t),mix(a.y,b.y,t),a.a+wrap(b.a-a.a)*t,dt);}}
export function updateGrips(f){if(!f.grips)return;for(const grip of f.grips){grip.pointB={x:grip.bodyA.position.x-grip.bodyB.position.x,y:grip.bodyA.position.y-grip.bodyB.position.y};}}
export function evaluateFighter(f,dt=1/30){
 f.anim??={states:{}};
 if(f.mode!=='ragdoll'&&(f.recovery??1)>0){const profile=poseProfile(f.build);f.gait.phase+=( (f.movement||0)===0?.6:profile.cadence)*(f.exhausted?.55:1)*dt;}
 let pose=targetPose(f,f.facing,f.movement||0);
 if(f.mode!=='ragdoll'&&dt>0){pose={...pose,right:{x:filterToward(f.anim,'rightX',pose.right.x,dt),y:filterToward(f.anim,'rightY',pose.right.y,dt)},left:{x:filterToward(f.anim,'leftX',pose.left.x,dt),y:filterToward(f.anim,'leftY',pose.left.y,dt)},weaponAngle:filterToward(f.anim,'weaponA',pose.weaponAngle,dt,true,48,14),lean:filterToward(f.anim,'lean',pose.lean,dt,false,42,6),crouch:filterToward(f.anim,'crouch',pose.crouch,dt,false,40,90)};}
 f.pose=pose;
 if(f.mode==='ragdoll'){f.pose={...pose,state:'stagger',motorStrength:0};return;}
 const skeleton=buildSkeleton(f,pose);
 if(f.getUpBlend){f.getUpBlend.t+=dt;const u=smooth(clamp(f.getUpBlend.t/f.getUpBlend.duration,0,1));mixParts(f.parts,f.getUpBlend.from,skeleton,u,dt);f.mode=u>=1?'animated':'blend';if(u>=1)f.getUpBlend=null;}
 else{applySkeleton(f.parts,skeleton,dt);f.mode='animated';}
 for(const p of Object.values(f.parts))p.isStatic=true;
 updateGrips(f);
}
