import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'qa-artifacts','media-integrity');
const BASE='http://127.0.0.1:4191';
const CLEAN_COCONUT='/assets/images/story-coconut-hero.png';
const EXPECTED_NUT_TYPES=['ns-nut-type-round','ns-nut-type-long','ns-nut-type-gold','ns-nut-type-fresh'];
const FORBIDDEN_NUT_SOURCES=['/assets/images/green-round-coconut.jpg','/assets/images/brand/coconut-premium.webp'];
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4191','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(900);
const browser=await chromium.launch({headless:true});

async function openPage(context,url,label){
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const res=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});
  must(res&&res.status()<400,`${label} returned ${res?.status()}`);
  await page.waitForTimeout(1700);
  must(!errors.length,`${label} page errors: ${errors.join(' | ')}`);
  return page;
}
async function assertNoBroken(page,label){
  const broken=await page.evaluate(()=>[...document.images].filter(img=>{
    const s=getComputedStyle(img),r=img.getBoundingClientRect();
    return s.display!=='none'&&s.visibility!=='hidden'&&!img.hidden&&img.complete&&img.naturalWidth===0&&r.width>2&&r.height>2;
  }).map(img=>img.getAttribute('src')||''));
  must(!broken.length,`${label} visible broken images: ${JSON.stringify(broken)}`);
}
async function shot(page,name,full=true){await page.screenshot({path:path.join(OUT,name),fullPage:full});}

try{
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});

  const admin=await openPage(context,'/admin-preview.html','Admin');
  await admin.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V38__===true,null,{timeout:12000});
  const campaignState=await admin.evaluate(()=>{
    const s=window.NSV421Store.load(),ids=['AMB101-P','AMB102-P','AMB201-P'];
    return {
      ids:ids.map(id=>({id,media:!!window.NSV421Store.mediaById(s,id),selected:(s.faceMarquee?.selectedIds||[]).includes(id),ambassador:(s.peopleStreams?.ambassadors?.selectedIds||[]).includes(id)})),
      head:(s.faceMarquee?.selectedIds||[]).slice(0,8)
    };
  });
  must(campaignState.ids.every(x=>x.media),'Approved campaign media missing from Admin state');
  must(campaignState.ids.every(x=>x.ambassador),'Approved campaign media missing from Ambassador stream state');
  must(campaignState.head.includes('AMB101-P')&&campaignState.head.includes('AMB201-P'),`Homepage reel does not prioritize approved campaign faces: ${JSON.stringify(campaignState.head)}`);
  await admin.locator('#apNav button[data-view="media"]').click();
  await admin.waitForTimeout(250);
  const mediaIds=await admin.locator('#apMediaGrid .ap-media-id').allTextContents();
  for(const id of ['AMB101-P','AMB102-P','AMB201-P'])must(mediaIds.includes(id),`${id} is missing from Admin Media Library`);
  await shot(admin,'admin-media-library.png');
  await admin.locator('#apNav button[data-view="ambassadors"]').click();
  await admin.waitForTimeout(250);
  const ambassadorIds=await admin.locator('#apAmbassadorGrid .ap-media-id').allTextContents();
  for(const id of ['AMB101-P','AMB102-P','AMB201-P'])must(ambassadorIds.includes(id),`${id} is missing from Admin Ambassadors view`);
  await shot(admin,'admin-ambassadors.png');
  await admin.close();

  const home=await openPage(context,'/','Homepage');
  await home.evaluate(()=>{try{window.skipIntro?.()}catch{}document.getElementById('jungle-intro')?.classList.add('ji-done');});
  await home.waitForSelector('#nsPeopleMarquee .ns-face-card',{timeout:12000});
  await home.waitForTimeout(900);
  const reel=await home.evaluate(()=>{
    const cards=[...document.querySelectorAll('#nsPeopleMarquee .ns-face-card')];
    const first=cards.slice(0,16).map(x=>x.dataset.id);
    const status=id=>{const c=cards.find(x=>x.dataset.id===id),img=c?.querySelector('img');return {id,exists:!!c,src:img?.getAttribute('src')||'',ok:!!img&&img.complete&&img.naturalWidth>0};};
    return {first,items:['AMB101-P','AMB201-P'].map(status)};
  });
  must(reel.items.every(x=>x.exists&&x.ok),`Approved homepage campaign images did not render: ${JSON.stringify(reel)}`);
  must(reel.first.includes('AMB101-P')&&reel.first.includes('AMB201-P'),`Approved campaign images are not early in rolling section: ${JSON.stringify(reel.first)}`);
  await home.waitForFunction(()=>document.documentElement.dataset.nsMediaDiversity==='ready'&&document.querySelectorAll('#v421-cinematic-film-pro .nspro-nut').length>20,null,{timeout:10000});

  const homeVisuals=await home.evaluate(()=>{
    const selectors=['.story-visual .sv-img','.trade-route.trade-buy img','.trade-route.trade-supply img','.promise-portal.coast img','.promise-portal.grove img','.promise-portal.farm img'];
    const sources=selectors.map(sel=>document.querySelector(sel)?.getAttribute('src')||'').filter(Boolean);
    const nuts=[...document.querySelectorAll('#v421-cinematic-film-pro .nspro-nut')];
    const nutRows=nuts.map(nut=>{
      const img=nut.querySelector('img');
      const cs=img?getComputedStyle(img):null;
      return {
        src:img?.getAttribute('src')||'',
        loaded:!!img&&img.complete&&img.naturalWidth>0,
        type:[...nut.classList].find(c=>c.startsWith('ns-nut-type-'))||'',
        variety:nut.dataset.nsVariety||'',
        transform:cs?.transform||'',
        filter:cs?.filter||'',
        tilt:getComputedStyle(nut).getPropertyValue('--nut-tilt').trim()
      };
    });
    return {
      sources,
      unique:[...new Set(sources)],
      nutCount:nutRows.length,
      nutSources:[...new Set(nutRows.map(x=>x.src).filter(Boolean))],
      nutTypes:[...new Set(nutRows.map(x=>x.type).filter(Boolean))],
      nutVariants:[...new Set(nutRows.map(x=>`${x.type}|${x.transform}|${x.filter}|${x.tilt}`))],
      badVariety:nutRows.filter(x=>x.variety!=='shape-tone-v2').length,
      brokenNuts:nutRows.filter(x=>!x.loaded).length
    };
  });

  must(homeVisuals.sources.length>=6&&homeVisuals.unique.length>=6,`Homepage key stories repeat media: ${JSON.stringify(homeVisuals.sources)}`);
  must(homeVisuals.nutCount>20,`Cinematic coconut rain is unexpectedly small: ${homeVisuals.nutCount}`);
  must(homeVisuals.nutSources.length===1&&homeVisuals.nutSources[0]===CLEAN_COCONUT,`Cinematic rain must use the clean transparent coconut source only: ${JSON.stringify(homeVisuals.nutSources)}`);
  must(!homeVisuals.nutSources.some(src=>FORBIDDEN_NUT_SOURCES.includes(src)),`Cinematic rain reintroduced matte/cutout coconut sources: ${JSON.stringify(homeVisuals.nutSources)}`);
  must(EXPECTED_NUT_TYPES.every(t=>homeVisuals.nutTypes.includes(t)),`Cinematic coconut shape/tone types are incomplete: ${JSON.stringify(homeVisuals.nutTypes)}`);
  must(homeVisuals.nutVariants.length>=4,`Cinematic coconut geometry/tone does not provide four visible variants: ${JSON.stringify(homeVisuals.nutVariants)}`);
  must(homeVisuals.badVariety===0,`Cinematic coconut nodes are missing shape-tone-v2 ownership: ${homeVisuals.badVariety}`);
  must(homeVisuals.brokenNuts===0,`Cinematic coconut sprites failed to load: ${homeVisuals.brokenNuts}`);
  console.log('CINEMATIC COCONUT VARIETY',JSON.stringify({types:homeVisuals.nutTypes,variants:homeVisuals.nutVariants.length,source:homeVisuals.nutSources[0]}));
  await shot(home,'homepage-media-diversity.png',true);
  await shot(home,'homepage-people-reel.png',false);
  await assertNoBroken(home,'Homepage');
  await home.close();

  const people=await openPage(context,'/people-of-nariyal-sutra.html','People page');
  await people.waitForSelector('#v25PeopleStreams [data-stream="ambassadors"]',{timeout:10000});
  const peopleState=await people.evaluate(()=>{
    const ids=['AMB101-P','AMB102-P','AMB201-P'];
    const cards=ids.map(id=>{const c=document.querySelector(`#v25PeopleStreams [data-stream="ambassadors"] [data-id="${id}"]`),img=c?.querySelector('img');return {id,exists:!!c,ok:!!img&&img.complete&&img.naturalWidth>0,src:img?.getAttribute('src')||''};});
    return {cards,hero:document.getElementById('peopleHeroImg')?.getAttribute('src')||''};
  });
  must(peopleState.cards.every(x=>x.exists&&x.ok),`People page approved ambassador rail incomplete: ${JSON.stringify(peopleState.cards)}`);
  must(/AMB(101|102|201)-portrait/.test(peopleState.hero),`People hero is not using approved campaign media: ${peopleState.hero}`);
  await shot(people,'people-approved-campaign.png');
  await assertNoBroken(people,'People page');
  await people.close();

  const cases=[
    {url:'/supplier-partnership.html',label:'Supplier',check:()=>({a:document.querySelector('.w-hero-media img')?.getAttribute('src')||'',b:document.querySelector('.supplier-photo img')?.getAttribute('src')||'',ok:[document.querySelector('.w-hero-media img'),document.querySelector('.supplier-photo img')].every(i=>i&&i.complete&&i.naturalWidth>0)})},
    {url:'/direct-farm.html',label:'Direct sourcing',check:()=>({a:document.querySelector('.w-hero-media img')?.getAttribute('src')||'',b:document.querySelector('.brand-portrait img')?.getAttribute('src')||'',ok:[document.querySelector('.w-hero-media img'),document.querySelector('.brand-portrait img')].every(i=>i&&i.complete&&i.naturalWidth>0)})},
    {url:'/coconut-water.html',label:'Coconut water',check:()=>({a:document.querySelector('.cw-visual img')?.getAttribute('src')||'',b:document.querySelector('.cw-image-panel img')?.getAttribute('src')||'',ok:[document.querySelector('.cw-visual img'),document.querySelector('.cw-image-panel img')].every(i=>i&&i.complete&&i.naturalWidth>0)})},
    {url:'/coconut-events-hospitality.html',label:'Hospitality hero',check:()=>{const a=document.querySelector('.sp-scenes .sp-scene:nth-child(1)'),b=document.querySelector('.sp-scenes .sp-scene:nth-child(3)');return {a:a?.getAttribute('src')||'',b:b?.getAttribute('src')||'',ok:[a,b].every(i=>i&&i.complete&&i.naturalWidth>0)}}
  ];
  const majorHeroSources=[];
  for(const c of cases){
    const p=await openPage(context,c.url,c.label);
    await p.waitForFunction(()=>document.documentElement.dataset.nsMediaIntegrity==='ready',null,{timeout:10000});
    await p.waitForTimeout(450);
    const result=await p.evaluate(c.check);
    must(result.ok,`${c.label} key imagery failed to load: ${JSON.stringify(result)}`);
    const aUrl=new URL(result.a,BASE),bUrl=new URL(result.b,BASE),baseUrl=new URL(BASE);
    must(aUrl.origin===baseUrl.origin&&bUrl.origin===baseUrl.origin,`${c.label} key imagery must be local: ${JSON.stringify(result)}`);
    must(aUrl.pathname!==bUrl.pathname,`${c.label} repeats the same major image: ${JSON.stringify(result)}`);
    majorHeroSources.push({label:c.label,src:aUrl.pathname});
    await assertNoBroken(p,c.label);
    await shot(p,`${c.label.toLowerCase().replaceAll(' ','-')}.png`);
    await p.close();
  }
  const duplicateHeroes=majorHeroSources.filter((item,i,a)=>a.findIndex(x=>x.src===item.src)!==i);
  must(!duplicateHeroes.length,`Major website pages reuse the same hero imagery: ${JSON.stringify(majorHeroSources)}`);
  console.log('MAJOR PAGE HERO DIVERSITY',JSON.stringify(majorHeroSources));

  const stillCases=[
    {url:'/freshness-first.html',label:'Freshness',host:'.water-window',old:'.water-window video'},
    {url:'/fresh-tender-coconut.html',label:'Fresh tender',host:'.sp-video',old:'.sp-video video'},
    {url:'/green-coconut.html',label:'Green coconut',host:'.sp-video',old:'.sp-video video'},
    {url:'/coconut-events-hospitality.html',label:'Hospitality',host:'.sp-video',old:'.sp-video video'}
  ];
  for(const c of stillCases){
    const p=await openPage(context,c.url,c.label);
    await p.waitForFunction(()=>document.documentElement.dataset.nsMediaIntegrity==='ready',null,{timeout:10000});
    await p.waitForTimeout(450);
    const result=await p.evaluate(({host,old})=>{
      const img=document.querySelector(`${host} img.ns-integrity-still`),motion=document.querySelector(`${host} .ns-integrity-motion`),frames=document.querySelectorAll(`${host} .ns-motion-frame`);
      return {oldCount:document.querySelectorAll(old).length,img:!!img,ok:!!img&&img.complete&&img.naturalWidth>0,motion:!!motion,frames:frames.length,src:img?.getAttribute('src')||''};
    },{host:c.host,old:c.old});
    must(result.oldCount===0&&result.img&&result.ok&&result.motion&&result.frames>=3,`${c.label} animated motion study is incomplete: ${JSON.stringify(result)}`);
    await assertNoBroken(p,c.label);
    await shot(p,`${c.label.toLowerCase().replaceAll(' ','-')}.png`);
    await p.close();
  }

  await context.close();
  console.log('MEDIA INVENTORY + VISUAL DIVERSITY QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
