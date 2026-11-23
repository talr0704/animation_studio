export const BONE_NAMES=['head','torso','shirt','pinafore','left_arm','right_arm','foot_left','foot_right','tail'];
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const identity={x:0,y:0,rotation:0,scaleX:1,scaleY:1};
export function validateFurnitureInteraction(data){
 if(data?.version!==1||data.furniture!=='home.coastal-sofa'||data.id!=='sit'||JSON.stringify(data.canvas)!=='[420,320]'||!Array.isArray(data.approach)||data.approach.length!==2||!data.approach.every(n=>finite(n,-1000,2000))||!Array.isArray(data.foregroundParts)||data.foregroundParts.some(id=>!['frame','back-cushion','seat-cushion'].includes(id)))throw Error('קובץ הפעולה אינו מתאים לספה');
 for(const name of ['enter','hold','exit']){const phase=data.phases?.[name];if(!phase||!finite(phase.duration,.1,20)||typeof phase.loop!=='boolean'||!Array.isArray(phase.keys)||phase.keys.length<2||phase.keys.length>100)throw Error('ציר הזמן אינו תקין');let last=-1;
  for(const key of phase.keys){const p=key.placement;if(!finite(key.time,0,phase.duration)||key.time<=last||!p||!finite(p.x,-1000,2000)||!finite(p.y,-1000,2000)||!finite(p.scale,.05,3)||![-1,1].includes(p.facing)||!key.pose||Object.keys(key.pose).some(name=>!BONE_NAMES.includes(name)))throw Error('פריים אינו תקין');last=key.time;
   for(const pose of Object.values(key.pose))for(const field of ['x','y','rotation','scaleX','scaleY'])if(!finite(pose[field],field.startsWith('scale')?.1:-1000,field.startsWith('scale')?3:1000))throw Error('תנוחת הגוף אינה תקינה');
  }
  if(phase.keys[0].time!==0||phase.keys.at(-1).time!==phase.duration)throw Error('נדרשים פריים התחלה ופריים סיום');
 }
 return data;
}
export function furniturePose(data,name,time){
 const phase=data.phases[name],keys=phase.keys,t=Math.max(0,Math.min(phase.duration,time));let a=keys[0],b=keys.at(-1);
 for(let i=1;i<keys.length;i++)if(t<=keys[i].time){a=keys[i-1];b=keys[i];break;}
 let f=a===b?0:(t-a.time)/(b.time-a.time);f=f*f*(3-2*f);const mix=(x,y)=>x+(y-x)*f;
 const placement=Object.fromEntries(['x','y','scale'].map(k=>[k,mix(a.placement[k],b.placement[k])]));placement.facing=f<.5?a.placement.facing:b.placement.facing;
 const pose={};for(const name of BONE_NAMES){const aa=a.pose[name]??identity,bb=b.pose[name]??identity;pose[name]=Object.fromEntries(Object.keys(identity).map(k=>[k,mix(aa[k],bb[k])]));}
 return {time:t,placement,pose};
}
export function createFurnitureActor(actor,character){
 const groups=new Map([...character.querySelectorAll('.cat-part')].map(img=>[img.dataset.sprite,img.parentElement]));
 const targets=[...new Set([...groups.values(),...character.querySelectorAll('.cat-head-motion')])];
 const original=new Map(targets.map(el=>[el,{transform:el.style.transform,origin:el.style.transformOrigin}]));
 const transform=p=>`translate(${p.x}px,${p.y}px) rotate(${p.rotation}deg) scale(${p.scaleX},${p.scaleY})`;
 function render(frame){const p=frame.placement;actor.style.transform=`translate(${p.x-220*p.scale*p.facing}px,${p.y-440*p.scale}px) scale(${p.scale*p.facing},${p.scale})`;
  for(const name of BONE_NAMES){const el=groups.get(name);if(el)el.style.transform=transform(frame.pose[name]??identity);}
  const head=frame.pose.head??identity,origin='230.2px 295.4px';groups.get('head').style.transformOrigin=origin;
  for(const [name,el]of groups)if(name!=='head'&&/^(ear_|eye_|mouth_|whiskers_|nose$|flower$)/.test(name)){const motion=el.closest('.cat-head-motion');motion.style.transformOrigin=origin;motion.style.transform=transform(head);}
 }
 return {render,reset(){for(const [el,old]of original){el.style.transform=old.transform;el.style.transformOrigin=old.origin;}actor.style.transform='';}};
}
export function mountFurnitureForeground(scene,rig,data){
 scene.querySelectorAll('.interaction-foreground').forEach(el=>el.remove());
 for(const id of data.foregroundParts){const part=rig.parts.find(p=>p.id===id);if(!part)continue;const img=new Image();img.className='interaction-foreground';img.src=new URL('../'+part.image,import.meta.url).href;img.alt='';Object.assign(img.style,{position:'absolute',left:(part.position[0]-part.anchor[0]*part.scale)+'px',top:(part.position[1]-part.anchor[1]*part.scale)+'px',width:part.sourceSize[0]*part.scale+'px',height:part.sourceSize[1]*part.scale+'px',zIndex:'30',pointerEvents:'none'});scene.append(img);}
 // The lower frame contains the existing front legs/arm edges, reused without changing artwork.
 const frame=rig.parts.find(p=>p.id==='frame');if(frame){const img=new Image();img.className='interaction-foreground';img.src=new URL('../'+frame.image,import.meta.url).href;img.alt='';Object.assign(img.style,{position:'absolute',left:frame.position[0]+'px',top:frame.position[1]+'px',width:frame.sourceSize[0]*frame.scale+'px',height:frame.sourceSize[1]*frame.scale+'px',clipPath:'inset(63% 0 0 0)',zIndex:'31',pointerEvents:'none'});scene.append(img);}
 return ()=>scene.querySelectorAll('.interaction-foreground').forEach(el=>el.remove());
}
