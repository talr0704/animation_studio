const test=require('node:test'),assert=require('node:assert/strict');
const stateModule=import('../game/progress/state.js'),farmModule=import('../game/farming/strawberries.js');
async function setup({unavailable=false}={}){
 const {createProgressStore}=await stateModule,{createStrawberryGarden,PLOTS,GROWTH_MS}=await farmModule;
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem(k,v){if(unavailable)throw Error('blocked');data.set(k,v);}};
 let time=1000;const store=createProgressStore({storage,now:()=>time});store.initialize();
 const garden=createStrawberryGarden({store,now:()=>time});
 return {store,garden,PLOTS,GROWTH_MS,advance:ms=>time+=ms,storage,now:()=>time};
}
function accept(store){store.commit('invite',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'accept-invitation'}});}
test('plots require the meeting, reject unknown IDs and prevent early/double harvesting',async()=>{
 const {store,garden,PLOTS,GROWTH_MS,advance}=await setup();
 assert.throws(()=>garden.act(PLOTS[0]));assert.throws(()=>garden.act('__proto__'));accept(store);
 garden.act(PLOTS[0]);assert.equal(garden.snapshot().plots[0].stage,'planted');advance(60000);
 assert.equal(garden.snapshot().plots[0].stage,'planted');garden.act(PLOTS[0]);
 const before=store.exportJSON();assert.throws(()=>garden.act(PLOTS[0]));assert.equal(store.exportJSON(),before);
 advance(GROWTH_MS-1);assert.throws(()=>garden.act(PLOTS[0]));advance(1);
 assert.equal(garden.snapshot().plots[0].stage,'ready');garden.act(PLOTS[0]);
 assert.equal(store.read().inventory.strawberry,1);assert.equal(garden.act(PLOTS[0]).applied,false);assert.equal(store.read().inventory.strawberry,1);
});
test('growth survives reload, completes atomically after three harvests, and never changes coins or legacy round progress',async()=>{
 const {store,garden,PLOTS,GROWTH_MS,advance,storage,now}=await setup();accept(store);
 for(const id of PLOTS){garden.act(id);garden.act(id);}
 const {createProgressStore}=await stateModule,{createStrawberryGarden}=await farmModule;
 const saved=store.exportJSON(),restored=createProgressStore({storage,now});
 const reopened=createStrawberryGarden({store:restored,now});advance(GROWTH_MS);
 assert.ok(reopened.snapshot().plots.every(p=>p.stage==='ready'));assert.equal(store.exportJSON(),saved);
 for(const id of PLOTS.slice(0,2))reopened.act(id);
 assert.equal(restored.read().story.firstCake.step,'grow-strawberries');reopened.act(PLOTS[2]);
 const state=restored.read();assert.equal(state.story.firstCake.step,'bake-with-bonnie');assert.equal(state.inventory.strawberry,3);
 assert.equal(state.wallet.coins,0);assert.deepEqual(state.activities.garden,{best:0,rounds:0});
 for(const id of PLOTS)assert.throws(()=>reopened.act(id));assert.equal(restored.read().inventory.strawberry,3);
 assert.ok(Object.hasOwn(state.receipts,`farm:${PLOTS[2]}:harvest`));
});
test('blocked storage remains an explicitly temporary visit and backward clock cannot finish a crop',async()=>{
 const {store,garden,PLOTS,advance}=await setup({unavailable:true});accept(store);
 assert.equal(garden.act(PLOTS[0]).persisted,false);garden.act(PLOTS[0]);advance(-100);
 assert.throws(()=>garden.act(PLOTS[0]));assert.equal(garden.snapshot().plots[0].stage,'growing');
});
