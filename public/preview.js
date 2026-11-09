import {GEAR,deriveStats} from './rules.js';
const profile={aggressive:[2.2,34,11,.14,3.4],defensive:[1.2,46,15,-.05,1.3],counterattacker:[1.5,38,16,.03,1.9],evasive:[2.9,30,12,.07,4.6],balanced:[1.8,36,12,.05,2.2],berserker:[1.5,24,16,.18,3.0],patient:[1.3,40,8,-.03,1.05]};
export function previewFighter(build,time=0,victory=false){const [cadence,guard,crouch,lean0,bounce]=profile[build.style],weight=deriveStats(build).weight,phase=time*cadence*(.65+build.stats.speed*.11)/(1+weight*.022),bob=Math.sin(time*bounce)*bounce*.45,step=Math.sin(phase*Math.PI*2)*10,p={torso:{x:0,y:-20+crouch+bob,a:victory?-.06:lean0},head:{x:Math.sin(lean0)*8,y:-76+crouch+bob,a:lean0*.35},pelvis:{x:Math.sin(lean0)*6,y:19+bob,a:-lean0*.35}};
 const segment=(name,a,b)=>p[name]={x:(a.x+b.x)/2,y:(a.y+b.y)/2,a:-Math.atan2(b.x-a.x,b.y-a.y)};
 for(const [side,s]of [['L',-1],['R',1]]){const knee={x:s*12+step*s*.5,y:65},foot={x:s*14+step*s,y:111-Math.max(0,step*s)*.55};segment('thigh'+side,{x:s*10,y:24},knee);segment('shin'+side,knee,foot);p['foot'+side]={...foot,a:0};}
 const wind=Math.sin(time*1.6),swing=wind>.65?(wind-.65)/.35:0,angle=victory?-.1:.15+swing*1.55;let right={x:victory?18:36+swing*28,y:victory?-108:-20-guard-swing*12},left={x:30,y:-27-guard};
 const weapon=GEAR.weapons[build.weapon],r=weapon.reach;p.weapon={x:right.x+Math.sin(angle)*r*.38,y:right.y-Math.cos(angle)*r*.38,a:angle};if(weapon.twoHanded)left={x:right.x+Math.sin(angle)*r*.18,y:right.y-Math.cos(angle)*r*.18};
 for(const [side,h]of [['R',right],['L',left]]){const sh={x:side==='R'?12:-12,y:-44+crouch},elbow={x:side==='R'?31:19,y:Math.max(sh.y+12,h.y+22)};segment('upperArm'+side,sh,elbow);segment('lowerArm'+side,elbow,h);p['hand'+side]={...h,a:0};}
 if(weapon.dual)p.offWeapon={x:left.x+Math.sin(-.2)*r*.38,y:left.y-Math.cos(-.2)*r*.38,a:-.2};
 if(build.weapon==='flail'){let tip={x:p.weapon.x+Math.sin(angle)*r*.45,y:p.weapon.y-Math.cos(angle)*r*.45};for(const [i,key]of ['chain0','chain1','flailHead'].entries()){p[key]={x:tip.x+Math.sin(time*3+i*.4)*12,y:tip.y+8+i*12,a:0};}}
 return {build,parts:p,facing:1};}
