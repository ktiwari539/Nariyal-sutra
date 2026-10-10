/**
 * Build the exact static Netlify publish surface.
 * Netlify Functions remain sourced from netlify/functions outside dist-site.
 * Non-web evidence, docs and development tools are never published.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'dist-site');
const MAX_TOTAL_BYTES=40*1024*1024;
const MAX_FILE_BYTES=8*1024*1024;
const topFiles=new Set(['_headers','_redirects','robots.txt','sitemap.xml','llms.txt','site.webmanifest','PEOPLE-MEDIA-V26.json']);
const assetTypes=new Set(['.js','.css','.svg','.png','.webp','.jpg','.jpeg','.avif','.gif','.woff','.woff2','.ico']);
const functions=['admin-communication-send.js','media-sign-upload.js','order-delete-otp.js','published-auth-theme.js','send-email.js'];
const helpers=['app-check-verify.js','email-template-contract.js'];
const picked=[],warnings=[];
const posix=p=>p.split(path.sep).join('/');
const assert=(ok,msg)=>{if(!ok)throw new Error('DEPLOY PACKAGE: '+msg)};
const getFiles=async dir=>{
  const found=[];
  for(const ent of await fs.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())found.push(...await getFiles(p));
    else if(ent.isFile())found.push(p);
  }
  return found;
};
const top=await fs.readdir(ROOT,{withFileTypes:true});
for(const e of top){
  if(!e.isFile())continue;
  if(topFiles.has(e.name)||/\.(html|js)$/i.test(e.name))picked.push(e.name);
}
for(const base of ['assets/css','assets/js','assets/images','assets/icons']){
  const abs=path.join(ROOT,base);
  for(const file of await getFiles(abs)){
    if(!assetTypes.has(path.extname(file).toLowerCase()))continue;
    picked.push(posix(path.relative(ROOT,file)));
  }
}
assert(picked.includes('index.html'),'index.html missing');
assert(picked.includes('_headers')&&picked.includes('_redirects'),'Netlify headers/redirects missing');
assert(picked.includes('sitemap.xml')&&picked.includes('robots.txt'),'SEO public files missing');
assert(picked.includes('assets/js/v36-public.js'),'customer runtime missing');
assert(picked.includes('assets/images/nariyal-premium-hero.webp'),'hero media missing');
assert(picked.includes('admin.html')&&picked.includes('admin-preview.html'),'Admin entry missing');
for(const name of functions){
  assert((await fs.stat(path.join(ROOT,'netlify/functions',name))).isFile(),'Netlify function missing: '+name);
}
for(const name of helpers)assert((await fs.stat(path.join(ROOT,'netlify/lib',name))).isFile(),'Netlify helper missing: '+name);
const routes=await fs.readFile(path.join(ROOT,'_redirects'),'utf8');
assert(routes.includes('/.netlify/functions/media-sign-upload'),'media upload function route missing');
let total=0;
const manifest=[];
for(const rel of picked.sort()){
  assert(!rel.includes('..')&&!rel.startsWith('/'),'unsafe path '+rel);
  const file=path.join(ROOT,rel);
  const stat=await fs.stat(file);
  assert(stat.size<=MAX_FILE_BYTES,rel+' too large: '+stat.size);
  total+=stat.size;
  manifest.push({path:rel,bytes:stat.size,sha256:crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')});
}
assert(total<=MAX_TOTAL_BYTES,'public package exceeds 40 MiB: '+total);
await fs.rm(OUT,{recursive:true,force:true});
await fs.mkdir(OUT,{recursive:true});
for(const rel of picked){
  const dest=path.join(OUT,rel);
  await fs.mkdir(path.dirname(dest),{recursive:true});
  await fs.copyFile(path.join(ROOT,rel),dest);
}
const staged=await getFiles(OUT);
assert(staged.length===picked.length,'staged file-count mismatch');
assert(!staged.some(p=>/(?:^|\/)(?:docs|scripts|qa-artifacts|\.github|\.git|netlify)(?:\/|$)/.test(posix(path.relative(OUT,p)))),'development file exposed');
const report={ok:true,publicBytes:total,publicMiB:+(total/1048576).toFixed(2),publicFiles:picked.length,functions:functions.length,helpers:helpers.length,largeFiles:[...manifest].sort((a,b)=>b.bytes-a.bytes).slice(0,10),manifest};
const qa=path.join(ROOT,'qa-artifacts/release-package');
await fs.mkdir(qa,{recursive:true});
await fs.writeFile(path.join(qa,'manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log('NETLIFY RELEASE PACKAGE: PASS '+JSON.stringify({publicMiB:report.publicMiB,publicFiles:report.publicFiles,functions:report.functions,largest:report.largeFiles.map(x=>({path:x.path,bytes:x.bytes}))}));
