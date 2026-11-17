const test = require('node:test');
const assert = require('node:assert/strict');
async function round() { const { GardenRound } = await import('../game/garden-round.js'); return new GardenRound({ random: () => .5 }); }
function falling(game,type='apple',x=.5) { game.objects.push({id:game.nextId++,x,y:.835,speed:1,type,spin:0}); }
test('catches build multipliers and gold bonuses; misses reset only the streak',async()=>{
 const g=await round();g.spawnIn=100;
 for(let i=0;i<5;i++){falling(g);g.step(.02,.5,900);}
 assert.equal(g.score,60);assert.equal(g.combo,5);assert.equal(g.bestCombo,5);
 falling(g,'gold');g.step(.02,.5,900);assert.equal(g.score,120);
 g.objects.push({x:.1,y:1.06,speed:1,type:'apple'});g.step(.02,.5,900);
 assert.equal(g.combo,0);assert.equal(g.lives,3);assert.equal(g.bestCombo,6);
 assert.equal(g.reward,11);
});
test('rain costs hearts, cannot make hearts negative, and ends the round once',async()=>{
 const g=await round();g.spawnIn=100;g.lives=1;
 for(let i=0;i<3;i++)falling(g,'rain');
 const events=g.step(.02,.5,900);
 assert.equal(g.lives,0);assert.equal(g.finished,true);assert.equal(events.filter(e=>e.type==='finish').length,1);
 const snapshot=JSON.stringify(g);assert.deepEqual(g.step(.05,.1,900),[]);assert.equal(JSON.stringify(g),snapshot);
});
test('one supporting catch line, movement limits, increasing difficulty and a timed ending',async()=>{
 const g=await round();
 for(let i=0;i<950&&!g.finished;i++)g.step(.05,.5,900);
 assert.equal(g.finished,true);assert.equal(g.remaining,0);assert.equal(g.level,4);assert.ok(g.catches>20);assert.ok(g.reward>=12);
 const h=await round();h.step(.05,100,900);assert.ok(h.player<=.5+600/900*.05);
 for(let i=0;i<100;i++)h.step(.05,100,900);assert.ok(h.player<=.93);
});
