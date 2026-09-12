import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4196';
const OUT=path.join(process.cwd(),'qa-artifacts','admin-e2e');
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4196','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

async function waitAdmin(page){
 const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
 must(res&&res.status()<400,`Admin returned ${res?.status()}`);
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V38__===true&&window.__NS_V421_ADMIN_MEDIA_STUDIO__===true,null,{timeout:15000});
 await page.waitForSelector('.ap-app',{state:'visible',timeout:10000});
 await page.waitForTimeout(1400);
}
async function openNav(page,view,mobile=false){
 if(mobile){const btn=page.locator('#apMenuBtn');if(await btn.isVisible())await btn.click();await page.waitForTimeout(60);}
 const nav=page.locator(`#apNav button[data-view="${view}"]`);
 must(await nav.count()===1,`Missing nav button ${view}`);
 await nav.click({force:true});
 await page.waitForTimeout(view==='delivery'?180:45);
 must(await page.locator(`.ap-view[data-view="${view}"].is-active`).count()===1,`View ${view} did not activate`);
}
async function assertLayout(page,label){
 const layout=await page.evaluate(()=>({iw:innerWidth,sw:document.documentElement.scrollWidth,bw:document.body.scrollWidth,app:!!document.querySelector('.ap-app'),visibleViews:[...document.querySelectorAll('.ap-view.is-active')].map(x=>x.dataset.view)}));
 must(layout.app,`${label}: Admin app missing`);
 must(Math.max(layout.sw,layout.bw)<=layout.iw+4,`${label}: page-level horizontal overflow ${JSON.stringify(layout)}`);
 must(layout.visibleViews.length===1,`${label}: expected one active view ${JSON.stringify(layout.visibleViews)}`);
}
async function navigationMatrix(page,label,mobile=false){
 const views=await page.locator('#apNav button[data-view]').evaluateAll(nodes=>nodes.filter(n=>!n.hidden).map(n=>n.dataset.view));
 must(views.length>=20,`${label}: unexpectedly small Admin navigation set: ${views.length}`);
 for(const view of views){await openNav(page,view,mobile);await assertLayout(page,`${label}/${view}`);}
}
async function submitForm(page,form){
 const button=page.locator(`${form} button.ap-btn.primary`).last();
 must(await button.count()===1,`${form}: primary save button missing`);
 await button.click();
}

async function desktopFunctional(){
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await waitAdmin(page);
 must(new URL(page.url()).pathname==='/admin.html',`Canonical Admin URL not applied: ${page.url()}`);
 await navigationMatrix(page,'desktop',false);

 await openNav(page,'media');
 await page.waitForFunction(()=>document.querySelector('#apMediaGrid .ap-media-card[data-id="WS001"]'));
 const card=page.locator('#apMediaGrid .ap-media-card[data-id="WS001"]');
 must(await card.count()===1,'WS001 media card not addressable');
 const visual=await card.locator('.ap-media-visual').boundingBox();must(visual&&visual.height>=200,`Media preview too small: ${JSON.stringify(visual)}`);
 await card.locator('[data-v39-inspect]').click();await page.waitForSelector('#apV39MediaInspector.is-open');
 const original=await page.locator('#apV39MediaForm').evaluate(form=>Object.fromEntries([...new FormData(form).entries()]));
 const stamp='qa-'+Date.now();
 await page.locator('#apV39MediaForm [name="name"]').fill((original.name||'WS001')+' · QA');
 await page.locator('#apV39MediaForm [name="notes"]').fill(stamp);
 await page.locator('#apV39MediaForm [name="focus"]').selectOption('50% 30%');
 await page.locator('#apV39MediaForm button[type="submit"]').click();
 await waitAdmin(page);await openNav(page,'media');await page.locator('#apMediaGrid .ap-media-card[data-id="WS001"] [data-v39-inspect]').click();
 must(await page.locator('#apV39MediaForm [name="notes"]').inputValue()===stamp,'Media notes did not persist after reload');
 must(await page.locator('#apV39MediaForm [name="focus"]').inputValue()==='50% 30%','Media focus did not persist after reload');
 await page.screenshot({path:path.join(OUT,'desktop-media-inspector.png'),fullPage:false});
 await page.locator('#apV39MediaForm [name="name"]').fill(original.name||'Fresh cut · coastal serve');
 await page.locator('#apV39MediaForm [name="cat"]').fill(original.cat||'Hospitality');
 await page.locator('#apV39MediaForm [name="placement"]').fill(original.placement||'Website library');
 await page.locator('#apV39MediaForm [name="notes"]').fill(original.notes||'');
 await page.locator('#apV39MediaForm [name="focus"]').selectOption(original.focus||'50% 50%');
 await page.locator('#apV39MediaForm button[type="submit"]').click();

 await openNav(page,'products');
 const productBefore=await page.evaluate(()=>window.NSV421Store.load().products[0].name);
 await page.locator('[data-prod="0"]').click();await page.waitForSelector('#v21ProductForm');
 await page.locator('#v21ProductForm [name="name"]').fill(productBefore+' QA');await submitForm(page,'#v21ProductForm');
 must(await page.evaluate(v=>window.NSV421Store.load().products[0].name===v,productBefore+' QA'),'Product edit did not save');
 await waitAdmin(page);must(await page.evaluate(v=>window.NSV421Store.load().products[0].name===v,productBefore+' QA'),'Product edit did not persist across reload');
 await openNav(page,'products');await page.locator('[data-prod="0"]').click();await page.waitForSelector('#v21ProductForm');await page.locator('#v21ProductForm [name="name"]').fill(productBefore);await submitForm(page,'#v21ProductForm');

 await openNav(page,'inventory');
 const incomingBefore=await page.evaluate(()=>window.NSV421Store.load().inventory[0].incoming);
 await page.locator('[data-stock="0"]').click();await page.waitForSelector('#v21StockForm');await page.locator('#v21StockForm [name="incoming"]').fill(String(Number(incomingBefore)+1));await submitForm(page,'#v21StockForm');
 must(await page.evaluate(v=>window.NSV421Store.load().inventory[0].incoming===v,Number(incomingBefore)+1),'Inventory adjustment did not save');
 await openNav(page,'inventory');await page.locator('[data-stock="0"]').click();await page.waitForSelector('#v21StockForm');await page.locator('#v21StockForm [name="incoming"]').fill(String(incomingBefore));await submitForm(page,'#v21StockForm');

 await openNav(page,'schedule');
 const scheduleBefore=await page.evaluate(()=>window.NSV421Store.load().schedule.length);
 await page.locator('#apScheduleNew').click();await page.waitForSelector('#v23ScheduleForm');
 await page.locator('#v23ScheduleForm [name="title"]').fill('QA schedule persistence');await page.locator('#v23ScheduleForm [name="sectionId"]').selectOption('bulk-hero');await page.locator('#v23ScheduleForm [name="startAt"]').fill('2099-01-01T09:00');await page.locator('#v23ScheduleForm [name="endAt"]').fill('2099-01-01T10:00');
 const firstMedia=page.locator('#v23ScheduleMedia input[name="mediaId"]').first();if(!(await firstMedia.isChecked()))await firstMedia.check({force:true});await submitForm(page,'#v23ScheduleForm');
 must(await page.evaluate(n=>window.NSV421Store.load().schedule.length===n+1,scheduleBefore),'Schedule item did not save');
 await waitAdmin(page);must(await page.evaluate(()=>window.NSV421Store.load().schedule.some(x=>x.title==='QA schedule persistence')),'Schedule item did not persist across reload');
 await page.evaluate(()=>{const s=window.NSV421Store.load();s.schedule=s.schedule.filter(x=>x.title!=='QA schedule persistence');window.NSV421Store.save(s);});

 await page.locator('#apQuickCreate').click();must(await page.locator('#apModal.is-open').count()===1,'Quick create did not open');
 await page.screenshot({path:path.join(OUT,'desktop-admin.png'),fullPage:true});
 must(errors.length===0,`Desktop Admin page errors: ${JSON.stringify(errors)}`);
 await context.close();
}

async function responsive(label,viewport){
 const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await waitAdmin(page);await navigationMatrix(page,label,true);
 await openNav(page,'media',true);await page.waitForFunction(()=>document.querySelector('#apMediaGrid .ap-media-card[data-id="WS001"]'));
 await page.locator('#apMediaGrid .ap-media-card[data-id="WS001"] [data-v39-inspect]').click();
 const box=await page.locator('.ap-v39-dialog').boundingBox();must(box&&box.width<=viewport.width+1,`${label}: media inspector exceeds viewport ${JSON.stringify(box)}`);
 await page.screenshot({path:path.join(OUT,`${label}-media-inspector.png`),fullPage:false});
 must(errors.length===0,`${label}: Admin page errors: ${JSON.stringify(errors)}`);await context.close();
}

try{await desktopFunctional();await responsive('tablet',{width:820,height:1180});await responsive('mobile',{width:390,height:844});console.log('ADMIN END-TO-END INTERACTION QA: PASS');}
finally{await browser.close();server.kill();}
