import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4198';
const OUT=path.join(process.cwd(),'qa-artifacts','people-profile');
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
fs.mkdirSync(OUT,{recursive:true});

// Static contract: Admin is the source of public People details, and storefront cards deep-link without changing the rail.
const adminPeople=fs.readFileSync('assets/js/admin-v42-people-streams.js','utf8');
const publicPeople=fs.readFileSync('assets/js/v38-people-profiles.js','utf8');
const storefront=fs.readFileSync('assets/js/v421-storefront-final-polish.js','utf8');
for(const field of ['Name','City','Person type / role','Short About / intro','Story / quote','Feedback / testimonial','Rating (optional)','Related approved People photos'])must(adminPeople.includes(field),`Admin People editor missing ${field}`);
must(adminPeople.includes("'contentStories','site-config'")&&adminPeople.includes("'publicStories','site-config'"),'People Admin does not publish source + public projections');
must(/Owner','Admin','Content/.test(adminPeople),'People profile manage roles changed unexpectedly');
must(publicPeople.includes("'publicStories','site-config'"),'Public People profile does not load public projection');
must(publicPeople.includes("new URLSearchParams(location.search).get('person')"),'People page direct person target is missing');
must(storefront.includes('.ns-face-card[data-id]'),'Storefront People card deep-link wiring missing');
must(storefront.includes('people-of-nariyal-sutra.html?person='),'Storefront People card does not deep-link to person profile');
must(storefront.includes('Preserve the approved People rail visuals/motion'),'Approved rail preservation contract missing');

const server=spawn('python3',['-m','http.server','4198','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];const mutations=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('request',r=>{const u=r.url(),m=r.method();if(u.startsWith(BASE)||['GET','HEAD','OPTIONS'].includes(m))return;let benign=false;try{const x=new URL(u);benign=x.hostname.endsWith('googleapis.com')||x.hostname.endsWith('google-analytics.com')||x.hostname==='nominatim.openstreetmap.org'||x.hostname.endsWith('tile.openstreetmap.org')||x.hostname==='server.arcgisonline.com';}catch{}if(!benign)mutations.push(`${m} ${u}`);});
let originalState=null;

async function waitAdmin(){const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});must(res&&res.status()<400,`Admin returned ${res?.status()}`);await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V42_PEOPLE_STREAMS__===true,null,{timeout:15000});await page.waitForSelector('.ap-app',{state:'visible',timeout:10000});await page.waitForTimeout(700);}
async function openAmbassadors(){const nav=page.locator('#apNav button[data-view="ambassadors"]');must(await nav.count()===1,'Ambassadors nav missing');await nav.click({force:true});await page.waitForSelector('.ap-view[data-view="ambassadors"].is-active');await page.waitForSelector('#apV42PeopleStreams');}

try{
 await waitAdmin();originalState=await page.evaluate(()=>window.NSV421Store.load());
 const seeded=await page.evaluate(()=>{
   const Store=window.NSV421Store,s=Store.load();const railIds=new Set(s.faceMarquee?.selectedIds||[]),people=(s.media||[]).filter(m=>m.cat==='People'&&railIds.has(m.id)&&Store.eligibleForPublic(s,m)&&(m.src||m.thumb));if(people.length<2)return {ok:false,count:people.length};
   const [a,b]=people,qaImage=n=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="${n===1?'%23d8e4d3':'%23eadfc9'}"/><text x="400" y="500" text-anchor="middle" font-size="48">QA People ${n}</text></svg>`)}`;a.src=a.thumb=qaImage(1);b.src=b.thumb=qaImage(2);
   const personId='QA-PEOPLE-PROFILE';s.peopleStreams=s.peopleStreams||{};s.peopleStreams.ambassadors=s.peopleStreams.ambassadors||{};s.peopleStreams.ambassadors.enabled=true;s.peopleStreams.ambassadors.selectedIds=[a.id,b.id];a.personId=personId;b.personId=personId;s.peopleProfiles=s.peopleProfiles||{};s.peopleProfiles[personId]={personId,name:'QA People Profile',city:'Jabalpur',type:'Brand Ambassador',intro:'QA intro written in Admin',story:'QA story written in Admin',feedback:'QA feedback written in Admin',rating:'5',relatedMediaIds:[a.id,b.id],public:true};Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));return {ok:true,personId,first:a.id,second:b.id};
 });
 must(seeded.ok,`Need at least two eligible People media records already present in the approved homepage rail; found ${seeded.count}`);

 await openAmbassadors();await page.waitForSelector(`[data-v42-person-row="${seeded.first}"]`);const row=page.locator(`[data-v42-person-row="${seeded.first}"]`);const fit=await row.locator('.ap-v42-photo img').evaluate(el=>getComputedStyle(el).objectFit);must(fit==='contain',`Admin source preview must be uncropped/contain, got ${fit}`);
 const edit=row.locator('[data-v42-profile]');must(await edit.isVisible(),'Edit person details action is not visible');await edit.click();await page.waitForSelector('#v42PersonForm');const adminModalText=await page.locator('#apModal').innerText();
 for(const text of ['Public impact','People page','Name','City','Person type / role','Short About / intro','Story / quote','Feedback / testimonial','Rating','Related approved People photos'])must(adminModalText.includes(text),`People editor missing ${text}`);
 const previewFit=await page.locator('.v42-profile-preview img').evaluate(el=>getComputedStyle(el).objectFit);must(previewFit==='contain',`People editor preview must use contain, got ${previewFit}`);await page.screenshot({path:path.join(OUT,'admin-people-profile-editor.png'),fullPage:false});

 // Homepage rail must retain its approved card/row structure but point to the exact person profile.
 const home=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});must(home&&home.status()<400,`Homepage returned ${home?.status()}`);
 await page.waitForSelector('#v421CustomerAmbassadorV1, #nsPeopleMarquee',{timeout:12000});
 await page.waitForFunction(id=>[...document.querySelectorAll('.ns-face-card[data-id]')].some(a=>a.dataset.id===id&&a.href.includes('person=')),seeded.first,{timeout:5000});
 const railInfo=await page.evaluate(id=>{const a=[...document.querySelectorAll('.ns-face-card[data-id]')].find(x=>x.dataset.id===id);return{href:a?.getAttribute('href')||'',classes:a?.className||'',row:a?.closest('.ns-face-row')?.dataset.row||'',rail:!!a?.closest('#v421CustomerAmbassadorV1, #nsPeopleMarquee')};},seeded.first);
 must(railInfo.rail,'People card was moved outside the approved rail');must(/ns-face-card/.test(railInfo.classes),'Approved People card class changed');must(railInfo.row,'Approved moving row structure changed');must(railInfo.href.includes(`person=${encodeURIComponent(seeded.personId)}`),'Homepage People card does not target its Admin-authored person profile');must(railInfo.href.endsWith('#people-moving'),'Homepage People deep-link lost People rail destination');

 // Direct storefront → People page target must auto-open the Admin-authored public details.
 const publicRes=await page.goto(BASE+`/people-of-nariyal-sutra.html?person=${encodeURIComponent(seeded.personId)}#people-moving`,{waitUntil:'domcontentloaded',timeout:30000});must(publicRes&&publicRes.status()<400,`People page returned ${publicRes?.status()}`);
 await page.waitForFunction(()=>window.__NS_V421_PEOPLE_PROFILES__===1,null,{timeout:10000});await page.waitForSelector('#v38PersonModal.is-open',{timeout:10000});
 must(await page.locator('#v38PersonName').innerText()==='QA People Profile','Direct People profile did not resolve Admin-authored name');
 const publicText=await page.locator('#v38PersonModal').innerText();
 must(publicText.toLowerCase().includes('brand ambassador'),'Public person modal missing Admin-authored detail: Brand Ambassador');
 for(const text of ['Jabalpur','QA intro written in Admin','QA story written in Admin','QA feedback written in Admin'])must(publicText.includes(text),`Public person modal missing Admin-authored detail: ${text}`);
 must(await page.locator('#v38PersonModal').getAttribute('role')==='dialog','Public profile is not an accessible dialog');must(await page.locator('#v38PersonModal').getAttribute('aria-modal')==='true','Public profile missing aria-modal');
 const thumbs=page.locator('#v38PersonModal [data-v38-photo]');must(await thumbs.count()>=2,'Related approved People gallery did not render');const main=page.locator('#v38PersonMainPhoto'),before=await main.getAttribute('src');await thumbs.nth(1).click();const after=await main.getAttribute('src');must(after&&after!==before,'Related photo did not switch main People photo');await page.screenshot({path:path.join(OUT,'public-people-profile.png'),fullPage:false});
 await page.keyboard.press('Escape');await page.waitForSelector('#v38PersonModal',{state:'detached'});

 // Normal People-stream click remains accessible after deep-link support.
 await page.waitForSelector('#v25PeopleStreams .v25-story-group[data-v25-primary="1"] .v38-profile-trigger',{timeout:10000});const trigger=page.locator('#v25PeopleStreams .v25-story-group[data-v25-primary="1"] .v38-profile-trigger').first();must(await trigger.getAttribute('role')==='button','Public People card is not exposed as button');must(await trigger.getAttribute('tabindex')==='0','Public People card is not keyboard focusable');await trigger.focus();await page.keyboard.press('Enter');await page.waitForSelector('#v38PersonModal.is-open');await page.locator('.v38-public-close').click();await page.waitForSelector('#v38PersonModal',{state:'detached'});
 must(errors.length===0,`People profile page errors: ${JSON.stringify(errors)}`);must(mutations.length===0,`Local People profile QA initiated external mutation(s): ${mutations.join(' | ')}`);
 console.log('PEOPLE PROFILE ADMIN→STOREFRONT QA: PASS');
} finally {if(originalState){try{await page.evaluate(s=>window.NSV421Store?.save?.(s),originalState);}catch{}}await context.close();await browser.close();server.kill();}
