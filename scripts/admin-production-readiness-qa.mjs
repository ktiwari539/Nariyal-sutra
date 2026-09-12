import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const must=(c,m)=>{if(!c)throw new Error(m)};

function staticGate(){
 const read=p=>fs.readFileSync(p,'utf8'),admin=read('admin.html'),bridge=read('assets/js/v421-production-bridge.js'),signer=read('netlify/functions/media-sign-upload.js'),v32=read('assets/js/v32-public.js'),mediaDb=read('assets/js/v421-media-db.js'),v30=read('assets/js/v30-page-sequencing.js'),controls=read('assets/js/v421-content-controls.js');
 must(!admin.includes('admin-live-legacy.html'),'Production /admin still routes to the rejected legacy Admin');
 must(admin.includes('admin-preview.html'),'Production /admin does not route to Business Command Center');
 must(bridge.includes("publicStories','site-config")&&bridge.includes("contentStories','admin-state"),'Production Admin remote configuration bridge is missing');
 must(bridge.includes('uploadMedia')&&bridge.includes('persistCatalog'),'Production Admin is missing durable media/catalog persistence');
 const sourceCommit=bridge.indexOf('if(sourceWrites)await sourceBatch.commit()'),publicPublish=bridge.indexOf("await fsMod.setDoc(fsMod.doc(db,'publicStories','site-config')"),publicHashAdvance=bridge.indexOf('lastPublicHash=ph;',publicPublish);
 must(sourceCommit>=0&&publicPublish>sourceCommit,'Production config must commit the private live source before the public projection');
 must(publicHashAdvance>publicPublish,'Production config must advance the public save hash only after the public write succeeds');
 must(signer.includes('verifyFirebaseToken')&&signer.includes('adminRole')&&/authorization/i.test(signer),'Cloudinary signer is not protected by Firebase Admin authentication');
 must(v32.includes("cinematic:()=>$('#scroll-cinema')"),'Homepage Admin sequencing does not control the current source-to-cut cinematic wrapper');
 must(mediaDb.includes('admin-v38-production.js')&&mediaDb.includes('v421-production-bridge.js'),'Business Command Center production scripts are not loaded');
 must(v30.includes('v421-content-controls.js')&&v30.includes('v421-production-bridge.js'),'Public pages do not load shared remote content configuration');
 must(controls.includes('sectionMedia')&&controls.includes('renderCustom'),'Public image placement/custom section runtime is missing');
 console.log('STATIC PRODUCTION ADMIN GATE: PASS');
}
staticGate();

const BASE='http://127.0.0.1:4175';
const server=spawn('python3',['-m','http.server','4175','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1000));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
const admin=await context.newPage(),home=await context.newPage();const errors=[];admin.on('pageerror',e=>errors.push('admin: '+e));home.on('pageerror',e=>errors.push('home: '+e));
async function waitAdmin(){await admin.waitForSelector('.ap-app',{state:'visible',timeout:12000});await admin.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V38__===true,null,{timeout:12000});}
async function settleHome(){await home.waitForTimeout(1100);await home.mouse.wheel(0,160);await home.waitForFunction(()=>{const m=document.getElementById('main-site');if(!m)return false;const s=getComputedStyle(m);return Number.parseFloat(s.opacity||'0')>.9&&s.pointerEvents!=='none';},null,{timeout:10000});await home.evaluate(()=>scrollTo(0,0));}
try{
 await admin.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});await waitAdmin();
 const baseline=await admin.evaluate(()=>JSON.stringify(window.NSV421Store.load()));
 await admin.locator('#apNav button[data-view="pages"]').click();await admin.waitForSelector('#apV38ImageTargets',{state:'visible',timeout:10000});
 must(await admin.locator('[data-sec-down="cinematic"]').count()===1,'Cinematic move control is missing in Admin');must(await admin.locator('[data-sec-vis="cinematic"]').count()===1,'Cinematic visibility control is missing in Admin');
 await admin.locator('[data-sec-down="cinematic"]').click();
 await home.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});await settleHome();await home.waitForFunction(()=>document.getElementById('scroll-cinema')?.dataset.v32Section==='cinematic',null,{timeout:10000});
 const order=await home.evaluate(()=>[...document.querySelectorAll('#main-site > [data-v32-section]')].map(x=>x.dataset.v32Section));
 must(order.indexOf('cinematic')>order.indexOf('brand-moment'),`Admin cinematic move did not change storefront order: ${JSON.stringify(order)}`);

 await admin.locator('[data-sec-vis="cinematic"]').click();await home.reload({waitUntil:'domcontentloaded'});await home.waitForTimeout(1600);
 const hidden=await home.evaluate(()=>{const e=document.getElementById('scroll-cinema');return !!e&&(e.hidden||getComputedStyle(e).display==='none')});must(hidden,'Admin cinematic visibility toggle does not control current cinematic wrapper');
 await admin.locator('[data-sec-vis="cinematic"]').click();await admin.locator('[data-sec-up="cinematic"]').click();

 await admin.locator('[data-v38-target="homepage-people-teaser"]').click();await admin.waitForSelector('[data-v38-pick]',{state:'visible'});const picked=await admin.locator('[data-v38-pick]').first().getAttribute('data-v38-pick');await admin.locator('[data-v38-pick]').first().click();const pickedSrc=await admin.evaluate(id=>window.NSV421Store.mediaById(window.NSV421Store.load(),id)?.src||'',picked);
 await home.reload({waitUntil:'domcontentloaded'});await home.waitForTimeout(1200);const peopleSrc=await home.locator('#people-of-nariyal .ns-people-visual img').getAttribute('src');must(peopleSrc===pickedSrc,`Admin image change did not reach storefront (${peopleSrc} != ${pickedSrc})`);

 await admin.locator('[data-custom-edit="CS-PEOPLE"]').click();await admin.waitForSelector('#v21SectionForm');const qaTitle='QA People Stories '+Date.now();await admin.locator('#v21SectionForm input[name="title"]').fill(qaTitle);await admin.locator('#v21SectionForm button[type="submit"]').click();await home.reload({waitUntil:'domcontentloaded'});await home.waitForTimeout(1200);must((await home.locator('#ns-face-title').innerText()).includes(qaTitle),'Admin section edit did not update storefront content');

 await admin.waitForSelector('#apV30PageSelect');await admin.locator('#apV30PageSelect').selectOption('fresh-tender-coconut.html');await admin.waitForSelector('#apV30PageRows [data-down]');const firstKey=await admin.locator('#apV30PageRows [data-down]').first().getAttribute('data-down');await admin.locator('#apV30PageRows [data-down]').first().click();const product=await context.newPage();await product.goto(BASE+'/fresh-tender-coconut.html',{waitUntil:'domcontentloaded'});await product.waitForTimeout(900);const seq=await product.evaluate(()=>[...document.querySelectorAll('[data-v30-seq-key]')].filter(x=>!x.hidden).map(x=>x.dataset.v30SeqKey));must(seq.indexOf(firstKey)===1,'Admin non-home page move did not change public page section order');await product.close();

 await admin.locator('#apNav button[data-view="team"]').click();admin.once('dialog',d=>d.accept('QA persistence task'));await admin.locator('#apTaskAdd').click();must(await admin.evaluate(()=>window.NSV421Store.load().tasks.some(t=>t.title==='QA persistence task')),'Task creation did not save');await admin.reload({waitUntil:'domcontentloaded'});await waitAdmin();must(await admin.evaluate(()=>window.NSV421Store.load().tasks.some(t=>t.title==='QA persistence task')),'Task did not survive Admin reload');

 await admin.screenshot({path:'qa-artifacts/admin-functional-readiness.png',fullPage:false});
 await admin.evaluate(raw=>{localStorage.setItem(window.NSV421Store.KEY,raw);window.dispatchEvent(new CustomEvent('nsv421:change'));},baseline);
 must(!errors.length,'Page errors: '+errors.join(' | '));console.log('ADMIN FUNCTIONAL READINESS QA: PASS');
} finally {await browser.close();server.kill();}
