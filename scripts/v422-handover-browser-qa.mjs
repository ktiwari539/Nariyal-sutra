// Actual storefront, public-place fixtures and production CSP. No live orders,
// credentials, geolocation prompts or communications are allowed during QA.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'qa-artifacts/v422-handover');
fs.mkdirSync(out,{recursive:true});
fs.rmSync(path.join(out,'results.json'),{force:true});
const origin='https://nariyal-sutra-staging.netlify.app';
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').match(/Content-Security-Policy: (.*)/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const results=[];
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++;}
const railway={elements:[...Array.from({length:9},(_,i)=>({type:'node',id:i+1,lat:23.1815+(9-i)*.01,lon:79.9864,tags:{railway:'station',name:'QA Station '+(9-i),ref:'NS'+(9-i),'addr:city':'Jabalpur'}})),
  {type:'way',id:22,center:{lat:23.1915,lon:79.9864},tags:{railway:'station',name:'QA Station 1',ref:'NS1'}},
  {type:'node',id:23,lat:null,lon:79.9864,tags:{railway:'station',name:'Invalid coordinate'}},
  {type:'node',id:24,lat:28.18,lon:79.98,tags:{railway:'station',name:'Outside radius'}},
  {type:'node',id:25,lat:23.1815,lon:79.9864,tags:{railway:'station',name:'Private',access:'private'}},
  {type:'node',id:26,lat:23.1815,lon:79.9864,tags:{amenity:'cafe',name:'Wrong type'}}]};
const bus={elements:[
  {type:'way',id:31,center:{lat:23.2115,lon:79.9864},tags:{amenity:'bus_station',name:'QA Bus Stand'}},
  {type:'node',id:32,lat:23.1915,lon:79.9864,tags:{highway:'bus_stop',name:'QA Bus Stop'}},
  {type:'node',id:33,lat:23.2015,lon:79.9864,tags:{public_transport:'platform',bus:'yes',name:'QA Bus Platform'}},
  {type:'node',id:34,lat:23.1915,lon:79.9864,tags:{railway:'station',name:'Wrong railway result'}}]};
function rgb(s){return s.match(/[\d.]+/g).slice(0,3).map(Number);}
function luminance(s){const a=rgb(s).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*a[0]+.7152*a[1]+.0722*a[2];}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const browser=await chromium.launch({headless:true});
try{
  for(const theme of ['nariyal-signature','fresh-grove','coastal-premium','golden-harvest']){
    for(const [viewport,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]){
      console.log('CHECK transport '+theme+' '+viewport);
      const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
      const requests=[],errors=[];
      let writes=0,geoCalls=0,responseMode='normal',hold=null;
      await context.addInitScript(()=>{
        window.__geoCalls=0;navigator.geolocation.getCurrentPosition=()=>{window.__geoCalls++;};
        window.__cityEdits=[];
        window.__focusEdits=[];
        const nativeFocus=HTMLElement.prototype.focus;
        HTMLElement.prototype.focus=function(...args){window.__focusEdits.push({focus:this.id||this.tagName,stack:new Error().stack});return nativeFocus.apply(this,args);};
        document.addEventListener('focusin',event=>window.__focusEdits.push({event:'focusin',id:event.target.id||event.target.tagName}),true);
        document.addEventListener('focusout',event=>window.__focusEdits.push({event:'focusout',id:event.target.id||event.target.tagName}),true);
        const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
        Object.defineProperty(HTMLInputElement.prototype,'value',{...descriptor,set(value){if(this.id==='oCity')window.__cityEdits.push({value,stack:new Error().stack});return descriptor.set.call(this,value);}});
        document.addEventListener('input',event=>{if(event.target.id==='oCity')window.__cityEdits.push({input:event.target.value,connected:event.target.isConnected});},true);
      });
      await context.route('**/*',async route=>{
        const req=route.request(),url=new URL(req.url());
        if(!['GET','HEAD'].includes(req.method())){writes++;return route.abort();}
        if(['overpass-api.de','overpass.private.coffee'].includes(url.hostname)){
          requests.push({provider:'overpass',host:url.hostname,query:url.searchParams.get('data')});
          if(responseMode==='fail'||(responseMode==='primary-fail'&&url.hostname==='overpass-api.de'))return route.fulfill({status:503,body:'unavailable'});
          if(responseMode==='hold'){hold=route;return;}
          const rail=url.searchParams.get('data').includes('railway');
          return route.fulfill({contentType:'application/json',body:JSON.stringify(responseMode==='empty'?{elements:[]}:rail?railway:bus)});
        }
        if(url.hostname==='nominatim.openstreetmap.org'){
          requests.push({provider:'geocoder',query:url.searchParams.get('q')});
          return route.fulfill({contentType:'application/json',body:JSON.stringify([{lat:'23.1815',lon:'79.9864',display_name:'Jabalpur, Madhya Pradesh, India'}])});
        }
        if(url.origin!==origin)return route.abort();
        if(url.pathname==='/.netlify/functions/published-auth-theme')return route.fulfill({contentType:'application/json',body:JSON.stringify({themeId:theme})});
        const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
        if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
        return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file),headers:url.pathname==='/'?{'Content-Security-Policy':csp}:{}});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
      await page.goto(origin+'/?themePreview='+theme+'#order',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.NSLiveCatalog&&window.NSDeliveryState&&window.nsFindHandover&&window.skipIntro);
      await page.evaluate(()=>{skipIntro();NSLiveCatalog.accept({metadata:{fromCache:false},forEach(fn){for(const key of ['tender','green','bulk'])fn({id:key,data:()=>({name:'QA '+key,active:true,price:77,minQty:1,stock:100,updatedAt:{seconds:1000}})});}});});
      await page.waitForFunction(theme=>document.documentElement.dataset.nsTheme===theme,theme);
      await page.waitForFunction(()=>document.querySelector('link[data-ns-theme-asset="styles"]')?.sheet&&getComputedStyle(document.getElementById('main-site')).pointerEvents!=='none');
      await page.waitForFunction(()=>getComputedStyle(document.getElementById('jungle-intro')).display==='none'&&!document.body.classList.contains('ns-intro-owned'));
      await page.locator('#ns-opt-railway_station').click();
      await page.locator('#ns-find-handover').click();
      await page.waitForFunction(()=>document.getElementById('oCity')===document.activeElement,null,{timeout:1500});
      const focused=await page.locator('#oCity').evaluate(e=>e===document.activeElement);
      if(!focused)console.error(JSON.stringify(await page.evaluate(()=>({active:document.activeElement?.id,focusEvents:window.__focusEdits,cityEdits:window.__cityEdits}))));
      check(focused,theme+' '+viewport+' missing-location action focuses city');
      check(/city or PIN/.test(await page.locator('#ns-handover-status').textContent()),'missing-location guidance is actionable');
      check(requests.length===0,'no place requests before an explicit location is provided');
      await page.locator('#oCity').fill('Jabalpur');
      check(await page.locator('#oCity').inputValue()==='Jabalpur','city entry is committed before moving to state');
      const cityNode=await page.locator('#oCity').elementHandle();
      await page.evaluate(async()=>{window.dispatchEvent(new CustomEvent('nsv421:change'));await new Promise(resolve=>setTimeout(resolve,80));});
      check(await cityNode.evaluate(e=>e.isConnected&&e===document.activeElement&&e.value==='Jabalpur'),'section reapplication retains city element, focus and typed value');
      if(theme==='nariyal-signature'&&viewport==='desktop'){
        // A synthetic published configuration checks real Admin sequencing;
        // never save settings or call Firebase during the fixture.
        await page.evaluate(async()=>{
          window.__qaOriginalStoreLoad=NSV421Store.load;
          const s=NSV421Store.load(),sections=[...s.sections].sort((a,b)=>a.order-b.order);
          const order=sections.find(x=>x.id==='order');
          window.__qaSections=[order,...sections.filter(x=>x!==order)].map((x,i)=>({...x,order:i+1}));
          NSV421Store.load=()=>({...window.__qaOriginalStoreLoad(),sections:window.__qaSections});
          window.dispatchEvent(new CustomEvent('nsv421:change'));await new Promise(resolve=>setTimeout(resolve,80));
        });
        check(await page.evaluate(()=>document.querySelector('#main-site [data-v32-section]')?.id==='order'),'published section reorder still moves order to requested position');
        check(await cityNode.evaluate(e=>e.isConnected&&e===document.activeElement&&e.value==='Jabalpur'),'real reorder retains typed city and restores input focus');
        await page.evaluate(async()=>{window.__qaSections=window.__qaSections.map(s=>s.id==='order'?{...s,visible:false}:s);window.dispatchEvent(new CustomEvent('nsv421:change'));await new Promise(resolve=>setTimeout(resolve,80));});
        check(await page.locator('#order').isHidden(),'published hide control remains effective');
        await page.evaluate(async()=>{NSV421Store.load=window.__qaOriginalStoreLoad;window.dispatchEvent(new CustomEvent('nsv421:change'));await new Promise(resolve=>setTimeout(resolve,80));});
        check(await cityNode.evaluate(e=>e.isConnected&&e.value==='Jabalpur')&&await page.locator('#order').isVisible(),'restoring published layout retains city input and visibility');
      }
      await page.locator('#ns-state').fill('Madhya Pradesh');
      check(requests.length===0,'typing does not geocode or prompt GPS');
      await page.locator('#ns-find-handover').click();
      try{await page.waitForFunction(()=>document.querySelectorAll('#ns-handover-options option').length===10);}catch(error){
        const diagnostic=await page.evaluate(()=>({state:{...NSDeliveryState},status:document.querySelector('#ns-handover-status')?.textContent,city:document.querySelector('#oCity')?.value,cityEdits:window.__cityEdits,cityCount:document.querySelectorAll('#oCity').length,region:document.querySelector('#ns-state')?.value,options:document.querySelector('#ns-handover-options')?.innerHTML}));
        fs.writeFileSync(path.join(out,'failed-'+theme+'-'+viewport+'.json'),JSON.stringify({diagnostic,requests,errors},null,2));
        console.error(JSON.stringify({diagnostic,requests,errors}));throw error;
      }
      const options=await page.locator('#ns-handover-options option').allTextContents();
      check(options[1].includes('QA Station 1 (NS1)')&&options[9].includes('QA Station 9 (NS9)'),'all nine valid mapped stations sorted nearest first, beyond former five limit');
      check(options.slice(1).every(s=>/^Approx\. [\d.]+ km · /.test(s)),'every compact dropdown option starts with distance so it remains visible on mobile');
      check(/straight-line.*road distance may differ.*entered locality centre/.test(await page.locator('#ns-handover-status').textContent()),'city-only distances are clearly qualified by the dropdown description');
      check(await page.evaluate(()=>NSDeliveryState.lat===null&&NSDeliveryState.lng===null),'locality centre is not saved as an exact customer pin');
      check(requests.filter(r=>r.provider==='geocoder').length===1,'one explicit locality resolution');
      check(requests.find(r=>r.provider==='overpass').query.includes('around:30000'),'railway radius is explicit');
      await page.locator('#ns-handover-options').selectOption('8');
      let state=await page.evaluate(()=>({...NSDeliveryState}));
      check(state.handoverPointName==='QA Station 9 (NS9)'&&state.handoverSearchSource==='overpass'&&state.handoverPointLat===23.2715,'dropdown selection preserves name/code, source and handover coordinates');
      check(/QA Station 9/.test(await page.locator('#ns-del-summary').textContent()),'selection appears in order recap');
      const count=requests.length;
      await page.locator('button[aria-label="Increase quantity"]').click();
      check(await page.locator('#ns-handover-options').inputValue()==='8','quantity re-render preserves dropdown and selection');
      check(requests.length===count,'quantity update does not refetch places');

      const surfaces=await page.evaluate(()=>{
        const selectors=['#ns-handover-title','#ns-handover-help','#ns-handover-status','#ns-handover-name','#ns-handover-note','#ns-handover-options','.ns-del-frequency .ns-step-heading','.ns-del-frequency .ns-step-intro','.ns-recur-btn.sel'];
        return selectors.map(selector=>{const el=document.querySelector(selector),style=getComputedStyle(el);let owner=el;while(owner&&getComputedStyle(owner).backgroundColor==='rgba(0, 0, 0, 0)')owner=owner.parentElement;return {selector,ink:style.color,surface:getComputedStyle(owner).backgroundColor,image:getComputedStyle(owner).backgroundImage,placeholder:el.tagName==='INPUT'?getComputedStyle(el,'::placeholder').color:null};});
      });
      for(const surface of surfaces){check(surface.image==='none','owned checkout surface is opaque: '+surface.selector);check(contrast(surface.ink,surface.surface)>=4.5,theme+' '+surface.selector+' text contrast: '+JSON.stringify(surface));if(surface.placeholder)check(contrast(surface.placeholder,surface.surface)>=4.5,'placeholder contrast: '+surface.selector);}
      check(await page.locator('#ns-handover-options').evaluate(e=>e.getBoundingClientRect().right<=innerWidth),'native dropdown stays in viewport');
      await page.locator('#ns-opt-bus_stop').click();
      await page.locator('#ns-find-handover').click();
      await page.waitForFunction(()=>document.querySelectorAll('#ns-handover-options option').length===4);
      const busOptions=await page.locator('#ns-handover-options option').allTextContents();
      check(busOptions[1].includes('QA Bus Stop')&&busOptions[2].includes('QA Bus Platform')&&busOptions[3].includes('QA Bus Stand'),'bus stops, platforms and stands all appear sorted by distance');
      check(requests.filter(r=>r.provider==='geocoder').length===1,'rail/bus searches share cached locality centre');
      await page.locator('#ns-handover-options').selectOption('2');
      check((await page.evaluate(()=>NSDeliveryState.handoverPointName))==='QA Bus Stand','bus dropdown stores chosen stand');
      await page.locator('#ns-handover-options').focus();await page.locator('#ns-handover-options').press('ArrowUp');
      check((await page.evaluate(()=>NSDeliveryState.handoverPointName))==='QA Bus Platform','native keyboard selection updates preferred point');
      await page.locator('#ns-handover-name').fill('My preferred manual stop');
      state=await page.evaluate(()=>({...NSDeliveryState}));
      check(state.handoverPointLat===null&&state.handoverPointLng===null&&state.handoverSearchSource==='manual','manual override clears former point coordinates');
      check(await page.locator('#ns-handover-distance').isHidden(),'manual text cannot invent distance');
      check(await page.locator('#ns-handover-options').inputValue()==='','manual entry clears dropdown selection');
      await page.locator('#ns-handover-panel').screenshot({path:path.join(out,theme+'-'+viewport+'.png')});

      // A pin update is authoritative and automatically refreshes the active mode.
      await page.evaluate(()=>{NSDeliveryState.lat=23.1815;NSDeliveryState.lng=79.9864;window.dispatchEvent(new CustomEvent('ns:location-updated'));});
      await page.waitForFunction(()=>document.querySelectorAll('#ns-handover-options option').length===4);
      check(/Distances use your selected location/.test(await page.locator('#ns-handover-status').textContent()),'pin distances use precise selected location');
      await page.locator('#ns-handover-options').selectOption('0');
      await page.locator('#ns-handover-options').selectOption('');
      check(await page.evaluate(()=>NSDeliveryState.handoverPointName===''&&NSDeliveryState.handoverPointLat===null&&NSDeliveryState.handoverPointLng===null),'clearing the dropdown also clears the saved preferred point');
      await page.locator('#oCity').fill('Another city');
      check(await page.evaluate(()=>NSDeliveryState.lat===null&&NSDeliveryState.lng===null),'manual locality change invalidates old delivery pin');
      check(await page.locator('#ns-place-picker').isHidden(),'locality change removes stale dropdown');
      check(await page.locator('#ns-handover-distance').isHidden(),'no stale distance after locality change');

      if(viewport==='mobile'&&theme==='golden-harvest'){
        responseMode='primary-fail';
        await page.locator('#ns-find-handover').click();
        await page.waitForFunction(()=>document.querySelectorAll('#ns-handover-options option').length===4);
        check(requests.at(-1).host==='overpass.private.coffee','primary public-service failure uses exactly one bounded alternate service');
        await page.locator('#oCity').fill('Delayed search city');
        responseMode='hold';
        await page.locator('#ns-find-handover').click();
        await page.waitForFunction(()=>document.querySelector('#ns-find-handover').disabled);
        while(!hold)await new Promise(r=>setTimeout(r,25));
        const delayed=hold;responseMode='normal';
        await page.locator('#ns-opt-railway_station').click();
        await page.locator('#ns-find-handover').click();
        await page.waitForFunction(()=>document.querySelectorAll('#ns-handover-options option').length===10);
        await delayed.fulfill({contentType:'application/json',body:JSON.stringify(bus)}).catch(()=>{});
        check((await page.locator('#ns-handover-options option').nth(1).textContent()).includes('QA Station 1'),'late bus response cannot replace active railway options');
        responseMode='fail';
        await page.locator('#oCity').fill('Failed search city');await page.locator('#ns-find-handover').click();
        await page.waitForFunction(()=>/unavailable/.test(document.querySelector('#ns-handover-status').textContent));
        check(await page.locator('#ns-handover-name').isEnabled(),'provider failure preserves manual entry');
        check(await page.locator('#ns-find-handover').isEnabled(),'provider failure permits retry');
        responseMode='empty';
        await page.locator('#ns-find-handover').click();
        await page.waitForFunction(()=>/No mapped option/.test(document.querySelector('#ns-handover-status').textContent));
        check(await page.locator('#ns-place-picker').isHidden(),'empty response has clear manual fallback, no fake options');
      }
      await page.locator('#ns-country').selectOption('UAE');
      check(await page.locator('#ns-handover-panel').isHidden(),'international trade hides India transport choices');
      geoCalls=await page.evaluate(()=>window.__geoCalls);
      check(geoCalls===0,'no automatic GPS permission request');check(writes===0,'zero attempted order, notification or payment writes');
      const unexpected=errors.filter(s=>!/Failed to read the 'serviceWorker' property from 'Navigator'.*sandboxed.*allow-same-origin/.test(s));
      check(unexpected.length===0,'no uncaught browser errors: '+unexpected.join(' | '));
      results.push({theme,viewport,railwayCount:9,busCount:3,surfaces,requests,geoCalls,writes});
      await context.close();
    }
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({ok:true,assertions,responsiveCases:results.length*2,source:'actual storefront HTML; production CSP; isolated public-map fixtures',results},null,2));
  console.log('PASS transport dropdowns: '+assertions+' assertions / '+results.length*2+' theme, viewport and mode cases');
}finally{await browser.close();}
