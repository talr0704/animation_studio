import { SalonRound,HAIR_PARTS,LENGTHS,CARE_CELLS } from './salon-round.js';
import { readAlbum,recordVisit,unlocked,UNLOCKS } from './salon-progress.js';
const $=id=>document.getElementById(id);
const LABELS={bangs:'פוני',side_left:'צד שמאל',side_right:'צד ימין',back_left:'עורף שמאל',back_right:'עורף ימין'};
const LENGTH_LABELS=['קצר','בינוני','ארוך'];
const TOOLS={water:['מים','Wash_And_Accessories/shower_head.png'],shampoo:['שמפו','Wash_And_Accessories/shampoo_body.png'],dryer:['ייבוש','Tools/hairdryer.png'],scissors:['מספריים','Scissors/scissors_half_a.png'],comb:['סירוק','Tools/comb.png'],brush:['מברשת','Tools/brush.png'],flower:['פרח','Tools/flower_clip.png'],bow:['סרט','Wash_And_Accessories/bow_clip.png']};
const PHASES=['הרטבה','סיבון','שטיפה','ייבוש','תספורת','סירוק','סיכה'];
let album=readAlbum(),order=album.total,round=new SalonRound(order),selectedTool=null,selectedZone='bangs';
let scale=1,ready=false,lastStroke=0,lastPoint=null,assembly,headReaction,sound=false,audio;
let pickupOrigin=null,pickupMoved=false;
const effects=new Set(),animations=new Set(),foamNodes=[],wetNodes=[];
const imageUrl=path=>new URL(`../${path}`,import.meta.url).href;
function play(target,frames,options){
 for(const a of animations)if(a.effect?.target===target)a.cancel();
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const animation=target.animate(frames,{...options,duration:reduce?0:options.duration});animations.add(animation);
 animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));return animation;
}
function wallet(){try{const saved=JSON.parse(localStorage.getItem('popaWorldV1')||'{}');return Number.isSafeInteger(saved?.coins)&&saved.coins>=0?saved.coins:0;}catch{return 0;}}
function message(text){$('feedback').textContent=text;}
function portrait(container,lengths,accessory){
 container.replaceChildren();const art=document.createElement('div');art.className='portrait-art';
 const make=(src,x,y,w,h,z)=>{const img=new Image();img.src=imageUrl(src);img.alt='';Object.assign(img.style,{left:`${x-200}px`,top:`${y-30}px`,width:`${w}px`,height:`${h}px`,zIndex:z});art.append(img);};
 const head=assembly.station.find(part=>part.selector==='.head');
 make(head.file,...head.position,...head.size,head.layer);
 const hair=assembly.hair,ax=hair.anchor[0]*hair.displaySize[0]/hair.sourceCanvas[0],ay=hair.anchor[1]*hair.displaySize[1]/hair.sourceCanvas[1];
 for(const part of hair.parts){make(`Hair_Aligned/${part.id}_${LENGTHS[lengths[part.id]]}.png`,part.joint[0]-ax,part.joint[1]-ay,...hair.displaySize,part.layer);}
 if(accessory)make(TOOLS[accessory][1],453,118,90,55,9);
 container.append(art);
 const update=()=>{const s=container.clientWidth/400;art.style.transform=`scale(${s})`;container.style.height=`${340*s}px`;};
 update();return update;
}
let updatePortraits=[],requestPortraitUpdate=()=>{};
function renderAlbum(){
 $('album').replaceChildren();$('album-empty').hidden=album.entries.length>0;updatePortraits=[];
 for(const entry of [...album.entries].reverse()){
  const card=document.createElement('article');card.className='album-card';
  const preview=document.createElement('div');preview.className='portrait';card.append(preview);
  const title=document.createElement('h3');title.textContent=entry.title;card.append(title);
  const score=document.createElement('p');score.textContent=`${entry.scores.total} נקודות · +${entry.reward} מטבעות`;card.append(score);
  $('album').append(card);updatePortraits.push(portrait(preview,entry.lengths,entry.accessory));
 }
 $('unlocks').replaceChildren();for(const item of UNLOCKS){const p=document.createElement('p');p.classList.toggle('unlocked',unlocked(album,item.id));p.textContent=unlocked(album,item.id)?`${item.label} ✓`:`${item.label} · אחרי ${item.at} ביקורים`;$('unlocks').append(p);}
}
function careVisuals(){
 CARE_CELLS.forEach((cell,i)=>{
  foamNodes[i].style.opacity=round.care.soap[i]*(1-round.care.rinse[i]);
  wetNodes[i].style.opacity=round.phase<4?round.care.wet[i]*(1-round.care.dry[i])*.5:0;
 });
}
function refresh(){
 $('request-title').textContent=round.order.title;$('request-text').textContent=round.order.text;$('coins').textContent=wallet();
 $('targets').replaceChildren();for(const [i,name]of HAIR_PARTS.entries()){const row=document.createElement('div');row.className='target';row.classList.toggle('done',round.lengths[name]===round.order.lengths[i]);row.append(document.createTextNode(LABELS[name]));const b=document.createElement('b');b.textContent=`${LENGTH_LABELS[round.order.lengths[i]]} ${round.lengths[name]===round.order.lengths[i]?'✓':''}`;row.append(b);$('targets').append(row);}
 $('steps').replaceChildren();for(const [i,label]of PHASES.entries()){
  const li=document.createElement('li');li.classList.toggle('done',i<round.phase);li.classList.toggle('current',i===round.phase);
  const b=document.createElement('b');b.textContent=i<round.phase?'✓':i+1;
  const progress=i===round.phase&&![4,6].includes(i)?` · ${Math.floor(round.coverage()*100)}%`:'';
  li.append(b,document.createTextNode(label+progress));$('steps').append(li);
 }
 for(const img of document.querySelectorAll('#head-rig [data-hair]')){img.src=imageUrl(`Hair_Aligned/${img.dataset.hair}_${LENGTHS[round.lengths[img.dataset.hair]]}.png`);img.classList.toggle('selected',selectedTool==='scissors'&&img.dataset.hair===selectedZone);}
 for(const button of $('tools').querySelectorAll('button')){button.setAttribute('aria-pressed',String(button.dataset.tool===selectedTool));button.disabled=['bow','brush'].includes(button.dataset.tool)&&!unlocked(album,button.dataset.tool);}
 for(const button of $('zones').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.zone===selectedZone));
 if(selectedTool){$('tool-image').src=imageUrl(TOOLS[selectedTool][1]);$('tool-image').hidden=selectedTool==='scissors';$('scissors').hidden=selectedTool!=='scissors';$('pump').hidden=selectedTool!=='shampoo';}else $('tool').hidden=true;
 $('finish-cut').hidden=round.phase!==4;$('finish').disabled=round.phase!==7||round.claimed;$('finish').hidden=round.phase!==7;
 document.querySelector('.hair-controls').hidden=selectedTool!=='scissors'&&round.phase!==4;
 $('current-step').textContent=round.phase<7?`✿ ${PHASES[round.phase]}${![4,6].includes(round.phase)?` · ${Math.floor(round.coverage()*100)}%`:''}`:'המראה שלך מוכן!';
 $('care-progress').hidden=[4,6,7].includes(round.phase);$('care-progress').value=Math.floor(round.coverage()*100);
 $('pickup-hint').textContent=selectedTool?`${TOOLS[selectedTool][0]} ביד · להחזרה: לחצי שוב על המקום שלו או Escape`:'קחי כלי מהמעמד והעבירי אותו לשיער';
 careVisuals();
}
function effect(file,{x=400,y=160,w=100}={}){
 const img=new Image();img.className='effect';img.src=imageUrl(file);img.alt='';Object.assign(img.style,{left:`${x-w/2}px`,top:`${y}px`,width:`${w}px`,height:`${w}px`});$('effects').append(img);effects.add(img);
 play(img,[{transform:'translateY(0)',opacity:1},{transform:'translateY(-22px)',opacity:0}],{duration:900,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>{img.remove();effects.delete(img);});return img;
}
function clearEffects(){effects.forEach(e=>e.remove());effects.clear();}
function soundCue(){
 if(!sound||!audio)return;const now=audio.currentTime;
 const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);
 oscillator.frequency.setValueAtTime(selectedTool==='scissors'?950:selectedTool==='water'?350:600,now);oscillator.frequency.exponentialRampToValueAtTime(240,now+.1);
 gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.14);oscillator.start();oscillator.stop(now+.15);
}
function react(x){
 const lean=Math.max(-2,Math.min(2,(x-400)/70));
 headReaction=play($('head-rig'),[{transform:'rotate(0)'},{transform:`rotate(${lean}deg) translateY(-1px)`},{transform:'rotate(0)'}],{duration:['comb','brush'].includes(selectedTool)?800:500,easing:'ease-in-out'});
 if(['comb','brush'].includes(selectedTool))effect('Wash_And_Accessories/heart.png',{x:510,y:70,w:45});
 if(selectedTool==='dryer'){
  const direction=x<400?-1:1;
  for(const hair of document.querySelectorAll('#head-rig [data-hair]'))play(hair,[0,5*direction,-2*direction,0].map(a=>({transform:`rotate(${a}deg)`})),{duration:650,easing:'ease-in-out'});
 }
}
function animateTool(){
 if(selectedTool==='scissors')for(const [selector,angle]of [['.blade.a',18],['.blade.b',-18]])play($('scissors').querySelector(selector),[angle,0,angle].map(a=>({transform:`rotate(${a}deg)`})),{duration:380,easing:'ease-in-out'});
 else if(selectedTool==='shampoo')play($('pump'),[{transform:'translateY(0)'},{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:350,easing:'ease-in-out'});
 else play($('tool-image'),[{transform:'rotate(-5deg)'},{transform:'rotate(5deg)'},{transform:'rotate(0)'}],{duration:380,easing:'ease-in-out'});
}
function apply(x,y){
 if(!ready||round.claimed||!selectedTool)return;
 if(['bow','brush'].includes(selectedTool)&&!unlocked(album,selectedTool))return;
 const before=round.phase,result=round.use(selectedTool,selectedZone,{x,y});
 if(result.kind==='done'){message('המראה מוכן! לחצי על סיימנו.');return;}
 if(result.kind==='wrong'){message(`עכשיו ${TOOLS[result.required][0]} — לכל כלי הרגע שלו.`);return;}
 if(result.kind==='outside'){message('עברי גם על הפוני ועל התלתלים משני צדי הראש.');return;}
 if(result.kind==='ready'){message('זה האורך הקצר ביותר באזור שבחרת.');return;}
 animateTool();soundCue();react(x);
 if(selectedTool==='water')effect('Wash_And_Accessories/water_spray.png',{x,y,w:85});
 else if(selectedTool==='shampoo')effect('Wash_And_Accessories/bubbles.png',{x:x+25,y:y-25,w:50});
 else if(selectedTool==='dryer')effect('Tools/airflow.png',{x:x-55,y,w:100});
 else if(selectedTool==='scissors'){
  effect('Tools/hair_clipping.png',{x,y:y+60,w:50});
  play(document.querySelector(`#head-rig [data-hair="${selectedZone}"]`),[0,-2,2,0].map(a=>({transform:`rotate(${a}deg)`})),{duration:400});
 }else if(['comb','brush'].includes(selectedTool))effect('Wash_And_Accessories/sparkle.png',{x,y,w:45});
 else{$('accessory').hidden=false;$('accessory').src=imageUrl(TOOLS[selectedTool][1]);effect('Wash_And_Accessories/heart.png',{x:500,y:70,w:60});}
 refresh();
 if(round.phase===7)message('המראה שלך מוכן. אפשר לשנות סיכה או לחשוף את התוצאה!');
 else if(round.phase!==before)message(`מרגיש נהדר! עכשיו ${PHASES[round.phase]}.`);
 else if(result.kind==='cut')message(round.cutDone?'הגעת למראה שבתמונה. אפשר להמשיך לעצב או לעבור לגימור.':'קיצרנו דרגה אחת באזור שבחרת. את מחליטה מתי לעבור לגימור.');
 else message(`טיפלנו ב־${Math.floor(round.coverage()*100)}% מהאזור. עברי גם למקומות שעוד לא טופלו.`);
}
function toolPosition(x,y){$('tool').style.left=`${x-65}px`;$('tool').style.top=`${y-90}px`;$('tool').hidden=false;}
function pointer(event,down=false){
 if(!ready||round.claimed||!selectedTool||!$('request-panel').hidden||!$('album-panel').hidden)return;
 const rect=$('scene').getBoundingClientRect(),x=(event.clientX-rect.left)/scale,y=(event.clientY-rect.top)/scale;
 toolPosition(x,y);if(pickupOrigin&&Math.hypot(event.clientX-pickupOrigin.x,event.clientY-pickupOrigin.y)>8)pickupMoved=true;
 if(!down&&!event.buttons)return;
 const now=performance.now();if(!down&&(now-lastStroke<85||(lastPoint&&Math.hypot(x-lastPoint.x,y-lastPoint.y)<15)))return;
 const offset=assembly.workspaces[window.innerWidth<=680?'portrait':'wide'].actor;
 const localX=x-offset[0],localY=y-offset[1];
 if(localX<220||localX>580||localY<50||localY>330){if(down)message('העבירי את הכלי אל השיער.');return;}
 lastStroke=now;lastPoint={x,y};apply(localX,localY);
}
function putBack(){selectedTool=null;pickupOrigin=null;pickupMoved=false;lastPoint=null;$('tool').hidden=true;refresh();}
function pickTool(name){
 if(!ready||round.claimed)return;
 if(selectedTool===name){putBack();message('הכלי חזר למקום.');return;}
 selectedTool=name;refresh();$('stage').focus({preventScroll:true});message(name==='scissors'?'בחרי אזור תספורת בתגים שעל הגלימה. רק הוא יתקצר.':`לקחת ${TOOLS[name][0]}. העבירי אותו בעדינות על השיער.`);
}
for(const [name,[label,src]]of Object.entries(TOOLS)){
 const button=document.createElement('button');button.type='button';button.className='tool-item';button.dataset.tool=name;button.setAttribute('aria-label',`לקחת ${label}`);button.title=label;
 const img=new Image();img.src=imageUrl(src);img.alt='';button.append(img);
 if(name==='shampoo'){
  img.className='inventory-bottle';const pump=new Image();pump.src=imageUrl('Wash_And_Accessories/shampoo_pump.png');pump.className='inventory-pump';pump.alt='';button.prepend(pump);
 }
 const labelNode=document.createElement('span');labelNode.className='tool-label';labelNode.textContent=label;button.append(labelNode);
 button.addEventListener('pointerdown',event=>{
  event.preventDefault();event.stopPropagation();if(button.disabled)return;
  pickTool(name);if(!selectedTool)return;
  pickupOrigin={x:event.clientX,y:event.clientY};pickupMoved=false;
  $('stage').setPointerCapture(event.pointerId);pointer(event);
 });
 button.addEventListener('click',event=>{if(event.detail===0){pickTool(name);if(selectedTool){$('stage').focus({preventScroll:true});const point=round.nextPoint(),offset=assembly.workspaces[window.innerWidth<=680?'portrait':'wide'].actor;toolPosition(point.x+offset[0],point.y+offset[1]);}}});
 $('tools').append(button);
}
for(const name of HAIR_PARTS){const button=document.createElement('button');button.type='button';button.textContent=LABELS[name];button.dataset.zone=name;button.onclick=()=>{selectedZone=name;refresh();};$('zones').append(button);}
function mountAssembly(definition){
 for(const part of definition.station){const img=document.querySelector(part.selector);Object.assign(img.style,{left:`${part.position[0]}px`,top:`${part.position[1]}px`,width:`${part.size[0]}px`,height:`${part.size[1]}px`,zIndex:part.layer});}
 $('head-rig').style.transformOrigin=definition.headPivot.map(v=>`${v}px`).join(' ');
 const hair=definition.hair,sx=hair.displaySize[0]/hair.sourceCanvas[0],sy=hair.displaySize[1]/hair.sourceCanvas[1];
 for(const part of hair.parts){const img=document.querySelector(`[data-hair="${part.id}"]`);Object.assign(img.style,{left:`${part.joint[0]-hair.anchor[0]*sx}px`,top:`${part.joint[1]-hair.anchor[1]*sy}px`,width:`${hair.displaySize[0]}px`,height:`${hair.displaySize[1]}px`,transformOrigin:`${hair.anchor[0]*sx}px ${hair.anchor[1]*sy}px`,zIndex:part.layer});}
 const scissors=definition.scissors;
 for(const part of scissors.parts){const node=$('scissors').querySelector(part.selector),img=node.querySelector('img');Object.assign(node.style,{left:`${scissors.joint[0]}px`,top:`${scissors.joint[1]}px`});Object.assign(img.style,{width:`${part.sourceSize[0]*scissors.scale}px`,height:`${part.sourceSize[1]*scissors.scale}px`,left:`${-part.anchor[0]*scissors.scale}px`,top:`${-part.anchor[1]*scissors.scale}px`});}
 const bolt=$('scissors').querySelector('.bolt');Object.assign(bolt.style,{left:`${scissors.joint[0]-scissors.bolt.size[0]/2}px`,top:`${scissors.joint[1]-scissors.bolt.size[1]/2}px`});
}
function closePanel(id){$(id).hidden=true;const button=id==='request-panel'?$('show-request'):$('show-album');button.focus({preventScroll:true});}
$('show-request').onclick=()=>{putBack();$('request-panel').hidden=false;$('request-panel').querySelector('button').focus();};
$('show-album').onclick=()=>{putBack();$('album-panel').hidden=false;updatePortraits.forEach(update=>update());$('album-panel').querySelector('button').focus();};
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>closePanel(button.dataset.close);
for(const panel of document.querySelectorAll('.world-panel'))panel.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&panel.id!=='result'){event.preventDefault();closePanel(panel.id);}
 if(event.key==='Tab'){const controls=[...panel.querySelectorAll('button:not(:disabled),a[href]')];const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
$('stage').addEventListener('pointerdown',e=>{
 if(e.target.closest('button,a,.world-panel,.inworld-ui'))return;
 e.preventDefault();$('stage').focus({preventScroll:true});
 if(!selectedTool){message('קחי קודם כלי מהמעמד.');return;}
 pickupOrigin={x:e.clientX,y:e.clientY};pickupMoved=false;
 $('stage').setPointerCapture(e.pointerId);pointer(e,true);
});
$('stage').addEventListener('pointermove',e=>{if(!e.target.closest('.world-panel'))pointer(e);});
$('stage').addEventListener('pointerleave',()=>{if(!lastPoint)$('tool').hidden=true;});
$('stage').addEventListener('pointerup',event=>{
 const destination=document.elementsFromPoint(event.clientX,event.clientY).find(node=>node.dataset?.tool);
 if(pickupMoved&&destination?.dataset.tool===selectedTool)putBack();
 lastPoint=null;pickupOrigin=null;pickupMoved=false;
});
$('stage').addEventListener('pointercancel',()=>{lastPoint=null;pickupOrigin=null;pickupMoved=false;$('tool').hidden=true;});
$('stage').addEventListener('keydown',e=>{
 if(e.key==='Escape'&&e.target.closest('.world-panel'))return;
 if(e.key==='Escape'){putBack();return;}
 if((e.code==='Space'||e.key==='Enter')&&e.target===$('stage')){
  e.preventDefault();if(!selectedTool){message('בחרי כלי בעזרת Tab ו־Enter או קחי אותו מהמעמד.');return;}
  const point=round.nextPoint(),offset=assembly.workspaces[window.innerWidth<=680?'portrait':'wide'].actor;toolPosition(point.x+offset[0],point.y+offset[1]);apply(point.x,point.y);
 }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selectedTool&&!event.target.closest('.world-panel'))putBack();});
$('finish-cut').onclick=()=>{if(round.finishCut()){refresh();message('העיצוב שבחרת נשמר. עכשיו נסרק בעדינות את כל האזורים.');}};
$('finish').onclick=async()=>{
 const reward=round.claim();if(!reward)return;
 let stored=true;
 try{let state;try{state=JSON.parse(localStorage.getItem('popaWorldV1')||'{}');}catch{state={};}if(!state||typeof state!=='object'||Array.isArray(state))state={};state.coins=wallet()+reward;localStorage.setItem('popaWorldV1',JSON.stringify(state));}catch{stored=false;}
 const visit=recordVisit(album,round,reward);album=visit.album;stored&&=visit.saved;
 refresh();renderAlbum();$('tool').hidden=true;
 message(stored?'המראה נוסף לאלבום והמטבעות לארנק.':'השמירה אינה זמינה כרגע. אפשר לראות את התוצאה בביקור הזה.');
 await play(document.querySelector('.cape'),[{transform:'translateY(0)',opacity:1},{transform:'translateY(65px)',opacity:0}],{duration:650,easing:'ease-in-out',fill:'forwards'}).finished.catch(()=>{});
 $('result').hidden=false;
 const before=Object.fromEntries(HAIR_PARTS.map(name=>[name,2]));
 updatePortraits.push(portrait($('before-preview'),before,null),portrait($('after-preview'),round.lengths,round.accessory));
 $('score-breakdown').replaceChildren();for(const [key,label]of [['match','התאמה לבקשה'],['care','טיפוח'],['style','גימור ועיצוב']]){
  const cell=document.createElement('div'),b=document.createElement('b');b.textContent=round.scores[key];cell.append(b,document.createTextNode(label));$('score-breakdown').append(cell);
 }
 $('result-text').textContent=`${round.scores.total} נקודות · +${reward} מטבעות. ${stored?'התסרוקת נשמרה באלבום שלך.':'השמירה בדפדפן אינה זמינה.'}`;
 $('unlock-message').textContent=visit.newUnlocks.map(item=>`נפתח: ${item.label}!`).join(' ');
 $('next').focus({preventScroll:true});
};
function setupRequest(){
 const target=Object.fromEntries(HAIR_PARTS.map((name,i)=>[name,round.order.lengths[i]]));
 requestPortraitUpdate=portrait($('request-preview'),target,round.order.accessory);
}
$('next').onclick=()=>{
 animations.forEach(a=>a.cancel());clearEffects();round=new SalonRound(++order);selectedTool=null;selectedZone='bangs';
 $('accessory').hidden=true;$('result').hidden=true;
 document.querySelector('.cape').style.opacity='';
 renderAlbum();setupRequest();layoutWorkspace();refresh();message('בקשה חדשה! מתחילים בהרטבה של כל אזורי השיער.');
};
$('salon-sound').onclick=()=>{
 sound=!sound;if(sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{sound=false;message('הצליל אינו זמין בדפדפן הזה.');}}
 $('salon-sound').textContent=sound?'צליל פעיל ♫':'צליל כבוי ♫';$('salon-sound').setAttribute('aria-pressed',String(sound));
};
function layoutWorkspace(){
 if(!assembly)return;
 const mode=window.innerWidth<=680?'portrait':'wide',layout=assembly.workspaces[mode];
 const [w,h]=layout.canvas;scale=Math.min($('stage').clientWidth/w,$('stage').clientHeight/h);
 const left=($('stage').clientWidth-w*scale)/2,top=($('stage').clientHeight-h*scale)/2;
 Object.assign($('scene').style,{width:`${w}px`,height:`${h}px`,left:`${left}px`,top:`${top}px`,transform:`scale(${scale})`});
 $('actor').style.transform=`translate(${layout.actor[0]}px,${layout.actor[1]}px)`;
 const place=(element,rect)=>Object.assign(element.style,{left:`${rect[0]}px`,top:`${rect[1]}px`,width:`${rect[2]}px`,height:`${rect[3]}px`});
 place(document.querySelector('.mirror'),layout.mirror);place(document.querySelector('.counter'),layout.counter);
 place(document.querySelector('.tool-shelf'),layout.shelf);place(document.querySelector('.clip-tray'),layout.tray);place($('show-album'),layout.album);
 for(const [name,rect]of Object.entries(layout.tools))place(document.querySelector(`[data-tool="${name}"]`),rect);
 const mirror=document.querySelector('.mirror-request');place(mirror,[layout.mirror[0]+10,layout.mirror[1],layout.mirror[2],layout.mirror[3]+18]);
 Object.assign($('request-preview').style,{left:`${layout.mirror[2]*.19}px`,top:`${layout.mirror[3]*.14}px`,width:`${layout.mirror[2]*.62}px`});
 const portrait=mode==='portrait';
 Object.assign(document.querySelector('.scene-status').style,{left:portrait?'120px':'210px',top:portrait?'15px':'12px',width:portrait?'420px':'380px'});
 Object.assign(document.querySelector('.scene-actions').style,{left:portrait?'170px':'264px',top:portrait?'423px':'459px'});
 Object.assign(document.querySelector('.hair-controls').style,{left:portrait?'105px':'225px',top:portrait?'466px':'492px'});
 Object.assign($('pickup-hint').style,{left:portrait?'35px':'180px',top:portrait?'722px':'538px',width:portrait?'490px':'440px'});
 requestPortraitUpdate();updatePortraits.forEach(update=>update());
}
new ResizeObserver(layoutWorkspace).observe($('stage'));
try{
 const response=await fetch(new URL('../assets/salon-assembly.json',import.meta.url));if(!response.ok)throw new Error('Cannot load salon assembly');
 assembly=await response.json();mountAssembly(assembly);
 const inventoryScissors=$('scissors').cloneNode(true);inventoryScissors.removeAttribute('id');inventoryScissors.hidden=false;inventoryScissors.className='inventory-scissors';
 const scissorsButton=document.querySelector('[data-tool="scissors"]');scissorsButton.querySelector('img').remove();scissorsButton.prepend(inventoryScissors);
 layoutWorkspace();
 CARE_CELLS.forEach((cell,index)=>{
  for(const [collection,file,size]of [[foamNodes,'Wash_And_Accessories/foam.png',70],[wetNodes,'Tools/water_drops.png',45]]){
   const img=new Image();img.className='care-overlay';img.dataset.care=collection===foamNodes?'foam':'wet';img.dataset.cell=index;img.alt='';img.src=imageUrl(file);
   Object.assign(img.style,{left:`${cell.x-size/2}px`,top:`${cell.y-size/2}px`,width:`${size}px`,height:`${size}px`,opacity:0});
   $('care-overlays').append(img);collection.push(img);
  }
 });
 const files=new Set([...document.querySelectorAll('img[src]')].map(i=>i.src));
 for(const name of HAIR_PARTS)for(const length of LENGTHS)files.add(imageUrl(`Hair_Aligned/${name}_${length}.png`));
 for(const tool of Object.values(TOOLS))files.add(imageUrl(tool[1]));
 for(const file of ['water_spray','foam','bubbles','sparkle','heart'])files.add(imageUrl(`Wash_And_Accessories/${file}.png`));
 files.add(imageUrl('Tools/hair_clipping.png'));files.add(imageUrl('Tools/airflow.png'));
 await Promise.all([...files].map(async src=>{const i=new Image();i.src=src;await i.decode();}));
 renderAlbum();setupRequest();layoutWorkspace();ready=true;$('loading').hidden=true;refresh();message('קחי את ראש המים מהמדף והעבירי אותו על השיער.');
}catch(error){$('loading').textContent='לא הצלחנו לטעון את חלקי הסלון. נסי לרענן.';console.error(error);}
