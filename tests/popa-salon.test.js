const test=require('node:test');const assert=require('node:assert/strict');
async function fixture(){return import('../game/salon-round.js');}
function treat(r,tool){const phase=r.phase;for(let i=0;i<150&&r.phase===phase;i++)r.use(tool);assert.equal(r.phase,phase+1);}
function care(r){for(const tool of ['water','shampoo','water','dryer'])treat(r,tool);}
test('repeated clicks in one place cannot replace spatial treatment',async()=>{
 const{SalonRound}=await fixture();const r=new SalonRound();for(let i=0;i<100;i++)r.use('water','bangs',{x:400,y:100});
 assert.equal(r.phase,0);assert.ok(r.coverage()<.5);treat(r,'water');assert.ok(r.coverage('wet')>=.85);
 assert.equal(r.use('scissors').kind,'wrong');assert.equal(r.lengths.bangs,2);
});
test('rinsing removes foam locally while untouched areas retain it',async()=>{
 const{SalonRound,CARE_CELLS}=await fixture();const r=new SalonRound();treat(r,'water');treat(r,'shampoo');
 const before=r.care.soap.map((v,i)=>v*(1-r.care.rinse[i]));r.use('water','bangs',CARE_CELLS[0]);
 const after=r.care.soap.map((v,i)=>v*(1-r.care.rinse[i]));assert.ok(after[0]<before[0]);assert.equal(after.at(-1),before.at(-1));assert.ok(after.some(v=>v>.5));
});
test('cuts stay on the manually selected section, allow creative lengths, and never advance on contact',async()=>{
 const{SalonRound}=await fixture();const r=new SalonRound();care(r);
 r.use('scissors','bangs',{x:545,y:270});assert.equal(r.lengths.bangs,1);assert.equal(r.lengths.side_right,2);
 r.use('scissors','bangs');assert.equal(r.lengths.bangs,0);assert.equal(r.use('scissors','bangs').kind,'ready');
 assert.equal(r.phase,4);assert.ok(r.finishCut());assert.equal(r.phase,5);treat(r,'comb');r.use('bow');
 assert.equal(r.phase,7);assert.ok(r.scores.match<100);assert.ok(r.claim()>0);assert.equal(r.claim(),0);
});
test('all requests can be completed with separate matching, care and style scores',async()=>{
 const{SalonRound,ORDERS,HAIR_PARTS}=await fixture();for(let i=0;i<ORDERS.length;i++){
  const r=new SalonRound(i);assert.equal(r.claim(),0);care(r);
  for(let j=0;j<5;j++)while(r.lengths[HAIR_PARTS[j]]>r.order.lengths[j])r.use('scissors',HAIR_PARTS[j]);
  assert.ok(r.cutDone);assert.equal(r.phase,4);r.finishCut();treat(r,'brush');r.use(r.order.accessory);
  assert.equal(r.scores.match,100);assert.ok(r.scores.care>=85);assert.equal(r.scores.style,100);assert.ok(r.claim()>=16);
 }
});
test('album persists actual artwork choices, unlocks by visits and survives unavailable storage',async()=>{
 const{readAlbum,recordVisit,unlocked}=await import('../game/salon-progress.js');const{SalonRound}=await fixture();
 const memory=new Map();const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 let album=readAlbum(storage);assert.equal(unlocked(album,'bow'),false);
 const r=new SalonRound();care(r);r.finishCut();treat(r,'comb');r.use('flower');
 for(let i=0;i<3;i++)album=recordVisit(album,r,15,storage).album;
 assert.ok(unlocked(album,'bow')&&unlocked(album,'brush')&&unlocked(album,'mirror'));
 assert.deepEqual(readAlbum(storage).entries[0].lengths,r.lengths);assert.equal(readAlbum(storage).total,3);
 const result=recordVisit(album,r,15,{setItem(){throw new Error('blocked')}});assert.equal(result.saved,false);assert.equal(result.album.total,4);
});
