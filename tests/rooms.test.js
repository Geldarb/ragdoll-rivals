import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createServer } from '../server/index.js';
import { DEFAULT_BUILD } from '../shared/rules.js';

let server,port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function client(){const ws=new WebSocket(`ws://127.0.0.1:${port}`);ws.inbox=[];ws.on('message',d=>ws.inbox.push(JSON.parse(d)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
async function until(ws,type,timeout=5000){const end=Date.now()+timeout;while(Date.now()<end){const i=ws.inbox.findIndex(x=>x.type===type);if(i>=0)return ws.inbox.splice(i,1)[0];await wait(10);}throw new Error(`Timed out for ${type}: ${JSON.stringify(ws.inbox)}`);}
const send=(ws,type,extra={})=>ws.send(JSON.stringify({type,build:DEFAULT_BUILD,...extra}));
test.before(async()=>{server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));port=server.address().port;});
test.after(async()=>{await new Promise(r=>server.close(r));});
test('health returns version JSON',async()=>{const r=await fetch(`http://127.0.0.1:${port}/health`);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,version:'1.1.0',commit:'local'});});
test('invalid room code returns a useful error',async()=>{const ws=await client();send(ws,'joinRoom',{code:'NOPE!!'});assert.match((await until(ws,'error')).message,/code/i);ws.close();});
test('two real clients create, join and receive identical snapshots',async()=>{
 const a=await client(),b=await client();send(a,'createRoom');const made=await until(a,'roomCreated');assert.match(made.code,/^[A-HJ-NP-Z2-9]{6}$/);send(b,'joinRoom',{code:made.code});await until(a,'started');await until(b,'started');const [sa,sb]=await Promise.all([until(a,'snapshot'),until(b,'snapshot')]);assert.equal(sa.tick,sb.tick);assert.deepEqual(sa.fighters.map(f=>f.parts),sb.fighters.map(f=>f.parts));a.terminate();b.terminate();
});
test('computer duel ends and rematch starts a fresh fight',async()=>{const ws=await client();send(ws,'computer');await until(ws,'started');const end=await until(ws,'finished',80000);assert.ok([0,1,-1].includes(end.winner));send(ws,'rematch');const start=await until(ws,'started');assert.equal(start.rematch,true);ws.terminate();});
test('two votes after human duel restart match',async()=>{const a=await client(),b=await client();send(a,'createRoom');const {code}=await until(a,'roomCreated');send(b,'joinRoom',{code});await until(a,'started');await until(b,'started');await Promise.all([until(a,'finished',80000),until(b,'finished',80000)]);send(a,'rematch');assert.equal((await until(a,'rematchStatus')).votes,1);send(b,'rematch');const starts=await Promise.all([until(a,'started'),until(b,'started')]);assert.equal(starts[0].rematch,true);a.terminate();b.terminate();});
test('unknown code and full room do not kill other client',async()=>{const ws=await client();send(ws,'joinRoom',{code:'ABCDEF'});assert.match((await until(ws,'error')).message,/not found/i);assert.equal(ws.readyState,WebSocket.OPEN);ws.close();});
test('computer mode starts immediately and streams',async()=>{const ws=await client();send(ws,'computer');await until(ws,'started');const s=await until(ws,'snapshot');assert.equal(s.fighters.length,2);ws.close();});
test('disconnected battler forfeits after grace period',async()=>{const a=await client(),b=await client();send(a,'createRoom');const {code}=await until(a,'roomCreated');send(b,'joinRoom',{code});await until(a,'started');await until(b,'started');b.close();const f=await until(a,'finished',12000);assert.equal(f.winner,0);assert.match(f.reason,/disconnect/i);a.close();});
test('server rejects invalid combat build',async()=>{const ws=await client();send(ws,'computer',{build:{...DEFAULT_BUILD,weapon:'claymore'}});assert.match((await until(ws,'error')).message,/claymore/i);ws.close();});

test('live scheduler sends 30 Hz snapshots with bounded step time and no dropped ticks',async()=>{const ws=await client();try{send(ws,'computer');await until(ws,'started');await until(ws,'snapshot');const start=performance.now();const frames=[];while(performance.now()-start<2100){frames.push(await until(ws,'snapshot'));}const elapsed=(performance.now()-start)/1000;assert.ok(frames.length/elapsed>25,`${frames.length/elapsed} snapshots/s`);const timed=frames.find(x=>x.timing);assert.ok(timed);assert.equal(timed.timing.droppedMs,0);assert.ok(timed.timing.meanStepMs<20);assert.equal(frames[0].fighters[0].build,undefined);}finally{ws.terminate();}});
