/**
 * Offline mobile layout and image-regression smoke test.
 * Screenshots remain on the ephemeral GitHub runner; no artifact upload.
 * External network is blocked, so this cannot certify third-party maps or live media.
 */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const port=4251, base='http://127.0.0.1:'+port;
const pages=[
 'index.html','coconut-water.html','fresh-tender-coconut.html',
 'green-coconut.html','bulk-coconut-supply.html','coconut-wholesale-export.html',
 'coconut-buying-guide.html','track.html','admin-bcc-login.html','admin-preview.html'
];
const viewports=[{width:390,height:844},{width:430,height:932}];
const output=path.resolve('qa-artifacts/v421-mobile-visual');
mkdirSync(output,{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const report={checks:[],issues:[],blockedRemoteRequests:0};
try {
  await new Promise(resolve=>setTimeout(resolve,950));
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({serviceWorkers:'block',isMobile:true,hasTouch:true,
    viewport:viewports[0],deviceScaleFactor:2,reducedMotion:'reduce'});
  await context.route('**/*',route=>{
    const url=route.request().url();
    // The local HTTP server has no Netlify runtime. Supply the public theme
    // endpoint as an inert fixture instead of counting its expected 404.
    if(url.startsWith(base+'/.netlify/functions/published-auth-theme')){
      return route.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({published:false,enabled:false})});
    }
    if(url===base||url.startsWith(base+'/'))return route.continue();
    report.blockedRemoteRequests++;
    return route.abort();
  });
  const page=await context.newPage();
  const local404=[];
  page.on('response',r=>{
    if(r.url().startsWith(base)&&r.status()>=400)local404.push(r.url()+' status '+r.status());
  });
  for(const vp of viewports){
    await page.setViewportSize(vp);
    for(const name of pages){
      local404.length=0;
      const result=await page.goto(base+'/'+name,{waitUntil:'domcontentloaded',timeout:20000});
      assert.equal(result?.status(),200,name+' must load from local static origin');
      await page.waitForTimeout(name==='index.html'?1450:500);
      const m=await page.evaluate(()=>{
        const vw=window.innerWidth;
        const visible=el=>{
          const s=getComputedStyle(el),r=el.getBoundingClientRect();
          return s.display!=='none'&&s.visibility!=='hidden'&&r.width>5&&r.height>5;
        };
        const broken=[...document.querySelectorAll('img[src]')].filter(img=>
          img.getAttribute('src')?.startsWith('/assets/')||img.getAttribute('src')?.startsWith('assets/'))
          .filter(img=>img.complete&&img.naturalWidth===0)
          .map(img=>img.getAttribute('src')).slice(0,6);
        // Offscreen slide/carousel items and a closed Admin drawer do not cause
        // page-wide horizontal overflow; check these separately from stray controls.
        const ignored=el=>!!el.closest('.promise-portals,.pc,#apSidebar');
        const controls=[...document.querySelectorAll('button,a,input,select,textarea')]
          .filter(visible).filter(el=>{
            const r=el.getBoundingClientRect();
            return r.left< -9||r.right>vw+9;
          });
        const fixed=controls.filter(el=>!ignored(el))
          .map(el=>({id:el.id||null,
            label:el.getAttribute('aria-label')||el.textContent?.trim().slice(0,22)||el.tagName,
            left:Math.round(el.getBoundingClientRect().left),
            right:Math.round(el.getBoundingClientRect().right)})).slice(0,6);
        const intentionallyOffscreen=controls.filter(ignored).length;
        return {viewport:vw,scrollWidth:document.documentElement.scrollWidth,
          title:document.title,h1:document.querySelector('h1')?.textContent?.replace(/\s+/g,' ').trim().slice(0,100)||'',
          broken,offscreenControls:fixed,intentionallyOffscreen,main:!!document.querySelector('main'),numberOfImages:document.images.length};
      });
      const scope=name+' @ '+vp.width+'x'+vp.height;
      if(!m.title)report.issues.push(scope+' missing title');
      if(m.scrollWidth>m.viewport+9)report.issues.push(scope+' horizontal overflow '+m.scrollWidth+' > '+m.viewport);
      if(m.broken.length)report.issues.push(scope+' broken local images '+m.broken.join(','));
      if(m.offscreenControls.length)report.issues.push(scope+' offscreen controls '+JSON.stringify(m.offscreenControls));
      if(local404.length)report.issues.push(scope+' local 404 '+local404.join(','));
      // Screenshots are written only to runner-local temporary files, never uploaded.
      if(['index.html','admin-bcc-login.html','coconut-buying-guide.html'].includes(name)){
        await page.screenshot({path:path.join(output,name.replace('.html','')+'-'+vp.width+'.png'),
          fullPage:false,timeout:10000});
      }
      report.checks.push({name,width:vp.width,layoutWidth:m.scrollWidth,
        localImageCount:m.numberOfImages,brokenLocalImages:m.broken.length,offscreenControls:m.offscreenControls.length,clippedOrDrawerControls:m.intentionallyOffscreen});
    }
  }
  await context.close();
} finally {
  if(browser)await browser.close();
  server.kill();
}
writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
console.log('MOBILE VISUAL QA: '+report.checks.length+' views checked; remote requests blocked='+report.blockedRemoteRequests);
console.log('MOBILE VIEW METRICS '+JSON.stringify(report.checks));
if(report.issues.length){
  console.error('MOBILE VISUAL ISSUES '+JSON.stringify(report.issues));
  process.exitCode=1;
} else {
  console.log('MOBILE VISUAL QA: PASS — no mobile overflow, broken local images, offscreen controls or local 404');
}
