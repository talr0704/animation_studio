/** Each joint is in its parent's local coordinates; anchor is on the sprite. */
export async function createIllustratedProp(mount, definition, { baseUrl = new URL('../assets/world/', import.meta.url) } = {}) {
  const root=document.createElement('div');root.className='illustrated-prop';
  root.style.width=`${definition.width}px`;root.style.height=`${definition.height}px`;
  const nodes=new Map(),animations=[];const loads=[];
  for(const part of definition.parts){
    if(nodes.has(part.id))throw new Error(`Duplicate part: ${part.id}`);
    const joint=document.createElement('div');joint.className='prop-joint';joint.dataset.joint=part.id;
    Object.assign(joint.style,{left:`${part.joint[0]}px`,top:`${part.joint[1]}px`,zIndex:part.layer??0});
    const image=new Image();image.alt='';image.draggable=false;image.className='prop-sprite';
    Object.assign(image.style,{left:`${-part.anchor[0]}px`,top:`${-part.anchor[1]}px`,width:`${part.size[0]}px`,height:`${part.size[1]}px`});
    image.src=new URL(part.image,baseUrl).href;loads.push(image.decode());joint.append(image);nodes.set(part.id,joint);
  }
  for(const part of definition.parts){const parent=part.parent?nodes.get(part.parent):root;if(!parent)throw new Error(`Missing parent: ${part.parent}`);parent.append(nodes.get(part.id));}
  await Promise.all(loads);mount.append(root);
  return {root,nodes,
    sway(){animations.forEach(a=>a.cancel());animations.length=0;for(const part of definition.parts){if(part.id==='pot'||part.id==='frame'||part.id==='shelf'||part.id==='books'||part.id==='vase')continue;const angle=part.id==='stem'?2:4;animations.push(nodes.get(part.id).animate([0,angle,-angle,0].map(a=>({transform:`rotate(${a}deg)`})),{duration:1600,easing:'ease-in-out'}));}},
    destroy(){animations.forEach(a=>a.cancel());root.remove();}
  };
}
