const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const runtime=import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('game/progress/state.js','utf8')).toString('base64'));
function storage(seed={}){const data=new Map(Object.entries(seed));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),dump:()=>Object.fromEntries(data)};}
test('migrates the legacy wallet, owned item, outfit and last manicure receipt without resetting them',async()=>{
 const {createProgressStore,STATE_KEY}=await runtime,db=storage({popaWorldV1:JSON.stringify({coins:52,best:200,rounds:3,rug:true,outfit:'cloud',manicureReward:'old-session',extra:'keep'})});
 const store=createProgressStore({storage:db});assert.equal(store.initialize().persisted,true);
 const state=store.read();assert.equal(state.wallet.coins,52);assert.equal(state.home.rug,true);assert.equal(state.appearance.outfit,'cloud');assert.equal(state.activities.garden.rounds,3);assert.equal(state.receipts['manicure:old-session'],0);assert.equal(JSON.parse(db.getItem('popaWorldV1')).extra,'keep');
 db.setItem('popaWorldV1',JSON.stringify({coins:0}));assert.equal(createProgressStore({storage:db}).read().wallet.coins,52);assert.ok(db.getItem(STATE_KEY));
});
test('inventory and wallet changes are one transaction, reject shortages and cannot be replayed after reload',async()=>{
 const {createProgressStore}=await runtime,db=storage(),store=createProgressStore({storage:db,now:()=>100});
 store.commit('seed',{grant:{strawberry:3},coins:5});const before=store.exportJSON();
 assert.throws(()=>store.commit('bad',{consume:{strawberry:4},coins:10}));assert.equal(store.exportJSON(),before);
 assert.throws(()=>store.commit('negative',{coins:-6}));assert.equal(store.exportJSON(),before);
 store.commit('recipe:1',{consume:{strawberry:3},grant:{'strawberry-cake':1},recipe:'strawberry-cake'});
 const reopened=createProgressStore({storage:db});assert.equal(reopened.commit('recipe:1',{grant:{'strawberry-cake':1}}).applied,false);assert.deepEqual(reopened.read().inventory,{'strawberry-cake':1});
});
test('first-cake steps must complete in order; delivery removes the cake and records the reward together',async()=>{
 const {createProgressStore}=await runtime,db=storage(),store=createProgressStore({storage:db});
 assert.throws(()=>store.commit('early',{quest:{action:'complete-step',expectedStep:'meet-milli'}}));
 store.commit('start',{quest:{action:'start'}});
 assert.throws(()=>store.commit('skip',{quest:{action:'complete-step',expectedStep:'deliver-cake'}}));
 store.commit('meet',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'complete-step',expectedStep:'meet-milli'}});
 store.commit('grow',{grant:{strawberry:3},quest:{action:'complete-step',expectedStep:'grow-strawberries'}});
 store.commit('bake',{npc:{id:'bonnie'},consume:{strawberry:3},grant:{'strawberry-cake':1},recipe:'strawberry-cake',quest:{action:'complete-step',expectedStep:'bake-with-bonnie'}});
 store.commit('delivery:first-cake',{consume:{'strawberry-cake':1},coins:20,quest:{action:'complete-step',expectedStep:'deliver-cake'}});
 const state=createProgressStore({storage:db}).read();assert.equal(state.story.firstCake.status,'completed');assert.equal(state.wallet.coins,20);assert.deepEqual(state.inventory,{});assert.deepEqual(state.story.npcs.milli.dialogues,['first-meeting']);
 assert.equal(store.commit('delivery:first-cake',{coins:20}).applied,false);
});
test('crop timestamps and NPC dialogue flags round-trip; callers cannot mutate stored snapshots',async()=>{
 const {createProgressStore}=await runtime,store=createProgressStore({storage:storage()});
 store.commit('plant:1',{plot:{id:'garden-1',crop:'strawberry',stage:'planted',plantedAt:100,wateredAt:null,readyAt:200,harvestedAt:null}});
 store.commit('dialogue:1',{npc:{id:'milli',dialogue:'hello'}});store.commit('dialogue:2',{npc:{id:'milli',dialogue:'hello'}});
 const copy=store.read();copy.wallet.coins=999;assert.equal(store.read().wallet.coins,0);
 const backup=store.exportJSON(),other=createProgressStore({storage:storage()});other.importJSON(backup);assert.deepEqual(other.read(),store.read());assert.equal(other.read().story.npcs.milli.dialogues.length,1);
});
test('profile updates read the latest shared state and preserve inventory, receipts and story',async()=>{
 const {createProgressStore}=await runtime,db=storage(),a=createProgressStore({storage:db}),b=createProgressStore({storage:db});
 a.commit('story',{grant:{strawberry:2},coins:10,npc:{id:'milli'}});b.read();a.commit('salon:1',{coins:8});
 b.updateProfile('garden:1',p=>{p.coins+=4;p.rounds++;});assert.equal(a.read().wallet.coins,22);assert.equal(a.read().inventory.strawberry,2);assert.equal(a.read().story.npcs.milli.met,true);
});
test('all manicure receipts survive subsequent sessions, rather than remembering only the last one',async()=>{
 const {createProgressStore}=await runtime,db=storage(),store=createProgressStore({storage:db});
 for(const id of ['a','b','a'])store.commit('manicure:'+id,{coins:8,manicureReward:id});assert.equal(store.read().wallet.coins,16);
 assert.equal(createProgressStore({storage:db}).commit('manicure:a',{coins:8}).applied,false);
});
test('corrupt and future saves are preserved without being overwritten',async()=>{
 const {createProgressStore,STATE_KEY}=await runtime;
 for(const raw of ['{broken',JSON.stringify({version:2})]){
  const db=storage({[STATE_KEY]:raw}),store=createProgressStore({storage:db});assert.equal(store.initialize().persisted,false);
  assert.equal(store.commit('temporary',{coins:2}).persisted,false);assert.equal(db.getItem(STATE_KEY),raw);
 }
});
test('unavailable storage keeps an explicit temporary session; invalid imports do not replace progress',async()=>{
 const {createProgressStore}=await runtime,store=createProgressStore({storage:{getItem(){throw Error('denied')},setItem(){throw Error('denied')}}});
 assert.equal(store.commit('temporary',{coins:3}).persisted,false);assert.equal(store.read().wallet.coins,3);assert.equal(store.commit('temporary',{coins:3}).applied,false);
 const before=store.exportJSON();assert.throws(()=>store.importJSON('{bad'));assert.equal(store.exportJSON(),before);
 assert.throws(()=>store.commit('bad',{grant:JSON.parse('{"__proto__":1}')}));assert.throws(()=>store.commit('bad2',{grant:{strawberry:1.5}}));assert.throws(()=>store.commit('bad3',{notACommand:true}));
});

test('a failed read cannot overwrite a save even if writes would succeed',async()=>{
 const {createProgressStore}=await runtime;let writes=0;const store=createProgressStore({storage:{getItem(){throw Error('cannot read')},setItem(){writes++;}}});
 assert.equal(store.initialize().persisted,false);store.commit('temporary',{coins:1});assert.equal(writes,0);
});
