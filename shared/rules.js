export const VERSION='1.4.0';
export const STAT_NAMES=['strength','vitality','speed','stamina','balance'];
export const CLINCH_DISTANCE=78;
export const GEAR=Object.freeze({
 weapons:{dagger:{label:'Dagger',weight:1,damage:7,reach:34,interval:.50,cost:8},sword:{label:'Sword',weight:3,damage:12,reach:74,interval:.80,cost:12},axe:{label:'Axe',weight:5,damage:17,reach:66,interval:1.04,cost:16},mace:{label:'Mace',weight:6,damage:15,reach:60,interval:.96,cost:15,armourBypass:.25},claymore:{label:'Claymore',weight:9,damage:23,reach:188,interval:1.50,cost:24,twoHanded:true},
 spear:{label:'Spear',weight:6,damage:11,reach:216,interval:1.10,cost:14,twoHanded:true},flail:{label:'Flail',weight:5,damage:14,reach:82,interval:1.00,cost:15,blockFactor:.45},warhammer:{label:'Warhammer',weight:10,damage:22,reach:136,interval:1.38,cost:22,twoHanded:true,armourBypass:.55},halberd:{label:'Halberd',weight:9,damage:18,reach:204,interval:1.28,cost:20,twoHanded:true},rapier:{label:'Rapier',weight:2,damage:6,reach:104,interval:.88,cost:11},twinSwords:{label:'Twin short swords',weight:5,damage:10,reach:56,interval:.54,cost:11,dual:true}},
 armour:{cloth:{weight:1,protection:.02},leather:{weight:4,protection:.1},mail:{weight:8,protection:.21},plate:{weight:13,protection:.35}},
 helmets:{none:{weight:0,protection:0},cap:{weight:1,protection:.05},helm:{weight:3,protection:.15}},
 shields:{none:{weight:0,block:0},buckler:{weight:3,block:.18},kite:{weight:6,block:.32}}
});
export const STYLES=['aggressive','defensive','counterattacker','evasive','balanced','berserker','patient'];
export const STYLE_DATA={
 aggressive:{range:.88,speed:1.12,chance:.78,near:.84,far:1.16},defensive:{range:1.12,speed:.72,chance:.9,near:.92,far:1.30},counterattacker:{range:1.08,speed:.9,chance:.82,near:.90,far:1.26},
 evasive:{range:1.34,speed:1.15,chance:.86,near:.96,far:1.42},balanced:{range:1.06,speed:1,chance:.84,near:.88,far:1.24},berserker:{range:.90,speed:1.25,chance:.65,near:.82,far:1.14},patient:{range:1.24,speed:.82,chance:.94,near:.94,far:1.34}
};
export const APPEARANCE={skin:['#f0c7a5','#c98d68','#8d5c42','#583b30'],hair:['#221b19','#5b3826','#b88743','#ddd2b8'],cloth:['#a83232','#315c7d','#586b3a','#755186','#b08332']};
export function normaliseBuild(b={}){return {name:String(b.name??'').trim().slice(0,20),appearance:{skin:b.appearance?.skin,hair:b.appearance?.hair,cloth:b.appearance?.cloth},stats:Object.fromEntries(STAT_NAMES.map(s=>[s,b.stats?.[s]])),style:b.style,weapon:b.weapon,armour:b.armour,helmet:b.helmet,shield:b.shield};}
export function validateBuild(value){
 const b=normaliseBuild(value),errors=[];
 if(b.name.length<1||b.name.length>20)errors.push('Name must be 1–20 characters.');
 let total=0;
 for(const s of STAT_NAMES){const v=b.stats[s];if(!Number.isInteger(v)||v<1||v>11)errors.push(`${s} must be a whole number from 1 to 11.`);else total+=v-1;}
 if(total!==15)errors.push(`Allocate exactly 15 points (currently ${total}).`);
 if(!STYLES.includes(b.style))errors.push('Choose a fighting style.');
 if(!GEAR.weapons[b.weapon])errors.push('Unknown weapon.');
 if(!GEAR.armour[b.armour])errors.push('Unknown armour.');
 if(!GEAR.helmets[b.helmet])errors.push('Unknown helmet.');
 if(!GEAR.shields[b.shield])errors.push('Unknown shield.');
 if((GEAR.weapons[b.weapon]?.twoHanded||GEAR.weapons[b.weapon]?.dual)&&b.shield!=='none')errors.push(`${GEAR.weapons[b.weapon]?.label||b.weapon} needs both hands: remove the shield.`);
 for(const [key,allowed] of Object.entries(APPEARANCE))if(!allowed.includes(b.appearance[key]))errors.push(`Unknown ${key} colour.`);
 return {ok:errors.length===0,errors};
}
export function deriveStats(value){
 const b=normaliseBuild(value),w=GEAR.weapons[b.weapon],weight=w.weight+GEAR.armour[b.armour].weight+GEAR.helmets[b.helmet].weight+GEAR.shields[b.shield].weight;
 return {weight,maxHealth:70+b.stats.vitality*6,maxStamina:70+b.stats.stamina*5,moveSpeed:(115+b.stats.speed*6)/(1+.03*weight),damage:w.damage+b.stats.strength*1.7,reach:w.reach,interval:w.interval,attackCost:w.cost+.35*weight,regen:8+b.stats.stamina*.35,balance:.08+b.stats.balance*.01,armour:GEAR.armour[b.armour].protection,helmet:GEAR.helmets[b.helmet].protection,block:GEAR.shields[b.shield].block};
}
export const DEFAULT_BUILD=Object.freeze(normaliseBuild({name:'Rowan',appearance:{skin:'#c98d68',hair:'#5b3826',cloth:'#315c7d'},stats:{strength:4,vitality:4,speed:4,stamina:4,balance:4},style:'balanced',weapon:'sword',armour:'leather',helmet:'cap',shield:'buckler'}));
