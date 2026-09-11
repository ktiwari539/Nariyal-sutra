import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
fs.mkdirSync('qa-artifacts/media-recovery',{recursive:true});
const server=spawn('python3',['-m','http.server','4192','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const candidates=[
 ['U001','/assets/images/people-uploads/U001.jpeg','Supplied full-size · ceremonial navy'],
 ['U002','/assets/images/people-uploads/U002.png','Supplied full-size · heritage ivory'],
 ['G023','/assets/images/ambassadors/G023.webp','Earlier supplied/review asset · rejected publicly'],
 ['G031','/assets/images/ambassadors/G031.webp','Earlier supplied full-size active asset'],
 ['AMB101-P','/assets/images/ambassadors/campaign/AMB101-portrait.webp','Current campaign derivative · white shirt'],
 ['AMB102-P','/assets/images/ambassadors/campaign/AMB102-portrait.webp','Current campaign derivative · beige vest'],
 ['AMB201-P','/assets/images/ambassadors/campaign/AMB201-portrait-blue.webp','Current campaign derivative · blue linen']
];
const cards=candidates.map(([id,src,note])=>`<article><div class="frame"><img src="${src}" alt="${id}"></div><h2>${id}</h2><p>${note}</p><code>${src}</code></article>`).join('');
await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#071007;color:#f4eddc;font-family:Arial;padding:32px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}article{border:1px solid #66551d;background:#0d1b0c;padding:14px}.frame{height:360px;background:#111;display:grid;place-items:center;overflow:hidden}.frame img{width:100%;height:100%;object-fit:contain}h2{margin:12px 0 6px;color:#d9ad42}p{min-height:40px;color:#bbb}code{font-size:10px;word-break:break-all;color:#8da18d}</style></head><body><h1>Media recovery candidates</h1><div class="grid">${cards}</div></body></html>`,{waitUntil:'load'});
await page.waitForTimeout(1600);
const report=await page.evaluate(()=>[...document.images].map(img=>({alt:img.alt,src:new URL(img.src).pathname,ok:img.complete&&img.naturalWidth>0,w:img.naturalWidth,h:img.naturalHeight})));
console.log('MEDIA RECOVERY CANDIDATES',JSON.stringify(report));
await page.screenshot({path:'qa-artifacts/media-recovery/contact-sheet.png',fullPage:true});
fs.writeFileSync('qa-artifacts/media-recovery/report.json',JSON.stringify(report,null,2));
await browser.close();server.kill();
