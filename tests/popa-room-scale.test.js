const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const runtime=import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('game/room-scale.js','utf8')).toString('base64'));
const layout=JSON.parse(fs.readFileSync('assets/scenes/home/furniture/layout.json','utf8'));
test('actor and furniture retain the same size ratio across screen shapes and portrait layout',async()=>{
 const {roomBaseScale}=await runtime;
 const ratios=[];
 for(const [w,h,profile] of [[1280,820,'wide'],[1920,1080,'wide'],[900,1000,'wide'],[600,780,'portrait'],[599,780,'portrait'],[390,792,'portrait']]){
  const room=layout[profile],factor=Math.min(w/room.canvas[0],h/room.canvas[1]);
  ratios.push(440*roomBaseScale(w,h,room)/(room.items.sofa[2]*factor));
 }
 for(const ratio of ratios)assert.ok(Math.abs(ratio-ratios[0])<1e-10);
});
