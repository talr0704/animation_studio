import {savePropAppearance,loadPropAppearance,clearPropAppearance} from '../shared/prop-appearance.js?v=1';
import {validateProp,validateClip,poseAt,mountProp} from '../shared/prop-rig.js?v=door-sprites4';
const $=id=>document.getElementById(id),copy=value=>JSON.parse(JSON.stringify(value));
let catalog,entry,rig,clip,published,view,selected,time=0,zoom=2,playing=false,last=0,history=[],drag=null,renderRevision=0,viewCenter=[65,105];
const status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
const rootUrl=path=>new URL('../'+path,import.meta.url).href;
const key=()=>`popaPropDraftV1:${entry.id}`;
function validatePair(r,c){validateProp(r);if(r.id!==entry.id)throw Error('הקובץ שייך לאביזר אחר');validateClip(c,r);for(const p of r.parts)if([p.image,...Object.values(p.images??{})].some(image=>!entry.images.includes(image)))throw Error('האיור אינו חלק מהאביזר שבקטלוג');}
function remember(){history.push(JSON.stringify({rig,clip}));if(history.length>60)history.shift();}
function save(){try{localStorage.setItem(key(),JSON.stringify({rig,clip}));$('draft-status').textContent='הטיוטה נשמרה בדפדפן. המשחק המפורסם לא השתנה.';}catch{$('draft-status').textContent='השמירה בדפדפן לא זמינה. הורידי את הקבצים כדי לשמור.';}}
const appearanceMode=()=>$('edit-mode').value==='appearance';
const activeClip=()=>appearanceMode()?null:clip;
function current(){return rig.parts.find(p=>p.id===selected);}
function stop(){playing=false;$('play').textContent='▶ ניגון';}
function fit(){if(!rig||!view)return;const rect=$('viewport').getBoundingClientRect(),board=$('board').getBoundingClientRect();const boxes=[...view.nodes.values()].map(n=>n.img.getBoundingClientRect());const minX=Math.min(...boxes.map(b=>(b.left-board.left)/zoom)),minY=Math.min(...boxes.map(b=>(b.top-board.top)/zoom)),maxX=Math.max(...boxes.map(b=>(b.right-board.left)/zoom)),maxY=Math.max(...boxes.map(b=>(b.bottom-board.top)/zoom));viewCenter=[(minX+maxX)/2,(minY+maxY)/2];zoom=Math.min(4,Math.max(.5,Math.min((rect.width-50)/Math.max(1,maxX-minX),(rect.height-90)/Math.max(1,maxY-minY))));$('zoom').value=zoom;layout();frame();}
function layout(){if(!rig)return;Object.assign($('board').style,{width:rig.canvas[0]+'px',height:rig.canvas[1]+'px',transformOrigin:'0 0',transform:`translate(${-viewCenter[0]*zoom}px,${-viewCenter[1]*zoom}px) scale(${zoom})`});}
function fields(){
 const p=current();if(!p)return;
 for(const [name,value]of Object.entries({'base-x':p.position[0],'base-y':p.position[1],'anchor-x':p.anchor[0],'anchor-y':p.anchor[1],'part-scale':p.scale,'part-scale-y':p.scaleY??p.scale,'base-rotation':p.rotation,layer:p.layer}))$(name).value=Number(value.toFixed(4));
 $('parent').replaceChildren();const option=new Option('ללא הורה','');$('parent').append(option);for(const part of rig.parts)if(part.id!==p.id)$('parent').append(new Option(part.label??part.id,part.id));$('parent').value=p.parent??'';
 $('image-frame-field').hidden=appearanceMode()||!p.images;$('image-frame').replaceChildren(...Object.keys(p.images??{}).map(id=>new Option(({closed:'סגורה','half-open':'חצי פתוחה',open:'פתוחה'})[id]??id,id)));
 $('part').value=selected;$('duration').value=clip.duration;$('easing').value=clip.easing??'linear';$('scrub').max=clip.duration;$('time').max=clip.duration;
 $('canvas-hint').textContent=appearanceMode()?'מראה קבוע: גררי חלק לסידורו במשחק. אין שינוי בפריימים.':$('pivot-mode').checked?'גרירה מזיזה את הציר לכל האנימציה, בלי להזיז את האיור.':'בחרי זמן וגררי חלק. התנועה נשמרת אוטומטית כפריים.';
}
function tracks(){
 $('tracks').replaceChildren();
 for(const part of rig.parts){const row=document.createElement('div');row.className='track'+(part.id===selected?' selected':'');const name=document.createElement('span');name.className='track-name';name.textContent=part.label??part.id;const line=document.createElement('div');line.className='track-line';
 for(const k of clip.tracks.find(t=>t.part===part.id)?.keys??[]){const button=document.createElement('button');button.className='key';button.style.left=k.time/clip.duration*100+'%';button.title=`${part.label??part.id} · ${k.time.toFixed(3)}s`;button.setAttribute('aria-label',button.title);button.onclick=()=>{stop();selected=part.id;time=k.time;fields();tracks();frame();};line.append(button);}
 row.append(name,line);$('tracks').append(row);}
}
function frame(){
 if(!view)return;view.render(activeClip(),appearanceMode()?0:time);$('time').value=Number(time.toFixed(3));$('scrub').value=time;
 const pose=poseAt(activeClip(),selected,time),p=current();if(p.images)$('image-frame').value=pose.imageFrame??Object.keys(p.images)[0];$('position-x').value=Number((p.position[0]+pose.x).toFixed(3));$('position-y').value=Number((p.position[1]+pose.y).toFixed(3));$('rotation').value=Number((p.rotation+pose.rotation).toFixed(3));$('motion-scale-x').value=appearanceMode()?p.scale:pose.scaleX??1;$('motion-scale-y').value=appearanceMode()?(p.scaleY??p.scale):pose.scaleY??1;
 for(const [id,node]of view.nodes){node.img.style.outline=id===selected?'1px dashed #b63875':'';node.img.style.pointerEvents='auto';}
 const point=view.nodes.get(selected).motion.getBoundingClientRect(),board=$('board').getBoundingClientRect();Object.assign($('pivot').style,{left:(point.x-board.x)/zoom+'px',top:(point.y-board.y)/zoom+'px'});
 const hasKey=clip.tracks.find(t=>t.part===selected)?.keys.some(k=>Math.abs(k.time-time)<.0005);$('delete-key').disabled=!hasKey;$('key-status').textContent=`${time.toFixed(3)} שניות · ${hasKey?'יש פריים בזמן הזה':'שינוי מיקום ייצור פריים חדש'}`;$('undo').disabled=!history.length;
}
function rebuild(){if(!rig.parts.some(p=>p.id===selected))selected=rig.parts[0].id;$('part').replaceChildren(...rig.parts.map(p=>new Option(p.label??p.id,p.id)));const revision=++renderRevision;view=mountProp($('rig'),rig,{assetUrl:rootUrl});view.ready.catch(error=>{if(revision===renderRevision)status('לא ניתן לטעון את האיור: '+error.message,true);});layout();fields();tracks();frame();}
function edit(change){stop();const before=copy({rig,clip});try{change();validatePair(rig,clip);history.push(JSON.stringify(before));if(history.length>60)history.shift();save();rebuild();status('עודכן בטיוטה');}catch(error){rig=before.rig;clip=before.clip;fields();frame();status(error.message,true);}}
function setKey(values){const start=poseAt(clip,selected,0);let track=clip.tracks.find(t=>t.part===selected);if(!track){track={part:selected,keys:[]};clip.tracks.push(track);}if(time>.0005&&!track.keys.some(k=>k.time===0))track.keys.unshift({time:0,x:start.x,y:start.y,rotation:start.rotation});const k=track.keys.find(k=>Math.abs(k.time-time)<.0005),next={...poseAt(clip,selected,time),time:Number(time.toFixed(3)),...values};if(k)Object.assign(k,next);else track.keys.push(next);track.keys.sort((a,b)=>a.time-b.time);}
async function load(){
 stop();status('טוענים את האביזר…');entry=catalog.props.find(p=>p.id===$('prop-select').value);
 const get=async path=>{const response=await fetch(rootUrl(path)+'?v=door-sprites4');if(!response.ok)throw Error('לא ניתן לטעון '+path);return response.json();};
 const [r,c]=await Promise.all([get(entry.assembly),get(entry.animation)]);validatePair(r,c);published=copy({rig:r,clip:c});rig=loadPropAppearance(r);clip=c;history=[];time=0;
 let restored=false;try{const draft=JSON.parse(localStorage.getItem(key()));if(draft){validatePair(draft.rig,draft.clip);rig=draft.rig;clip=draft.clip;restored=true;}}catch{status('הטיוטה המקומית אינה תקינה. נטענה הגרסה מהפרויקט.',true);}
 selected=rig.parts[0].id;$('part').replaceChildren(...rig.parts.map(p=>new Option(p.label??p.id,p.id)));$('assembly-path').textContent=entry.assembly;$('animation-path').textContent=entry.animation;$('export-clip').textContent='הורדת '+entry.animation.split('/').at(-1);$('game-preview').hidden=entry.category==='furniture';
 rebuild();updateMode();fit();$('appearance-game').href=entry.category==='furniture'?'game.html':'salon.html';$('draft-status').textContent=restored?'שוחזרה הטיוטה מהדפדפן.':'נטענה הגרסה מהפרויקט.';status('מוכן לעריכה. ייצוא והעלאה זמינים ב״שמירה והעלאה לגיטהאב״.');
}
function updateMode(){
 stop();const base=appearanceMode();
 $('appearance-actions').hidden=!base;$('save-key').hidden=base;$('delete-key').hidden=base;$('key-status').hidden=base;
 document.querySelector('.timeline').hidden=base;$('play').disabled=base;$('loop').disabled=base;
 $('scale-x-label').textContent=base?'קנה מידה בסיסי לרוחב':'רוחב בתנועה';$('scale-y-label').textContent=base?'קנה מידה בסיסי לגובה':'גובה בתנועה';
 $('pose-legend').textContent=base?'מיקום קבוע של החלק במשחק':'מיקום החלק בזמן הנבחר';
 $('pose-help').textContent=base?'השינויים מעדכנים את סידור הבסיס בלבד. לחצי שמירת המראה במשחק כדי להחיל אותם.':'בחרי זמן וגררי חלק. פריים נשמר אוטומטית.';
 if(base){$('assembly-details').open=true;$('pivot-mode').checked=false;}fields();frame();
}
$('edit-mode').onchange=updateMode;
$('save-appearance').onclick=()=>{try{savePropAppearance(rig);status('המראה נשמר במשחק בדפדפן הזה. בפתיחת המשחק או ברענון יוצג הסידור החדש.');}catch(error){status('השמירה לא בוצעה: '+error.message,true);}};
$('clear-appearance').onclick=()=>{try{clearPropAppearance(rig.id);status('המשחק יחזור למראה המקורי ברענון. העבודה בסטודיו נשארה כטיוטה.');}catch(error){status(error.message,true);}};
$('prop-select').onchange=()=>load().catch(error=>status(error.message,true));
$('part').onchange=()=>{stop();selected=$('part').value;fields();tracks();frame();};$('pivot-mode').onchange=()=>{stop();fields();frame();};
for(const [id,update]of Object.entries({'base-x':(p,n)=>p.position[0]=n,'base-y':(p,n)=>p.position[1]=n,'anchor-x':(p,n)=>p.anchor[0]=n,'anchor-y':(p,n)=>p.anchor[1]=n,'part-scale':(p,n)=>p.scale=n,'part-scale-y':(p,n)=>p.scaleY=n,'base-rotation':(p,n)=>p.rotation=n,layer:(p,n)=>p.layer=n}))$(id).onchange=()=>{const n=$(id).valueAsNumber;edit(()=>update(current(),n));};
$('parent').onchange=()=>{const parent=$('parent').value;edit(()=>current().parent=parent||null);};
function savePosition(){const p=current();if(appearanceMode()){edit(()=>{p.position=[$('position-x').valueAsNumber,$('position-y').valueAsNumber];p.rotation=$('rotation').valueAsNumber;p.scale=$('motion-scale-x').valueAsNumber;p.scaleY=$('motion-scale-y').valueAsNumber;});return;}const values={x:$('position-x').valueAsNumber-p.position[0],y:$('position-y').valueAsNumber-p.position[1],rotation:$('rotation').valueAsNumber-p.rotation,...(p.images?{imageFrame:$('image-frame').value}:{}),scaleX:$('motion-scale-x').valueAsNumber,scaleY:$('motion-scale-y').valueAsNumber};edit(()=>setKey(values));}
for(const id of ['position-x','position-y','rotation','motion-scale-x','motion-scale-y','image-frame'])$(id).onchange=savePosition;
$('save-key').onclick=savePosition;
$('delete-key').onclick=()=>edit(()=>{const track=clip.tracks.find(t=>t.part===selected);track.keys=track.keys.filter(k=>Math.abs(k.time-time)>=.0005);clip.tracks=clip.tracks.filter(t=>t.keys.length);});
$('duration').onchange=()=>{const duration=$('duration').valueAsNumber;edit(()=>{if(!Number.isFinite(duration)||duration<.05||duration>30)throw Error('משך התנועה חייב להיות בין 0.05 ל־30 שניות');const ratio=duration/clip.duration;for(const track of clip.tracks)for(const k of track.keys)k.time*=ratio;time*=ratio;clip.duration=duration;});};
$('easing').onchange=()=>{const easing=$('easing').value;edit(()=>clip.easing=easing);};
function scrub(value){stop();time=Math.max(0,Math.min(clip.duration,Number(value)||0));fields();frame();}
$('time').onchange=()=>scrub($('time').value);$('scrub').oninput=()=>scrub($('scrub').value);
$('zoom').oninput=()=>{zoom=Number($('zoom').value);layout();frame();};$('fit').onclick=fit;new ResizeObserver(()=>{layout();if(view)frame();}).observe($('viewport'));
$('play').onclick=()=>{if(playing){stop();return;}fields();playing=true;last=performance.now();if(time>=clip.duration)time=0;$('play').textContent='Ⅱ עצירה';};
function tick(now){if(playing){time+=(now-last)/1000;if(time>=clip.duration){if($('loop').checked)time%=clip.duration;else{time=clip.duration;stop();}}frame();}last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
$('undo').onclick=()=>{stop();if(!history.length)return;const previous=JSON.parse(history.pop());rig=previous.rig;clip=previous.clip;time=Math.min(time,clip.duration);save();rebuild();status('השינוי האחרון בוטל');};
$('reset').onclick=()=>{stop();remember();rig=copy(published.rig);clip=copy(published.clip);time=0;save();rebuild();status('נטענה הגרסה מהפרויקט. אפשר לבטל כדי לשחזר את הטיוטה.');};
function download(data,path){validatePair(rig,clip);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=path.split('/').at(-1);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('הקובץ הורד. החליפי את הקובץ בגיטהאב בנתיב שמופיע בעורך.');}
$('export-rig').onclick=()=>download(rig,entry.assembly);$('export-clip').onclick=()=>download(clip,entry.animation);
$('import').onchange=async()=>{try{let nextRig=rig,nextClip=clip;const files=[...$('import').files];if(files.length>2)throw Error('בחרי לכל היותר הרכבה ואנימציה אחת');const types=new Set();for(const file of files){if(file.size>200000)throw Error('קובץ הנתונים גדול מדי');const data=JSON.parse(await file.text()),type=Array.isArray(data.parts)?'rig':Array.isArray(data.tracks)?'clip':null;if(!type||types.has(type))throw Error('בחרי קובץ הרכבה אחד ו/או קובץ אנימציה אחד');types.add(type);if(type==='rig')nextRig=data;else nextClip=data;}validatePair(nextRig,nextClip);edit(()=>{rig=nextRig;clip=nextClip;time=Math.min(time,clip.duration);selected=rig.parts.some(p=>p.id===selected)?selected:rig.parts[0].id;$('part').replaceChildren(...rig.parts.map(p=>new Option(p.label??p.id,p.id)));});status('הקבצים יובאו ונשמרו כטיוטה');}catch(error){status('הייבוא לא בוצע: '+error.message,true);}finally{$('import').value='';}};
$('game-preview').onclick=()=>{try{validatePair(rig,clip);sessionStorage.setItem('popaPropPreviewV1',JSON.stringify({rig,clip}));const preview=window.open('','popa-prop-preview');if(!preview)throw Error('פתיחת החלון נחסמה בדפדפן');preview.sessionStorage.setItem('popaPropPreviewV1',JSON.stringify({rig,clip}));preview.location.href=new URL('../salon.html?propPreview='+encodeURIComponent(entry.id),import.meta.url).href;status('נפתחה תצוגה מקדימה של הטיוטה במספרה. הגרסה המפורסמת לא השתנתה.');}catch(error){status('לא ניתן לפתוח תצוגה מקדימה: '+error.message,true);}};
function parentAngle(part,includeSelf=false){let sum=0,p=includeSelf?part:rig.parts.find(p=>p.id===part.parent);while(p){sum+=p.rotation+poseAt(activeClip(),p.id,time).rotation;p=rig.parts.find(q=>q.id===p.parent);}return sum*Math.PI/180;}
function rotatedDelta(dx,dy,angle){return [dx*Math.cos(angle)+dy*Math.sin(angle),-dx*Math.sin(angle)+dy*Math.cos(angle)];}
$('viewport').addEventListener('pointerdown',event=>{
 const image=event.target.closest('[data-prop-image]');if(!image||!rig)return;stop();selected=image.dataset.propImage;fields();tracks();frame();
 drag={x:event.clientX,y:event.clientY,before:copy({rig,clip}),part:copy(current()),pose:poseAt(activeClip(),selected,time),pivot:$('pivot-mode').checked};$('viewport').setPointerCapture(event.pointerId);event.preventDefault();
});
$('viewport').addEventListener('pointermove',event=>{
 if(!drag)return;const dx=(event.clientX-drag.x)/zoom,dy=(event.clientY-drag.y)/zoom,p=current();
 const [x,y]=rotatedDelta(dx,dy,parentAngle(p));
 if(!drag.pivot&&appearanceMode()){p.position=[drag.part.position[0]+x,drag.part.position[1]+y];}
 else if(!drag.pivot){setKey({x:drag.pose.x+x,y:drag.pose.y+y,rotation:drag.pose.rotation});}
 else{p.position=[drag.part.position[0]+x,drag.part.position[1]+y];const [ax,ay]=rotatedDelta(dx,dy,parentAngle(p,true));p.anchor=[drag.part.anchor[0]+ax/p.scale,drag.part.anchor[1]+ay/(p.scaleY??p.scale)];}
 rebuild();
});
function endDrag(){if(!drag)return;try{validatePair(rig,clip);history.push(JSON.stringify(drag.before));save();status('הגרירה נשמרה בטיוטה');}catch(error){rig=drag.before.rig;clip=drag.before.clip;status(error.message,true);}drag=null;rebuild();}
$('viewport').addEventListener('pointerup',endDrag);$('viewport').addEventListener('pointercancel',()=>{if(drag){rig=drag.before.rig;clip=drag.before.clip;drag=null;rebuild();}});
for(const input of document.querySelectorAll('input[type=number]'))input.addEventListener('focus',stop);
for(const el of document.querySelectorAll('aside button,aside input,aside select,.view-controls button,.timeline input,.timeline select'))el.disabled=true;
try{const response=await fetch(rootUrl('assets/catalog.json')+'?v=door-sprites4');if(!response.ok)throw Error('לא ניתן לטעון את הקטלוג');catalog=await response.json();const furnitureMode=new URLSearchParams(location.search).get('category')==='furniture';document.title=furnitureMode?'סטודיו תנועת הרהיטים':'סטודיו האביזרים';$('studio-heading').textContent=document.title;$('asset-label').textContent=furnitureMode?'רהיט לעריכת תנועה':'אביזר מהמשחק';const editable=catalog.props.filter(p=>p.editable&&p.assembly&&p.animation&&(furnitureMode?p.category==='furniture':p.category!=='furniture'));if(!editable.length)throw Error('אין אביזרים לעריכה');$('prop-select').replaceChildren(...editable.map(p=>new Option(p.label??p.id,p.id)));const requested=new URLSearchParams(location.search).get('prop');if(editable.some(p=>p.id===requested))$('prop-select').value=requested;if(new URLSearchParams(location.search).get('mode')==='appearance')$('edit-mode').value='appearance';await load();for(const el of document.querySelectorAll('aside button,aside input,aside select,.view-controls button,.timeline input,.timeline select'))el.disabled=false;updateMode();}catch(error){status('הטעינה נכשלה: '+error.message,true);}
