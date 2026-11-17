const KEY='popaSalonAlbumV1';
export const UNLOCKS=[{at:1,id:'bow',label:'סרט סגול'}, {at:2,id:'brush',label:'מברשת טיפוח'}, {at:3,id:'mirror',label:'מראת סלון לבית'}];
export function readAlbum(storage){
 try{
  storage??=globalThis.localStorage;
  const value=JSON.parse(storage.getItem(KEY)||'{}');
  const entries=(Array.isArray(value.entries)?value.entries:[]).filter(e=>e&&typeof e.title==='string'&&['bangs','side_left','side_right','back_left','back_right'].every(k=>Number.isInteger(e.lengths?.[k])&&e.lengths[k]>=0&&e.lengths[k]<=2)&&['flower','bow'].includes(e.accessory)&&['match','care','style','total'].every(k=>Number.isFinite(e.scores?.[k])&&e.scores[k]>=0&&e.scores[k]<=100)).slice(-20);
  return{total:Number.isSafeInteger(value.total)&&value.total>=entries.length?value.total:entries.length,entries};
 }catch{return{total:0,entries:[]};}
}
export function unlocked(album,id){return album.total>=(UNLOCKS.find(item=>item.id===id)?.at??0);}
export function recordVisit(album,round,reward,storage){
 const entry={title:round.order.title,lengths:{...round.lengths},accessory:round.accessory,scores:round.scores,reward,date:new Date().toISOString()};
 const updated={total:album.total+1,entries:[...album.entries,entry].slice(-20)};
 let saved=true;try{(storage??globalThis.localStorage).setItem(KEY,JSON.stringify(updated));}catch{saved=false;}
 return{album:updated,entry,saved,newUnlocks:UNLOCKS.filter(item=>item.at===updated.total)};
}
