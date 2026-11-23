const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'assets/scenes/home/furniture/coastal/sofa/interactions/sit.json'),'utf8'));
const api=import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'shared/furniture-interaction.js'),'utf8')).toString('base64'));
test('sofa phases have complete, interpolated and continuous body/placement poses',async()=>{
 const {validateFurnitureInteraction,furniturePose}=await api;validateFurnitureInteraction(data);
 assert.deepEqual(furniturePose(data,'enter',.9).placement,furniturePose(data,'hold',0).placement);
 assert.deepEqual(furniturePose(data,'hold',2).placement,furniturePose(data,'exit',0).placement);
 const holdStart=furniturePose(data,'hold',0),holdEnd=furniturePose(data,'hold',2);assert.deepEqual(holdStart.pose,holdEnd.pose);
 const mid=furniturePose(data,'enter',.225);assert.ok(mid.placement.y<350&&mid.placement.y>223);assert.ok(mid.pose.foot_left.y<0);
});
test('invalid action data cannot target other rigs or introduce unsafe body transforms',async()=>{
 const {validateFurnitureInteraction}=await api;
 for(const mutate of [d=>d.furniture='other',d=>d.phases.enter.keys[1].time=0,d=>d.phases.hold.keys[0].placement.scale=0,d=>d.phases.exit.keys[0].pose.head={x:NaN,y:0,rotation:0,scaleX:1,scaleY:1},d=>d.foregroundParts=['external']]){const copy=structuredClone(data);mutate(copy);assert.throws(()=>validateFurnitureInteraction(copy));}
});
