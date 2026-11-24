// Match the room's uniform artwork scale instead of capping the actor by screen height.
export function roomBaseScale(width,height,layout){
 const [w,h]=layout.canvas;
 // The portrait room uses smaller furniture on its 390px design canvas.
 const designScale=w<=700?.54*(200/350):.54;
 return designScale*Math.min(width/w,height/h);
}
