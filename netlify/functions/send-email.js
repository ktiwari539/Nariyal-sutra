'use strict';
const crypto=require('crypto');
const {completeTemplateParams,orderStatusCopy}=require('./email-template-contract');
const {verifyAppCheckRequest}=require('./app-check-verify');
const ALLOWED_KINDS=new Set(['customer_request','owner_order','customer_status','customer_inquiry','owner_inquiry']);
const PUBLIC_KEY=process.env.EMAILJS_PUBLIC_KEY||'aDjTgmhSPrBeTpnOA';
const SERVICE_ID=process.env.EMAILJS_SERVICE_ID||'service_c24xpf8';
const TEMPLATE_ID=process.env.EMAILJS_TEMPLATE_ID||'template_y01paqk';
const OWNER_EMAIL=process.env.NS_OWNER_EMAIL||'nariyalsutra@gmail.com';
const SITE_URL=process.env.URL||'https://nariyal-sutra.netlify.app';
const ADMIN_URL=SITE_URL.replace(/\/$/,'')+'/admin';
const buckets=new Map();
const STATUS_SET=new Set(['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered','cancelled']);
let certCache={expiresAt:0,certs:null};
function json(status,body,origin){return {statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':origin||SITE_URL,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type, authorization, x-firebase-appcheck','vary':'Origin'},body:status===204?'':JSON.stringify(body)}}
function allowedOrigin(v){if(!v)return false;try{const u=new URL(v);if(u.protocol!=='https:')return false;if(u.hostname==='nariyal-sutra.netlify.app')return true;if(u.hostname.endsWith('--nariyal-sutra.netlify.app'))return true;if(process.env.URL&&u.origin===new URL(process.env.URL).origin)return true;return false;}catch{return false}}
function rateOk(ip){const now=Date.now(),key=String(ip||'unknown'),b=buckets.get(key)||[];const live=b.filter(x=>now-x<60000);if(live.length>=12)return false;live.push(now);buckets.set(key,live);return true;}
function b64url(input){let s=String(input||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Buffer.from(s,'base64');}
async function googleCerts(){if(certCache.certs&&Date.now()<certCache.expiresAt)return certCache.certs;const r=await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');if(!r.ok)throw new Error('Firebase certificate lookup failed');const certs=await r.json(),cc=r.headers.get('cache-control')||'',maxAge=Number((cc.match(/max-age=(\d+)/)||[])[1]||1800);certCache={certs,expiresAt:Date.now()+Math.max(300,maxAge-60)*1000};return certs;}
async function verifyFirebaseToken(token,projectId){const parts=String(token||'').split('.');if(parts.length!==3)throw new Error('Invalid Firebase token');let header,payload;try{header=JSON.parse(b64url(parts[0]).toString('utf8'));payload=JSON.parse(b64url(parts[1]).toString('utf8'));}catch(_){throw new Error('Invalid Firebase token');}if(header.alg!=='RS256'||!header.kid)throw new Error('Invalid Firebase token algorithm');const certs=await googleCerts(),cert=certs[header.kid];if(!cert)throw new Error('Unknown Firebase signing key');if(!crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),cert,b64url(parts[2])))throw new Error('Firebase token signature rejected');const now=Math.floor(Date.now()/1000);if(payload.aud!==projectId||payload.iss!==`https://securetoken.google.com/${projectId}`||!payload.sub||payload.sub.length>128||Number(payload.exp||0)<=now||Number(payload.iat||0)>now+60||Number(payload.auth_time||0)>now+60)throw new Error('Firebase token claims rejected');return payload;}
function firebaseHeaders(token,appCheckToken){const headers={authorization:`Bearer ${token}`};if(appCheckToken)headers['X-Firebase-AppCheck']=appCheckToken;return headers;}
async function adminRole(claims,token,appCheckToken,projectId,ownerUid,ownerEmail){const uid=String(claims.sub||''),email=String(claims.email||'').toLowerCase();if(claims.email_verified!==true||!email)return'';if(uid===ownerUid)return email===String(ownerEmail||'').toLowerCase()?'Owner':'';const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/adminRoles/${encodeURIComponent(uid)}`;const r=await fetch(url,{headers:firebaseHeaders(token,appCheckToken)});if(!r.ok)return'';const f=(await r.json())?.fields||{},role=String(f.role?.stringValue||''),status=String(f.status?.stringValue||''),mappedEmail=String(f.email?.stringValue||'').toLowerCase(),active=f.active?.booleanValue===true;return active&&status==='Active'&&mappedEmail===email&&['Admin','Manager','Operations','Content','Support','Sales'].includes(role)?role:'';}
function money(v){return Number(v||0).toLocaleString('en-IN')}
function hasTracking(d){return /^[0-9a-f]{48}$/i.test(String(d?.trackingToken||''))}
function trackUrl(d){return hasTracking(d)?SITE_URL.replace(/\/$/,'')+'/track?t='+encodeURIComponent(d.trackingToken):''}
function params(kind,d){
 d=d||{};
 const isInquiry=kind.includes('inquiry'),isOwner=kind.startsWith('owner_');
 const id=d.orderId||d.inquiryId||'',customer=d.customerName||d.name||'Customer',email=d.email||'',phone=d.phone||'';
 const product=(d.productName||d.productPreference||'').toString().replaceAll('_',' '),qty=Number(d.quantity||d.qty||0),total=Number(d.total||0),status=String(d.status||'pending');
 let subject='',headline='',label='',message='',to=email,ctaText='',ctaUrl='',showOrder='',showTracking='',detailTitle='Details';
 if(kind==='customer_request'){
   subject='Order Request Received #'+id;headline='We received your order request';label='Pending review';
   message='Your request is safely recorded. We will review stock, serviceability and delivery timing, then confirm the order with you on WhatsApp.';
   ctaText=hasTracking(d)?'Track Your Order':'Visit Nariyal Sutra';ctaUrl=trackUrl(d)||SITE_URL;showOrder='1';showTracking=hasTracking(d)?'1':'';detailTitle='Order summary';
 }else if(kind==='owner_order'){
   to=OWNER_EMAIL;subject='New Order Request #'+id;headline='New website order request';label='Pending review';
   message=customer+' requested '+String(qty||0)+' × '+(product||'product')+' for ₹'+money(total)+'.';
   ctaText='Open Owner Dashboard';ctaUrl=ADMIN_URL;showOrder='1';detailTitle='Order summary';
 }else if(kind==='customer_status'){
   const copy=orderStatusCopy(status,id,d.statusNote);
   subject=copy.subject;headline=copy.headline;label=copy.label;message=copy.message;
   ctaText=hasTracking(d)?'Track Your Order':'Visit Nariyal Sutra';ctaUrl=trackUrl(d)||SITE_URL;showOrder='1';showTracking=hasTracking(d)?'1':'';detailTitle='Order summary';
 }else if(kind==='customer_inquiry'){
   subject='Enquiry Received '+id;headline='Your enquiry is recorded';label='Reference '+id;
   message='Thank you. We received your Nariyal Sutra enquiry and will review availability, logistics and commercial requirements before confirming details.';
   ctaText='Continue on WhatsApp';ctaUrl='https://wa.me/919203831705';detailTitle='Enquiry details';
 }else if(kind==='owner_inquiry'){
   to=OWNER_EMAIL;subject='New Enquiry '+id;headline='New sales enquiry';label=d.inquiryTypeLabel||d.inquiryType||'New enquiry';
   message=customer+' · '+phone+' · '+(d.destination||'destination not specified')+' · '+(d.message||'');
   ctaText='Open Owner Dashboard';ctaUrl=ADMIN_URL;detailTitle='Enquiry details';
 }
 return {
   from_name:'Nariyal Sutra',reply_to:OWNER_EMAIL,to_email:to,email_subject:subject,subject,preheader:subject,headline,
   status_label:label,status_message:message,email_kind:kind,show_order_details:showOrder,show_tracking:showTracking,detail_title:detailTitle,
   order_id:id,customer_name:isOwner?'Nariyal Sutra Owner':customer,buyer_name:customer,email,phone,
   product_name:showOrder?product:'',quantity:showOrder&&qty?String(qty)+' pieces':'',rate:showOrder&&d.unitPrice?money(d.unitPrice)+'/pc':'',
   total:showOrder&&total?money(total):'',payment:showOrder?(d.paymentLabel||d.paymentType||''):'',address:showOrder?(d.address||''):'',city:showOrder?(d.city||''):'',
   notes:d.notes||d.message||'',order_date:new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}),site_url:SITE_URL,admin_url:ADMIN_URL,
   account_url:SITE_URL.replace(/\/$/,'')+'/#account',tracking_url:showTracking?trackUrl(d):'',cta_text:ctaText,cta_url:ctaUrl,status,
   status_note:d.statusNote||''
 };
}
exports.handler=async function(event){
 const rawOrigin=event.headers?.origin||event.headers?.Origin||event.headers?.referer||event.headers?.Referer||'';let origin='';try{origin=new URL(rawOrigin).origin}catch(_){}
 if(event.httpMethod==='OPTIONS')return allowedOrigin(origin)?json(204,{},origin):json(403,{error:'Origin not allowed'});
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'},origin||undefined);
 if(!allowedOrigin(origin))return json(403,{error:'Origin not allowed'});
 const ct=String(event.headers['content-type']||event.headers['Content-Type']||'');if(!ct.includes('application/json'))return json(415,{error:'JSON content type required'},origin);
 if(Number(event.headers['content-length']||0)>32768||String(event.body||'').length>32768)return json(413,{error:'Request too large'},origin);
 const ip=(event.headers['x-nf-client-connection-ip']||event.headers['x-forwarded-for']||'').split(',')[0].trim();if(!rateOk(ip))return json(429,{error:'Too many requests'},origin);
 let body;try{body=JSON.parse(event.body||'{}')}catch{return json(400,{error:'Invalid JSON'},origin)}
 if(body.website||body.companyWebsite)return json(200,{ok:true},origin);
 if(!ALLOWED_KINDS.has(body.kind))return json(400,{error:'Unsupported email kind'},origin);
 let appCheck;try{appCheck=await verifyAppCheckRequest(event);}catch(_){return json(401,{error:'App Check verification failed'},origin);}
 if(body.kind==='customer_status'){
  const status=String(body.data?.status||'').toLowerCase();if(!STATUS_SET.has(status)||!body.data?.orderId||!body.data?.email)return json(400,{error:'A valid order-status payload is required'},origin);
  const projectId=process.env.FIREBASE_PROJECT_ID||'nariyal-sutra',ownerUid=process.env.NS_ADMIN_OWNER_UID||'9FjkrCMDstfVS1Ghu2LlA0skoAf2',authHeader=String(event.headers.authorization||event.headers.Authorization||''),token=authHeader.match(/^Bearer\s+(.+)$/i)?.[1]||'',appCheckToken=appCheck.token;
  if(!token)return json(401,{error:'Admin authentication required for order-status email'},origin);
  let claims;try{claims=await verifyFirebaseToken(token,projectId);}catch(_){return json(401,{error:'Admin authentication could not be verified'},origin);}
  const role=await adminRole(claims,token,appCheckToken,projectId,ownerUid,OWNER_EMAIL);if(!['Owner','Admin','Manager','Operations'].includes(role))return json(403,{error:'Verified, active fulfilment access is required for order-status email'},origin);
 }
 const privateKey=process.env.EMAILJS_PRIVATE_KEY;if(!privateKey)return json(503,{error:'Email provider private key is not configured'},origin);
 let templateParams;try{templateParams=completeTemplateParams(params(body.kind,body.data));}catch(_){return json(400,{error:'Email template contract is incomplete'},origin);}
 const payload={service_id:SERVICE_ID,template_id:TEMPLATE_ID,user_id:PUBLIC_KEY,accessToken:privateKey,template_params:templateParams};
 try{const r=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const t=await r.text();if(!r.ok)return json(502,{error:'Email provider rejected request',providerStatus:r.status},origin);return json(200,{ok:true,provider:'emailjs',result:t||'OK'},origin);}catch(e){return json(502,{error:'Email provider unavailable'},origin);}
};
