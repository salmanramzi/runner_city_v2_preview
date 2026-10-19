'use strict';
(()=>{
const $=id=>document.getElementById(id);const canvas=$('scene');const gl=canvas.getContext('webgl',{antialias:true,alpha:false});if(!gl){alert('هذا الجهاز لا يدعم WebGL');return}
const VS=`attribute vec3 position;attribute vec3 vertexColor;uniform vec3 offset;uniform vec3 scale;uniform float time;uniform float aspect;varying vec3 color;varying float haze;void main(){vec3 p=position*scale+offset;vec3 forward=normalize(vec3(0.0,-0.20,-1.0));vec3 up=normalize(vec3(0.0,1.0,-0.20));vec3 rel=p-vec3(0.,4.8,11.0);float d=max(.1,dot(rel,forward));float x=dot(rel,vec3(1.,0.,0.));float y=dot(rel,up);float f=1.55;float z=(100.2/99.8)*d-(40.0/99.8);gl_Position=vec4(x*f*aspect,y*f,z,d);color=vertexColor;haze=d;}`;
const FS=`precision mediump float;varying vec3 color;varying float haze;void main(){vec3 sun=vec3(.99,.77,.52);vec3 sky=mix(vec3(.39,.62,.88),vec3(.76,.84,.94),clamp(haze*.025,0.,1.));vec3 c=mix(color,sky,clamp((haze-15.)/85.,0.,.86));gl_FragColor=vec4(pow(c,vec3(.92)),1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);const loc={p:gl.getAttribLocation(prog,'position'),c:gl.getAttribLocation(prog,'vertexColor'),o:gl.getUniformLocation(prog,'offset'),s:gl.getUniformLocation(prog,'scale'),a:gl.getUniformLocation(prog,'aspect'),t:gl.getUniformLocation(prog,'time')};
const buffers=new Map();function cylinderMesh(){const verts=[],cols=[];const n=20;for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;for(let p of [[Math.cos(a)*.5,-.5,Math.sin(a)*.5],[Math.cos(b)*.5,-.5,Math.sin(b)*.5],[Math.cos(b)*.5,.5,Math.sin(b)*.5],[Math.cos(a)*.5,-.5,Math.sin(a)*.5],[Math.cos(b)*.5,.5,Math.sin(b)*.5],[Math.cos(a)*.5,.5,Math.sin(a)*.5]]){verts.push(...p);let l=.72+.28*Math.max(0,Math.sin(a+.6));cols.push(l,l,l)}}return{verts,cols}}function cubeMesh(){const faces=[[[0,0,1],[1,0,1],[1,1,1],[0,1,1],.9],[[1,0,0],[0,0,0],[0,1,0],[1,1,0],.55],[[0,0,0],[0,0,1],[0,1,1],[0,1,0],.73],[[1,0,1],[1,0,0],[1,1,0],[1,1,1],.67],[[0,1,1],[1,1,1],[1,1,0],[0,1,0],1.2],[[0,0,0],[1,0,0],[1,0,1],[0,0,1],.43]];const verts=[],cols=[];for(let f of faces){let ids=[0,1,2,0,2,3];for(let id of ids){const v=f[id];verts.push(v[0]-.5,v[1]-.5,v[2]-.5);cols.push(f[4],f[4],f[4]);}}return{verts,cols}}
function sphereMesh(){const verts=[],cols=[];const lat=14,long=20;for(let y=0;y<lat;y++)for(let x=0;x<long;x++){let points=[];for(const [i,j] of [[x,y],[x+1,y],[x+1,y+1],[x,y],[x+1,y+1],[x,y+1]]){let a=i/long*2*Math.PI,b=j/lat*Math.PI;points.push([Math.cos(a)*Math.sin(b)*.5,Math.cos(b)*.5,Math.sin(a)*Math.sin(b)*.5])}for(let p of points){verts.push(...p);let k=.68+.32*(p[1]+.5);cols.push(k,k,k)}}return{verts,cols}}
function mesh(name,data){const vb=gl.createBuffer(),cb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.verts),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.cols),gl.STATIC_DRAW);buffers.set(name,{vb,cb,count:data.verts.length/3})}mesh('cube',cubeMesh());mesh('sphere',sphereMesh());mesh('cylinder',cylinderMesh());gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.38,.60,.83,1);
function draw(kind,x,y,z,sx,sy,sz,color){const m=buffers.get(kind);gl.uniform3f(loc.o,x,y,z);gl.uniform3f(loc.s,sx,sy,sz);gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.p);gl.bindBuffer(gl.ARRAY_BUFFER,m.cb);gl.vertexAttribPointer(loc.c,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.c);// Vertex colors and tints are applied in the vertex shader
// RGB factor via temporary color attribute is replaced with uniform tint below
 gl.uniform3fv(tintLoc,color);gl.drawArrays(gl.TRIANGLES,0,m.count)}
// Recompile with tint uniform, keeping vertex shaded colors
const vert2=VS.replace('uniform float aspect;','uniform float aspect;uniform vec3 tint;').replace('color=vertexColor;','color=vertexColor*tint;');const vp=shader(gl.VERTEX_SHADER,vert2);const fp=shader(gl.FRAGMENT_SHADER,FS);const p2=gl.createProgram();gl.attachShader(p2,vp);gl.attachShader(p2,fp);gl.linkProgram(p2);gl.useProgram(p2);loc.p=gl.getAttribLocation(p2,'position');loc.c=gl.getAttribLocation(p2,'vertexColor');loc.o=gl.getUniformLocation(p2,'offset');loc.s=gl.getUniformLocation(p2,'scale');loc.a=gl.getUniformLocation(p2,'aspect');loc.t=gl.getUniformLocation(p2,'time');const tintLoc=gl.getUniformLocation(p2,'tint');
let running=false,ended=false,paused=false,lane=1,x=0,velocity=0,jump=0,slide=0,meters=0,coins=0,life=3,speed=14,objects=[],spawn=0,clock=0,best=0,last=0,audio=null,snap=null,snapReady=false,snapLeaderboard=false;const laneX=[-2.55,0,2.55];let feedbackTime=0;
function beep(freq=700,dur=.1,type='sine'){try{if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch{}}
function notice(s){const n=$('notice');n.textContent=s;n.style.display='block';feedbackTime=.8}function updateText(){$('meters').textContent=Math.floor(meters);$('coins').textContent=coins;$('best').textContent=best;$('hearts').textContent='❤️'.repeat(life)+'🖤'.repeat(3-life)}
function begin(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{} running=true;ended=false;paused=false;lane=1;x=0;velocity=0;jump=0;slide=0;meters=0;coins=0;life=3;speed=14;objects=[];spawn=.35;clock=0;last=performance.now();$('menu').classList.add('hidden');$('over').classList.add('hidden');$('hud').style.display='block';$('actions').style.display='flex';updateText();beep(800,.13)}
function move(d){if(!running||paused)return;lane=Math.max(0,Math.min(2,lane+d));beep(370,.045)}function leap(){if(running&&!paused&&jump<=0&&slide<=0){velocity=8.8;beep(660,.13)}}function duck(){if(running&&!paused&&jump<=0){slide=.92;beep(240,.12)}}
function createRow(){let chosen=Math.floor(Math.random()*3);const type=Math.random()<.32?'coin':Math.random()<.54?'gate':'block';objects.push({lane:chosen,z:-63,type,hit:false,age:0});if(Math.random()<.46){const other=(chosen+1+Math.floor(Math.random()*2))%3;objects.push({lane:other,z:-63,type:'coin',hit:false,age:0})}}
async function saveSnapBest(score){try{if(snapReady&&snap?.isSupported('storage'))await snap.storage.set('runnerBest',score)}catch(e){console.warn('Could not save Snap best score',e)}}
function finish(){running=false;ended=true;$('actions').style.display='none';$('result').textContent=Math.floor(meters);$('collected').textContent=coins;const score=Math.floor(meters)+coins*20;$('score').textContent=score;const old=best;if(score>best){best=score;localStorage.setItem('runnerBest',String(best)); saveSnapBest(best);$('recordText').textContent='🎉 رقم قياسي جديد!';}else $('recordText').textContent='اضغط إعادة اللعب وحطّم رقمك!';$('over').classList.remove('hidden');updateText();beep(130,.42,'sawtooth');if(snapReady&&snap?.isSupported('leaderboards'))snap.leaderboards.submitScore({score}).then(()=>{$('boardStatus').textContent='✅ تم تسجيل النتيجة في سناب'}).catch(()=>{$('boardStatus').textContent='تعذّر إرسال النتيجة إلى سناب'});else $('boardStatus').textContent='الترتيب الرسمي يظهر بعد نشر العدسة وتفعيله';}
function simulate(dt){if(!running||paused)return;clock+=dt;speed=Math.min(33,14+meters/170);meters+=speed*dt*1.6;x+=(laneX[lane]-x)*Math.min(1,dt*13);if(jump>0||velocity>0){jump+=velocity*dt;velocity-=24*dt;if(jump<0){jump=0;velocity=0}}if(slide>0)slide-=dt;spawn-=dt;if(spawn<=0){createRow();spawn=Math.max(.48,1.05-speed*.013)}for(let o of objects){o.z+=speed*dt*1.5;o.age+=dt;if(!o.hit&&Math.abs(o.z-3)<1.25&&o.lane===lane){o.hit=true;if(o.type==='coin'){coins++;beep(1000,.08);notice('+1 💎')}else if((o.type==='block'&&jump<1.35)||(o.type==='gate'&&slide<=0)){life--;beep(140,.2,'square');notice('💥 انتبه!');if(navigator.vibrate)navigator.vibrate(55);if(life<=0){finish();break}}}}objects=objects.filter(o=>o.z<14);if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0)$('notice').style.display='none'}updateText()}
function render(){
 gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(loc.a,canvas.height/canvas.width);gl.uniform1f(loc.t,clock);
 // Distinct warm arcade boardwalk, light-colored pavements, medians and running lanes.
 draw('cube',0,-.94,-27,11,.16,116,[.28,.35,.48]);
 draw('cube',-5.65,-.82,-27,2.05,.40,116,[.88,.73,.51]);draw('cube',5.65,-.82,-27,2.05,.40,116,[.88,.73,.51]);
 draw('cube',-4.46,-.54,-27,.20,.24,116,[1,.87,.48]);draw('cube',4.46,-.54,-27,.20,.24,116,[1,.87,.48]);
 // Moving turquoise and gold lane dividers; warm lighting.
 for(let z=-73;z<=13;z+=5.3){let zz=z+(meters*1.16%5.3);for(let x0 of [-1.42,1.42]){draw('cube',x0,-.81,zz,.10,.035,2.18,[1,.92,.61]);draw('cube',x0,-.77,zz,.037,.018,.95,[.34,.95,1])}}
 // Colorful storefronts with awnings, windows, poles, lamps, planter pots and foliage.
 for(let i=0;i<10;i++){
  let z=-72+i*9.3+(meters*.7%9.3);
  for(let side of [-1,1]){
   let bx=side*(7.6+(i%3)*.32),height=4+(i*7%4)*.72;
   let palettes=[[.94,.47,.47],[.40,.67,.90],[.81,.64,.90],[.93,.70,.48],[.55,.82,.74]];
   let pc=palettes[(i+(side===1?2:0))%palettes.length];
   draw('cube',bx,height*.5-.62,z,2.5,height,3.25,pc);
   draw('cube',bx,height-.35,z,2.65,.28,3.5,[.98,.89,.72]);
   for(let level=0;level<2;level++){
     draw('cube',bx-side*1.27,1.55+level*1.55,z,.10,.66,.88,[.20,.41,.60]);
     draw('cube',bx-side*1.35,1.55+level*1.55,z,.06,.38,.62,[.59,.87,.93]);
   }
   // Tall lantern with glowing orb, palm-like canopy and small planter.
   let tx=side*5.10;
   draw('cylinder',tx,.63,z,.22,1.65,.22,[.35,.31,.38]);
   draw('sphere',tx,1.72,z,.58,.58,.58,[1,.83,.45]);
   draw('sphere',tx,1.75,z,.34,.37,.35,[1,.98,.78]);
   let treeX=side*6.2,treeZ=z+3.4;
   draw('cylinder',treeX,1.02,treeZ,.36,2.10,.36,[.46,.31,.22]);
   for(let j=0;j<4;j++){
     draw('sphere',treeX+Math.cos(j*1.57)*.53,2.38+((j%2)*.27),treeZ+Math.sin(j*1.57)*.4,1.18,.80,.98,j%2?[.26,.72,.43]:[.20,.62,.35]);
   }
   draw('sphere',treeX,2.65,treeZ,1.05,.90,1.05,[.27,.76,.40]);
  }
 }
 // Bright overhead arches at long distance, enhancing scene scale.
 for(let i=0;i<3;i++){
   let z=-67+i*28+(meters*.74%28);
   draw('cylinder',-4.5,2.22,z,.28,4.8,.28,[.98,.75,.37]);draw('cylinder',4.5,2.22,z,.28,4.8,.28,[.98,.75,.37]);
   draw('cube',0,4.48,z,9.35,.32,.54,[1,.80,.45]);
   draw('cube',0,4.66,z,3.2,.58,.27,[.22,.62,.82]);
 }
 // Rounded collectible gems and redesigned lane obstacles.
 for(let o of objects){const xx=laneX[o.lane];
  if(o.type==='coin'){
   const wob=Math.sin(clock*6+o.age)*.20;
   draw('sphere',xx,1.52+wob,o.z,.58,.67,.26,[1,.81,.20]);
   draw('sphere',xx,1.53+wob,o.z+.23,.34,.38,.13,[1,.97,.62]);
   draw('sphere',xx,1.53+wob,o.z+.32,.13,.15,.06,[1,.73,.24]);
  }else if(o.type==='gate'){
   draw('cylinder',xx-.94,1.36,o.z,.26,2.76,.26,[.78,.19,.32]);draw('cylinder',xx+.94,1.36,o.z,.26,2.76,.26,[.78,.19,.32]);
   draw('cube',xx,2.70,o.z,2.16,.61,.62,[1,.35,.30]);draw('cube',xx,2.71,o.z+.34,1.85,.27,.05,[1,.93,.60]);
   draw('sphere',xx-.94,2.88,o.z,.23,.23,.23,[1,.94,.60]);draw('sphere',xx+.94,2.88,o.z,.23,.23,.23,[1,.94,.60]);
  }else{
   draw('cube',xx,.57,o.z,1.83,1.10,1.05,[.93,.28,.28]);draw('cube',xx,.61,o.z+.56,1.61,.56,.07,[1,.93,.73]);
   for(let a of [-.53,.0,.53])draw('cube',xx+a,.62,o.z+.62,.23,.61,.08,[.91,.27,.30]);
   draw('sphere',xx-.68,1.11,o.z,.16,.19,.17,[1,.78,.36]);draw('sphere',xx+.68,1.11,o.z,.16,.19,.17,[1,.78,.36]);
  }
 }
 // Properly rounded default runner. It is NOT an official 3D Bitmoji avatar.
 const stride=Math.sin(clock*13)*.30,cy=jump+(slide>0?.11:0),compact=slide>0?.63:1;
 const swing=(running?stride:0),bob=(running?Math.abs(Math.sin(clock*13))*.08:0);
 draw('sphere',x,-.64,3,1.02,.035,.46,[.18,.20,.30]);
 // legs: paired cylinder/sphere meshes with separate run phases
 for(let i of [-1,1]){
  const lift=Math.max(0,swing*i);
  draw('cylinder',x+i*.31,.59+cy+lift,3+i*swing*.22,.34,.96,.38,[.18,.28,.56]);
  draw('sphere',x+i*.31,.18+cy+lift,3.30+i*swing*.36,.46,.24,.68,[1,.96,.87]);
  draw('sphere',x+i*.31,.26+cy+lift,3.02+i*swing*.3,.28,.26,.32,[.17,.24,.51]);
 }
 // jacket torso, belly, sleeves and backpack; limbs animated without blocky shoulders
 draw('sphere',x,1.48*compact+cy+bob,3,.79,.85*compact,.57,[.25,.59,.94]);
 draw('sphere',x,1.42*compact+cy+bob,3.37,.53,.57*compact,.18,[.98,.84,.36]);
 draw('sphere',x,1.58*compact+cy+bob,2.53,.43,.61,.22,[.93,.44,.39]);
 for(let i of [-1,1]){
  draw('sphere',x+i*.83,1.56*compact+cy+bob+i*swing*.21,3,.30,.51,.31,[.23,.47,.78]);
  draw('sphere',x+i*.88,1.06*compact+cy+bob+i*swing*.22,3.11,.24,.25,.24,[.94,.69,.50]);
 }
 // head with hair volume, ears, eyes (front-facing), nose and smile
 const hy=2.51*compact+cy+bob;
 draw('sphere',x,hy,3.03,.65,.72,.60,[.99,.76,.57]);
 draw('sphere',x-.64,hy,3.03,.16,.24,.19,[.95,.69,.52]);draw('sphere',x+.64,hy,3.03,.16,.24,.19,[.95,.69,.52]);
 draw('sphere',x,hy+.49,2.99,.69,.37,.64,[.17,.16,.23]);
 for(let i=-2;i<=2;i++)draw('sphere',x+i*.24,hy+.59+(i%2)*.08,3.31,.26,.22,.25,[.16,.16,.24]);
 for(let i of [-1,1]){
  draw('sphere',x+i*.24,hy+.06,3.596,.145,.17,.095,[1,1,1]);
  draw('sphere',x+i*.24,hy+.045,3.683,.071,.10,.044,[.14,.20,.29]);
  draw('sphere',x+i*.24-.025,hy+.09,3.72,.025,.035,.018,[1,1,1]);
  draw('sphere',x+i*.25,hy+.30,3.53,.23,.065,.09,[.19,.16,.21]);
 }
 draw('sphere',x,hy-.19,3.602,.14,.07,.08,[.84,.49,.39]);
}
function loop(t){const dt=Math.min(.05,(t-last)/1000||.016);last=t;simulate(dt);render();requestAnimationFrame(loop)}function resize(){let dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr)}addEventListener('resize',resize);resize();
$('start').onclick=begin;$('again').onclick=begin;$('left').onclick=()=>move(-1);$('right').onclick=()=>move(1);$('jump').onclick=leap;$('slide').onclick=duck;
let startX,startY;canvas.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY});canvas.addEventListener('pointerup',e=>{if(startX===undefined)return;let dx=e.clientX-startX,dy=e.clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<20){leap()}else if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else if(dy<0)leap();else duck();startX=undefined});addEventListener('keydown',e=>{if(['ArrowLeft','a'].includes(e.key))move(-1);if(['ArrowRight','d'].includes(e.key))move(1);if(['ArrowUp',' ','w'].includes(e.key))leap();if(['ArrowDown','s'].includes(e.key))duck()});document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=performance.now()});addEventListener('contextmenu',e=>e.preventDefault());
$('leaderboard').onclick=async()=>{if(snapReady&&snapLeaderboard){try{await snap.leaderboards.show()}catch{$('boardStatus').textContent='تعذّر عرض ترتيب سناب الآن'}}else $('boardStatus').textContent='الترتيب الرسمي يتطلب نشر العدسة وتفعيل لوحة المتصدرين.'};best=Number(localStorage.getItem('runnerBest')||0);updateText();
// Snap API is loaded from a bundled local file when present; never overstate integration.
(async()=>{try{if(!window.snapchat)return;snap=window.snapchat;await snap.init();snapReady=!snap.isStub;snapLeaderboard=snapReady&&snap.isSupported('leaderboards');$('mode').textContent=snapReady?'Snap Web Lens API متصل':'تجربة متصفح بشخصية بديلة';if(snapReady&&snap.isSupported('storage')){try{const saved=await snap.storage.get('runnerBest');if(Number(saved)>best){best=Number(saved);updateText()}}catch(e){console.warn('Snap storage unavailable',e)}}if(snapReady&&snap.isSupported('bitmoji')){try{const info=await snap.bitmoji.getAvatarInfo();if(info.hasAvatar){const {url}=await snap.bitmoji.get2DAvatar({size:'large'});const img=$('playerPortrait');img.onload=()=>img.style.display='block';img.src=url;$('mode').textContent='صورة Bitmoji الحقيقية متصلة؛ مجسم الركض 3D بديل مؤقت'}}catch(e){console.warn('Bitmoji avatar unavailable',e)}}}catch(e){console.warn('Snap API unavailable',e)}})();requestAnimationFrame(loop);
})();
