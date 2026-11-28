export function gardenGeometry(width,height,focus=0){
 const scale=Math.max(width/1672,height/941),portrait=width<700&&height>width;
 const sceneWidth=1672*scale,sceneHeight=941*scale,canPan=sceneWidth>width+80;
 const left=canPan?Math.max(width-sceneWidth,Math.min(0,width/2-[310,832,1350][focus]*scale)):(width-sceneWidth)/2;
 return {scale,left,top:(height-sceneHeight)/2,sceneWidth,sceneHeight,portrait,canPan};
}
