import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {verifyAppCheckToken,verifyAppCheckRequest,DEFAULT_PROJECT_NUMBER,DEFAULT_APP_ID}=require('../netlify/functions/app-check-verify.js');

const must=(c,m)=>{if(!c)throw new Error(m)};
const rejects=async(fn,label)=>{let failed=false;try{await fn();}catch(_){failed=true;}must(failed,label);};
const enc=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});Object.assign(jwk,{kid:'qa-app-check-key',alg:'RS256',use:'sig'});
const now=Math.floor(Date.now()/1000);
function token(overrides={},headerOverrides={}){
  const header={alg:'RS256',typ:'JWT',kid:jwk.kid,...headerOverrides};
  const payload={
    iss:`https://firebaseappcheck.googleapis.com/${DEFAULT_PROJECT_NUMBER}`,
    aud:[`projects/${DEFAULT_PROJECT_NUMBER}`],
    sub:DEFAULT_APP_ID,
    iat:now-5,
    exp:now+300,
    ...overrides
  };
  const body=enc(header)+'.'+enc(payload),sig=crypto.sign('RSA-SHA256',Buffer.from(body),privateKey).toString('base64url');
  return body+'.'+sig;
}
const options={projectNumber:DEFAULT_PROJECT_NUMBER,appId:DEFAULT_APP_ID,jwks:[jwk]};

const valid=token();
const claims=await verifyAppCheckToken(valid,options);
must(claims.sub===DEFAULT_APP_ID,'Valid App Check token did not preserve app identity');

await rejects(()=>verifyAppCheckToken(token({iss:'https://firebaseappcheck.googleapis.com/999'}),options),'Wrong issuer was accepted');
await rejects(()=>verifyAppCheckToken(token({aud:['projects/999']}),options),'Wrong audience was accepted');
await rejects(()=>verifyAppCheckToken(token({sub:'1:other:web:app'}),options),'Wrong Firebase app ID was accepted');
await rejects(()=>verifyAppCheckToken(token({exp:now-1}),options),'Expired App Check token was accepted');
await rejects(()=>verifyAppCheckToken(token({}, {typ:'NOTJWT'}),options),'Wrong JWT type was accepted');
await rejects(()=>verifyAppCheckToken(valid.slice(0,-2)+'aa',options),'Tampered App Check signature was accepted');

const optional=await verifyAppCheckRequest({headers:{}},{...options,required:false});
must(optional.verified===false&&optional.token==='','Optional rollout rejected a request without App Check');
await rejects(()=>verifyAppCheckRequest({headers:{}},{...options,required:true}),'Enforced rollout accepted a request without App Check');
const request=await verifyAppCheckRequest({headers:{'x-firebase-appcheck':valid}},{...options,required:true});
must(request.verified===true&&request.claims.sub===DEFAULT_APP_ID,'Valid request App Check token was not verified');
await rejects(()=>verifyAppCheckRequest({headers:{'x-firebase-appcheck':'malformed'}},{...options,required:false}),'Optional rollout accepted a malformed provided App Check token');

console.log('CUSTOM BACKEND APP CHECK QA: PASS');
