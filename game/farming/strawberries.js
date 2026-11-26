export const PLOTS = ['first-cake-1','first-cake-2','first-cake-3'];
export const GROWTH_MS = 20000;
export const REQUIRED_STRAWBERRIES = 3;
const active = state => state.story.firstCake.status === 'active' && state.story.firstCake.step === 'grow-strawberries';

/** The first story crop. Displaying growth never writes or restarts a timer. */
export function createStrawberryGarden({store, now=Date.now}) {
 function snapshot() {
  const state=store.read(), enabled=active(state);
  return {enabled, complete:state.story.firstCake.step!=='meet-milli'&&!enabled,
   strawberries:state.inventory.strawberry??0,
   harvested:PLOTS.filter(id=>state.farming.plots[id]?.stage==='harvested').length,
   plots:PLOTS.map(id=>{
    const plot=state.farming.plots[id];
    const stage=!plot?'empty':plot.stage==='growing'&&plot.readyAt!==null&&now()>=plot.readyAt?'ready':plot.stage;
    return {id,stage,seconds:stage==='growing'?Math.max(0,Math.ceil((plot.readyAt-now())/1000)):0};
   })};
 }
 function act(id) {
  if(!PLOTS.includes(id))throw Error('ערוגה לא מוכרת');
  const state=store.read();
  if(!active(state))throw Error('הערוגות מחכות למשימת התותים עם מומו');
  const plot=state.farming.plots[id], time=now();
  if(!plot||plot.stage==='empty')return store.commit(`farm:${id}:plant`,{plot:{id,crop:'strawberry',stage:'planted',plantedAt:time,wateredAt:null,readyAt:null,harvestedAt:null}});
  if(plot.crop!=='strawberry')throw Error('בערוגה הזו יש גידול אחר');
  if(plot.stage==='planted')return store.commit(`farm:${id}:water`,{plot:{...plot,id,stage:'growing',wateredAt:Math.max(time,plot.plantedAt),readyAt:Math.max(time,plot.plantedAt)+GROWTH_MS}});
  if(['growing','ready'].includes(plot.stage)){
   if(plot.wateredAt===null||plot.readyAt===null||time<plot.readyAt)throw Error('התות עדיין גדל. נחכה עד שיהיה בשל');
   const last=PLOTS.every(other=>other===id||state.farming.plots[other]?.stage==='harvested');
   return store.commit(`farm:${id}:harvest`,{plot:{...plot,id,stage:'harvested',harvestedAt:time},grant:{strawberry:1},...(last?{quest:{action:'complete-step',expectedStep:'grow-strawberries'}}:{})});
  }
  return {applied:false,persisted:true,state};
 }
 return {snapshot,act};
}
