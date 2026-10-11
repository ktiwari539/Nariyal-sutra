// Real Chromium DOM checkout smoke test against localhost only.
// All non-local browser traffic is blocked. Fake order/email actions prevent writes.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

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
  const pageErrors=[];
  page.on('pageerror',err=>pageErrors.push(String(err)));
  page.on('console',msg=>{if(msg.type()==='error')pageErrors.push('console: '+msg.text());});
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
  await page.locator('#oN').fill('Checkout Test Customer');
  await page.locator('#oP').fill('919876543210');
  await page.locator('#oEmail').fill('checkout-test@example.test');
  await page.locator('#oA').fill('Test locality, Dubai delivery destination');
  await page.locator('#oCity').fill('Dubai');
  await page.locator('#ns-country').selectOption('UAE');
  await page.waitForFunction(()=>window.NSDeliveryState.country==='UAE');
  const debugBefore=await page.evaluate(()=>({
    price:window.getCurrentPrice?.(),product:document.getElementById('oPr')?.value,
    qty:document.getElementById('oQ')?.value,
    state:window.NSDeliveryState?.country,
    deliveryMethod:window.NSDeliveryState?.selectedDelivery,
    saveType:typeof window.NS_SAVE_ORDER,emailType:typeof window.NS_SEND_ORDER_EMAILS,
    submitLock:sessionStorage.getItem('ns_last_submit'),
    saveBody:String(window.NS_SAVE_ORDER).slice(0,160),emailBody:String(window.NS_SEND_ORDER_EMAILS).slice(0,160)
  }));
  console.log('CHECKOUT PRECALL '+JSON.stringify(debugBefore));
  await page.evaluate(()=>window.placeOrder());
  await page.waitForTimeout(1200);
  const debugAfter=await page.evaluate(()=>({
    saved:!!window.__qa?.saved,emailed:!!window.__qa?.emailed,
    extra:window.NS_DELIVERY_EXTRA?.country,
    whatsapp:!!window.__qa?.whatsapp,
    status:document.getElementById('orderSaveStatus')?.textContent,
    error:document.getElementById('ns-del-choice-status')?.textContent,
    confirm:document.getElementById('confirmModal')?.style.display
  }));
  console.log('CHECKOUT AFTERCALL '+JSON.stringify(debugAfter));
  console.log('CHECKOUT PAGEERRORS '+JSON.stringify(pageErrors.slice(-12)));
  assert.ok(debugAfter.saved&&debugAfter.emailed,'Local browser checkout must reach stubbed order and email callbacks');
  const data=await page.evaluate(()=>({
    saved:window.__qa.saved,emailed:window.__qa.emailed,
    wa:window.__qa.whatsapp,extra:window.NS_DELIVERY_EXTRA,
    subtotal:window.getCurrentTotal?.()
  }));
  assert.equal(data.saved.country,'UAE');
  assert.equal(data.saved.city,'Dubai');
  assert.equal(data.saved.total,77);
  assert.equal(data.saved.unitPrice,77);
  assert.equal(data.emailed.country,'UAE');
  assert.equal(data.emailed.total,77);
  assert.equal(data.extra.isInternational,true);
  assert.ok(data.wa?.startsWith('https://wa.me/'),'WhatsApp URL is prepared, not opened');
  const message=decodeURIComponent(new URL(data.wa).searchParams.get('text')||'');
  assert.ok(message.includes('Destination country: UAE'),'WhatsApp destination included');
  assert.ok(message.includes('International quote requested'),'International quote qualification preserved');
  assert.equal(data.subtotal,77);
  await context.close();
  console.log('PASS: local Chromium checkout, UAE destination, ₹77 subtotal, private/email projections, WhatsApp quote. All remote requests blocked.');
} finally {
  if(browser)await browser.close();
  server.kill();
}
