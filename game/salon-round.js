export const HAIR_PARTS=['bangs','side_left','side_right','back_left','back_right'];
export const LENGTHS=['short','medium','long'];
export const ORDERS=[
 {title:'פוני קצר, תלתלים רכים',lengths:[0,1,1,1,1],accessory:'flower',text:'פופה רוצה פוני קצר, צדדים ועורף באורך בינוני וסיכה עם פרח.'},
 {title:'קצר וקופצני',lengths:[1,0,0,0,0],accessory:'bow',text:'הפעם ניצור פוני בינוני, צדדים ועורף קצרים, וסרט סגול לסיום.'},
 {title:'שומרים על האורך',lengths:[1,2,2,1,1],accessory:'flower',text:'פוני ועורף בינוניים, תלתלים ארוכים בצדדים, וסיכת פרח.'},
];
export class SalonRound {
 constructor(order=0){this.order=ORDERS[order%ORDERS.length];this.lengths=Object.fromEntries(HAIR_PARTS.map(name=>[name,2]));this.phase=0;this.strokes=0;this.mistakes=0;this.claimed=false;this.accessory=null;}
 get cutDone(){return HAIR_PARTS.every((name,i)=>this.lengths[name]===this.order.lengths[i]);}
 use(tool,zone='bangs'){
  if(this.claimed||this.phase===7)return {kind:'done'};
  const required=['water','shampoo','water','dryer','scissors','comb',this.order.accessory][this.phase];
  if(tool!==required){this.mistakes++;return {kind:'wrong',required};}
  if(this.phase===4){
   if(!HAIR_PARTS.includes(zone))return {kind:'wrong',required};
   const target=this.order.lengths[HAIR_PARTS.indexOf(zone)];
   if(this.lengths[zone]<=target)return {kind:'ready',zone};
   this.lengths[zone]--;if(this.cutDone)this.phase=5;
   return {kind:'cut',zone};
  }
  if(this.phase===6){this.accessory=tool;this.phase=7;return {kind:'accessory'};}
  this.strokes++;
  if(this.strokes>=3){this.phase++;this.strokes=0;return {kind:'phase',tool};}
  return {kind:'stroke',tool};
 }
 claim(){if(this.phase!==7||this.claimed)return 0;this.claimed=true;return 12+(this.mistakes===0?6:Math.max(0,3-this.mistakes));}
}
