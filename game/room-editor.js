// Whole-object placement only: original illustrations and internal prop rigs stay intact.
export function mountRoomEditor({room,layout,place,setEditing}) {
  const key='popa.home-layout.v1', clone=value=>structuredClone(value);
  const defaults=clone(layout), profiles=['wide','portrait'];
  const mode=()=>innerWidth<=700?'portrait':'wide';
  const ids=[...layout.items.map(item=>item.id),'rug'];
  const labels=Object.fromEntries([...layout.items.map(item=>[item.id,item.label]),['rug','השטיח']]);
  const element=id=>id==='rug'?document.getElementById('buy-rug'):room.querySelector(`[data-furniture="${id}"]`);
  for(const profile of profiles)layout[profile].layers=Object.fromEntries(ids.map(id=>[id,Number(element(id).style.zIndex)||0]));
  for(const profile of profiles)defaults[profile].layers=clone(layout[profile].layers);
  function validate(data){
    if(data?.version!==1||data.scene!=='home')throw Error('נדרש קובץ סידור החדר של פופה');
    const result={};
    for(const profile of profiles){let source=data[profile];
      if(!source||JSON.stringify(source.canvas)!==JSON.stringify(defaults[profile].canvas))throw Error('מידות החדר אינן תואמות');
      // Upgrade existing whole-window drafts without losing other furniture positions.
      if(!source.items?.['window-rod'] && source.items?.window){
        source=clone(source);
        const r=source.items.window;
        if(!Array.isArray(r)||r.length!==4||r.some(n=>typeof n!=='number'||!Number.isFinite(n)))throw Error('מיקום החלון אינו תקין');
        const scale=Math.min(r[2]/800,r[3]/600),ox=r[0]+(r[2]-800*scale)/2,oy=r[1]+r[3]-600*scale;
        const pieces={'window':[140,80,520,365*1.0788381742738589],'window-rod':[20,25,760,90*1.1428571428571428],'window-curtain-left':[15,55,210,495*.65625],'window-curtain-right':[575,55,210,495*.6268656716417911]};
        source.layers??={};
        for(const [id,[x,y,w,h]]of Object.entries(pieces)){source.items[id]=[ox+x*scale,oy+y*scale,w*scale,h*scale];source.layers[id]=source.layers.window??0;}
      }
      const target=clone(defaults[profile]);
      for(const id of ids){const rect=id==='rug'?source.rug:source.items?.[id];
        if(!Array.isArray(rect)||rect.length!==4||rect.some(n=>typeof n!=='number'||!Number.isFinite(n))||rect[0]<0||rect[1]<0||rect[2]<5||rect[3]<5||rect[2]>target.canvas[0]*2||rect[3]>target.canvas[1]*2||rect[0]>target.canvas[0]||rect[1]>target.canvas[1])throw Error('מיקום או גודל אינם תקינים');
        if(id==='rug')target.rug=[...rect];else target.items[id]=[...rect];
        const z=source.layers?.[id];if(!Number.isInteger(z)||z<0||z>6)throw Error('שכבה אינה תקינה');target.layers[id]=z;
      }result[profile]=target;
    }return result;
  }
  function data(){return {version:1,scene:'home',background:layout.background,wide:clone(layout.wide),portrait:clone(layout.portrait)};}
  let storageWarning='';try{const saved=localStorage.getItem(key);if(saved)Object.assign(layout,validate(JSON.parse(saved)));}catch{storageWarning='לא שוחזרה שמירה קודמת. אפשר לטעון קובץ מיקומים.';}
  const toggle=document.getElementById('edit-room'),panel=document.createElement('section');
  panel.className='room-editor';panel.dir='rtl';panel.hidden=true;panel.setAttribute('aria-label','עריכת מיקום החפצים');
  panel.innerHTML=`<header><strong>סידור החדר</strong><button id="room-edit-done">סיום</button></header><p id="room-edit-profile"></p><label>חפץ<select id="room-edit-item">${ids.map(id=>`<option value="${id}">${labels[id]}</option>`).join('')}</select></label><div class="room-edit-fields">${[['x','מיקום X'],['y','מיקום Y'],['width','רוחב'],['height','גובה'],['layer','שכבה (0–6)']].map(([id,label])=>`<label>${label}<input id="room-edit-${id}" type="number" step="1" min="${['width','height'].includes(id)?5:0}" ${id==='layer'?'max="6"':''}></label>`).join('')}</div><label><input id="room-edit-ratio" type="checkbox" checked> שמירה על יחס גודל</label><div class="room-edit-actions"><button id="room-edit-undo">ביטול פעולה</button><button id="room-edit-reset">איפוס החפץ</button><button id="room-edit-save">שמירה וסיום</button><button id="room-edit-export">הורדת הסידור</button></div><label>טעינת סידור מקובץ<input id="room-edit-import" type="file" accept=".json,application/json"></label><p id="room-edit-status" role="status" aria-live="polite"></p>`;
  room.parentElement.append(panel);const $=id=>panel.querySelector('#room-edit-'+id);
  let active=false,selected=ids[0],drag=null,history=[],lastMode=mode();
  function rect(){return selected==='rug'?layout[mode()].rug:layout[mode()].items[selected];}
  function applyLayers(){for(const id of ids)element(id).style.zIndex=layout[mode()].layers[id];}
  function fields(){const r=rect();['x','y','width','height'].forEach((key,i)=>$(key).value=Math.round(r[i]*10)/10);$('layer').value=layout[mode()].layers[selected];$('item').value=selected;$('profile').textContent=mode()==='wide'?'פריסה למסך רחב · גררי חפץ או כווני מספרים':'פריסה לטלפון · גררי חפץ או כווני מספרים';for(const id of ids)element(id).classList.toggle('room-edit-selected',active&&id===selected);$('undo').disabled=!history.length;}
  function remember(){history.push({wide:clone(layout.wide),portrait:clone(layout.portrait)});if(history.length>50)history.shift();}
  function save(){try{localStorage.setItem(key,JSON.stringify(data()));$('status').textContent='הסידור נשמר בדפדפן. אפשר להוריד קובץ ולשלוח לי.';}catch{$('status').textContent='השמירה בדפדפן אינה זמינה. הורידי קובץ כדי לשמור.';}}
  function redraw(){place();applyLayers();fields();}
  function close(){if(!active)return;active=false;drag=null;save();panel.hidden=true;room.classList.remove('editing-room');toggle.setAttribute('aria-pressed','false');toggle.textContent='סידור החדר';setEditing(false);fields();}
  toggle.disabled=false;toggle.onclick=()=>{if(active){close();return;}active=true;panel.hidden=false;room.classList.add('editing-room');toggle.setAttribute('aria-pressed','true');toggle.textContent='סיום סידור';setEditing(true);fields();};
  $('done').onclick=close;$('save').onclick=close;
  $('item').onchange=()=>{selected=$('item').value;fields();};
  room.addEventListener('click',event=>{if(active){event.preventDefault();event.stopImmediatePropagation();}},true);
  room.addEventListener('pointerdown',event=>{if(!active)return;event.preventDefault();event.stopImmediatePropagation();const target=event.target.closest('.room-item,.rug-object');if(!target||event.button!==0)return;selected=target.dataset.furniture||'rug';fields();remember();const box=room.getBoundingClientRect(),r=rect(),canvas=layout[mode()].canvas;drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,left:r[0],top:r[1],scaleX:canvas[0]/box.width,scaleY:canvas[1]/box.height,profile:mode()};room.setPointerCapture(event.pointerId);},true);
  room.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.pointer)return;const [w,h]=layout[mode()].canvas,r=rect();r[0]=Math.round(Math.max(0,Math.min(w-r[2]*.1,drag.left+(event.clientX-drag.x)*drag.scaleX)));r[1]=Math.round(Math.max(0,Math.min(h-r[3]*.1,drag.top+(event.clientY-drag.y)*drag.scaleY)));redraw();});
  function end(event){if(!drag||drag.pointer!==event.pointerId)return;drag=null;save();}
  room.addEventListener('pointerup',end);room.addEventListener('pointercancel',end);room.addEventListener('lostpointercapture',end);
  ['x','y','width','height','layer'].forEach((key,i)=>$(key).onchange=()=>{
    const value=Number($(key).value),canvas=layout[mode()].canvas,r=rect();if(!Number.isFinite(value)||value<(['width','height'].includes(key)?5:0)||value>(key==='layer'?6:canvas[i%2]*(i>1?2:1))||(key==='layer'&&!Number.isInteger(value))){fields();return;}
    if(i===2||i===3){const other=i===2?3:2,next=r[other]*value/r[i];if($('ratio').checked&&(next<5||next>canvas[other%2]*2)){fields();return;}}
    remember();if(key==='layer')layout[mode()].layers[selected]=value;else {if($('ratio').checked&&i>1){const other=i===2?3:2;r[other]=r[other]*value/r[i];}r[i]=value;}redraw();save();
  });
  $('undo').onclick=()=>{const previous=history.pop();if(previous){Object.assign(layout,previous);redraw();save();}};
  $('reset').onclick=()=>{remember();if(selected==='rug')layout[mode()].rug=clone(defaults[mode()].rug);else layout[mode()].items[selected]=clone(defaults[mode()].items[selected]);layout[mode()].layers[selected]=defaults[mode()].layers[selected];redraw();save();};
  $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='popa-room-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='שלחי לי את קובץ הסידור כדי לשלב אותו בפרויקט.';};
  $('import').onchange=async()=>{try{const file=$('import').files[0];if(!file)return;if(file.size>100000)throw Error('קובץ גדול מדי');const result=validate(JSON.parse(await file.text()));remember();Object.assign(layout,result);redraw();save();}catch(error){$('status').textContent='לא נטען: '+error.message;}finally{$('import').value='';}};
  addEventListener('resize',()=>{if(lastMode!==mode()){drag=null;lastMode=mode();}redraw();});
  redraw();if(storageWarning)$('status').textContent=storageWarning;
  return {close,applyLayers};
}
