import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const dir=path.resolve(process.env.NS_QA_FUNCTIONS_DIR||'netlify/functions');
const names=['admin-communication-send','media-sign-upload','order-delete-otp','send-email','published-auth-theme'];
const saved={...process.env},originalFetch=globalThis.fetch,checks=[];
const canonical='https://nariyal-sutra.netlify.app';
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
let calls=[];
globalThis.fetch=async(url)=>{calls.push(String(url));return {ok:true,text:async()=> 'Synthetic provider response',json:async()=>({fields:{status:{stringValue:'live'},themeConfig:{mapValue:{fields:{publishedTheme:{stringValue:'fresh-grove'}}}}}})};};
try{
  // These are synthetic values. No external requests or credentials are used.
  delete process.env.CONTEXT;delete process.env.NETLIFY;
  process.env.EMAILJS_PRIVATE_KEY='synthetic-only';
  const handlers=Object.fromEntries(names.map(n=>[n,require(path.join(dir,n+'.js')).handler]));
  for(const [name,handler] of Object.entries(handlers)){
    const method=name==='published-auth-theme'?'GET':'POST';
    const event={httpMethod:method,rawUrl:canonical+'/.netlify/functions/'+name,headers:{origin:canonical,'content-type':'application/json'},body:JSON.stringify({kind:'owner_order',data:{orderId:'SYNTHETIC-ONLY'}})};
    for(const hostname of ['deploy-preview-10--nariyal-sutra.netlify.app','unapproved--nariyal-sutra.netlify.app','evil.example','nariyal-sutra.netlify.app.evil.example']){
      calls=[];
      const response=await handler({...event,rawUrl:'https://'+hostname+'/.netlify/functions/'+name});
      check(name+' rejects '+hostname,response.statusCode===403&&calls.length===0);
    }
    for(const context of ['deploy-preview','branch-deploy','dev']){
      process.env.CONTEXT=context;calls=[];
      const response=await handler(event);
      check(name+' rejects '+context+' even with canonical request URL',response.statusCode===403&&calls.length===0);
    }
    process.env.CONTEXT='production';
    calls=[];
    const hostOnly=await handler({...event,rawUrl:undefined,headers:{...event.headers,host:'unapproved--nariyal-sutra.netlify.app'}});
    check(name+' rejects preview host header',hostOnly.statusCode===403&&calls.length===0);
    calls=[];
    const missingHost=await handler({...event,rawUrl:undefined});
    check(name+' fails closed without deployment hostname',missingHost.statusCode===403&&calls.length===0);
    delete process.env.CONTEXT;
    if(name!=='published-auth-theme'){
      for(const origin of ['https://unapproved--nariyal-sutra.netlify.app','https://evil.example','http://nariyal-sutra.netlify.app']){
        calls=[];const response=await handler({...event,headers:{...event.headers,origin}});
        check(name+' rejects origin '+origin,response.statusCode===403&&calls.length===0);
      }
      check(name+' preserves production preflight',(await handler({...event,httpMethod:'OPTIONS'})).statusCode===204);
    }
    const unsupported=await handler({...event,httpMethod:name==='published-auth-theme'?'POST':'GET'});
    check(name+' preserves unsupported method contract',unsupported.statusCode===405);
  }
  process.env.CONTEXT='production';calls=[];
  const theme=await handlers['published-auth-theme']({httpMethod:'GET',rawUrl:canonical+'/.netlify/functions/published-auth-theme',headers:{}});
  check('Canonical public theme still reads its allowlisted public document',theme.statusCode===200&&JSON.parse(theme.body).themeId==='fresh-grove'&&calls.length===1&&calls[0].includes('/projects/nariyal-sutra/'));
  calls=[];
  const email=await handlers['send-email']({httpMethod:'POST',rawUrl:canonical+'/.netlify/functions/send-email',headers:{origin:canonical,'content-type':'application/json'},body:JSON.stringify({kind:'owner_order',data:{orderId:'SYNTHETIC-ONLY'}})});
  check('Canonical transactional email still reaches intercepted provider',email.statusCode===200&&calls.length===1&&calls[0]==='https://api.emailjs.com/api/v1.0/email/send');
}finally{
  globalThis.fetch=originalFetch;
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];
  Object.assign(process.env,saved);
}
fs.mkdirSync('qa-artifacts/release-boundary',{recursive:true});
fs.writeFileSync('qa-artifacts/release-boundary/results.json',JSON.stringify({ok:true,checks,mode:'Real handlers; intercepted providers; zero external calls'},null,2));
console.log('NETLIFY RELEASE BOUNDARY QA: PASS ('+checks.length+' assertions)');
