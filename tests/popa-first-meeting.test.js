const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const moduleFrom=path=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path,'utf8').replace(/^import[^\n]+\n/,'')).toString('base64'));
const stateRuntime=moduleFrom('game/progress/state.js'),storyRuntime=moduleFrom('game/story/first-meeting.js');
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('accepting the invitation atomically remembers the meeting and begins growing, without free items or coins',async()=>{
 const {createProgressStore}=await stateRuntime,{acceptInvitation,conversationEntry}=await storyRuntime,db=storage(),store=createProgressStore({storage:db});
 assert.equal(conversationEntry(store.read()),'greeting');
 const result=acceptInvitation(store);assert.equal(result.persisted,true);assert.equal(result.state.story.firstCake.step,'grow-strawberries');assert.equal(result.state.story.firstCake.status,'active');assert.deepEqual(result.state.story.npcs.milli.dialogues,['first-meeting']);assert.equal(result.state.story.npcs.milli.met,true);
 assert.equal(result.state.wallet.coins,0);assert.deepEqual(result.state.inventory,{});
 const before=store.exportJSON();assert.equal(acceptInvitation(store).applied,false);assert.equal(store.exportJSON(),before);
 assert.equal(conversationEntry(createProgressStore({storage:db}).read()),'growing');
});
test('saying hello does not start the quest; an existing partial first meeting can resume',async()=>{
 const {createProgressStore}=await stateRuntime,{acceptInvitation,conversationEntry}=await storyRuntime,store=createProgressStore({storage:storage()});
 store.commit('npc:milli:met',{npc:{id:'milli'}});assert.equal(conversationEntry(store.read()),'returning');assert.equal(store.read().story.firstCake.status,'not-started');
 store.commit('old-start',{quest:{action:'start'}});acceptInvitation(store);assert.equal(store.read().story.firstCake.step,'grow-strawberries');
});
test('return visits reflect later steps and never reset a completed quest',async()=>{
 const {createProgressStore}=await stateRuntime,{acceptInvitation,conversationEntry}=await storyRuntime,store=createProgressStore({storage:storage()});acceptInvitation(store);
 for(const expectedStep of ['grow-strawberries','bake-with-bonnie','deliver-cake'])store.commit('step:'+expectedStep,{quest:{action:'complete-step',expectedStep}});
 assert.equal(conversationEntry(store.read()),'completed');assert.equal(acceptInvitation(store).applied,false);assert.equal(store.read().story.firstCake.status,'completed');
});
test('invitation command cannot skip the required recorded conversation',async()=>{
 const {createProgressStore}=await stateRuntime,store=createProgressStore({storage:storage()});
 assert.throws(()=>store.commit('skip',{quest:{action:'accept-invitation'}}));assert.equal(store.read().story.firstCake.status,'not-started');
});
