import { SalonRound,HAIR_PARTS,LENGTHS } from './salon-round.js';
const $=id=>document.getElementById(id);
const LABELS={bangs:'פוני',side_left:'צד שמאל',side_right:'צד ימין',back_left:'עורף שמאל',back_right:'עורף ימין'};
const LENGTH_LABELS=['קצר','בינוני','ארוך'];
const TOOLS={water:['מים','Wash_And_Accessories/shower_head.png'],shampoo:['שמפו','Wash_And_Accessories/shampoo_body.png'],dryer:['ייבוש','Tools/hairdryer.png'],scissors:['מספריים','Scissors/scissors_half_a.png'],comb:['סירוק','Tools/comb.png'],flower:['פרח','Tools/flower_clip.png'],bow:['סרט','Wash_And_Accessories/bow_clip.png']};
const PHASES=['הרטבה','סיבון','שטיפה','ייבוש','תספורת','סירוק','סיכה'];
let order=0,round=new SalonRound(),selectedTool='water',selectedZone='bangs',scale=1,ready=false,lastStroke=0,lastPoint=null;
const effects=new Set(),animations=new Set();
const imageUrl=path=>new URL(`../${path}`,import.meta.url).href;
const play=(target,frames,options)=>{const animation=target.animate(frames,options);animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));return animation;};
function wallet(){try{const saved=JSON.parse(localStorage.getItem('popaWorldV1')||'{}');return Number.isSafeInteger(saved.coins)&&saved.coins>=0?saved.coins:0;}catch{return 0;}}
function refresh(){
 $('request-title').textContent=round.order.title;$('request-text').textContent=round.order.text;$('coins').textContent=wallet();
 $('targets').replaceChildren();for(const [i,name]of HAIR_PARTS.entries()){const row=document.createElement('div');row.className='target';row.classList.toggle('done',round.lengths[name]===round.order.lengths[i]);row.append(document.createTextNode(LABELS[name]));const b=document.createElement('b');b.textContent=`${LENGTH_LABELS[round.order.lengths[i]]} ${round.lengths[name]===round.order.lengths[i]?'✓':''}`;row.append(b);$('targets').append(row);}
 $('steps').replaceChildren();for(const [i,label]of PHASES.entries()){const li=document.createElement('li');li.classList.toggle('done',i<round.phase);li.classList.toggle('current',i===round.phase);const b=document.createElement('b');b.textContent=i<round.phase?'✓':i+1;li.append(b,document.createTextNode(label+(i===round.phase&&i!==4&&i!==6?` · ${round.strokes}/3`:'')));$('steps').append(li);}
 for(const img of document.querySelectorAll('[data-hair]')){img.src=imageUrl(`Hair_Aligned/${img.dataset.hair}_${LENGTHS[round.lengths[img.dataset.hair]]}.png`);img.classList.toggle('selected',selectedTool==='scissors'&&img.dataset.hair===selectedZone);}
 for(const button of $('tools').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.tool===selectedTool));
 for(const button of $('zones').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.zone===selectedZone));
 $('tool-image').src=imageUrl(TOOLS[selectedTool][1]);$('tool-image').hidden=selectedTool==='scissors';$('scissors').hidden=selectedTool!=='scissors';$('pump').hidden=selectedTool!=='shampoo';
 $('finish').disabled=round.phase!==7||round.claimed;
}
function message(text){$('feedback').textContent=text;}
function effect(file,{x=400,y=160,w=100,persistent=false}={}){
 const img=new Image();img.className='effect';img.src=imageUrl(file);img.alt='';Object.assign(img.style,{left:`${x-w/2}px`,top:`${y}px`,width:`${w}px`,height:`${w}px`});$('effects').append(img);effects.add(img);
 if(!persistent){play(img,[{transform:'translateY(0)',opacity:1},{transform:'translateY(-22px)',opacity:0}],{duration:900,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>{img.remove();effects.delete(img);});}
 return img;
}
function clearEffects(){effects.forEach(e=>e.remove());effects.clear();}
function animateTool(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(selectedTool==='scissors')for(const [selector,angle]of [['.blade.a',18],['.blade.b',-18]])play($( 'scissors').querySelector(selector),[angle,0,angle].map(a=>({transform:`rotate(${a}deg)`})),{duration:380,easing:'ease-in-out'});
 else if(selectedTool==='shampoo')play($('pump'),[{transform:'translateY(0)'},{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:350,easing:'ease-in-out'});
 else play($('tool-image'),[{transform:'rotate(-5deg)'},{transform:'rotate(5deg)'},{transform:'rotate(0)'}],{duration:380,easing:'ease-in-out'});
}
function apply(x=400,y=170){
 if(!ready||round.claimed)return;
 const before=round.phase,result=round.use(selectedTool,selectedZone);animateTool();
 if(result.kind==='done'){message('המראה מוכן! לחצי על סיימנו.');return;}
 if(result.kind==='wrong'){message(`קודם ${TOOLS[result.required][0]} — כך נשמור על הסדר בבקשה של פופה.`);return;}
 if(result.kind==='ready'){message('האזור הזה כבר באורך המבוקש. בחרי אזור אחר.');return;}
 if(selectedTool==='water'){
  if(before===2)clearEffects();effect('Wash_And_Accessories/water_spray.png',{x,y,w:105});
 }else if(selectedTool==='shampoo'){effect('Wash_And_Accessories/foam.png',{x,y,w:105,persistent:true});effect('Wash_And_Accessories/bubbles.png',{x:x+40,y:y-40,w:55});}
 else if(selectedTool==='dryer'){clearEffects();effect('Tools/airflow.png',{x:x-60,y,w:120});}
 else if(selectedTool==='scissors'){
  const hair=document.querySelector(`[data-hair="${selectedZone}"]`);
  effect('Tools/hair_clipping.png',{x,y:y+70,w:50});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)play(hair,[{transform:'rotate(-2deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0)'}],{duration:400});
 }else if(selectedTool==='comb'){effect('Wash_And_Accessories/sparkle.png',{x,y,w:50});}
 else if(selectedTool==='flower'||selectedTool==='bow'){$('accessory').hidden=false;$('accessory').src=imageUrl(TOOLS[selectedTool][1]);effect('Wash_And_Accessories/heart.png',{x:500,y:70,w:60});}
 refresh();
 if(round.phase===7)message('המראה תואם לבקשה! אפשר ללחוץ על סיימנו.');
 else if(round.phase!==before)message(`נהדר! עכשיו ${PHASES[round.phase]}.`);
 else if(result.kind==='cut')message('קיצרנו שלב אחד. אפשר להמשיך לאזור הבא.');
 else message(`עוד ${3-round.strokes} תנועות עד לשלב הבא.`);
}
function toolPosition(x,y){$('tool').style.left=`${x-65}px`;$('tool').style.top=`${y-90}px`;$('tool').hidden=false;}
function pointer(event,down=false){
 if(!ready||round.claimed)return;
 const rect=$('stage').getBoundingClientRect(),x=(event.clientX-rect.left)/scale,y=(event.clientY-rect.top)/scale;
 toolPosition(x,y);
 if(!down&&!event.buttons)return;
 const now=performance.now();if(!down&&(now-lastStroke<150||!lastPoint||Math.hypot(x-lastPoint.x,y-lastPoint.y)<24))return;
 if(x<220||x>580||y<50||y>330){message('הכלי עובד באזור הראש והשיער.');return;}
 lastStroke=now;lastPoint={x,y};apply(x,y);
}
for(const [name,[label,src]]of Object.entries(TOOLS)){const button=document.createElement('button');button.type='button';button.dataset.tool=name;button.setAttribute('aria-label',label);const img=new Image();img.src=imageUrl(src);img.alt='';button.append(img,document.createTextNode(label));button.onclick=()=>{selectedTool=name;refresh();message(`בחרת ${label}. לחצי או גררי על הראש.`);};$('tools').append(button);}
for(const name of HAIR_PARTS){const button=document.createElement('button');button.type='button';button.textContent=LABELS[name];button.dataset.zone=name;button.onclick=()=>{selectedZone=name;refresh();};$('zones').append(button);}
function mountAssembly(definition){
 for(const part of definition.station){const img=document.querySelector(part.selector);Object.assign(img.style,{left:`${part.position[0]}px`,top:`${part.position[1]}px`,width:`${part.size[0]}px`,height:`${part.size[1]}px`,zIndex:part.layer});}
 $('head-rig').style.transformOrigin=definition.headPivot.map(v=>`${v}px`).join(' ');
 const hair=definition.hair,sx=hair.displaySize[0]/hair.sourceCanvas[0],sy=hair.displaySize[1]/hair.sourceCanvas[1];
 for(const part of hair.parts){const img=document.querySelector(`[data-hair="${part.id}"]`);Object.assign(img.style,{left:`${part.joint[0]-hair.anchor[0]*sx}px`,top:`${part.joint[1]-hair.anchor[1]*sy}px`,width:`${hair.displaySize[0]}px`,height:`${hair.displaySize[1]}px`,transformOrigin:`${hair.anchor[0]*sx}px ${hair.anchor[1]*sy}px`,zIndex:part.layer});}
 const scissors=definition.scissors;
 for(const part of scissors.parts){const node=document.querySelector(part.selector),img=node.querySelector('img');Object.assign(node.style,{left:`${scissors.joint[0]}px`,top:`${scissors.joint[1]}px`});Object.assign(img.style,{width:`${part.sourceSize[0]*scissors.scale}px`,height:`${part.sourceSize[1]*scissors.scale}px`,left:`${-part.anchor[0]*scissors.scale}px`,top:`${-part.anchor[1]*scissors.scale}px`});}
 const bolt=$('scissors').querySelector('.bolt');Object.assign(bolt.style,{left:`${scissors.joint[0]-scissors.bolt.size[0]/2}px`,top:`${scissors.joint[1]-scissors.bolt.size[1]/2}px`});
}
$('stage').addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;e.preventDefault();$('stage').focus({preventScroll:true});$('stage').setPointerCapture(e.pointerId);pointer(e,true);});
$('stage').addEventListener('pointermove',e=>pointer(e));$('stage').addEventListener('pointerleave',()=>{if(!lastPoint)$('tool').hidden=true;});$('stage').addEventListener('pointerup',()=>{lastPoint=null;$('tool').hidden=true;});$('stage').addEventListener('pointercancel',()=>{lastPoint=null;$('tool').hidden=true;});
$('stage').addEventListener('keydown',e=>{if((e.code==='Space'||e.key==='Enter')&&e.target===$('stage')){e.preventDefault();toolPosition(400,170);apply();}});
$('finish').onclick=()=>{const reward=round.claim();if(!reward)return;try{let state;try{state=JSON.parse(localStorage.getItem('popaWorldV1')||'{}');}catch{state={};}if(!state||typeof state!=='object'||Array.isArray(state))state={};state.coins=wallet()+reward;localStorage.setItem('popaWorldV1',JSON.stringify(state));message('הפרס נוסף לארנק שלך.');}catch{message('השמירה אינה זמינה בדפדפן הזה.');}refresh();$('result-text').textContent=`כל הכבוד! התספורת תואמת לבקשה. קיבלת ${reward} מטבעות${round.mistakes===0?' — כולל בונוס על דיוק!':''}.`;$('result').hidden=false;$('tool').hidden=true;$('next').focus();};
$('next').onclick=()=>{animations.forEach(a=>a.cancel());clearEffects();round=new SalonRound(++order);selectedTool='water';selectedZone='bangs';$('accessory').hidden=true;$('result').hidden=true;refresh();message('בקשה חדשה! מתחילים בהרטבה.');};
new ResizeObserver(()=>{scale=$('stage').clientWidth/800;$('scene').style.transform=`scale(${scale})`;$('stage').style.height=`${560*scale+12}px`;}).observe($('stage'));
try{const response=await fetch(new URL('../assets/salon-assembly.json',import.meta.url));if(!response.ok)throw new Error('Cannot load salon assembly');mountAssembly(await response.json());const files=new Set([...document.querySelectorAll('img[src]')].map(i=>i.src));for(const name of HAIR_PARTS)for(const length of LENGTHS)files.add(imageUrl(`Hair_Aligned/${name}_${length}.png`));for(const tool of Object.values(TOOLS))files.add(imageUrl(tool[1]));for(const file of ['water_spray','foam','bubbles','sparkle','heart'])files.add(imageUrl(`Wash_And_Accessories/${file}.png`));files.add(imageUrl('Tools/hair_clipping.png'));files.add(imageUrl('Tools/airflow.png'));await Promise.all([...files].map(async src=>{const i=new Image();i.src=src;await i.decode();}));ready=true;$('loading').hidden=true;refresh();message('נתחיל בהרטבה: בחרי מים ובצעי 3 תנועות על השיער.');}catch(error){$('loading').textContent='לא הצלחנו לטעון את חלקי הסלון. נסי לרענן.';console.error(error);}
