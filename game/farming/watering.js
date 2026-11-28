import {createWateringProgress} from './watering-progress.js';
const art=id=>new URL(`../../assets/scenes/garden/props/10-strawberry-garden/images/${id}.png`,import.meta.url).href;
export function mountWatering({scene,garden,plot,onPick,onRelease,onWatered,onMessage}){
 const progress=createWateringProgress(),tool=document.createElement('button'),target=document.createElement('div'),effects=document.createElement('div');
 tool.type='button';tool.id='farm-watering-can';tool.className='watering-can';tool.setAttribute('aria-label','משפך: גררי מעל השתיל והשקי את שלושת אזורי האדמה. במקלדת חצים להזזה ורווח להשקיה');
 tool.innerHTML='<img class="can-handle" alt=""><img class="can-spout" alt=""><img class="can-body" alt=""><span class="can-caption">גררי מעל השתיל</span>';
 for(const [selector,id]of [['.can-handle','can-handle'],['.can-spout','can-spout'],['.can-body','watering-can']])tool.querySelector(selector).src=art(id);
 target.className='watering-target';target.id='farm-water-target';target.innerHTML='<img class="wet-soil" alt=""><div class="water-pips" role="progressbar" aria-label="השקיית שלושת אזורי האדמה" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>';target.firstElementChild.src=art('soil-wet');
 for(let i=0;i<3;i++){const drop=new Image();drop.src=art('drop-large');drop.alt='';target.lastElementChild.append(drop);}
 effects.className='watering-effects';scene.append(target,effects,tool);
 let active=false,available=false,held=false,pointer=null,keyboardPour=false,raf=0,last=0,emitted=0,x=0,y=0,dock={x:0,y:0},zoneRect,completed=false,sway,lastAnnouncement=-1,lastWidth=0,lastHeight=0;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function place(){tool.style.left=x+'px';tool.style.top=y+'px';}
 function snapshot(){return progress.snapshot();}
 function refresh(){
  const state=garden.snapshot(),stage=state.plots[0].stage,planted=state.enabled&&stage==='planted';available=active&&planted&&!completed&&!plot.button.hidden;tool.hidden=!available;target.hidden=!active||plot.button.hidden||!['planted','growing'].includes(stage);target.lastElementChild.hidden=!available;target.style.setProperty('--wet',stage==='growing'?1:snapshot().value);tool.disabled=!available;
  if(!available&&held)release();
 }
 function layout(){
  if(held&&(scene.clientWidth!==lastWidth||scene.clientHeight!==lastHeight))release();lastWidth=scene.clientWidth;lastHeight=scene.clientHeight;
  const sceneBox=scene.getBoundingClientRect(),box=plot.button.getBoundingClientRect();
  const ground=box.top-sceneBox.top+plot.artwork.clientHeight*.87;
  const width=Math.min(240,Math.max(130,box.width*.66));
  zoneRect={left:box.left-sceneBox.left+(box.width-width)/2,top:ground-18,width,height:58};
  Object.assign(target.style,{left:zoneRect.left+'px',top:zoneRect.top+'px',width:width+'px',height:'58px'});
  dock={x:Math.max(10,Math.min(scene.clientWidth-170,zoneRect.left-130)),y:Math.max(260,Math.min(scene.clientHeight-240,ground+100))};
  if(!held){x=dock.x;y=dock.y;place();}
 }
 function updateVisual(){const state=snapshot();target.style.setProperty('--wet',state.value);target.lastElementChild.setAttribute('aria-valuenow',Math.round(state.value*100));[...target.lastElementChild.children].forEach((drop,i)=>{drop.style.opacity=String(.2+state.zones[i]*.8);drop.dataset.filled=String(state.zones[i]>=.999);});}
 function stopEffects(){tool.dataset.pouring='false';target.dataset.pouring='false';sway?.cancel();sway=null;}
 function release(){const wasHeld=held;held=false;keyboardPour=false;pointer=null;cancelAnimationFrame(raf);raf=0;stopEffects();tool.dataset.held='false';x=dock.x;y=dock.y;place();if(wasHeld)onRelease?.();}
 function begin(){if(!available||held)return;held=true;tool.dataset.held='true';last=performance.now();emitted=0;onPick?.();raf=requestAnimationFrame(tick);}
 function droplet(tip,ground){
  const img=new Image();img.src=art(['drop-large','drop-medium','drop-small'][Math.floor(Math.random()*3)]);img.alt='';img.style.left=(tip.x-5)+'px';img.style.top=tip.y+'px';effects.append(img);
  if(reduced){img.style.top=(ground-12)+'px';setTimeout(()=>img.remove(),100);return;}
  const animation=img.animate([{transform:'translate(0,0) scale(.6)',opacity:.9},{transform:`translate(${(Math.random()-.5)*16}px,${ground-tip.y}px) scale(.9)`,opacity:.8},{transform:`translate(${(Math.random()-.5)*30}px,${ground-tip.y+3}px) scale(.35)`,opacity:0}],{duration:340,easing:'ease-in'});animation.finished.then(()=>img.remove()).catch(()=>img.remove());
 }
 function tick(now){
  if(!held||!available||document.hidden){release();return;}
  const dt=Math.min((now-last)/1000,.08);last=now;
  // Position of the illustrated spout after a 32-degree tilt around the handle.
  const tip={x:x+146,y:y+87},ground=zoneRect.top+20;
  const inSoil=tip.x>=zoneRect.left&&tip.x<=zoneRect.left+zoneRect.width&&tip.y>=ground-180&&tip.y<=ground-18;
  const pouring=inSoil&&(pointer!==null||keyboardPour);
  tool.dataset.pouring=String(pouring);target.dataset.pouring=String(pouring);
  if(pouring){
   const zone=Math.min(2,Math.floor((tip.x-zoneRect.left)/zoneRect.width*3));progress.step(zone,dt);updateVisual();
   emitted+=dt;if(emitted>=.07){emitted=0;droplet(tip,ground);}
   if(!sway&&!reduced)sway=plot.plant.animate([{rotate:'-1.5deg'},{rotate:'1.5deg'},{rotate:'-1.5deg'}],{duration:900,iterations:Infinity,easing:'ease-in-out'});
   const amount=Math.floor(snapshot().value*10);if(amount!==lastAnnouncement){lastAnnouncement=amount;if(amount===3||amount===6)onMessage?.('יפה! נשקה גם את הצד השני של השתיל.');}
   if(snapshot().complete){
    try{const result=garden.act(garden.snapshot().plots[0].id);completed=true;release();refresh();onWatered(result);}catch(error){release();onMessage?.(error.message);}
    return;
   }
  }else {sway?.cancel();sway=null;}
  raf=requestAnimationFrame(tick);
 }
 tool.onpointerdown=e=>{if(!available||e.button!==0||e.isPrimary===false)return;e.preventDefault();if(held)release();pointer=e.pointerId;tool.setPointerCapture(e.pointerId);begin();const rect=scene.getBoundingClientRect();x=Math.max(-30,Math.min(scene.clientWidth-100,e.clientX-rect.left-65));y=Math.max(0,Math.min(scene.clientHeight-130,e.clientY-rect.top-45));place();};
 tool.onpointermove=e=>{if(e.pointerId!==pointer||!held)return;const rect=scene.getBoundingClientRect();x=Math.max(-30,Math.min(scene.clientWidth-100,e.clientX-rect.left-65));y=Math.max(0,Math.min(scene.clientHeight-130,e.clientY-rect.top-45));place();};
 tool.onpointerup=tool.onpointercancel=()=>release();tool.onlostpointercapture=()=>{if(held&&pointer!==null)release();};
 tool.onkeydown=e=>{
  if(!available)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','Escape'].includes(e.key))e.preventDefault();
  if(e.key==='Escape'){release();return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)){begin();if(e.key===' '||e.key==='Enter')keyboardPour=true;const delta=e.shiftKey?5:14;x+=e.key==='ArrowLeft'?-delta:e.key==='ArrowRight'?delta:0;y+=e.key==='ArrowUp'?-delta:e.key==='ArrowDown'?delta:0;x=Math.max(-30,Math.min(scene.clientWidth-100,x));y=Math.max(0,Math.min(scene.clientHeight-130,y));place();}
 };
 tool.onkeyup=e=>{if(e.key===' '||e.key==='Enter'){keyboardPour=false;stopEffects();}};tool.onblur=()=>{if(pointer===null)release();};
 const pause=()=>{if(document.hidden)release();};document.addEventListener('visibilitychange',pause);window.addEventListener('blur',release);
 updateVisual();
 return {refresh,layout,setVisible(value){active=value;if(!value){release();effects.replaceChildren();progress.reset();completed=false;lastAnnouncement=-1;updateVisual();}refresh();},destroy(){release();document.removeEventListener('visibilitychange',pause);window.removeEventListener('blur',release);tool.remove();target.remove();effects.remove();}};
}
