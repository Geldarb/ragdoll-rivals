export class SnapshotBuffer{
 constructor(delay=100){this.delay=delay;this.frames=[];this.offset=null;}
 clear(){this.frames=[];this.offset=null;}
 push(snapshot,now){const last=this.frames.at(-1);if(last&&snapshot.time<=last.time)return false;const offset=now-snapshot.time*1000;this.offset=this.offset===null?offset:Math.min(this.offset+.1,offset);this.frames.push(snapshot);if(this.frames.length>12)this.frames.shift();return true;}
 sample(now){if(!this.frames.length)return null;const time=(now-this.offset-this.delay)/1000;let a=this.frames[0],b=a;for(const frame of this.frames){b=frame;if(frame.time>=time)break;a=frame;}if(a===b||time>=b.time)return b;const t=Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));return {...a,fighters:a.fighters.map((f,i)=>({...f,parts:Object.fromEntries(Object.entries(f.parts).map(([key,p])=>{const q=b.fighters[i].parts[key]||p;const da=Math.atan2(Math.sin(q.a-p.a),Math.cos(q.a-p.a));return [key,{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,a:p.a+da*t}];}))}))};}
}
