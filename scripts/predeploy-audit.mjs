import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT=process.cwd();
const TEXT_EXT=new Set(['.html','.css','.js','.mjs','.json','.webmanifest','.txt','.md','.toml']);
const SKIP=new Set(['.git','node_modules','qa-artifacts']);
const problems=[];
const seen=new Set();
const SELF_ORIGIN='https://nariyal-sutra.netlify.app';

function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
function rel(p){return path.relative(ROOT,p).replaceAll(path.sep,'/');}
function add(kind,file,msg){
  const key=`${kind}|${rel(file)}|${msg}`;
  if(seen.has(key)) return;
  seen.add(key); problems.push({kind,file:rel(file),msg});
}
function dynamic(v){return /\$\{|<%|{{|}}/.test(v);}
function clean(v){return v.split('#')[0].split('?')[0];}
function ignore(v){return /^(?:mailto:|tel:|data:|blob:|javascript:|#|\/\/)/i.test(v)||/^%23/i.test(v);}
function targetFor(file,v){
  if(!v||dynamic(v)||ignore(v)) return null;
  let c=clean(v.trim());
  if(!c||c==='/'||c.startsWith('/?')) return null;
  if(/^https?:/i.test(c)){
    if(!c.startsWith(SELF_ORIGIN+'/assets/')) return null;
    c=c.slice(SELF_ORIGIN.length);
  }
  if(!c.startsWith('/') && !c.startsWith('assets/') && !c.startsWith('./assets/') && !c.startsWith('../assets/')) return null;
  return c.startsWith('/')?path.join(ROOT,c.slice(1)):path.resolve(path.dirname(file),c);
}
function checkRef(file,v){
  const target=targetFor(file,v);
  if(target&&!fs.existsSync(target)) add('missing-asset',file,`${v} -> ${rel(target)}`);
}
function externalCustomerMedia(v){
  if(!/^https?:/i.test(v)||dynamic(v))return false;
  try{return new URL(v).origin!==new URL(SELF_ORIGIN).origin;}catch{return false;}
}
function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

const files=walk(ROOT);
const textFiles=files.filter(f=>TEXT_EXT.has(path.extname(f).toLowerCase())||['_redirects','_headers'].includes(path.basename(f)));
const deployHost=/https?:\/\/[0-9a-f]{12,}--nariyal-sutra\.netlify\.app/ig;
const doubled=/https:\/\/nariyal-sutra\.netlify\.app\/https:\/\//ig;

for(const file of textFiles){
  let s='';try{s=fs.readFileSync(file,'utf8');}catch{continue;}
  const stale=[...s.matchAll(deployHost)];
  if(stale.length)add('stale-deploy-url',file,`${stale.length} deploy-specific Netlify URL(s)`);
  if(doubled.test(s))add('malformed-url',file,'duplicated production base URL');

  if(path.extname(file).toLowerCase()==='.html'){
    // Keep opening script tags but remove inline script bodies so JS string literals are not mistaken for markup refs.
    const markup=s.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,'<script$1></script>');
    const tags=markup.match(/<(?:img|script|link|video|source|iframe)\b[^>]*>/gi)||[];
    for(const tag of tags){
      const attr=/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi;
      for(const m of tag.matchAll(attr)){
        checkRef(file,m[1]);
        if(/^<img\b/i.test(tag)&&externalCustomerMedia(m[1])) add('external-customer-image',file,m[1]);
        if(/^<video\b/i.test(tag)&&/\bposter\s*=/i.test(tag)&&externalCustomerMedia(m[1])) add('external-customer-video-poster',file,m[1]);
      }
      const srcset=/\bsrcset\s*=\s*["']([^"']+)["']/gi;
      for(const m of tag.matchAll(srcset))for(const part of m[1].split(',')){
        const v=part.trim().split(/\s+/)[0];checkRef(file,v);if(/^<img\b/i.test(tag)&&externalCustomerMedia(v))add('external-customer-image',file,v);
      }
    }
  }
  if(['.css','.html'].includes(path.extname(file).toLowerCase())){
    const cssUrl=/url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    for(const m of s.matchAll(cssUrl))checkRef(file,m[1]);
  }
}

const redirects=path.join(ROOT,'_redirects');
if(fs.existsSync(redirects))for(const raw of fs.readFileSync(redirects,'utf8').split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const parts=line.split(/\s+/);if(parts.length<2)continue;
  const m=parts[1].match(/^\/\.netlify\/functions\/([A-Za-z0-9_-]+)$/);
  if(m){const fn=path.join(ROOT,'netlify','functions',m[1]+'.js');if(!fs.existsSync(fn))add('missing-netlify-function',redirects,`${m[1]} -> ${rel(fn)}`);}
}

const required=[
'index.html','_redirects','_headers','assets/css/v36-public.css','assets/js/v36-public.js','assets/js/v421-stable-assets.js',
'assets/js/story-pages.js','assets/js/v35-worlds.js','assets/js/v421-catalog.js','assets/js/v17-cinematic.js','assets/js/ns-smart-location.js','assets/js/v421-admin.js',
'netlify/functions/send-email.js','netlify/functions/media-sign-upload.js','assets/images/nariyal-premium-hero.webp','assets/images/nariyal-hospitality.webp',
'assets/images/nariyal-product-collection.webp','assets/images/green-round-coconut.jpg','assets/images/bulk-coconut-pack.jpg','assets/images/freshness-coconut-splash.webp',
'assets/images/brand/coconut-premium.webp','assets/images/story-coconut-hero.png','assets/images/story-coconut-body-cut.png','assets/images/story-coconut-cap-cut.png',
'assets/images/review/coastal-grove.png','assets/images/review/backwater-grove.png'];
for(const r of required)if(!fs.existsSync(path.join(ROOT,r)))add('missing-release-file',path.join(ROOT,r),'required release file is absent');

const protectedAssets={
'assets/images/story-coconut-hero.png':'9d23663bd286228dca2c171cc972e0acdd29412df9f77c9f699c49553d0e6d1f',
'assets/images/story-coconut-body-cut.png':'2b9bbc81fb4f7b0c373ecc4b3d3183a043b18a0cdbb50b5853c6962881fc50bf',
'assets/images/story-coconut-cap-cut.png':'78fb7bf35934c6456db5843ffefe154626d3f5cf1506e09cccff0e538b0624bb'};
for(const [r,expected] of Object.entries(protectedAssets)){const p=path.join(ROOT,r);if(fs.existsSync(p)){const actual=sha256(p);if(actual!==expected)add('protected-asset-hash-mismatch',p,`expected ${expected}, got ${actual}`);}}

const jsFiles=files.filter(f=>['.js','.mjs'].includes(path.extname(f).toLowerCase()));
for(const file of jsFiles){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)add('javascript-syntax',file,(result.stderr||result.stdout||'syntax check failed').trim().split('\n').slice(-3).join(' | '));}

console.log('\nNariyal Sutra pre-deploy audit');
console.log('Text files checked:',textFiles.length);
console.log('JavaScript files syntax-checked:',jsFiles.length);
if(problems.length){console.error(`\nFAILED: ${problems.length} release blocker(s)`);for(const p of problems)console.error(`FAIL [${p.kind}] ${p.file}: ${p.msg}`);process.exit(1);}
console.log('\nPASS: stale deploy URLs, local customer-facing images, asset references, required media/runtimes, protected hashes, JS syntax and Netlify function redirects passed.');
