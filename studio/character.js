import {mountMomoAnimation} from './momo-animation.js?v=larger-eyes6';
import {mountLayoutEditor} from '../cat-layout-editor.js?v=momo-animation3';
const character=document.querySelector('.cat-character'),frame=document.querySelector('.cat-frame'),status=document.getElementById('character-status');
const groups=new Map(),images=new Map(),headFollowers=[];let editor,mode='layout';const headParts=new Set(['hat','tie','eye_open_left','eye_open_right','brow_left','brow_right','beak_closed']);
try{
 const response=await fetch(new URL('../assets/characters/momo/assembly.json',import.meta.url),{cache:'no-cache'});if(!response.ok)throw Error('קובץ ההרכבה לא נטען');const layout=await response.json();
 const loads=[];
 for(const [index,layer]of layout.layersBackToFront.entries()){
  const name=layer.file.split('/').at(-1).replace('.png',''),sprite=layout.sprites.find(s=>s.file===layer.file),[width,height]=sprite.displaySize;
  const outer=document.createElement('div');outer.className='cat-group cat-layer';outer.style.zIndex=layer.zIndex??index;const follower=document.createElement('div');follower.className='cat-group';const group=document.createElement('div');group.className='cat-group';if(headParts.has(name))headFollowers.push(follower);group.style.transformOrigin=`${layer.pivotX}px ${layer.pivotY}px`;
  const image=new Image();image.className='cat-part';image.dataset.sprite=name;image.alt=layer.label??name;image.draggable=false;image.style.visibility=layer.visible===false?'hidden':'';
  Object.assign(image.style,{width:width+'px',height:height+'px',left:layer.centerX-width/2+'px',top:layer.centerY-height/2+'px'});
  image.src=new URL('../assets/characters/momo/'+layer.file,import.meta.url).href;loads.push(image.decode());group.append(image);follower.append(group);outer.append(follower);character.append(outer);groups.set(name,group);images.set(name,image);
 }
 await Promise.all(loads);
 const placementEditor=mountLayoutEditor({layout,character,storageKey:'momoAssemblyPositionsV1',draftRevision:JSON.stringify(layout),initialPart:'head',exportPath:'momo-assembly.json',partLabels:{},mountBefore:document.getElementById('layout-mount'),startEnabled:true,selectOnClick:true,allowImport:true,
  pause(){editor?.pause();editor?.reset();for(const animation of character.getAnimations({subtree:true}))animation.cancel();},
  setPivot(name,x,y){const image=images.get(name);groups.get(name).style.transformOrigin=`${x}px ${y}px`;image.style.transformOrigin=`${x-parseFloat(image.style.left)}px ${y-parseFloat(image.style.top)}px`;if(image.parentElement.matches('.momo-eye-counter,.momo-beak-size'))image.parentElement.style.transformOrigin=`${x}px ${y}px`;if(name==='head')for(const follower of headFollowers)follower.style.transformOrigin=`${x}px ${y}px`;editor?.setPivot(name,x,y);},
 });
 editor=await mountMomoAnimation({character,groups,headFollowers,frame,images,isActive:()=>mode==='animation'});
 function setMode(value){editor.pause();editor.reset();mode=value;placementEditor.setEnabled(value==='layout');document.getElementById('momo-layout-panel').hidden=value!=='layout';document.getElementById('momo-animation-panel').hidden=value!=='animation';for(const button of document.querySelectorAll('[data-momo-mode]'))button.setAttribute('aria-pressed',String(button.dataset.momoMode===value));if(value==='animation')editor.seek(0);else editor.resetFace();}
 for(const button of document.querySelectorAll('[data-momo-mode]'))button.onclick=()=>setMode(button.dataset.momoMode);
 setMode(new URLSearchParams(location.search).get('mode')==='animation'?'animation':'layout');
 const zoom=document.getElementById('character-zoom'),preview=document.querySelector('.character-preview');
 function fit(){const r=preview.getBoundingClientRect(),scale=Math.min(1.8,Math.max(.3,Math.min((r.width-60)/500,(r.height-50)/565)));zoom.value=scale;frame.style.transform=`scale(${scale})`;}
 zoom.oninput=()=>frame.style.transform=`scale(${zoom.value})`;document.getElementById('character-fit').onclick=fit;new ResizeObserver(fit).observe(preview);fit();
 character.dataset.ready='true';status.textContent='7 תנועות מוכנות לבדיקה בסטודיו. הן לא מופעלות במשחק עד לאישור.';
}catch(error){status.textContent='לא ניתן להציג את מומו: '+error.message;console.error(error);}
