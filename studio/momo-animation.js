import {expressionAt,validateExpressions,mountMomoExpressions,DEFAULT_EXPRESSION} from '../shared/momo-expressions.js?v=larger-eyes2';
import {mountCatEditor} from '../cat-editor.js?v=momo-expressions2';
export {validateMomoAnimations} from '../shared/momo-motion.js';
import {validateMomoAnimations} from '../shared/momo-motion.js';
const translations={x:'מיקום X',y:'מיקום Y',rotate:'סיבוב',scale:'גודל',scaleX:'רוחב',scaleY:'גובה',opacity:'שקיפות',transformOriginX:'ציר X (%)',transformOriginY:'ציר Y (%)','Animation':'אנימציה','Timeline':'ציר זמן','Part':'חלק','Selected part':'החלק הנבחר','Transform':'מיקום ותנועה','Keyframes':'פריימים','Preview':'תצוגה','Import / Export':'שמירה וייצוא','New Animation':'תנועה חדשה','Rename Animation':'שינוי שם','Delete Animation':'מחיקת תנועה','Duplicate Animation':'שכפול תנועה','Duration':'משך בשניות','Zoom':'קירוב','Tracks':'מסלולים','Show all tracks':'כל החלקים','Show selected part only':'רק החלק הנבחר','Hide empty tracks':'הסתרת מסלולים ריקים','Snap':'הצמדה לזמן','Off':'ללא','Loop':'לולאה','Play':'ניגון','Pause':'השהיה','Stop':'עצירה','Fit animation':'התאמת ציר הזמן','Zoom in':'קירוב','Zoom out':'הרחקה','Ease':'אופי המעבר','Add Keyframe':'הוספת פריים','Update Keyframe':'עדכון הפריים','Delete Keyframe':'מחיקת הפריים','Copy Keyframe':'העתקת פריים','Paste Keyframe':'הדבקת פריים','Record Mode':'שמירת פריימים אוטומטית','Onion Skin':'הצגת פריים קודם','Reset Current Part to Base Pose':'איפוס החלק','Reset Entire Frame to Base Pose':'איפוס התנוחה','Clear Current Animation':'מחיקת פריימי התנועה','Copy Animation JSON':'העתקת קובץ האנימציות','Copy GSAP Code':'העתקת קוד','Download Animation JSON':'הורדת טיוטת האנימציות','Import Animation JSON':'טעינת אנימציות מהטקסט','Clear Saved Animation Data':'איפוס הטיוטה השמורה','Hide':'הצגה / הסתרה','RECORDING':'שמירה אוטומטית'};
export async function mountMomoAnimation({character,groups,headFollowers,frame,images,isActive}){
 const response=await fetch(new URL('../assets/characters/momo/animations/studio-drafts.json',import.meta.url),{cache:'no-cache'});if(!response.ok)throw Error('לא ניתן לטעון את תנועות מומו');
 const clips=await response.json(),parts=[...groups.keys(),'robot'];validateMomoAnimations(clips,parts);
 const face=await mountMomoExpressions({images,groups});
 const eyeInput=document.getElementById('momo-eyes'),beakInput=document.getElementById('momo-beak'),markers=document.getElementById('momo-face-keys');
 function updateExpressionPreview({animation,time}){
  const pose=isActive()?expressionAt(animation,time):DEFAULT_EXPRESSION;face.render(pose);eyeInput.value=pose.eyes;beakInput.value=pose.beak;
  document.getElementById('momo-face-delete').disabled=!(animation.expressions??[]).some(k=>Math.abs(k.time-time)<.001);
  const signature=JSON.stringify(animation.expressions??[]);if(markers.dataset.signature!==signature){markers.dataset.signature=signature;markers.replaceChildren();for(const key of animation.expressions??[]){const button=document.createElement('button');button.type='button';button.textContent=key.time.toFixed(2)+' · '+({open:'פתוחות',happy:'שמחות',closed:'עצומות'})[key.eyes];button.onclick=()=>editor.seek(key.time);markers.append(button);}}
 }
 const labels={robot:'מומו כולו'};for(const [name,group]of groups)labels[name]=group.querySelector('img').alt;
 character.style.transformOrigin='220px 420px';
 const editor=mountCatEditor({character,groups,headFollowers,stop(){},storageKey:'momoAnimationEditorDataV1',draftRevision:JSON.stringify(clips),onPreview:updateExpressionPreview,defaultAnimations:clips,editorMount:document.getElementById('momo-animation-panel'),editorTitle:'אנימציות מומו — טיוטות',downloadFilename:'momo-animation-drafts.json',panelWidthKey:'momoAnimationEditorWidth',partLabels:labels,validateAnimationData:data=>validateMomoAnimations(data,parts),isActive,cyclePartsOnTab:false,recordByDefault:true,initialTrackFilter:'selected',rescaleDuration:true,valueBounds:{x:[-2000,2000],y:[-2000,2000],rotate:[-720,720],scale:[0,3],scaleX:[0,3],scaleY:[0,3],opacity:[0,1],transformOriginX:[-300,300],transformOriginY:[-300,300]}});
 editor.resetFace=()=>face.reset();
 eyeInput.onchange=beakInput.onchange=()=>{editor.pause();face.render({eyes:eyeInput.value,beak:beakInput.value});};
 document.getElementById('momo-face-save').onclick=()=>{
  const time=Number(editor.currentTime.toFixed(3)),pose={time,eyes:eyeInput.value,beak:beakInput.value};
  editor.updateCurrentAnimation(clip=>{clip.expressions=(clip.expressions??[]).filter(k=>Math.abs(k.time-time)>=.001);clip.expressions.push(pose);clip.expressions.sort((a,b)=>a.time-b.time);});
 };
 document.getElementById('momo-face-delete').onclick=()=>editor.updateCurrentAnimation(clip=>{clip.expressions=(clip.expressions??[]).filter(k=>Math.abs(k.time-editor.currentTime)>=.001);});
 const panel=document.querySelector('#momo-animation-panel .animation-editor'),dictionary={...translations,...labels};
 function translate(){
  const walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){const key=node.data.trim();if(dictionary[key])node.data=node.data.replace(key,dictionary[key]);}
  const timeInput=document.getElementById('momo-time');if(document.activeElement!==timeInput)timeInput.value=Number(editor.currentTime.toFixed(3));timeInput.max=editor.duration;
  const input=panel.querySelector('[data-editor="importText"]');if(input)input.placeholder='הדביקי כאן קובץ אנימציות של מומו';
 }
 document.getElementById('momo-time').onchange=event=>editor.seek(Number(event.target.value));document.getElementById('momo-add-pose').onclick=()=>editor.recordPose(editor.selectedPart);
 const observer=new MutationObserver(translate);observer.observe(panel,{childList:true,subtree:true});translate();
 let drag;
 frame.addEventListener('pointerdown',event=>{
  if(!isActive()||event.button!==0)return;
  const image=event.target.closest('.cat-part');if(!image)return;
  event.preventDefault();const part=editor.selectedPart==='robot'?'robot':image.dataset.sprite;
  editor.selectPart(part);const value=editor.getPose(part);drag={pointer:event.pointerId,part,x:event.clientX,y:event.clientY,value,moved:false,scale:frame.getBoundingClientRect().width/440};frame.setPointerCapture(event.pointerId);
 });
 frame.addEventListener('pointermove',event=>{if(!drag||drag.pointer!==event.pointerId)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<1&&!drag.moved)return;drag.moved=true;editor.setPose(drag.part,{x:drag.value.x+(event.clientX-drag.x)/drag.scale,y:drag.value.y+(event.clientY-drag.y)/drag.scale});});
 frame.addEventListener('pointerup',event=>{if(!drag||drag.pointer!==event.pointerId)return;if(drag.moved)editor.recordPose(drag.part);drag=null;if(frame.hasPointerCapture(event.pointerId))frame.releasePointerCapture(event.pointerId);});
 frame.addEventListener('pointercancel',()=>{if(drag){editor.setPose(drag.part,drag.value);drag=null;}});
 return editor;
}
