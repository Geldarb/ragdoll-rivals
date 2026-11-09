import {drawBody,drawBackdrop,drawGround,drawWeapon} from './art.js';
export function cameraTarget(fighters,w,h){
 const xs=[];
 for(const f of fighters||[]){
  if(!f?.parts?.torso)continue;
  xs.push(f.parts.torso.x);
  if(f.parts.weapon)xs.push(f.parts.weapon.x);
  if(f.parts.head)xs.push(f.parts.head.x);
 }
 if(!xs.length)return {x:450,y:340,zoom:1};
 const lo=Math.min(...xs),hi=Math.max(...xs);
 return {x:(lo+hi)/2,y:340,zoom:Math.min(1.85,w/(hi-lo+210),h/340)};
}
export class ArenaPresentation{
 constructor(audio){this.audio=audio;this.reset();}
 reset(){this.camera=null;this.effects=[];this.seen=new Set();this.shakeUntil=0;this.punchUntil=0;this.helmetsOff=new Set();this.weaponsOff=new Map();}
 ingest(frame,now){for(const e of frame.events||[]){if(e.type!=='hit'&&e.type!=='disarm')continue;const key=`${e.tick}:${e.a}:${e.type}`;if(this.seen.has(key))continue;this.seen.add(key);if(this.seen.size>150)this.seen.delete(this.seen.values().next().value);this.effects.push({...e,born:now});if(e.type==='hit'){this.audio.hit(e);if(e.amount>=22&&!e.blocked){this.shakeUntil=now+200;this.punchUntil=now+140;}if(e.debris==='helmet')this.helmetsOff.add(1-e.a);if(e.debris==='weapon')this.weaponsOff.set(1-e.a,now+1000);}if(e.type==='disarm')this.punchUntil=Math.max(this.punchUntil,now+160);}}
 draw(c,frame,meta,w,h,now,replay=false){const target=frame?cameraTarget(frame.fighters,w,h):{x:450,y:350,zoom:1};if(!this.camera)this.camera=target;const k=.13;for(const key of ['x','y','zoom'])this.camera[key]+=(target[key]-this.camera[key])*k;const cam=this.camera;drawBackdrop(c,w,h,cam.x);const shake=!replay&&now<this.shakeUntil?(this.shakeUntil-now)/200*3:0;const punch=!replay&&now<this.punchUntil?0.05*(this.punchUntil-now)/140:0;c.save();c.translate(w/2+Math.sin(now*.17)*shake,h*.57+Math.cos(now*.13)*shake);c.scale(cam.zoom*(1+punch),cam.zoom*(1+punch));c.translate(-cam.x,-cam.y);drawGround(c);
 if(frame){for(const item of frame.loot||[])drawWeapon(c,{x:item.x,y:item.y,a:item.a||0},item.weapon);for(const [i,pose]of frame.fighters.entries()){c.save();if(pose.flash)c.globalAlpha=.78;const held=pose.held||meta[i]?.build?.weapon;drawBody(c,{...pose,...meta[i],build:{...meta[i]?.build,weapon:held},held,facing:i===0?1:-1,helmetOff:this.helmetsOff.has(i),weaponOff:(this.weaponsOff.get(i)||0)>now&&!pose.disarmed});c.restore();}}
 this.effects=this.effects.filter(e=>now-e.born<1000);for(const e of this.effects){const age=(now-e.born)/1000;if(age<.35){for(let i=0;i<8;i++){const angle=i*2.4+e.tick;c.fillStyle=e.blocked?'#ffe7a0':i<3?'#b24733':'#e7ba64';c.beginPath();c.arc(e.x+Math.cos(angle)*age*120,e.y+Math.sin(angle)*age*100+age*age*130,2*(1-age),0,Math.PI*2);c.fill();}}
 c.globalAlpha=Math.max(0,1-age);c.font='bold 14px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#242d26';c.fillStyle=e.blocked?'#ffe3a3':'#fff5d9';const text=e.type==='disarm'?'DISARM':e.blocked?'PARRY':`−${e.amount}`;c.strokeText(text,e.x,e.y-25-age*35);c.fillText(text,e.x,e.y-25-age*35);
 if(e.debris){const x=e.x+Math.cos(e.tick)*age*140,y=e.y-age*160+age*age*220;c.save();c.translate(x,y);c.rotate(age*9);if(e.debris==='helmet'){c.fillStyle='#a7b8b2';c.strokeStyle='#253b34';c.beginPath();c.arc(0,0,17,Math.PI,Math.PI*2);c.lineTo(17,5);c.lineTo(-17,5);c.closePath();c.fill();c.stroke();}else drawWeapon(c,{x:0,y:0,a:0},meta[1-e.a].build.weapon);c.restore();}c.globalAlpha=1;}
 c.restore();if(replay){c.fillStyle='#f6e6bb';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('FINAL BLOW · SLOW-MOTION REPLAY',w/2,22);}}
}
