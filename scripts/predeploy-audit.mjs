import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const TEXT_EXT=new Set(['.html','.css','.js','.mjs','.json','.webmanifest','.txt','.md','.toml']);
const SKIP=new Set(['.git','node_modules']);
const problems=[];
const warnings=[];

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
function isExternal(v){return /^(?:https?:|mailto:|tel:|data:|blob:|javascript:|#|\/\/)/i.test(v);}
function cleanRef(v){return v.split('#')[0].split('?')[0];}

const files=walk(ROOT);
const textFiles=files.filter(f=>TEXT_EXT.has(path.extname(f).toLowerCase()) || ['_redirects','_headers'].includes(path.basename(f)));
const deployHost=/https?:\/\/[0-9a-f]{12,}--nariyal-sutra\.netlify\.app/ig;
const doubled=/https:\/\/nariyal-sutra\.netlify\.app\/https:\/\//ig;

for(const file of textFiles){
  let s=''; try{s=fs.readFileSync(file,'utf8');}catch{continue;}
  const old=[...s.matchAll(deployHost)];
  if(old.length) add('stale-deploy-url',file,`${old.length} deploy-specific Netlify URL(s)`);
  if(doubled.test(s)) add('malformed-url',file,'duplicated production base URL');
  if(path.extname(file).toLowerCase()==='.html'){
    const attr=/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi;
    for(const m of s.matchAll(attr)){
      const v=m[1].trim();
      if(!v || isExternal(v)) continue;
      const c=cleanRef(v);
      if(!c || c==='/' || c.startsWith('/?')) continue;
      let target;
      if(c.startsWith('/')) target=path.join(ROOT,c.slice(1));
      else target=path.resolve(path.dirname(file),c);
      if(!fs.existsSync(target)) add('missing-local-reference',file,`${v} -> ${rel(target)}`);
    }
  }
}

const redirects=path.join(ROOT,'_redirects');
if(fs.existsSync(redirects)){
  const lines=fs.readFileSync(redirects,'utf8').split(/\r?\n/);
  for(const raw of lines){
    const line=raw.trim(); if(!line || line.startsWith('#')) continue;
    const parts=line.split(/\s+/); if(parts.length<2) continue;
    const target=parts[1];
    const m=target.match(/^\/\.netlify\/functions\/([A-Za-z0-9_-]+)$/);
    if(m){
      const fn=path.join(ROOT,'netlify','functions',m[1]+'.js');
      if(!fs.existsSync(fn)) add('missing-netlify-function',redirects,`${m[1]} -> ${rel(fn)}`);
    }
  }
}

const required=['index.html','_redirects','_headers','assets/css/v36-public.css','assets/js/v36-public.js'];
for(const r of required){if(!fs.existsSync(path.join(ROOT,r))) add('missing-release-file',path.join(ROOT,r),'required release file is absent');}

console.log('\nNariyal Sutra pre-deploy audit');
console.log('Text files checked:',textFiles.length);
if(warnings.length){console.log('\nWarnings:');for(const w of warnings)console.log(`WARN [${w.kind}] ${w.file}: ${w.msg}`);}
if(problems.length){
  console.error(`\nFAILED: ${problems.length} release blocker(s)`);
  for(const p of problems) console.error(`FAIL [${p.kind}] ${p.file}: ${p.msg}`);
  process.exit(1);
}
console.log('\nPASS: no stale deploy URLs, malformed production URLs, missing local page references, or dead Netlify function redirects found.');
