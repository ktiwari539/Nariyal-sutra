import {chromium} from 'playwright';
import {spawn} from 'node:child_process';

const BASE='http://127.0.0.1:4216';
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=spawn('python3',['-m','http.server','4216','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(850);
const browser=await chromium.launch({headless:true});

try{
  const campaignContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const campaignPage=await campaignContext.newPage();
  await campaignPage.goto(BASE+'/fresh-tender-coconut.html?utm_source=instagram&utm_medium=social&utm_campaign=wedding-season&utm_content=reel&utm_term=must-not-store',{waitUntil:'domcontentloaded',referer:'https://www.google.com/search?q=customer%40example.com'});
  await campaignPage.waitForFunction(()=>window.NSAttribution?.read);
  const landing=await campaignPage.evaluate(()=>({context:window.NSAttribution.read(),stored:sessionStorage.getItem('ns-attribution-v2')||'',keys:Object.keys(sessionStorage)}));
  must(landing.context.firstTouch.classification==='social','Instagram UTM was not classified as social');
  must(landing.context.firstTouch.source==='instagram',`Instagram source was not normalized: ${JSON.stringify(landing.context.firstTouch)}`);
  must(landing.context.firstTouch.campaign==='wedding-season','Campaign label was not retained');
  must(landing.context.firstTouch.referrerHost==='google.com','Only the referring host should be retained');
  must(landing.context.firstTouch.landingPath==='/fresh-tender-coconut.html','Original landing path was not retained');
  must(!landing.stored.includes('search?q=')&&!landing.stored.includes('customer@example.com')&&!landing.stored.includes('must-not-store'),'Session attribution retained a full referrer, personal value or utm_term');
  must(landing.keys.length===1&&landing.keys[0]==='ns-attribution-v2','Attribution created unexpected browser storage');

  await campaignPage.goto(BASE+'/index.html',{waitUntil:'domcontentloaded'});
  await campaignPage.waitForFunction(()=>window.NSAttribution?.read&&document.getElementById('nsDiscoverySource'));
  await campaignPage.selectOption('#nsDiscoverySource','social_media');
  await campaignPage.fill('#nsDiscoveryDetail','Instagram');
  const checkout=await campaignPage.evaluate(()=>window.NSAttribution.read());
  must(checkout.firstTouch.source==='instagram'&&checkout.lastTouch.source==='instagram','Internal navigation overwrote the meaningful campaign touch');
  must(checkout.reportedSource==='social_media'&&checkout.reportedDetail==='Instagram','Customer-reported source was not attached');
  must(await campaignPage.locator('#nsDiscoveryField').isVisible(),'Checkout source question is not visible on mobile');
  await campaignContext.close();

  const directContext=await browser.newContext({serviceWorkers:'block'}),directPage=await directContext.newPage();
  await directPage.goto(BASE+'/index.html',{waitUntil:'domcontentloaded'});await directPage.waitForFunction(()=>window.NSAttribution?.read);
  const direct=await directPage.evaluate(()=>window.NSAttribution.read());
  must(direct.firstTouch.classification==='direct'&&direct.firstTouch.referrerHost==='','Direct visit classification is incorrect');
  await directContext.close();

  const piiContext=await browser.newContext({serviceWorkers:'block'}),piiPage=await piiContext.newPage();
  await piiPage.goto(BASE+'/index.html?utm_source=newsletter&utm_medium=email&utm_campaign=buyer%40example.com&utm_content=919876543210',{waitUntil:'domcontentloaded'});await piiPage.waitForFunction(()=>window.NSAttribution?.read);
  const pii=await piiPage.evaluate(()=>window.NSAttribution.read());
  must(pii.firstTouch.classification==='email','Email campaign classification is incorrect');
  must(pii.firstTouch.campaign===''&&pii.firstTouch.content==='','Potential personal data in UTM values was not discarded');
  await piiContext.close();

  const adminContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),adminPage=await adminContext.newPage();
  await adminPage.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded'});
  await adminPage.waitForFunction(()=>window.NSAdminAnalytics?.render&&document.getElementById('nsAnalyticsApp'));
  await adminPage.locator('#apNav button[data-view="analytics"]').click();
  await adminPage.evaluate(()=>{
    const s=NSV421Store.load();
    s.orders=[...(s.orders||[]),{id:'QA-ATTR-ORDER',orderId:'QA-ATTR-ORDER',customerName:'QA Customer',createdAt:new Date().toISOString(),acquisition:{version:2,reportedSource:'social_media',reportedSourceLabel:'Social media',reportedDetail:'YouTube',firstTouch:{classification:'whatsapp',source:'whatsapp',medium:'shared_link',campaign:'qa-whatsapp',content:'',referrerHost:'',landingPath:'/fresh-tender-coconut.html',capturedAtClient:new Date().toISOString()},lastTouch:{classification:'whatsapp',source:'whatsapp',medium:'shared_link',campaign:'qa-whatsapp',content:'',referrerHost:'',landingPath:'/fresh-tender-coconut.html',capturedAtClient:new Date().toISOString()}}}];
    s.inquiries=[{id:'QA-ATTR-INQUIRY',inquiryId:'QA-ATTR-INQUIRY',name:'QA Enquiry',createdAt:new Date().toISOString(),acquisition:{version:2,reportedSource:'google_search',reportedSourceLabel:'Google Search',firstTouch:{classification:'organic_search',source:'google',medium:'organic',campaign:'',content:'',referrerHost:'google.com',landingPath:'/coconut-water',capturedAtClient:new Date().toISOString()},lastTouch:{classification:'organic_search',source:'google',medium:'organic',campaign:'',content:'',referrerHost:'google.com',landingPath:'/coconut-water',capturedAtClient:new Date().toISOString()}}}];
    NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));
  });
  await adminPage.waitForTimeout(180);
  const analyticsText=await adminPage.locator('#nsAnalyticsApp').innerText();
  must(analyticsText.includes('WhatsApp')&&analyticsText.includes('Google Organic'),'Admin traffic source view did not render attributed order/enquiry sources');
  must(analyticsText.includes('Fresh Tender Coconut')&&analyticsText.includes('Coconut Water'),'Admin landing-page view did not render attributed entry pages');
  must(!analyticsText.includes('61%')&&!analyticsText.includes('28%'),'Static fake analytics metrics are still present');
  await adminPage.selectOption('#nsAnaSource','youtube');await adminPage.fill('#nsAnaCampaign','youtube launch');
  const tracked=await adminPage.locator('#nsAnaLink').inputValue();
  must(tracked.includes('utm_source=youtube')&&tracked.includes('utm_medium=social')&&tracked.includes('utm_campaign=youtube-launch'),'Trackable link builder did not create YouTube campaign attribution');
  await adminContext.close();

  console.log('CUSTOMER ACQUISITION BROWSER QA: PASS');
} finally {
  await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
