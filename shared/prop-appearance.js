import {validateProp} from './prop-rig.js?v=door-sprites4';
const storageKey=id=>`popaPropAppearanceV1:${id}`;
const fields=['position','anchor','scale','scaleY','rotation','layer','parent'];
// Store layout only. Images and part identities always come from the project.
export function savePropAppearance(rig){
 validateProp(rig);
 const parts=rig.parts.map(part=>Object.fromEntries(['id',...fields].filter(key=>part[key]!==undefined).map(key=>[key,part[key]])));
 localStorage.setItem(storageKey(rig.id),JSON.stringify({version:1,id:rig.id,parts}));
}
export function loadPropAppearance(source){
 try{
  const saved=JSON.parse(localStorage.getItem(storageKey(source.id)));
  if(!saved||saved.version!==1||saved.id!==source.id||!Array.isArray(saved.parts)||saved.parts.length!==source.parts.length)return source;
  const ids=new Set(saved.parts.map(p=>p.id));if(ids.size!==source.parts.length||source.parts.some(p=>!ids.has(p.id)))return source;
  const rig=structuredClone(source);
  for(const part of rig.parts){const layout=saved.parts.find(p=>p.id===part.id);for(const key of fields)if(Object.hasOwn(layout,key))part[key]=layout[key];}
  return validateProp(rig);
 }catch{return source;}
}
export function clearPropAppearance(id){localStorage.removeItem(storageKey(id));}
