// All navigation uses the contact point under Popa's feet, in world pixels.
export const FLOOR_START = 0.735; // Wood floor begins here in coastal-room.png.
export const FLOOR_ITEMS = new Set(['sofa','wardrobe','side-table']);
export function floorBounds(width,height,radius=18){return {left:radius+8,right:width-radius-8,top:height*FLOOR_START+12,bottom:Math.max(height*FLOOR_START+13,height-48)};}
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const inside=(p,r)=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom;
export function walkable(p,bounds,obstacles){return p.x>=bounds.left-.001&&p.x<=bounds.right+.001&&p.y>=bounds.top-.001&&p.y<=bounds.bottom+.001&&!obstacles.some(r=>inside(p,r));}
export function nearestFree(point,bounds,obstacles){
 const base={x:clamp(point.x,bounds.left,bounds.right),y:clamp(point.y,bounds.top,bounds.bottom)};
 if(walkable(base,bounds,obstacles))return base;
 const candidates=[];
 for(const r of obstacles)for(const p of [{x:r.left-1,y:base.y},{x:r.right+1,y:base.y},{x:base.x,y:r.top-1},{x:base.x,y:r.bottom+1}])candidates.push({x:clamp(p.x,bounds.left,bounds.right),y:clamp(p.y,bounds.top,bounds.bottom)});
 // Include floor edges for overlapping furniture footprints.
 for(let y=bounds.top;y<=bounds.bottom;y+=8)for(let x=bounds.left;x<=bounds.right;x+=16)candidates.push({x,y});
 return candidates.filter(p=>walkable(p,bounds,obstacles)).sort((a,b)=>Math.hypot(a.x-base.x,a.y-base.y)-Math.hypot(b.x-base.x,b.y-base.y))[0]??null;
}
export function clearSegment(a,b,bounds,obstacles){
 if(!walkable(a,bounds,obstacles)||!walkable(b,bounds,obstacles))return false;
 for(const r of obstacles){
  // Slab intersection with the open interior of an expanded footprint.
  let low=0,high=1;
  for(const [axis,min,max] of [['x',r.left+.01,r.right-.01],['y',r.top+.01,r.bottom-.01]]){
   const delta=b[axis]-a[axis];
   if(Math.abs(delta)<1e-8){if(a[axis]<=min||a[axis]>=max){low=2;break;}}
   else {const first=(min-a[axis])/delta,last=(max-a[axis])/delta;low=Math.max(low,Math.min(first,last));high=Math.min(high,Math.max(first,last));}
  }
  if(low<=high&&high>=0&&low<=1)return false;
 }
 return true;
}
export function roomPath(start,destination,bounds,obstacles){
 const end=nearestFree(destination,bounds,obstacles);if(!end||!walkable(start,bounds,obstacles))return [];
 const nodes=[start,end];
 for(const r of obstacles)for(const x of [r.left-1,r.right+1])for(const y of [r.top-1,r.bottom+1]){const p={x,y};if(walkable(p,bounds,obstacles))nodes.push(p);}
 for(const x of [bounds.left,bounds.right])for(const y of [bounds.top,bounds.bottom]){const p={x,y};if(walkable(p,bounds,obstacles))nodes.push(p);}
 const distances=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),seen=new Set();distances[0]=0;
 while(seen.size<nodes.length){let best=-1;for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&(best<0||distances[i]<distances[best]))best=i;if(best<0||!Number.isFinite(distances[best]))break;if(best===1)break;seen.add(best);
  for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&clearSegment(nodes[best],nodes[i],bounds,obstacles)){const d=distances[best]+Math.hypot(nodes[i].x-nodes[best].x,nodes[i].y-nodes[best].y);if(d<distances[i]){distances[i]=d;previous[i]=best;}}
 }
 if(!Number.isFinite(distances[1]))return [];
 const path=[];for(let i=1;i!==0;i=previous[i]){if(i<0)return [];path.unshift(nodes[i]);}return path;
}
export function slideStep(start,destination,bounds,obstacles){
 if(clearSegment(start,destination,bounds,obstacles))return destination;
 const x={x:clamp(destination.x,bounds.left,bounds.right),y:start.y},y={x:start.x,y:clamp(destination.y,bounds.top,bounds.bottom)};
 const candidates=[x,y].filter(p=>clearSegment(start,p,bounds,obstacles));
 return candidates.sort((a,b)=>Math.hypot(b.x-start.x,b.y-start.y)-Math.hypot(a.x-start.x,a.y-start.y))[0]??start;
}
export function constrainFloorFurniture(layout){
 const [w,h]=layout.canvas;
 const lamp=layout.items['floor-lamp'];
 const support=lamp?[...FLOOR_ITEMS].filter(id=>layout.items[id]).map(id=>({id,r:layout.items[id]})).sort((a,b)=>(Math.abs(a.r[0]+a.r[2]/2-lamp[0]-lamp[2]/2)+Math.abs(a.r[1]-lamp[1]-lamp[3])*.2)-(Math.abs(b.r[0]+b.r[2]/2-lamp[0]-lamp[2]/2)+Math.abs(b.r[1]-lamp[1]-lamp[3])*.2))[0]:null;
 const supportY=support?.r[1];
 if(layout.rug){const r=layout.rug;r[3]=Math.min(r[3],h*(1-FLOOR_START)-12);r[0]=clamp(r[0],0,Math.max(0,w-r[2]));r[1]=clamp(r[1],h*FLOOR_START+4,h-8-r[3]);}
 for(const id of FLOOR_ITEMS){const r=layout.items[id];if(!r)continue;r[0]=clamp(r[0],0,Math.max(0,w-r[2]));r[1]=clamp(r[1],h*FLOOR_START+14-r[3],Math.max(h*FLOOR_START+14-r[3],h-40-r[3]));}
 if(support)lamp[1]+=support.r[1]-supportY;
}
