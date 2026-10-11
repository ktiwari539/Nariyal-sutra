'use strict';

// Production services may only run on the canonical production deployment.
// Staging remains disabled until its separate service configuration is accepted.
const PRODUCTION_ORIGIN='https://nariyal-sutra.netlify.app';
function allowedOrigin(value){
  try{return new URL(value).origin===PRODUCTION_ORIGIN?PRODUCTION_ORIGIN:null;}catch{return null;}
}
function productionRequest(event){
  const context=String(process.env.CONTEXT||'');
  if(context&&context!=='production')return false;
  const rawUrl=event?.rawUrl||event?.rawURL;
  if(rawUrl){try{return new URL(rawUrl).origin===PRODUCTION_ORIGIN;}catch{return false;}}
  const host=event?.headers?.host||event?.headers?.Host;
  if(host)return host==='nariyal-sutra.netlify.app';
  // Direct local contract tests have no platform request URL. Netlify must have one.
  return !process.env.NETLIFY&&!context;
}
module.exports={allowedOrigin,productionRequest,PRODUCTION_ORIGIN};
