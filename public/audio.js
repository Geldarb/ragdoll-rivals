export class ArenaAudio{
 constructor(){this.muted=localStorage.getItem('rivals-muted')==='true';this.context=null;this.lastCrowd=0;}
 async unlock(){if(this.muted)return;try{this.context??=new (window.AudioContext||window.webkitAudioContext)();await this.context.resume();}catch{}}
 toggle(){this.muted=!this.muted;localStorage.setItem('rivals-muted',String(this.muted));if(!this.muted)this.unlock();return this.muted;}
 tone(freq,end,duration,volume,type='sine'){const c=this.context;if(this.muted||!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),c.currentTime+duration);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration+.02);}
 noise(duration,volume,lowpass=1500){const c=this.context;if(this.muted||!c||c.state!=='running')return;const b=c.createBuffer(1,c.sampleRate*duration,c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const s=c.createBufferSource(),g=c.createGain(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=lowpass;s.buffer=b;g.gain.value=volume;s.connect(filter);filter.connect(g);g.connect(c.destination);s.start();}
 hit(e){if(e.blocked){this.tone(1080,530,.25,.035,'triangle');this.tone(1730,980,.16,.022);this.noise(.07,.04,4000);}else{this.tone(130,42,.13,.08);this.noise(.08,.05,800);if(e.amount>20)this.tone(165,75,.22,.027,'sawtooth');}}
 crowd(now){if(now-this.lastCrowd<6000)return;this.lastCrowd=now;this.noise(1.4,.018,600);this.tone(330,290,.7,.005);}
}
