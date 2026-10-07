import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE='http://127.0.0.1:4215';
const OUT='qa-artifacts/bcc-v52';
const must=(c,m)=>{if(!c)throw new Error(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(OUT,{recursive:true});

const server=spawn('python3',['-m','http.server','4215','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(850);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(18000);
  await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.NSBCCV52?.ready===true&&document.documentElement.dataset.bccV52==='1');
  await page.waitForFunction(()=>window.NSV421DashboardV2?.ready===true);
  const navCount=await page.locator('#apNav button[data-view]').count();
  must(navCount>=25,'BCC V52 lost Admin navigation capability: '+navCount+' modules found');
  const requiredViews=['overview','orders','payments','products','inventory','warehouses','delivery-services','delivery','customers','segments','followups','communication','content','pages','water-formats','themes','stories','ambassadors','submissions','media','schedule','seo','analytics','reports','team','audit','security','settings'];
  for(const view of requiredViews)must(await page.locator('#apNav button[data-view="'+view+'"]').count()===1,'BCC V52 removed required Admin module: '+view);
  const visibleNav=await page.locator('#apNav button[data-view]:visible').count();
  must(visibleNav>=20,'Owner view unexpectedly hides Admin modules: '+visibleNav);
  must(await page.locator('#nsCommandHint').count()===1,'Command Center trigger missing');
  must(await page.locator('#nsActivityToggle').count()===1,'Universal activity trigger missing');
  must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Desktop BCC shell causes horizontal page overflow');
  await page.screenshot({path:OUT+'/overview-desktop.png',fullPage:false});

  await page.keyboard.press('Control+K');
  await page.waitForSelector('#nsCommandPalette.is-open');
  must(await page.locator('#nsCmdResults .ns-cmd-item').count()>=visibleNav,'Command Center does not expose the available module/action set');
  await page.screenshot({path:OUT+'/command-palette.png',fullPage:false});
  await page.locator('#nsCmdInput').fill('customer campaign');
  await page.locator('#nsCmdResults .ns-cmd-item').first().click();
  await page.waitForSelector('.ap-view[data-view="communication"].is-active');
  await page.waitForFunction(()=>window.NSV421CampaignCenter?.ready===true);
  await page.waitForSelector('#nsCampaignForm',{state:'visible'});
  must(await page.locator('#nsCampaignForm [data-camp-source="existing"]').count()===1,'Campaign source workflow missing after command launch');
  must(await page.locator('#nsCampaignForm [data-camp-select-all]').count()===1,'Campaign audience selection lost in V52');
  await page.screenshot({path:OUT+'/campaign-command-workspace.png',fullPage:false});
  await page.locator('#apModalClose').click();

  await page.locator('#nsActivityToggle').click();
  await page.waitForSelector('#nsActivityLayer.is-open');
  must(await page.locator('#nsActivityBody .ns-activity-row').count()>=1,'Universal activity drawer has no operational history surface');
  await page.screenshot({path:OUT+'/activity-drawer.png',fullPage:false});
  await page.locator('[data-activity-close]').click();

  await page.locator('#apNav button[data-view="orders"]').click();
  await page.waitForSelector('.ap-view[data-view="orders"].is-active');
  must(await page.locator('.ap-view[data-view="orders"] .ap-split').count()===1,'Orders master/detail workspace removed');
  must(await page.locator('#apOrdersBody tr').count()>=1,'Orders table did not render');
  await page.screenshot({path:OUT+'/orders-master-detail.png',fullPage:false});

  await page.evaluate(()=>document.documentElement.setAttribute('data-ns-admin-theme','coastal-premium'));
  await page.locator('#apNav button[data-view="pages"]').click();
  await page.waitForSelector('.ap-view[data-view="pages"].is-active');
  await page.waitForSelector('#apCustomSectionGrid',{state:'visible'});
  await page.screenshot({path:OUT+'/pages-coastal.png',fullPage:false});
  must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Coastal Admin theme overflows at desktop');

  await page.evaluate(()=>document.documentElement.setAttribute('data-ns-admin-theme','nariyal-signature'));
  await page.locator('#apNav button[data-view="overview"]').click();
  await page.setViewportSize({width:390,height:844});
  await sleep(160);
  must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'BCC V52 mobile shell causes horizontal overflow');
  must(await page.locator('#apRole').evaluate(el=>getComputedStyle(el).display!=='none'),'Mobile BCC hides role control');
  must(await page.locator('#apNotifications').evaluate(el=>getComputedStyle(el).display!=='none'),'Mobile BCC hides notifications control');
  await page.locator('#apGlobalSearch').fill('orders');await page.locator('#apGlobalSearch').press('Enter');await page.waitForSelector('#nsCommandPalette.is-open');await page.keyboard.press('Escape');
  await page.screenshot({path:OUT+'/overview-mobile.png',fullPage:false});
  await page.locator('#apMenuBtn').click();
  await page.waitForFunction(()=>document.querySelector('#apSidebar')?.classList.contains('is-open'));await sleep(220);
  const side=await page.locator('#apSidebar').boundingBox();
  must(side&&side.x>=-1&&side.width<=390,'Mobile sidebar is not contained in viewport');
  await page.screenshot({path:OUT+'/mobile-navigation.png',fullPage:false});
  await page.keyboard.press('Escape');
  console.log('BUSINESS COMMAND CENTER V52 VISUAL QA: PASS');
}finally{
  await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
