export const DEFAULT_EXPRESSION={eyes:'open',beak:'closed'};
export function expressionAt(clip,time){
 let pose={...DEFAULT_EXPRESSION};
 for(const key of [...(clip.expressions??[])].sort((a,b)=>a.time-b.time))if(key.time<=time+.000001)pose={eyes:key.eyes,beak:key.beak};
 return pose;
}
export function validateExpressions(clip){
 if(clip.expressions===undefined)return;
 if(!Array.isArray(clip.expressions)||clip.expressions.length>500)throw Error('מסלול הבעות לא תקין');
 let last=-1;
 for(const key of clip.expressions){
  if(!Number.isFinite(key.time)||key.time<0||key.time>clip.duration||key.time<=last||!['open','happy','closed'].includes(key.eyes)||!['closed','smile','open'].includes(key.beak))throw Error('פריים הבעה לא תקין');
  last=key.time;
 }
}
export async function mountMomoExpressions({images,groups}){
 const root=new URL('../assets/characters/momo/parts/',import.meta.url);
 const files=['eye_open_left','eye_open_right','eye_happy_left','eye_happy_right','eye_closed_left','eye_closed_right','beak_closed','beak_smile','beak_open'];
 await Promise.all(files.map(async name=>{const image=new Image();image.src=new URL(name+'.png',root).href;await image.decode();}));
 const tracked=new Map(['eye_open_left','eye_open_right','beak_closed'].map(name=>{
  const image=images.get(name);let counter=null;
  if(name.startsWith('eye_')){counter=document.createElement('span');counter.className='cat-group momo-eye-counter';image.parentElement.append(counter);counter.append(image);}
  return [name,{image,counter}];
 }));
 const browVisibility=new Map(['brow_left','brow_right'].map(name=>[name,images.get(name).style.visibility]));
 function render(pose){
  for(const [name,visibility]of browVisibility)images.get(name).style.visibility=pose.eyes==='open'?visibility:'hidden';
  for(const [name,{image,counter}]of tracked){
   const eye=name.startsWith('eye_'),file=eye?`eye_${pose.eyes}_${name.endsWith('left')?'left':'right'}`:`beak_${pose.beak}`;
   if(counter){
    const scaleY=Number(window.gsap.getProperty(groups.get(name),'scaleY'));
    // Counter only the old blinking squash, around the animated pivot; preserve every authored key.
    counter.style.transformOrigin=groups.get(name).style.transformOrigin;
    counter.style.transform=pose.eyes!=='open'&&Math.abs(scaleY)>.00001?`scaleY(${1/scaleY})`:'none';
   }
   image.style.objectFit=file===name?'fill':'contain';image.style.objectPosition='center';
   const url=new URL(file+'.png',root).href;if(image.src!==url)image.src=url;
   image.dataset.expression=eye?pose.eyes:pose.beak;
  }
 }
 return {render,reset(){render(DEFAULT_EXPRESSION);}};
}
