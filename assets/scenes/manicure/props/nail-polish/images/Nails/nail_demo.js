const W=256,H=384,$=s=>document.querySelector(s),canvas=$('#work'),ctx=canvas.getContext('2d');
const surface=()=>{let c=document.createElement('canvas');c.width=W;c.height=H;return c};
const img={};let nails=[],selected=0,tool='remove',color='#f49fbc',pointer=null,last=null,drying=false,undo=[],ready=false;
const names={remove:'הסרת לק ישן',clean:'ניקוי',file:'שיוף ותיקון',paint:'צביעה חופשית',decorate:'קישוט'};
const alphaCount=c=>{let a=c.getContext('2d').getImageData(0,0,W,H).data,n=0;for(let i=3;i<a.length;i+=4)if(a[i]>128)n++;return n};
function newNail(){let n={shape:'broken',file:0,dried:false,paint:surface(),old:surface(),dirt:surface(),dec:surface()};n.old.getContext('2d').drawImage(img['Overlays/old_polish'],0,0);n.dirt.getContext('2d').drawImage(img['Overlays/dirt'],0,0);n.oldTotal=alphaCount(n.old);n.dirtTotal=alphaCount(n.dirt);return n}
const current=()=>nails[selected];
function clip(c,shape){let x=c.getContext('2d');x.globalCompositeOperation='destination-in';x.drawImage(img['Masks/'+shape],0,0);x.globalCompositeOperation='source-over'}
function clippedDraw(c,n){let t=surface();t.getContext('2d').drawImage(c,0,0);clip(t,n.shape);return t}
function coverage(n){let m=surface();m.getContext('2d').drawImage(img['Masks/'+n.shape],0,0);return alphaCount(n.paint)/Math.max(1,alphaCount(m))}
function render(){if(!ready)return;let n=current();ctx.clearRect(0,0,W,H);ctx.drawImage(img['States/'+n.shape],0,0);ctx.drawImage(clippedDraw(n.old,n),0,0);ctx.drawImage(clippedDraw(n.dirt,n),0,0);ctx.drawImage(clippedDraw(n.paint,n),0,0);if(n.dried)ctx.drawImage(img['Overlays/shine'],0,0);ctx.drawImage(clippedDraw(n.dec,n),0,0);
 $('#status').textContent=drying?'מייבשים…':names[tool]+' · כיסוי צבע '+Math.min(100,Math.round(coverage(n)*100))+'%'+(n.dried?' · יבש ומבריק':'');
 $('#dry').disabled=drying||n.dried||coverage(n)<.75;
 document.querySelectorAll('[data-nail]').forEach((b,i)=>b.classList.toggle('active',i===selected));document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
}
function snap(){let n=current();undo.push({selected,shape:n.shape,file:n.file,dried:n.dried,parts:['paint','old','dirt','dec'].map(k=>n[k].getContext('2d').getImageData(0,0,W,H))});if(undo.length>12)undo.shift()}
function coords(e){let r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function inMask(p){let m=surface();m.getContext('2d').drawImage(img['Masks/'+current().shape],0,0);if(p.x<0||p.y<0||p.x>=W||p.y>=H)return false;return m.getContext('2d').getImageData(p.x|0,p.y|0,1,1).data[3]>0}
function stroke(a,b){let n=current();if(drying)return;
 if(tool==='decorate'){if(!n.dried){$('#hint').textContent='קודם צובעים לפחות 75% ומייבשים';return}if(inMask(b)){let k=$('#sticker').value;n.dec.getContext('2d').drawImage(img['sticker/'+k],b.x-22,b.y-22,44,44);clip(n.dec,n.shape)}render();return}
 if(tool==='file'){if(Math.min(a.y,b.y)<110&&Math.max(a.x,b.x)>25&&Math.min(a.x,b.x)<231){n.file+=Math.hypot(b.x-a.x,b.y-a.y);n.shape=n.file>650?'clean':n.file>180?'partly_repaired':'broken';clip(n.paint,n.shape)}render();return}
 if(tool==='paint'&&n.dried){$('#hint').textContent='הלק יבש. אפסי את הציפורן כדי לצבוע מחדש';return}
 let target=tool==='paint'?n.paint:tool==='clean'?n.dirt:n.old;let x=target.getContext('2d');x.globalCompositeOperation=tool==='paint'?'source-over':'destination-out';x.strokeStyle=color;x.lineWidth=tool==='paint'?Number($('#size').value):65;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();x.globalCompositeOperation='source-over';if(tool==='paint')clip(target,n.shape);render();
}
canvas.addEventListener('pointerdown',e=>{if(!ready||drying)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);last=coords(e);snap();stroke({x:last.x-.01,y:last.y},last)});
canvas.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;let p=coords(e);if(tool!=='decorate')stroke(last,p);last=p});
function end(e){if(pointer!==e.pointerId)return;pointer=null;last=null;let n=current();if(tool==='clean'&&alphaCount(n.dirt)<n.dirtTotal*.06)$('#hint').textContent='נקי! אפשר להמשיך לשיוף';if(tool==='remove'&&alphaCount(n.old)<n.oldTotal*.06)$('#hint').textContent='הלק הישן הוסר';}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',()=>{pointer=null;last=null});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;$('#hint').textContent=tool==='file'?'העבירי את הפצירה מצד לצד בקצה העליון':tool==='paint'?'צבעי במשיכות חופשיות — הצבע נשאר בתוך המסכה':'גררי על הציפורן';render()});
document.querySelectorAll('[data-nail]').forEach((b,i)=>b.onclick=()=>{if(drying)return;selected=i;render()});
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;tool='paint';render()});
$('#undo').onclick=()=>{if(drying)return;let u=undo.pop();if(!u)return;selected=u.selected;let n=current();n.shape=u.shape;n.file=u.file;n.dried=u.dried;['paint','old','dirt','dec'].forEach((k,i)=>n[k].getContext('2d').putImageData(u.parts[i],0,0));render()};
$('#reset').onclick=()=>{if(drying)return;snap();nails[selected]=newNail();render()};
$('#dry').onclick=async()=>{let n=current();if(drying||coverage(n)<.75)return;snap();drying=true;canvas.classList.add('drying');render();await new Promise(r=>setTimeout(r,1800));n.dried=true;drying=false;canvas.classList.remove('drying');tool='decorate';$('#hint').textContent='יבש! לחצי על הציפורן להוספת מדבקה';render()};
$('#preset').onchange=e=>{if(drying)return;snap();let n=current();n.old.getContext('2d').clearRect(0,0,W,H);n.dirt.getContext('2d').clearRect(0,0,W,H);n.paint.getContext('2d').clearRect(0,0,W,H);n.dec.getContext('2d').clearRect(0,0,W,H);n.dried=false;n.shape='clean';n.file=700;let p=e.target.value;
 if(['broken','partly_repaired'].includes(p)){n.shape=p;n.file=p==='broken'?0:250}
 if(p==='dirty')n.dirt.getContext('2d').drawImage(img['Overlays/dirt'],0,0);
 if(p==='old_polish')n.old.getContext('2d').drawImage(img['Overlays/old_polish'],0,0);
 if(p==='half'||p==='full'){let x=n.paint.getContext('2d');x.fillStyle=color;x.fillRect(0,0,p==='half'?W/2:W,H);clip(n.paint,n.shape)}
 render()};
$('#save').onclick=()=>{let a=document.createElement('a');a.download='popa-nail.png';a.href=canvas.toDataURL();a.click()};
Promise.all(Object.entries(ASSETS).map(([k,src])=>new Promise((resolve,reject)=>{let i=new Image;i.onload=()=>{img[k]=i;resolve()};i.onerror=reject;i.src=src}))).then(()=>{nails=Array.from({length:4},newNail);ready=true;render();window.nailDemo={get current(){return current()},get images(){return img},get ready(){return ready},coverage:()=>coverage(current())};}).catch(()=>$('#status').textContent='טעינת האיורים נכשלה');
