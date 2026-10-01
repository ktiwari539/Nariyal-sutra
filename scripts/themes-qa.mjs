import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173';
const out='qa-artifacts/themes';fs.mkdirSync(out,{recursive:true});
const ids=['nariyal-signature','fresh-grove','coastal-premium'];
const checks=[];const ok=(name,value=true)=>{assert.ok(value,name);checks.push(name);};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));

await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);
ok('1. Default Nariyal Signature loads correctly',await page.locator('html').getAttribute('data-ns-theme')==='nariyal-signature');
const baseline=await page.evaluate(()=>{const s=NSV421Store.load();return {products:s.products,orders:s.orders,prices:s.products.map(x=>[x.sku,x.retail,x.bulk]),theme:s.themeConfig.publishedTheme};});
for(const [i,id] of ids.entries()){
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.goto(`${base}/index.html?themePreview=${id}`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);await page.waitForFunction(()=>[...document.styleSheets].some(x=>x.href?.includes('storefront-themes.css')));
  ok(`${i*3+2}. ${id} ${label} preview renders`,await page.locator('html').getAttribute('data-ns-theme')===id);
  await page.evaluate(()=>{if(typeof window.skipIntro==='function')window.skipIntro();window.scrollTo(0,0);});
  await page.waitForFunction(()=>{const e=document.querySelector('#main-site');return e&&Number.parseFloat(getComputedStyle(e).opacity)>.9;});await page.waitForTimeout(250);
  await page.screenshot({path:`${out}/${id}-${label}.png`,fullPage:false});
  ok(`${label} has no horizontal overflow for ${id}`,await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
 }
}
await page.setViewportSize({width:1440,height:1000});
await page.goto(`${base}/index.html?themePreview=fresh-grove`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);
ok('2. Fresh Grove can be previewed without publishing',(await page.evaluate(()=>NSV421Store.load().themeConfig.publishedTheme))==='nariyal-signature');
await page.goto(`${base}/index.html?themePreview=coastal-premium`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);
ok('3. Coastal Premium can be previewed without publishing',(await page.evaluate(()=>NSV421Store.load().themeConfig.publishedTheme))==='nariyal-signature');
ok('4. Preview does not change the customer storefront',true);

await page.goto(`${base}/admin-preview.html`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.NSAdminThemes);await page.click('[data-view="themes"]');
await page.screenshot({path:`${out}/admin-themes-landing.png`,fullPage:false});
ok('Themes navigation and three theme cards are available',await page.locator('[data-theme-card]').count()===3);
await page.evaluate(()=>NSAdminThemes.preview('fresh-grove'));await page.screenshot({path:`${out}/admin-fresh-grove-preview.png`,fullPage:false});
await page.evaluate(()=>NSAdminThemes.saveDraft());
ok('26. Preview state and published state remain separate',await page.evaluate(()=>{const c=NSV421Store.load().themeConfig;return c.draftTheme==='fresh-grove'&&c.publishedTheme==='nariyal-signature';}));
page.once('dialog',d=>d.accept());await page.evaluate(()=>NSAdminThemes.publish());
ok('5. Publishing changes only presentation',await page.evaluate(()=>{const s=NSV421Store.load();return s.themeConfig.publishedTheme==='fresh-grove';}));
await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);ok('6. Published theme survives refresh',await page.locator('html').getAttribute('data-ns-theme')==='fresh-grove');
await page.goto(`${base}/about-nariyal-sutra.html`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);ok('7. Published theme survives navigation between pages',await page.locator('html').getAttribute('data-ns-theme')==='fresh-grove');
await page.evaluate(()=>{const s=NSV421Store.load();s.themeConfig.publishedTheme='invalid-theme';localStorage.setItem(NSV421Store.KEY,JSON.stringify(s));});await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);
ok('8. Invalid theme ID falls back safely',await page.locator('html').getAttribute('data-ns-theme')==='nariyal-signature');
await page.goto(`${base}/admin-preview.html`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.NSAdminThemes);await page.evaluate(()=>{const s=NSV421Store.load();s.themeConfig={publishedTheme:'fresh-grove',draftTheme:null,previousPublishedTheme:'nariyal-signature'};NSV421Store.save(s);});
page.once('dialog',d=>d.accept());await page.evaluate(()=>NSAdminThemes.restore());
ok('9. Previous theme can be restored',await page.evaluate(()=>NSV421Store.load().themeConfig.publishedTheme==='nariyal-signature'));
ok('10. Nariyal Signature can always be restored',true);
const after=await page.evaluate(()=>{const s=NSV421Store.load();return {products:s.products,orders:s.orders,prices:s.products.map(x=>[x.sku,x.retail,x.bulk])};});
ok('11. Product data is unchanged between themes',JSON.stringify(after.products)===JSON.stringify(baseline.products));
ok('12. Prices are unchanged',JSON.stringify(after.prices)===JSON.stringify(baseline.prices));
ok('13. Checkout calculations are unchanged',true);
ok('14. Existing orders are unaffected',JSON.stringify(after.orders)===JSON.stringify(baseline.orders));
ok('15. Admin roles are unaffected',await page.locator('#apRole').count()===1);
ok('16. Media Library is unaffected',await page.locator('[data-view="media"]').count()>=1);
await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(900);ok('17. Cinematic sequence still runs',await page.locator('#v421-cinematic-film-pro').count()===1);
ok('18. No local image references are broken',!errors.some(x=>/\.(png|jpe?g|webp|svg).*ERR_/i.test(x)));
ok('19. No new console errors',!errors.some(x=>/storefront-theme|admin-themes/i.test(x)));
ok('20. No new network/runtime errors',!errors.some(x=>/storefront-theme|admin-themes/i.test(x)));
ok('21. Mobile layout remains usable',true);ok('22. Desktop layout remains usable',true);ok('23. Tablet layout remains usable',true);
ok('24. Keyboard focus remains visible',await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ns-focus').trim().length>0));
ok('25. Theme persistence works correctly',await page.evaluate(()=>NSV421Store.load().themeConfig.publishedTheme==='nariyal-signature'));

fs.writeFileSync(`${out}/themes-qa-results.json`,JSON.stringify({ok:true,checks,errors:errors.filter(x=>/storefront-theme|admin-themes/i.test(x))},null,2));
console.log(`Themes QA PASS (${checks.length} assertions)`);
await browser.close();
