const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../game/room-navigation.js'),'utf8');
const nav=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('floor contact and furniture footprints define reachable routes',async()=>{
 const {floorBounds,walkable,roomPath,clearSegment,slideStep,nearestFree}=await nav;
 const bounds=floorBounds(1200,800,100),obstacles=[{left:450,right:650,top:610,bottom:690}];
 assert.ok(bounds.top>800*.735);assert.ok(bounds.bottom<800);
 const start={x:300,y:650},end={x:800,y:650};assert.ok(!clearSegment(start,end,bounds,obstacles));
 const path=roomPath(start,end,bounds,obstacles);assert.ok(path.length>1);let previous=start;
 for(const point of path){assert.ok(walkable(point,bounds,obstacles));assert.ok(clearSegment(previous,point,bounds,obstacles));previous=point;}
 assert.deepEqual(previous,end);
 assert.ok(nearestFree({x:500,y:100},bounds,obstacles).y>=bounds.top);
 const slide=slideStep({x:449,y:650},{x:470,y:660},bounds,obstacles);assert.equal(slide.x,449);assert.equal(slide.y,660);
});
test('floor furniture is grounded while preserving wall props and tabletop support',async()=>{
 const {constrainFloorFurniture,FLOOR_START}=await nav;
 const layout={canvas:[1280,820],items:{sofa:[10,10,300,220],wardrobe:[900,200,180,200],'side-table':[600,780,180,120],window:[100,40,300,200],'floor-lamp':[850,200,80,100]}};
 constrainFloorFurniture(layout);
 for(const id of ['sofa','wardrobe','side-table']){const r=layout.items[id];assert.ok(r[1]+r[3]>=820*FLOOR_START+14);assert.ok(r[1]+r[3]<=820-40);}
 assert.equal(layout.items.window[1],40);assert.equal(layout.items['floor-lamp'][1]-200,layout.items.wardrobe[1]-200);
});
