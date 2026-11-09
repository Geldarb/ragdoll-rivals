import Matter from 'matter-js';const {Body,Vector}=Matter;const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function project(child,parent,min,max){const a=wrap(child.angle-parent.angle),target=clamp(a,min,max);if(a!==target){Body.setAngle(child,parent.angle+target);Body.setAngularVelocity(child,clamp(child.angularVelocity,-.18,.18));}}
export function limitJoints(f,dir){
 const p=f.parts;
 for(const side of ['L','R']){if(!f.armMotion)project(p['lowerArm'+side],p['upperArm'+side],dir>0?-2.35:-.2,dir>0?.2:2.35);else if(f.armMotion.mode==='physical'){const child=p['lowerArm'+side],parent=p['upperArm'+side],relative=wrap(child.angle-parent.angle),target=clamp(relative,dir>0?-2.35:-.2,dir>0?.2:2.35);if(relative!==target)child.torque=clamp(child.torque+child.inertia*((target-relative)*400-child.angularVelocity*2400)/1e6,-child.inertia*.0012,child.inertia*.0012);}project(p['thigh'+side],p.pelvis,-1.25,1.25);project(p['shin'+side],p['thigh'+side],-.15,1.95);
  if(!f.armMotion&&f.stagger<=0){for(const name of ['hand'+side,'lowerArm'+side]){const b=p[name],local=Vector.rotate(Vector.sub(b.position,p.torso.position),-p.torso.angle);if(local.y>-28&&local.y<35&&Math.abs(local.x)<23){Body.applyForce(b,b.position,{x:dir*.035,y:-.008});}}}
 }
}
export function separateFighters(a,b){const dx=b.parts.torso.position.x-a.parts.torso.position.x,gap=Math.abs(dx);if(gap>=92)return;const sign=dx>=0?1:-1,force=Math.min(.075,(92-gap)*.0018);for(const [f,s]of [[a,-sign],[b,sign]])Body.applyForce(f.parts.torso,f.parts.torso.position,{x:force*s,y:0});}
