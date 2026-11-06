import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from '../server/index.js';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});let checks=0;const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});assert.equal(await page.title(),'Ragdoll Rivals');checks++;await page.screenshot({path:'screenshots/desktop-setup-1280x800.png'});
 assert.equal(await page.locator('#points').textContent(),'0 POINTS LEFT');checks++;await page.getByLabel('Remove strength point').click();assert.equal(await page.locator('#points').textContent(),'1 POINTS LEFT');checks++;await page.getByLabel('Add strength point').click();assert.equal(await page.locator('#points').textContent(),'0 POINTS LEFT');checks++;
 await page.selectOption('#weapon','claymore');assert.equal(await page.locator('#shield').inputValue(),'none');assert.equal(await page.locator('#shield').isDisabled(),true);checks++;
 await page.locator('#computer').click();await page.locator('#arena:not(.hidden)').waitFor({timeout:5000});await page.waitForFunction(()=>window.__game.snapshot?.tick>3);checks++;await page.screenshot({path:'screenshots/desktop-duel-1280x800.png'});await page.locator('#arena .back').click();await page.locator('#setup:not(.hidden)').waitFor();checks++;
 const mobile=await browser.newPage({viewport:{width:390,height:664},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base,{waitUntil:'networkidle'});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;await mobile.screenshot({path:'screenshots/mobile-setup-390x664.png'});await mobile.locator('#computer').scrollIntoViewIfNeeded();await mobile.locator('#computer').click();await mobile.waitForFunction(()=>window.__game.snapshot?.tick>3);await mobile.screenshot({path:'screenshots/mobile-duel-390x664.png'});checks++;
 for(const [w,h] of [[360,640],[844,340],[740,360]]){const p=await browser.newPage({viewport:{width:w,height:h}});await p.goto(base);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:`screenshots/setup-${w}x${h}.png`});checks++;await p.close();}
 assert.deepEqual(errors,[]);checks++;console.log(`Browser checks: ${checks} passed, 0 failed. Console errors: ${errors.length}.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
