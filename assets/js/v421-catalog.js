/* Detail pages share the same server-authoritative price controller as checkout. */
(function(){
'use strict';
async function start(){
 if(!window.NSLiveCatalog){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/js/live-catalog.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
 if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname))return;
 try{
 if(!window.NS_FIREBASE_CONFIG)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='firebase-config.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
 const [apps,fs]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);
 const app=apps.getApps().length?apps.getApp():apps.initializeApp(window.NS_FIREBASE_CONFIG);await window.NS_INIT_APP_CHECK?.(app);window.NSLiveCatalog.connect(fs,fs.getFirestore(app));
 }catch(e){window.NSLiveCatalog.unavailable();}
}
start().catch(()=>window.NSLiveCatalog?.unavailable());window.NSV421Catalog={sync:()=>window.NSLiveCatalog?.render()};
})();
