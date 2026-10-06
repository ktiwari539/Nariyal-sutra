// Visual geometry gate: decorative regions must not collide with hero typography.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as fixtures from './fixtures/auth-firebase.mjs';
const out='qa-artifacts/auth-interactive',checks=[],browser=await chromium.launch(),base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function boundedClose(target,label){if(!target)return;await Promise.race([target.close().catch(()=>{}),sleep(5000)]);console.log('CLOSE '+label);}
fs.mkdirSync(out,{recursive:true});
for(const theme of ['nariyal-signature','fresh-grove','coastal-premium','golden-harvest']){
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['narrow',320,740],['landscape',844,390]]){
  const c=await browser.newContext({viewport:{width,height}});c.setDefaultTimeout(15000);c.setDefaultNavigationTimeout(15000);
  await c.addInitScript(()=>{window.__authCalls=[];window.NS_FIREBASE_READY=true;});
  await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.NS_FIREBASE_CONFIG={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'owner@example.com'};window.NS_CUSTOMER_AUTH_PROVIDERS={};window.NS_INIT_APP_CHECK=async()=>null;window.NS_FIREBASE_READY=true;`}));
  await c.route('https://**/*',r=>{const m=r.request().url().match(/firebase-(app-check|app|auth|firestore|storage|analytics|performance)\.js/);return m?r.fulfill({contentType:'application/javascript',body:fixtures[m[1]==='app-check'?'appCheck':m[1]]}):r.abort();});
  await c.route('**/.netlify/functions/published-auth-theme',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({themeId:theme})}));
  for(const kind of ['customer','admin']){
   const p=await c.newPage();await p.goto(base+(kind==='customer'?'/index.html':'/admin-bcc-login.html'),{waitUntil:'domcontentloaded',timeout:15000});
   if(kind==='customer'){await p.waitForFunction(()=>NS_CUSTOMER_CONTEXT?.ready);await p.evaluate(()=>skipIntro());await p.locator('#nsacct-trigger').click();}
   else await p.waitForFunction(()=>!document.getElementById('submit').disabled);
   await p.waitForTimeout(500);
   const result=await p.evaluate(()=>{
    const shell=document.querySelector('.ns-auth-shell');
    // Inspect the actual layered product containers; the checkpoint's oval SVG bounds no longer apply.
    const products=[...shell.querySelectorAll('.ns-nariyal-object,.ns-grove-secondary')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
    const walker=document.createTreeWalker(shell.querySelector('.ns-auth-art-copy'),NodeFilter.SHOW_TEXT);let text,overlap=[];
    while(text=walker.nextNode()){
     if(!text.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(text);
     for(const r of range.getClientRects())if(r.width&&r.height&&products.some(coconut=>coconut.left<r.right&&coconut.right>r.left&&coconut.top<r.bottom&&coconut.bottom>r.top))overlap.push(text.textContent);
    }
    return{overlap,overflow:document.documentElement.scrollWidth>innerWidth||shell.scrollWidth>shell.clientWidth+1};
   });
   const name=`${theme} ${kind} ${label}: hero text and coconut do not overlap; no horizontal overflow`;
   assert.ok(result.overlap.length===0&&!result.overflow,name+JSON.stringify(result));checks.push(name);console.log('PASS '+name);
   if(['desktop','mobile','narrow'].includes(label))await p.screenshot({path:`${out}/chromium-${kind}-${theme}-${label}.png`,timeout:15000});
   await boundedClose(p,`page ${theme} ${kind} ${label}`);
  }
  await boundedClose(c,`context ${theme} ${label}`);
 }
}
await Promise.race([browser.close().catch(()=>{}),sleep(5000)]);fs.writeFileSync(out+'/composition-results.json',JSON.stringify({ok:true,checks},null,2));console.log(`Composition QA PASS (${checks.length} assertions)`);
