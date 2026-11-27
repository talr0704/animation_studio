const test=require('node:test'),assert=require('node:assert/strict');
const state=import('../game/progress/state.js'),recipe=import('../game/baking/recipe.js');
async function setup(){const {createProgressStore}=await state,{createBakery,BAKE_MS}=await recipe;const db=new Map(),storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};let time=1000;const store=createProgressStore({storage,now:()=>time});store.commit('invite',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'accept-invitation'}});const bakery=createBakery({store,now:()=>time});return {store,bakery,storage,now:()=>time,advance:ms=>time+=ms,BAKE_MS};}
function harvest(store){store.commit('harvest',{grant:{strawberry:3},quest:{action:'complete-step',expectedStep:'grow-strawberries'}});}
test('ingredients remain in escrow across reload and incorrect steps cannot consume them',async()=>{
 const s=await setup();assert.throws(()=>s.bakery.act('berry'));harvest(s.store);const saved=s.store.exportJSON();assert.throws(()=>s.bakery.act('mix'));assert.throws(()=>s.bakery.act('pack'));assert.equal(s.store.exportJSON(),saved);
 s.bakery.act('berry');assert.equal(s.store.read().inventory.strawberry,2);assert.equal(s.store.read().baking.strawberries,1);
 const {createProgressStore}=await state,{createBakery}=await recipe,reloaded=createBakery({store:createProgressStore({storage:s.storage,now:s.now}),now:s.now});assert.equal(reloaded.snapshot().strawberries,1);assert.equal(reloaded.snapshot().inventory,2);reloaded.act('berry');reloaded.act('berry');assert.throws(()=>reloaded.act('berry'));assert.equal(s.store.read().baking.strawberries,3);assert.equal(s.store.read().inventory.strawberry,undefined);
});
test('three mixes, a persistent oven timer, decoration and one atomic packaged cake with Momo',async()=>{
 const s=await setup();harvest(s.store);for(let i=0;i<3;i++)s.bakery.act('berry');assert.throws(()=>s.bakery.act('bake'));for(const id of ['flour','egg','milk'])s.bakery.act(id);for(let i=0;i<3;i++)s.bakery.act('mix');s.bakery.act('bake');assert.throws(()=>s.bakery.act('take'));s.advance(s.BAKE_MS-1);assert.throws(()=>s.bakery.act('take'));s.advance(1);
 s.bakery.act('take');assert.throws(()=>s.bakery.act('pack'));s.bakery.act('decorate');s.bakery.act('pack');const final=s.store.read();assert.equal(final.inventory['strawberry-cake'],1);assert.equal(final.story.firstCake.step,'deliver-cake');assert.equal(final.recipes.completed['strawberry-cake'],1);assert.ok(final.story.npcs.milli.dialogues.includes('baking'));assert.equal(final.story.npcs.bonnie.met,false);assert.equal(final.wallet.coins,0);assert.throws(()=>s.bakery.act('pack'));assert.equal(s.store.read().inventory['strawberry-cake'],1);
});
test('bad baking saves are rejected without overwriting existing progress',async()=>{
 const {validateState,initialState}=await state;for(const baking of [{stage:'packed',strawberries:0,mixes:0,readyAt:null,decoration:null,ingredients:{flour:true,egg:true,milk:true}},{stage:'baking',strawberries:3,mixes:3,readyAt:null,decoration:null,ingredients:{flour:true,egg:true,milk:true}}]){const s=initialState();s.baking=baking;assert.throws(()=>validateState(s));}
});
test('failed ingredient transfer does not change the bowl, inventory or receipt log; blocked storage reports temporary progress',async()=>{
 const s=await setup();harvest(s.store);s.store.commit('empty-basket',{consume:{strawberry:3}});const before=s.store.exportJSON();assert.throws(()=>s.bakery.act('berry'));assert.equal(s.store.exportJSON(),before);
 const t=await setup();harvest(t.store);t.storage.setItem=()=>{throw Error('blocked');};assert.equal(t.bakery.act('berry').persisted,false);assert.equal(t.bakery.snapshot().inventory,2);assert.equal(t.bakery.snapshot().strawberries,1);
});
