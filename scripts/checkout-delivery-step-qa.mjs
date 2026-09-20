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
    must(/receive your order/i.test(position.stepText),size+' delivery preference heading missing');
    must(await page.locator('#ns-opt-door').getAttribute('aria-pressed')==='true',size+' door default selection missing');
    must(/delivery\s*\/\s*handover charge\s*:\s*Confirmed after serviceability review/is.test(await page.locator('#ns-del-summary').textContent()),size+' summary misrepresents unknown delivery fees');
    await page.locator('#ns-opt-railway_station').click();
    must(await page.locator('#ns-opt-railway_station').getAttribute('aria-pressed')==='true',size+' railway selection did not persist');
    must(await page.locator('#ns-opt-door').getAttribute('aria-pressed')==='false',size+' previous selection stayed active');
    must(await page.locator('#ns-handover-panel').evaluate(el=>el.classList.contains('show')),size+' railway station details not displayed');
    must(/locality|contact address/i.test(await page.locator('label[for="oA"]').textContent()),size+' pickup still requests handover-point address');
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
