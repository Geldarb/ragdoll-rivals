import {chromium} from 'playwright';
import fs from 'node:fs';
import {createServer} from '../server/index.js';
import {createMatch,stepMatch,isolateOpponent,applyImpact} from '../server/combat.js';
import {DEFAULT_BUILD,GEAR} from '../shared/rules.js';
import {attackHeightOf} from '../shared/animation.js';

const dir=process.env.SHOTS||'screenshots/local-2.1';
fs.mkdirSync(dir,{recursive:true});
const server=createServer();
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
const errors=[];

async function drawSnapshots(name,frames,width=1400,height=800){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/rules.js',{waitUntil:'domcontentloaded'});
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#1b2421"><canvas id="c" width="${width}" height="${height}"></canvas>
  <script type="module">
  import {drawBody,drawBackdrop,drawGround,drawWeapon} from '/art.js';
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
    for(const item of frame.loot||[])drawWeapon(ctx,{x:item.x,y:item.y,a:item.a||0},item.weapon);
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
  return {label,time:+m.time.toFixed(2),loot:(m.loot||[]).map(item=>({weapon:item.weapon,x:item.x,y:item.y,a:item.a})),fighters:m.fighters.map(f=>({build:{...f.build,weapon:f.held||f.build.weapon},held:f.held||f.build.weapon,facing:f.facing,parts:Object.fromEntries(Object.entries(f.parts).map(([k,p])=>[k,{x:p.position.x,y:p.position.y,a:p.angle}]))}))};
}
function forceStrike(f,choice,progress=.5){
  f.attackChoice=choice;f.attackHeight=attackHeightOf(choice);f.attackTier='special';
  f.attackDuration=.7;f.attack=.7*(1-progress);f.attackId++;f.hitAttack=-1;f.hitBeat=0;
}

const styles=['aggressive','defensive','counterattacker','evasive','balanced','berserker','patient'];
const weapons=['spear','flail','sword','twinSwords','halberd','warhammer','rapier'];
const stanceFrames=[];
for(const [i,style] of styles.entries()){
  const weapon=weapons[i], shield=GEAR.weapons[weapon].twoHanded||GEAR.weapons[weapon].dual?'none':'buckler';
  const m=createMatch({...DEFAULT_BUILD,style,weapon,shield,helmet:'helm'},{...DEFAULT_BUILD,name:'Bors'},{seed:4+i});
  isolateOpponent(m);
  const f=m.fighters[0];f.think=1e9;f.cooldown=1e9;f.guard=true;f.movement=0;
  for(let t=0;t<50;t++)stepMatch(m);
  stanceFrames.push(snap(m,style));
}
await drawSnapshots('stance-montage',stanceFrames,1800,1100);

const walk=createMatch(DEFAULT_BUILD,{...DEFAULT_BUILD,name:'Bors'},{seed:8});
isolateOpponent(walk);walk.fighters[0].think=1e9;walk.fighters[0].movement=1;
const walkFrames=[];
for(let i=0;i<90;i++){stepMatch(walk);if(i%22===21)walkFrames.push(snap(walk,`shuffle ${walk.fighters[0].pose.state}`));}
await drawSnapshots('walk-cycle',walkFrames,1280,720);

const combo=createMatch({...DEFAULT_BUILD,style:'aggressive',weapon:'sword'},{...DEFAULT_BUILD,name:'Bors',style:'defensive',weapon:'axe'},{seed:19});
const comboFrames=[];
for(let i=0;i<280&&comboFrames.length<8;i++){
  stepMatch(combo);
  const s=combo.fighters[0].pose.state;
  if(['wind-up','strike','recovery','block'].includes(s)&&(comboFrames.length===0||comboFrames.at(-1).label!==s+' '+combo.fighters[0].attackChoice))
    comboFrames.push(snap(combo,`${s} ${combo.fighters[0].attackChoice||''}`.trim()));
}
await drawSnapshots('combo-sequence',comboFrames,1400,800);

const sweep=createMatch({...DEFAULT_BUILD,style:'defensive',weapon:'halberd',shield:'none'},{...DEFAULT_BUILD,name:'Bors',style:'balanced'},{seed:21});
const [sa,sb]=sweep.fighters;sa.think=1e9;sb.think=1e9;sb.guard=false;sa.rootX=340;sb.rootX=460;
const sweepFrames=[snap(sweep,'ready')];
forceStrike(sa,'sweep',.25);stepMatch(sweep);sweepFrames.push(snap(sweep,'sweep wind-up'));
forceStrike(sa,'sweep',.55);stepMatch(sweep);sweepFrames.push(snap(sweep,'sweep strike '+sweep.fighters[1].pose.state));
for(let i=0;i<8;i++)stepMatch(sweep);
sweepFrames.push(snap(sweep,'after sweep'));
await drawSnapshots('sweep-sequence',sweepFrames,1400,720);

const hop=createMatch({...DEFAULT_BUILD,style:'evasive',weapon:'rapier'},{...DEFAULT_BUILD,name:'Bors'},{seed:11});
const [ha,hb]=hop.fighters;ha.think=1e9;hb.think=1e9;ha.rootX=340;hb.rootX=470;
ha.airborne=.42;ha.jumpDuration=.42;
const hopFrames=[];
for(const u of [0,.12,.22,.32]){
  ha.airborne=.42-u;forceStrike(ha,'jumpAttack',u<.2?.3:.55);stepMatch(hop);
  hopFrames.push(snap(hop,u<.2?'jump rise':'jump attack'));
}
await drawSnapshots('jump-attack-sequence',hopFrames,1400,720);

const disarm=createMatch({...DEFAULT_BUILD,style:'patient',weapon:'sword'},{...DEFAULT_BUILD,name:'Bors',style:'berserker',weapon:'axe'},{seed:9});
const [da,db]=disarm.fighters;da.think=1e9;db.think=1e9;db.guard=false;db.health=db.derived.maxHealth*.22;da.rootX=340;db.rootX=455;
const disarmFrames=[snap(disarm,'low health')];
forceStrike(da,'disarm',.3);stepMatch(disarm);disarmFrames.push(snap(disarm,'disarm wind-up'));
forceStrike(da,'disarm',.55);
for(let i=0;i<10;i++){stepMatch(disarm);if(db.disarmed)break;}
disarmFrames.push(snap(disarm,db.disarmed?'weapon knocked away':'disarm strike'));
if(db.disarmed&&disarm.loot[0]){db.rootX=disarm.loot[0].x;for(let i=0;i<20;i++)stepMatch(disarm);}
disarmFrames.push(snap(disarm,db.disarmed?'backup dagger':'weapon recovered'));
await drawSnapshots('disarm-finisher-sequence',disarmFrames,1400,720);

const slam=createMatch({...DEFAULT_BUILD,style:'berserker',weapon:'warhammer',shield:'none'},{...DEFAULT_BUILD,name:'Bors'},{seed:6});
const [la,lb]=slam.fighters;la.think=1e9;lb.think=1e9;lb.health=lb.derived.maxHealth*.2;la.rootX=340;lb.rootX=460;
const slamFrames=[snap(slam,'finisher ready')];
forceStrike(la,'slam',.28);stepMatch(slam);slamFrames.push(snap(slam,'slam rise'));
forceStrike(la,'slam',.58);for(let i=0;i<12;i++)stepMatch(slam);
slamFrames.push(snap(slam,'slam impact '+lb.pose.state));
await drawSnapshots('slam-finisher-sequence',slamFrames,1400,720);

const down=createMatch(DEFAULT_BUILD,DEFAULT_BUILD,{seed:5});
isolateOpponent(down);for(let i=0;i<40;i++)stepMatch(down);
const kd=[snap(down,'before hit')];
applyImpact(down.fighters[0],35,1);
for(const [tick,label] of [[1,'impact'],[8,'flop'],[20,'down'],[40,'rising'],[55,'get-up'],[80,'standing']]){
  while(down.tick<tick&&down.status==='fighting')stepMatch(down);
  kd.push(snap(down,label+' '+down.fighters[0].pose.state+' '+down.fighters[0].mode));
}
await drawSnapshots('knockdown-sequence',kd,1400,800);

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
