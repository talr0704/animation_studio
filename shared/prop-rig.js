/* Shared, data-only prop format and renderer used by the studio and the game. */
const finite=(n,min=-10000,max=10000)=>Number.isFinite(n)&&n>=min&&n<=max;
const pair=(v,min=-10000,max=10000)=>Array.isArray(v)&&v.length===2&&v.every(n=>finite(n,min,max));
const id=v=>typeof v==='string'&&/^[a-z][a-z0-9.-]{0,70}$/.test(v);
export function validateProp(rig){
 if(!rig||rig.version!==1||!id(rig.id)||!pair(rig.canvas,1,2000)||!Array.isArray(rig.parts)||!rig.parts.length||rig.parts.length>40)throw Error('קובץ הרכבה לא תקין');
 const ids=new Set();
 for(const p of rig.parts){
  if(!id(p.id)||ids.has(p.id)||typeof p.image!=='string'||!/^assets\/[a-zA-Z0-9/_ .-]+\.(png|svg|webp)$/.test(p.image)||p.image.includes('..')||!pair(p.sourceSize,1,10000)||!pair(p.anchor)||!pair(p.position)||!finite(p.scale,.001,20)||(p.scaleY!==undefined&&!finite(p.scaleY,.001,20))||!finite(p.rotation,-3600,3600)||!Number.isInteger(p.layer)||!finite(p.layer,-100,100))throw Error('נתוני חלק לא תקינים');
  ids.add(p.id);
 }
 for(const p of rig.parts){
  const seen=new Set([p.id]);let parent=p.parent;
  while(parent){if(!ids.has(parent)||seen.has(parent))throw Error('קשרי ההורות יוצרים מעגל או מפנים לחלק חסר');seen.add(parent);parent=rig.parts.find(p=>p.id===parent).parent;}
 }
 return rig;
}
export function validateClip(clip,rig){
 if(!clip||clip.version!==1||clip.prop!==rig.id||!id(clip.id)||!finite(clip.duration,.05,30)||!['linear','ease-in-out'].includes(clip.easing)||!Array.isArray(clip.tracks)||clip.tracks.length>40)throw Error('קובץ האנימציה לא מתאים לאביזר');
 const tracks=new Set();
 for(const t of clip.tracks){
  if(!rig.parts.some(p=>p.id===t.part)||tracks.has(t.part)||!Array.isArray(t.keys)||t.keys.length<1||t.keys.length>200)throw Error('ערוץ אנימציה לא תקין');tracks.add(t.part);
  let last=-1;
  for(const k of t.keys){if(!finite(k.time,0,clip.duration)||k.time<=last||!finite(k.rotation,-3600,3600)||!finite(k.x)||!finite(k.y))throw Error('פריימים לא תקינים או לא מסודרים בזמן');last=k.time;}
 }
 return clip;
}
export function poseAt(clip,part,time){
 const keys=clip?.tracks.find(t=>t.part===part)?.keys;
 if(!keys?.length)return {x:0,y:0,rotation:0};
 if(time<=keys[0].time)return {...keys[0]};
 if(time>=keys.at(-1).time)return {...keys.at(-1)};
 const b=keys.findIndex(k=>k.time>time),a=keys[b-1],z=keys[b];let t=(time-a.time)/(z.time-a.time);
 if(clip.easing==='ease-in-out')t=t*t*(3-2*t);
 return {x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t,rotation:a.rotation+(z.rotation-a.rotation)*t};
}
export function partFrames(clip,part){
 const keys=clip.tracks.find(t=>t.part===part)?.keys??[{time:0,x:0,y:0,rotation:0}];
 const steps=Math.max(1,Math.ceil(clip.duration*60));
 const times=[...new Set([...Array.from({length:steps+1},(_,i)=>i*clip.duration/steps),...keys.map(k=>k.time)])].sort((a,b)=>a-b);
 return times.map(time=>{const p=poseAt(clip,part,time);return {offset:time/clip.duration,transform:`translate(${p.x}px,${p.y}px) rotate(${p.rotation}deg)`};});
}
export function mountProp(container,rig,{assetUrl=path=>new URL('../'+path,import.meta.url).href}={}){
 validateProp(rig);container.replaceChildren();const nodes=new Map();
 for(const p of rig.parts){
  const base=document.createElement('div'),motion=document.createElement('div'),img=new Image();
  base.dataset.propPart=p.id;motion.dataset.propMotion=p.id;
  // Legacy class names remain available for the existing scissors hit/pivot checks.
  if(p.id==='blade-left')motion.className='blade a';if(p.id==='blade-right')motion.className='blade b';
  Object.assign(base.style,{position:'absolute',left:p.position[0]+'px',top:p.position[1]+'px',width:'0',height:'0',transform:`rotate(${p.rotation}deg)`,transformOrigin:'0 0',zIndex:p.layer});
  Object.assign(motion.style,{position:'absolute',left:'0',top:'0',width:'0',height:'0',transformOrigin:'0 0'});
  img.src=assetUrl(p.image);img.alt=p.label??p.id;img.draggable=false;img.dataset.propImage=p.id;if(p.id==='bolt')img.className='bolt';
  Object.assign(img.style,{position:'absolute',maxWidth:'none',width:p.sourceSize[0]*p.scale+'px',height:p.sourceSize[1]*(p.scaleY??p.scale)+'px',left:-p.anchor[0]*p.scale+'px',top:-p.anchor[1]*(p.scaleY??p.scale)+'px',pointerEvents:'none'});
  motion.append(img);base.append(motion);nodes.set(p.id,{base,motion,img});
 }
 for(const p of rig.parts)(p.parent?nodes.get(p.parent).motion:container).append(nodes.get(p.id).base);
 return {nodes,render(clip,time){for(const p of rig.parts){const pose=poseAt(clip,p.id,time);nodes.get(p.id).motion.style.transform=`translate(${pose.x}px,${pose.y}px) rotate(${pose.rotation}deg)`;}},ready:Promise.all([...nodes.values()].map(n=>n.img.decode()))};
}
