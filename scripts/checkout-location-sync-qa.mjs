import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4206';
const OUT=path.join(process.cwd(),'qa-artifacts','checkout-location-sync');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};
const near=(a,b,t=.000001)=>Math.abs(Number(a)-Number(b))<=t;

/* Static guards for the private order snapshot and regression cases. */
const publicJs=fs.readFileSync(path.join(process.cwd(),'assets/js/v21-public.js'),'utf8');
const orderPatch=fs.readFileSync(path.join(process.cwd(),'ns-order-patch.js'),'utf8');
must(!publicJs.includes('state.accuracy=5'),'checkout location must never invent 5 m accuracy');
must(publicJs.includes('enableHighAccuracy:true')&&publicJs.includes('maximumAge:0'),'GPS must request a fresh high-accuracy reading');
must(publicJs.includes("source:'search',updateAddress:true"),'map search must synchronize the address');
must(publicJs.includes("source:'pin',updateAddress:true"),'pin changes must synchronize the address');
must(publicJs.includes("window.addEventListener('ns:location-updated'"),'map must listen to the shared checkout location state');
must(orderPatch.includes('extra.deliveryAddress=finalAddress'),'private order must retain the final readable delivery address');
must(orderPatch.includes('extra.deliveryLocationSource='),'private order must retain the location source');
must(orderPatch.includes('extra.deliveryCoordinatesConfirmed='),'private order must record whether final coordinates exist');
must(orderPatch.includes("v!==null&&v!==undefined&&v!==''"),'empty coordinates must not coerce to 0,0');

const server=spawn('python3',['-m','http.server','4206','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

const reverseBody={
  place_id:421,
  display_name:'893, Aman Nagar, New Ranjhi, Jabalpur, Madhya Pradesh 482011, India',
  address:{
    house_number:'893',
    road:'Aman Nagar',
    suburb:'New Ranjhi',
    city:'Jabalpur',
    state:'Madhya Pradesh',
    postcode:'482011',
    country:'India',
    country_code:'in'
  }
};

async function installGeocoderMock(page){
  await page.route('https://nominatim.openstreetmap.org/**',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.includes('/reverse')){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(reverseBody)});
      return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{lat:'23.198712',lon:'80.019245',display_name:reverseBody.display_name}])});
  });
}

try{
  const context=await browser.newContext({
    viewport:{width:390,height:844},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true,
    geolocation:{latitude:23.198712,longitude:80.019245,accuracy:18},
    permissions:['geolocation'],
    serviceWorkers:'block'
  });
  const page=await context.newPage();
  await installGeocoderMock(page);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const res=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  must(res&&res.status()<400,`homepage returned ${res?.status()}`);
  await page.waitForFunction(()=>window.NSCheckoutLocation&&document.getElementById('ns-del-root'),null,{timeout:15000});
  await page.waitForSelector('#ns-v21-address-map',{timeout:10000});

  const gps=await page.evaluate(async()=>{
    const r=await window.nsDelGPS();
    const s=window.NSDeliveryState||{};
    return {
      result:r,
      state:{...s},
      address:document.getElementById('oA')?.value||'',
      city:document.getElementById('oCity')?.value||'',
      region:document.getElementById('ns-state')?.value||'',
      pin:document.getElementById('ns-pin')?.value||'',
      status:document.getElementById('ns-gps-status')?.textContent||'',
      mapStatus:document.getElementById('ns-v21-map-status')?.textContent||''
    };
  });
  must(near(gps.state.lat,23.198712)&&near(gps.state.lng,80.019245),`GPS coordinates diverged ${JSON.stringify(gps.state)}`);
  must(Number(gps.state.accuracy)===18,`GPS accuracy was not preserved ${gps.state.accuracy}`);
  must(gps.state.locationSource==='gps',`GPS source missing ${gps.state.locationSource}`);
  must(gps.address===reverseBody.display_name,`delivery address did not use the same reverse-geocoded point: ${gps.address}`);
  must(gps.city==='Jabalpur'&&gps.region==='Madhya Pradesh'&&gps.pin==='482011',`address components are out of sync ${JSON.stringify(gps)}`);
  must(/18 m/.test(gps.status),`GPS accuracy is not visible to the customer: ${gps.status}`);

  const pin=await page.evaluate(async()=>{
    const r=await window.NSCheckoutLocation.apply(23.199111,80.020222,{source:'pin',updateAddress:true});
    const s=window.NSDeliveryState||{};
    return {result:r,state:{...s},address:document.getElementById('oA')?.value||'',coords:document.getElementById('ns-coords-display')?.textContent||''};
  });
  must(near(pin.state.lat,23.199111)&&near(pin.state.lng,80.020222),`pin coordinates diverged ${JSON.stringify(pin.state)}`);
  must(pin.state.accuracy===null,`manual pin must not pretend to have GPS accuracy: ${pin.state.accuracy}`);
  must(pin.state.locationSource==='pin',`pin source missing ${pin.state.locationSource}`);
  must(pin.address===reverseBody.display_name,`pin and address are not synchronized: ${pin.address}`);
  must(/23\.19911/.test(pin.coords)&&/80\.02022/.test(pin.coords),`coordinate display is stale: ${pin.coords}`);
  must(!errors.length,`page errors: ${errors.join(' | ')}`);
  await context.close();

  /* Permission-denied path must give a usable manual fallback, not silently guess. */
  const denied=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const deniedPage=await denied.newPage();
  await installGeocoderMock(deniedPage);
  await deniedPage.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await deniedPage.waitForFunction(()=>window.NSCheckoutLocation&&document.getElementById('ns-gps-status'),null,{timeout:15000});
  await deniedPage.evaluate(async()=>{try{await window.NSCheckoutLocation.current();}catch(e){}});
  const deniedText=await deniedPage.locator('#ns-gps-status').textContent();
  must(/permission|allow Location|manually/i.test(deniedText||''),`permission denial has no manual fallback: ${deniedText}`);
  await denied.close();

  fs.writeFileSync(path.join(OUT,'location-sync-result.json'),JSON.stringify({
    gps:{state:gps.state,address:gps.address,city:gps.city,region:gps.region,pin:gps.pin,status:gps.status,mapStatus:gps.mapStatus},
    pin:{state:pin.state,address:pin.address,coords:pin.coords},
    permissionDeniedMessage:deniedText
  },null,2));

  console.log('CHECKOUT LOCATION SYNC QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
