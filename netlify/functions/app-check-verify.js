'use strict';
const crypto=require('crypto');

const DEFAULT_PROJECT_NUMBER='1017952628747';
const DEFAULT_APP_ID='1:1017952628747:web:9b2ceba1640e9ce236570e';
const JWKS_URL='https://firebaseappcheck.googleapis.com/v1/jwks';
const MAX_CACHE_MS=6*60*60*1000;
let jwksCache={expiresAt:0,keys:null};

function b64urlDecode(input){
  let s=String(input||'').replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  return Buffer.from(s,'base64');
}
function readHeader(event,name){
  const headers=event?.headers||{};
  return String(headers[name]||headers[name.toLowerCase()]||headers[name.toUpperCase()]||'');
}
function cacheTtl(response){
  const cc=String(response?.headers?.get?.('cache-control')||'');
  const seconds=Number((cc.match(/max-age=(\d+)/i)||[])[1]||21600);
  return Math.min(MAX_CACHE_MS,Math.max(5*60*1000,seconds*1000));
}
async function fetchJwks(){
  if(jwksCache.keys&&Date.now()<jwksCache.expiresAt)return jwksCache.keys;
  const response=await fetch(JWKS_URL,{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error('Firebase App Check key lookup failed');
  const body=await response.json();
  if(!Array.isArray(body?.keys)||!body.keys.length)throw new Error('Firebase App Check key set is empty');
  jwksCache={keys:body.keys,expiresAt:Date.now()+cacheTtl(response)};
  return body.keys;
}
function parseToken(token){
  const parts=String(token||'').split('.');
  if(parts.length!==3)throw new Error('Invalid App Check token');
  let header,payload;
  try{
    header=JSON.parse(b64urlDecode(parts[0]).toString('utf8'));
    payload=JSON.parse(b64urlDecode(parts[1]).toString('utf8'));
  }catch(_){throw new Error('Invalid App Check token');}
  return {parts,header,payload};
}
async function verifyAppCheckToken(token,options={}){
  const projectNumber=String(options.projectNumber||process.env.FIREBASE_PROJECT_NUMBER||DEFAULT_PROJECT_NUMBER);
  const appId=String(options.appId||process.env.FIREBASE_WEB_APP_ID||DEFAULT_APP_ID);
  const {parts,header,payload}=parseToken(token);
  if(header.alg!=='RS256'||header.typ!=='JWT'||!header.kid)throw new Error('Invalid App Check token header');
  const keys=options.jwks||await fetchJwks();
  const jwk=keys.find(k=>k&&k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));
  if(!jwk)throw new Error('Unknown App Check signing key');
  let publicKey;
  try{publicKey=crypto.createPublicKey({key:jwk,format:'jwk'});}catch(_){throw new Error('Invalid App Check signing key');}
  const signed=Buffer.from(parts[0]+'.'+parts[1]);
  if(!crypto.verify('RSA-SHA256',signed,publicKey,b64urlDecode(parts[2])))throw new Error('App Check signature rejected');
  const now=Math.floor(Date.now()/1000),aud=Array.isArray(payload.aud)?payload.aud:[payload.aud];
  if(payload.iss!==`https://firebaseappcheck.googleapis.com/${projectNumber}`)throw new Error('App Check issuer rejected');
  if(!aud.includes(`projects/${projectNumber}`))throw new Error('App Check audience rejected');
  if(!Number.isFinite(Number(payload.exp))||Number(payload.exp)<=now)throw new Error('App Check token expired');
  if(Number.isFinite(Number(payload.iat))&&Number(payload.iat)>now+60)throw new Error('App Check issued-at time rejected');
  if(Number.isFinite(Number(payload.nbf))&&Number(payload.nbf)>now+60)throw new Error('App Check not-before time rejected');
  if(appId&&String(payload.sub||'')!==appId)throw new Error('App Check app identity rejected');
  return payload;
}
async function verifyAppCheckRequest(event,options={}){
  const token=readHeader(event,'x-firebase-appcheck');
  const required=options.required!==undefined?options.required:String(process.env.NS_APP_CHECK_REQUIRED||'').toLowerCase()==='true';
  if(!token){
    if(required)throw new Error('App Check token required');
    return {verified:false,token:'',claims:null,required:false};
  }
  const claims=await verifyAppCheckToken(token,options);
  return {verified:true,token,claims,required};
}

module.exports={verifyAppCheckToken,verifyAppCheckRequest,DEFAULT_PROJECT_NUMBER,DEFAULT_APP_ID,JWKS_URL};
