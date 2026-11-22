// Placement drafts only. The game keeps its approved character until a look is integrated.
const CATALOG = './assets/characters/popa/outfits/catalog.json?v=cloud-body-5';
const clone = value => structuredClone(value);
const attachmentLabels = {body:'גוף',head:'ראש',left_arm:'יד שמאל',right_arm:'יד ימין',foot_left:'רגל שמאל',foot_right:'רגל ימין'};
const names = {dress_front:'שמלה קדמית',dress_back:'שמלה אחורית',underskirt:'חצאית תחתונה',hat_body:'כובע',hat_dome:'כובע מדוזה',hat_flower:'פרח לכובע',hat_leaves:'עלי כובע',coat_body:'מעיל',pajama_body:'חולצת פיג׳מה',pants_left:'מכנס שמאל',pants_right:'מכנס ימין',dress_body:'שמלה',shirt_body:'חולצה',sleeve_left:'שרוול שמאל',sleeve_right:'שרוול ימין',collar_left:'צווארון שמאל',collar_right:'צווארון ימין',boot_left:'מגף שמאל',boot_right:'מגף ימין',slipper_left:'נעל שמאל',slipper_right:'נעל ימין',bag_body:'תיק',bag_handle:'ידית תיק',bag_straw:'קשית',chest_bow:'פפיון לחזה',hair_bow_left:'סרט שמאל',hair_bow_right:'סרט ימין',hair_bow_center:'מרכז הסרט',hood:'ברדס',hood_bow:'סרט לברדס',star_charm:'כוכב',eye_left:'עין כובע שמאל',eye_right:'עין כובע ימין',tentacle_left:'זרוע שמאל',tentacle_center:'זרוע אמצע',tentacle_right:'זרוע ימין'};
export async function mountOutfitEditor({character,groups,stop,play}) {
  const response = await fetch(CATALOG);
  if (!response.ok) throw new Error('Outfit catalogue unavailable');
  const catalog = await response.json();
  const initial = look => ({id:look.id,hiddenBase:['shirt','pinafore','flower'],parts:clone(look.parts),fittingStatus:'draft'});
  const defaults = Object.fromEntries(catalog.looks.map(look => [look.id,initial(look)]));
  const rigLayer=id=>Number(groups.get(id).closest('.cat-layer').style.zIndex);
  const bodyLayer=rigLayer('torso'),headLayer=rigLayer('head');
  const armLayer=Math.max(rigLayer('left_arm'),rigLayer('right_arm'));
  const frontLayer=Math.max(...[...groups.values()].map(group=>Number(group.closest('.cat-layer').style.zIndex)))+1;
  const layerPresets=[
    {id:'behind-body',label:'מאחורי הגוף',value:bodyLayer-1},
    {id:'under-head',label:'מעל הגוף ומתחת לראש ולידיים',value:armLayer-1},
    {id:'over-arms',label:'מעל הידיים ומתחת לראש',value:headLayer-1},
    {id:'over-head',label:'מעל הראש והפנים',value:frontLayer},
  ];
  const drafts = clone(defaults), history = [];
  let lookId=catalog.looks[0].id, partId=drafts[lookId].parts[0].id, mounted=[], drag=null, storageAvailable=true;
  const storageKey='popa.outfit-placements.v1';
  function validate(data) {
    if(data.version!==1 || data.character!=='popa' || JSON.stringify(data.canvas)!=='[440,475]' || !Array.isArray(data.looks) || !data.looks.length) throw Error('הקובץ אינו קובץ מיקומים של פופה');
    const ids=new Set();
    for(const look of data.looks){
      const reference=defaults[look.id];
      // Keep existing fitted garments when upgrading the old cloud collection.
      if(look.id==='cloud' && Array.isArray(look.parts) && look.parts.some(p=>['slipper_left','slipper_right','collar_left','collar_right'].includes(p.id))){
        const legacyIds=['pajama_body','collar_left','collar_right','sleeve_left','sleeve_right','hat_body','star_charm','slipper_left','slipper_right'];
        if(look.parts.length!==9 || new Set(look.parts.map(p=>p.id)).size!==9 || look.parts.some(p=>!legacyIds.includes(p.id)||p.asset!==`assets/characters/popa/outfits/cloud/parts/${p.id}.png`))throw Error('לוק ענן ישן אינו תקין');
        look.parts=reference.parts.map(p=>clone(look.parts.find(old=>old.id===p.id)??p));
      }

      if(!reference || ids.has(look.id) || !Array.isArray(look.parts) || look.parts.length!==reference.parts.length || !Array.isArray(look.hiddenBase) || look.hiddenBase.some(id=>!['shirt','pinafore','flower'].includes(id))) throw Error('רשימת הלוקים אינה תקינה');
      if(!look.hiddenBase.includes('flower'))look.hiddenBase.push('flower');
      ids.add(look.id);const parts=new Set();
      for(const part of look.parts){
        const original=reference.parts.find(p=>p.id===part.id);
        if(!original || parts.has(part.id) || part.asset!==original.asset || !Object.hasOwn(attachmentLabels,part.attachment) || typeof part.visible!=='boolean' || typeof part.locked!=='boolean') throw Error('חלק לא מוכר בקובץ');
        parts.add(part.id);
        for(const key of ['x','y','width','height','rotation','layer']) if(typeof part[key]!=='number' || !Number.isFinite(part[key]) || Math.abs(part[key])>5000 || (['width','height'].includes(key)&&part[key]<1)) throw Error('ערך מיקום או גודל אינו תקין');
      }
    }
    return data;
  }
  try {const saved=localStorage.getItem(storageKey);if(saved) for(const look of validate(JSON.parse(saved)).looks) drafts[look.id]=look;}catch(error){storageAvailable=false;console.warn('Outfit draft not restored',error);}
  const panel=document.createElement('aside');panel.className='outfit-panel';panel.dir='rtl';panel.setAttribute('aria-label','מיקום הלוקים של פופה');
  panel.innerHTML=`<header><h1>הלוקים של פופה</h1><a href="index.html?edit=1">לאנימציה של פופה</a> · <a href="studio.html">לאביזרים</a></header>
  <p>בחרי חלק וגררי אותו על פופה. בזמן גרירה האנימציה נעצרת. אלה מיקומי טיוטה, לפני שילוב במשחק.</p>
  <label>לוק <select id="outfit-look">${catalog.looks.map(l=>`<option value="${l.id}">${l.label}</option>`).join('')}</select></label>
  <div class="outfit-parts" id="outfit-parts" role="group" aria-label="חלקי הלוק"></div>
  <h2 id="outfit-part-title"></h2><div class="outfit-fields">${[['x','מיקום X'],['y','מיקום Y'],['width','רוחב'],['height','גובה'],['rotation','סיבוב °'],['layer','שכבה']].map(([id,label])=>`<label>${label}<input id="outfit-${id}" type="number" step="${id==='layer'?'1':'0.1'}" max="5000" min="${['width','height'].includes(id)?'1':'-5000'}" data-field="${id}"></label>`).join('')}</div>
  <label>שכבה ביחס לפופה <select id="outfit-layer-preset"><option value="custom">מיקום מותאם לפי מספר השכבה</option>${layerPresets.map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
  <p class="outfit-layer-guide">סדר השכבות מאחור לפנים: גוף ← חולצה ← ידיים ← ראש ← כובע. בחרי את המיקום הרצוי לכל חלק; המספר מאפשר כיוון נוסף.</p>
  <label class="outfit-check"><input id="outfit-ratio" type="checkbox" checked> שמירה על יחס גובה ורוחב</label>
  <label>תנועה יחד עם <select id="outfit-attachment">${Object.entries(attachmentLabels).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>
  <div class="outfit-row"><label><input id="outfit-visible" type="checkbox"> הצגת החלק</label><label><input id="outfit-locked" type="checkbox"> נעילה</label></div>
  <details><summary>הבגדים המקוריים של פופה</summary><p>הסתירי אותם כדי להתאים את הלוק החדש.</p>${[['shirt','חולצה'],['pinafore','סרפן']].map(([id,label])=>`<label class="outfit-check"><input type="checkbox" data-base="${id}"> ${label}</label>`).join('')}</details>
  <div class="outfit-row"><button id="outfit-stop">עמידה לעריכה</button><button data-preview="walk">הליכה</button><button data-preview="wave">נפנוף</button></div>
  <div class="outfit-row"><button id="outfit-undo">ביטול פעולה</button><button id="outfit-reset">איפוס החלק</button></div>
  <div class="outfit-row"><button id="outfit-export">הורדת הלוק</button><button id="outfit-export-all">הורדת כל הלוקים</button></div>
  <label class="outfit-import">טעינת קובץ מיקומים <input id="outfit-import" type="file" accept=".json,application/json"></label>
  <p id="outfit-status" role="status" aria-live="polite"></p>`;
  document.body.append(panel);
  const $=id=>panel.querySelector('#outfit-'+id), current=()=>drafts[lookId], part=()=>current().parts.find(p=>p.id===partId);
  function envelope(looks){return {version:1,character:'popa',canvas:[440,475],assembly:'assets/characters/popa/assembly.json',looks:clone(looks)};}
  function message(text){$('status').textContent=text;}
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(envelope(Object.values(drafts))));message('המיקומים נשמרו בדפדפן. הורידי קובץ ושלחי לי אותו בסיום.');}catch{message('השמירה בדפדפן אינה זמינה. הורידי קובץ כדי לשמור את המיקומים.');}}
  function remember(){history.push(clone(drafts));if(history.length>60)history.shift();}
  function updateImage(entry){
    const p=entry.part,original=defaults[lookId].parts.find(item=>item.id===p.id);
    const [nw,nh]=original.naturalSize,[aw,ah]=original.artworkSize??original.naturalSize,[dx,dy]=original.artworkOffset??[0,0];
    const sx=p.width/nw,sy=p.height/nh;
    Object.assign(entry.outer.style,{zIndex:String(p.layer),display:p.visible?'':'none'});
    // Rotate around the original logical centre so existing placements stay exact.
    Object.assign(entry.image.style,{left:`${p.x-p.width/2+dx*sx}px`,top:`${p.y-p.height/2+dy*sy}px`,width:`${aw*sx}px`,height:`${ah*sy}px`,transformOrigin:`${(nw/2-dx)*sx}px ${(nh/2-dy)*sy}px`,transform:`rotate(${p.rotation}deg)`});
    entry.image.classList.toggle('outfit-selected',p.id===partId);entry.image.style.cursor=p.locked?'not-allowed':'grab';
  }
  function syncFields(){const p=part();$('layer-preset').value=layerPresets.find(preset=>preset.value===p.layer)?.id??'custom';$('part-title').textContent=names[p.id]??p.id;panel.querySelectorAll('[data-field]').forEach(input=>input.value=String(Math.round(p[input.dataset.field]*100)/100));$('attachment').value=p.attachment;$('visible').checked=p.visible;$('locked').checked=p.locked;panel.querySelectorAll('[data-base]').forEach(input=>input.checked=!current().hiddenBase.includes(input.dataset.base));panel.querySelectorAll('[data-piece]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.piece===partId)));mounted.forEach(updateImage);$('undo').disabled=!history.length;}
  function applyBase(){for(const id of ['shirt','pinafore','flower'])groups.get(id).style.visibility=current().hiddenBase.includes(id)?'hidden':'';}
  function render(){
    stop();mounted.forEach(m=>m.outer.remove());mounted=[];
    $('parts').replaceChildren();
    for(const p of current().parts){
      const button=document.createElement('button');button.dataset.piece=p.id;button.title=names[p.id]??p.id;button.setAttribute('aria-label',button.title);
      const thumbnail=document.createElement('img');thumbnail.src=p.asset+'?artwork=5';thumbnail.alt='';button.append(thumbnail);button.addEventListener('click',()=>{partId=p.id;syncFields();});$('parts').append(button);
      const outer=document.createElement('div');outer.className='cat-group outfit-layer';
      const body=document.createElement('div'),head=document.createElement('div'),limb=document.createElement('div');for(const el of [body,head,limb])el.className='cat-group';
      const image=document.createElement('img');image.className='outfit-image';image.alt=names[p.id]??p.id;image.src=p.asset+'?artwork=5';image.draggable=false;image.dataset.outfitPart=p.id;
      limb.append(image);head.append(limb);body.append(head);outer.append(body);character.append(outer);
      mounted.push({part:p,outer,body,head,limb,image});
      image.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;stop();partId=p.id;syncFields();if(p.locked)return;
        event.preventDefault();remember();const rect=character.getBoundingClientRect();drag={pointer:event.pointerId,startX:event.clientX,startY:event.clientY,x:p.x,y:p.y,scaleX:440/rect.width,scaleY:475/rect.height,part:p};character.setPointerCapture(event.pointerId);
      });
    }
    applyBase();syncFields();
  }
  character.addEventListener('pointermove',event=>{if(!drag||drag.pointer!==event.pointerId)return;drag.part.x=Math.round((drag.x+(event.clientX-drag.startX)*drag.scaleX)*10)/10;drag.part.y=Math.round((drag.y+(event.clientY-drag.startY)*drag.scaleY)*10)/10;syncFields();});
  function endDrag(event){if(!drag||drag.pointer!==event.pointerId)return;drag=null;persist();syncFields();}
  character.addEventListener('pointerup',endDrag);character.addEventListener('pointercancel',endDrag);character.addEventListener('lostpointercapture',endDrag);
  $('look').addEventListener('change',()=>{lookId=$('look').value;partId=current().parts[0].id;render();});
  panel.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('change',()=>{
    const key=input.dataset.field,value=Number(input.value);if(!Number.isFinite(value)||Math.abs(value)>5000||(['width','height'].includes(key)&&value<1)){syncFields();return;}
    stop();remember();const p=part();if($('ratio').checked&&['width','height'].includes(key)){const other=key==='width'?'height':'width';p[other]=p[other]*value/p[key];}p[key]=value;syncFields();persist();
  }));
  $('layer-preset').addEventListener('change',()=>{const preset=layerPresets.find(preset=>preset.id===$('layer-preset').value);if(!preset)return;stop();remember();part().layer=preset.value;syncFields();persist();});
  for(const key of ['attachment','visible','locked'])$(key).addEventListener('change',()=>{stop();remember();part()[key]=key==='attachment'?$(key).value:$(key).checked;syncFields();persist();});
  panel.querySelectorAll('[data-base]').forEach(input=>input.addEventListener('change',()=>{remember();const hidden=new Set(current().hiddenBase);input.checked?hidden.delete(input.dataset.base):hidden.add(input.dataset.base);current().hiddenBase=[...hidden];applyBase();persist();}));
  $('stop').onclick=stop;panel.querySelectorAll('[data-preview]').forEach(button=>button.onclick=()=>play(button.dataset.preview));
  $('undo').onclick=()=>{const previous=history.pop();if(!previous)return;Object.assign(drafts,previous);render();persist();};
  $('reset').onclick=()=>{remember();Object.assign(part(),clone(defaults[lookId].parts.find(p=>p.id===partId)));render();persist();};
  function download(all){const blob=new Blob([JSON.stringify(envelope(all?Object.values(drafts):[current()]),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=all?'popa-all-look-placements.json':`popa-look-${lookId}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('הקובץ מוכן. שלחי לי אותו כדי שאשלב את המיקומים שאישרת.');}
  $('export').onclick=()=>download(false);$('export-all').onclick=()=>download(true);
  $('import').onchange=async()=>{try{const file=$('import').files[0];if(!file)return;if(file.size>500000)throw Error('קובץ גדול מדי; נדרש קובץ מיקומים בלבד');const data=validate(JSON.parse(await file.text()));remember();for(const look of data.looks)drafts[look.id]=clone(look);lookId=data.looks[0].id;partId=current().parts[0].id;$('look').value=lookId;render();persist();}catch(error){message(`לא נטען: ${error.message}`);}finally{$('import').value='';}};
  // Follow the exact transforms of the original rig, including animation transition frames.
  let alive=true;
  function follow(){if(!alive)return;const bodySource=groups.get('head').closest('.cat-body-motion'),headSource=groups.get('flower').closest('.cat-head-motion');const bodyStyle=getComputedStyle(bodySource),headStyle=getComputedStyle(headSource);
    for(const m of mounted){const attachment=m.part.attachment,isFoot=attachment.startsWith('foot_');for(const [el,source]of [[m.body,isFoot?null:bodyStyle],[m.head,attachment==='head'?headStyle:null],[m.limb,['left_arm','right_arm','foot_left','foot_right'].includes(attachment)?getComputedStyle(groups.get(attachment)):null]]){el.style.transform=source?.transform??'none';if(source)el.style.transformOrigin=source.transformOrigin;}}
    requestAnimationFrame(follow);
  }
  addEventListener('pagehide',()=>{alive=false;});
  addEventListener('pageshow',event=>{if(event.persisted){alive=true;follow();}});render();follow();
  message(storageAvailable?'בחרי חלק כדי להתחיל. טיוטות נשמרות בנפרד לכל לוק.':'לא שוחזרה טיוטה. אפשר לטעון קובץ מיקומים או להתחיל מחדש.');
}
