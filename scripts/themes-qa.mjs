import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173',out='qa-artifacts/themes';
fs.mkdirSync(out,{recursive:true});
const ids=['nariyal-signature','fresh-grove','coastal-premium','golden-harvest'],viewports=[['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]];
const sections=[['hero','#home'],['products','#collection'],['pricing','#price-list'],['story','#our-story'],['people','#people-of-nariyal'],['checkout','#order'],['why','.why-grid'],['process','.process'],['cinema','#harvest-film'],['motion','#live-motion'],['brand','.brand-moment'],['footer','footer']];
const checks=[];const ok=(name,value=true)=>{assert.ok(value,name);checks.push(name);};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&/\.(?:png|jpe?g|webp|svg)(?:\?|$)/i.test(r.url()))errors.push(`${r.url()} HTTP ${r.status()}`);});
page.on('requestfailed',r=>{const reason=r.failure()?.errorText||'';if(!/ERR_ABORTED/i.test(reason))errors.push(`${r.url()} ${reason}`);});
async function ready(url){await page.goto(url,{waitUntil:'domcontentloaded'});if(new URL(url).pathname.includes('admin')){await page.waitForTimeout(180);return;}await page.waitForFunction(()=>document.documentElement.dataset.nsTheme);await page.evaluate(()=>{if(typeof window.skipIntro==='function')window.skipIntro();const e=document.querySelector('#v421-cinematic-film-pro');if(e)e.style.display='none';document.documentElement.style.scrollBehavior='auto';});await page.waitForFunction(()=>{const e=document.querySelector('#main-site');return e&&Number.parseFloat(getComputedStyle(e).opacity)>.9;});await page.waitForTimeout(180);}
async function contrastAudit(theme){
 return page.evaluate(themeId=>{
  const parse=s=>{const m=String(s).match(/[\d.]+/g);if(!m)return null;return[m[0],m[1],m[2],m[3]??1].map(Number);},blend=(fg,bg)=>{const a=Math.max(0,Math.min(1,fg[3]));return fg.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a));},lum=c=>{const v=c.slice(0,3).map(x=>x/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2];},ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const roots=['nav','#collection','#price-list','#our-story','#how-to-order','#coconut-uses','#people-of-nariyal','.ns-people-marquee','.nutrition','.benefits','.why-section','.process','#faq','#order','#contact','.brand-moment','#harvest-film','#live-motion','.v23-community','footer'];
  const failures=[],seen=new Set();
  for(const rootSel of roots){const root=document.querySelector(rootSel);if(!root)continue;for(const el of root.querySelectorAll('h1,h2,h3,h4,p,li,label,small,a,button,span,input,select,textarea,.wc-title,.wc-desc,.ps-title,.ps-desc,.cinema-point b')){const text=((el.innerText??el.textContent)||el.placeholder||'').trim();if(seen.has(el)||!text&&!el.matches('input,textarea')||text&&!/[A-Za-z0-9₹]/.test(text))continue;seen.add(el);const cs=getComputedStyle(el),r=el.getBoundingClientRect();if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)<.45||r.width<2||r.height<2)continue;let bg=null,n=el,complex=false;while(n){const ns=getComputedStyle(n),c=parse(ns.backgroundColor);if(c&&c[3]>=.95){bg=c.slice(0,3);break;}if(ns.backgroundImage&&ns.backgroundImage!=='none'){complex=true;break;}n=n.parentElement;}const fg=parse(cs.color);if(!fg||!bg||complex)continue;const finalFg=blend(fg,bg),cr=ratio(finalFg,bg),large=parseFloat(cs.fontSize)>=24||parseFloat(cs.fontSize)>=18&&Number(cs.fontWeight)>=700,min=large?3:4.5;if(cr+0.05<min)failures.push({selector:rootSel,tag:el.tagName,text:text.slice(0,70),color:cs.color,background:bg.join(','),ratio:+cr.toFixed(2),minimum:min});}}
  const root=getComputedStyle(document.documentElement),tokenPairs=[['--ns-heading','--ns-surface'],['--ns-body','--ns-surface'],['--ns-muted','--ns-surface'],['--ns-heading','--ns-page'],['--ns-body','--ns-page'],['--ns-link','--ns-page']];
  for(const [fgName,bgName] of tokenPairs){const resolveToken=name=>{const value=root.getPropertyValue(name).trim();if(!value)throw new Error('Missing active theme token '+name);const probe=document.createElement('span');probe.style.color=value;document.body.append(probe);const color=parse(getComputedStyle(probe).color);probe.remove();if(!color)throw new Error('Invalid active theme token '+name);return color;};const fg=resolveToken(fgName),bg=resolveToken(bgName);const cr=ratio(blend(fg,bg),bg);if(cr<4.5)failures.push({selector:':root',tag:'TOKEN',text:`${themeId} ${fgName} on ${bgName}`,color:root.getPropertyValue(fgName),background:root.getPropertyValue(bgName),ratio:+cr.toFixed(2),minimum:4.5});}
  return failures;
 },theme);
}

await ready(`${base}/index.html`);await page.evaluate(()=>localStorage.clear());await ready(`${base}/index.html`);
ok('Nariyal Signature is the default fallback',await page.locator('html').getAttribute('data-ns-theme')==='nariyal-signature');
const baseline=await page.evaluate(()=>{const s=NSV421Store.load();return{products:s.products,orders:s.orders,prices:s.products.map(x=>[x.sku,x.retail,x.bulk]),sections:s.sections,theme:s.themeConfig.publishedTheme};});
const fingerprints={};
for(const id of ids){
 for(const [label,width,height] of viewports){
  await page.setViewportSize({width,height});await ready(`${base}/index.html?themePreview=${id}`);
  ok(`${id} ${label} preview renders`,await page.locator('html').getAttribute('data-ns-theme')===id);
  ok(`${id} ${label} has no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
  let contrast=await contrastAudit(id);if(contrast.length){await page.waitForTimeout(600);contrast=await contrastAudit(id);}fs.writeFileSync(`${out}/${id}-${label}-contrast.json`,JSON.stringify(contrast,null,2));if(contrast.length)console.error(`${id} ${label} contrast failures`,JSON.stringify(contrast));
  for(const [name,selector] of sections){const loc=page.locator(selector).first();if(!await loc.count()||!await loc.isVisible())continue;await loc.scrollIntoViewIfNeeded();await page.waitForTimeout(80);await page.screenshot({path:`${out}/${id}-${label}-${name}.png`,fullPage:false});}
  if(contrast.length)throw new Error(`${id} ${label} contrast failed (${contrast.length}); see contrast JSON`);ok(`${id} ${label} customer text meets computed contrast thresholds`,true);if(id==='fresh-grove')ok(`fresh-grove ${label} has no detected light-on-light text`,contrast.length===0);
  if(label==='desktop')fingerprints[id]=await page.evaluate(()=>{const card=document.querySelector('#collection .pc'),section=document.querySelector('#collection'),button=document.querySelector('#collection .pc-btn'),footer=document.querySelector('footer'),cs=x=>getComputedStyle(x);return{grid:cs(document.querySelector('.prod-grid')).gridTemplateColumns,cardDisplay:cs(card).display,cardPadding:cs(card).padding,imageRadius:cs(card.querySelector('.pc-img-wrap')).borderRadius,peopleGrid:cs(document.querySelector('.ns-people-teaser')).gridTemplateColumns,headingAlign:cs(document.querySelector('.sec-hd')).textAlign,page:cs(document.body).backgroundColor,section:cs(section).backgroundImage+cs(section).backgroundColor,card:cs(card).backgroundImage+cs(card).backgroundColor,radius:cs(card).borderRadius,border:cs(card).borderTopWidth+cs(card).borderTopColor,button:cs(button).backgroundColor+cs(button).color+cs(button).letterSpacing,footer:cs(footer).backgroundColor+cs(footer).borderTopColor};});
 }
}
for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const fields=['grid','cardDisplay','cardPadding','imageRadius','peopleGrid','headingAlign'];ok(`${ids[i]} and ${ids[j]} differ in layout`,fields.filter(k=>fingerprints[ids[i]][k]!==fingerprints[ids[j]][k]).length>=2);}

async function adminContrastAudit(){
 return page.evaluate(()=>{
  const parse=s=>{const m=String(s).match(/[\\d.]+/g);if(!m)return null;return[m[0],m[1],m[2],m[3]??1].map(Number);};
  const blend=(fg,bg)=>{const a=Math.max(0,Math.min(1,fg[3]));return fg.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a));};
  const lum=c=>{const v=c.slice(0,3).map(x=>x/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const roots=['.ap-content','#nsDashboardV2','.ap-view[data-view="media"]','.ap-view[data-view="themes"]','.ap-view[data-view="orders"]','.ap-view[data-view="inventory"]','.ap-view[data-view="delivery"]'];
  const failures=[],seen=new Set();
  for(const rootSel of roots){const root=document.querySelector(rootSel);if(!root)continue;for(const el of root.querySelectorAll('h1,h2,h3,h4,p,li,label,small,a,button,span,input,select,textarea,th,td,strong,b')){const text=((el.innerText??el.textContent)||el.placeholder||'').trim();if(seen.has(el)||(!text&&!el.matches('input,textarea'))||(text&&!/[A-Za-z0-9₹]/.test(text)))continue;seen.add(el);const cs=getComputedStyle(el),r=el.getBoundingClientRect();if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)<.45||r.width<2||r.height<2)continue;let bg=null,n=el,complex=false;while(n){const ns=getComputedStyle(n),col=parse(ns.backgroundColor);if(col&&col[3]>=.95){bg=col.slice(0,3);break;}if(ns.backgroundImage&&ns.backgroundImage!=='none'&&!/gradient/i.test(ns.backgroundImage)){complex=true;break;}n=n.parentElement;}const fg=parse(cs.color);if(!fg||!bg||complex)continue;const finalFg=blend(fg,bg),cr=ratio(finalFg,bg),large=parseFloat(cs.fontSize)>=24||parseFloat(cs.fontSize)>=18&&Number(cs.fontWeight)>=700,min=large?3:4.5;if(cr+0.05<min)failures.push({root:rootSel,tag:el.tagName,text:text.slice(0,70),color:cs.color,background:bg.join(','),ratio:+cr.toFixed(2),minimum:min});}}
  return failures;
 });
}

await page.setViewportSize({width:1440,height:1000});await ready(`${base}/admin-preview.html`);await page.waitForFunction(()=>window.NSAdminThemes);
ok('Business Command Center inherits the published storefront theme',await page.locator('html').getAttribute('data-ns-admin-theme')===baseline.theme);
const adminPaletteBaseline=await page.evaluate(()=>{const cs=getComputedStyle(document.documentElement);return{bg:cs.getPropertyValue('--bg').trim(),panel:cs.getPropertyValue('--panel').trim(),accent:cs.getPropertyValue('--gold2').trim()};});
await page.evaluate(()=>{const s=NSV421Store.load();s.themeConfig={...s.themeConfig,publishedTheme:'golden-harvest',manualOverride:null,schedules:[]};NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));});
await page.waitForFunction(()=>document.documentElement.dataset.nsAdminTheme==='golden-harvest');
const adminPaletteGolden=await page.evaluate(()=>{const cs=getComputedStyle(document.documentElement);return{bg:cs.getPropertyValue('--bg').trim(),panel:cs.getPropertyValue('--panel').trim(),accent:cs.getPropertyValue('--gold2').trim()};});
ok('Business Command Center palette changes with the selected storefront theme',JSON.stringify(adminPaletteBaseline)!==JSON.stringify(adminPaletteGolden));
for(const adminTheme of ids){
 await page.evaluate(themeId=>{const s=NSV421Store.load();s.themeConfig={...s.themeConfig,publishedTheme:themeId,manualOverride:null,schedules:[]};NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},adminTheme);
 await page.waitForFunction(themeId=>document.documentElement.dataset.nsAdminTheme===themeId,adminTheme);
 await page.waitForTimeout(180);
 const adminContrast=await adminContrastAudit();
 fs.writeFileSync(`${out}/admin-${adminTheme}-contrast.json`,JSON.stringify(adminContrast,null,2));
 if(adminContrast.length)throw new Error(`${adminTheme} Admin contrast failed (${adminContrast.length}); see contrast JSON`);
 ok(`Business Command Center ${adminTheme} text meets computed contrast thresholds`,true);
}
await page.evaluate(themeId=>{const s=NSV421Store.load();s.themeConfig={...s.themeConfig,publishedTheme:themeId,manualOverride:null,schedules:[]};NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},baseline.theme);
await page.waitForFunction(themeId=>document.documentElement.dataset.nsAdminTheme===themeId,baseline.theme);
await page.click('[data-view="themes"]');
await page.screenshot({path:`${out}/admin-theme-scheduling.png`,fullPage:true});
ok('Admin shows effective, base, active, next and fallback theme summaries',await page.locator('.ns-theme-stat').count()===5);
const beforePreview=await page.evaluate(()=>NSV421Store.load().themeConfig.publishedTheme);await page.evaluate(()=>NSAdminThemes.preview('fresh-grove'));ok('Preview never publishes',await page.evaluate(x=>NSV421Store.load().themeConfig.publishedTheme===x,beforePreview));
const now=Date.now(),iso=n=>new Date(n).toISOString();
await page.evaluate(({start,end})=>NSAdminThemes.createSchedule({id:'QA-RANGE',title:'QA range',themeId:'fresh-grove',type:'range',startAt:start,endAt:end,timezone:'UTC',enabled:true}),{start:iso(now-3600000),end:iso(now+3600000)});
ok('Saving active-time schedule does not publish',await page.evaluate(()=>NSV421Store.load().themeConfig.schedules.find(x=>x.id==='QA-RANGE').enabled===false));await page.evaluate(()=>NSAdminThemes.toggleSchedule('QA-RANGE'));await ready(`${base}/index.html`);ok('Active range schedule changes effective theme',await page.locator('html').getAttribute('data-ns-theme')==='fresh-grove');
await ready(`${base}/admin-preview.html`);await page.waitForFunction(()=>window.NSAdminThemes);
const conflictRejected=await page.evaluate(async({start,end})=>{try{NSAdminThemes.createSchedule({id:'QA-CONFLICT',title:'Conflict',themeId:'coastal-premium',type:'range',startAt:start,endAt:end,timezone:'UTC',enabled:true});return false}catch(e){return /Conflicts/.test(e.message)}},{start:iso(now-1800000),end:iso(now+1800000)});ok('Overlapping incompatible schedule is rejected',conflictRejected);
await page.evaluate(()=>NSAdminThemes.removeSchedule('QA-RANGE'));
const day=new Date().getUTCDay();await page.evaluate(({start,end,day})=>NSAdminThemes.createSchedule({id:'QA-WEEKLY',title:'QA weekly',themeId:'coastal-premium',type:'weekly',startAt:start,endAt:end,daysOfWeek:[day],dailyStart:'00:00',dailyEnd:'23:59',timezone:'UTC',enabled:true}),{start:iso(now-86400000),end:iso(now+86400000),day});
await page.evaluate(()=>NSAdminThemes.toggleSchedule('QA-WEEKLY'));await ready(`${base}/index.html`);ok('Weekly recurrence activates on configured day',await page.locator('html').getAttribute('data-ns-theme')==='coastal-premium');
ok('Weekly recurrence reports its next transition',await page.evaluate(()=>NSStorefrontTheme.result.nextChange?.type==='recurrence-end'));
await ready(`${base}/admin-preview.html`);await page.waitForFunction(()=>window.NSAdminThemes);await page.evaluate(()=>NSAdminThemes.removeSchedule('QA-WEEKLY'));
await page.evaluate(({start,end})=>NSAdminThemes.createSchedule({id:'QA-ENDED',title:'Ended',themeId:'fresh-grove',type:'once',startAt:start,endAt:end,timezone:'UTC',enabled:true}),{start:iso(now-7200000),end:iso(now-3600000)});
await ready(`${base}/index.html`);ok('Ended window automatically restores published base',await page.locator('html').getAttribute('data-ns-theme')===beforePreview);
await ready(`${base}/admin-preview.html`);await page.waitForFunction(()=>window.NSAdminThemes);await page.evaluate(()=>NSAdminThemes.override('nariyal-signature'));await ready(`${base}/index.html`);ok('Emergency manual override wins safely',await page.locator('html').getAttribute('data-ns-theme')==='nariyal-signature');
await ready(`${base}/admin-preview.html`);await page.waitForFunction(()=>window.NSAdminThemes);await page.evaluate(()=>{NSAdminThemes.clearOverride();NSAdminThemes.removeSchedule('QA-ENDED')});
await page.evaluate(()=>{const s=NSV421Store.load();s.themeConfig.schedules=[{id:'BAD',themeId:'missing',type:'range',startAt:new Date(Date.now()-1000).toISOString(),endAt:new Date(Date.now()+10000).toISOString(),enabled:true}];NSV421Store.save(s);});await ready(`${base}/index.html`);ok('Invalid scheduled theme safely falls back',await page.locator('html').getAttribute('data-ns-theme')===beforePreview);
const after=await page.evaluate(()=>{const s=NSV421Store.load();return{products:s.products,orders:s.orders,prices:s.products.map(x=>[x.sku,x.retail,x.bulk]),sections:s.sections};});
ok('Products remain unchanged',JSON.stringify(after.products)===JSON.stringify(baseline.products));ok('Prices remain unchanged',JSON.stringify(after.prices)===JSON.stringify(baseline.prices));ok('Orders remain unchanged',JSON.stringify(after.orders)===JSON.stringify(baseline.orders));ok('Section order remains unchanged',JSON.stringify(after.sections)===JSON.stringify(baseline.sections));
ok('No broken local images',!errors.some(x=>/\.(png|jpe?g|webp|svg).*(?:ERR_|HTTP [45])/i.test(x)));ok('No theme runtime errors',!errors.some(x=>/storefront-theme|admin-themes|NSTheme/i.test(x)));
fs.writeFileSync(`${out}/themes-qa-results.json`,JSON.stringify({ok:true,checks,fingerprints,errors:errors.filter(x=>/storefront-theme|admin-themes|NSTheme/i.test(x))},null,2));
console.log(`Themes QA PASS (${checks.length} assertions, ${ids.length*viewports.length*sections.length} major-section screenshots)`);await browser.close();
