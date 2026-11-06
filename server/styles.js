import {deriveStats} from '../shared/rules.js';
export const STYLE_TACTICS={
 aggressive:{spacing:.96,attack:1.05,block:.15,travel:1.12,period:2.4},defensive:{spacing:.96,attack:.56,block:.94,travel:.58,period:4.3},
 counterattacker:{spacing:1.07,attack:.62,block:.80,travel:.76,period:3.5},evasive:{spacing:1.24,attack:.83,block:.10,travel:1.45,period:2.0},
 balanced:{spacing:1,attack:.86,block:.42,travel:1,period:3.2},berserker:{spacing:.68,attack:1.25,block:0,travel:1.28,period:2.7},patient:{spacing:1.16,attack:.65,block:.66,travel:.82,period:4.0}
};
export function motionStats(build,staminaFraction=1){const d=deriveStats(build),s=build.stats;const tired=staminaFraction<.18;const weight=1/(1+d.weight*.022);return {cadence:(.65+s.speed*.11)*weight*(tired?.56:1),windupScale:(1.3-s.speed*.045)*(1+d.weight*.012)*(tired?1.5:1),impulse:(.008+s.strength*.004),swing:.75+s.strength*.055,weight,tired};}
export function exhaustionTime(build){const d=deriveStats(build);return d.maxStamina/(d.attackCost/Math.max(.25,d.interval));}
export function chooseIntent(m,f,o,index){
 const style=f.build.style,t=STYLE_TACTICS[style],dir=index===0?1:-1,distance=Math.abs(f.parts.torso.position.x-o.parts.torso.position.x);
 const phase=(m.time+index*.37)%t.period,opening=o.attack<=0&&o.cooldown>o.derived.interval*.45;
 f.preferred=(68+f.derived.reach*.50)*t.spacing;f.exhausted=f.stamina<f.derived.maxStamina*(style==='berserker'?.001:.12)||(f.exhausted&&f.stamina<f.derived.maxStamina*.42);
 let movement=distance>f.preferred?dir:distance<f.preferred*.80?-dir:0;
 f.guard=style==='defensive'||(style==='counterattacker'&&!opening)||(style==='patient'&&phase>1)||(style==='balanced'&&phase<1);
 f.action='';f.attackChoice='normal';
 if(style==='aggressive'){if(phase<.75)movement=dir;f.attackChoice=phase<1.2?'combo':'slash';}
 if(style==='defensive'){movement*=.55;f.action=f.guard?'turtle':'';f.attackChoice='punish';}
 if(style==='counterattacker'){if(!opening)movement=distance>f.preferred+18?dir*.7:0;f.attackChoice=opening?'riposte':'parry';}
 if(style==='evasive'){if(phase<.65){movement=-dir;f.action='dodge';f.metrics.dodges++;}else if(phase<1.25)movement=dir*1.3;f.attackChoice='dart';}
 if(style==='berserker'){movement=dir*1.25;f.action=phase<.28?'spin':phase>2.45?'stumble':'charge';f.attackChoice='spin';}
 if(style==='patient'){movement=distance>f.preferred+10?dir*.7:phase<.8?-dir*.8:0;if(phase<.45){f.action='feint';f.metrics.feints++;}f.attackChoice='thrust';}
 if(f.exhausted){movement*=.38;f.guard=false;f.action='exhausted';}
 f.movement=movement;f.metrics[typeof movement==='number'&&movement*dir>0?'approach':'retreat']++;if(f.guard)f.metrics.guard++;
 const enough=f.stamina>=f.derived.attackCost*(style==='berserker'?.20:1);let chance=t.attack*.78;
 if(style==='counterattacker')chance=opening?1.5:.08;if(style==='patient'&&phase<.6)chance=0;
 if(style==='defensive'&&o.attack>0)chance=.08;
 if(!f.exhausted&&f.stagger===0&&distance<110+f.derived.reach*.75&&f.cooldown<=0&&enough&&m.rng()<chance){
  const motion=motionStats(f.build,f.stamina/f.derived.maxStamina);f.attackDuration=Math.min(1.25,f.derived.interval*.8*motion.windupScale);f.attack=f.attackDuration;f.attackId++;f.stamina=Math.max(0,f.stamina-f.derived.attackCost);
  f.cooldown=f.derived.interval*(style==='aggressive'&&phase<1.2?.80:style==='counterattacker'&&opening?.82:1);f.metrics.attack++;
 }
 return movement;
}
