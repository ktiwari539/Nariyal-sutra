import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const BASE='http://127.0.0.1:4212',REFERENCE=['WS002','WS004','WS007','WS008','WS009','WS011'],CLEAN=['WS001','WS003','WS005','WS006','WS010'];
const must=(c,m)=>{if(!c)throw new Error(m)};
const server=spawn('python3',['-m','http.server','4212','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});
async function visible(page){return page.locator('#apMediaGrid .ap-media[data-v42-visible="1"] .ap-media-id').allTextContents();}
async function filter(page,key){
 await page.waitForFunction(k=>{const nodes=[...document.querySelectorAll('[data-v42-filter="'+k+'"]')],button=nodes.find(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');if(!button)return false;button.click();return true;},key,{timeout:5000});
 await page.waitForFunction(k=>document.querySelector('#apMediaGrid')?.dataset.activeFilter===k||[...document.querySelectorAll('[data-v42-filter="'+k+'"]')].some(n=>n.getAttribute('aria-pressed')==='true'),key,{timeout:5000});
}
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(9000);
 await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_MEDIA_STUDIO__===true&&window.__NS_V421_ADMIN_MEDIA_ORGANIZER__===true,null,{timeout:15000});
 await page.evaluate(()=>{const s=window.NSV421Store.load(),base=window.NSV421Store.mediaById(s,'WS001');const add=x=>{if(!s.media.some(m=>m.id===x.id))s.media.push(x)};add({...base,id:'QA-DUP-WS001',name:'QA duplicate source',homepageAllowed:false,placement:'Library only'});add({id:'QA-REVIEW',name:'QA needs review',cat:'Product',status:'Needs review',visible:false,publicAllowed:true,homepageAllowed:false,placement:'Library only',src:'assets/images/nariyal-premium-hero.webp',thumb:'assets/images/nariyal-premium-hero.webp'});add({id:'QA-ARCHIVE',name:'QA archived',cat:'Brand',status:'Archived',visible:false,publicAllowed:false,homepageAllowed:false,placement:'Library only',src:'assets/images/nariyal-premium-hero.webp',thumb:'assets/images/nariyal-premium-hero.webp'});window.NSV421Store.save(s);});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_MEDIA_ORGANIZER__===true,null,{timeout:15000});
 await page.locator('#apNav button[data-view="media"]').click();await page.waitForSelector('#apV42MediaOrganizer',{state:'visible'});await page.waitForFunction(()=>window.NSV421AdminMediaOrganizer?.ready===true&&document.querySelector('#apMediaGrid')?.dataset.organizerReady==='1'&&document.querySelector('#apMediaGrid')?.dataset.activeFilter==='website-ready'&&Number(document.querySelector('#apMediaGrid')?.dataset.visibleCount||0)>0,null,{timeout:10000});
 const keys=await page.locator('[data-v42-filter]').evaluateAll(ns=>ns.map(n=>n.dataset.v42Filter));
 for(const k of ['website-ready','in-use','people','reference','needs-review','archived','all'])must(keys.includes(k),'Missing filter '+k);
 const defaults=await visible(page);
 for(const id of REFERENCE)must(!defaults.includes(id),'Default leaked reference '+id);
 for(const id of CLEAN)must(defaults.includes(id),'Default omitted '+id);
 for(const id of ['AMB101-P','AMB102-P','AMB201-P'])must(!defaults.includes(id),'Website-ready duplicated People '+id);
 must(await page.locator('[data-v42-filter="website-ready"]').getAttribute('aria-pressed')==='true','Website-ready active state missing');
 await filter(page,'reference');must(await page.locator('[data-v42-filter="reference"]').getAttribute('aria-pressed')==='true','Reference did not activate');const refs=await visible(page);
 for(const id of REFERENCE)must(refs.includes(id),'Reference omitted '+id);for(const id of CLEAN)must(!refs.includes(id),'Reference leaked '+id);
 await filter(page,'people');must(await page.locator('[data-v42-filter="people"]').getAttribute('aria-pressed')==='true','People did not activate');const people=await visible(page);
 for(const id of ['AMB101-P','AMB102-P','AMB201-P'])must(people.includes(id),'People omitted '+id);for(const id of CLEAN)must(!people.includes(id),'People leaked '+id);
 await filter(page,'needs-review');must((await visible(page)).includes('QA-REVIEW'),'Needs-review omitted QA record');
 await filter(page,'archived');must((await visible(page)).includes('QA-ARCHIVE'),'Archived omitted QA record');
 await filter(page,'all');must(await page.locator('#apMediaGrid').getAttribute('data-active-filter')==='all','All did not apply to grid');
 const ids=await visible(page),stateIds=await page.evaluate(()=>window.NSV421Store.load().media.map(m=>m.id));
 must(ids.length===stateIds.length,'All filter incomplete');must(new Set(ids).size===ids.length&&new Set(stateIds).size===stateIds.length,'Media IDs duplicated/lost');
 const dup=page.locator('[data-id="WS001"] [data-v42-duplicate="WS001"]');must(await dup.count()===1,'Duplicate badge missing');
 const search=page.locator('#apV42MediaSearch');await search.fill('WS004');await page.waitForTimeout(100);let found=await visible(page);must(found.length===1&&found[0]==='WS004','ID search failed');
 await search.fill('golden backwaters');await page.waitForTimeout(100);found=await visible(page);must(found.includes('WS004'),'Title search failed');
 for(const width of [1280,820,390]){await page.setViewportSize({width,height:900});await filter(page,'all');for(const id of ['AMB101-P','WS001']){const card=page.locator('#apMediaGrid .ap-media-card[data-id="'+id+'"]');await card.scrollIntoViewIfNeeded();const actions=card.locator('.ap-media-actions button');must(await actions.count()>=3,width+'px '+id+' missing actions');}}
 must(!errors.length,'Page errors: '+errors.join(' | '));
 console.log('ADMIN MEDIA ORGANIZER QA: PASS');
}finally{await browser.close().catch(()=>{});server.kill();}
