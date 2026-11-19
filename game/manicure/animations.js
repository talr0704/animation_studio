import {url,COLORS} from './assets.js';
export class BottleRack{
 constructor(mount,assets,onPick){this.assets=assets;this.nodes=new Map();this.selected=null;this.revision=0;
  for(const color of COLORS){const def=assets.bottles.find(b=>b.color===color),button=document.createElement('button');button.className='polish-bottle';button.dataset.color=color;button.setAttribute('aria-label',`לק ${({pink:'ורוד',lavender:'לבנדר',mint:'מנטה',peach:'אפרסק',yellow:'צהוב',topcoat:'שקוף'})[color]}`);button.setAttribute('aria-pressed','false');
   const unit=document.createElement('div');unit.className='bottle-unit';const parts={};
   for(const [part,z]of [['bottle-back',1],['brush',2],['bottle-front',3]]){const image=new Image();image.src=url(`props/nail-polish/colors/${color}/${part}.png`);image.alt='';image.className='bottle-'+part;const position=part==='brush'?def.brush_closed_position:def.bottle_position;Object.assign(image.style,{position:'absolute',left:position[0]+'px',top:position[1]+'px',width:assets.images[`props/nail-polish/colors/${color}/${part}.png`].width+'px',zIndex:z});unit.append(image);parts[part]=image;}
   button.append(unit);button.onclick=()=>onPick(color);mount.append(button);this.nodes.set(color,{button,unit,parts,def});
  }
 }
 async activate(color,cursor){const rev=++this.revision,previous=this.selected;if(previous===color)return;
  if(previous)await this.close(previous,cursor);if(rev!==this.revision)return;this.selected=color;if(!color)return;
  const node=this.nodes.get(color);node.button.setAttribute('aria-pressed','true');const brush=node.parts.brush;brush.style.opacity='1';
  await brush.animate([{transform:'translateY(0)'},{transform:`translateY(${-node.def.lift_pixels}px)`}],{duration:250,easing:'ease-out',fill:'forwards'}).finished.catch(()=>{});
  if(rev!==this.revision)return;brush.style.transform=`translateY(${-node.def.lift_pixels}px)`;brush.getAnimations().forEach(a=>a.cancel());brush.style.opacity='0';
 }
 async close(color,cursor){const node=this.nodes.get(color);node.button.setAttribute('aria-pressed','false');const brush=node.parts.brush;brush.getAnimations().forEach(a=>a.cancel());brush.style.transform=`translateY(${-node.def.lift_pixels}px)`;
  if(cursor){const target=brush.getBoundingClientRect(),flight=new Image();flight.src=brush.src;flight.className='brush-flight';Object.assign(flight.style,{position:'fixed',pointerEvents:'none',zIndex:120,left:(cursor.x-35)+'px',top:(cursor.y-205*70/114)+'px',width:'70px'});document.body.append(flight);await flight.animate([{left:flight.style.left,top:flight.style.top,width:'70px'},{left:target.x+'px',top:target.y+'px',width:target.width+'px'}],{duration:220,easing:'ease-in-out',fill:'forwards'}).finished.catch(()=>{});flight.remove();}
  brush.style.opacity='1';await brush.animate([{transform:brush.style.transform},{transform:'translateY(0)'}],{duration:270,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});brush.style.transform='translateY(0)';brush.getAnimations().forEach(a=>a.cancel());
 }
}
export function effect(path,x,y){const image=new Image();image.src=url(path);image.className='care-effect';Object.assign(image.style,{position:'fixed',left:(x-30)+'px',top:(y-30)+'px',width:'60px',height:'60px',pointerEvents:'none',zIndex:90});document.body.append(image);image.animate([{opacity:1,transform:'translateY(0) scale(.8)'},{opacity:0,transform:'translateY(-28px) scale(1.2)'}],{duration:650}).finished.catch(()=>{}).finally(()=>image.remove());}
export function mountSoap(mount){const rig=document.createElement('div');rig.className='soap-unit';let pump;
 for(const [name,position,width,z]of [['soap-pump',[32,-21],68,1],['soap-bottle',[0,25],110,2],['soap-collar',[28,13],58,3]]){const img=new Image();img.src=url('props/soap/images/'+name+'.png');img.alt='';Object.assign(img.style,{position:'absolute',left:position[0]+'px',top:position[1]+'px',width:width+'px',zIndex:z});rig.append(img);if(name==='soap-pump')pump=img;}mount.append(rig);
 return ()=>{pump.getAnimations().forEach(a=>a.cancel());pump.animate([{transform:'translateY(0)'},{transform:'translateY(7px)'},{transform:'translateY(0)'}],{duration:340});const r=pump.getBoundingClientRect();effect('props/care/images/water-drops.png',r.right,r.top+r.height*.3);};
}
export async function dryAnimation(container,pawCanvas,layout,onProgress){
 onProgress(0);container.hidden=false;const image=container.querySelector('canvas'),context=image.getContext('2d');context.clearRect(0,0,image.width,image.height);context.drawImage(pawCanvas,0,0,image.width,image.height);const paw=container.querySelector('.dryer-paw');
 const movement=paw.animate([{transform:'translateY(90px)'},{transform:'translateY(0)'}],{duration:350,easing:'ease-out',fill:'forwards'});await movement.finished.catch(()=>{});paw.style.transform='translateY(0)';movement.cancel();container.classList.add('lit');
 await new Promise(resolve=>{const start=performance.now();function tick(now){const p=Math.min(1,(now-start)/1800);onProgress(p);if(p<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
 container.classList.remove('lit');await paw.animate([{transform:'translateY(0)'},{transform:'translateY(90px)'}],{duration:300,fill:'forwards'}).finished.catch(()=>{});paw.getAnimations().forEach(a=>a.cancel());container.hidden=true;
}
