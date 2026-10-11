// Real Chromium DOM checkout smoke test against localhost only.
// All non-local browser traffic is blocked. Fake order/email actions prevent writes.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const port=4215, base='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
  await new Promise(resolve=>setTimeout(resolve,1000));
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
  await context.route('**/*',async route=>{
    const url=route.request().url();
    if(url===base||url.startsWith(base+'/'))return route.continue();
    return route.abort();
  });
  const page=await context.newPage();
  const response=await page.goto(base+'/#order',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200,'Local storefront loads');
  await page.waitForFunction(()=>typeof window.NSLiveCatalog?.accept==='function'
    && typeof window.placeOrder==='function'
    && !!window.NSDeliveryState
    && !!document.getElementById('ns-country'),{timeout:20000});
  await page.evaluate(()=>{
    window.__qa={saved:null,emailed:null,whatsapp:null};
    window.NS_SAVE_ORDER=async record=>{window.__qa.saved=JSON.parse(JSON.stringify(record));return {ok:true};};
    window.NS_SEND_ORDER_EMAILS=async record=>{window.__qa.emailed=JSON.parse(JSON.stringify(record));return [];};
    window.open=url=>{window.__qa.whatsapp=String(url);return null;};
    window.NSLiveCatalog.accept({metadata:{fromCache:false},forEach(fn){
      const prices={tender:77,green:70,bulk:72};
      for(const key of Object.keys(prices))fn({id:key,data:()=>({
        name:'QA '+key,price:prices[key],stock:100,active:true,
        minQty:key==='bulk'?10:1,updatedAt:{seconds:2000}
      })});
    }});
  });
  await page.waitForFunction(()=>document.readyState==='complete'
    && window.__NS_ATTRIBUTION_ORDER_PATCHED__===true
    && !!document.getElementById('nsDiscoverySource'),null,{timeout:10000});
  await page.evaluate(()=>{const q=document.getElementById('oQ');q.value='10';q.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#ns-country').selectOption('UAE');
  await page.waitForFunction(()=>window.NSDeliveryState.country==='UAE');
  // Populate contact details only after destination and delayed form mounts settle.
  await page.locator('#oN').fill('Checkout Test Customer');
  await page.locator('#oP').fill('919876543210');
  await page.locator('#oEmail').fill('checkout-test@example.test');
  await page.locator('#oA').fill('Test locality, Dubai delivery destination');
  await page.locator('#oCity').fill('Dubai');
  // A legitimate customer must provide discovery attribution before checkout.
  await page.evaluate(()=>window.placeOrder());
  assert.match(await page.locator('#toast').textContent()||'',/Please tell us how you heard/i,
    'Required attribution prevents an incomplete checkout');
  assert.equal(await page.evaluate(()=>window.__qa.saved),null,'Incomplete checkout cannot save an order');
  await page.locator('#nsDiscoverySource').selectOption('google_search');
  const fields=await page.evaluate(()=>({
    name:document.getElementById('oN')?.value,
    phone:document.getElementById('oP')?.value,
    address:document.getElementById('oA')?.value
  }));
  assert.ok(fields.name&&fields.phone&&fields.address,'Checkout contact inputs remain populated: '+JSON.stringify(fields));
  await page.evaluate(()=>{
    // Install the synthetic callbacks again after all deferred scripts have finished.
    window.NS_SAVE_ORDER=async record=>{window.__qa.saved=JSON.parse(JSON.stringify(record));return {ok:true};};
    window.NS_SEND_ORDER_EMAILS=async record=>{window.__qa.emailed=JSON.parse(JSON.stringify(record));return [];};
    window.placeOrder();
  });
  try{
    await page.waitForFunction(()=>!!window.__qa.saved&&!!window.__qa.emailed,null,{timeout:12000});
  }catch(error){
    const diagnosis=await page.evaluate(()=>({
      toast:document.getElementById('toast')?.textContent,
      price:window.getCurrentPrice?.(),country:window.NSDeliveryState?.country,
      quantity:document.getElementById('oQ')?.value,
      attribution:document.getElementById('nsDiscoverySource')?.value,
      name:document.getElementById('oN')?.value,
      phone:document.getElementById('oP')?.value,
      address:document.getElementById('oA')?.value,
      stored:!!window.__qa.saved,emailed:!!window.__qa.emailed,
      onlineStatus:document.getElementById('orderSaveStatus')?.textContent,
      firebaseSave:String(window.NS_SAVE_ORDER).slice(0,160),
      lastSubmit:sessionStorage.getItem('ns_last_submit')
    }));
    console.error('CHECKOUT QA DIAGNOSIS '+JSON.stringify(diagnosis));
    throw error;
  }
  const data=await page.evaluate(()=>({
    saved:window.__qa.saved,emailed:window.__qa.emailed,
    wa:window.__qa.whatsapp,extra:window.NS_DELIVERY_EXTRA,
    subtotal:window.getCurrentTotal?.()
  }));
  assert.equal(data.saved.country,'UAE');
  assert.equal(data.saved.city,'Dubai');
  assert.equal(data.saved.total,770);
  assert.equal(data.saved.unitPrice,77);
  assert.equal(data.emailed.country,'UAE');
  assert.equal(data.emailed.total,770);
  assert.equal(data.extra.isInternational,true);
  assert.ok(data.wa?.startsWith('https://wa.me/'),'WhatsApp URL is prepared, not opened');
  const message=decodeURIComponent(new URL(data.wa).searchParams.get('text')||'');
  assert.ok(message.includes('Destination country: UAE'),'WhatsApp destination included');
  assert.ok(message.includes('International quote requested'),'International quote qualification preserved');
  assert.equal(data.subtotal,770);
  await context.close();
  // Verify first paint from the canonical production hostname without contacting
  // production: fulfill the HTML entirely from the checked-out repository.
  const secure=await browser.newContext({serviceWorkers:'block'});
  await secure.route('**/*',async route=>{
    if(route.request().url()==='https://nariyal-sutra.netlify.app/admin-preview.html')
      return route.fulfill({status:200,contentType:'text/html',
        body:fs.readFileSync(new URL('../admin-preview.html',import.meta.url),'utf8')});
    return route.abort();
  });
  const securePage=await secure.newPage();
  const secureResponse=await securePage.goto('https://nariyal-sutra.netlify.app/admin-preview.html',
    {waitUntil:'domcontentloaded',timeout:15000});
  assert.equal(secureResponse?.status(),200,'Synthetic canonical Admin HTML loads');
  const firstPaint=await securePage.evaluate(()=>({
    gated:document.documentElement.classList.contains('ns-production-auth-pending'),
    visibility:getComputedStyle(document.querySelector('.ap-app')).visibility
  }));
  assert.equal(firstPaint.gated,true,'Unauthenticated production Admin starts gated');
  assert.equal(firstPaint.visibility,'hidden','Unauthenticated cached Admin shell stays hidden');
  await secure.close();
  console.log('PASS: localhost checkout and canonical-origin Admin first-paint gate. Zero external network requests.');
} finally {
  if(browser)await browser.close();
  server.kill();
}
