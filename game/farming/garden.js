import {gardenGeometry} from './layout.js';
import {createStrawberryGarden,REQUIRED_STRAWBERRIES,GROWTH_MS} from './strawberries.js';
const imageUrl=id=>new URL(`../../assets/scenes/garden/props/10-strawberry-garden/images/${id}.png`,import.meta.url).href;
const labels={empty:'שתילה',planted:'השקיה',growing:'גדל',ready:'קטיף',harvested:'נקטף'};
export function mountStrawberryGarden({container,store,onAction,onHome,onFruitGame,onFocus}) {
 const garden=createStrawberryGarden({store});
 const scene=document.createElement('section');scene.className='strawberry-garden';scene.hidden=true;scene.setAttribute('aria-label','ערוגות התותים של פופה');
 scene.innerHTML='<header class="farm-heading"><h1>התותים לעוגה הראשונה</h1><p id="farm-instruction"></p><p id="farm-inventory"></p><div id="farm-camera" aria-label="מעבר בין הערוגות"></div></header><div class="farm-plots" aria-label="שלוש ערוגות תותים"></div><div class="farm-controls"><button type="button" id="farm-home">חזרה הביתה</button><button type="button" id="farm-fruit-game">משחק תפיסת פירות</button></div><p id="farm-message" role="status" aria-live="polite"></p>';
 container.append(scene);
 const $=id=>scene.querySelector('#farm-'+id),buttons=new Map();let visible=false,timer,focus=0;
 function setFocus(index){focus=index;container.closest('.world').dataset.farmPlot=String(index);for(const b of $('camera').children)b.setAttribute('aria-pressed',String(Number(b.dataset.index)===index));layout();onFocus?.(index);}
 for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.dataset.index=i;b.textContent='ערוגה '+(i+1);b.onclick=()=>setFocus(i);$('camera').append(b);}
 for(const [index,plot]of garden.snapshot().plots.entries()){
  const button=document.createElement('button');button.type='button';button.className='farm-plot';button.dataset.plot=plot.id;
  const artwork=document.createElement('span');artwork.className='farm-art';
  const image=new Image(),plant=new Image(),fruit=new Image();
  for(const img of [image,plant,fruit]){img.alt='';img.draggable=false;artwork.append(img);}
  image.src=imageUrl('bed-frame');image.className='farm-bed';plant.className='farm-plant';fruit.className='farm-fruit';fruit.src=imageUrl('strawberry');
  const label=document.createElement('span');button.append(artwork,label);
  button.onclick=()=>{
   setFocus(index);try{
    const before=garden.snapshot().plots.find(p=>p.id===plot.id).stage,result=garden.act(plot.id);
    const message=before==='empty'?'שתלנו שתיל תות. עכשיו נשקה אותו.':before==='planted'?`השקינו! התות יבשיל בעוד ${GROWTH_MS/1000} שניות.`:'תות בשל נוסף לסל!';
    $('message').textContent=result.persisted===false?message+' השמירה אינה זמינה — ההתקדמות בביקור הזה זמנית.':message;
    render();onAction({index,stage:before,complete:garden.snapshot().complete});
   }catch(error){$('message').textContent=error.message;render();}
  };
  buttons.set(plot.id,{button,image,plant,fruit,label,index});scene.querySelector('.farm-plots').append(button);
 }
 function layout(){
  const width=container.clientWidth,height=container.clientHeight,{scale,left,top,portrait}=gardenGeometry(width,height,focus);
  const backdrop=container.querySelector('.scene-backdrop');backdrop.style.objectPosition=portrait?`${(width-1672*scale)?left/(width-1672*scale)*100:50}% center`:'center';
  for(const {button,index}of buttons.values()){
   button.hidden=portrait&&index!==focus;
   Object.assign(button.style,{position:'absolute',left:(left+([310,832,1350][index]-200)*scale)+'px',top:(top+380*scale)+'px',width:400*scale+'px',flex:'none'});
   button.querySelector('.farm-art').style.height=170*scale+'px';
  }
 }

 function render(){
  const state=garden.snapshot();scene.dataset.complete=String(state.complete);
  $('instruction').textContent=state.complete?'אספנו את התותים! הצעד הבא: לאפות עם בוני.':state.enabled?'מומו הכין שלושה שתילים. שתלי, השקי וקטפי תות מכל ערוגה.':'קודם נפגוש את מומו בבית ונצטרף להכנת העוגה.';
  $('inventory').textContent=`בסל שלך: ${state.strawberries} תותים · נקטפו ${state.harvested} מתוך ${REQUIRED_STRAWBERRIES}`;
  for(const plot of state.plots){
   const {button,plant,fruit,label,index}=buttons.get(plot.id);
   const src=imageUrl(plot.stage==='planted'?'sprout':plot.stage==='growing'?'plant-flowering':'plant-grown');
   if(plant.src!==src)plant.src=src;plant.hidden=plot.stage==='empty';fruit.hidden=plot.stage!=='ready';
   button.dataset.stage=plot.stage;label.textContent=plot.stage==='growing'?`מוכן בעוד ${plot.seconds} שניות`:labels[plot.stage];
   button.disabled=!state.enabled||['growing','harvested'].includes(plot.stage);
   button.setAttribute('aria-label',`ערוגה ${index+1} · ${label.textContent}`);
  }
 }
 const basket=new Image();basket.src=imageUrl('basket');basket.alt='';basket.className='farm-basket-icon';$('inventory').before(basket);
 $('home').onclick=onHome;$('fruit-game').onclick=onFruitGame;
 const unsubscribe=store.subscribe(()=>{if(visible)render();});
 const refresh=()=>{if(visible)render();};const resize=()=>{if(visible)layout();};window.addEventListener('resize',resize);window.addEventListener('storage',refresh);document.addEventListener('visibilitychange',refresh);
 return {setVisible(value){visible=value;scene.hidden=!value;clearInterval(timer);if(value){render();setFocus(focus);timer=setInterval(render,500);}},destroy(){window.removeEventListener('resize',resize);clearInterval(timer);unsubscribe();window.removeEventListener('storage',refresh);document.removeEventListener('visibilitychange',refresh);scene.remove();}};
}
