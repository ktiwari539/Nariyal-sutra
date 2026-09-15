import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4198';
const OUT=path.join(process.cwd(),'qa-artifacts','people-profile');
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4198','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
let originalState=null;

async function waitAdmin(){
 const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
 must(res&&res.status()<400,`Admin returned ${res?.status()}`);
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V42_PEOPLE_STREAMS__===true,null,{timeout:15000});
 await page.waitForSelector('.ap-app',{state:'visible',timeout:10000});
 await page.waitForTimeout(700);
}

async function openAmbassadors(){
 const nav=page.locator('#apNav button[data-view="ambassadors"]');
 must(await nav.count()===1,'Ambassadors nav missing');
 await nav.click({force:true});
 await page.waitForSelector('.ap-view[data-view="ambassadors"].is-active');
 await page.waitForSelector('#apV42PeopleStreams');
}

try{
 await waitAdmin();
 originalState=await page.evaluate(()=>window.NSV421Store.load());
 const seeded=await page.evaluate(()=>{
   const Store=window.NSV421Store,s=Store.load();
   const people=(s.media||[]).filter(m=>m.cat==='People'&&Store.eligibleForPublic(s,m)&&(m.src||m.thumb));
   if(people.length<2)return {ok:false,count:people.length};
   const [a,b]=people;
   const qaImage=n=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="${n===1?'%23d8e4d3':'%23eadfc9'}"/><text x="400" y="500" text-anchor="middle" font-size="48">QA People ${n}</text></svg>`)}`;
   a.src=a.thumb=qaImage(1);b.src=b.thumb=qaImage(2);
   const personId='QA-PEOPLE-PROFILE';
   s.peopleStreams=s.peopleStreams||{};
   s.peopleStreams.ambassadors=s.peopleStreams.ambassadors||{};
   s.peopleStreams.ambassadors.enabled=true;
   s.peopleStreams.ambassadors.selectedIds=[a.id,b.id];
   a.personId=personId;b.personId=personId;
   s.peopleProfiles=s.peopleProfiles||{};
   s.peopleProfiles[personId]={personId,name:'QA People Profile',city:'Jabalpur',type:'Brand Ambassador',intro:'QA intro',story:'QA story',feedback:'QA feedback',rating:'5',relatedMediaIds:[a.id,b.id],public:true};
   Store.save(s);
   window.dispatchEvent(new CustomEvent('nsv421:change'));
   return {ok:true,first:a.id,second:b.id,firstSrc:a.src||a.thumb,secondSrc:b.src||b.thumb};
 });
 must(seeded.ok,`Need at least two eligible People media records; found ${seeded.count}`);

 await openAmbassadors();
 await page.waitForSelector(`[data-v42-person-row="${seeded.first}"]`);
 const row=page.locator(`[data-v42-person-row="${seeded.first}"]`);
 const fit=await row.locator('.ap-v42-photo img').evaluate(el=>getComputedStyle(el).objectFit);
 must(fit==='contain',`Admin People source preview must be uncropped/contain, got ${fit}`);
 const edit=row.locator('[data-v42-profile]');
 must(await edit.isVisible(),'Edit person details action is not visible');
 const editBox=await edit.boundingBox();
 must(editBox&&editBox.width>=60&&editBox.height>=24,`Edit person details action is not operable: ${JSON.stringify(editBox)}`);
 await edit.click();
 await page.waitForSelector('#v42PersonForm');
 const adminModalText=await page.locator('#apModal').innerText();
 must(adminModalText.includes('Public impact'),'People editor does not explain public impact');
 must(adminModalText.includes('People page'),'People editor does not identify the public destination');
 must(adminModalText.includes('Save person details'),'People editor save action missing');
 const previewFit=await page.locator('.v42-profile-preview img').evaluate(el=>getComputedStyle(el).objectFit);
 must(previewFit==='contain',`People editor full-source preview must use contain, got ${previewFit}`);
 await page.screenshot({path:path.join(OUT,'admin-people-profile-editor.png'),fullPage:false});

 const publicRes=await page.goto(BASE+'/people-of-nariyal-sutra.html',{waitUntil:'domcontentloaded',timeout:30000});
 must(publicRes&&publicRes.status()<400,`People page returned ${publicRes?.status()}`);
 await page.waitForFunction(()=>window.__NS_V421_PEOPLE_PROFILES__===1,null,{timeout:10000});
 await page.waitForSelector('#v25PeopleStreams .v25-story-group[data-v25-primary="1"] .v38-profile-trigger',{timeout:10000});
 const trigger=page.locator('#v25PeopleStreams .v25-story-group[data-v25-primary="1"] .v38-profile-trigger').first();
 must(await trigger.getAttribute('role')==='button','Public People card is not exposed as an accessible button');
 must(await trigger.getAttribute('tabindex')==='0','Public People card is not keyboard focusable');
 await trigger.click();
 await page.waitForSelector('#v38PersonModal.is-open');
 must(await page.locator('#v38PersonName').innerText()==='QA People Profile','Public profile did not resolve the selected person');
 must(await page.locator('#v38PersonModal').getAttribute('role')==='dialog','Public profile is not exposed as a dialog');
 must(await page.locator('#v38PersonModal').getAttribute('aria-modal')==='true','Public profile is missing aria-modal');
 const thumbs=page.locator('#v38PersonModal [data-v38-photo]');
 must(await thumbs.count()>=2,'Related approved People gallery did not render');
 const main=page.locator('#v38PersonMainPhoto');
 const before=await main.getAttribute('src');
 await thumbs.nth(1).click();
 const after=await main.getAttribute('src');
 must(after&&after!==before,'Gallery thumbnail did not switch the main People photo');
 await page.screenshot({path:path.join(OUT,'public-people-profile.png'),fullPage:false});
 await page.keyboard.press('Escape');
 await page.waitForSelector('#v38PersonModal',{state:'detached'});
 await trigger.focus();
 await page.keyboard.press('Enter');
 await page.waitForSelector('#v38PersonModal.is-open');
 await page.locator('.v38-public-close').click();
 await page.waitForSelector('#v38PersonModal',{state:'detached'});
 must(errors.length===0,`People profile page errors: ${JSON.stringify(errors)}`);
 console.log('PEOPLE PROFILE QA: PASS');
} finally {
 if(originalState){
   try{await page.evaluate(s=>window.NSV421Store?.save?.(s),originalState);}catch{}
 }
 await context.close();
 await browser.close();
 server.kill();
}
