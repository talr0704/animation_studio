// Static character artwork in the same design coordinates and pivots as the placement editor.
export async function mountLayeredCharacter(container,{assemblyUrl,expectedId,motionRig=false,headFollowers=[]}) {
 const response=await fetch(assemblyUrl,{cache:'no-cache'});
 if(!response.ok)throw Error('קובץ הדמות לא נטען');
 const layout=await response.json(),canvas=layout.canvas;
 if(layout.id!==expectedId||!canvas||![canvas.width,canvas.height].every(v=>Number.isFinite(v)&&v>0&&v<=2000)||!Array.isArray(layout.layersBackToFront)||!layout.layersBackToFront.length||layout.layersBackToFront.length>100||!Array.isArray(layout.sprites))throw Error('הרכבת הדמות אינה תקינה');
 const root=document.createElement('span');root.className='layered-character';root.dataset.character=expectedId;
 Object.assign(root.style,{position:'absolute',left:'0',top:'0',width:canvas.width+'px',height:canvas.height+'px',transformOrigin:'0 0',pointerEvents:'none'});
 const names=new Set(),loads=[],nodes=new Map();
 const motionRoot=motionRig?document.createElement('span'):root;
 if(motionRig){Object.assign(motionRoot.style,{position:'absolute',inset:'0',pointerEvents:'none'});root.append(motionRoot);}
 for(const layer of layout.layersBackToFront){
  if(typeof layer.file!=='string'||!/^parts\/[a-z0-9_-]+\.png$/.test(layer.file)||names.has(layer.file))throw Error('חלק דמות לא תקין');names.add(layer.file);
  const sprites=layout.sprites.filter(sprite=>sprite.file===layer.file),size=sprites[0]?.displaySize;
  if(sprites.length!==1||!Array.isArray(size)||size.length!==2||!size.every(v=>Number.isFinite(v)&&v>0&&v<=10000)||![layer.centerX,layer.centerY,layer.clockwiseDegrees,layer.pivotX,layer.pivotY].every(Number.isFinite)||!Number.isInteger(layer.zIndex))throw Error('מיקום חלק לא תקין');
  const [width,height]=size,left=layer.centerX-width/2,top=layer.centerY-height/2;
  const image=new Image();image.alt='';image.draggable=false;image.dataset.characterPart=layer.file.split('/').at(-1).replace('.png','');
  Object.assign(image.style,{position:'absolute',maxWidth:'none',objectFit:'fill',left:left+'px',top:top+'px',width:width+'px',height:height+'px',zIndex:String(layer.zIndex),transformOrigin:`${layer.pivotX-left}px ${layer.pivotY-top}px`,transform:`rotate(${layer.clockwiseDegrees}deg) scaleX(${layer.flipX?-1:1})`,pointerEvents:'none'});
  image.style.visibility=layer.visible===false?'hidden':'';
  if(layer.clipPath)image.style.clipPath=layer.clipPath;
  image.src=new URL(layer.file,assemblyUrl).href;loads.push(image.decode());
  if(motionRig){
   const outer=document.createElement('span'),follower=document.createElement('span'),group=document.createElement('span'),name=image.dataset.characterPart;
   for(const node of [outer,follower,group])Object.assign(node.style,{position:'absolute',inset:'0',pointerEvents:'none'});
   outer.style.zIndex=layer.zIndex;group.style.transformOrigin=`${layer.pivotX}px ${layer.pivotY}px`;group.dataset.motionPart=name;
   group.append(image);follower.append(group);outer.append(follower);motionRoot.append(outer);nodes.set(name,{group,follower:headFollowers.includes(name)?follower:null,img:image,layer});
  }else root.append(image);
 }
 await Promise.all(loads);container.replaceChildren(root);container.dataset.ready='true';
 function fit(){root.style.transform=`scale(${container.clientWidth/canvas.width})`;}
 const observer=new ResizeObserver(fit);observer.observe(container);fit();
 return {layout,root,motionRoot,nodes,destroy(){observer.disconnect();root.remove();}};
}
