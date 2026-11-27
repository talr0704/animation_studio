import {progressStore,readProfile,actionId} from '../progress/store.js?v=3';
import {createPopa} from '../../popa-browser.js';
import {createWardrobe} from '../wardrobe.js?v=world-art10';
const $=id=>document.getElementById(id),root=new URL('../../',import.meta.url);
const locations={shops:'הרחוב והחנויות',bakery:'מטבח האפייה',tailor:'סטודיו התפירה',wardrobe:'בגדים חדשים',post:'בית הדואר', 'home-care':'טיפול בבית',party:'מסיבת תותים',achievements:'תגים ומטבעות',garden:'כלי הגינה'};
const names={'bed-frame':'ערוגה','watering-can':'משפך','strawberry':'תות','bowl':'קערה','whisk':'מטרפה','oven':'תנור','flour-bag':'קמח','egg':'ביצה','milk':'חלב','milk-jug':'כד חלב','fridge':'מקרר','door':'דלת','sponge':'בסיס עוגה','icing':'ציפוי','bakery-front':'מאפייה','tailor-front':'חנות תפירה','seed-bag':'זרעי תות','basket':'סל','apple':'תפוח','piping-bag':'שק זילוף','counter-frame':'ארונית מטבח','counter-top':'משטח עבודה','plant-grown':'שתיל תות','leaf':'עלה','flower':'פרח'};
let catalog,scene='shops',group,page=0,objects=[],selected=null,editing=false,popa,wardrobe;
const groups=()=>catalog.groups.filter(g=>g.scene===scene);
const asset=(group,id)=>catalog.groups.find(g=>g.id===group)?.parts.find(p=>p.id===id);
const key=()=>`popa.world-scene.${scene}.v1`;
function message(text){$('status').textContent=text;}
function save(){try{localStorage.setItem(key(),JSON.stringify(objects));message('סידור הסצנה נשמר בדפדפן הזה.');}catch{message('השמירה אינה זמינה — הסידור בביקור הזה זמני.');}}
function add(part,{x=50,y=48,width=180}={}){if(objects.length>=60){message('אפשר להציב עד 60 פריטים בסצנה.');return;}objects.push({id:crypto.randomUUID(),asset:part.asset,x,y,width,rotation:0,layer:objects.length+1});selected=objects.at(-1).id;render();save();}
function initial(){
 objects=[];const insert=(g,id,x,y,width)=>{const p=asset(g,id);if(p)objects.push({id:crypto.randomUUID(),asset:p.asset,x,y,width,rotation:0,layer:objects.length+1});};
 if(scene==='shops'){insert('17-storefronts','bakery-front',30,44,470);insert('17-storefronts','tailor-front',73,44,470);insert('17-storefronts','bench',52,80,250);}
 if(scene==='bakery'){insert('08-oven-and-counter','counter-frame',62,68,500);insert('08-oven-and-counter','counter-top',62,42,500);insert('08-oven-and-counter','oven',26,55,330);insert('07-baking-ingredients','bowl',57,33,180);insert('07-baking-ingredients','whisk',66,30,130);insert('fridge','fridge',88,48,230);}
 if(scene==='tailor'){for(const [i,p]of groups()[0].parts.slice(0,5).entries())insert(groups()[0].id,p.id,20+i*16,50,i===0?300:170);}
 if(scene==='garden'){insert('10-strawberry-garden','bed-frame',50,67,600);insert('10-strawberry-garden','plant-grown',50,45,200);insert('10-strawberry-garden','watering-can',75,65,170);insert('10-strawberry-garden','basket',25,75,180);}
 if(!objects.length){for(const [i,p]of groups()[0].parts.slice(0,6).entries())insert(groups()[0].id,p.id,18+i%3*30,28+Math.floor(i/3)*42,i===0?280:180);}
}
function render(){
 $('objects').replaceChildren();const rect=$('stage').getBoundingClientRect(),scale=Math.min(rect.width/1400,rect.height/750),left=(rect.width-1400*scale)/2,top=(rect.height-750*scale)/2;
 for(const item of objects){const part=catalog.groups.flatMap(g=>g.parts).find(p=>p.asset===item.asset);if(!part)continue;
 const button=document.createElement('button');button.type='button';button.dataset.object=item.id;button.setAttribute('aria-label',names[part.id]??'פריט מאויר');button.setAttribute('aria-pressed',String(editing&&selected===item.id));
 Object.assign(button.style,{left:(left+item.x/100*1400*scale)+'px',top:(top+item.y/100*750*scale)+'px',width:item.width*scale+'px',height:item.width*scale*part.size[1]/part.size[0]+'px',zIndex:item.layer,transform:`translate(-50%,-50%) rotate(${item.rotation}deg)`});
 const img=new Image();img.src=new URL(item.asset,root);img.alt='';button.append(img);
 button.onclick=()=>{selected=item.id;if(editing){inspect();for(const b of $('objects').children)b.setAttribute('aria-pressed',String(b===button));}else if(scene==='shops'&&['bakery-front','tailor-front'].includes(part.id))part.id==='bakery-front'?location.assign('bakery.html'):navigate('tailor');else{popa.play('curious');button.animate([{filter:'brightness(1)'},{filter:'brightness(1.12)'},{filter:'brightness(1)'}],{duration:350});message(names[part.id]??'בחרת פריט מהאיורים שהעלית. אפשר לסדר אותו במצב סידור הפריטים.');}};
 button.onpointerdown=e=>{if(!editing)return;selected=item.id;inspect();const start={x:e.clientX,y:e.clientY,ix:item.x,iy:item.y};button.setPointerCapture(e.pointerId);button.onpointermove=e=>{item.x=Math.max(2,Math.min(98,start.ix+(e.clientX-start.x)/(1400*scale)*100));item.y=Math.max(3,Math.min(95,start.iy+(e.clientY-start.y)/(750*scale)*100));button.style.left=(left+item.x/100*1400*scale)+'px';button.style.top=(top+item.y/100*750*scale)+'px';};button.onpointerup=()=>{button.onpointermove=null;save();};};
 $('objects').append(button);
 }
 inspect();
}
function inspect(){const item=objects.find(o=>o.id===selected);$('inspector').hidden=!editing||!item;if(item){$('size').value=item.width;$('rotation').value=item.rotation;}}
function shelf(){
 const options=groups();if(!options.some(g=>g.id===group))group=options[0].id;
 $('groups').replaceChildren(...options.map(g=>new Option(g.title,g.id)));$('groups').value=group;
 const parts=options.find(g=>g.id===group).parts,pages=Math.ceil(parts.length/10);page=Math.min(page,pages-1);$('page').textContent=`${page+1} / ${pages}`;$('previous').disabled=page===0;$('next').disabled=page===pages-1;$('items').replaceChildren();
 for(const part of parts.slice(page*10,page*10+10)){const b=document.createElement('button'),img=new Image();b.type='button';img.src=new URL(part.asset,root);img.alt='';b.append(img,document.createTextNode(names[part.id]??`פריט ${parts.indexOf(part)+1}`));b.onclick=()=>{add(part);message('הפריט נוסף לסצנה. אפשר להזיז ולשנות גודל במצב סידור.');};$('items').append(b);}
 $('fitting').hidden=scene!=='wardrobe';
 if(scene==='wardrobe'){for(const look of wardrobe.entries.filter(l=>l.id.startsWith('uploaded-'))){const b=document.createElement('button');b.textContent='למדוד: '+look.label;b.onclick=async()=>{try{await wardrobe.wear(look.id);const result=progressStore.updateProfile(actionId('outfit'),state=>{state.outfit=look.id;});message(result.persisted?'הלבוש נשמר גם במשחק. אפשר להתאים אותו בסטודיו הבגדים.':'הלבוש מוצג כרגע. השמירה אינה זמינה בביקור הזה.');}catch{message('לא הצלחנו להציג את הלבוש.');}};$('items').prepend(b);}}
}
function navigate(id){if(!Object.hasOwn(locations,id))id='shops';scene=id;$('stage').dataset.scene=id;group=null;page=0;selected=null;$('title').textContent=locations[id];history.replaceState(null,'','?scene='+id);for(const b of $('locations').children)b.setAttribute('aria-current',String(b.dataset.scene===id));
 let hasSaved=false;try{const saved=JSON.parse(localStorage.getItem(key()));hasSaved=Array.isArray(saved);objects=hasSaved?saved.filter(o=>catalog.groups.some(g=>g.parts.some(p=>p.asset===o.asset))&&['x','y','width','rotation','layer'].every(k=>Number.isFinite(o[k]))&&o.width>=40&&o.width<=650&&o.x>=0&&o.x<=100&&o.y>=0&&o.y<=100).slice(0,60):[];}catch{objects=[];}
 if(!hasSaved)initial();render();shelf();message(scene==='garden'?'כלי הגינה שלך. לגידול התותים במשימה חזרי הביתה ולחצי לגינה.':'בחרי אביזר מהמדף כדי לשלב אותו בסצנה. סידור נשמר בדפדפן.');}
$('groups').onchange=()=>{group=$('groups').value;page=0;shelf();};$('previous').onclick=()=>{page--;shelf();};$('next').onclick=()=>{page++;shelf();};$('arrange').onclick=()=>{editing=!editing;$('arrange').setAttribute('aria-pressed',String(editing));render();};
for(const [id,field]of [['size','width'],['rotation','rotation']])$(id).oninput=()=>{const item=objects.find(o=>o.id===selected);if(item){item[field]=Number($(id).value);render();save();}};
$('front').onclick=()=>{const item=objects.find(o=>o.id===selected);if(item){item.layer=Math.max(...objects.map(o=>o.layer))+1;render();save();}};$('remove').onclick=()=>{objects=objects.filter(o=>o.id!==selected);selected=null;render();save();};$('reset').onclick=()=>{initial();render();save();};
try{const response=await fetch(new URL('assets/world/catalog.json',root));if(!response.ok)throw Error('catalog');catalog=await response.json();popa=await createPopa($('popa'),{scale:innerHeight<520?.17:.32,autoplay:'idle'});wardrobe=await createWardrobe(popa);const worn=readProfile().outfit;if(wardrobe.looks.includes(worn))await wardrobe.wear(worn);
 for(const [id,label]of Object.entries(locations)){const b=document.createElement('button');b.type='button';b.dataset.scene=id;b.textContent=label;b.onclick=()=>navigate(id);$('locations').append(b);}navigate(new URLSearchParams(location.search).get('scene')??'shops');window.addEventListener('resize',()=>{popa.setScale(innerHeight<520?.17:.32);render();});
}catch(error){message('לא הצלחנו לטעון את הסצנה. נסי לרענן.');console.error(error);}
window.addEventListener('pagehide',event=>{if(event.persisted)return;wardrobe?.destroy();popa?.destroy();});
