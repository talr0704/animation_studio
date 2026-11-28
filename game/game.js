import {gardenGeometry} from './farming/layout.js';
import {mountStrawberryGarden} from './farming/garden.js?v=watering5';
import {mountFirstMeeting} from './story/first-meeting.js?v=bake-momo4';
import {progressStore, readProfile, actionId} from './progress/store.js?v=3';
import {roomBaseScale} from './room-scale.js';
import {loadPropAppearance} from '../shared/prop-appearance.js?v=2';
import { startFurnitureSession } from './furniture-session.js?v=2';
import { validateFurnitureInteraction } from '../shared/furniture-interaction.js?v=2';
import { FLOOR_START, FLOOR_ITEMS, floorBounds, nearestFree, walkable, roomPath, slideStep, constrainFloorFurniture } from './room-navigation.js';
import { createWardrobe } from './wardrobe.js?v=uploaded-world7';
import { mountRoomEditor } from './room-editor.js?v=published-room2';
import {mountProp} from '../shared/prop-rig.js?v=closed-fit5';
import { createPopa } from '../popa-browser.js';
import { POPA_CLIPS } from '../popa-clips.js';
import { GardenRound } from './garden-round.js';
const $ = id => document.getElementById(id);
const initialProgress=progressStore.initialize();if(!initialProgress.persisted)$('save-status').textContent='שמירה אינה זמינה — ההתקדמות בביקור הזה זמנית';
let profile = readProfile();
let roundProgressId;
let pendingItem=null,interactionTimer=null,activeItem=null;
const fruitImages = new Map();
let roomFurniture, roomEditor, wardrobe, story, farm;
let roomEditing=false, roomRoute=[], furnitureSession=null, sofaAction, sofaRig;
function placeRoomFurniture(){if(!roomFurniture)return;const layout=roomFurniture[window.innerWidth<=700?'portrait':'wide'];constrainFloorFurniture(layout);const [w,h]=layout.canvas;const place=(el,r)=>Object.assign(el.style,{left:r[0]/w*100+'%',top:r[1]/h*100+'%',width:r[2]/w*100+'%',height:r[3]/h*100+'%'});for(const [id,rect]of Object.entries(layout.items)){const button=document.querySelector(`[data-furniture="${id}"]`);if(!button)continue;place(button,rect);const rig=button.querySelector('.item-rig');if(rig){const [rw,rh]=JSON.parse(rig.dataset.canvas),scale=Math.min(button.clientWidth/rw,button.clientHeight/rh);Object.assign(rig.style,{width:rw+'px',height:rh+'px',left:(button.clientWidth-rw*scale)/2+'px',top:(button.clientHeight-rh*scale)+'px',transform:`scale(${scale})`});}}place($('buy-rug'),layout.rug);}
function cancelInteraction(){if(furnitureSession){const old=furnitureSession;furnitureSession=null;old.dispose();}roomRoute=[];clearTimeout(interactionTimer);pendingItem=null;activeItem=null;$('player').removeAttribute('data-interaction');popa?.clearItem();for(const b of document.querySelectorAll('.room-item'))b.setAttribute('aria-pressed','false');}
async function approachItem(item,element){
 if(furnitureSession){const same=item.id==='sofa';await leaveFurniture();if(same)return;}
 if(!popa||view!=='room'||roomEditing||story?.isOpen)return;cancelInteraction();keys.clear();
 const geometry=roomGeometry(),box=roomBox(element);
 const footprint=geometry.obstacles.find(r=>r.id===item.id);
 let destination={x:box.left+box.width/2,y:footprint?footprint.bottom+9:Math.max(geometry.bounds.top,box.bottom+12)};
 if(item.npc==='milli'&&element.classList.contains('story-npc-assembled'))destination.x=box.left-Math.min(110,box.width*.55);
 if(item.id==='sofa'&&sofaAction){const rig=element.querySelector('.item-rig'),r=rig.getBoundingClientRect(),world=document.querySelector('.world').getBoundingClientRect();destination={x:r.left-world.left+sofaAction.approach[0]*r.width/420,y:r.top-world.top+sofaAction.approach[1]*r.height/320};}
 pendingItem=item;element.setAttribute('aria-pressed','true');
 if(!queueRoomPath(destination,geometry)){cancelInteraction();toast('הדרך לפריט חסומה. אפשר לפנות מקום בסידור החדר.');return;}
 toast(`פופה בדרך אל ${item.label}`);
}
function arrive(){const item=pendingItem;if(!item)return;pendingItem=null;activeItem=item.id;$('player').dataset.interaction=item.id;
 if(item.npc==='milli'){cancelInteraction();faceRoom(1);cue('wave');story.beginConversation();return;}
 if(item.id==='sofa'&&sofaAction){sitOnSofa();return;}
 if(item.id==='rug'){
  profile=readProfile();if(!profile.rug){if(profile.coins<12){toast('השטיח החדש עולה 12 מטבעות');cancelInteraction();cue('idle');return;}
   acceptProgress(progressStore.updateProfile('purchase:rug',state=>{if(state.rug)return;if(state.coins<12)throw Error('Not enough coins');state.coins-=12;state.rug=true;}));refreshProfile();}
 }

 cue(item.action);toast(item.message);const element=document.querySelector(`[data-furniture="${item.id}"]`);if(element)element.animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:400});
 interactionTimer=setTimeout(()=>{if(activeItem!==item.id)return;cancelInteraction();if(item.page){location.href=item.page;return;}cue('idle');if(item.id==='wardrobe')openWardrobe();},POPA_CLIPS[item.action].duration);
}

let popa, view = 'room', phase = 'intro', round, roomX = .52, target = .52;
let roomDepth=0,targetDepth=0,roomFacing=1;
let width = 1, height = 1, last = performance.now(), particles = [], toastTimer, audio, sound = false;
const keys = new Set();
const canvas = $('canvas'), ctx = canvas.getContext('2d');
function acceptProgress(result){profile=readProfile();if(!result.persisted)$('save-status').textContent='שמירה אינה זמינה בדפדפן הזה';}

function refreshProfile() {
  $('coins').textContent = profile.coins;
  $('rug').classList.toggle('upgraded', profile.rug);
  $('rug').src = roomFurniture?.rugImage??'assets/scenes/home/furniture/coastal/rug/images/rug.png';
  $('buy-rug').disabled = false;
  $('rug-price').textContent = profile.rug ? 'ריקוד על השטיח' : 'שטיח חדש · 12 ✦';
  $('record').textContent = profile.rounds ? `שיא הגינה שלך: ${profile.best} נקודות · ${profile.rounds} הרפתקאות` : 'כל הרפתקה מתחילה בצעד קטן.';
}
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2400); }
function cue(name) { if (popa && popa.action !== name) popa.play(name); }
function beep(hurt = false) {
  if (!sound || !audio) return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(hurt ? 190 : 660, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(hurt ? 90 : 990, audio.currentTime + .12);
  gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);
  oscillator.start();oscillator.stop(audio.currentTime+.16);
}
function closeDialog() { $('overlay').hidden = true; }
function dialog({label='משחקים עם פופה',title,text,main,action,secondary='חזרה הביתה',secondaryAction=home,results}) {
  $('overlay').hidden = false;
  $('dialog-label').textContent=label; $('dialog-title').textContent=title; $('dialog-text').textContent=text;
  $('dialog-main').textContent=main; $('dialog-main').onclick=action;
  $('dialog-secondary').textContent=secondary; $('dialog-secondary').onclick=secondaryAction;
  $('results').hidden=!results;
  $('results').replaceChildren();
  if(results)for(const [number,label] of results){const span=document.createElement('span'),b=document.createElement('b');b.textContent=number;span.append(b,document.createTextNode(label));$('results').append(span);}
  $('dialog-main').focus({preventScroll:true});
}
function faceRoom(direction){roomFacing=direction<0?-1:1;$('player').dataset.facing=roomFacing<0?'left':'right';$('player').style.setProperty('--facing',roomFacing);}
function roomBounds(){const half=($('player').firstElementChild?.offsetWidth??100)/width/2;return Math.min(.46,half+8/width);}
function roomBase(){return roomBaseScale(width,height,roomFurniture[innerWidth<=700?'portrait':'wide']);}
function roomScale(){return roomBase()*(1-roomDepth*.65);}
function sofaScene(){return document.querySelector('[data-furniture="sofa"] .item-rig');}
function localSofaPoint(point){const rect=sofaScene().getBoundingClientRect(),world=document.querySelector('.world').getBoundingClientRect();return {x:(point.x+world.left-rect.left)/(rect.width/420),y:(point.y+world.top-rect.top)/(rect.height/320)};}
function standingPlacement(){
 const scene=sofaScene(),rect=scene.getBoundingClientRect(),world=document.querySelector('.world').getBoundingClientRect(),geometry=roomGeometry();
 const desired={x:rect.left-world.left+sofaAction.approach[0]*rect.width/420,y:rect.top-world.top+sofaAction.approach[1]*rect.height/320};
 const free=nearestFree(desired,geometry.bounds,geometry.obstacles)??feetPosition(),local=localSofaPoint(free),base=roomBase(),depth=Math.max(0,(height-30-24*base-free.y)/(height-15.6*base));
 return {...local,scale:base*(1-depth*.65)/(rect.width/420),facing:sofaAction.phases.exit.keys.at(-1).placement.facing};
}
function sitOnSofa(){
 const scene=sofaScene();if(!scene)return;keys.clear();roomRoute=[];const point=localSofaPoint(feetPosition()),scale=roomScale()/(scene.getBoundingClientRect().width/420);
 furnitureSession=startFurnitureSession({popa,scene,rig:sofaRig,data:sofaAction,startPlacement:{...point,scale,facing:sofaAction.phases.enter.keys[0].placement.facing},onFinish(placement){
  furnitureSession=null;const rect=scene.getBoundingClientRect(),world=document.querySelector('.world').getBoundingClientRect();setFeet({x:rect.left-world.left+placement.x*rect.width/420,y:rect.top-world.top+placement.y*rect.height/320});repairRoomPosition();activeItem=null;$('player').removeAttribute('data-interaction');cue('idle');
 }});toast('פופה יושבת על הספה · בחרי רצפה כדי לקום');
}
function leaveFurniture(){return furnitureSession?.leave(standingPlacement())??Promise.resolve();}
function roomBox(element){return {left:element.offsetLeft,top:element.offsetTop,width:element.offsetWidth,height:element.offsetHeight,bottom:element.offsetTop+element.offsetHeight};}
function roomGeometry(){
 const bounds=floorBounds(width,height,Math.max(12,roomBounds()*width-8)),radius=32*roomScale();
 const obstacles=[];
 for(const id of FLOOR_ITEMS){const element=document.querySelector(`[data-furniture="${id}"]`);if(!element)continue;const b=roomBox(element);obstacles.push({id,left:b.left+b.width*.12-radius,right:b.left+b.width*.88+radius,top:b.top+b.height*.82-5,bottom:b.bottom-b.height*.02+5});}
 return {bounds,obstacles};
}
function feetPosition(){return {x:roomX*width,y:height-30-roomDepth*height-24*roomScale()};}
function setFeet(point){const base=roomBase();roomX=point.x/width;roomDepth=Math.max(0,(height-30-24*base-point.y)/(height-15.6*base));popa.setScale(roomScale());target=roomX;targetDepth=roomDepth;positionPlayer(roomX);}
function repairRoomPosition(geometry=roomGeometry()){
 const point=feetPosition();if(walkable(point,geometry.bounds,geometry.obstacles))return;
 const safe=nearestFree(point,geometry.bounds,geometry.obstacles);if(safe){setFeet(safe);roomRoute=[];}
}
function queueRoomPath(destination,geometry=roomGeometry()){
 repairRoomPosition(geometry);roomRoute=roomPath(feetPosition(),destination,geometry.bounds,geometry.obstacles);return roomRoute.length>0;
}
function orderRoomDepth(){
 if(view!=='room'||roomEditing)return;
 const depths=[];
 for(const id of FLOOR_ITEMS){const element=document.querySelector(`[data-furniture="${id}"]`);if(!element)continue;const b=roomBox(element),z=100+Math.round(b.bottom/height*1000);element.style.zIndex=z;depths.push({b,z});}
 const lamp=document.querySelector('[data-furniture="floor-lamp"]');if(lamp){const b=roomBox(lamp),support=depths.sort((a,c)=>(Math.abs(a.b.left+a.b.width/2-b.left-b.width/2)+Math.abs(a.b.top-b.bottom)*.2)-(Math.abs(c.b.left+c.b.width/2-b.left-b.width/2)+Math.abs(c.b.top-b.bottom)*.2))[0];lamp.style.zIndex=(support?.z??100)+1;}
 $('player').style.zIndex=100+Math.round(feetPosition().y/height*1000);
}
function positionPlayer(x) {
  $('player').style.left = `${x*100}%`;
  $('player').style.bottom = view==='room' ? `${30+roomDepth*height}px` : `${height*.16-40}px`;
  orderRoomDepth();
  $('basket').style.left=`${x*100}%`;
  $('basket').style.top=`${height*.84-21}px`;
}
function positionFarmer(x=null){
 const focus=Number(document.querySelector('.world').dataset.farmPlot??0);
 const {scale,left,top,sceneWidth,sceneHeight,portrait}=gardenGeometry(width,height,focus);
 const size=portrait?.28:height<520?.17:Math.min(.46,.38*scale+.08);popa.setScale(size);
 x=portrait?[310,832,1350][focus]/1672-.10:height<520?[310,832,1350][focus]/1672-.13:x??[.15,.48,.78][focus];
 const edge=Math.min(.45,(440*size/2+8)/width);
 positionPlayer(Math.max(edge,Math.min(1-edge,(left+x*sceneWidth)/width)));
 const feet=portrait?height-155:height<520?height-50:Math.min(height-80,top+sceneHeight*.89);
 $('player').style.bottom=(height-feet)+'px';
}

let farmerMove=null,farmerHolding=false;
function moveFarmer(x,endAction=null){
 const element=$('player'),from={left:getComputedStyle(element).left,bottom:getComputedStyle(element).bottom};
 farmerMove?.cancel();positionFarmer(x);
 const to={left:getComputedStyle(element).left,bottom:getComputedStyle(element).bottom};
 const distance=Math.abs(parseFloat(to.left)-parseFloat(from.left));
 if(distance<6||matchMedia('(prefers-reduced-motion:reduce)').matches){cue(endAction??(farmerHolding?'hold':'idle'));return;}
 faceRoom(parseFloat(to.left)>=parseFloat(from.left)?1:-1);cue('walk');
 const animation=element.animate([from,to],{duration:Math.min(650,Math.max(260,distance*2)),easing:'ease-out'});farmerMove=animation;
 animation.finished.then(()=>{if(farmerMove===animation){farmerMove=null;if(view==='garden')cue(endAction??(farmerHolding?'hold':'idle'));}}).catch(()=>{});
}
function placeMomo(){
 if(!roomFurniture)return;const world=document.querySelector('.world');
 world.style.setProperty('--momo-width',Math.max(76,440*roomBase()*.90)+'px');
 world.style.setProperty('--momo-bottom',Math.max(80,height*.18)+'px');
}
function home() {
  farmerMove?.cancel();farmerMove=null;farmerHolding=false;placeMomo();
  story?.setVisible(true);
  if (view==='garden' && phase==='playing') { pause(); return; }
  farm?.setVisible(false);document.querySelector('.world').dataset.farming='false';
  document.querySelector('.world').dataset.view='room';view='room';cancelInteraction();phase='intro';target=roomX;targetDepth=roomDepth;faceRoom(roomFacing);round=undefined;particles=[];keys.clear();closeDialog();
  $('room').hidden=false;$('orchard').hidden=true;$('basket').hidden=true;
  $('home-tab').setAttribute('aria-selected','true');$('garden-tab').setAttribute('aria-selected','false');
  $('heading').textContent='ברוכה הבאה הביתה';$('subtitle').textContent='לחצי על הרצפה כדי לטייל עם פופה, או צאי להרפתקה בגינה.';
  $('activity-title').textContent='מה צומח בגינה?';$('activity-text').textContent='45 שניות של פירות, כוכבי זהב ורצפים. כמה תוכלי לתפוס?';$('activity-button').textContent='לגינה ←';
  popa.setScale(roomScale());repairRoomPosition();cue('idle');positionPlayer(roomX);
}
function garden(fruitGame=false) {farmerMove?.cancel();farmerMove=null;farmerHolding=false;story?.setVisible(false);if(furnitureSession){leaveFurniture().then(()=>garden(fruitGame));return;}closeWardrobe();roomEditor?.close();
  if(view==='garden'&&phase==='playing')return;
  document.querySelector('.world').dataset.view='garden';view='garden';cancelInteraction();phase='intro';round=undefined;keys.clear();particles=[];
  $('player').style.zIndex='4';$('room').hidden=true;$('orchard').hidden=false;$('basket').hidden=true;$('orchard').classList.remove('playing');
  $('home-tab').setAttribute('aria-selected','false');$('garden-tab').setAttribute('aria-selected','true');
  $('heading').textContent='גינת ההפתעות';$('subtitle').textContent='פירות קטנים, רצפים גדולים. הסל של פופה מחכה לך.';
  $('activity-title').textContent='עוד תפיסה אחת…';$('activity-text').textContent='כל 5 תפיסות ברצף מגדילות את הניקוד. כוכבי זהב שווים יותר!';$('activity-button').textContent='הביתה ←';
  $('player').style.setProperty('--facing',1);$('player').dataset.facing='right';popa.setScale(.29);cue('curious');positionPlayer(.5);hud();
  const quest=progressStore.read().story.firstCake;
  const farming=!fruitGame&&quest.status!=='not-started'&&quest.step!=='meet-milli';
  document.querySelector('.world').dataset.farming=String(farming);farm?.setVisible(farming);
  if(farming){closeDialog();cue('idle');positionFarmer();return;}
  $('orchard').querySelector('.scene-backdrop').style.objectPosition='center';
  dialog({title:'מה נופל מהעצים?',text:'הזיזי את פופה ותפסי פירות בסל.\nכוכב זהב = בונוס. טיפות כחולות = לא לסל!\nבמחשב: עכבר או חצים. בנייד: גרירה על הגינה.',main:'בואי נשחק!',action:start});
}
function start() {
  round=new GardenRound();roundProgressId=actionId('garden');phase='playing';target=.5;particles=[];keys.clear();last=performance.now();
  closeDialog();$('basket').hidden=false;$('orchard').classList.add('playing');positionPlayer(.5);cue('hold');hud();
}
function pause() {
  if(phase!=='playing')return;
  phase='paused';keys.clear();$('orchard').classList.remove('playing');cue('idle');
  dialog({title:'רגע לנשום',text:'הגינה מחכה לך. הזמן והפירות נעצרו.',main:'ממשיכות לשחק',action:()=>{phase='playing';last=performance.now();closeDialog();$('orchard').classList.add('playing');cue('hold');},secondary:'סיום וחזרה הביתה',secondaryAction:()=>{phase='intro';home();}});
}
function finish() {
  if(phase!=='playing')return;
  phase='results';keys.clear();$('orchard').classList.remove('playing');$('basket').hidden=true;
  acceptProgress(progressStore.updateProfile(roundProgressId,state=>{state.coins+=round.reward;state.best=Math.max(state.best,round.score);state.rounds++;}));refreshProfile();cue('happy');
  dialog({label:round.lives>0?'איזו הרפתקה!':'הגשם הפתיע אותנו',title:round.score>0?'הסל מלא בהפתעות':'עוד סיבוב קטן?',text:round.bestCombo>=5?'איזה רצף! קיבלת גם בונוס של 3 מטבעות.':'אפשר תמיד לנסות שוב. רצף של 5 תפיסות פותח מכפיל ניקוד.',main:'עוד סיבוב',action:start,results:[[round.score,'נקודות'],[`+${round.reward}`,'מטבעות'],[round.bestCombo,'ברצף']]});
}
function hud() {
  $('score').textContent=round?.score??0;$('timer').textContent=Math.ceil(round?.remaining??45);
  const lives=round?.lives??3;$('lives').textContent='♥ '.repeat(lives)+'♡ '.repeat(3-lives);$('lives').setAttribute('aria-label',`${lives} לבבות`);
  const combo=round?.combo??0;$('combo').textContent=combo>=5?`${combo} ברצף! ×${Math.min(3,1+Math.floor(combo/5))} נקודות`:'תופסים פירות. בונים רצפים.';
}
function resize(){placeRoomFurniture();const world=document.querySelector('.world');width=world.clientWidth;height=world.clientHeight;placeMomo();const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);if(popa&&!furnitureSession){if(view==='room'){popa.setScale(roomScale());roomRoute=[];repairRoomPosition();}if(document.querySelector('.world').dataset.farming==='true'){farmerMove?.cancel();farmerMove=null;positionFarmer();}else positionPlayer(view==='room'?roomX:round?.player??.5);}}
function fruit(object){
  const image=fruitImages.get(object.type);if(!image)return;
  ctx.save();ctx.translate(object.x*width,object.y*height);
  ctx.rotate(Math.sin(object.y*5+object.spin)*.15);
  ctx.drawImage(image,-24,-29,48,58);ctx.restore();
}
function draw(){ctx.clearRect(0,0,width,height);if(view!=='garden')return;for(const o of round?.objects??[])fruit(o);for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.hurt?'#a86878':'#587343';ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillText(p.text,p.x*width,height*.84-p.age*45-30);}ctx.globalAlpha=1;}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;
  if(popa&&!roomEditing&&!furnitureSession&&view==='room'&&$('overlay').hidden&&$('wardrobe-panel').hidden&&!story?.isOpen){
    const horizontal=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));
    const vertical=Number(keys.has('ArrowUp')||keys.has('w'))-Number(keys.has('ArrowDown')||keys.has('s'));
    const geometry=roomGeometry();repairRoomPosition(geometry);
    const start=feetPosition();let next=start;
    if(horizontal||vertical){cancelInteraction();const length=Math.hypot(horizontal,vertical);next=slideStep(start,{x:start.x+horizontal/length*160*dt,y:start.y-vertical/length*160*dt},geometry.bounds,geometry.obstacles);}
    else if(roomRoute.length){
      const waypoint=roomRoute[0],dx=waypoint.x-start.x,dy=waypoint.y-start.y,distance=Math.hypot(dx,dy),step=Math.min(distance,160*dt);
      next=distance>.01?{x:start.x+dx/distance*step,y:start.y+dy/distance*step}:waypoint;
      if(!walkable(next,geometry.bounds,geometry.obstacles)){roomRoute=roomPath(start,roomRoute.at(-1),geometry.bounds,geometry.obstacles);next=start;if(!roomRoute.length){cancelInteraction();toast('הדרך חסומה. אפשר לפנות מקום בסידור החדר.');}}
      else if(distance<=160*dt+.1)roomRoute.shift();
    }
    if(Math.hypot(next.x-start.x,next.y-start.y)>.01){if(Math.abs(next.x-start.x)>.1)faceRoom(next.x-start.x);setFeet(next);cue('walk');}
    else if(!roomRoute.length&&pendingItem)arrive();else if(!activeItem&&['walk','stop'].includes(popa.action))cue('idle');
    orderRoomDepth();
  }
  if(view==='garden'&&phase==='playing'){
    if(keys.has('ArrowLeft')||keys.has('a'))target-=600/width*dt;
    if(keys.has('ArrowRight')||keys.has('d'))target+=600/width*dt;
    target=Math.max(.07,Math.min(.93,target));
    const events=round.step(dt,target,width);positionPlayer(round.player);
    for(const e of events){if(e.type==='catch'){beep();particles.push({x:e.x,text:`+${e.points}${e.multiplier>1?' ✧':''}`,life:1,age:0});}if(e.type==='hurt'){beep(true);toast(e.text);particles.push({x:e.x,text:'♡',hurt:true,life:1,age:0});}if(e.type==='finish')finish();}
    for(const particle of particles){particle.age+=dt;particle.life-=dt/1.1;}particles=particles.filter(p=>p.life>0);hud();
  }draw();requestAnimationFrame(tick);
}
$('home-tab').onclick=()=>{if(view==='garden'&&phase==='playing')pause();else home();};$('garden-tab').onclick=()=>{if(popa)garden();};
$('activity-button').onclick=()=>{if(!popa)return;if(view==='room')garden();else if(phase==='playing')pause();else home();};$('pause').onclick=pause;
for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>location.href=b.dataset.page;
$('buy-rug').onclick=()=>approachItem({id:'rug',label:'השטיח',action:'happy',message:'פופה רוקדת על השטיח'},$('buy-rug'));
let floorClickToken=0;
$('room').addEventListener('pointerdown',async e=>{if(!popa||roomEditing||story?.isOpen||e.target.closest('button,a'))return;const token=++floorClickToken;if(furnitureSession){await leaveFurniture();if(token!==floorClickToken||view!=='room')return;}cancelInteraction();const r=document.querySelector('.world').getBoundingClientRect(),y=e.clientY-r.top;if(y<height*FLOOR_START){cue('curious');toast('כדי לטייל, בחרי מקום על רצפת העץ');return;}queueRoomPath({x:e.clientX-r.left,y});});
$('orchard').addEventListener('pointermove',e=>{if(phase!=='playing'||e.target.closest('.game-hud'))return;if(e.pointerType==='touch'&&!e.buttons)return;const r=canvas.getBoundingClientRect();target=(e.clientX-r.left)/r.width;});
$('orchard').addEventListener('pointerdown',e=>{if(phase!=='playing'||e.target.closest('button'))return;const r=canvas.getBoundingClientRect();target=(e.clientX-r.left)/r.width;$('orchard').setPointerCapture(e.pointerId);});
const roomKeys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s']);
function clearMovement(){keys.clear();if(view==='room'&&!furnitureSession){cancelInteraction();target=roomX;targetDepth=roomDepth;}pause();}
document.addEventListener('keydown',e=>{
 if(story?.isOpen)return;
 if(!$('wardrobe-panel').hidden){if(e.key==='Escape'){e.preventDefault();closeWardrobe();}return;}
 if(furnitureSession&&roomKeys.has(e.key)&&!e.target.closest('input,textarea,select')){e.preventDefault();keys.add(e.key);leaveFurniture();return;}
 if(roomEditing||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(view==='room'&&popa&&$('overlay').hidden&&roomKeys.has(e.key)){e.preventDefault();if(!keys.size){cancelInteraction();target=roomX;targetDepth=roomDepth;}keys.add(e.key);return;}
 if(view!=='garden')return;if(e.key==='Escape'||e.code==='Space'){if(phase==='playing'){e.preventDefault();pause();}return;}if(phase==='playing'&&['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}
});
document.addEventListener('keyup',e=>{keys.delete(e.key);if(view==='room'&&roomKeys.has(e.key)){roomRoute=[];target=roomX;targetDepth=roomDepth;}});
window.addEventListener('blur',clearMovement);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMovement();});
$('overlay').addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[$('dialog-main'),$('dialog-secondary')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus();}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus();}}});
$('sound').onclick=()=>{sound=!sound;if(sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{sound=false;toast('הדפדפן הזה אינו תומך בצליל');}}$('sound').textContent=sound?'צליל פעיל ♫':'צליל כבוי ♫';$('sound').setAttribute('aria-pressed',String(sound));};
function renderWardrobe(){
  const rail=document.querySelector('.wardrobe-choices');rail.replaceChildren();
  const entries=[{id:'default',label:'הבגד הרגיל',fitted:true,garments:[{asset:'assets/characters/popa/parts/pinafore.png'}]},...wardrobe.entries];
  for(const entry of entries){
    const button=document.createElement('button');button.type='button';button.dataset.wear=entry.id;button.dataset.fitted=String(entry.fitted);button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',entry.label+(entry.fitted?'':' — מדידה ראשונית'));
    const hanger=new Image();hanger.src='assets/scenes/home/furniture/wardrobe/images/hanger.png';hanger.className='wardrobe-hanger';hanger.alt='';button.append(hanger);
    const clothes=document.createElement('span');clothes.className='hanging-outfit';
    for(const part of entry.garments.slice(0,2)){const image=new Image();image.src=part.asset+'?artwork=7';image.alt='';image.loading='lazy';clothes.append(image);}
    button.append(clothes);const label=document.createElement('span');label.className='hanging-label';label.textContent=entry.label;button.append(label);
    if(!entry.fitted){const badge=document.createElement('small');badge.textContent='מדידה ראשונית';button.append(badge);}
    rail.append(button);
  }
}
async function applyWardrobeAppearance(rig,mounted){
 for(const part of rig.parts){
  const image=document.querySelector(part.id==='frame'?'.wardrobe-frame':`.wardrobe-${part.id}`);if(!image)continue;
  const loaded=mounted.nodes.get(part.id)?.img;if(loaded){image.src=loaded.currentSrc||loaded.src;await image.decode();}
  const sy=part.scaleY??part.scale;
  Object.assign(image.style,{inset:'auto',left:(part.position[0]-part.anchor[0]*part.scale)/rig.canvas[0]*100+'%',top:(part.position[1]-part.anchor[1]*sy)/rig.canvas[1]*100+'%',width:part.sourceSize[0]*part.scale/rig.canvas[0]*100+'%',height:part.sourceSize[1]*sy/rig.canvas[1]*100+'%',transformOrigin:`${part.anchor[0]/part.sourceSize[0]*100}% ${part.anchor[1]/part.sourceSize[1]*100}%`});
  image.style.setProperty('--base-angle',part.rotation+'deg');
 }
}
let wardrobeReturnFocus;
function openWardrobe(){
  if(!wardrobe||view!=='room')return;roomEditor?.close();cancelInteraction();keys.clear();target=roomX;targetDepth=roomDepth;cue('idle');
  wardrobeReturnFocus=document.querySelector('[data-furniture="wardrobe"]');$('wardrobe-panel').hidden=false;
  document.querySelectorAll('[data-wear]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.wear===profile.outfit)));
  $('wardrobe-status').textContent='';document.querySelector(`[data-wear="${profile.outfit}"]`).focus();requestAnimationFrame(updateWardrobeArrows);
}
function closeWardrobe(){if($('wardrobe-panel').hidden)return;$('wardrobe-panel').hidden=true;wardrobeReturnFocus?.focus();}
$('wardrobe-close').onclick=closeWardrobe;
const wardrobeRail=document.querySelector('.wardrobe-choices');
function updateWardrobeArrows(){
 const distance=Math.max(0,wardrobeRail.scrollWidth-wardrobeRail.clientWidth),offset=-wardrobeRail.scrollLeft;
 $('wardrobe-right').disabled=offset<=2;$('wardrobe-left').disabled=offset>=distance-2;
}
function scrollWardrobe(direction){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 wardrobeRail.scrollBy({left:direction*Math.max(160,wardrobeRail.clientWidth*.8),behavior:reduced?'instant':'smooth'});
}
$('wardrobe-right').onclick=()=>scrollWardrobe(1);
$('wardrobe-left').onclick=()=>scrollWardrobe(-1);
wardrobeRail.addEventListener('scroll',updateWardrobeArrows,{passive:true});
new ResizeObserver(updateWardrobeArrows).observe(wardrobeRail);

$('wardrobe-panel').addEventListener('keydown',event=>{if(event.key!=='Tab')return;const buttons=[...$('wardrobe-panel').querySelectorAll('button:not(:disabled),a[href]')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
document.querySelector('.wardrobe-choices').addEventListener('click',async event=>{
  const button=event.target.closest('[data-wear]');if(!button||button.disabled)return;
  const choices=[...document.querySelectorAll('[data-wear]')];choices.forEach(b=>b.disabled=true);$('wardrobe-status').textContent='פופה מתלבשת…';
  try{await wardrobe.wear(button.dataset.wear);acceptProgress(progressStore.updateProfile(actionId('outfit'),state=>{state.outfit=button.dataset.wear;}));closeWardrobe();cue('happy');toast(profile.outfit==='default'?'פופה חזרה לבגד הרגיל':'פופה לבשה '+wardrobe.entries.find(entry=>entry.id===profile.outfit).label);}
  catch(error){$('wardrobe-status').textContent='לא הצלחנו לטעון את הבגד. נסי שוב.';console.error(error);}
  finally{choices.forEach(b=>b.disabled=false);}
});
refreshProfile();new ResizeObserver(resize).observe(document.querySelector('.world'));resize();
try{
  const actionResponse=await fetch('assets/scenes/home/furniture/coastal/sofa/interactions/sit.json?v=2');if(!actionResponse.ok)throw Error('Cannot load sofa interaction');sofaAction=validateFurnitureInteraction(await actionResponse.json());
  if(new URLSearchParams(location.search).get('interactionPreview')==='sofa'){try{const draft=localStorage.getItem('popa.furniture.sofa.sit.v1');if(draft)sofaAction=validateFurnitureInteraction(JSON.parse(draft));}catch{}}
  sofaRig=loadPropAppearance(await (await fetch('assets/scenes/home/furniture/coastal/sofa/assembly.json?v=2',{cache:'no-cache'})).json());
  const furnitureResponse=await fetch(new URL('../assets/scenes/home/furniture/layout.json',import.meta.url),{cache:'no-cache'});if(!furnitureResponse.ok)throw Error('Cannot load furniture layout');roomFurniture=await furnitureResponse.json();
  const background=new Image();background.src=new URL('../'+roomFurniture.background,import.meta.url).href;await background.decode();$('room').style.backgroundImage=`url("${background.src}")`;
  await Promise.all(roomFurniture.items.map(async item=>{if(!POPA_CLIPS[item.action])throw Error('Unknown room action');const button=document.createElement('button');button.type='button';button.dataset.furniture=item.id;button.className='room-item';button.style.zIndex=item.layer??1;button.setAttribute('aria-label',item.label);button.setAttribute('aria-pressed','false');if(item.id==='reading-books')button.id='reading-books';if(item.assembly){const response=await fetch(new URL('../'+item.assembly,import.meta.url),{cache:'no-cache'});if(!response.ok)throw Error('Cannot load room prop');const data=loadPropAppearance(await response.json()),rig=document.createElement('div');rig.className='item-rig';rig.dataset.canvas=JSON.stringify(data.canvas);button.append(rig);const mounted=mountProp(rig,data,{assetUrl:path=>new URL('../'+path+'?v=room-art2',import.meta.url).href});await mounted.ready;if(item.id==='wardrobe')await applyWardrobeAppearance(data,mounted);}else{const image=new Image();image.src=new URL('../'+item.image,import.meta.url).href;image.alt='';button.append(image);await image.decode();}button.onclick=()=>approachItem(item,button);$('home-furniture').append(button);}));placeRoomFurniture();
  roomEditor=mountRoomEditor({room:$('room'),layout:roomFurniture,place:placeRoomFurniture,setEditing(value){roomEditing=value;story?.setVisible(!value&&view==='room');if(value){$('player').style.zIndex='4';roomEditor?.applyLayers();}else repairRoomPosition();keys.clear();cancelInteraction();target=roomX;targetDepth=roomDepth;popa?.stop({immediate:true});$('room-hint').textContent=value?'בחרי חפץ וגררי אותו למקום הרצוי':'בחרי פריט ופופה תיגש אליו · אפשר גם לטייל עם החיצים';}});
  await Promise.all(['apple','orange','berries','gold','rain'].map(async name=>{const image=new Image();image.src=new URL(`../assets/scenes/garden/${name}.svg`,import.meta.url).href;await image.decode();fruitImages.set(name,image);}));
  popa=await createPopa($('player'),{scale:.46,autoplay:'idle'});wardrobe=await createWardrobe(popa);renderWardrobe();if(profile.outfit!=='default'&&!wardrobe.looks.includes(profile.outfit))profile.outfit='default';await wardrobe.wear(profile.outfit);story=await mountFirstMeeting({world:document.querySelector('.world'),onApproach:approachItem,onStart(){keys.clear();cancelInteraction();cue('wave');},onClose(){keys.clear();cue('idle');},onProgress(){profile=readProfile();refreshProfile();}});farm=mountStrawberryGarden({container:$('orchard'),store:progressStore,onHome:home,onFocus(index,immediate){if(immediate)positionFarmer([.15,.48,.78][index]);else moveFarmer([.15,.48,.78][index]);},onToolState(held){farmerHolding=held;if(!farmerMove||farmerMove.playState!=='running')cue(held?'hold':'idle');},onFruitGame:()=>garden(true),onAction({index,stage,complete}){moveFarmer(.2+index*.3,stage==='empty'?'interact':'happy');if(complete)toast('התותים מוכנים! הצעד הבא: לאפות עם מומו.');}});$('loading').hidden=true;home();requestAnimationFrame(tick);if(new URLSearchParams(location.search).get('interactionPreview')==='sofa')approachItem(roomFurniture.items.find(i=>i.id==='sofa'),document.querySelector('[data-furniture="sofa"]'));}catch(error){$('loading').textContent='לא הצלחנו לטעון את פופה. נסי לרענן את העמוד.';console.error(error);}
window.addEventListener('pagehide',event=>{if(event.persisted){pause();return;}cancelInteraction();story?.destroy();farm?.destroy();wardrobe?.destroy();popa?.destroy();});
