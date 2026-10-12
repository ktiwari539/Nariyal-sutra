// Actual V42.2 storefront HTML and assets, isolated at a synthetic staging origin.
// All requests are fulfilled from this checkout or blocked. No live Firebase or orders.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'qa-artifacts/v422-storefront');
fs.mkdirSync(out,{recursive:true});
const origin='https://nariyal-sutra-staging.netlify.app';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const results=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.NS_QA_CHROMIUM||undefined});
try{
  for(const [label,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]){
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce',isMobile:label==='mobile',hasTouch:label!=='desktop'});
    let blockedExternal=0,attemptedWrites=0;
    await context.route('**/*',route=>{
      const req=route.request(),url=new URL(req.url());
      if(!['GET','HEAD'].includes(req.method())){attemptedWrites++;return route.abort();}
      if(url.origin!==origin){blockedExternal++;return route.abort();}
      if(url.pathname==='/.netlify/functions/published-auth-theme')return route.fulfill({contentType:'application/json',body:'{"themeId":"golden-harvest"}'});
      const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
      if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
      return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    await page.goto(origin+'/#order',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.NSLiveCatalog&&!!window.NSDeliveryState&&window.__NS_ATTRIBUTION_ORDER_PATCHED__===true,null,{timeout:20000});
    if(await page.locator('#ji-skip').isVisible())await page.locator('#ji-skip').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('main-site')).pointerEvents!=='none');
    assert.equal(await page.locator('#pAmt').textContent(),'—',label+' initial price must not fabricate a subtotal');
    // Read-only public UX is hydrated with synthetic authoritative catalog values.
    const publish=async change=>page.evaluate(change=>{
      const base={tender:{price:77,minQty:5,stock:100},green:{price:70,minQty:1,stock:100},bulk:{price:72,minQty:10,stock:300}};
      window.__v422QaRevision=(window.__v422QaRevision||0)+1;
      window.NSLiveCatalog.accept({metadata:{fromCache:false},forEach(fn){for(const [key,value] of Object.entries(base))fn({id:key,data:()=>({name:key==='tender'?'Fresh Tender Coconut':key==='green'?'Green Round Coconut':'Bulk Tender Coconut',active:true,...value,...(change?.[key]||{}),updatedAt:{seconds:3000+window.__v422QaRevision}})});}});
    },change);
    await publish();
    assert.equal(await page.locator('#oQ').getAttribute('min'),'5',label+' live minimum attribute');
    assert.equal(await page.locator('#oQ').getAttribute('max'),'100',label+' live stock maximum attribute');
    await page.locator('#oPr').selectOption('tender');
    const check=async(name,total,qty)=>{
      assert.equal(await page.locator('#oQ').inputValue(),String(qty),label+' '+name+' quantity');
      assert.equal(await page.locator('#pAmt').textContent(),'₹'+total.toLocaleString('en-IN'),label+' '+name+' main subtotal');
      assert.equal(await page.evaluate(()=>getCurrentTotal()),total,label+' '+name+' canonical total');
      assert.match(await page.locator('#ns-del-summary').textContent(),new RegExp('₹'+total.toLocaleString('en-IN')),label+' '+name+' delivery recap');
      results.push({viewport:label,case:name,qty,total});
    };
    await check('Tender minimum',385,5);
    await page.locator('button[aria-label="Increase quantity"]').focus();
    await page.locator('button[aria-label="Increase quantity"]').press('Enter');
    await check('Keyboard stepper',462,6);
    await page.locator('#tB').click();await check('Bulk minimum',720,10);
    await page.locator('#oPr').selectOption('green');await check('Retail green switch',700,10);
    await page.locator('#oPr').selectOption('tender');
    await page.evaluate(()=>{const q=document.getElementById('oQ');q.value='0';calc();});
    await check('Zero normalizes to live minimum',385,5);
    assert.equal(await page.locator('#orderSelectionSummary').getAttribute('aria-live'),'polite');
    assert.match(await page.locator('#orderSelectionSummary').textContent(),/Your live order preview/);
    await publish({tender:{price:79}});await check('Live price update',395,5);
    for(const [name,change] of [['Sold out',{stock:0}],['Inactive',{active:false}],['Below minimum',{stock:3}],['Hidden price',{priceVisible:false}]]){
      await publish({tender:change});
      assert.equal(await page.evaluate(()=>getCurrentTotal()),null,label+' '+name+' canonical total');
      assert.equal(await page.locator('#pAmt').textContent(),'—',label+' '+name+' main subtotal');
      assert.doesNotMatch(await page.locator('#ns-del-summary').textContent(),/₹\d/,label+' '+name+' stale charge');
      results.push({viewport:label,case:name,total:null});
    }
    await page.evaluate(()=>window.NSLiveCatalog.unavailable());
    assert.equal(await page.locator('#pAmt').textContent(),'—');
    await publish();await check('Catalog recovery',385,5);
    await page.locator('#order').scrollIntoViewIfNeeded();
    const layout=await page.evaluate(()=>{
      const card=document.querySelector('#order .order-card'),summary=document.getElementById('orderSelectionSummary'),r=card.getBoundingClientRect(),s=summary.getBoundingClientRect();
      return {viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,card:{left:r.left,right:r.right},summary:{left:s.left,right:s.right},text:summary.textContent};
    });
    assert.ok(layout.pageWidth<=width+9,label+' horizontal page overflow: '+JSON.stringify(layout));
    assert.ok(layout.summary.left>=layout.card.left-2&&layout.summary.right<=layout.card.right+2,label+' live preview exceeds card');
    assert.equal(attemptedWrites,0,'No customer/order/provider writes attempted');
    const unexpected=errors.filter(message=>!/Failed to read the 'serviceWorker' property from 'Navigator'.*sandboxed.*allow-same-origin/i.test(message));
    assert.deepEqual(unexpected,[],label+' uncaught browser errors');
    await page.locator('#order .order-card').screenshot({path:path.join(out,label+'-checkout.png')});
    await page.screenshot({path:path.join(out,label+'-viewport.png')});
    results.push({viewport:label,case:'Responsive layout and no writes',layout,blockedExternal,attemptedWrites});
    await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({ok:true,source:'actual HTML; isolated catalog; synthetic staging origin',results},null,2));
  console.log('PASS actual storefront: desktop/tablet/mobile, live prices, minimums, zero, keyboard, stock/activity/visibility changes, recap, no writes ('+results.length+' checks)');
}finally{await browser.close();}
