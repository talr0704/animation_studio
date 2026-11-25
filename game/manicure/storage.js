import {progressStore} from '../progress/store.js';
progressStore.initialize();
const DB='popaManicureV1';
async function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('sessions');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readSession(){const db=await database();try{return await new Promise((resolve,reject)=>{const t=db.transaction('sessions'),r=t.objectStore('sessions').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
async function persistSession(value){const db=await database();try{await new Promise((resolve,reject)=>{const t=db.transaction('sessions','readwrite');t.objectStore('sessions').put(value,'current');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}finally{db.close();}}
export function rewardOnce(id,amount=8){try{const result=progressStore.commit('manicure:'+id,{coins:amount,manicureReward:id});return result.applied&&result.persisted?amount:0;}catch{return 0;}}

let writing=Promise.resolve();
export function writeSession(value){const snapshot=structuredClone(value);const result=writing.catch(()=>{}).then(()=>persistSession(snapshot));writing=result;return result;}
