import {validateExpressions,expressionAt} from './momo-expressions.js?v=larger-eyes2';
const poseFields=['x','y','rotate','scale','scaleX','scaleY','opacity','transformOriginX','transformOriginY'];
export function validateMomoAnimations(clips,parts){
 if(!clips||typeof clips!=='object'||Array.isArray(clips)||!Object.keys(clips).length||Object.keys(clips).length>50)throw Error('קובץ האנימציות אינו תקין');
 for(const [id,clip]of Object.entries(clips)){
  if(!/^[a-z][a-z0-9-]{0,70}$/.test(id)||typeof clip.name!=='string'||clip.name.length>100||/[<>&]/.test(clip.name)||!Number.isFinite(clip.duration)||clip.duration<.1||clip.duration>30||typeof clip.loop!=='boolean'||!Array.isArray(clip.keyframes)||clip.keyframes.length>5000)throw Error('נתוני תנועה אינם תקינים');
  validateExpressions(clip);
  const ids=new Set();
  for(const k of clip.keyframes){
   if(typeof k.id!=='string'||ids.has(k.id)||!parts.includes(k.part)||!Number.isFinite(k.time)||k.time<0||k.time>clip.duration||typeof k.ease!=='string'||!/^[a-zA-Z0-9.]+$/.test(k.ease)||!k.values||poseFields.some(key=>!Number.isFinite(k.values[key])))throw Error('פריים לא תקין');
   ids.add(k.id);const v=k.values;
   if(Math.abs(v.x)>2000||Math.abs(v.y)>2000||Math.abs(v.rotate)>720||v.opacity<0||v.opacity>1||['scale','scaleX','scaleY'].some(key=>v[key]<0||v[key]>3)||Math.abs(v.transformOriginX)>300||Math.abs(v.transformOriginY)>300)throw Error('ערכי פריים מחוץ לטווח');
  }
 }
 return clips;
}
export function motionEase(name,t){
 if(name==='none')return t>=1?1:0;
 if(name==='sine.inOut')return -(Math.cos(Math.PI*t)-1)/2;
 if(name==='sine.in')return 1-Math.cos(Math.PI*t/2);
 if(name==='sine.out')return Math.sin(Math.PI*t/2);
 const power=/^power([12])\.(in|out|inOut)$/.exec(name);
 if(power){const p=Number(power[1])+1;return power[2]==='in'?t**p:power[2]==='out'?1-(1-t)**p:t<.5?(2*t)**p/2:1-(2*(1-t))**p/2;}
 if(name==='back.out'){const p=t-1;return 1+2.70158*p*p*p+1.70158*p*p;}
 if(name==='elastic.out')return t===0||t===1?t:2**(-10*t)*Math.sin((t-.075)*2*Math.PI/.3)+1;
 return t;
}
export function sampleMotion(keys,clip,time,base){
 if(!keys.length)return {...base};
 if(keys.length===1)return {...keys[0].values};
 const blend=(a,b,t,ease)=>Object.fromEntries(poseFields.map(field=>[field,a[field]+(b[field]-a[field])*motionEase(ease,t)]));
 if(time<=keys[0].time){
  if(!clip.loop)return {...keys[0].values};const last=keys.at(-1),span=clip.duration-last.time+keys[0].time;
  return blend(last.values,keys[0].values,span?(time+clip.duration-last.time)/span:1,keys[0].ease);
 }
 for(let i=1;i<keys.length;i++)if(time<=keys[i].time)return blend(keys[i-1].values,keys[i].values,(time-keys[i-1].time)/(keys[i].time-keys[i-1].time||1),keys[i].ease);
 const last=keys.at(-1);if(!clip.loop)return {...last.values};const first=keys[0],span=clip.duration-last.time+first.time;
 return blend(last.values,first.values,span?(time-last.time)/span:1,first.ease);
}
export function baseMotionPoses(layout){
 const base=(x,y)=>({x:0,y:0,rotate:0,scale:1,scaleX:1,scaleY:1,opacity:1,transformOriginX:x/layout.canvas.width*100,transformOriginY:y/layout.canvas.height*100});
 return {robot:base(220,420),...Object.fromEntries(layout.layersBackToFront.map(layer=>[layer.file.split('/').at(-1).replace('.png',''),base(layer.pivotX,layer.pivotY)]))};
}
export function createMomoPlayer(view,{clips,face,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches}){
 const base=baseMotionPoses(view.layout),parts=Object.keys(base);validateMomoAnimations(clips,parts);
 const tracks=new Map(Object.entries(clips).map(([id,clip])=>[id,new Map(parts.map(part=>[part,clip.keyframes.filter(k=>k.part===part).sort((a,b)=>a.time-b.time)]))]));
 let action='idle',then=null,start=0,elapsed=0,raf=0,visible=false,destroyed=false,pose={...base};
 const transform=p=>`translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg) scale(${p.scaleX}, ${p.scaleY})`;
 function render(time){
  const clip=clips[action];pose=Object.fromEntries(parts.map(part=>[part,reducedMotion?{...base[part]}:sampleMotion(tracks.get(action).get(part),clip,time,base[part])]));
  for(const part of parts){const node=part==='robot'?view.motionRoot:view.nodes.get(part).group,p=pose[part];Object.assign(node.style,{transform:transform(p),transformOrigin:`${p.transformOriginX}% ${p.transformOriginY}%`,opacity:p.opacity});}
  for(const node of view.nodes.values())if(node.follower){const p=pose.head;Object.assign(node.follower.style,{transform:transform(p),transformOrigin:`${p.transformOriginX}% ${p.transformOriginY}%`,opacity:p.opacity});}
  face.render(expressionAt(clip,reducedMotion?clip.duration*.4:time));view.root.dataset.action=action;view.root.dataset.motionTime=String(time);
 }
 function stopFrame(){cancelAnimationFrame(raf);raf=0;}
 function tick(now){
  if(!visible||destroyed||document.hidden)return;
  const clip=clips[action];elapsed=Math.max(0,(now-start)/1000);const time=clip.loop?elapsed%clip.duration:Math.min(elapsed,clip.duration);render(time);
  if(!clip.loop&&elapsed>=clip.duration){const next=then??'idle';then=null;play(next);return;}
  raf=requestAnimationFrame(tick);
 }
 function play(id,{next=null}={}){
  if(!Object.hasOwn(clips,id)||destroyed)return;stopFrame();action=id;then=next;elapsed=0;start=performance.now();render(0);
  if(reducedMotion){const current=action;if(!clips[current].loop)queueMicrotask(()=>{if(!destroyed&&action===current)play(then??'idle');});}
  else if(visible&&!document.hidden)raf=requestAnimationFrame(tick);
 }
 function visibility(){stopFrame();if(visible&&!document.hidden&&!reducedMotion){start=performance.now()-elapsed*1000;raf=requestAnimationFrame(tick);}}
 document.addEventListener('visibilitychange',visibility);
 return {play,get action(){return action;},get poses(){return pose;},get clips(){return Object.keys(clips);},setVisible(value){visible=value;visibility();},destroy(){destroyed=true;stopFrame();document.removeEventListener('visibilitychange',visibility);}};
}
