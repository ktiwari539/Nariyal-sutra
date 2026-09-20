import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4208';
const OUT=path.join(process.cwd(),'qa-artifacts','checkout-delivery-step');
fs.mkdirSync(OUT,{recursive:true});
const must=(condition,message)=>{if(!condition)throw new Error(message);};
const server=spawn('python3',['-m','http.server','4208','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(resolve=>setTimeout(resolve,850));
const browser=await chromium.launch({headless:true});

try{
  for(const [size,width,height] of [['desktop',1440,900],['tablet',820,1100],['mobile',390,844]]){
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    const response=await page.goto(BASE+'/#order',{waitUntil:'domcontentloaded',timeout:30000});
    must(response&&response.ok(),size+' homepage unavailable');
    await page.waitForFunction(()=>document.querySelectorAll('#ns-del-opts-list .ns-del-opt').length===4,null,{timeout:16000});
    const position=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('#order .ofields > *')];
      const at=id=>nodes.indexOf(document.getElementById(id)?.closest('.of')||document.getElementById(id));
      const product=at('oPr'),delivery=at('ns-del-root'),address=at('oA'),city=at('oCity'),notes=at('oX'),summary=at('ns-del-summary');
      const root=document.getElementById('ns-del-root').getBoundingClientRect();
      const order=document.querySelector('#order .order-card').getBoundingClientRect();
      return {product,delivery,address,city,notes,summary,rootWidth:root.width,orderWidth:order.width,stepText:document.getElementById('ns-del-choice-title')?.textContent||''};
    });
    must(position.product<position.delivery&&position.delivery<position.address&&position.address<position.city,size+' delivery must follow product and precede address: '+JSON.stringify(position));
    must(position.notes<position.summary,size+' order summary must follow the address and note: '+JSON.stringify(position));
    must(position.rootWidth<=position.orderWidth+3,size+' delivery section overflows order card: '+JSON.stringify(position));
    const layout=await page.evaluate(()=>{
      const section=document.querySelector('#ns-del-opts-section'),list=document.querySelector('#ns-del-opts-list');
      const cards=[...list.querySelectorAll('.ns-del-opt')];
      const rect=e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right};};
      const computed=el=>{const s=getComputedStyle(el);return {display:s.display,width:s.width,maxWidth:s.maxWidth,minWidth:s.minWidth,grid:s.gridTemplateColumns,justifySelf:s.justifySelf,boxSizing:s.boxSizing,flex:s.flex,position:s.position}};
      const ancestors=[];let el=list;while(el&&ancestors.length<5){ancestors.push({tag:el.tagName,id:el.id,classes:el.className,rect:rect(el),computed:computed(el)});el=el.parentElement;}
      return {section:rect(section),list:rect(list),cards:cards.map(rect),columns:getComputedStyle(list).gridTemplateColumns,viewport:innerWidth,ancestors};
    });
    console.log('CHECKOUT DELIVERY CARD LAYOUT '+size+': '+JSON.stringify(layout));
    must(layout.list.width>=layout.section.width-56,size+' delivery options do not fill the full panel: '+JSON.stringify(layout));
    must(layout.cards.every(x=>x.width>=Math.min(240,layout.list.width*.42)),size+' delivery cards are too narrow: '+JSON.stringify(layout));
    must(layout.cards.every(x=>x.right<=layout.section.right+2),size+' delivery cards overflow the panel: '+JSON.stringify(layout));
    must(/receive your order/i.test(position.stepText),size+' delivery preference heading missing');
    must(await page.locator('#ns-opt-door').getAttribute('aria-pressed')==='true',size+' door default selection missing');
    must(/delivery\s*\/\s*handover charge\s*:\s*Confirmed after serviceability review/is.test(await page.locator('#ns-del-summary').textContent()),size+' summary misrepresents unknown delivery fees');
    await page.locator('#ns-opt-railway_station').click();
    must(await page.locator('#ns-opt-railway_station').getAttribute('aria-pressed')==='true',size+' railway selection did not persist');
    must(await page.locator('#ns-opt-door').getAttribute('aria-pressed')==='false',size+' previous selection stayed active');
    must(await page.locator('#ns-handover-panel').evaluate(el=>el.classList.contains('show')),size+' railway station details not displayed');
    must(/locality|contact address/i.test(await page.locator('label[for="oA"]').textContent()),size+' pickup still requests handover-point address');
    /* Distance must appear only when the customer location and candidate's coordinates exist.
       Route responses are mocked: no hosted traffic or real place requests during CI. */
    const noCoords=await page.evaluate(()=>{
      const state=window.NSDeliveryState;state.lat=null;state.lng=null;
      window.dispatchEvent(new CustomEvent('ns:location-updated',{detail:{...state}}));
      return document.querySelector('#ns-handover-distance')?.textContent||'';
    });
    must(!noCoords,size+' must not invent a distance before customer location is known');
    await page.route(/https:\/\/nominatim\.openstreetmap\.org\/search\?/,async route=>{
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
        {lat:'23.19150',lon:'79.98640',display_name:'QA Station Alpha, Jabalpur, India'},
        {lat:'23.20150',lon:'79.98640',display_name:'QA Station Beta, Jabalpur, India'}
      ])});
    });
    await page.evaluate(()=>{const state=window.NSDeliveryState;state.lat=23.1815;state.lng=79.9864;state.accuracy=35;window.dispatchEvent(new CustomEvent('ns:location-updated',{detail:{...state}}));});
    await page.evaluate(()=>window.nsFindHandover('railway_station'));
    await page.waitForSelector('#ns-place-results [data-ns-place="0"]',{state:'visible'});
    const firstDistance=(await page.locator('#ns-place-results [data-ns-place="0"] .ns-place-distance').textContent())||'';
    must(/Approx\.\s+1\.1\s+km\s+straight-line/i.test(firstDistance)&&/road distance may differ/i.test(firstDistance),size+' place listing must show accurate, qualified straight-line distance: '+firstDistance);
    await page.locator('#ns-place-results [data-ns-place="0"]').click();
    must(/Approx\.\s+1\.1\s+km\s+straight-line/i.test(await page.locator('#ns-del-summary').textContent()),size+' chosen handover distance missing from order summary');
    must(/Approx\.\s+1\.1\s+km\s+straight-line/i.test(await page.locator('#ns-handover-distance').textContent()),size+' chosen handover distance missing beside handover choice');
    await page.locator('#ns-handover-name').fill('Manual station with no known coordinates');
    must(!/Approx\.\s+1\.1\s+km/.test(await page.locator('#ns-del-summary').textContent()),size+' manual handover name must not inherit stale coordinates');
    must(await page.locator('#ns-handover-distance').isHidden(),size+' manual handover name must hide stale distance');
    await page.evaluate(()=>{const state=window.NSDeliveryState;state.lat=null;state.lng=null;window.dispatchEvent(new CustomEvent('ns:location-updated',{detail:{...state}}));});
    await page.locator('#ns-handover-name').fill('Jabalpur Junction');
    must(/Jabalpur Junction/.test(await page.locator('#ns-del-summary').textContent()),size+' preferred railway station missing from summary');
    await page.locator('.ns-recur-btn[onclick*="weekly"]').click();
    must(/Weekly \(preference\)/.test(await page.locator('#ns-del-summary').textContent()),size+' recurring preference missing from summary');
    must(/no automatic orders or payments/i.test((await page.locator('#ns-del-root').textContent()).toLowerCase()),size+' repeat-order consent explanation missing');
    await page.locator('#ns-country').selectOption('UAE');
    must(await page.locator('#ns-opt-trade').count()===1,size+' international trade handover not selected');
    must(await page.locator('#ns-opt-railway_station').count()===0,size+' India-only station handover shown for international order');
    await page.locator('#ns-del-root').screenshot({path:path.join(OUT,'delivery-step-'+size+'.png'),animations:'disabled'});
    must(!errors.length,size+' checkout generated browser errors: '+errors.join(' | '));
    await context.close();
  }
  console.log('CHECKOUT DELIVERY STEP QA: PASS (desktop, tablet, mobile; method, location, summary and recurring controls)');
}finally{
  await browser.close();
  server.kill();
}
