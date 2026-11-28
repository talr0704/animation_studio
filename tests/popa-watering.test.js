const test=require('node:test'),assert=require('node:assert/strict');
const runtime=import('../game/farming/watering-progress.js');
test('water only counts while aimed at valid soil; one wet spot cannot finish the plant',async()=>{
 const {createWateringProgress}=await runtime,p=createWateringProgress();p.step(-1,10);p.step(null,1);assert.equal(p.snapshot().value,0);
 for(let i=0;i<20;i++)p.step(0,.08);assert.ok(Math.abs(p.snapshot().value-1/3)<1e-8);assert.equal(p.snapshot().complete,false);
 for(let zone=1;zone<3;zone++)for(let i=0;i<11;i++)p.step(zone,.08);assert.equal(p.snapshot().complete,true);assert.ok(p.snapshot().value<=1);
});
test('background time gaps cannot instantly water a plant and resetting clears only the interaction',async()=>{
 const {createWateringProgress}=await runtime,p=createWateringProgress();p.step(0,100);assert.ok(Math.abs(p.snapshot().zones[0]-.1)<1e-10);p.step(1,NaN);p.step(1,-1);assert.equal(p.snapshot().zones[1],0);p.reset();assert.deepEqual(p.snapshot().zones,[0,0,0]);
});
