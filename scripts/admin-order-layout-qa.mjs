import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4219';
const OUT=path.join(process.cwd(),'qa-artifacts','admin-order-layout');
fs.mkdirSync(OUT,{recursive:true});
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const server=spawn('python3',['-m','http.server','4219','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(resolve=>setTimeout(resolve,750));
const browser=await chromium.launch({headless:true});

try{
 for(const [label,width,height] of [['desktop',1440,900],['tablet',900,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  const page=await context.newPage(),jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(String(e)));
  await page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#apNav button[data-view="orders"]').click();
  await page.waitForSelector('#apOrdersBody tr');
  await page.waitForSelector('#nsOrderOperations');
  const metrics=await page.evaluate(()=>{
   const view=document.querySelector('.ap-view[data-view="orders"]');
   const table=view.querySelector('.ap-table-wrap'),detail=view.querySelector('#apOrderDetail');
   const lifecycle=detail.querySelector('.ns-order-life');
   const rect=el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom,right:r.right,left:r.left};};
   return {view:rect(view),table:rect(table),detail:rect(detail),
     grid:getComputedStyle(view.querySelector('.ap-split')).gridTemplateColumns,
     lifecycleColumns:getComputedStyle(lifecycle).gridTemplateColumns,
     payment:document.querySelector('#apOrdersBody td:nth-child(5)')?.textContent||'',
     fulfilment:document.querySelector('#apOrdersBody td:nth-child(6)')?.textContent||'',
     detailText:detail.innerText,selected:document.querySelectorAll('#apOrdersBody tr.is-selected').length,
     windowWidth:innerWidth,documentWidth:document.documentElement.scrollWidth};
  });
  console.log('ADMIN ORDERS LAYOUT '+label+': '+JSON.stringify(metrics));
  assert(metrics.table.width>0&&metrics.detail.width>0,label+' Orders area did not render');
  assert(metrics.detail.top>=metrics.table.bottom-3,label+' detail must sit below the full-width list, not stretch it vertically: '+JSON.stringify(metrics));
  assert(Math.abs(metrics.detail.width-metrics.table.width)<5,label+' order list and details must share the same content width: '+JSON.stringify(metrics));
  assert(metrics.selected===1,label+' exactly one order should be highlighted');
  assert(/Status:/i.test(metrics.fulfilment),label+' delivery status must be visible on the list');
  assert(/Door delivery|Hub pickup|Railway handover|Bus-stop handover|International review|Method to confirm/i.test(metrics.fulfilment),label+' delivery preference must be visible or explicitly unconfirmed');
  assert(/Order lifecycle/.test(metrics.detailText),label+' lifecycle missing from details');
  assert(/Advanced · Owner test-data tools/.test(metrics.detailText),label+' Owner test deletion must be separated from standard actions');
  if(label!=='mobile')assert(metrics.documentWidth<=metrics.windowWidth+3,label+' Orders create horizontal document overflow: '+JSON.stringify(metrics));
  await page.locator('#apOrderDetail').screenshot({path:path.join(OUT,'orders-'+label+'.png'),animations:'disabled'});
  assert(jsErrors.length===0,label+' browser errors: '+jsErrors.join(' | '));
  await context.close();
 }
 console.log('ADMIN ORDER LAYOUT QA: PASS (desktop, tablet, mobile, visible fulfilment, full-width details)');
}finally{
 await browser.close();
 server.kill();
}
