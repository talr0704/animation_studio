import { createIllustratedProp } from './illustrated-prop.js';
import { createPopa } from '../popa-browser.js';
import { GardenRound } from './garden-round.js';
const $ = id => document.getElementById(id);
const STORAGE = 'popaWorldV1';
let profile = { coins: 0, best: 0, rounds: 0, rug: false };
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
  for (const key of ['coins','best','rounds']) if (Number.isSafeInteger(saved[key]) && saved[key] >= 0 && saved[key] < 10000000) profile[key] = saved[key];
  profile.rug = saved.rug === true;
} catch { /* Play remains available without browser storage. */ }
const illustratedProps = [];
const fruitImages = new Map();
let popa, view = 'room', phase = 'intro', round, roomX = .52, target = .52;
let width = 1, height = 1, last = performance.now(), particles = [], toastTimer, audio, sound = false;
const keys = new Set();
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(profile)); } catch { $('save-status').textContent = 'שמירה אינה זמינה בדפדפן הזה'; } };
function refreshProfile() {
  $('coins').textContent = profile.coins;
  $('rug').classList.toggle('upgraded', profile.rug);
  $('rug').src = `assets/world/${profile.rug ? 'rug-floral' : 'rug'}.svg`;
  $('buy-rug').disabled = profile.rug;
  $('buy-rug').textContent = profile.rug ? 'כבר בבית ✓' : '12 ✦';
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
function positionPlayer(x) {
  $('player').style.left = `${x*100}%`;
  $('player').style.bottom = view==='room' ? '30px' : `${height*.16-40}px`;
  $('basket').style.left=`${x*100}%`;
  $('basket').style.top=`${height*.84-21}px`;
}
function home() {
  if (view==='garden' && phase==='playing') { pause(); return; }
  view='room';phase='intro';target=roomX;round=undefined;particles=[];keys.clear();closeDialog();
  $('room').hidden=false;$('orchard').hidden=true;$('basket').hidden=true;
  $('home-tab').setAttribute('aria-selected','true');$('garden-tab').setAttribute('aria-selected','false');
  $('heading').textContent='ברוכה הבאה הביתה';$('subtitle').textContent='לחצי על הרצפה כדי לטייל עם פופה, או צאי להרפתקה בגינה.';
  $('activity-title').textContent='מה צומח בגינה?';$('activity-text').textContent='45 שניות של פירות, כוכבי זהב ורצפים. כמה תוכלי לתפוס?';$('activity-button').textContent='לגינה ←';
  popa.setScale(width<600?.4:.46);cue('idle');positionPlayer(roomX);
}
function garden() {
  if(view==='garden'&&phase==='playing')return;
  view='garden';phase='intro';round=undefined;keys.clear();particles=[];
  $('room').hidden=true;$('orchard').hidden=false;$('basket').hidden=true;$('orchard').classList.remove('playing');
  $('home-tab').setAttribute('aria-selected','false');$('garden-tab').setAttribute('aria-selected','true');
  $('heading').textContent='גינת ההפתעות';$('subtitle').textContent='פירות קטנים, רצפים גדולים. הסל של פופה מחכה לך.';
  $('activity-title').textContent='עוד תפיסה אחת…';$('activity-text').textContent='כל 5 תפיסות ברצף מגדילות את הניקוד. כוכבי זהב שווים יותר!';$('activity-button').textContent='הביתה ←';
  popa.setScale(.29);cue('curious');positionPlayer(.5);hud();
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
function resize(){const world=document.querySelector('.world');width=world.clientWidth;height=world.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);if(popa){if(view==='room')popa.setScale(width<600?.4:.46);positionPlayer(view==='room'?roomX:round?.player??.5);}}
function fruit(object){
  const image=fruitImages.get(object.type);if(!image)return;
  ctx.save();ctx.translate(object.x*width,object.y*height);
  ctx.rotate(Math.sin(object.y*5+object.spin)*.15);
  ctx.drawImage(image,-24,-29,48,58);ctx.restore();
}
function draw(){ctx.clearRect(0,0,width,height);if(view!=='garden')return;for(const o of round?.objects??[])fruit(o);for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.hurt?'#a86878':'#587343';ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillText(p.text,p.x*width,height*.84-p.age*45-30);}ctx.globalAlpha=1;}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;
  if(popa&&view==='room'&&$('overlay').hidden){const dx=target-roomX;if(Math.abs(dx)>.006){roomX+=Math.sign(dx)*Math.min(Math.abs(dx),140/width*dt);cue('walk');positionPlayer(roomX);}else if(['walk','stop'].includes(popa.action))cue('idle');}
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
$('buy-rug').onclick=()=>{if(profile.rug)return;if(profile.coins<12){toast('עוד קצת פירות — השטיח עולה 12 מטבעות');return;}profile.coins-=12;profile.rug=true;save();refreshProfile();toast('השטיח החדש כבר בבית!');if(view==='room')cue('happy');};
$('room').addEventListener('pointerdown',e=>{if(!popa)return;const r=document.querySelector('.world').getBoundingClientRect();if(e.clientY-r.top<r.height*.6){cue('curious');toast('פופה אוהבת את הפינה הזאת');return;}target=Math.max(.17,Math.min(.83,(e.clientX-r.left)/r.width));});
$('orchard').addEventListener('pointermove',e=>{if(phase!=='playing'||e.target.closest('.game-hud'))return;if(e.pointerType==='touch'&&!e.buttons)return;const r=canvas.getBoundingClientRect();target=(e.clientX-r.left)/r.width;});
$('orchard').addEventListener('pointerdown',e=>{if(phase!=='playing'||e.target.closest('button'))return;const r=canvas.getBoundingClientRect();target=(e.clientX-r.left)/r.width;$('orchard').setPointerCapture(e.pointerId);});
document.addEventListener('keydown',e=>{if(view!=='garden')return;if(e.key==='Escape'||e.code==='Space'){if(phase==='playing'){e.preventDefault();pause();}return;}if(phase==='playing'&&['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}});
document.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>{keys.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
$('overlay').addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[$('dialog-main'),$('dialog-secondary')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus();}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus();}}});
$('sound').onclick=()=>{sound=!sound;if(sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{sound=false;toast('הדפדפן הזה אינו תומך בצליל');}}$('sound').textContent=sound?'צליל פעיל ♫':'צליל כבוי ♫';$('sound').setAttribute('aria-pressed',String(sound));};
refreshProfile();new ResizeObserver(resize).observe(document.querySelector('.world'));resize();
try{
  const response=await fetch(new URL('../assets/world/assemblies.json',import.meta.url));
  if(!response.ok)throw new Error('World assemblies could not be loaded');
  const rigs=await response.json();
  for(const [name,mount] of [['window','window-prop'],['plant','plant-prop'],['shelf','shelf-prop']]){
    const rig=await createIllustratedProp($(mount),rigs[name]);illustratedProps.push(rig);
    if(name!=='shelf')$(mount).addEventListener('click',()=>{rig.sway();cue('curious');toast(name==='plant'?'קצת רוח בין העלים…':'הווילונות רוקדים ברוח');});
  }
  await Promise.all(['apple','orange','berries','gold','rain'].map(async name=>{const image=new Image();image.src=new URL(`../assets/world/${name}.svg`,import.meta.url).href;await image.decode();fruitImages.set(name,image);}));
  popa=await createPopa($('player'),{scale:.46,autoplay:'idle'});$('loading').hidden=true;home();requestAnimationFrame(tick);}catch(error){$('loading').textContent='לא הצלחנו לטעון את פופה. נסי לרענן את העמוד.';console.error(error);}
window.addEventListener('pagehide',event=>{if(event.persisted){pause();return;}popa?.destroy();illustratedProps.forEach(prop=>prop.destroy());});
