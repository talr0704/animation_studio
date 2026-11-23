import { furniturePose, createFurnitureActor, mountFurnitureForeground } from '../shared/furniture-interaction.js?v=2';
export function startFurnitureSession({popa,scene,rig,data,startPlacement,onFinish}){
 const animation=structuredClone(data);animation.phases.enter.keys[0].placement={...startPlacement};animation.phases.exit.keys.at(-1).placement={...startPlacement};
 const parent=popa.root.parentElement,previousScale=parseFloat(popa.root.style.width)/440;
 popa.stop();popa.root.getAnimations({subtree:true}).forEach(a=>a.cancel());popa.setScale(1);
 const actor=document.createElement('div');actor.className='furniture-game-actor';Object.assign(actor.style,{position:'absolute',left:'0',top:'0',width:'440px',height:'475px',transformOrigin:'0 0',zIndex:'20',pointerEvents:'none'});actor.append(popa.root);scene.append(actor);
 const renderer=createFurnitureActor(actor,popa.element),clearForeground=mountFurnitureForeground(scene,rig,animation);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let phase='enter',start=performance.now(),raf=0,finished=false,exitPromise=null,resolveExit;
 function render(now){if(finished)return;const clip=animation.phases[phase],elapsed=reduced&&phase!=='hold'?clip.duration:(now-start)/1000;const time=reduced&&phase==='hold'?0:clip.loop?elapsed%clip.duration:Math.min(elapsed,clip.duration);renderer.render(furniturePose(animation,phase,time));popa.element.dataset.furniturePhase=phase;
  if(elapsed>=clip.duration&&!clip.loop){if(phase==='enter'){phase='hold';start=now;}else{finish();return;}}
  raf=requestAnimationFrame(render);
 }
 function finish(){if(finished)return;finished=true;cancelAnimationFrame(raf);renderer.reset();clearForeground();parent.append(popa.root);actor.remove();popa.setScale(previousScale);delete popa.element.dataset.furniturePhase;onFinish(animation.phases.exit.keys.at(-1).placement);resolveExit?.();}
 raf=requestAnimationFrame(render);
 return {leave(destination){if(finished)return Promise.resolve();if(exitPromise)return exitPromise;
   const current=furniturePose(animation,phase,Math.min((performance.now()-start)/1000,animation.phases[phase].duration));animation.phases.exit.keys[0]={...current,time:0};if(destination)animation.phases.exit.keys.at(-1).placement=destination;
   phase='exit';start=performance.now();exitPromise=new Promise(resolve=>resolveExit=resolve);return exitPromise;
  },dispose:finish,get phase(){return phase;}};
}
