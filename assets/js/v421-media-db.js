(function(){
'use strict';
const DB='nariyalMediaV21',STORE='blobs';
function open(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function put(key,blob){const d=await open();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(blob,key);t.oncomplete=()=>res(key);t.onerror=()=>rej(t.error);});}
async function get(key){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(STORE).objectStore(STORE).get(key);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
async function del(key){const d=await open();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
async function hydrate(root){const imgs=[...(root||document).querySelectorAll('img[data-local-blob-key]')];for(const img of imgs){try{const b=await get(img.dataset.localBlobKey);if(b){const u=URL.createObjectURL(b);img.src=u;img.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(u),2000),{once:true});}}catch(e){}}}
window.NSV421MediaDB={put,get,delete:del,hydrate};
})();
