import {chromium} from 'playwright';
import fs from 'node:fs';
import {createServer} from '../server/index.js';
import {createMatch,stepMatch,isolateOpponent,applyImpact} from '../server/combat.js';
import {DEFAULT_BUILD,GEAR} from '../shared/rules.js';

const dir=process.env.SHOTS||'screenshots/local-2.0';
fs.mkdirSync(dir,{recursive:true});
const server=createServer();
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
const errors=[];

async function drawSnapshots(name,frames,width=1280,height=720){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/rules.js',{waitUntil:'domcontentloaded'});
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#1b2421"><canvas id="c" width="${width}" height="${height}"></canvas>
  <script type="module">
  import {drawBody,drawBackdrop,drawGround} from '/art.js';
  const frames=${JSON.stringify(frames)};
  const c=document.getElementById('c');
  const ctx=c.getContext('2d');
  const cols=Math.min(frames.length,4), rows=Math.ceil(frames.length/cols);
  const cw=c.width/cols, ch=c.height/rows;
  frames.forEach((frame,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    ctx.save();ctx.beginPath();ctx.rect(col*cw,row*ch,cw,ch);ctx.clip();
    ctx.translate(col*cw,row*ch);
    drawBackdrop(ctx,cw,ch,450);
    ctx.save();const k=ch/540;ctx.scale(k,k);ctx.translate((cw/k-800)/2,0);drawGround(ctx);
    frame.fighters.forEach(f=>drawBody(ctx,f));
    ctx.fillStyle='#f2e6c4';ctx.font='18px Georgia,serif';ctx.fillText(frame.label||('t '+frame.time),24,40);
    ctx.restore();ctx.restore();
  });
  window.__ready=true;
  </script></body></html>`);
  await page.waitForFunction(()=>window.__ready,{timeout:20000});
  await page.screenshot({path:`${dir}/${name}.png`});
  await page.close();
}

function snap(m,label){
  return {label,time:+m.time.toFixed(2),fighters:m.fighters.map(f=>({build:f.build,facing:f.facing,parts:Object.fromEntries(Object.entries(f.parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]))}))};
}

const walk=createMatch(DEFAULT_BUILD,{...DEFAULT_BUILD,name:'Bors'},{seed:8});
isolateOpponent(walk);
const walkFrames=[];
for(let i=0;i<90;i++){stepMatch(walk);if(i%22===21)walkFrames.push(snap(walk,`walk ${walk.fighters[0].pose.state}`));}
await drawSnapshots('walk-cycle',walkFrames,1280,720);

const clash=createMatch({...DEFAULT_BUILD,style:'aggressive',weapon:'sword'},{...DEFAULT_BUILD,name:'Bors',style:'defensive',weapon:'axe'},{seed:19});
const clashFrames=[];
for(let i=0;i<240&&clashFrames.length<8;i++){
  stepMatch(clash);
  const s=clash.fighters[0].pose.state;
  if(['wind-up','strike','recovery','block','shove'].includes(s) && (clashFrames.length===0||clashFrames.at(-1).label!==s))
    clashFrames.push(snap(clash,s));
}
await drawSnapshots('attack-sequence',clashFrames,1280,720);

const down=createMatch(DEFAULT_BUILD,DEFAULT_BUILD,{seed:5});
isolateOpponent(down);
for(let i=0;i<50;i++)stepMatch(down);
const kd=[];
kd.push(snap(down,'before hit'));
applyImpact(down.fighters[0],35,1);
for(const [i,label] of [[1,'impact'],[8,'flop'],[20,'down'],[40,'rising'],[55,'get-up'],[80,'standing']].entries()){
  while(down.tick<label[0]&&down.status==='fighting')stepMatch(down);
  kd.push(snap(down,label[1]+' '+down.fighters[0].pose.state+' '+down.fighters[0].mode));
}
await drawSnapshots('knockdown-sequence',kd,1400,800);

const styles=['aggressive','defensive','counterattacker','evasive','balanced','berserker','patient'];
const weapons=['spear','flail','sword','twinSwords','halberd','warhammer','rapier'];
const styleFrames=[];
for(const [i,style] of styles.entries()){
  const weapon=weapons[i], shield=GEAR.weapons[weapon].twoHanded||GEAR.weapons[weapon].dual?'none':'buckler';
  const m=createMatch({...DEFAULT_BUILD,style,weapon,shield},{...DEFAULT_BUILD,name:'Bors'},{seed:4+i});
  for(let t=0;t<90;t++)stepMatch(m);
  styleFrames.push(snap(m,`${style} / ${weapon}`));
}
await drawSnapshots('style-montage',styleFrames,1600,900);

const grip=createMatch({...DEFAULT_BUILD,weapon:'claymore',shield:'none'},DEFAULT_BUILD,{seed:5});
isolateOpponent(grip);
for(let i=0;i<40;i++)stepMatch(grip);
await drawSnapshots('claymore-held',[snap(grip,'zweihander in both hands')],900,700);

const page=await browser.newPage({viewport:{width:1280,height:800}});
page.on('pageerror',e=>errors.push(e.message));
await page.goto(url,{waitUntil:'networkidle'});
await page.screenshot({path:`${dir}/desktop-setup-1280x800.png`});
await page.locator('#computer').click();
await page.locator('#arena:not(.hidden)').waitFor();
await page.waitForFunction(()=>window.__game.snapshot?.tick>20);
await page.screenshot({path:`${dir}/desktop-duel-1280x800.png`});
await page.close();

if(errors.length)console.error(errors);
else console.log('captured',fs.readdirSync(dir));
await browser.close();
await new Promise(r=>server.close(r));
if(errors.length)process.exit(1);
