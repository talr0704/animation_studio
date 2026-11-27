export const BAKE_MS=8000;
export const BAKING_DEFAULT={stage:'prep',strawberries:0,mixes:0,readyAt:null,decoration:null,ingredients:{flour:false,egg:false,milk:false}};
export function createBakery({store,now=Date.now}){
 const active=s=>s.story.firstCake.status==='active'&&s.story.firstCake.step==='bake-with-bonnie';
 function snapshot(){const state=store.read(),baking=state.baking??structuredClone(BAKING_DEFAULT);return {...baking,enabled:active(state),inventory:state.inventory.strawberry??0,cakes:state.inventory['strawberry-cake']??0,ready:baking.stage==='baking'&&now()>=baking.readyAt,seconds:baking.readyAt===null?0:Math.max(0,Math.ceil((baking.readyAt-now())/1000)),complete:baking.stage==='packed'||['deliver-cake','completed'].includes(state.story.firstCake.step)};}
 function act(action){
  const state=store.read(),b=state.baking??structuredClone(BAKING_DEFAULT);
  if(!active(state))throw Error('קודם נגדל ונקטוף שלושה תותים בגינה');
  const commit=(id,next,extra={})=>store.commit('first-cake:baking:'+id,{baking:{...b,...next},...extra});
  if(action==='berry'){
   if(b.stage!=='prep'||b.strawberries>=3)throw Error('שלושת התותים כבר בקערה');
   return commit('berry-'+(b.strawberries+1),{strawberries:b.strawberries+1},{consume:{strawberry:1}});
  }
  if(['flour','egg','milk'].includes(action)){
   if(b.stage!=='prep'||b.ingredients[action])throw Error('המרכיב כבר נוסף לבלילה');
   return commit('ingredient-'+action,{ingredients:{...b.ingredients,[action]:true}});
  }
  if(action==='mix'){
   if(b.stage!=='prep'||b.strawberries!==3||b.mixes>=3||!Object.values(b.ingredients).every(Boolean))throw Error('קודם נעביר שלושה תותים לקערה');
   const mixes=b.mixes+1;return commit('mix-'+mixes,{mixes,stage:mixes===3?'mixed':'prep'});
  }
  if(action==='bake'){
   if(b.stage!=='mixed')throw Error('קודם נערבב את הבלילה');
   return commit('oven',{stage:'baking',readyAt:now()+BAKE_MS});
  }
  if(action==='take'){
   if(b.stage!=='baking'||b.readyAt===null||now()<b.readyAt)throw Error('העוגה עדיין בתנור');
   return commit('take',{stage:'baked'});
  }
  if(action==='decorate'){
   if(b.stage!=='baked')throw Error('קודם נוציא את העוגה מהתנור');
   return commit('decorate',{stage:'decorated',decoration:'strawberry'});
  }
  if(action==='pack'){
   if(b.stage!=='decorated'||b.strawberries!==3)throw Error('קודם נקשט את העוגה');
   return commit('pack',{stage:'packed'},{grant:{'strawberry-cake':1},recipe:'strawberry-cake',npc:{id:'milli',dialogue:'baking'},quest:{action:'complete-step',expectedStep:'bake-with-bonnie'}});
  }
  throw Error('פעולת אפייה לא מוכרת');
 }
 return {snapshot,act};
}
