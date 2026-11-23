import { setOutfitBody } from '../shared/outfit-body.js';
// Fitted clothes use the same design canvas, artwork offsets and attachment transforms as the studio.
export async function createWardrobe(popa) {
  const response=await fetch(new URL('../assets/characters/popa/outfits/catalog.json?v=cloud-fit-6',import.meta.url));
  if(!response.ok)throw Error('Cannot load wardrobe catalogue');
  const catalog=await response.json(),looks=new Map();
  for(const look of catalog.looks.filter(l=>l.placements)){
    const response=await fetch(new URL('../'+look.placements,import.meta.url));if(!response.ok)throw Error('Cannot load fitted outfit');
    const data=await response.json(),fit=data.looks?.find(l=>l.id===look.id);
    if(data.version!==1||data.character!=='popa'||JSON.stringify(data.canvas)!=='[440,475]'||!fit||fit.parts.length!==look.parts.length)throw Error('Invalid fitted outfit');
    const ids=new Set();
    for(const p of fit.parts){const original=look.parts.find(item=>item.id===p.id);
      if(!original||ids.has(p.id)||p.asset!==original.asset||!['body','head','left_arm','right_arm','foot_left','foot_right'].includes(p.attachment)||['x','y','width','height','rotation','layer'].some(key=>!Number.isFinite(p[key]))||p.width<=0||p.height<=0)throw Error('Invalid outfit part');ids.add(p.id);
    }
    looks.set(look.id,{look,fit});
  }
  const character=popa.element,baseGroups=new Map([...character.querySelectorAll('.cat-part')].map(image=>[image.dataset.sprite,image.parentElement]));
  const originals=new Map([...baseGroups.values()].map(group=>{const outer=group.closest('.cat-layer');return [outer,outer.style.zIndex];}));
  const baseVisibility=new Map(['shirt','pinafore','flower'].map(id=>[id,baseGroups.get(id).style.visibility]));
  let mounted=[],raf=0,request=0,selected='default';
  function clear(){setOutfitBody(character,false);cancelAnimationFrame(raf);mounted.forEach(part=>part.outer.remove());mounted=[];for(const [outer,z]of originals)outer.style.zIndex=z;for(const [id,visibility]of baseVisibility)baseGroups.get(id).style.visibility=visibility;popa.root.style.overflow='';}
  function follow(){
    const body=getComputedStyle(baseGroups.get('head').closest('.cat-body-motion')),head=getComputedStyle(baseGroups.get('flower').closest('.cat-head-motion'));
    for(const part of mounted){const attachment=part.data.attachment;
      for(const [node,source]of [[part.body,attachment.startsWith('foot_')?null:body],[part.head,attachment==='head'?head:null],[part.limb,['left_arm','right_arm','foot_left','foot_right'].includes(attachment)?getComputedStyle(baseGroups.get(attachment)):null]]){
        node.style.transform=source?.transform??'none';if(source)node.style.transformOrigin=source.transformOrigin;
      }
    }
    raf=requestAnimationFrame(follow);
  }
  async function wear(id){
    const token=++request;
    if(id==='default'){clear();selected=id;character.dataset.outfit=id;return;}
    const item=looks.get(id);if(!item)throw Error('Unknown fitted outfit');
    const prepared=await Promise.all(item.fit.parts.filter(p=>p.visible).map(async p=>{
      const original=item.look.parts.find(part=>part.id===p.id),image=new Image();image.src=new URL('../'+original.asset+'?artwork=5',import.meta.url).href;image.alt='';image.draggable=false;image.dataset.wornPart=p.id;image.className='worn-clothing';
      await image.decode();const [nw,nh]=original.naturalSize,[aw,ah]=original.artworkSize??original.naturalSize,[dx,dy]=original.artworkOffset??[0,0],sx=p.width/nw,sy=p.height/nh;
      Object.assign(image.style,{position:'absolute',maxWidth:'none',objectFit:'fill',left:`${p.x-p.width/2+dx*sx}px`,top:`${p.y-p.height/2+dy*sy}px`,width:`${aw*sx}px`,height:`${ah*sy}px`,transformOrigin:`${(nw/2-dx)*sx}px ${(nh/2-dy)*sy}px`,transform:`rotate(${p.rotation}deg)`});
      const outer=document.createElement('div');outer.className='cat-group worn-layer';outer.style.zIndex=String(Math.round(p.layer*1000));const body=document.createElement('div'),head=document.createElement('div'),limb=document.createElement('div');for(const node of [body,head,limb])node.className='cat-group';limb.append(image);head.append(limb);body.append(head);outer.append(body);
      return {outer,body,head,limb,data:p};
    }));
    if(token!==request)return;
    clear();for(const [outer,z]of originals)outer.style.zIndex=String(Number(z)*1000);
    for(const id of new Set([...(item.fit.hiddenBase??[]),'flower']))if(baseVisibility.has(id))baseGroups.get(id).style.visibility='hidden';
    setOutfitBody(character,true);mounted=prepared;for(const part of mounted)character.append(part.outer);popa.root.style.overflow='visible';selected=id;character.dataset.outfit=id;follow();
  }
  return {wear,get selected(){return selected;},destroy(){request++;clear();},looks:[...looks.keys()]};
}
