const crypto = require('crypto');
let certCache = { expiresAt: 0, certs: null };
function json(statusCode, body, origin) {
  return {statusCode,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':origin||'https://nariyal-sutra.netlify.app','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type, authorization','vary':'Origin'},body:statusCode===204?'':JSON.stringify(body)};
}
function allowedOrigin(origin) {
  if (!origin) return null;
  try {const u=new URL(origin);if(u.protocol!=='https:')return null;if(u.hostname==='nariyal-sutra.netlify.app'||/--nariyal-sutra\.netlify\.app$/i.test(u.hostname))return origin;} catch (_) {}
  return null;
}
function b64url(input){let s=String(input||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Buffer.from(s,'base64');}
async function googleCerts(){if(certCache.certs&&Date.now()<certCache.expiresAt)return certCache.certs;const r=await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');if(!r.ok)throw new Error('Firebase certificate lookup failed');const certs=await r.json(),cc=r.headers.get('cache-control')||'',maxAge=Number((cc.match(/max-age=(\d+)/)||[])[1]||1800);certCache={certs,expiresAt:Date.now()+Math.max(300,maxAge-60)*1000};return certs;}
async function verifyFirebaseToken(token,projectId){const parts=String(token||'').split('.');if(parts.length!==3)throw new Error('Invalid Firebase token');let header,payload;try{header=JSON.parse(b64url(parts[0]).toString('utf8'));payload=JSON.parse(b64url(parts[1]).toString('utf8'));}catch(_){throw new Error('Invalid Firebase token');}if(header.alg!=='RS256'||!header.kid)throw new Error('Invalid Firebase token algorithm');const certs=await googleCerts(),cert=certs[header.kid];if(!cert)throw new Error('Unknown Firebase signing key');const ok=crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),cert,b64url(parts[2]));if(!ok)throw new Error('Firebase token signature rejected');const now=Math.floor(Date.now()/1000);if(payload.aud!==projectId||payload.iss!==`https://securetoken.google.com/${projectId}`)throw new Error('Firebase token audience rejected');if(!payload.sub||payload.sub.length>128||Number(payload.exp||0)<=now||Number(payload.iat||0)>now+60)throw new Error('Firebase token expired or invalid');if(Number(payload.auth_time||0)>now+60)throw new Error('Firebase token auth time invalid');return payload;}
async function adminRole(uid,token,projectId,ownerUid){if(uid===ownerUid)return 'Owner';const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/adminRoles/${encodeURIComponent(uid)}`;const r=await fetch(url,{headers:{authorization:`Bearer ${token}`}});if(!r.ok)return '';const doc=await r.json();return String(doc?.fields?.role?.stringValue||'');}
exports.handler = async (event) => {
  const origin=allowedOrigin(event.headers?.origin||event.headers?.Origin);
  if(event.httpMethod==='OPTIONS')return origin?json(204,{},origin):json(403,{error:'Origin not allowed'});
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'},origin||undefined);
  if(!origin)return json(403,{error:'Origin not allowed'});
  const cloudName=process.env.CLOUDINARY_CLOUD_NAME,apiKey=process.env.CLOUDINARY_API_KEY,apiSecret=process.env.CLOUDINARY_API_SECRET;
  if(!cloudName||!apiKey||!apiSecret)return json(503,{error:'Media upload is not configured on this environment.'},origin);
  const projectId=process.env.FIREBASE_PROJECT_ID||'nariyal-sutra',ownerUid=process.env.NS_ADMIN_OWNER_UID||'9FjkrCMDstfVS1Ghu2LlA0skoAf2';
  const authHeader=String(event.headers?.authorization||event.headers?.Authorization||''),token=authHeader.match(/^Bearer\s+(.+)$/i)?.[1]||'';
  if(!token)return json(401,{error:'Admin authentication required.'},origin);
  let claims;try{claims=await verifyFirebaseToken(token,projectId);}catch(e){return json(401,{error:'Admin authentication could not be verified.'},origin);}
  const role=await adminRole(String(claims.sub),token,projectId,ownerUid);if(!['Owner','Admin','Manager','Content'].includes(role))return json(403,{error:'This Admin role cannot upload public media.'},origin);
  let body={};try{body=JSON.parse(event.body||'{}');}catch(_){return json(400,{error:'Invalid JSON body'},origin);}
  const timestamp=Math.floor(Date.now()/1000),folder=String(body.folder||'nariyal-sutra/media').replace(/[^a-zA-Z0-9/_-]/g,'').slice(0,120)||'nariyal-sutra/media',params={folder,timestamp};
  if(body.public_id)params.public_id=String(body.public_id).replace(/[^a-zA-Z0-9/_-]/g,'').slice(0,120);if(body.tags)params.tags=String(body.tags).replace(/[\r\n]/g,' ').slice(0,240);if(body.context)params.context=String(body.context).replace(/[\r\n]/g,' ').slice(0,500);
  const toSign=Object.keys(params).sort().map(k=>`${k}=${params[k]}`).join('&'),signature=crypto.createHash('sha1').update(toSign+apiSecret).digest('hex');
  return json(200,{cloudName,apiKey,signature,role,...params},origin);
};
