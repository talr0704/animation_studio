import {createStrawberryGarden,REQUIRED_STRAWBERRIES,GROWTH_MS} from './strawberries.js';
const imageUrl=stage=>new URL(`../../assets/scenes/garden/farming/images/${stage}.svg`,import.meta.url).href;
const labels={empty:'שתילה',planted:'השקיה',growing:'גדל',ready:'קטיף',harvested:'נקטף'};
export function mountStrawberryGarden({container,store,onAction,onHome,onFruitGame}) {
 const garden=createStrawberryGarden({store});
 const scene=document.createElement('section');scene.className='strawberry-garden';scene.hidden=true;scene.setAttribute('aria-label','ערוגות התותים של פופה');
 scene.innerHTML='<header class="farm-heading"><h1>התותים לעוגה הראשונה</h1><p id="farm-instruction"></p><p id="farm-inventory"></p></header><div class="farm-plots" aria-label="שלוש ערוגות תותים"></div><div class="farm-controls"><button type="button" id="farm-home">חזרה הביתה</button><button type="button" id="farm-fruit-game">משחק תפיסת פירות</button></div><p id="farm-message" role="status" aria-live="polite"></p>';
 container.append(scene);
 const $=id=>scene.querySelector('#farm-'+id),buttons=new Map();let visible=false,timer;
 for(const [index,plot]of garden.snapshot().plots.entries()){
  const button=document.createElement('button');button.type='button';button.className='farm-plot';button.dataset.plot=plot.id;
  const image=new Image();image.alt='';image.draggable=false;
  const label=document.createElement('span');button.append(image,label);
  button.onclick=()=>{
   try{
    const before=garden.snapshot().plots.find(p=>p.id===plot.id).stage,result=garden.act(plot.id);
    const message=before==='empty'?'שתלנו שתיל תות. עכשיו נשקה אותו.':before==='planted'?`השקינו! התות יבשיל בעוד ${GROWTH_MS/1000} שניות.`:'תות בשל נוסף לסל!';
    $('message').textContent=result.persisted===false?message+' השמירה אינה זמינה — ההתקדמות בביקור הזה זמנית.':message;
    render();onAction({index,stage:before,complete:garden.snapshot().complete});
   }catch(error){$('message').textContent=error.message;render();}
  };
  buttons.set(plot.id,{button,image,label,index});scene.querySelector('.farm-plots').append(button);
 }
 function render(){
  const state=garden.snapshot();scene.dataset.complete=String(state.complete);
  $('instruction').textContent=state.complete?'אספנו את התותים! הצעד הבא: לאפות עם בוני.':state.enabled?'מומו הכין שלושה שתילים. שתלי, השקי וקטפי תות מכל ערוגה.':'קודם נפגוש את מומו בבית ונצטרף להכנת העוגה.';
  $('inventory').textContent=`בסל שלך: ${state.strawberries} תותים · נקטפו ${state.harvested} מתוך ${REQUIRED_STRAWBERRIES}`;
  for(const plot of state.plots){
   const {button,image,label,index}=buttons.get(plot.id),src=imageUrl(plot.stage);
   if(image.src!==src)image.src=src;
   button.dataset.stage=plot.stage;label.textContent=plot.stage==='growing'?`מוכן בעוד ${plot.seconds} שניות`:labels[plot.stage];
   button.disabled=!state.enabled||['growing','harvested'].includes(plot.stage);
   button.setAttribute('aria-label',`ערוגה ${index+1} · ${label.textContent}`);
  }
 }
 $('home').onclick=onHome;$('fruit-game').onclick=onFruitGame;
 const unsubscribe=store.subscribe(()=>{if(visible)render();});
 const refresh=()=>{if(visible)render();};window.addEventListener('storage',refresh);document.addEventListener('visibilitychange',refresh);
 return {setVisible(value){visible=value;scene.hidden=!value;clearInterval(timer);if(value){render();timer=setInterval(render,500);}},destroy(){clearInterval(timer);unsubscribe();window.removeEventListener('storage',refresh);document.removeEventListener('visibilitychange',refresh);scene.remove();}};
}
