import {mountLayoutEditor} from '../cat-layout-editor.js?v=momo1';
const character=document.querySelector('.cat-character'),frame=document.querySelector('.cat-frame'),status=document.getElementById('character-status');
const groups=new Map(),images=new Map();
try{
 const response=await fetch('../assets/characters/momo/assembly.json',{cache:'no-cache'});if(!response.ok)throw Error('קובץ ההרכבה לא נטען');const layout=await response.json();
 const loads=[];
 for(const [index,layer]of layout.layersBackToFront.entries()){
  const name=layer.file.split('/').at(-1).replace('.png',''),sprite=layout.sprites.find(s=>s.file===layer.file),[width,height]=sprite.displaySize;
  const group=document.createElement('div');group.className='cat-group cat-layer';group.style.zIndex=layer.zIndex??index;
  const image=new Image();image.className='cat-part';image.dataset.sprite=name;image.alt=layer.label??name;image.draggable=false;
  Object.assign(image.style,{width:width+'px',height:height+'px',left:layer.centerX-width/2+'px',top:layer.centerY-height/2+'px'});
  image.src=new URL('../assets/characters/momo/'+layer.file,import.meta.url).href;loads.push(image.decode());group.append(image);character.append(group);groups.set(name,group);images.set(name,image);
 }
 await Promise.all(loads);
 mountLayoutEditor({layout,character,storageKey:'momoAssemblyPositionsV1',initialPart:'head',exportPath:'momo-assembly.json',partLabels:{},mountBefore:document.getElementById('layout-mount'),startEnabled:true,selectOnClick:true,allowImport:true,
  pause(){for(const animation of character.getAnimations({subtree:true}))animation.cancel();},
  setPivot(name,x,y){const image=images.get(name);groups.get(name).style.transformOrigin=`${x}px ${y}px`;image.style.transformOrigin=`${x-parseFloat(image.style.left)}px ${y-parseFloat(image.style.top)}px`;},
 });
 const zoom=document.getElementById('character-zoom'),preview=document.querySelector('.character-preview');
 function fit(){const r=preview.getBoundingClientRect(),scale=Math.min(1.8,Math.max(.3,Math.min((r.width-35)/440,(r.height-35)/475)));zoom.value=scale;frame.style.transform=`scale(${scale})`;}
 zoom.oninput=()=>frame.style.transform=`scale(${zoom.value})`;document.getElementById('character-fit').onclick=fit;new ResizeObserver(fit).observe(preview);fit();
 character.dataset.ready='true';status.textContent='18 חלקים מוכנים לסידור. הבעות חלופיות נשמרו בנפרד להמשך.';
}catch(error){status.textContent='לא ניתן להציג את מומו: '+error.message;console.error(error);}
