import { mountProp } from './shared/prop-rig.js?v=sofa2';
import { validateFurnitureInteraction } from './shared/furniture-interaction.js?v=2';
const ROOT='assets/scenes/home/furniture/coastal/';
const references={sofa:{label:'ספה',folder:'sofa',x:-130,y:43.33,scale:1/.6},cabinet:{label:'ארונית',folder:'cabinet',x:240,y:70,scale:1.1},lamp:{label:'מנורה',folder:'lamp',x:290,y:85,scale:1.1},window:{label:'חלון',folder:'window',x:-150,y:-30,scale:.8}};
const STORAGE='popa.character.reference.v1';
export async function mountCharacterReferences({character,editor}){
 const panel=document.querySelector('.animation-editor'),body=panel.querySelector('.animation-editor__body');
 const controls=document.createElement('details');controls.className='character-references';controls.dir='rtl';controls.innerHTML=`<summary>רהיט לדוגמה — להתאמת תנועת פופה</summary><label>דוגמה בתצוגה<select id="cr-reference"><option value="">ללא רהיט</option>${Object.entries(references).map(([id,p])=>`<option value="${id}">${p.label}</option>`).join('')}</select></label><div class="cr-fields">${[['x','מיקום X'],['y','מיקום Y'],['scale','גודל הדוגמה']].map(([id,label])=>`<label>${label}<input id="cr-${id}" type="number" step="${id==='scale'?'.05':'1'}"></label>`).join('')}</div><label><input id="cr-drag" type="checkbox"> גרירת הרהיט לדוגמה</label><div class="cr-buttons"><button id="cr-sit">הוספת אנימציות ישיבה לפופה</button><button id="cr-old" hidden>ייבוא העבודה מהמסך הקודם</button><a href="studio.html?category=furniture">עריכת תנועה של הרהיטים עצמם</a></div><p id="cr-status" role="status">הרהיט הוא דוגמה בלבד. ציר הזמן שלמטה עורך את פופה.</p>`;
 panel.insertBefore(controls,body);const $=id=>controls.querySelector('#cr-'+id);
 const holder=document.createElement('div');holder.className='character-reference-rig';character.parentElement.insertBefore(holder,character);character.style.zIndex='1';
 let settings={id:'',poses:{}},view=null,revision=0,drag=null;
 try{const saved=JSON.parse(localStorage.getItem(STORAGE));if(saved&&typeof saved==='object')settings={id:Object.hasOwn(references,saved.id)?saved.id:'',poses:saved.poses??{}};}catch{}
 function current(){const defaults=references[settings.id];if(!defaults)return null;const saved=settings.poses[settings.id];return saved&&['x','y','scale'].every(k=>Number.isFinite(saved[k]))&&saved.scale>.05&&saved.scale<5?saved:{x:defaults.x,y:defaults.y,scale:defaults.scale};}
 function save(){try{localStorage.setItem(STORAGE,JSON.stringify(settings));}catch{}}
 function position(){const p=current();holder.hidden=!p;document.body.classList.toggle('character-reference-active',!!p);for(const id of ['x','y','scale','drag'])$(id).disabled=!p;if(!p)return;Object.assign(holder.style,{left:p.x+'px',top:p.y+'px',transform:`scale(${p.scale})`});for(const id of ['x','y','scale'])$(id).value=Math.round(p[id]*100)/100;holder.classList.toggle('reference-draggable',$('drag').checked);}
 async function show(id){const token=++revision;settings.id=id;$('reference').value=id;position();save();if(!id){holder.replaceChildren();return;}try{const response=await fetch(ROOT+references[id].folder+'/assembly.json?v=2');if(!response.ok)throw Error('לא נטענה הדוגמה');const rig=await response.json();if(token!==revision)return;Object.assign(holder.style,{width:rig.canvas[0]+'px',height:rig.canvas[1]+'px'});view=mountProp(holder,rig);await view.ready;}catch(error){$('status').textContent=error.message;}}
 $('reference').onchange=()=>show($('reference').value);
 for(const id of ['x','y','scale'])$(id).onchange=()=>{const n=Number($(id).value);if(!current()||!Number.isFinite(n)||(id==='scale'&&(n<.05||n>4))||Math.abs(n)>2000){position();return;}settings.poses[settings.id]={...current(),[id]:n};position();save();};
 $('drag').onchange=position;
 holder.addEventListener('pointerdown',event=>{if(!$('drag').checked||event.button!==0)return;editor.pause();event.preventDefault();event.stopPropagation();const rect=character.parentElement.getBoundingClientRect();drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,scale:rect.width/440,pose:{...current()}};holder.setPointerCapture(event.pointerId);});
 holder.addEventListener('pointermove',event=>{if(!drag||drag.pointer!==event.pointerId)return;settings.poses[settings.id]={...drag.pose,x:drag.pose.x+(event.clientX-drag.x)/drag.scale,y:drag.pose.y+(event.clientY-drag.y)/drag.scale};position();});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])holder.addEventListener(name,()=>{if(drag){drag=null;save();}});
 async function addSitting(legacy=false){try{
  const raw=legacy?JSON.parse(localStorage.getItem('popa.furniture.sofa.sit.v1')):await(await fetch(ROOT+'sofa/interactions/sit.json?v=2')).json();const data=validateFurnitureInteraction(raw),anchor=data.phases.hold.keys[0].placement;
  for(const [phase,label]of [['enter','התיישבות'],['hold','ישיבה'],['exit','קימה']]){
   const clip=data.phases[phase],keyframes=[];
   for(const [index,key]of clip.keys.entries()){
    const relativeScale=key.placement.scale/anchor.scale;
    keyframes.push({id:`sit-${phase}-root-${index}`,time:key.time,part:'robot',ease:'sine.inOut',values:{...editor.baseValues('robot'),x:(key.placement.x-anchor.x)/anchor.scale,y:(key.placement.y-anchor.y)/anchor.scale+20*(1-relativeScale),scale:1,scaleX:relativeScale*key.placement.facing,scaleY:relativeScale}});
    for(const part of ['head','torso','shirt','pinafore','left_arm','right_arm','foot_left','foot_right','tail']){const pose=key.pose[part]??{x:0,y:0,rotation:0,scaleX:1,scaleY:1};keyframes.push({id:`sit-${phase}-${part}-${index}`,time:key.time,part,ease:'sine.inOut',values:{...editor.baseValues(part),x:pose.x,y:pose.y,rotate:pose.rotation,scaleX:pose.scaleX,scaleY:pose.scaleY}});}
   }
   const id=legacy?'legacy-sit-'+phase:'sit-'+phase;editor.addAnimation(id,{name:legacy?label+' (מהטיוטה הקודמת)':label,duration:clip.duration,loop:clip.loop,keyframes},{select:phase==='hold',overwrite:false});
  }
  if(!settings.poses.sofa||legacy)settings.poses.sofa={x:220-anchor.x/anchor.scale,y:440-anchor.y/anchor.scale,scale:1/anchor.scale};await show('sofa');controls.open=false;$('status').textContent='התיישבות, ישיבה וקימה נוספו לרשימת האנימציות של פופה. ערכי אותן בציר הזמן הרגיל.';
 }catch(error){$('status').textContent='לא נטען: '+error.message;}}
 $('sit').onclick=()=>addSitting(false);try{$('old').hidden=!localStorage.getItem('popa.furniture.sofa.sit.v1');}catch{}$('old').onclick=()=>addSitting(true);
 const query=new URLSearchParams(location.search);if(query.get('reference')&&references[query.get('reference')]){settings.id=query.get('reference');controls.open=true;}
 await show(settings.id);if(query.get('motion')==='sit')await addSitting(false);
}
