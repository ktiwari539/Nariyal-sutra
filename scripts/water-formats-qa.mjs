import {chromium} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
const out='qa-artifacts/water-formats';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[];const ok=(name,value)=>{assert.ok(value,name);checks.push(name);};
const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:{width:1600,height:1100}});await c.route('https://**/*',r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:4173/admin-preview.html#water-formats');await p.waitForFunction(()=>window.NSAdminWaterFormats?.workspace);await p.click('[data-view="water-formats"]');
ok('Four private format drafts exist',await p.locator('#nsWaterForm fieldset').count()===4);
ok('Prices deliberately blank',await p.locator('input[name$="-price"]').evaluateAll(xs=>xs.every(x=>x.value==='')));
ok('Missing price prevents publication',await p.locator('#nsWaterPublish').isDisabled());
await p.click('#nsWaterSave');await p.waitForFunction(()=>document.querySelector('#nsWaterStatus').textContent.includes('Draft saved'));
ok('Saving does not publish',await p.evaluate(()=>localStorage.getItem('ns-test-water-published')===null));
for(const theme of ['nariyal-signature','fresh-grove','coastal-premium','golden-harvest'])for(const device of ['desktop','tablet','mobile']){
 await p.selectOption('#nsWaterTheme',theme);await p.selectOption('#nsWaterDevice',device);await p.waitForFunction(({theme,device})=>document.querySelector('#nsWaterPreviewLabel').textContent.includes(theme)&&document.querySelector('#nsWaterPreviewLabel').textContent.includes(device),{theme,device});
 const frame=p.frames().find(f=>f.url()==='about:srcdoc');await frame.waitForSelector('.ns-water-card');ok(`${theme} ${device} complete storefront section`,await frame.locator('.ns-water-card').count()===4);
 ok(`${theme} ${device} no horizontal overflow`,await frame.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
 await p.locator('#nsWaterFrame').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${theme}-${device}.png`});
}
for(const placement of ['after-collection','after-pricing','before-how-to-order']){await p.selectOption('[name="placement"]',placement);await p.waitForFunction(v=>document.querySelector('#nsWaterPreviewLabel').textContent.includes(NSWaterFormats.placements[v].label),placement);const f=p.frames().find(x=>x.url()==='about:srcdoc');await f.waitForSelector('.ns-water-card');const expected=placement==='after-collection'?'#collection':placement==='after-pricing'?'#price-list':'#how-to-order';ok(`${placement} uses the actual neighboring storefront section`,await f.locator(expected).count()===1);await p.screenshot({path:`${out}/placement-${placement}.png`});}
ok('Sandbox blocks scripts, form submission and parent access',await p.locator('#nsWaterFrame').getAttribute('sandbox')==='');
ok('Preview creates no public state',await p.evaluate(()=>localStorage.getItem('ns-test-water-published')===null));
const publicPage=await c.newPage();await publicPage.goto('http://127.0.0.1:4173/index.html?waterPreview=1');ok('Public page and query cannot discover drafts',await publicPage.locator('#coconut-water-formats').count()===0);
ok('Public renderer rejects drafts',await p.evaluate(()=>NSWaterFormats.render(NSAdminWaterFormats.workspace)===''));
await p.evaluate(()=>{const w=NSAdminWaterFormats.workspace;w.products.forEach(x=>{x.price=87;x.availability='Available'});});ok('Complete published payload can render',await p.evaluate(()=>NSWaterFormats.render({...NSAdminWaterFormats.workspace,status:'published'}).includes('ns-water-card')));
await p.selectOption('#apRole','Support');ok('Support cannot manage workspace',await p.locator('#nsWaterApp').innerText()==='Owner or Admin access is required.');
ok('No workspace runtime errors',errors.length===0);fs.writeFileSync(`${out}/results.json`,JSON.stringify({ok:true,checks,errors},null,2));console.log(`Water formats QA PASS (${checks.length} assertions)`);await b.close();
