import {mountProp} from '../shared/prop-rig.js';
import { createPopa } from '../popa-browser.js';
import { POPA_CLIPS } from '../popa-clips.js';
import { GardenRound } from './garden-round.js';
const $ = id => document.getElementById(id);
const STORAGE = 'popaWorldV1';
let profile = { coins: 0, best: 0, rounds: 0, rug: false };
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
  for (const key of ['coins','best','rounds']) if (Number.isSafeInteger(saved[key]) && saved[key] >= 0 && saved[key] < 10000000) profile[key] = saved[key];
  profile.rug = saved.rug === true;
} catch { /* Play remains available without browser storage. */ }
let pendingItem=null,interactionTimer=null,activeItem=null;
const fruitImages = new Map();
let roomFurniture;
function placeRoomFurniture(){if(!roomFurniture)return;const layout=roomFurniture[window.innerWidth<=700?'portrait':'wide'],[w,h]=layout.canvas;const place=(el,r)=>Object.assign(el.style,{left:r[0]/w*100+'%',top:r[1]/h*100+'%',width:r[2]/w*100+'%',height:r[3]/h*100+'%'});for(const [id,rect]of Object.entries(layout.items)){const button=document.querySelector(`[data-furniture="${id}"]`);place(button,rect);const rig=button.querySelector('.item-rig');if(rig){const [rw,rh]=JSON.parse(rig.dataset.canvas),scale=Math.min(button.clientWidth/rw,button.clientHeight/rh);Object.assign(rig.style,{width:rw+'px',height:rh+'px',left:(button.clientWidth-rw*scale)/2+'px',top:(button.clientHeight-rh*scale)+'px',transform:`scale(${scale})`});}}place($('buy-rug'),layout.rug);}
function cancelInteraction(){clearTimeout(interactionTimer);pendingItem=null;activeItem=null;$('player').removeAttribute('data-interaction');popa?.clearItem();for(const b of document.querySelectorAll('.room-item'))b.setAttribute('aria-pressed','false');}
function approachItem(item,element){if(!popa||view!=='room')return;cancelInteraction();keys.clear();const world=document.querySelector('.world').getBoundingClientRect(),rect=element.getBoundingClientRect(),min=roomBounds();target=Math.max(min,Math.min(1-min,(rect.x+rect.width/2-world.x)/width));targetDepth=Math.max(0,Math.min(.28,1-(rect.bottom-world.y+50)/height));pendingItem=item;element.setAttribute('aria-pressed','true');toast(`פופה בדרך אל ${item.label}`);}
function arrive(){const item=pendingItem;if(!item)return;pendingItem=null;activeItem=item.id;$('player').dataset.interaction=item.id;
 if(item.id==='rug'&&!profile.rug){if(profile.coins<12){toast('השטיח החדש עולה 12 מטבעות');cancelInteraction();cue('idle');return;}profile.coins-=12;profile.rug=true;save();refreshProfile();}

 cue(item.action);toast(item.message);const element=document.querySelector(`[data-furniture="${item.id}"]`);if(element)element.animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:400});
 interactionTimer=setTimeout(()=>{if(activeItem!==item.id)return;cancelInteraction();if(item.page){location.href=item.page;return;}cue('idle');},POPA_CLIPS[item.action].duration);
}

let popa, view = 'room', phase = 'intro', round, roomX = .52, target = .52;
let roomDepth=0,targetDepth=0,roomFacing=1;
let width = 1, height = 1, last = performance.now(), particles = [], toastTimer, audio, sound = false;
const keys = new Set();
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const save = () => { try { let previous={};try{previous=JSON.parse(localStorage.getItem(STORAGE)||'{}');}catch{}localStorage.setItem(STORAGE, JSON.stringify({...previous,...profile})); } catch { $('save-status').textContent = 'שמירה אינה זמינה בדפדפן הזה'; } };
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
function roomBounds(){const half=($('player').firstElementChild?.offsetWidth??100)/width/2;return Math.min(.46,Math.max(.17,half+.02));}
function roomScale(){return Math.min(height/900,width<600?.43:.60)*(1-roomDepth*.65);}
function positionPlayer(x) {
  $('player').style.left = `${x*100}%`;
  $('player').style.bottom = view==='room' ? `${30+roomDepth*height}px` : `${height*.16-40}px`;
  $('basket').style.left=`${x*100}%`;
  $('basket').style.top=`${height*.84-21}px`;
}
function home() {
  if (view==='garden' && phase==='playing') { pause(); return; }
  document.querySelector('.world').dataset.view='room';view='room';cancelInteraction();phase='intro';target=roomX;targetDepth=roomDepth;faceRoom(roomFacing);round=undefined;particles=[];keys.clear();closeDialog();
  $('room').hidden=false;$('orchard').hidden=true;$('basket').hidden=true;
  $('home-tab').setAttribute('aria-selected','true');$('garden-tab').setAttribute('aria-selected','false');
  $('heading').textContent='ברוכה הבאה הביתה';$('subtitle').textContent='לחצי על הרצפה כדי לטייל עם פופה, או צאי להרפתקה בגינה.';
  $('activity-title').textContent='מה צומח בגינה?';$('activity-text').textContent='45 שניות של פירות, כוכבי זהב ורצפים. כמה תוכלי לתפוס?';$('activity-button').textContent='לגינה ←';
  popa.setScale(roomScale());cue('idle');positionPlayer(roomX);
}
function garden() {
  if(view==='garden'&&phase==='playing')return;
  document.querySelector('.world').dataset.view='garden';view='garden';cancelInteraction();phase='intro';round=undefined;keys.clear();particles=[];
  $('room').hidden=true;$('orchard').hidden=false;$('basket').hidden=true;$('orchard').classList.remove('playing');
  $('home-tab').setAttribute('aria-selected','false');$('garden-tab').setAttribute('aria-selected','true');
  $('heading').textContent='גינת ההפתעות';$('subtitle').textContent='פירות קטנים, רצפים גדולים. הסל של פופה מחכה לך.';
  $('activity-title').textContent='עוד תפיסה אחת…';$('activity-text').textContent='כל 5 תפיסות ברצף מגדילות את הניקוד. כוכבי זהב שווים יותר!';$('activity-button').textContent='הביתה ←';
  $('player').style.setProperty('--facing',1);$('player').dataset.facing='right';popa.setScale(.29);cue('curious');positionPlayer(.5);hud();
  dialog({title:'מה נופל מהעצים?',text:'הזיזי את פופה ותפסי פירות בסל.\nכוכב זהב = בונוס. טיפות כחולות = לא לסל!\nבמחשב: עכבר או חצים. בנייד: גרירה על הגינה.',main:'בואי נשחק!',action:start});
}
function start() {
  round=new GardenRound();phase='playing';target=.5;particles=[];keys.clear();last=performance.now();
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
  profile.coins+=round.reward;profile.best=Math.max(profile.best,round.score);profile.rounds++;save();refreshProfile();cue('happy');
  dialog({label:round.lives>0?'איזו הרפתקה!':'הגשם הפתיע אותנו',title:round.score>0?'הסל מלא בהפתעות':'עוד סיבוב קטן?',text:round.bestCombo>=5?'איזה רצף! קיבלת גם בונוס של 3 מטבעות.':'אפשר תמיד לנסות שוב. רצף של 5 תפיסות פותח מכפיל ניקוד.',main:'עוד סיבוב',action:start,results:[[round.score,'נקודות'],[`+${round.reward}`,'מטבעות'],[round.bestCombo,'ברצף']]});
}
function hud() {
  $('score').textContent=round?.score??0;$('timer').textContent=Math.ceil(round?.remaining??45);
  const lives=round?.lives??3;$('lives').textContent='♥ '.repeat(lives)+'♡ '.repeat(3-lives);$('lives').setAttribute('aria-label',`${lives} לבבות`);
  const combo=round?.combo??0;$('combo').textContent=combo>=5?`${combo} ברצף! ×${Math.min(3,1+Math.floor(combo/5))} נקודות`:'תופסים פירות. בונים רצפים.';
}
function resize(){placeRoomFurniture();const world=document.querySelector('.world');width=world.clientWidth;height=world.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);if(popa){if(view==='room'){popa.setScale(roomScale());const min=roomBounds();roomX=Math.max(min,Math.min(1-min,roomX));target=Math.max(min,Math.min(1-min,target));}positionPlayer(view==='room'?roomX:round?.player??.5);}}
function fruit(object){
  const image=fruitImages.get(object.type);if(!image)return;
  ctx.save();ctx.translate(object.x*width,object.y*height);
  ctx.rotate(Math.sin(object.y*5+object.spin)*.15);
  ctx.drawImage(image,-24,-29,48,58);ctx.restore();
}
function draw(){ctx.clearRect(0,0,width,height);if(view!=='garden')return;for(const o of round?.objects??[])fruit(o);for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.hurt?'#a86878':'#587343';ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillText(p.text,p.x*width,height*.84-p.age*45-30);}ctx.globalAlpha=1;}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;
  if(popa&&view==='room'&&$('overlay').hidden){
    const horizontal=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));
    const vertical=Number(keys.has('ArrowUp')||keys.has('w'))-Number(keys.has('ArrowDown')||keys.has('s'));
    if(horizontal||vertical){cancelInteraction();const length=Math.hypot(horizontal,vertical),min=roomBounds();target=Math.max(min,Math.min(1-min,roomX+horizontal/length*160/width*dt));targetDepth=Math.max(0,Math.min(.28,roomDepth+vertical/length*160/height*dt));}
    const dx=(target-roomX)*width,dy=(targetDepth-roomDepth)*height,distance=Math.hypot(dx,dy);
    if(distance>.01){const step=Math.min(distance,160*dt);roomX+=dx/distance*step/width;roomDepth+=dy/distance*step/height;if(Math.abs(dx)>.1)faceRoom(dx);popa.setScale(roomScale());cue('walk');positionPlayer(roomX);}
    else if(pendingItem)arrive();else if(!activeItem&&['walk','stop'].includes(popa.action))cue('idle');
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
$('room').addEventListener('pointerdown',e=>{if(!popa||e.target.closest('button,a'))return;cancelInteraction();const r=document.querySelector('.world').getBoundingClientRect();if(e.clientY-r.top<r.height*.6){cue('curious');toast('פופה אוהבת את הפינה הזאת');return;}const min=roomBounds();target=Math.max(min,Math.min(1-min,(e.clientX-r.left)/r.width));targetDepth=Math.max(0,Math.min(.28,1-(e.clientY-r.top)/r.height-.04));});
$('orchard').addEventListener('pointermove',e=>{if(phase!=='playing'||e.target.closest('.game-hud'))return;if(e.pointerType==='touch'&&!e.buttons)return;const r=canvas.getBoundingClientRect();target=(e.clientX-r.left)/r.width;});
$('orchard').addEventListener('pointerdown',e=>{if(phase!=='playing'||e.target.closest('button'))return;const r=canvas.getBoundingClientRect();target=(e.clientX-r.left)/r.width;$('orchard').setPointerCapture(e.pointerId);});
const roomKeys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s']);
function clearMovement(){keys.clear();if(view==='room'){cancelInteraction();target=roomX;targetDepth=roomDepth;}pause();}
document.addEventListener('keydown',e=>{
 if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(view==='room'&&popa&&$('overlay').hidden&&roomKeys.has(e.key)){e.preventDefault();if(!keys.size){cancelInteraction();target=roomX;targetDepth=roomDepth;}keys.add(e.key);return;}
 if(view!=='garden')return;if(e.key==='Escape'||e.code==='Space'){if(phase==='playing'){e.preventDefault();pause();}return;}if(phase==='playing'&&['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}
});
document.addEventListener('keyup',e=>{keys.delete(e.key);if(view==='room'&&roomKeys.has(e.key)){target=roomX;targetDepth=roomDepth;}});
window.addEventListener('blur',clearMovement);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMovement();});
$('overlay').addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[$('dialog-main'),$('dialog-secondary')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus();}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus();}}});
$('sound').onclick=()=>{sound=!sound;if(sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{sound=false;toast('הדפדפן הזה אינו תומך בצליל');}}$('sound').textContent=sound?'צליל פעיל ♫':'צליל כבוי ♫';$('sound').setAttribute('aria-pressed',String(sound));};
refreshProfile();new ResizeObserver(resize).observe(document.querySelector('.world'));resize();
try{
  const furnitureResponse=await fetch(new URL('../assets/scenes/home/furniture/layout.json',import.meta.url));if(!furnitureResponse.ok)throw Error('Cannot load furniture layout');roomFurniture=await furnitureResponse.json();
  await Promise.all(roomFurniture.items.map(async item=>{if(!POPA_CLIPS[item.action])throw Error('Unknown room action');const button=document.createElement('button');button.type='button';button.dataset.furniture=item.id;button.className='room-item';button.style.zIndex=item.layer??1;button.setAttribute('aria-label',item.label);button.setAttribute('aria-pressed','false');if(item.id==='reading-books')button.id='reading-books';if(item.assembly){const response=await fetch(new URL('../'+item.assembly,import.meta.url));if(!response.ok)throw Error('Cannot load room prop');const data=await response.json(),rig=document.createElement('div');rig.className='item-rig';rig.dataset.canvas=JSON.stringify(data.canvas);button.append(rig);const mounted=mountProp(rig,data);await mounted.ready;}else{const image=new Image();image.src=new URL('../'+item.image,import.meta.url).href;image.alt='';button.append(image);await image.decode();}const label=document.createElement('span');label.textContent=item.label;button.append(label);button.onclick=()=>approachItem(item,button);$('home-furniture').append(button);}));placeRoomFurniture();
  await Promise.all(['apple','orange','berries','gold','rain'].map(async name=>{const image=new Image();image.src=new URL(`../assets/scenes/garden/${name}.svg`,import.meta.url).href;await image.decode();fruitImages.set(name,image);}));
  popa=await createPopa($('player'),{scale:.46,autoplay:'idle'});$('loading').hidden=true;home();requestAnimationFrame(tick);}catch(error){$('loading').textContent='לא הצלחנו לטעון את פופה. נסי לרענן את העמוד.';console.error(error);}
window.addEventListener('pagehide',event=>{if(event.persisted){pause();return;}cancelInteraction();popa?.destroy();});
