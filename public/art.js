import {GEAR} from './rules.js';
const ink='#202522',gold='#d5af5f',steel='#b7c7c6';
function path(c,points,fill,stroke=ink,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
function limb(c,a,b,width,colour){c.lineCap='round';for(const [w,col]of [[width+4,ink],[width,colour],[Math.max(2,width*.22),'#ffffff28']]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}}
function circle(c,x,y,r,colour){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=colour;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();}
function metal(c,x,y,w,h){const g=c.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#566a6c');g.addColorStop(.4,'#dce4db');g.addColorStop(1,'#899b9b');c.fillStyle=g;c.fillRect(x,y,w,h);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(x,y,w,h);}
export function drawWeapon(c,w,id,off=false){if(!w||!id||!GEAR.weapons[id])return;const r=GEAR.weapons[id].reach;c.save();c.translate(w.x,w.y);c.rotate(w.a||0);
 const wood='#6b4428',wrap='#8b5a32',blade=off?'#d1d9c2':steel;
 function shaft(y1,y2,width=6,colour=wood){c.fillStyle=colour;c.strokeStyle=ink;c.lineWidth=2;c.fillRect(-width/2,y1,width,y2-y1);c.strokeRect(-width/2,y1,width,y2-y1);}
 function grip(y1,y2,width=7){shaft(y1,y2,width,wrap);c.strokeStyle='#c19b68';for(let y=y1+3;y<y2;y+=5){c.beginPath();c.moveTo(-width/2,y);c.lineTo(width/2,y+2);c.stroke();}}
 function guardBar(half=18,y=r*.08,h=5){metal(c,-half,y,half*2,h);}
 if(id==='claymore'){
  const tip=-r*.48,lugs=-r*.05,grd=r*.10,gripEnd=r*.40,pom=r*.46;
  path(c,[[-10,grd],[-9,lugs],[-6.5,tip+r*.12],[0,tip],[6.5,tip+r*.12],[9,lugs],[10,grd]],blade);
  c.strokeStyle='#f3f7ee';c.lineWidth=1.6;c.beginPath();c.moveTo(0,lugs+2);c.lineTo(0,tip+r*.14);c.stroke();
  path(c,[[-8,grd],[-8,lugs],[8,lugs],[8,grd]],'#c5cdc4');
  path(c,[[-8,lugs+3],[-22,lugs-7],[-25,lugs+1],[-8,lugs+12]],steel);
  path(c,[[8,lugs+3],[22,lugs-7],[25,lugs+1],[8,lugs+12]],steel);
  metal(c,-32,grd-5,64,10);
  path(c,[[-32,grd-5],[-38,grd-10],[-30,grd+6],[-22,grd+4]],steel);
  path(c,[[32,grd-5],[38,grd-10],[30,grd+6],[22,grd+4]],steel);
  grip(grd+6,gripEnd,8);circle(c,0,pom,8,gold);circle(c,0,pom,3.2,'#efe1a4');
 }else if(id==='spear'){
  shaft(-r*.36,r*.46,6);grip(r*.22,r*.40,7);
  path(c,[[0,-r*.50],[-9,-r*.35],[0,-r*.27],[9,-r*.35]],blade);
  metal(c,-11,-r*.36,22,4);circle(c,0,r*.48,4,'#4a2f1c');
 }else if(id==='halberd'){
  shaft(-r*.32,r*.46,6);grip(r*.18,r*.40,7);
  path(c,[[3,-r*.34],[34,-r*.38],[36,-r*.18],[16,-r*.06],[3,-r*.16]],blade);
  path(c,[[0,-r*.52],[-8,-r*.34],[8,-r*.34]],blade);
  path(c,[[-2,-r*.20],[-24,-r*.10],[-20,-r*.02],[-2,-r*.10]],steel);
  c.strokeStyle='#eff8ec';c.beginPath();c.moveTo(32,-r*.36);c.lineTo(34,-r*.20);c.stroke();circle(c,0,r*.48,4,'#4a2f1c');
 }else if(id==='warhammer'){
  shaft(-r*.30,r*.42,7);grip(r*.14,r*.36,8);
  metal(c,-26,-r*.42,40,22);path(c,[[14,-r*.42],[32,-r*.36],[32,-r*.26],[14,-r*.20]],'#738b8c');
  path(c,[[-26,-r*.32],[-38,-r*.31],[-38,-r*.29],[-26,-r*.28]],steel);circle(c,0,r*.46,5,'#4a2f1c');
 }else if(id==='dagger'){
  path(c,[[-3.5,r*.10],[-3.2,-r*.28],[0,-r*.48],[3.2,-r*.28],[3.5,r*.10]],blade);
  c.strokeStyle='#f0f6e9';c.beginPath();c.moveTo(0,r*.06);c.lineTo(0,-r*.36);c.stroke();
  guardBar(10,r*.09,4);grip(r*.14,r*.34,6);circle(c,0,r*.40,3.5,gold);
 }else if(id==='sword'){
  path(c,[[-5.5,r*.08],[-5,-r*.32],[0,-r*.50],[5,-r*.32],[5.5,r*.08]],blade);
  c.strokeStyle='#f0f6e9';c.beginPath();c.moveTo(0,r*.04);c.lineTo(0,-r*.38);c.stroke();
  guardBar(16,r*.07,5);grip(r*.13,r*.36,6.5);circle(c,0,r*.42,4.5,gold);
 }else if(id==='rapier'){
  path(c,[[-2.2,r*.06],[-2,-r*.36],[0,-r*.50],[2,-r*.36],[2.2,r*.06]],blade);
  c.strokeStyle='#f0f6e9';c.beginPath();c.moveTo(0,r*.02);c.lineTo(0,-r*.40);c.stroke();
  c.beginPath();c.ellipse(0,r*.16,13,9,-.15,0,Math.PI*2);c.lineWidth=3;c.strokeStyle=gold;c.stroke();
  grip(r*.20,r*.38,5);circle(c,0,r*.44,3.6,gold);
 }else if(id==='twinSwords'){
  path(c,[[-4.5,r*.08],[-4,-r*.30],[0,-r*.48],[4,-r*.30],[4.5,r*.08]],blade);
  c.strokeStyle='#f0f6e9';c.beginPath();c.moveTo(0,r*.04);c.lineTo(0,-r*.36);c.stroke();
  guardBar(13,r*.07,4);grip(r*.12,r*.34,6);circle(c,0,r*.40,4,gold);
 }else if(id==='axe'){
  shaft(-r*.28,r*.40,6);grip(r*.16,r*.36,7);
  path(c,[[3,-r*.36],[30,-r*.40],[32,-r*.16],[14,-r*.02],[3,-r*.14]],blade);
  c.strokeStyle='#eff8ec';c.beginPath();c.moveTo(29,-r*.36);c.lineTo(30,-r*.18);c.lineTo(16,-r*.06);c.stroke();circle(c,0,r*.44,4,'#4a2f1c');
 }else if(id==='mace'){
  shaft(-r*.24,r*.38,6);grip(r*.14,r*.34,7);circle(c,0,-r*.34,13,'#819494');
  for(let i=0;i<6;i++){c.save();c.translate(0,-r*.34);c.rotate(i*Math.PI/3);path(c,[[9,-4],[18,0],[9,4]],steel);c.restore();}
  circle(c,0,r*.44,4,'#4a2f1c');
 }else if(id==='flail'){
  shaft(r*.02,r*.40,7);grip(r*.10,r*.34,7);metal(c,-5,-r*.42,10,r*.46);circle(c,0,r*.46,4.5,'#4a2f1c');
 }else{
  path(c,[[-5,r*.08],[-5,-r*.32],[0,-r*.48],[5,-r*.32],[5,r*.08]],blade);
  guardBar(14,r*.07,4);grip(r*.12,r*.36,6);circle(c,0,r*.44,4,gold);
 }
 c.restore();}
function arm(c,f,side){const p=f.parts,t=p.torso,dir=f.facing||1,a=t.a||0,xx=dir*(side==='R'?12:-12),shoulder={x:t.x+xx*Math.cos(a)+24*Math.sin(a),y:t.y+xx*Math.sin(a)-24*Math.cos(a)},u=p['upperArm'+side],h=p['hand'+side];if(!u||!h)return;const elbow={x:u.x-Math.sin(u.a||0)*20,y:u.y+Math.cos(u.a||0)*20},b=f.build;
 limb(c,shoulder,elbow,12,b.appearance.cloth);limb(c,elbow,h,10,b.appearance.skin);circle(c,elbow.x,elbow.y,6,b.armour==='plate'?steel:'#674732');circle(c,h.x,h.y,6,'#63452f');if(b.armour==='plate'||b.armour==='mail'){const mid={x:(elbow.x+h.x)/2,y:(elbow.y+h.y)/2};limb(c,mid,{x:mid.x+(h.x-elbow.x)*.20,y:mid.y+(h.y-elbow.y)*.20},11,'#91a4a4');}}
export function drawBody(c,f){const p=f.parts,b=f.build;if(!p?.torso||!p?.head)return;const t=p.torso;c.save();
 c.fillStyle='#101c1735';c.beginPath();c.ellipse(t.x,457,34,5,0,0,Math.PI*2);c.fill();
 for(const side of ['L','R']){const thigh=p['thigh'+side],shin=p['shin'+side],foot=p['foot'+side];if(!thigh||!shin)continue;const knee={x:thigh.x-Math.sin(thigh.a||0)*22,y:thigh.y+Math.cos(thigh.a||0)*22};limb(c,p.pelvis,knee,15,b.armour==='plate'?'#889b9a':'#3d4140');limb(c,knee,foot||shin,11,b.armour==='plate'?'#a8b8b4':'#584636');circle(c,knee.x,knee.y,7,b.armour==='plate'?steel:'#776548');if(foot){c.save();c.translate(foot.x,foot.y);c.rotate(foot.a||0);path(c,[[-13,-6],[9,-6],[17,1],[15,5],[-13,5]],'#3b3027');c.restore();}}
 arm(c,f,'L');limb(c,{x:t.x,y:t.y-30},p.head,13,b.appearance.skin);
 c.save();c.translate(t.x,t.y);c.rotate(t.a||0);c.scale(1+(b.stats.vitality-4)*.009,1);
 const cloth=c.createLinearGradient(-20,0,20,0);cloth.addColorStop(0,b.appearance.cloth);cloth.addColorStop(.5,b.appearance.cloth);cloth.addColorStop(1,'#343b35');path(c,[[-20,-34],[18,-34],[21,-13],[14,23],[21,41],[-21,41],[-14,23],[-22,-12]],cloth,ink,3);
 if(b.armour==='leather'){path(c,[[-17,-30],[16,-30],[17,14],[10,29],[-12,29],[-17,12]],'#805836');for(let y=-22;y<25;y+=10){circle(c,-13,y,1.5,gold);circle(c,12,y,1.5,gold);}limb(c,{x:-13,y:-27},{x:11,y:23},3,'#ba8a51');}
 if(b.armour==='mail'){path(c,[[-18,-31],[17,-31],[19,35],[-20,35]],'#7d8c88');c.strokeStyle='#354c48';c.lineWidth=1;for(let y=-25;y<31;y+=5)for(let x=-14;x<15;x+=6){c.beginPath();c.arc(x+(y%10?3:0),y,2.4,0,Math.PI);c.stroke();}}
 if(b.armour==='plate'){path(c,[[-19,-31],[17,-31],[21,-11],[12,16],[0,23],[-14,15],[-22,-10]],'#a7bab7');path(c,[[-17,-29],[0,-21],[0,18],[-13,12],[-19,-10]],'#d0dbcf');for(let i=0;i<3;i++)path(c,[[-15,19+i*7],[14,19+i*7],[17,26+i*7],[-18,26+i*7]],i%2?'#819694':'#aab9b0');circle(c,-14,-23,2,gold);circle(c,13,-23,2,gold);}
 c.fillStyle='#423327';c.fillRect(-18,21,36,7);metal(c,-4,20,9,9);path(c,[[-18,6],[-30,20+(t.a||0)*18],[-16,24]],b.appearance.cloth);c.restore();
 arm(c,f,'R');
 c.save();c.translate(p.head.x,p.head.y);c.rotate(p.head.a||0);circle(c,0,0,18,b.appearance.skin);c.fillStyle='#342f2b33';c.beginPath();c.arc(4,1,14,-Math.PI/2,Math.PI/2);c.fill();c.fillStyle=b.appearance.hair;path(c,[[-17,-2],[-16,-14],[-8,-20],[9,-18],[17,-10],[15,-3],[6,-11],[-3,-9],[-8,-1]],b.appearance.hair);
 const d=f.facing||1;c.fillStyle=ink;c.fillRect(d*5-2,-2,4,3);c.strokeStyle=ink;c.lineWidth=1.5;c.beginPath();c.moveTo(d*3,8);c.lineTo(d*10,7);c.stroke();path(c,[[d*13,0],[d*20,4],[d*13,6]],b.appearance.skin,ink,1);
 if(b.helmet!=='none'&&!f.helmetOff){path(c,[[-20,0],[-18,-15],[-7,-23],[8,-22],[20,-12],[21,0],[13,4],[9,-6],[-12,-6],[-15,5]],'#9dafac',ink,2.5);path(c,[[-9,-20],[0,-24],[7,-21],[5,-6],[-1,-6]],'#e4debc',ink,1);if(b.helmet==='helm'){path(c,[[-17,-6],[17,-6],[17,12],[8,20],[-10,18],[-18,10]],'#93a6a3');c.fillStyle='#1d302e';c.fillRect(-13,-2,26,4);for(let x=-9;x<13;x+=5){c.fillRect(x,9,2,5);}c.fillStyle=gold;c.fillRect(-2,-6,4,25);circle(c,14,5,2,gold);const sway=(p.head.a||0)*14;path(c,[[2,-22],[11,-42+sway],[3,-24]],b.appearance.cloth,ink,1.5);}else path(c,[[d*10,-7],[d*14,-7],[d*14,10],[d*10,11]],steel);}
 c.restore();const weaponId=f.held||b.weapon;if(!f.weaponOff)drawWeapon(c,p.weapon,weaponId);if(p.offWeapon&&!f.weaponOff&&GEAR.weapons[weaponId]?.dual)drawWeapon(c,p.offWeapon,weaponId,true);
 if(p.flailHead&&!f.weaponOff&&weaponId==='flail'){const w=p.weapon,r=GEAR.weapons.flail.reach,tip={x:w.x+Math.sin(w.a)*r*.45,y:w.y-Math.cos(w.a)*r*.45};let prev=tip;for(const key of ['chain0','chain1','flailHead']){limb(c,prev,p[key],3,'#a5b5ad');prev=p[key];}circle(c,p.flailHead.x,p.flailHead.y,11,'#667a7b');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;path(c,[[p.flailHead.x+Math.cos(a-.2)*9,p.flailHead.y+Math.sin(a-.2)*9],[p.flailHead.x+Math.cos(a)*17,p.flailHead.y+Math.sin(a)*17],[p.flailHead.x+Math.cos(a+.2)*9,p.flailHead.y+Math.sin(a+.2)*9]],steel);}}
 if(b.shield!=='none'){const h=p.handL;c.save();c.translate(h.x,h.y);c.rotate((p.lowerArmL.a||0)*.12);if(b.shield==='buckler'){circle(c,0,0,20,'#73583c');circle(c,0,0,16,'#a28d5d');c.strokeStyle='#684d36';for(let x=-10;x<=10;x+=10){c.beginPath();c.moveTo(x,-13);c.lineTo(x,13);c.stroke();}circle(c,0,0,7,steel);}else{path(c,[[-22,-25],[21,-25],[18,11],[0,34],[-19,12]],b.appearance.cloth,ink,3);path(c,[[-19,-22],[0,-22],[0,29],[-16,10]],'#d4c895');c.fillStyle=gold;c.fillRect(-3,-22,6,47);c.fillRect(-18,-8,36,6);for(const [x,y]of [[-17,-20],[16,-20],[-15,9],[14,9],[0,26]])circle(c,x,y,1.8,gold);}c.restore();}c.restore();}
export function drawBackdrop(c,w,h,cameraX=450){const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#536a67');sky.addColorStop(1,'#c2bc91');c.fillStyle=sky;c.fillRect(0,0,w,h);c.save();const k=h/540;c.scale(k,k);c.translate(-(cameraX-450)*.15,0);for(let i=-2;i<10;i++){const x=i*170;c.fillStyle=i%2?'#52635b':'#607168';c.fillRect(x,120+(i%2)*35,150,330);c.fillStyle='#3e514a';for(let j=0;j<5;j++)c.fillRect(x+j*31,109+(i%2)*35,20,20);c.fillStyle='#2b423d';c.beginPath();c.roundRect(x+53,200+(i%2)*25,36,80,[20,20,0,0]);c.fill();c.strokeStyle='#798173';c.lineWidth=1;for(let y=145;y<445;y+=22){c.beginPath();c.moveTo(x,y);c.lineTo(x+150,y);c.stroke();}if(i%2===0){c.fillStyle='#743f35';path(c,[[x+110,150],[x+135,150],[x+135,212],[x+123,203],[x+110,212]],'#9e4939','#a17550',1);}}
 c.fillStyle='#d4c48d33';c.fillRect(-500,310,3000,100);c.restore();}
export function drawGround(c){c.fillStyle='#bcaa7b';c.fillRect(-1200,458,3300,600);c.fillStyle='#796a47';c.fillRect(-1200,458,3300,3);for(let x=-1200;x<2200;x+=27){c.fillStyle=x%3?'#a18b60':'#d0bc88';c.fillRect(x,469+Math.abs(x*13%71),4+Math.abs(x%11),2);}for(let x=-200;x<1200;x+=180){c.strokeStyle='#8d8665';c.lineWidth=3;c.beginPath();c.ellipse(x,490,46,7,0,0,Math.PI);c.stroke();}}
