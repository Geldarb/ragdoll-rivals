import {deriveStats,CLINCH_DISTANCE,GEAR,STYLE_DATA} from '../shared/rules.js';
export const STYLE_TACTICS={
 aggressive:{spacing:.88,attack:1.08,block:.15,travel:1.14,period:2.4,burst:2.1,disengage:.70},defensive:{spacing:1.12,attack:.54,block:.94,travel:.60,period:4.3,burst:1.3,disengage:.95},
 counterattacker:{spacing:1.08,attack:.62,block:.80,travel:.76,period:3.5,burst:1.2,disengage:.85},evasive:{spacing:1.34,attack:.80,block:.10,travel:1.48,period:2.0,burst:1.5,disengage:.80},
 balanced:{spacing:1.06,attack:.84,block:.42,travel:1.02,period:3.2,burst:1.7,disengage:.80},berserker:{spacing:.90,attack:1.22,block:0,travel:1.30,period:2.7,burst:2.4,disengage:.55},patient:{spacing:1.24,attack:.62,block:.66,travel:.82,period:4.0,burst:1.1,disengage:1.05}
};
export const SIGNATURES={aggressive:['lunge','combo'],defensive:['bash','pommel','haft'],counterattacker:['parry','riposte'],evasive:['roll','dart'],berserker:['spin','charge'],patient:['feint','thrust'],balanced:['lunge','combo','thrust','bash','pommel']};
export function motionStats(build,staminaFraction=1){const d=deriveStats(build),s=build.stats;const tired=staminaFraction<.18;const weight=1/(1+d.weight*.022);return {cadence:(.65+s.speed*.11)*weight*(tired?.56:1),windupScale:(1.3-s.speed*.045)*(1+d.weight*.012)*(tired?1.5:1),impulse:(.008+s.strength*.004),swing:.75+s.strength*.055,weight,tired};}
export function exhaustionTime(build){const d=deriveStats(build);return d.maxStamina/(d.attackCost/Math.max(.25,d.interval));}
export function emptySignatures(){return {lunge:0,combo:0,bash:0,pommel:0,haft:0,parry:0,riposte:0,roll:0,dart:0,spin:0,charge:0,feint:0,thrust:0,shove:0,barge:0,kick:0};}
export function preferredDistance(f,t=STYLE_TACTICS[f.build.style]){return (74+f.derived.reach*.48)*t.spacing;}
export function distanceBand(f){const data=STYLE_DATA[f.build.style],ideal=preferredDistance(f);return {min:Math.max(CLINCH_DISTANCE+12,ideal*data.near),ideal,max:ideal*data.far};}
function countSignature(f,name){if(!name)return;f.metrics.signatures[name]=(f.metrics.signatures[name]||0)+1;}
function shoveKind(style,weapon,shield){
 if(style==='berserker')return 'barge';
 if(style==='evasive')return 'kick';
 if(style==='defensive'||style==='balanced'){if(shield&&shield!=='none')return 'bash';return GEAR.weapons[weapon]?.twoHanded?'haft':'pommel';}
 if(style==='aggressive')return 'barge';
 return 'shove';
}
function pickSignature(style,weapon,opening,phase,distance,pref,shield){
 const pole=['spear','halberd'].includes(weapon),heavy=['claymore','warhammer','halberd'].includes(weapon);
 if(style==='aggressive')return phase<1.15?'combo':(pole?'lunge':'lunge');
 if(style==='defensive')return (shield&&shield!=='none')?'bash':heavy?'haft':'pommel';
 if(style==='counterattacker')return opening?'riposte':'parry';
 if(style==='evasive')return 'dart';
 if(style==='berserker')return distance>pref+20||phase>.35?'charge':'spin';
 if(style==='patient')return phase<.5?'feint':'thrust';
 const mix=['lunge','combo','thrust',(shield&&shield!=='none')?'bash':'pommel'];
 return mix[Math.floor(phase)%mix.length];
}
function advanceRhythm(m,f,index,distance,band,t){
 f.rhythm??={mode:'approach',until:m.time,last:''};
 if(f.needDisengage&&f.rhythm.mode!=='disengage'){f.rhythm.mode='disengage';f.rhythm.until=m.time+t.disengage;f.metrics.disengages++;f.needDisengage=false;}
 if(m.time<f.rhythm.until)return f.rhythm.mode;
 const style=f.build.style,low=f.stamina<f.derived.maxStamina*(style==='berserker'?.08:.36);
 if(f.rhythm.mode==='approach'){if(distance<=band.ideal*1.12){f.rhythm.mode='burst';f.rhythm.until=m.time+t.burst;}else f.rhythm.until=m.time+.4;}
 else if(f.rhythm.mode==='burst'){f.rhythm.mode='disengage';f.rhythm.until=m.time+t.disengage;f.metrics.disengages++;}
 else if(f.rhythm.mode==='disengage'){f.rhythm.mode='circle';f.rhythm.until=m.time+.5;}
 else if(f.rhythm.mode==='circle'){if(low&&style!=='berserker'){f.rhythm.mode='recover';f.rhythm.until=m.time+1.5;}else{f.rhythm.mode='approach';f.rhythm.until=m.time+2.4;f.metrics.reentries++;}}
 else if(f.rhythm.mode==='recover'){if(!low){f.rhythm.mode='approach';f.rhythm.until=m.time+2.2;f.metrics.reentries++;}else f.rhythm.until=m.time+.7;}
 return f.rhythm.mode;
}
export function chooseIntent(m,f,o,index){
 const style=f.build.style,t=STYLE_TACTICS[style],dir=index===0?1:-1,distance=Math.abs(f.parts.torso.position.x-o.parts.torso.position.x);
 const phase=(m.time+index*.37)%t.period,opening=(f.riposteUntil||0)>m.time||o.pose?.state==='recovery'||(o.attack<=0&&o.cooldown>.03);
 const band=distanceBand(f);f.preferred=band.ideal;
 f.exhausted=f.stamina<f.derived.maxStamina*(style==='berserker'?.001:.12)||(f.exhausted&&f.stamina<f.derived.maxStamina*.42);
 f.metrics.signatures??=emptySignatures();
 const mode=advanceRhythm(m,f,index,distance,band,t);
 let movement=distance>band.ideal?dir:distance<band.min?-dir:0;
 if(mode==='disengage'||mode==='recover')movement=distance<band.max?-dir:(distance>band.max+18?dir:0);
 else if(mode==='circle')movement=Math.sin(m.time*4.2+index*1.7)>0?dir*.3:-dir*.45;
 else if(mode==='burst')movement=distance>band.ideal?dir:distance<band.min?-dir:(style==='aggressive'||style==='berserker'?dir*.4:0);
 f.guard=style==='defensive'||(style==='counterattacker'&&!opening)||(style==='patient'&&phase>1)||(style==='balanced'&&phase<1);
 f.action='';f.attackChoice='normal';
 if((f.shove||0)>0){f.action=f.shoveType;f.movement=-dir*.35;f.guard=f.shoveType==='bash'||style==='defensive';if(f.exhausted)f.action='exhausted';return f.movement;}
 if(distance<CLINCH_DISTANCE+6&&f.stagger===0&&f.attack<=0&&(f.shoveCooldown||0)<=0){
  const kind=shoveKind(style,f.build.weapon,f.build.shield);
  f.shove=.34;f.shoveType=kind;f.shoveCooldown=1.2;f.shoveLanded=false;f.action=kind;f.attackChoice=kind;f.needDisengage=true;f.metrics.shoves++;countSignature(f,kind);
 }
 if(style==='aggressive'){if(phase<.75&&mode!=='disengage'&&mode!=='recover')movement=dir;f.attackChoice=pickSignature(style,f.build.weapon,opening,phase,distance,band.ideal,f.build.shield);}
 if(style==='defensive'){if(mode!=='disengage')movement*=.55;f.action=f.action||(distance<85?'shove':f.guard?'turtle':'');f.attackChoice=pickSignature(style,f.build.weapon,opening,phase,distance,band.ideal,f.build.shield);}
 if(style==='counterattacker'){if(!opening&&mode!=='disengage')movement=distance>band.ideal+18?dir*.7:0;f.attackChoice=pickSignature(style,f.build.weapon,opening,phase,distance,band.ideal,f.build.shield);if(!opening&&f.guard&&o.attack>0)countSignature(f,'parry');}
 if(style==='evasive'){if(phase<.65&&mode!=='burst'){movement=-dir;f.action=phase<.28?'roll':'dodge';if(f.action==='roll')countSignature(f,'roll');f.metrics.dodges++;}else if(phase<1.25&&mode==='burst')movement=dir*1.3;f.attackChoice='dart';}
 if(style==='berserker'){if(mode!=='disengage')movement=dir*1.15;f.action=phase<.28?'spin':phase>2.45?'stumble':'charge';if(f.action==='stumble')movement*=.25;f.attackChoice=pickSignature(style,f.build.weapon,opening,phase,distance,band.ideal,f.build.shield);}
 if(style==='patient'){if(mode!=='disengage'&&mode!=='recover')movement=distance>band.ideal+10?dir*.7:phase<.8?-dir*.8:0;if(phase<.45){f.action='feint';f.metrics.feints++;countSignature(f,'feint');}f.attackChoice='thrust';}
 if(style==='balanced')f.attackChoice=pickSignature(style,f.build.weapon,opening,phase,distance,band.ideal,f.build.shield);
 if(f.exhausted){movement*=.38;f.guard=false;f.action='exhausted';}
 if(distance<band.min)movement=-dir;
 f.movement=movement;f.metrics.decisions++;if(movement*dir>0)f.metrics.approach++;else if(movement*dir<0)f.metrics.retreat++;if(f.guard)f.metrics.guard++;
 const enough=f.stamina>=f.derived.attackCost*(style==='berserker'?.20:1);let chance=t.attack*.78;
 if(style==='counterattacker')chance=opening?1.5:.08;if(style==='patient'&&phase<.6)chance=0;
 if(style==='defensive'&&o.attack>0)chance=.08;
 if(mode==='recover')chance*=.2;else if(mode==='burst')chance*=1.12;else if(mode==='disengage')chance*=.45;
 if(!f.exhausted&&f.stagger===0&&(f.shove||0)<=0&&distance<130+f.derived.reach*.72&&f.cooldown<=0&&enough&&m.rng()<chance){
  const motion=motionStats(f.build,f.stamina/f.derived.maxStamina);f.attackDuration=Math.min(1.35,f.derived.interval*.8*motion.windupScale*(style==='counterattacker'&&opening?.65:1));f.attack=f.attackDuration;f.attackId++;f.hitBeat=0;f.stamina=Math.max(0,f.stamina-f.derived.attackCost);
  f.cooldown=f.derived.interval*(style==='aggressive'&&phase<1.2?.78:style==='counterattacker'&&opening?.82:1);f.metrics.attack++;
  countSignature(f,f.attackChoice);
 }
 return movement;
}
