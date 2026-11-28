import {mountWatering} from './watering.js?v=scene2';
import {gardenGeometry} from './layout.js?v=scene2';
import {createStrawberryGarden,GROWTH_MS} from './strawberries.js';
const imageUrl=id=>new URL(`../../assets/scenes/garden/props/10-strawberry-garden/images/${id}.png`,import.meta.url).href;
const labels={empty:'שתילה באדמה',planted:'השקיה במשפך',growing:'גדל',ready:'קטיף התות',harvested:'כבר נקטף'};
export function mountStrawberryGarden({container,store,onAction,onHome,onFruitGame}){
 const garden=createStrawberryGarden({store}),scene=document.createElement('section');
 scene.className='strawberry-garden';scene.hidden=true;scene.setAttribute('aria-label','גינת התותים');
 scene.innerHTML='<h1 class="farm-sr">גינת התותים של פופה</h1><p id="farm-instruction" class="farm-sr"></p><div id="farm-camera" aria-label="מיקום בגינה"></div><button type="button" id="farm-pan-previous" class="farm-pan" aria-label="לערוגה הקודמת">‹</button><button type="button" id="farm-pan-next" class="farm-pan" aria-label="לערוגה הבאה">›</button><div class="farm-plots" aria-label="ערוגות התותים"></div><nav class="farm-exits" aria-label="מקומות בגינה"><button type="button" id="farm-home" class="farm-hotspot" aria-label="חזרה הביתה דרך השער" title="הביתה"></button><a id="farm-kitchen" class="farm-hotspot" href="bakery.html" aria-label="למטבח האפייה דרך דלת הבקתה" title="למטבח עם מומו" hidden></a><button type="button" id="farm-fruit-game" class="farm-hotspot" aria-label="משחק תפיסת פירות בעץ" title="תופסים פירות בעץ"></button></nav><div class="farm-collection"><img alt="" id="farm-basket"><span id="farm-inventory"></span></div><p id="farm-message" role="status" aria-live="polite" hidden></p>';
 container.append(scene);
 const $=id=>scene.querySelector('#farm-'+id),buttons=new Map();let visible=false,timer,hintTimer,focus=0,watering,practice=false,practiceWatered=false,lastHint='';
 function notify(text){if(!visible)return;$('message').textContent=text;$('message').hidden=false;clearTimeout(hintTimer);hintTimer=setTimeout(()=>{$('message').hidden=true;},4300);}
 const wateringGarden={snapshot(){const state=garden.snapshot();if(practice){state.enabled=!practiceWatered;state.plots[0]={...state.plots[0],stage:practiceWatered?'growing':'planted',seconds:0};}return state;},act(id){if(!practice)return garden.act(id);practiceWatered=true;return {practice:true,persisted:true};}};
 function startPractice(){watering.setVisible(false);practice=true;practiceWatered=false;lastHint='';render();setFocus(0);watering.setVisible(visible);notify('שתיל לתרגול: גררי את המשפך והשקי גם בצדדים.');}
 function endPractice(){watering.setVisible(false);practice=false;practiceWatered=false;lastHint='';render();watering.setVisible(visible);}
 function setFocus(index){if(practice&&index!==0)endPractice();focus=index;container.closest('.world').dataset.farmPlot=String(index);for(const dot of $('camera').children)dot.dataset.active=String(Number(dot.dataset.index)===index);layout();watering?.refresh();}
 for(let i=0;i<3;i++){const dot=document.createElement('span');dot.dataset.index=i;dot.setAttribute('role','img');dot.setAttribute('aria-label','ערוגה '+(i+1));$('camera').append(dot);}
 $('pan-previous').onclick=()=>setFocus(Math.max(0,focus-1));$('pan-next').onclick=()=>setFocus(Math.min(2,focus+1));
 for(const [index,plot]of garden.snapshot().plots.entries()){
  const button=document.createElement('button');button.type='button';button.className='farm-plot';button.dataset.plot=plot.id;
  const artwork=document.createElement('span');artwork.className='farm-art';
  const plant=new Image(),fruit=new Image();for(const img of [plant,fruit]){img.alt='';img.draggable=false;artwork.append(img);}plant.className='farm-plant';fruit.className='farm-fruit';fruit.src=imageUrl('strawberry');button.append(artwork);
  button.onclick=()=>{setFocus(index);try{const before=garden.snapshot().plots[index].stage,result=garden.act(plot.id);render();notify(result.persisted===false?'השמירה אינה זמינה — ההתקדמות כרגע זמנית.':garden.snapshot().complete?'הסל מלא! דלת הבקתה פתוחה למטבח.':before==='empty'?'השתיל באדמה. קחי את המשפך.':before==='planted'?`השקינו! התות יבשיל בעוד ${GROWTH_MS/1000} שניות.`:'תות נוסף לסל!');onAction?.({index,stage:before,complete:garden.snapshot().complete});}catch(error){notify(error.message);render();}};
  buttons.set(plot.id,{button,plant,fruit,artwork,index});scene.querySelector('.farm-plots').append(button);
 }
 function layout(){
  const width=container.clientWidth,height=container.clientHeight,{scale,left,top,portrait,canPan}=gardenGeometry(width,height,focus);
  container.querySelector('.scene-backdrop').style.objectPosition=canPan?`${(width-1672*scale)?left/(width-1672*scale)*100:50}% center`:'center';
  for(const {button,index,artwork}of buttons.values()){button.hidden=portrait&&index!==focus;Object.assign(button.style,{left:(left+([310,832,1350][index]-200)*scale)+'px',top:(top+380*scale)+'px',width:400*scale+'px',height:280*scale+'px'});artwork.style.height=170*scale+'px';}
  for(const [id,rect,enabled]of [['home',[60,200,250,230],true],['kitchen',[1480,150,175,290],garden.snapshot().complete],['fruit-game',[0,0,255,180],true]]){
   const node=$(id),[x,y,w,h]=rect,px=left+x*scale,py=top+y*scale;node.hidden=!enabled||px+w*scale<15||px>width-15||py+h*scale<0||py>height;
   Object.assign(node.style,{left:px+'px',top:py+'px',width:w*scale+'px',height:h*scale+'px'});
  }
  $('pan-previous').hidden=!canPan||focus===0;$('pan-next').hidden=!canPan||focus===2;$('camera').hidden=!canPan;
  watering?.layout();
 }
 function render(){
  const state=wateringGarden.snapshot();scene.dataset.practice=String(practice);scene.dataset.complete=String(state.complete&&!practice);
  const instruction=practice?(practiceWatered?'השתיל שתה מספיק. אפשר לקחת שוב את המשפך.':'השקי את האדמה סביב שתיל התרגול.'):state.plots[0].stage==='planted'?'גררי את המשפך מעל האדמה ועברי גם לצדדים.':state.complete?'הדלת של הבקתה מובילה למטבח. המשפך זמין לתרגול.':'לחצי על האדמה לשתילה, וקחי את המשפך להשקיה.';
  $('instruction').textContent=instruction;const hintKey=[practice,practiceWatered,state.complete,state.plots[0].stage].join(':');if(hintKey!==lastHint){lastHint=hintKey;notify(instruction);}
  $('inventory').textContent=String(state.strawberries);scene.querySelector('.farm-collection').setAttribute('aria-label',`בסל ${state.strawberries} תותים; נקטפו ${state.harvested} מתוך 3`);
  for(const plot of state.plots){const {button,plant,fruit,index}=buttons.get(plot.id),src=imageUrl(['empty','planted'].includes(plot.stage)?'sprout':plot.stage==='growing'?'plant-flowering':'plant-grown');
   if(plant.src!==src){plant.src=src;if(visible&&!matchMedia('(prefers-reduced-motion:reduce)').matches)plant.animate([{opacity:0,scale:'.97'},{opacity:1,scale:'1'}],{duration:450,easing:'ease-out'});}plant.hidden=plot.stage==='empty';fruit.hidden=plot.stage!=='ready';button.dataset.stage=plot.stage;
   button.disabled=practice||!state.enabled||['growing','harvested'].includes(plot.stage)||index===0&&plot.stage==='planted';button.setAttribute('aria-label',`ערוגה ${index+1} · ${plot.stage==='growing'?`מוכן בעוד ${plot.seconds} שניות`:labels[plot.stage]}`);
  }
  watering?.refresh();if(visible)layout();
 }
 watering=mountWatering({scene,garden:wateringGarden,plot:buttons.values().next().value,onRequestPractice:startPractice,onPick(){setFocus(0);notify('נשקה גם את הצדדים, עד שכל הטיפות כחולות.');},onMessage:notify,onWatered(result){render();notify(result.practice?'השתיל שתה מספיק!':result.persisted===false?'השקינו! ההתקדמות כרגע זמנית.':'האדמה רטובה. התות מתחיל לגדול.');onAction?.({index:0,stage:'planted',complete:!practice&&garden.snapshot().complete});}});
 $('basket').src=imageUrl('basket');$('home').onclick=onHome;$('fruit-game').onclick=onFruitGame;
 scene.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();if(practice)endPractice();else onHome();}});
 const unsubscribe=store.subscribe(()=>{if(visible)render();}),refresh=()=>{if(visible)render();},resize=()=>{if(visible)layout();};window.addEventListener('resize',resize);window.addEventListener('storage',refresh);document.addEventListener('visibilitychange',refresh);
 return {setVisible(value){visible=value;if(!value){practice=false;practiceWatered=false;clearTimeout(hintTimer);$('message').hidden=true;}scene.hidden=!value;watering.setVisible(value);clearInterval(timer);if(value){lastHint='';render();setFocus(focus);timer=setInterval(render,500);}},destroy(){clearTimeout(hintTimer);watering.destroy();window.removeEventListener('resize',resize);clearInterval(timer);unsubscribe();window.removeEventListener('storage',refresh);document.removeEventListener('visibilitychange',refresh);scene.remove();}};
}
