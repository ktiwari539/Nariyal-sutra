/**
 * SEO release gate: static candidate checks and optional hosted validation.
 * Run: node scripts/seo-go-live-acceptance.mjs [--live]
 * Live mode must be repeated after publishing the approved release.
 * This does not submit URLs to a search engine or certify indexing.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ORIGIN=(process.env.SEO_ORIGIN||'https://nariyal-sutra.netlify.app').replace(/\/$/,'');
const ROOT=process.cwd(), LIVE=process.argv.includes('--live');
const errors=[],warnings=[],audited=[];
const privateFiles=['admin.html','admin-preview.html','admin-login.html','admin-bcc-login.html','admin-set-password.html','staff-sign-in.html','track.html'];
const read=(p)=>fs.readFile(path.join(ROOT,p),'utf8');
const value=(text,re)=>text.match(re)?.[1]?.trim()||'';
const attr=(text,key)=>value(text,new RegExp('\\b'+key+'\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i'));
const named=(html,tag,name,value)=> (html.match(new RegExp('<'+tag+'\\b[^>]*>','gi'))||[]).find(t=>attr(t,name).toLowerCase()===value.toLowerCase())||'';
const meta=(html,key,type='name')=>attr(named(html,'meta',type,key),'content');
const canonical=(html)=>attr(named(html,'link','rel','canonical'),'href');
const fail=(message)=>errors.push(message);
const isFile=async p=>fs.access(path.join(ROOT,p)).then(()=>true,()=>false);
const sourceFile=url=>{const p=new URL(url).pathname;return p==='/'?'index.html':p==='/coconut-water'?'coconut-water.html':p.slice(1)};
const safeOrigin=/^https:\/\/[^/]+$/i.test(ORIGIN);
if(!safeOrigin)fail('SEO_ORIGIN must be an HTTPS origin');

const [sitemap,robotsText,headers,manifest]=await Promise.all(['sitemap.xml','robots.txt','_headers','netlify.toml'].map(read));
const urls=[...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m=>m[1].trim());
if(!urls.length)fail('No URLs in sitemap');
if(new Set(urls).size!==urls.length)fail('Duplicate URLs in sitemap');
if(!robotsText.includes('Sitemap: '+ORIGIN+'/sitemap.xml'))fail('robots.txt sitemap does not match public origin');
if(/(?:^|\n)\s*Disallow:\s*\/\s*(?:\n|$)/i.test(robotsText))fail('robots.txt blocks public pages');

for(const url of urls){
  let parsed;
  try{parsed=new URL(url)}catch{fail('Invalid sitemap URL '+url);continue}
  if(parsed.origin!==ORIGIN)fail('Sitemap uses different origin: '+url);
  if(/^\/(?:admin|track|staff-sign-in|docs|qa-artifacts)/i.test(parsed.pathname))fail('Private URL in sitemap: '+url);
  const file=sourceFile(url);
  if(!await isFile(file)){fail('Sitemap source file missing: '+file);continue}
  const html=await read(file);
  const declared=canonical(html),og=meta(html,'og:url','property');
  if(declared!==url)fail(file+': canonical mismatch: '+declared);
  if(og!==url)fail(file+': Open Graph URL differs from canonical: '+og);
  if(!value(html,/<title\b[^>]*>([\s\S]*?)<\/title>/i))fail(file+': title missing');
  if(!meta(html,'description'))fail(file+': description missing');
  const robots=meta(html,'robots').toLowerCase();
  if(!robots.includes('index')||robots.includes('noindex'))fail(file+': index directive missing or disabled');
  if(!/^https:\/\//i.test(meta(html,'og:image','property')))fail(file+': absolute HTTPS Open Graph image missing');
  audited.push({file,url});
}
const sections=headers.split(/\r?\n(?=\/)/);
function headersFor(route){return sections.find(block=>block.split(/\r?\n/,1)[0].trim()===route)||''}
for(const file of privateFiles){
  if(!await isFile(file))continue;
  const html=await read(file);
  if(!meta(html,'robots').toLowerCase().includes('noindex'))fail(file+': private HTML has no noindex');
  if(!/X-Robots-Tag:\s*noindex/i.test(headersFor('/'+file)))fail(file+': _headers noindex missing');
}
for(const route of ['/docs/*','/qa-artifacts/*']){
  if(!/X-Robots-Tag:\s*noindex/i.test(headersFor(route)))fail(route+': noindex header missing');
}
if(/publish\s*=\s*["']\.["']/i.test(manifest)){
  warnings.push('Netlify publishes repository root; deploy packaging must exclude QA, docs, and development files before production.');
}
async function get(url){
  const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'NariyalSutra-SEO-Acceptance/1.0'}});
  return {response,body:await response.text()};
}
if(LIVE){
  for(const resource of ['/robots.txt','/sitemap.xml']){
    try{
      const {response,body}=await get(ORIGIN+resource);
      if(!response.ok)fail(resource+': HTTP '+response.status);
      if(resource==='/robots.txt'&&!body.includes('Sitemap: '+ORIGIN+'/sitemap.xml'))fail('Hosted robots.txt sitemap mismatch');
      if(resource==='/sitemap.xml'&&!body.includes('<urlset'))fail('Hosted sitemap is not XML sitemap content');
    }catch(e){fail(resource+': '+e.message)}
  }
  for(const url of urls){
    try{
      const {response,body}=await get(url);
      if(!response.ok)fail(url+': HTTP '+response.status);
      if(!/text\/html/i.test(response.headers.get('content-type')||''))fail(url+': non-HTML response');
      if(canonical(body)!==url)fail(url+': hosted canonical mismatch');
      if(/noindex/i.test(meta(body,'robots')+' '+(response.headers.get('x-robots-tag')||'')))fail(url+': hosted noindex detected');
    }catch(e){fail(url+': '+e.message)}
  }
  for(const file of ['admin.html','admin-preview.html','track.html']){
    try{
      const {response,body}=await get(ORIGIN+'/'+file);
      if(!response.ok)fail(file+': HTTP '+response.status);
      if(!/noindex/i.test(meta(body,'robots')+' '+(response.headers.get('x-robots-tag')||'')))fail(file+': hosted noindex missing');
    }catch(e){fail(file+': '+e.message)}
  }
  warnings.push('Search Console property verification, sitemap submission, and Google URL Inspection require account access.');
}else{
  warnings.push('Static mode cannot verify hosted responses, Search Console, or indexing; run --live after approved deployment.');
}
console.log(JSON.stringify({ok:errors.length===0,mode:LIVE?'hosted':'static',origin:ORIGIN,urlsAudited:audited.length,privateFilesChecked:privateFiles.length,errors,warnings},null,2));
if(errors.length)process.exitCode=1;
