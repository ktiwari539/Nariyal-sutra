import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const out=path.join(root,'.netlify-dev');
const excluded=new Set(['.git','.github','.netlify','.netlify-dev','node_modules','qa-artifacts','scripts','netlify']);
const textExts=new Set(['.html','.css','.js','.json','.webmanifest','.xml','.txt','.svg']);
const prodOrigin=/https?:\/\/(?:[a-f0-9]{20,}--)?nariyal-sutra\.netlify\.app\//gi;

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(excluded.has(entry.name)) continue;
  fs.cpSync(path.join(root,entry.name),path.join(out,entry.name),{recursive:true,preserveTimestamps:true});
}

let rewrittenFiles=0;
let rewrittenRefs=0;
const residual=[];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(textExts.has(path.extname(entry.name).toLowerCase())) rewrite(full);
  }
}

function rewrite(file){
  const original=fs.readFileSync(file,'utf8');
  let count=0;
  const next=original.replace(prodOrigin,()=>{count++;return '/';});
  if(count){
    fs.writeFileSync(file,next);
    rewrittenFiles++;
    rewrittenRefs+=count;
  }
  if(prodOrigin.test(next)) residual.push(path.relative(out,file));
  prodOrigin.lastIndex=0;
}

walk(out);

const devHeaders=path.join(out,'_headers');
if(!fs.existsSync(devHeaders)) throw new Error('Generated Netlify Dev publish directory is missing _headers');
let headers=fs.readFileSync(devHeaders,'utf8');
headers=headers.replace(/;\s*upgrade-insecure-requests\b/gi,'');
fs.writeFileSync(devHeaders,headers);

const sourceHeaders=fs.readFileSync(path.join(root,'_headers'),'utf8');
if(!/upgrade-insecure-requests/i.test(sourceHeaders)) throw new Error('Production _headers unexpectedly lost upgrade-insecure-requests');
if(/upgrade-insecure-requests/i.test(headers)) throw new Error('Netlify Dev _headers still contains upgrade-insecure-requests');
if(residual.length) throw new Error(`Netlify Dev output still references the production site origin: ${residual.slice(0,12).join(', ')}`);
for(const required of ['index.html','admin.html','track.html']){
  if(!fs.existsSync(path.join(out,required))) throw new Error(`Generated Netlify Dev output missing ${required}`);
}

console.log('NETLIFY DEV PREP: PASS',JSON.stringify({output:'.netlify-dev',rewrittenFiles,rewrittenRefs,productionHeadersPreserved:true,devUpgradeInsecureRequests:false}));
