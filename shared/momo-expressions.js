export const BEAK_SCALES={closed:1,smile:1.08,open:1.16};
export const EYE_SCALES={open:1.35,happy:1.30,closed:1.30};
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
export async function mountMomoExpressions({images,groups,getScaleY=name=>Number(window.gsap.getProperty(groups.get(name),'scaleY'))}){
 const root=new URL('../assets/characters/momo/parts/',import.meta.url);
 const files=['eye_open_left','eye_open_right','eye_happy_left','eye_happy_right','brow_left','brow_right','beak_closed','beak_smile','beak_open'];
 await Promise.all(files.map(async name=>{const image=new Image();image.src=new URL(name+'.png',root).href;await image.decode();}));
 const tracked=new Map(['eye_open_left','eye_open_right','beak_closed'].map(name=>{
  const image=images.get(name),counter=document.createElement('span');
  Object.assign(counter.style,{position:'absolute',inset:'0',pointerEvents:'none'});
  counter.className='cat-group '+(name.startsWith('eye_')?'momo-eye-counter':'momo-beak-size');image.parentElement.append(counter);counter.append(image);
  return [name,{image,counter}];
 }));
 const browVisibility=new Map(['brow_left','brow_right'].map(name=>[name,images.get(name).style.visibility]));
 function render(pose){
  for(const [name,visibility]of browVisibility)images.get(name).style.visibility=pose.eyes==='open'?visibility:'hidden';
  for(const [name,{image,counter}]of tracked){
   const eye=name.startsWith('eye_'),side=name.endsWith('left')?'left':'right',file=eye?(pose.eyes==='closed'?`brow_${side}`:`eye_${pose.eyes}_${side}`):`beak_${pose.beak}`;
   if(eye){
    const scaleY=getScaleY(name);
    // Counter only the old blinking squash, around the animated pivot; preserve every authored key.
    counter.style.transformOrigin=groups.get(name).style.transformOrigin;
    counter.style.transform=pose.eyes!=='open'&&Math.abs(scaleY)>.00001?`scaleY(${1/scaleY})`:'none';
   }
   else{
    const scale=BEAK_SCALES[pose.beak];
    counter.style.transformOrigin=scale===1?groups.get(name).style.transformOrigin:`${parseFloat(image.style.left)+parseFloat(image.style.width)/2}px ${parseFloat(image.style.top)+parseFloat(image.style.height)/2}px`;
    counter.style.transform=scale===1?'none':`scale(${scale})`;
   }
   image.style.scale=eye&&pose.eyes==='closed'?`${EYE_SCALES.closed} ${-EYE_SCALES.closed}`:eye?String(EYE_SCALES[pose.eyes]):'none';
   image.style.objectFit=file===name?'fill':'contain';image.style.objectPosition='center';
   const url=new URL(file+'.png',root).href;if(image.src!==url)image.src=url;
   image.dataset.expression=eye?pose.eyes:pose.beak;
  }
 }
 return {render,reset(){render(DEFAULT_EXPRESSION);}};
}
