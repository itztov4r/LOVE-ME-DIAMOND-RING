/**
 * LOVE ME / 001 — Ring of stardust
 * Handmade particle geometry inspired by the supplied reference video.
 * The music is original synthesized ambience, NOT the copyrighted "Love Me" recording.
 * To play a user-supplied, licensed audio file, provide its path as TRACK_URL.
 */
'use strict';
const TRACK_URL = '';
const TAU = Math.PI * 2;
const canvas = document.getElementById('universe');
const stage = document.getElementById('stage');
const clock = document.getElementById('time');
const musicButton = document.getElementById('music-toggle');
const musicAction = document.getElementById('music-action');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d', {alpha:false});
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const scene = {w:0,h:0,dpr:1,t:0,prev:0,frame:0,flash:0};
const pointer = {x:0,y:0,dx:0,dy:0};
let seed=20261106;
function rnd(){ seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296; }
function range(a,b){return a+(b-a)*rnd();}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
const ring=[];
const orbitDust=[];
const background=[];
const facetLines=[];
function dot(x,y,z,part,brightness,size,reveal){
  ring.push({x,y,z,part,brightness,size,reveal,twinkle:rnd()*TAU});
}
function addEdge(a,b,n,part=1){
  facetLines.push({a,b});
  for(let i=0;i<=n;i++){
    const f=i/n;
    dot(a[0]+(b[0]-a[0])*f+range(-.005,.005),a[1]+(b[1]-a[1])*f+range(-.005,.005),a[2]+(b[2]-a[2])*f,part,range(.49,.95),range(.45,1.15),3.3+range(0,1.1));
  }
}
function makeGeometry(){
  // Dense structured ring, like the rows of small glowing dots in the video.
  // The band is a rounded metal tube, narrow edge-on and circular face-on.
  const rows=27,around=225,R=1.00,tube=.112;
  for(let i=0;i<rows;i++){
    const v=TAU*(i+.25)/rows;
    for(let j=0;j<around;j++){
      const u=TAU*(j+(i%2)*.5)/around;
      const radial=R+tube*Math.cos(v);
      const x=radial*Math.sin(u)+range(-.004,.004);
      const y=radial*Math.cos(u)+range(-.004,.004);
      const z=.22*Math.sin(v)+range(-.012,.012);
      const bright=range(.43,.98)*(Math.cos(v)*.16+.86);
      const reveal=.3+((1+Math.cos(u))*1.05)+range(0,.42); // lower arc appears first
      dot(x,y,z,0,bright,range(.53,1.32),reveal);
    }
  }
  // Three silver fine beadwork lines across the ring's outer edge.
  for(const [rr,z] of [[.89,-.055],[1.008,.22],[1.115,-.055]]){
    for(let i=0;i<700;i++){
      const u=TAU*i/700;
      dot(rr*Math.sin(u),rr*Math.cos(u),z,0,range(.44,.96),range(.45,1.18),.38+(1+Math.cos(u))*1.08+range(0,.2));
    }
  }
  // Four clasps lifting up to the diamond mount.
  for(const xx of [-.27,-.12,.12,.27]){
    addEdge([xx*.62,.94,.04],[xx,1.48,.03],42,.87);
  }
  // Brilliant-cut diamond: lower pointed pavilion, broad girdle, cut crown and table.
  const n=12,low=[],wide=[],cap=[],upper=[];
  for(let k=0;k<n;k++){
    const a=TAU*k/n;
    const circ=(r,y,rz)=>[r*Math.sin(a),y,rz*Math.cos(a)];
    low.push(circ(.15,1.25,.15));
    wide.push(circ(.42,1.58,.30));
    cap.push(circ(.32,1.94,.24));
    upper.push(circ(.25,2.04,.18));
  }
  for(let k=0;k<n;k++){
    const nxt=(k+1)%n;
    addEdge(wide[k],wide[nxt],30,.92);
    addEdge(cap[k],cap[nxt],20,.84);
    addEdge(upper[k],upper[nxt],18,.95);
    addEdge(wide[k],cap[k],38,.89);
    addEdge(wide[k],cap[nxt],30,.51);
    addEdge(cap[k],upper[k],18,.73);
    addEdge(wide[k],low[k],35,.63);
    addEdge(low[k],[0,1.13,0],17,.66);
  }
  for(let i=0;i<1750;i++){
    const a=rnd()*TAU, f=rnd();
    const y=1.58+.46*f;
    const r=.42-.18*f;
    dot(r*Math.sin(a),y,Math.cos(a)*(.30-.12*f),1,range(.45,.99),range(.45,1.15),3.1+range(0,1.3));
  }
  for(let i=0;i<800;i++){
    const a=rnd()*TAU, f=rnd(),r=.42*(1-f);
    dot(r*Math.sin(a),1.58-.45*f,Math.cos(a)*.30*(1-f),1,range(.40,.93),range(.45,1.14),3.35+range(0,1.05));
  }
  // Floating flecks and sparse orbital dust, all behind the central silhouette.
  for(let i=0;i<930;i++){
    const a=rnd()*TAU;
    orbitDust.push({a,r:range(1.33,2.8),z:range(-1.6,1.6),y:range(-.6,1.15),brightness:range(.04,.37),size:range(.3,1.25),phase:rnd()*TAU});
  }
  for(let i=0;i<255;i++){
    background.push({x:rnd(),y:rnd(),brightness:range(.035,.33),size:range(.25,1.07),phase:rnd()*TAU});
  }
}
makeGeometry();
function resize(){
  scene.w=innerWidth;scene.h=innerHeight;scene.dpr=Math.min(devicePixelRatio||1,1.65);
  canvas.width=Math.round(scene.w*scene.dpr);
  canvas.height=Math.round(scene.h*scene.dpr);
  ctx.setTransform(scene.dpr,0,0,scene.dpr,0,0);
}
resize();addEventListener('resize',resize,{passive:true});
function projected(x,y,z,angle,tilt,cx,cy,s){
  const co=Math.cos(angle),si=Math.sin(angle);
  const rx=x*co+z*si,rz=-x*si+z*co;
  const ty=y*Math.cos(tilt)-rz*Math.sin(tilt),tz=y*Math.sin(tilt)+rz*Math.cos(tilt);
  const perspective=4.8/(4.8-tz);
  return {x:cx+rx*s*perspective,y:cy-ty*s*perspective,z:tz,p:perspective};
}
function drawCross(x,y,half,alpha){
  ctx.fillStyle=`rgba(235,244,255,${alpha})`;
  ctx.fillRect(x-half,y-.38,half*2,.76);
  ctx.fillRect(x-.38,y-half,.76,half*2);
}
function tick(now){
  const elapsed=scene.prev?clamp((now-scene.prev)/1000,0,.055):.016;
  scene.prev=now;
  if(!reduced.matches)scene.t+=elapsed;
  else if(scene.t<6)scene.t=8;
  scene.flash=Math.max(0,scene.flash-elapsed*.72);
  const t=scene.t,w=scene.w,h=scene.h;
  const cx=w*.5,cy=h*.50;
  // More space around the object, matching the very dark reference video.
  const scale=Math.min(w*.225,h*.219,188);
  const angle=reduced.matches ? .12 : .25+Math.max(0,t-3)*.43+pointer.dx*.11;
  const tilt=.075+.045*Math.cos(t*.27)+pointer.dy*.07;
  pointer.dx+=(pointer.x-pointer.dx)*.04;
  pointer.dy+=(pointer.y-pointer.dy)*.04;
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
  // Extremely faint charcoal haze keeps the original's almost black stage.
  const haze=ctx.createRadialGradient(cx,cy,scale*.2,cx,cy,scale*3.5);
  haze.addColorStop(0,'rgba(11,13,18,.75)');haze.addColorStop(.53,'rgba(3,4,6,.34)');haze.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
  for(const sp of background){
    const bright=sp.brightness*(.72+.28*Math.sin(t*.6+sp.phase));
    ctx.fillStyle=`rgba(159,175,196,${bright})`;
    ctx.fillRect(sp.x*w,sp.y*h,sp.size,sp.size);
  }
  if(t>4.5){
    const fade=Math.min(1,(t-4.5)/2.2);
    ctx.lineWidth=.48;
    for(let orbit=0;orbit<3;orbit++){
      ctx.beginPath();
      for(let i=0;i<=230;i++){
        const a=TAU*i/230;
        const rx=Math.cos(a)*(2.12+orbit*.24);
        const ry=Math.sin(a)*(.73+orbit*.12);
        const rz=Math.sin(a+orbit)*(.55+orbit*.22);
        const p=projected(rx,ry,rz,t*.12+orbit*.76,.23+orbit*.27,cx,cy,scale);
        if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
      }
      ctx.strokeStyle=`rgba(164,183,205,${[.10,.07,.05][orbit]*fade})`;ctx.stroke();
    }
    ctx.globalCompositeOperation='lighter';
    for(const particle of orbitDust){
      const a=particle.a+t*.022+particle.phase*.06;
      const ox=particle.r*Math.cos(a),oy=particle.y+Math.sin(a*2+particle.phase)*.1;
      const p=projected(ox,oy,particle.z,t*.06,tilt,cx,cy,scale);
      if(p.x<0||p.x>w||p.y<0||p.y>h)continue;
      ctx.fillStyle=`rgba(168,185,207,${particle.brightness*fade})`;
      ctx.fillRect(p.x,p.y,particle.size,particle.size);
    }
    ctx.globalCompositeOperation='source-over';
  }
  // Show facet wirework, much fainter than the bright silver particle surfaces.
  if(t>3.1){
    const fade=clamp((t-3.1)/1.3,0,1);
    ctx.lineWidth=.45;
    for(const line of facetLines){
      const a=projected(...line.a,angle,tilt,cx,cy,scale),b=projected(...line.b,angle,tilt,cx,cy,scale);
      ctx.strokeStyle=`rgba(199,213,233,${.10*fade})`;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  // Render silver points. The broad rim is built progressively bottom to top.
  ctx.globalCompositeOperation='lighter';
  const renderEvery=w<540?2:1;
  for(let i=0;i<ring.length;i+=renderEvery){
    const v=ring[i];
    if(t<v.reveal)continue;
    const reveal=clamp((t-v.reveal)/.7,0,1);
    const p=projected(v.x,v.y,v.z,angle,tilt,cx,cy,scale);
    if(p.x<-3||p.x>w+3||p.y<-3||p.y>h+3)continue;
    const specular=.7+.3*Math.cos((v.x*.45+v.z*1.4+t*.035)*3);
    const shimmer=.76+.24*Math.sin(t*(v.part?2.6:1.6)+v.twinkle);
    const depth=clamp(.65+p.z*.19,.55,1.15);
    const alpha=clamp(v.brightness*specular*shimmer*depth*reveal*1.65*(1+scene.flash*.4),.05,.94);
    const rgb=v.part?'227,235,250':'212,221,237';
    ctx.fillStyle=`rgba(${rgb},${alpha})`;
    const size=v.size*(w<540?1.15:1.07)*(.88+p.p*.12);
    ctx.fillRect(p.x,p.y,size,size);
  }
  // A few stable optical crosses make the diamond sparkle, like the reference.
  if(t>4){
    for(let k=0;k<12;k++){
      const pnt=ring[(k*733+331)%ring.length];
      const p=projected(pnt.x,pnt.y,pnt.z,angle,tilt,cx,cy,scale);
      const peak=Math.sin(t*1.9+k*2.2);
      if(peak>.70)drawCross(p.x,p.y,scale*(.024+(peak-.7)*.040),clamp((peak-.7)*1.3,0,.45));
    }
    const gem=projected(0,1.68,.19,angle,tilt,cx,cy,scale);
    const strength=.15+.25*(.5+.5*Math.sin(t*2.3));
    drawCross(gem.x,gem.y,Math.min(scale*.33,40),strength);
    drawCross(gem.x,gem.y,Math.min(scale*.09,14),strength*.85);
  }
  ctx.globalCompositeOperation='source-over';
  if(scene.frame++%20===0){
    const mm=String(Math.floor(t/60)).padStart(2,'0');
    const ss=String(Math.floor(t%60)).padStart(2,'0');
    clock.textContent=`${mm}:${ss}`;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('pointermove',e=>{
  pointer.x=clamp((e.clientX/innerWidth-.5)*2,-1,1);
  pointer.y=clamp((e.clientY/innerHeight-.5)*2,-1,1);
},{passive:true});
stage.addEventListener('pointerdown',()=>{scene.flash=1;},{passive:true});

// Original synthesized ambient soundtrack. Browsers can disallow audible autoplay;
// the first user gesture enables it without misleading the user about music playback.
let audioContext,master,interval,fileAudio,playing=false,chordIndex=0;
if(TRACK_URL){fileAudio=new Audio(TRACK_URL);fileAudio.loop=true;fileAudio.volume=.32;}
const chords=[[220,261.63,329.63,440],[174.61,220,261.63,349.23],[196,246.94,293.66,392],[164.81,196,246.94,329.63]];
function chord(){
  if(!audioContext||audioContext.state!=='running')return;
  const start=audioContext.currentTime;
  chords[chordIndex++%chords.length].forEach((freq,i)=>{
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type=i===0?'sine':'triangle';osc.frequency.value=freq/2;
    gain.gain.setValueAtTime(.00001,start);
    gain.gain.exponentialRampToValueAtTime(i===0?.042:.019,start+1.3);
    gain.gain.setTargetAtTime(.00001,start+2.1,1.1);
    osc.connect(gain);gain.connect(master);
    osc.start(start);osc.stop(start+6.2);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  });
}
function syncSound(){
  musicButton.setAttribute('aria-pressed',String(playing));
  musicButton.setAttribute('aria-label',playing?'Pause background music':'Play background music');
  musicAction.textContent=playing?'PAUSE SOUND':'PLAY SOUND';
}
async function startSound(){
  try{
    if(fileAudio){await fileAudio.play();}
    else{
      if(!audioContext){
        const AudioContextCtor=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextCtor)throw new Error('Audio unavailable');
        audioContext=new AudioContextCtor();master=audioContext.createGain();master.gain.value=.30;
        const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=870;
        master.connect(filter);filter.connect(audioContext.destination);
      }
      await audioContext.resume();
      if(!interval){chord();interval=setInterval(chord,3750);}
    }
    playing=true;syncSound();return true;
  }catch(e){playing=false;syncSound();return false;}
}
async function stopSound(){
  if(fileAudio)fileAudio.pause();else if(audioContext)await audioContext.suspend();
  playing=false;syncSound();
}
musicButton.addEventListener('click',async e=>{
  e.stopPropagation();
  if(playing)await stopSound();
  else if(!(await startSound()))status.textContent='Press play to enable audio';
});
// Autoplay attempt; the next real interaction retries where browsers block it.
startSound();
function activateAudio(e){if(!playing&&!(e.target?.closest?.('#music-toggle')))startSound();}
document.addEventListener('pointerdown',activateAudio,{passive:true});
document.addEventListener('keydown',activateAudio);
document.addEventListener('visibilitychange',()=>{
  if(!fileAudio&&audioContext&&playing){
    if(document.hidden)audioContext.suspend();else audioContext.resume().catch(()=>{});
  }
});