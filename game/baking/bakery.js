import {progressStore,readProfile} from '../progress/store.js?v=3';
import {createBakery} from './recipe.js';
import {createPopa} from '../../popa-browser.js';
import {createWardrobe} from '../wardrobe.js?v=uploaded-world7';
import {mountLayeredCharacter} from '../../shared/layered-character.js?v=momo-motion1';
import {mountMomoExpressions} from '../../shared/momo-expressions.js?v=larger-eyes2';
import {createMomoPlayer} from '../../shared/momo-motion.js?v=game1';
const actorScale=()=>innerHeight<520?.12:innerWidth<700?.17:.30;
const $=id=>document.getElementById(id),root=new URL('../../',import.meta.url),recipe=createBakery({store:progressStore});
let popa,wardrobe,momo,view,timer,unsubscribe,dragging=false;
const groups={garden:'10-strawberry-garden',ingredients:'07-baking-ingredients',oven:'08-oven-and-counter',pack:'09-cakes-and-packaging'};
let catalog;
const asset=key=>{const [g,id]=key.split(':');return new URL(catalog.groups.find(group=>group.id===groups[g]).parts.find(p=>p.id===id).asset,root).href;};
const guide={prep:'נעביר שלושה תותים מהסל לקערה',mixed:'הבלילה מוכנה! נכניס אותה לתנור',baking:'העוגה נאפית. מומו שומר עליה',baked:'העוגה מוכנה! נקשט אותה בתות',decorated:'איזו עוגה יפה! נכניס אותה לקופסה',packed:'העוגה הארוזה במלאי'};
function berries(container,count){container.replaceChildren();for(let i=0;i<Math.min(3,count);i++){const img=new Image();img.src=asset('ingredients:strawberry');img.alt='';container.append(img);}}
function render(){
 const b=recipe.snapshot(),usable=b.enabled;
 $('instruction').textContent=b.complete?guide.packed:!usable?'קודם נגדל ונקטוף שלושה תותים בגינה':b.stage==='prep'&&b.strawberries===3&&!Object.values(b.ingredients).every(Boolean)?'נוסיף קמח, ביצה וחלב מהמזווה':b.stage==='prep'&&b.strawberries===3?`נערבב עם המטרפה · ${b.mixes} מתוך 3`:b.stage==='baking'&&b.ready?'העוגה מוכנה! אפשר להוציא מהתנור':guide[b.stage];
 $('inventory').textContent=`בסל: ${b.inventory} תותים · ${b.stage==='prep'?'בקערה':'בעוגה'}: ${b.strawberries} מתוך 3 · עוגות במלאי: ${b.cakes}`;
 $('basket').disabled=!usable||b.stage!=='prep'||b.strawberries>=3||b.inventory<1;
 $('basket').draggable=!$('basket').disabled;
 $('basket').querySelector('.label').textContent=b.strawberries<3?'להעביר תות לקערה':b.stage==='prep'?'שלושת התותים בקערה':'הסל התרוקן';
 $('bowl').disabled=!usable||b.stage!=='prep'||b.strawberries<3&&b.inventory<1||b.strawberries===3&&!Object.values(b.ingredients).every(Boolean);
 $('bowl').querySelector('.label').textContent=b.stage==='prep'?(b.strawberries<3?`לקערה · ${b.strawberries}/3`:`ערבוב · ${b.mixes}/3`):'הבלילה מוכנה';
 $('oven').disabled=!usable||!(b.stage==='mixed'||b.stage==='baking'&&b.ready);
 $('oven').querySelector('.label').textContent=b.stage==='baking'?b.ready?'להוציא את העוגה':`נאפה עוד ${b.seconds} שניות`:'להכניס לתנור';
 $('finish').disabled=!usable||!['baked','decorated'].includes(b.stage);
 $('finish').querySelector('.label').textContent=b.stage==='decorated'?'לארוז את העוגה':b.complete?'העוגה במלאי':'לקשט בתות';
 $('batter').hidden=b.strawberries!==3||['baked','decorated','packed'].includes(b.stage);
 $('whisk').hidden=!['prep','mixed'].includes(b.stage);
 $('oven-cake').hidden=b.stage!=='baking';$('oven-door').hidden=b.stage!=='baking';
 $('plate').hidden=b.complete;$('cake').hidden=!['baked','decorated'].includes(b.stage);$('icing').hidden=b.stage!=='decorated';$('topping').hidden=$('icing').hidden;$('box').hidden=b.stage!=='packed';$('ribbon').hidden=$('box').hidden;
 berries($('basket-berries'),b.inventory);berries($('bowl-berries'),b.stage==='prep'?b.strawberries:0);
 $('hint').textContent=b.complete?'הצעד הבא הוא למסור את העוגה למומו. אפשר לחזור הביתה עם העוגה שבמלאי.':'אפשר ללחוץ על הסל או לגרור אותו אל הקערה. התותים שבקערה נשמרים גם ברענון.';
 for(const [id,name]of [['flour','קמח'],['egg','ביצה'],['milk','חלב']]){$(id).disabled=!usable||b.stage!=='prep'||b.ingredients[id];$(id).querySelector('span').textContent=(b.ingredients[id]?'נוסף: ':'להוסיף ')+name;}
 document.body.dataset.stage=b.stage;
}
function act(action){try{const result=recipe.act(action);$('saved').textContent=result.persisted?'ההתקדמות נשמרה':'השמירה אינה זמינה — ההתקדמות כרגע זמנית';render();momo.play(['decorate','pack','take'].includes(action)?'happy':'curious',{next:'idle'});popa.play(action==='mix'?'happy':'interact');if(action==='mix'&&!matchMedia('(prefers-reduced-motion:reduce)').matches)$('whisk').animate([{rotate:'-15deg'},{rotate:'20deg'},{rotate:'-15deg'}],{duration:500});}catch(error){$('saved').textContent=error.message;render();}}
for(const id of ['flour','egg','milk'])$(id).onclick=()=>act(id);
$('basket').onclick=()=>{if(!dragging)act('berry');};$('bowl').onclick=()=>act(recipe.snapshot().strawberries<3?'berry':'mix');$('oven').onclick=()=>act(recipe.snapshot().stage==='mixed'?'bake':'take');$('finish').onclick=()=>act(recipe.snapshot().stage==='baked'?'decorate':'pack');
$('basket').ondragstart=e=>{if($('basket').disabled){e.preventDefault();return;}dragging=true;e.dataTransfer.setData('application/x-popa-berry','1');e.dataTransfer.effectAllowed='move';};$('basket').ondragend=()=>{dragging=false;$('bowl').classList.remove('drop-target');};
// The bowl receives drops even while its mix button is disabled during ingredient transfer.
const drop=$('bowl').parentElement;drop.ondragover=e=>{if(e.dataTransfer.types.includes('application/x-popa-berry')){e.preventDefault();$('bowl').classList.add('drop-target');}};drop.ondragleave=()=> $('bowl').classList.remove('drop-target');drop.ondrop=e=>{e.preventDefault();$('bowl').classList.remove('drop-target');const rect=$('bowl').getBoundingClientRect();if(e.dataTransfer.getData('application/x-popa-berry')==='1'&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom)act('berry');dragging=false;};
for(const button of document.querySelectorAll('#stations button,.pantry button'))button.disabled=true;
try{
 const response=await fetch(new URL('assets/world/catalog.json',root));if(!response.ok)throw Error('לא ניתן לטעון את איורי המטבח');catalog=await response.json();
 await Promise.all([...document.querySelectorAll('[data-art]')].map(async img=>{img.src=asset(img.dataset.art);await img.decode();}));
 popa=await createPopa($('popa'),{scale:actorScale(),autoplay:'idle'});wardrobe=await createWardrobe(popa);const look=readProfile().outfit;if(wardrobe.looks.includes(look))await wardrobe.wear(look);
 const review=await (await fetch(new URL('assets/characters/momo/animations/review.json',root))).json();
 view=await mountLayeredCharacter($('momo'),{assemblyUrl:new URL('assets/characters/momo/assembly.json',root),expectedId:'momo',motionRig:true,headFollowers:review.headFollowers});
 const face=await mountMomoExpressions({images:new Map([...view.nodes].map(([id,n])=>[id,n.img])),groups:new Map([...view.nodes].map(([id,n])=>[id,n.group])),getScaleY:id=>momo?.poses[id]?.scaleY??1});
 const clips=await (await fetch(new URL('assets/characters/momo/animations/approved.json',root))).json();momo=createMomoPlayer(view,{clips,face});momo.play('wave',{next:'idle'});momo.setVisible(true);
 unsubscribe=progressStore.subscribe(render);window.addEventListener('storage',render);render();timer=setInterval(render,500);document.body.dataset.ready='true';
 window.addEventListener('resize',()=>popa.setScale(actorScale()));
}catch(error){$('instruction').textContent='לא הצלחנו לטעון את המטבח. נסי לרענן.';console.error(error);}
window.addEventListener('pagehide',event=>{if(event.persisted)return;clearInterval(timer);unsubscribe?.();window.removeEventListener('storage',render);momo?.destroy();view?.destroy();wardrobe?.destroy();popa?.destroy();});
