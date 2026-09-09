import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT=process.cwd();
const TEXT_EXT=new Set(['.html','.css','.js','.mjs','.json','.webmanifest','.txt','.md','.toml']);
const SKIP=new Set(['.git','node_modules']);
const problems=[];
const warnings=[];
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
function add(kind,file,msg){problems.push({kind,file:rel(file),msg});}
function warn(kind,file,msg){warnings.push({kind,file:rel(file),msg});}
function isDynamicTemplate(v){return /\$\{|<%|{{|}}/.test(v);}
function cleanRef(v){return v.split('#')[0].split('?')[0];}
function isIgnored(v){return /^(?:mailto:|tel:|data:|blob:|javascript:|#|\/\/)/i.test(v);}
function localTarget(file,v){
  if(!v || isDynamicTemplate(v) || isIgnored(v)) return null;
  let c=cleanRef(v.trim());
  if(!c || c==='/' || c.startsWith('/?')) return null;
  if(/^https?:/i.test(c)){
    if(!c.startsWith(SELF_ORIGIN+'/')) return null;
    c=c.slice(SELF_ORIGIN.length);
  }
  if(c.startsWith('/')) return path.join(ROOT,c.slice(1));
  return path.resolve(path.dirname(file),c);
}
function checkRef(file,v,kind='missing-local-reference'){
  const target=localTarget(file,v);
  if(target && !fs.existsSync(target)) add(kind,file,`${v} -> ${rel(target)}`);
}
function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

const files=walk(ROOT);
const textFiles=files.filter(f=>TEXT_EXT.has(path.extname(f).toLowerCase()) || ['_redirects','_headers'].includes(path.basename(f)));
const deployHost=/https?:\/\/[0-9a-f]{12,}--nariyal-sutra\.netlify\.app/ig;
const doubled=/https:\/\/nariyal-sutra\.netlify\.app\/https:\/\//ig;
const selfAsset=/https:\/\/nariyal-sutra\.netlify\.app\/(assets\/[^\s"'`<>)?#]+)/ig;

for(const file of textFiles){
  let s=''; try{s=fs.readFileSync(file,'utf8');}catch{continue;}
  const old=[...s.matchAll(deployHost)];
  if(old.length) add('stale-deploy-url',file,`${old.length} deploy-specific Netlify URL(s)`);
  if(doubled.test(s)) add('malformed-url',file,'duplicated production base URL');

  for(const m of s.matchAll(selfAsset)) checkRef(file,SELF_ORIGIN+'/'+m[1],'missing-self-hosted-asset');

  if(path.extname(file).toLowerCase()==='.html'){
    const attr=/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi;
    for(const m of s.matchAll(attr)) checkRef(file,m[1]);

    const srcset=/\bsrcset\s*=\s*["']([^"']+)["']/gi;
    for(const m of s.matchAll(srcset)){
      for(const part of m[1].split(',')) checkRef(file,part.trim().split(/\s+/)[0]);
    }
  }

  if(['.css','.html'].includes(path.extname(file).toLowerCase())){
    const cssUrl=/url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    for(const m of s.matchAll(cssUrl)) checkRef(file,m[1]);
  }
}

const redirects=path.join(ROOT,'_redirects');
if(fs.existsSync(redirects)){
  for(const raw of fs.readFileSync(redirects,'utf8').split(/\r?\n/)){
    const line=raw.trim(); if(!line || line.startsWith('#')) continue;
    const parts=line.split(/\s+/); if(parts.length<2) continue;
    const m=parts[1].match(/^\/\.netlify\/functions\/([A-Za-z0-9_-]+)$/);
    if(m){
      const fn=path.join(ROOT,'netlify','functions',m[1]+'.js');
      if(!fs.existsSync(fn)) add('missing-netlify-function',redirects,`${m[1]} -> ${rel(fn)}`);
    }
  }
}

const required=[
  'index.html','_redirects','_headers',
  'assets/css/v36-public.css','assets/js/v36-public.js','assets/js/v421-stable-assets.js',
  'assets/js/story-pages.js','assets/js/v35-worlds.js','assets/js/v421-catalog.js',
  'netlify/functions/send-email.js','netlify/functions/media-sign-upload.js',
  'assets/images/nariyal-premium-hero.webp','assets/images/nariyal-hospitality.webp',
  'assets/images/nariyal-product-collection.webp','assets/images/green-round-coconut.jpg',
  'assets/images/bulk-coconut-pack.jpg','assets/images/freshness-coconut-splash.webp',
  'assets/images/brand/coconut-premium.webp',
  'assets/images/story-coconut-hero.png','assets/images/story-coconut-body-cut.png','assets/images/story-coconut-cap-cut.png'
];
for(const r of required){if(!fs.existsSync(path.join(ROOT,r))) add('missing-release-file',path.join(ROOT,r),'required release file is absent');}

const protectedAssets={
  'assets/images/story-coconut-hero.png':'9d23663bd286228dca2c171cc972e0acdd29412df9f77c9f699c49553d0e6d1f',
  'assets/images/story-coconut-body-cut.png':'2b9bbc81fb4f7b0c373ecc4b3d3183a043b18a0cdbb50b5853c6962881fc50bf',
  'assets/images/story-coconut-cap-cut.png':'78fb7bf35934c6456db5843ffefe154626d3f5cf1506e09cccff0e538b0624bb'
};
for(const [r,expected] of Object.entries(protectedAssets)){
  const p=path.join(ROOT,r);
  if(fs.existsSync(p)){
    const actual=sha256(p);
    if(actual!==expected) add('protected-asset-hash-mismatch',p,`expected ${expected}, got ${actual}`);
  }
}

const jsFiles=files.filter(f=>['.js','.mjs'].includes(path.extname(f).toLowerCase()));
for(const file of jsFiles){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0) add('javascript-syntax',file,(result.stderr||result.stdout||'syntax check failed').trim().split('\n').slice(-3).join(' | '));
}

console.log('\nNariyal Sutra pre-deploy audit');
console.log('Text files checked:',textFiles.length);
console.log('JavaScript files syntax-checked:',jsFiles.length);
if(warnings.length){console.log('\nWarnings:');for(const w of warnings)console.log(`WARN [${w.kind}] ${w.file}: ${w.msg}`);}
if(problems.length){
  console.error(`\nFAILED: ${problems.length} release blocker(s)`);
  for(const p of problems) console.error(`FAIL [${p.kind}] ${p.file}: ${p.msg}`);
  process.exit(1);
}
console.log('\nPASS: source URLs, local/self-hosted assets, critical media, protected asset hashes, JS syntax and Netlify function redirects all passed.');
