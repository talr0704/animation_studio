import {loadAssets,url,COLORS} from './assets.js';
import {NailSurface,W,H,canvas,pointerCoords} from './surface.js';
import {BottleRack,mountSoap,effect,dryAnimation} from './animations.js';
import {readSession,writeSession,rewardOnce} from './storage.js?v=progress2';
const $=id=>document.getElementById(id),work=$('work'),ctx=work.getContext('2d');
const LABELS={remove:'הסרת הלק הישן',clean:'ניקוי עדין',file:'תיקון ושיוף הקצה',paint:'צובעים איך שרוצים',decorate:'מדבקות וגימור'};
const HINTS={remove:'קחי צמר גפן ועברי בעדינות על שאריות הלק.',clean:'סבון ומברשת קטנה — מנקים רק במקום שבו משפשפים.',file:'העבירי את הפצירה מצד לצד בקצה העליון של הציפורן.',paint:'בחרי בקבוק וציירי קווים, נקודות או כמה צבעים יחד.',decorate:'יבש ומבריק! בחרי מדבקה והניחי אותה על הציפורן.'};
let assets,nails=[],selected=0,tool='remove',color='pink',rack,pump,ready=false,detail=false,drying=false,pointer=null,last=null,cursor=null,selectedSticker=-1,stickerKind='flower',saveTimer,sessionId,claimed=false,saveRevision=0,sound=false,audio,strokePhase,stickerCheckpoint=false;
const current=()=>nails[selected];
function note(text){$('hint').textContent=text;}
function beep(){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=700;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.17);o.start();o.stop(audio.currentTime+.18);}
function reaction(){const r=work.getBoundingClientRect();effect('effects/sparkles.png',detail?r.x+r.width/2:innerWidth/2,detail?r.y+r.height/2:innerHeight*.4);$('companion').animate([{transform:'rotate(-4deg)'},{transform:'rotate(4deg)'},{transform:'rotate(0)'}],{duration:500});beep();}
function drawPaw(target,full=false){const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);c.save();c.scale(target.width/546,target.height/(full?1360:760));c.drawImage(assets.images['paw/paw.png'],0,0);assets.layout.paw.nails.forEach((def,i)=>{c.save();c.translate(...def.center);c.rotate(def.rotation*Math.PI/180);c.drawImage(nails[i].preview,-def.size[0]/2,-def.size[1]/2,...def.size);c.restore();});c.restore();}
function fullPaw(){for(const nail of nails)nail.render(nail.preview,{blend:false});const result=canvas(546,1360);drawPaw(result,true);return result;}
function render(){if(!ready)return;for(let i=0;i<nails.length;i++){nails[i].render();const thumb=$('nail-strip').querySelector(`[data-index="${i}"] canvas`);if(thumb)thumb.getContext('2d').drawImage(nails[i].preview,0,0,thumb.width,thumb.height);}
 drawPaw($('paw'));ctx.clearRect(0,0,W,H);ctx.drawImage(current().preview,0,0);
 const n=current(),phase=n.phase(),coverage=Math.min(100,Math.round(n.coverage()*100)),clean=phase==='remove'?1-n.remaining('old'):phase==='clean'?1-n.remaining('dirt'):phase==='file'?Math.min(1,n.repair/assets.layout.repair.completeDistance):phase==='paint'?n.coverage():1;
 $('phase-title').textContent=detail?`ציפורן ${selected+1} · ${LABELS[phase]}`:'הכפה של פופה · ארבע ציפורניים, העיצוב שלך';$('progress').value=Math.round(clean*100);$('progress').setAttribute('aria-label',`${LABELS[phase]} ${Math.round(clean*100)} אחוז`);
 $('completion').textContent=`${nails.filter(n=>n.dried).length} מתוך 4 ציפורניים יבשות · כיסוי ${coverage}%`;
 $('dryer').disabled=drying||n.dried||phase!=='paint'||(n.coverage()<assets.layout.thresholds.paintForDry&&!$('creative').checked)||n.coverage()<=0;
 $('finish').disabled=!nails.every(n=>n.dried)||drying;$('undo').disabled=!n.undo.length||drying;$('redo').disabled=!n.redo.length||drying;$('clear-paint').disabled=drying;
 for(const b of $('nail-strip').querySelectorAll('button'))b.setAttribute('aria-pressed',String(+b.dataset.index===selected));
 for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));
 $('sticker-controls').hidden=selectedSticker<0||!n.stickers[selectedSticker]||!detail;
 if(n.stickers[selectedSticker]){$('sticker-size').value=n.stickers[selectedSticker].size;$('sticker-rotation').value=n.stickers[selectedSticker].rotation;}
 for(const b of $('stickers').querySelectorAll('button'))b.setAttribute('aria-pressed',String(tool==='decorate'&&b.dataset.sticker===stickerKind));
}
function refreshHint(){if(ready)note(detail?HINTS[current().phase()]:'בחרי אחת מארבע הציפורניים של פופה ונתחיל לטפל בה.');}
async function flush(){clearTimeout(saveTimer);if(!ready)return;const revision=++saveRevision;try{const value={version:1,id:sessionId,claimed,selected,color,creative:$('creative').checked,nails:await Promise.all(nails.map(n=>n.serialize()))};await writeSession(value);if(revision===saveRevision)$('save-status').textContent='הציור נשמר ✓';}catch{$('save-status').textContent='השמירה לא זמינה — שמרי תמונה';}}
function scheduleSave(){$('save-status').textContent='שומרים…';clearTimeout(saveTimer);saveTimer=setTimeout(flush,180);}
function selectNail(index,open=true){if(drying)return;endStroke();selected=index;selectedSticker=-1;detail=open;$('overview').hidden=detail;$('detail').hidden=!detail;render();refreshHint();scheduleSave();}
function chooseTool(next){if(drying)return;endStroke();tool=next;selectedSticker=-1;if(next!=='paint')rack.activate(null,cursor);if(!detail)selectNail(selected);render();refreshHint();}
async function chooseColor(next){if(drying)return;endStroke();color=next;tool='paint';selectedSticker=-1;if(!detail)selectNail(selected);rack.activate(next,cursor);render();note(current().phase()==='paint'?'הצבע ביד שלך. ציירי במשיכות חופשיות.':'אפשר לבחור צבע כבר עכשיו. קודם נסיים להסיר, לנקות ולשייף.');scheduleSave();}
function showTool(event,p){cursor={x:event.clientX,y:event.clientY};if(!detail||drying){$('held-tool').hidden=true;return;}
 const path=tool==='paint'?`props/nail-polish/colors/${color}/brush.png`:tool==='file'?'props/care/images/nail-file.png':tool==='clean'?'props/care/images/cleaning-brush.png':tool==='decorate'?`props/stickers/images/sticker-${stickerKind}.png`:'props/care/images/'+(current().remaining('old')<.7?'cotton-stained':'cotton-clean')+'.png';
 const image=assets.images[path],width=tool==='decorate'?42:70,tip=tool==='paint'?assets.layout.brushTip:[image.width*(assets.layout.toolTips[tool]?.[0]??.5),image.height*(assets.layout.toolTips[tool]?.[1]??.5)];$('held-tool').src=url(path);$('held-tool').hidden=false;Object.assign($('held-tool').style,{width:width+'px',left:(event.clientX-tip[0]*width/image.width)+'px',top:(event.clientY-tip[1]*width/image.width)+'px'});
}
function apply(a,b){const n=current();if(tool==='decorate'){if(selectedSticker>=0)n.moveSticker(selectedSticker,b);}else n.stroke(tool,a,b,{color:color==='topcoat'?'rgba(255,255,255,.18)':assets.layout.colors[color],width:Number($('brush-size').value)});render();}
work.addEventListener('pointerdown',event=>{if(!ready||drying||pointer!==null)return;const n=current(),phase=n.phase();
 const allowed=tool==='remove'||tool==='clean'&&n.remaining('old')<=.08||tool==='file'&&n.remaining('old')<=.08&&n.remaining('dirt')<=.08||tool==='paint'&&phase==='paint'||tool==='decorate'&&n.dried;
 if(!allowed){note(HINTS[phase]);return;}
 event.preventDefault();pointer=event.pointerId;work.setPointerCapture(pointer);last=pointerCoords(event,work);strokePhase=phase;n.checkpoint();
 if(tool==='decorate'){selectedSticker=-1;for(let i=n.stickers.length-1;i>=0;i--){const s=n.stickers[i];if(Math.hypot(s.x-last.x,s.y-last.y)<s.size*.65){selectedSticker=i;break;}}if(selectedSticker<0&&n.addSticker(stickerKind,last))selectedSticker=n.stickers.length-1;}
 else apply(last,last);showTool(event,last);render();
});
work.addEventListener('pointermove',event=>{if(!ready)return;const point=pointerCoords(event,work);showTool(event,point);if(pointer!==event.pointerId)return;event.preventDefault();const events=event.getCoalescedEvents?.()??[event];for(const item of events.length?events:[event]){const p=pointerCoords(item,work);apply(last,p);last=p;}});
function endStroke(){if(pointer===null)return;const id=pointer;pointer=null;last=null;if(work.hasPointerCapture(id))work.releasePointerCapture(id);if(current().phase()!==strokePhase){reaction();refreshHint();}scheduleSave();render();}
work.addEventListener('pointerup',endStroke);work.addEventListener('pointercancel',endStroke);work.addEventListener('lostpointercapture',endStroke);work.addEventListener('pointerleave',()=>{if(pointer===null)$('held-tool').hidden=true;});
$('back-paw').onclick=()=>{if(drying)return;endStroke();detail=false;$('detail').hidden=true;$('overview').hidden=false;$('held-tool').hidden=true;rack.activate(null,cursor);render();note('כל ציפורן שומרת את הטיפול והציור שלה. בחרי ציפורן להמשך.');};
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>chooseTool(b.dataset.tool);
$('soap').onclick=()=>{if(drying)return;chooseTool('clean');pump();const r=work.getBoundingClientRect();effect('props/care/images/foam.png',r.x+r.width/2,r.y+r.height/2);note('מעט סבון, ועכשיו מברשת הניקוי על הלכלוך.');};
$('undo').onclick=()=>{if(drying)return;endStroke();if(current().undoStroke()){selectedSticker=-1;render();refreshHint();scheduleSave();}};
$('redo').onclick=()=>{if(drying)return;endStroke();if(current().redoStroke()){selectedSticker=-1;render();refreshHint();scheduleSave();}};
$('clear-paint').onclick=()=>{if(drying)return;endStroke();const n=current();n.checkpoint();n.paint.getContext('2d').clearRect(0,0,W,H);n.dried=false;selectedSticker=-1;render();refreshHint();scheduleSave();};
$('creative').onchange=()=>{$('creative-toggle').setAttribute('aria-pressed',String($('creative').checked));render();scheduleSave();};
$('creative-toggle').onclick=()=>{$('creative').checked=!$('creative').checked;$('creative').onchange();};
for(const b of document.querySelectorAll('[data-width]'))b.onclick=()=>{$('brush-size').value=b.dataset.width;for(const other of document.querySelectorAll('[data-width]'))other.setAttribute('aria-pressed',String(other===b));};
for(const b of document.querySelectorAll('[data-adjust]'))b.onclick=()=>{const input=$(b.dataset.adjust),[min,max]=b.dataset.adjust==='sticker-size'?[15,110]:[-180,180];input.value=Math.max(min,Math.min(max,Number(input.value)+Number(b.dataset.delta)));input.dispatchEvent(new Event('input'));input.dispatchEvent(new Event('change'));};
function rotateView(){endStroke();work.style.transform=`rotate(${$('view-rotation').value}deg) scale(${$('view-zoom').value})`;}
$('view-rotation').oninput=rotateView;$('view-zoom').oninput=rotateView;
for(const id of ['sticker-size','sticker-rotation']){
 $(id).addEventListener('pointerdown',()=>{if(current().stickers[selectedSticker]){current().checkpoint();stickerCheckpoint=true;}});
 $(id).oninput=()=>{if(drying)return;const n=current(),s=n.stickers[selectedSticker];if(!s)return;if(!stickerCheckpoint){n.checkpoint();stickerCheckpoint=true;}s[id==='sticker-size'?'size':'rotation']=Number($(id).value);n.rebuildDecorations();render();scheduleSave();};
 $(id).onchange=()=>{stickerCheckpoint=false;scheduleSave();};
}
$('remove-sticker').onclick=()=>{if(drying||selectedSticker<0)return;current().checkpoint();current().stickers.splice(selectedSticker,1);current().rebuildDecorations();selectedSticker=-1;render();scheduleSave();};
$('dryer').onclick=async()=>{if($('dryer').disabled||drying)return;endStroke();drying=true;$('held-tool').hidden=true;await rack.activate(null,cursor);const nail=current();nail.checkpoint();render();
 try{await dryAnimation($('drying'),fullPaw(),assets.layout,p=>$('dry-progress').value=p*100);nail.dried=true;tool='decorate';selectedSticker=-1;reaction();}finally{drying=false;render();refreshHint();scheduleSave();}
};
function downloadPhoto(){if(!ready||drying)return;fullPaw().toBlob(blob=>{if(!blob)return;const link=document.createElement('a'),href=URL.createObjectURL(blob);link.href=href;link.download='popa-nails.png';link.click();setTimeout(()=>URL.revokeObjectURL(href),2000);});}
$('photo').onclick=downloadPhoto;$('result-photo').onclick=downloadPhoto;
$('finish').onclick=async()=>{if(!nails.every(n=>n.dried)||drying)return;const amount=claimed?0:rewardOnce(sessionId);claimed=true;await flush();$('reward').textContent=amount?`איזה טיפול מושקע! ${amount} מטבעות נוספו לארנק.`:'המראה שלך נשמר. אפשר לצלם או להתחיל עיצוב חדש.';$('result-image').src=fullPaw().toDataURL();$('result').hidden=false;$('result-close').focus();reaction();};
$('result-close').onclick=()=>{$('result').hidden=true;$('finish').focus();};
async function newSession(){if(drying)return;endStroke();sessionId=crypto.randomUUID?.()??String(Date.now());claimed=false;nails=Array.from({length:4},()=>new NailSurface(assets));selected=0;selectedSticker=-1;color='pink';tool='remove';$('creative').checked=false;$('creative-toggle').setAttribute('aria-pressed','false');$('result').hidden=true;detail=false;$('overview').hidden=false;$('detail').hidden=true;rack.activate(null,cursor);render();refreshHint();await flush();}
$('new-session').onclick=newSession;$('result-new').onclick=newSession;
$('sound').onclick=()=>{sound=!sound;if(sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{sound=false;}}$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'צליל פעיל ♫':'צליל כבוי ♫';};
document.addEventListener('visibilitychange',()=>{if(document.hidden){endStroke();$('held-tool').hidden=true;flush();}});
window.addEventListener('pagehide',()=>{endStroke();flush();});
$('result').onkeydown=event=>{if(event.key==='Escape')$('result-close').click();if(event.key==='Tab'){const buttons=[...$('result').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
try{
 assets=await loadAssets();for(const [selector,key]of [['.dryer-front','frontRect'],['.dryer-opening','openingRect'],['.dryer-light','lightRect'],['.dryer-paw','pawRect']]){const [x,y,w,h]=assets.layout.dryer[key];Object.assign(document.querySelector(selector).style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});}
 rack=new BottleRack($('bottles'),assets,chooseColor);pump=mountSoap($('soap'));
 for(let i=0;i<4;i++){
  const target=document.createElement('button'),def=assets.layout.paw.nails[i];target.setAttribute('aria-label',`לטפל בציפורן ${i+1}`);target.dataset.nail=i;Object.assign(target.style,{left:def.center[0]/546*100+'%',top:def.center[1]/760*100+'%',width:def.size[0]/546*100+'%',height:def.size[1]/760*100+'%'});target.onclick=()=>selectNail(i);$('nail-targets').append(target);
  const thumb=document.createElement('button');thumb.dataset.index=i;thumb.setAttribute('aria-label',`ציפורן ${i+1}`);const c=canvas(64,96);thumb.append(c);thumb.onclick=()=>selectNail(i);$('nail-strip').append(thumb);
 }
 for(const kind of ['flower','heart','star','bow']){const button=document.createElement('button');button.dataset.sticker=kind;button.setAttribute('aria-label','מדבקת '+({flower:'פרח',heart:'לב',star:'כוכב',bow:'פפיון'})[kind]);const image=new Image();image.src=url(`props/stickers/images/sticker-${kind}.png`);image.alt='';button.append(image);button.onclick=()=>{if(drying)return;if(!current().dried){note('קודם מסיימים לצבוע ולייבש את הציפורן.');return;}endStroke();stickerKind=kind;tool='decorate';selectedSticker=-1;if(!detail)selectNail(selected);render();note('לחצי להנחת מדבקה, ואז גררי להזזה. גודל וסיבוב מופיעים ליד הכפה.');};$('stickers').append(button);}
 nails=Array.from({length:4},()=>new NailSurface(assets));sessionId=crypto.randomUUID?.()??String(Date.now());
 try{const saved=await readSession();if(saved?.version===1&&Array.isArray(saved.nails)&&saved.nails.length===4){const restored=await Promise.all(saved.nails.map(s=>NailSurface.restore(assets,s)));nails=restored;sessionId=typeof saved.id==='string'?saved.id:sessionId;claimed=!!saved.claimed;selected=Number.isInteger(saved.selected)&&saved.selected>=0&&saved.selected<4?saved.selected:0;color=COLORS.includes(saved.color)?saved.color:'pink';$('creative').checked=!!saved.creative;$('save-status').textContent='הטיפול שוחזר ✓';}else $('save-status').textContent='מוכנים לטיפול';}catch{$('save-status').textContent='השמירה לא זמינה — אפשר לשמור תמונה';}
 ready=true;$('creative-toggle').setAttribute('aria-pressed',String($('creative').checked));$('loading').hidden=true;render();refreshHint();
 // Readable state for end-to-end verification; no demo presets or automatic fills.
 window.manicure={get nails(){return nails;},get selected(){return selected;},get assets(){return assets;},get tool(){return tool;},flush,fullPaw,pointerCoords,selectNail};
 function blends(){if(ready&&nails.some(n=>n.previousShape&&performance.now()-n.shapeChanged<300))render();requestAnimationFrame(blends);}requestAnimationFrame(blends);
}catch(error){$('loading').textContent='לא הצלחנו לפתוח את פינת הטיפוח. נסי לרענן.';console.error(error);}
