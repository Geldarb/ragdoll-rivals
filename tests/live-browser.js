import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.LIVE_URL||'https://ragdoll-rivals.onrender.com';
const browser=await chromium.launch({headless:true});const results=[];const errors=[];
const check=(name,detail='PASS')=>{results.push({name,status:'PASS',detail});console.log(`PASS ${name}: ${detail}`);};
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(base,{waitUntil:'networkidle',timeout:90000});assert.equal(await page.title(),'Ragdoll Rivals');check('live desktop page load');await page.screenshot({path:'screenshots/live/desktop-setup-1280x800.png'});
 assert.equal(await page.locator('#points').textContent(),'0 POINTS LEFT');await page.getByLabel('Remove strength point').click();assert.equal(await page.locator('#points').textContent(),'1 POINTS LEFT');await page.locator('#computer').click();await page.locator('#error').filter({hasText:'points left'}).waitFor();check('live stat budget prevents over/under allocation');
 await page.getByLabel('Add strength point').click();await page.selectOption('#weapon','claymore');assert.equal(await page.locator('#shield').inputValue(),'none');assert.equal(await page.locator('#shield').isDisabled(),true);check('live illegal claymore shield prevented');
 await page.locator('#computer').click();await page.locator('#arena:not(.hidden)').waitFor();await page.waitForFunction(()=>window.__game.snapshot?.tick>3);await page.screenshot({path:'screenshots/live/desktop-duel-1280x800.png'});await page.locator('#result:not(.hidden)').waitFor({timeout:100000});check('live full computer battle to result',await page.locator('#resultTitle').textContent());await page.locator('#rematch').click();await page.locator('#arena:not(.hidden)').waitFor();await page.waitForFunction(()=>window.__game.snapshot?.tick>2);check('live computer rematch');
 for(const [w,h] of [[390,664],[360,640],[844,340],[740,360]]){const p=await browser.newPage({viewport:{width:w,height:h},isMobile:w<500,hasTouch:w<500});p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle',timeout:90000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),true);await p.screenshot({path:`screenshots/live/setup-${w}x${h}.png`});check(`live layout ${w}x${h}`,'no page overflow');await p.close();}
 assert.deepEqual(errors,[]);check('live browser console','0 errors');
}finally{await browser.close();const fs=await import('node:fs');fs.writeFileSync('screenshots/live/browser-results.json',JSON.stringify(results,null,2));}
