import {deriveStats,GEAR} from './rules.js';
export const GROUND_Y=453,MIN_SEPARATION=58;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const overshoot=t=>{t=clamp(t,0,1);return t<.78?smooth(t/.78)*1.1:mix(1.1,1,smooth((t-.78)/.22));};
const profiles={
 aggressive:[2.2,32,19,3,24,.27,17],defensive:[1.35,18,25,7,37,.38,4],counterattacker:[1.55,21,21,3,32,.22,12],
 evasive:[2.65,36,16,9,22,.25,20],balanced:[1.8,25,20,2,28,.32,10],berserker:[1.65,34,29,6,20,.41,24],patient:[1.4,20,18,1,34,.36,6]
};
export const STYLE_STANCE={
 aggressive:{lean:.14,bounce:3.4,knees:11,guardX:40,guardY:-34,width:23,breath:2.6},
 defensive:{lean:-.05,bounce:1.3,knees:15,guardX:28,guardY:-46,width:28,breath:1.5},
 counterattacker:{lean:.03,bounce:1.9,knees:16,guardX:33,guardY:-38,width:19,breath:2.1},
 evasive:{lean:.07,bounce:4.6,knees:12,guardX:34,guardY:-30,width:17,breath:3.3},
 balanced:{lean:.05,bounce:2.2,knees:12,guardX:36,guardY:-36,width:22,breath:2.0},
 berserker:{lean:.18,bounce:3.0,knees:16,guardX:42,guardY:-24,width:26,breath:2.9},
 patient:{lean:-.03,bounce:1.05,knees:8,guardX:46,guardY:-40,width:15,breath:1.35}
};
const swingKeys={
 dagger:{wind:[18,-20,.85],strike:[62,-16,1.35]},sword:{wind:[12,-48,-.75],strike:[66,-8,1.55]},
 axe:{wind:[2,-62,-.5],strike:[60,-2,1.42]},mace:{wind:[6,-56,-.35],strike:[56,2,1.68]},claymore:{wind:[-2,-58,-1.05],strike:[78,-14,1.95]},spear:{wind:[14,-18,1.12],strike:[74,-24,1.52]},flail:{wind:[6,-54,-1.15],strike:[60,-10,1.95]},warhammer:{wind:[0,-68,-.85],strike:[64,4,1.85]},halberd:{wind:[-2,-52,-.98],strike:[74,-4,1.55]},rapier:{wind:[26,-30,1.05],strike:[86,-28,1.55]},twinSwords:{wind:[18,-42,-.55],strike:[62,-14,1.78]}
};
export function dampedStep(state,target,dt,omega=45,maxSpeed=650){const e=state.value-target,v=state.velocity,c=v+omega*e,decay=Math.exp(-omega*dt);let next=target+(e+c*dt)*decay,velocity=(v-omega*c*dt)*decay;const change=clamp(next-state.value,-maxSpeed*dt,maxSpeed*dt);if(change!==next-state.value){next=state.value+change;velocity=change/dt;}return {value:next,velocity:clamp(velocity,-maxSpeed,maxSpeed)};}
export function motionProfile(build,staminaFraction=1){const d=deriveStats(build),s=build.stats,tired=staminaFraction<.18,weight=1/(1+d.weight*.022);return {cadence:(.65+s.speed*.11)*weight*(tired?.56:1),windupScale:(1.3-s.speed*.045)*(1+d.weight*.012)*(tired?1.5:1),impulse:(.008+s.strength*.004),swing:.75+s.strength*.055,weight,tired};}
export function poseProfile(build){const [cadence,stride,stance,crouch,guardHeight,windup,lunge]=profiles[build.style];const weight=deriveStats(build).weight;const motion=motionProfile(build);const factor=motion.weight;return {cadence:cadence*motion.cadence,stride:stride*factor*(.8+build.stats.speed*.05),stance,crouch,guardHeight,windup:Math.min(.48,windup+weight*.002),lunge:lunge*factor};}
export function attackHeightOf(choice){if(choice==='sweep')return 'low';if(choice==='jumpAttack'||choice==='slam')return 'high';return 'mid';}
export function targetPose(f,direction,movement){
 const profile=poseProfile(f.build),motion=motionProfile(f.build,f.stamina/f.derived.maxStamina);
 const stance=STYLE_STANCE[f.build.style]||STYLE_STANCE.balanced;
 const phase=f.gait?.phase||0,idle=f.gait?.idle||0;
 const bob=Math.sin(idle*stance.breath*Math.PI*2)*stance.bounce*.45+Math.sin(phase*Math.PI*2)*1.1;
 let state=Math.abs(movement)<.12?'guard':movement*direction>0?'advance':'retreat';
 let hand={x:stance.guardX,y:stance.guardY+bob},angle=.42,lean=stance.lean*direction,crouch=profile.crouch+stance.knees+(f.exhausted?14:0);
 if(f.guardLevel==='low'){crouch+=14;hand={x:30,y:-8};angle=.95;state=f.guard?'block':'crouch';}
 if(f.guard&&f.guardLevel!=='low'){state='block';hand={x:stance.guardX-4,y:stance.guardY-4};angle=.18;}
 if((f.dash||0)>0){state=(f.dashDir||direction)*direction>0?'dash':'backdash';lean=direction*(f.dashDir||direction)*direction*.32;hand={x:38,y:-30};crouch+=4;}
 if((f.airborne||0)>0){state=(f.attack>0&&(f.attackChoice==='jumpAttack'||f.attackHeight==='high'))?'jumpAttack':'jump';crouch-=6;lean=direction*.08;}
 if(f.action==='dodge'||f.action==='roll'||(f.build.style==='evasive'&&movement*direction<0&&(f.shove||0)<=0&&f.attack<=0&&(f.airborne||0)<=0)){state='dodge';hand={x:22,y:f.action==='roll'?-8:-20};angle=.75;lean=-direction*(f.action==='roll'?.28:.18);if(f.action==='roll')crouch+=16;}
 if(f.attack>0){const duration=f.attackDuration||.38,progress=clamp(1-f.attack/duration,0,1),choice=f.attackChoice||'normal',keys=swingKeys[f.build.weapon]||swingKeys.sword;let a,b,t;
  if(choice==='sweep'){if(progress<profile.windup){state='wind-up';a=[stance.guardX,stance.guardY,.42];b=[24,18,1.55];t=smooth(progress/profile.windup);lean=-direction*.1*t;crouch+=10*t;}
   else if(progress<.72){state='strike';a=[24,18,1.55];b=[78,22,1.85];t=overshoot((progress-profile.windup)/(.72-profile.windup));lean=direction*.16*t;crouch+=16;}
   else{state='recovery';a=[78,22,1.85];b=[stance.guardX,stance.guardY,.42];t=smooth((progress-.72)/.28);crouch+=12*(1-t);}}
  else if(choice==='slam'||choice==='jumpAttack'){if(progress<profile.windup){state='wind-up';a=[stance.guardX,stance.guardY,.42];b=[-16,-72,-1.85];t=smooth(progress/profile.windup);lean=-direction*.12*t;}
   else if(progress<.72){state='strike';a=[-16,-72,-1.85];b=[70,6,1.72];t=overshoot((progress-profile.windup)/(.72-profile.windup));lean=direction*.22*Math.sin(t*Math.PI);}
   else{state='recovery';a=[70,6,1.72];b=[stance.guardX,stance.guardY,.42];t=smooth((progress-.72)/.28);}}
  else if(choice==='disarm'){if(progress<profile.windup){state='wind-up';a=[stance.guardX,stance.guardY,.42];b=[8,-56,-.4];t=smooth(progress/profile.windup);}
   else if(progress<.72){state='strike';a=[8,-56,-.4];b=[74,-18,1.35];t=overshoot((progress-profile.windup)/(.72-profile.windup));lean=direction*.14*t;}
   else{state='recovery';a=[74,-18,1.35];b=[stance.guardX,stance.guardY,.42];t=smooth((progress-.72)/.28);}}
  else{if(progress<profile.windup){state='wind-up';a=[stance.guardX,stance.guardY,.42];b=keys.wind;t=smooth(progress/profile.windup);lean=-direction*.1*t;}
   else if(progress<.72){state='strike';a=keys.wind;b=keys.strike;t=overshoot((progress-profile.windup)/(.72-profile.windup));lean=direction*.14*Math.sin(t*Math.PI);}
   else{state='recovery';const follow=[keys.strike[0]+12,keys.strike[1]+8,keys.strike[2]+.2];const u=(progress-.72)/.28;if(u<.4){a=keys.strike;b=follow;t=smooth(u/.4);}else{a=follow;b=[stance.guardX,stance.guardY,.42];t=smooth((u-.4)/.6);}}}
  hand={x:mix(a[0],b[0],t)+(state==='strike'?profile.lunge*motion.swing*Math.sin(t*Math.PI):0),y:mix(a[1],b[1],t)};angle=mix(a[2],b[2],t)*(.85+f.build.stats.strength*.04);
  if(f.attackTier==='light'&&state==='strike'){hand.x*=.9;angle=mix(angle,1.15,.25);}
  if(f.attackTier==='heavy'&&state==='wind-up'){hand.y-=8;angle-=.2;}
  if(choice==='thrust'){hand.x+=16*Math.sin(progress*Math.PI);angle=mix(angle,1.45,.55);}
  if(choice==='spin'){angle+=Math.sin(progress*Math.PI*2)*1.1;hand.x+=8*Math.sin(progress*Math.PI);}
  if(choice==='lunge'){hand.x+=18*Math.sin(Math.min(1,progress/.75)*Math.PI);lean=direction*.2;crouch+=3;}
  if(choice==='combo'&&state==='strike'){hand.x+=10*Math.sin(progress*Math.PI*4);angle+=.35*Math.sin(progress*Math.PI*4);}
  if(choice==='charge'){hand.x+=14;lean=direction*.26;crouch+=2;}
  if(choice==='dart'){hand.x+=8;lean=direction*.1;}
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
 if(hand.y>-30)hand.x=Math.max(28,hand.x);const right={x:hand.x*direction,y:hand.y},left={x:direction*(f.guard||f.attackChoice==='bash'?34:29),y:f.guard&&f.guardLevel!=='low'?-43:f.attackChoice==='bash'?-28:stance.guardY+4};
 return {state,progress:f.attack>0?1-f.attack/(f.attackDuration||.38):((f.shove||0)>0?1-f.shove/.34:0),motorStrength,profile,right,left,weaponAngle:direction*angle,crouch,lean,stance};
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
 const dir=f.facing,rootX=f.rootX,crouch=pose.crouch||0,lean=pose.lean||0,hop=f.hopOffset||0;
 const idle=f.gait?.idle||0,phase=f.gait?.phase||0,stance=pose.stance||STYLE_STANCE[f.build.style]||STYLE_STANCE.balanced;
 const bob=Math.sin(idle*stance.breath*Math.PI*2)*stance.bounce*.35;
 const hipShift=Math.sin(phase*Math.PI*2)*4*(Math.abs(f.rootSpeed||0)>12?1:.25);
 const torso={x:rootX,y:330+crouch*.35+bob-hop,a:lean},pelvis={x:rootX+Math.sin(lean)*8+hipShift,y:367+crouch*.22+bob-hop,a:-lean*.35},head={x:rootX+Math.sin(lean)*12+hipShift*.15,y:torso.y-54,a:lean*.35+Math.sin(idle*4)*.03};
 const profile=pose.profile||poseProfile(f.build),speed=f.rootSpeed??((f.movement||0)*(f.derived?.moveSpeed||120));
 const out={torso,pelvis,head};
 f.gait??={phase:0,idle:0,planted:false,stance:{L:false,R:false},plantX:{L:null,R:null},swingFrom:{L:null,R:null}};
 f.gait.plantX??={L:null,R:null};f.gait.swingFrom??={L:null,R:null};
 const airborne=(f.airborne||0)>0;let planted=false;
 const step=Math.max(-72,Math.min(72,speed/Math.max(.45,profile.cadence)));
 const idleFeet=Math.abs(speed)<14&&!(f.dash>0)&&!airborne;
 for(const [side,sign,off] of [['L',-1,0],['R',1,.5]]){
  const hip=add(pelvis,rotate(sign*(stance.width*.45+4),5,pelvis.a));
  let foot;
  if(airborne){f.gait.plantX[side]=null;f.gait.swingFrom[side]=null;f.gait.stance[side]=false;foot={x:hip.x+sign*10+dir*8,y:GROUND_Y-22-hop*.35,a:dir*.15};}
  else if((f.dash||0)>0){f.gait.plantX[side]=null;f.gait.swingFrom[side]=null;f.gait.stance[side]=false;foot={x:hip.x+sign*stance.width*.6+(f.dashDir||dir)*14,y:GROUND_Y-8,a:(f.dashDir||dir)*.12};}
  else if(idleFeet){const rest=rootX+sign*stance.width;if(f.gait.plantX[side]==null)f.gait.plantX[side]=rest;const drift=rest-f.gait.plantX[side];if(Math.abs(drift)>28){f.gait.stance[side]=false;f.gait.plantX[side]+=Math.sign(drift)*Math.min(Math.abs(drift),24);foot={x:f.gait.plantX[side],y:GROUND_Y-12,a:0};}else{if(Math.abs(drift)>.4)f.gait.plantX[side]+=Math.sign(drift)*Math.min(Math.abs(drift),1.2);foot={x:f.gait.plantX[side],y:GROUND_Y,a:lean*.04};planted=true;f.gait.stance[side]=true;}}
  else{const walk=(phase+off)%1,on=walk<.56;
   if(on){if(f.gait.plantX[side]==null){const from=f.gait.swingFrom[side];f.gait.plantX[side]=from!=null?from+step:hip.x+sign*stance.width*.4;}f.gait.swingFrom[side]=null;foot={x:f.gait.plantX[side],y:GROUND_Y,a:lean*.04};planted=true;}
   else{if(f.gait.swingFrom[side]==null)f.gait.swingFrom[side]=f.gait.plantX[side]??(hip.x+sign*stance.width*.4);const swing=(walk-.56)/.44,dest=f.gait.swingFrom[side]+step;foot={x:mix(f.gait.swingFrom[side],dest,smooth(swing)),y:GROUND_Y-20*Math.sin(Math.PI*swing),a:-sign*Math.sign(step||1)*.1*Math.sin(Math.PI*swing)};f.gait.plantX[side]=dest;}
   f.gait.stance[side]=on;
  }
  const leg=twoBone(hip,foot,44,42,dir);const knee=leg.elbow,placed=leg.hand;
  out['thigh'+side]=segment(hip,knee);out['shin'+side]=segment(knee,placed);out['foot'+side]={...placed,a:foot.a||0};
 }
 f.gait.planted=planted;
 const weaponId=f.held||f.build.weapon,weapon=GEAR.weapons[weaponId]||GEAR.weapons.dagger,reach=f.derived.reach;
 const sr=add(torso,rotate(dir*12,-24,torso.a)),sl=add(torso,rotate(dir*-12,-24,torso.a));
 let right=add(torso,pose.right),left=add(torso,pose.left),angle=pose.weaponAngle,offAngle=-pose.weaponAngle*.8;
 if(weapon.dual)left=add(torso,{x:dir*(pose.state==='strike'?58:30),y:pose.state==='strike'?-34:-22});
 for(let i=0;i<3;i++){right=reachable(right,sr);if(weapon.twoHanded){left=add(right,rotate(0,-reach*.18,angle));const adjusted=reachable(left,sl);right=add(right,sub(adjusted,left));left=adjusted;}else left=reachable(left,sl);}
 for(const [side,hand,sh] of [['R',right,sr],['L',left,sl]]){const bones=twoBone(sh,hand,40,38,dir);const upper=segment(sh,bones.elbow),lower=segment(bones.elbow,bones.hand);const rel=wrap(lower.a-upper.a);if(rel<-2.6||rel>.5)lower.a=upper.a+Math.max(-2.6,Math.min(.5,rel));out['upperArm'+side]=upper;out['lowerArm'+side]=lower;out['hand'+side]={...bones.hand,a:lower.a};}
 right=out.handR;left=out.handL;const grip=rotate(0,reach*.38,angle);out.weapon={x:right.x-grip.x,y:right.y-grip.y,a:angle};
 if(weapon.dual){const g=rotate(0,reach*.38,offAngle);out.offWeapon={x:left.x-g.x,y:left.y-g.y,a:offAngle};}
 if(weaponId==='flail'){const tip={x:out.weapon.x+Math.sin(angle)*reach*.45,y:out.weapon.y-Math.cos(angle)*reach*.45};const sway=Math.sin((f.gait?.phase||0)*Math.PI*2+f.attack*6)*(pose.state==='strike'?16:7);out.chain0={x:tip.x+sway*.45,y:tip.y+11,a:0};out.chain1={x:out.chain0.x+sway*.7,y:out.chain0.y+12,a:0};out.flailHead={x:out.chain1.x+sway,y:out.chain1.y+13,a:0};}
 return out;
}
export function applySkeleton(parts,pose,dt=1/30){for(const [name,src] of Object.entries(pose))if(parts[name])writePart(parts[name],src.x,src.y,src.a,dt);}
export function captureParts(parts){return Object.fromEntries(Object.entries(parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]));}
export function mixParts(parts,from,to,t,dt=1/30){for(const [k,dst] of Object.entries(parts)){const a=from[k],b=to[k];if(!a||!b)continue;writePart(dst,mix(a.x,b.x,t),mix(a.y,b.y,t),a.a+wrap(b.a-a.a)*t,dt);}}
export function updateGrips(f){if(!f.grips)return;for(const grip of f.grips){grip.pointB={x:grip.bodyA.position.x-grip.bodyB.position.x,y:grip.bodyA.position.y-grip.bodyB.position.y};}}
export function evaluateFighter(f,dt=1/30){
 f.anim??={states:{}};f.gait??={phase:0,idle:0,planted:false,stance:{L:false,R:false},plantX:{L:null,R:null},swingFrom:{L:null,R:null}};
 if(f.mode!=='ragdoll'&&(f.recovery??1)>0){const profile=poseProfile(f.build);const moving=Math.abs(f.rootSpeed??((f.movement||0)*(f.derived?.moveSpeed||120)))>12;f.gait.phase+=(moving?profile.cadence:.55)*(f.exhausted?.55:1)*dt;f.gait.idle+=dt;}
 if((f.airborne||0)>0){const dur=f.jumpDuration||.42;const u=clamp(1-f.airborne/dur,0,1);f.hopOffset=78*4*u*(1-u);}else f.hopOffset=0;
 let pose=targetPose(f,f.facing,f.movement||0);
 const busy=pose.state==='strike'||pose.state==='wind-up';
 if(f.mode!=='ragdoll'&&dt>0){pose={...pose,right:{x:filterToward(f.anim,'rightX',pose.right.x,dt,false,busy?62:36),y:filterToward(f.anim,'rightY',pose.right.y,dt,false,busy?62:36)},left:{x:filterToward(f.anim,'leftX',pose.left.x,dt,false,busy?50:36),y:filterToward(f.anim,'leftY',pose.left.y,dt,false,busy?50:36)},weaponAngle:filterToward(f.anim,'weaponA',pose.weaponAngle,dt,true,busy?64:40,16),lean:filterToward(f.anim,'lean',pose.lean,dt,false,36,6),crouch:filterToward(f.anim,'crouch',pose.crouch,dt,false,36,90)};}
 f.pose=pose;
 if(f.mode==='ragdoll'){f.pose={...pose,state:'stagger',motorStrength:0};return;}
 const skeleton=buildSkeleton(f,pose);
 if(f.getUpBlend){f.getUpBlend.t+=dt;const u=smooth(clamp(f.getUpBlend.t/f.getUpBlend.duration,0,1));mixParts(f.parts,f.getUpBlend.from,skeleton,u,dt);f.mode=u>=1?'animated':'blend';if(u>=1)f.getUpBlend=null;}
 else{applySkeleton(f.parts,skeleton,dt);f.mode='animated';}
 for(const p of Object.values(f.parts))p.isStatic=true;
 updateGrips(f);
}
