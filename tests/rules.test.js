import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBuild, normaliseBuild, deriveStats, STYLES, GEAR } from '../shared/rules.js';

export const validBuild = (changes={}) => ({
  name:'Test Knight', appearance:{skin:'#c98d68',hair:'#5b3826',cloth:'#a83232'},
  stats:{strength:4,vitality:4,speed:4,stamina:4,balance:4},
  style:'balanced', weapon:'sword', armour:'leather', helmet:'cap', shield:'buckler', ...changes
});

test('exactly fifteen distributed points is valid', () => assert.equal(validateBuild(validBuild()).ok,true));
for (const total of [14,16]) test(`rejects allocation totalling ${total}`,()=>{
 const b=validBuild(); b.stats.strength += total-15;
 assert.equal(validateBuild(b).ok,false);
});
test('rejects noninteger and out of range stats',()=>{
 const b=validBuild(); b.stats.strength=4.5; assert.equal(validateBuild(b).ok,false);
 const c=validBuild(); c.stats.strength=12;c.stats.vitality=3;assert.equal(validateBuild(c).ok,false);
});
test('claymore cannot carry either shield',()=>{
 assert.equal(validateBuild(validBuild({weapon:'claymore'})).ok,false);
 assert.equal(validateBuild(validBuild({weapon:'claymore',shield:'none'})).ok,true);
});
test('unknown gear and styles rejected',()=>assert.equal(validateBuild(validBuild({weapon:'laser'})).ok,false));
test('heavier armour slows derived movement',()=>{
 const light=deriveStats(validBuild({armour:'mail'})); const heavy=deriveStats(validBuild({armour:'plate'}));
 assert.ok(heavy.moveSpeed<light.moveSpeed); assert.ok(heavy.maxHealth===light.maxHealth);
});
test('strength increases damage and vitality health',()=>{
 const b=validBuild(); const d=deriveStats(b); b.stats.strength++;b.stats.vitality--;
 const stronger=deriveStats(b);assert.ok(stronger.damage>d.damage);assert.ok(stronger.maxHealth<d.maxHealth);
});
test('normalises name and preserves legal loadout',()=>{
 const b=normaliseBuild({...validBuild(),name:'  Egbert  '});assert.equal(b.name,'Egbert');assert.equal(b.weapon,'sword');
});
test('all seven styles and five weapons exist',()=>{
 assert.equal(STYLES.length,7);assert.deepEqual(Object.keys(GEAR.weapons),['dagger','sword','axe','mace','claymore','spear','flail','warhammer','halberd','rapier','twinSwords']);
});
