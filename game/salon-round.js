export const HAIR_PARTS=['bangs','side_left','side_right','back_left','back_right'];
export const LENGTHS=['short','medium','long'];
export const ORDERS=[
 {title:'פוני קצר, תלתלים רכים',lengths:[0,1,1,1,1],accessory:'flower',text:'פוני קצר ותלתלים בינוניים עם פרח. זאת ההשראה — אפשר גם להוסיף את הטאץ׳ שלך.'},
 {title:'קצר וקופצני',lengths:[1,0,0,0,0],accessory:'bow',text:'פוני בינוני, צדדים קצרים וסרט סגול. בחרי איך ייראה הגימור שלך.'},
 {title:'שומרים על האורך',lengths:[1,2,2,1,1],accessory:'flower',text:'פוני ועורף בינוניים ותלתלים ארוכים בצדדים. הפרטים הקטנים בידיים שלך.'},
];
export const CARE_CELLS=[
 ...[100,140,180].flatMap(y=>[330,400,470].map(x=>({x,y,zone:'crown'}))),
 ...[180,225,270].flatMap(y=>[255,290].map(x=>({x,y,zone:'left'}))),
 ...[180,225,270].flatMap(y=>[510,545].map(x=>({x,y,zone:'right'}))),
];
const FIELD={0:'wet',1:'soap',2:'rinse',3:'dry',5:'groom'};
export class SalonRound {
 constructor(order=0){
  this.order=ORDERS[order%ORDERS.length];this.lengths=Object.fromEntries(HAIR_PARTS.map(name=>[name,2]));
  this.phase=0;this.mistakes=0;this.claimed=false;this.accessory=null;
  this.care=Object.fromEntries(['wet','soap','rinse','dry','groom'].map(key=>[key,CARE_CELLS.map(()=>0)]));
 }
 get cutDone(){return HAIR_PARTS.every((name,i)=>this.lengths[name]===this.order.lengths[i]);}
 coverage(field=FIELD[this.phase]){
  if(!field)return 0;
  const weights=CARE_CELLS.map((_,i)=>field==='rinse'?this.care.soap[i]:1);
  const sum=weights.reduce((a,b)=>a+b,0);
  return sum?this.care[field].reduce((n,v,i)=>n+v*weights[i],0)/sum:0;
 }
 nextPoint(){
  const field=FIELD[this.phase];if(!field)return{x:400,y:170};
  let index=0,best=Infinity;
  for(let i=0;i<CARE_CELLS.length;i++){
   if(field==='rinse'&&this.care.soap[i]<.1)continue;
   if(field==='soap'&&this.care.wet[i]<.1)continue;
   if(this.care[field][i]<best){index=i;best=this.care[field][i];}
  }
  return CARE_CELLS[index];
 }
 use(tool,zone='bangs',point=this.nextPoint()){
  if(this.claimed)return{kind:'done'};
  if((this.phase===6||this.phase===7)&&['flower','bow'].includes(tool)){
   this.accessory=tool;this.phase=7;return{kind:'accessory'};
  }
  if(this.phase===7)return{kind:'done'};
  const required=['water','shampoo','water','dryer','scissors','comb',this.order.accessory][this.phase];
  if(tool!==required&&!(this.phase===5&&tool==='brush')){this.mistakes++;return{kind:'wrong',required};}
  if(this.phase===4){
   if(!HAIR_PARTS.includes(zone))return{kind:'wrong',required};
   if(this.lengths[zone]===0)return{kind:'ready',zone};
   this.lengths[zone]--;return{kind:'cut',zone};
  }
  const field=FIELD[this.phase];let touched=false;
  for(const [i,cell]of CARE_CELLS.entries()){
   const distance=Math.hypot(cell.x-point.x,cell.y-point.y);if(distance>58)continue;
   if(field==='soap'&&this.care.wet[i]<.1)continue;
   if(field==='rinse'&&this.care.soap[i]<.1)continue;
   const amount=.72*(1-distance/80);
   this.care[field][i]=Math.min(1,this.care[field][i]+amount);touched=true;
  }
  if(!touched)return{kind:'outside'};
  const coverage=this.coverage();
  const zones=['crown','left','right'].every(name=>{
   const indices=CARE_CELLS.map((cell,i)=>cell.zone===name?i:-1).filter(i=>i>=0);
   return indices.reduce((sum,i)=>sum+this.care[field][i],0)/indices.length>=.55;
  });
  if(coverage>=.85&&zones){this.phase++;return{kind:'phase',tool};}
  return{kind:'treat',tool,coverage};
 }
 finishCut(){if(this.phase!==4)return false;this.phase=5;return true;}
 get scores(){
  const matching=HAIR_PARTS.reduce((sum,name,i)=>sum+(1-Math.abs(this.lengths[name]-this.order.lengths[i])/2),0)/5;
  const match=Math.round(matching*80+(this.accessory===this.order.accessory?20:this.accessory?10:0));
  const care=Math.round(['wet','soap','rinse','dry','groom'].reduce((sum,key)=>sum+this.coverage(key),0)/5*100);
  const style=50+(this.lengths.side_left===this.lengths.side_right?20:0)+(this.lengths.back_left===this.lengths.back_right?20:0)+(this.accessory?10:0);
  return{match,care,style,total:Math.round(match*.45+care*.35+style*.2)};
 }
 claim(){if(this.phase!==7||this.claimed)return 0;this.claimed=true;return 8+Math.floor(this.scores.total/10);}
}
