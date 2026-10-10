import {zipFunctions} from '@netlify/zip-it-and-ship-it';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const out=path.resolve('qa-artifacts/functions'),expanded=path.join(out,'expanded');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const archives=await zipFunctions('netlify/functions',out,{config:{'*':{nodeBundler:'esbuild',nodeVersion:'22.x'}}});
const names=['admin-communication-send','media-sign-upload','order-delete-otp','published-auth-theme','send-email'];
assert.deepEqual(archives.map(x=>x.name).sort(),names);
for(const item of archives){
  const dest=path.join(expanded,item.name);fs.mkdirSync(dest,{recursive:true});
  execFileSync('unzip',['-q',item.path,'-d',dest]);
  const source=fs.readFileSync(path.join(dest,item.name+'.js'),'utf8');
  assert.ok(source.includes('productionRequest'),item.name+' omitted deployment boundary');
  if(item.name!=='published-auth-theme')assert.ok(source.includes('verifyAppCheckRequest'),item.name+' omitted App Check helper');
  if(['admin-communication-send','order-delete-otp','send-email'].includes(item.name))assert.ok(source.includes('completeTemplateParams'),item.name+' omitted email contract');
  fs.copyFileSync(path.join(dest,item.name+'.js'),path.join(expanded,item.name+'.js'));
}
execFileSync(process.execPath,['scripts/netlify-release-boundary-qa.mjs'],{env:{...process.env,NS_QA_FUNCTIONS_DIR:expanded},stdio:'inherit'});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({ok:true,bundler:'@netlify/zip-it-and-ship-it / esbuild',nodeTarget:'22.x',handlers:archives.map(x=>({name:x.name,bytes:fs.statSync(x.path).size})),sourceModulesExcludedFromStaticPublish:true},null,2));
console.log('NETLIFY REAL FUNCTION PACKAGE QA: PASS (5 callable handlers; shared helpers bundled)');
