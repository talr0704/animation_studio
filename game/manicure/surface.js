export const W=256,H=384;
export function canvas(w=W,h=H){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const context=c=>c.getContext('2d',{willReadFrequently:true});
const imageData=c=>context(c).getImageData(0,0,W,H);
function decode(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
export class NailSurface{
 constructor(assets){this.assets=assets;this.shape='broken';this.repair=0;this.dried=false;this.stickers=[];this.undo=[];this.redo=[];this.paint=canvas();this.old=canvas();this.dirt=canvas();this.decoration=canvas();this.preview=canvas();this.maskCache={};
  context(this.old).drawImage(assets.images['nails/overlays/old-polish.png'],0,0);context(this.dirt).drawImage(assets.images['nails/overlays/dirt.png'],0,0);this.clip(this.old);this.clip(this.dirt);this.oldTotal=this.count(this.old);this.dirtTotal=this.count(this.dirt);
 }
 mask(shape=this.shape){return this.assets.images[`nails/masks/${shape}.png`];}
 maskData(){if(!this.maskCache[this.shape]){const c=canvas();context(c).drawImage(this.mask(),0,0);this.maskCache[this.shape]=imageData(c).data;}return this.maskCache[this.shape];}
 inside(p){return p.x>=0&&p.y>=0&&p.x<W&&p.y<H&&this.maskData()[((p.y|0)*W+(p.x|0))*4+3]>128;}
 clip(layer){const ctx=context(layer);ctx.globalCompositeOperation='destination-in';ctx.drawImage(this.mask(),0,0);ctx.globalCompositeOperation='source-over';}
 count(layer){const data=imageData(layer).data,mask=this.maskData();let n=0;for(let i=3;i<data.length;i+=4)if(mask[i]>128&&data[i]>32)n++;return n;}
 coverage(){const data=this.maskData();let n=0;for(let i=3;i<data.length;i+=4)if(data[i]>128)n++;return this.count(this.paint)/Math.max(1,n);}
 remaining(layer){return this.count(this[layer])/Math.max(1,layer==='old'?this.oldTotal:this.dirtTotal);}
 phase(){return this.remaining('old')>.08?'remove':this.remaining('dirt')>.08?'clean':this.repair<this.assets.layout.repair.completeDistance?'file':!this.dried?'paint':'decorate';}
 snapshot(){return {shape:this.shape,repair:this.repair,dried:this.dried,stickers:structuredClone(this.stickers),layers:['paint','old','dirt'].map(k=>imageData(this[k]))};}
 checkpoint(){this.undo.push(this.snapshot());if(this.undo.length>12)this.undo.shift();this.redo=[];}
 applySnapshot(s){this.shape=s.shape;this.repair=s.repair;this.dried=s.dried;this.stickers=structuredClone(s.stickers);['paint','old','dirt'].forEach((k,i)=>context(this[k]).putImageData(s.layers[i],0,0));this.rebuildDecorations();}
 undoStroke(){if(!this.undo.length)return false;this.redo.push(this.snapshot());this.applySnapshot(this.undo.pop());return true;}
 redoStroke(){if(!this.redo.length)return false;this.undo.push(this.snapshot());this.applySnapshot(this.redo.pop());return true;}
 stroke(tool,a,b,{color='#f49fbc',width=35}={}){
  if(tool==='file'){
   const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/3));let valid=0;
   for(let i=0;i<steps;i++){const t=(i+.5)/steps,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(p.y<this.assets.layout.repair.edgeY&&this.inside(p))valid++;}
   const before=this.shape;this.repair=Math.min(this.assets.layout.repair.completeDistance,this.repair+distance*valid/steps);this.shape=this.repair>=this.assets.layout.repair.completeDistance?'clean':this.repair>=this.assets.layout.repair.partialDistance?'partly-repaired':'broken';
   if(before!==this.shape){this.previousShape=before;this.shapeChanged=performance.now();this.clip(this.paint);this.rebuildDecorations();}return;
  }
  const target=tool==='paint'?this.paint:tool==='clean'?this.dirt:this.old,ctx=context(target);ctx.globalCompositeOperation=tool==='paint'?'source-over':'destination-out';ctx.lineWidth=tool==='paint'?width:68;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=tool==='paint'?color:'#000';
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(a.x===b.x&&a.y===b.y){ctx.beginPath();ctx.arc(b.x,b.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fillStyle=tool==='paint'?color:'#000';ctx.fill();}
  ctx.globalCompositeOperation='source-over';if(tool==='paint'){this.clip(target);this.dried=false;}
 }
 render(target=this.preview,{blend=true}={}){
  const ctx=context(target);ctx.clearRect(0,0,W,H);const fraction=blend&&this.previousShape?Math.min(1,(performance.now()-this.shapeChanged)/260):1;
  if(fraction<1){ctx.drawImage(this.assets.images[`nails/states/${this.previousShape}.png`],0,0);ctx.globalAlpha=fraction;}
  ctx.drawImage(this.assets.images[`nails/states/${this.shape}.png`],0,0);ctx.globalAlpha=1;
  for(const layer of [this.old,this.dirt,this.paint])ctx.drawImage(layer,0,0);
  if(this.dried){const shine=canvas();context(shine).drawImage(this.assets.images['nails/overlays/shine.png'],0,0);this.clip(shine);ctx.drawImage(shine,0,0);}
  ctx.drawImage(this.decoration,0,0);return target;
 }
 rebuildDecorations(){const ctx=context(this.decoration);ctx.clearRect(0,0,W,H);for(const s of this.stickers){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rotation*Math.PI/180);const img=this.assets.images[`props/stickers/images/sticker-${s.kind}.png`];ctx.drawImage(img,-s.size/2,-s.size/2,s.size,s.size);ctx.restore();}this.clip(this.decoration);}
 addSticker(kind,p){if(!this.inside(p))return false;this.stickers.push({kind,x:p.x,y:p.y,size:60,rotation:0});this.rebuildDecorations();return true;}
 moveSticker(index,p){if(!this.stickers[index]||!this.inside(p))return false;Object.assign(this.stickers[index],p);this.rebuildDecorations();return true;}
 async serialize(){return {shape:this.shape,repair:this.repair,dried:this.dried,coverage:this.coverage(),stickers:structuredClone(this.stickers),oldTotal:this.oldTotal,dirtTotal:this.dirtTotal,layers:Object.fromEntries(['paint','old','dirt'].map(k=>[k,this[k].toDataURL('image/png')]))};}
 static async restore(assets,s){
  if(!s||!['broken','partly-repaired','clean'].includes(s.shape)||!Number.isFinite(s.repair)||s.repair<0||s.repair>100000||!Array.isArray(s.stickers)||s.stickers.length>60)throw Error('Invalid nail save');
  const nail=new NailSurface(assets);nail.shape=s.shape;nail.repair=s.repair;nail.dried=!!s.dried;nail.stickers=s.stickers.filter(v=>['flower','heart','star','bow'].includes(v.kind)&&['x','y','size','rotation'].every(k=>Number.isFinite(v[k]))).map(v=>({...v,size:Math.min(110,Math.max(15,v.size)),rotation:Math.max(-180,Math.min(180,v.rotation))}));
  for(const k of ['paint','old','dirt']){if(typeof s.layers?.[k]!=='string'||!s.layers[k].startsWith('data:image/png;base64,')||s.layers[k].length>1500000)throw Error('Invalid layer');const img=await decode(s.layers[k]);if(img.width!==W||img.height!==H)throw Error('Invalid frame');context(nail[k]).clearRect(0,0,W,H);context(nail[k]).drawImage(img,0,0);nail.clip(nail[k]);}
  nail.oldTotal=Number.isFinite(s.oldTotal)&&s.oldTotal>0?s.oldTotal:nail.oldTotal;nail.dirtTotal=Number.isFinite(s.dirtTotal)&&s.dirtTotal>0?s.dirtTotal:nail.dirtTotal;nail.rebuildDecorations();return nail;
 }
}
export function pointerCoords(event,element){const rect=element.getBoundingClientRect(),matrix=new DOMMatrix(getComputedStyle(element).transform==='none'?undefined:getComputedStyle(element).transform),point=new DOMPoint(event.clientX-(rect.left+rect.width/2),event.clientY-(rect.top+rect.height/2)).matrixTransform(matrix.inverse());return {x:(point.x+element.clientWidth/2)*W/element.clientWidth,y:(point.y+element.clientHeight/2)*H/element.clientHeight};}
