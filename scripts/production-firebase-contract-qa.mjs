import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const read=p=>fs.readFileSync(p,'utf8');
const must=(c,m)=>{if(!c)throw new Error(m)};
const has=(src,parts,label)=>parts.forEach(p=>must(src.includes(p),`${label}: missing ${p}`));
const not=(src,parts,label)=>parts.forEach(p=>must(!src.includes(p),`${label}: forbidden ${p}`));

const config=read('firebase-config.js');
has(config,[
  "window.NS_FIREBASE_CONFIG=LOCAL?null:PROD_CONFIG",
  'window.NS_FIREBASE_LOCAL_DISABLED=LOCAL',
  'window.NS_INIT_APP_CHECK=function(app)',
  'window.NS_GET_APP_CHECK_TOKEN=async function()',
  'ReCaptchaEnterpriseProvider',
  'mod.getToken(window.NS_APP_CHECK_INSTANCE,false)',
  "customerAuthProviders:[\"password\"]"
],'firebase-config');

const order=read('ns-order-patch.js');
has(order,[
  'writeBatch(db)',
  "doc(db,'orders'",
  "doc(db,'publicTracking'",
  "doc(db,'customerOrders'",
  "window.NS_ORDER_PROJECTION_MODE='atomic-batch'",
  "deliveryLocationSource",
  "deliveryCoordinatesConfirmed"
],'checkout projection');
not(order,['NS_CUSTOMER_AFTER_ORDER_SAVED('],'checkout projection');

const rules=read('firestore.rules');
has(rules,[
  "activeRoleData().status == 'Active'",
  'activeRoleData().active == true',
  'activeRoleData().email == request.auth.token.email',
  "'deliveryAddress'",
  "'deliveryLocationSource'",
  "'deliveryCoordinatesConfirmed'",
  "'deliveryPreference'",
  "'handoverPointType'",
  "'handoverPointName'",
  'validPublicTrackingUpdate(token)',
  'validAuditCreate()',
  'd.actorRole == currentRole()',
  'd.timestamp == request.time',
  'validProduct(productKey)',
  'd.updatedBy == request.auth.uid',
  'validMediaAssetWrite(logicalId)',
  "d.keys().hasOnly(['logicalId','provider','sourceSha256','updatedAt','updatedBy'])",
  "d.keys().hasAll(['logicalId','provider','sourceSha256','updatedAt','updatedBy'])",
  'allow get, list: if canContent();',
  'getAfter(orderPath(d.orderId))'
],'firestore rules');
not(rules,["'deliveryOTP','updatedAt'"],'public tracking fields');

const storage=read('storage.rules');
has(storage,[
  "fileName == 'avatar.webp'",
  "request.resource.contentType == 'image/webp'",
  'request.resource.size <= 5 * 1024 * 1024',
  'allow create, update: if isSelf(uid)'
],'storage rules');

const bridge=read('assets/js/v421-production-bridge.js');
has(bridge,[
  "if(!u?.emailVerified||!u?.email)return ''",
  "x.status!=='Active'",
  'x.active!==true',
  "String(x.email||'')!==String(u.email||'')",
  "fsMod.collection(db,'customers')",
  "fsMod.collection(db,'customerAdmin')",
  'customerName:x.customerName',
  'customerUid:x.customerUid',
  "if(role==='Operations')batch.update",
  'updatedBy:user.uid',
  "headers['x-firebase-appcheck']=appCheck",
  'NS_INIT_APP_CHECK',
  "loadScript('/assets/js/admin-v49-customer-live.js')"
],'production bridge');

const login=read('admin-bcc-login.html');
has(login,[
  'u?.emailVerified',
  'sendEmailVerification',
  'isConfiguredOwner&&!u.emailVerified',
  'u.uid!==owner',
  'Owner email verification sent to ',
  "x.status!=='Active'",
  'x.active!==true',
  'norm(x.email)!==norm(u.email)',
  'NS_INIT_APP_CHECK'
],'admin login');

const customers=read('assets/js/admin-v49-customer-live.js');
has(customers,[
  'bridge?.isProduction',
  'NS_ADMIN_CUSTOMERS',
  'customerProfiles',
  'Customer 360',
  'No production customers yet.'
],'Customer 360 live runtime');
not(customers,['Aarav Mehta','aarav@example.com','NS-1042'],'Customer 360 live runtime');

const delivery=read('assets/js/admin-v50-delivery-contract.js');
has(delivery,[
  "const STATUSES=['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered']",
  "doc(db,'deliveryAdmin'",
  "doc(db,'publicTracking'",
  "doc(db,'customerOrders'",
  'await batch.commit()',
  "kind:'customer_status'"
],'delivery contract');
not(delivery,["'arrived'"],'delivery contract');

const verifier=read('netlify/functions/app-check-verify.js');
has(verifier,[
  "https://firebaseappcheck.googleapis.com/v1/jwks",
  "header.alg!=='RS256'",
  "header.typ!=='JWT'",
  "payload.iss!==`https://firebaseappcheck.googleapis.com/${projectNumber}`",
  "aud.includes(`projects/${projectNumber}`)",
  "String(payload.sub||'')!==appId",
  "process.env.NS_APP_CHECK_REQUIRED"
],'custom backend App Check verifier');

for(const p of ['netlify/functions/media-sign-upload.js','netlify/functions/admin-communication-send.js']){
  const src=read(p);
  has(src,["claims.email_verified!==true","status!=='Active'","active!==true","roleEmail!==email","verifyAppCheckRequest(event)","headers['X-Firebase-AppCheck']=appCheckToken"],p);
}

const email=read('netlify/functions/send-email.js');
has(email,[
  "body.kind==='customer_status'",
  'verifyFirebaseToken',
  'verifyAppCheckRequest(event)',
  'adminRole(claims,token,appCheckToken',
  'completeTemplateParams',
  "show_order_details:showOrder",
  "show_tracking:showTracking"
],'transactional email');
not(email,["Custom quote"],'transactional email');

const deleteOtp=read('netlify/functions/order-delete-otp.js');
has(deleteOtp,[
  'verifyAppCheckRequest(event)',
  'completeTemplateParams',
  "actorRole:'Owner'",
  "setToServerValue:'REQUEST_TIME'",
  "headers['X-Firebase-AppCheck']=appCheckToken"
],'Owner delete/audit contract');

for(const p of ['assets/js/admin-communication.js','assets/js/admin-v46-owner-order-otp.js','assets/js/admin-v50-delivery-contract.js'])has(read(p),["headers['x-firebase-appcheck']=appCheck"],p);
const storefront=read('index.html');
has(storefront,[
  "await window.NS_INIT_APP_CHECK(app)",
  "window.NS_APP_CHECK_INSTANCE=appCheckInstance",
  "window.NS_APP_CHECK_STATUS='initialized'"
],'storefront shared App Check initialization');

const deliveryClient=read('ns-delivery.js');
has(deliveryClient,[
  "label:'Door Delivery'",
  "label:'Pickup from Handover Hub'",
  "label:'Railway Station Handover'",
  "label:'Bus Stand / Stop Handover'",
  'window.nsFindHandover=async function(kind)',
  "handoverPointName:String(nsDelivery.handoverPointName||'').slice(0,180)",
  "deliveryPreference:nsDelivery.selectedDelivery||'pending'"
],'customer delivery preference contract');

const clientEmail=read('emailjs-config.js');
has(clientEmail,[
  "typeof window.NS_GET_APP_CHECK_TOKEN!=='function'",
  "async function appCheckToken()",
  "await window.NS_INIT_APP_CHECK(apps[0])",
  "const appCheck=await appCheckToken()",
  "headers['x-firebase-appcheck']=appCheck",
  "return {channel:'server',result:await serverSend(kind,data)}"
],'server-only client email contract');
not(clientEmail,[
  "const appCheck=typeof window.NS_GET_APP_CHECK_TOKEN==='function'?await window.NS_GET_APP_CHECK_TOKEN():'';"
],'server-only client email contract');
not(clientEmail,["window.emailjs.send","browser-fallback","function browserSend","if(kind==='customer_status')throw serverError","arrived:"],'server-only client email contract');

const cutoverBuilder=read('scripts/build-firestore-cutover-rules.mjs');
has(cutoverBuilder,[
  'GENERATED CUTOVER RULESET',
  "legacy deliveryAddress",
  "legacy delivery coordinate metadata",
  "firestore.cutover.rules"
],'zero-downtime cutover builder');
not(cutoverBuilder,["deliveryOTP','updatedAt","legacy public tracking OTP"],'minimal cutover builder');
const cutoverConfig=JSON.parse(read('firebase.cutover.json'));
must(cutoverConfig?.firestore?.rules==='firestore.cutover.rules','Cutover Firebase config does not point at generated compatibility rules');

const {TEMPLATE_FIELDS,completeTemplateParams,orderStatusCopy}=require('../netlify/functions/email-template-contract.js');
must(TEMPLATE_FIELDS.length===35,'EmailJS canonical template contract field count changed without QA review');
const clientFieldSource=clientEmail.match(/const TEMPLATE_FIELDS=Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1]||'',clientFields=[...clientFieldSource.matchAll(/'([^']+)'/g)].map(x=>x[1]);
must(JSON.stringify(clientFields)===JSON.stringify(TEMPLATE_FIELDS),'Client and server EmailJS template fields diverged');
const completed=completeTemplateParams({to_email:'qa@example.com',email_subject:'QA',headline:'QA',status_message:'QA',email_kind:'qa'});
for(const field of TEMPLATE_FIELDS)must(Object.hasOwn(completed,field),`EmailJS template contract omitted ${field}`);
for(const status of ['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered','cancelled']){
  const copy=orderStatusCopy(status,'NS-QA-EMAIL',status==='cancelled'?'QA reason':'');
  must(copy.subject&&copy.headline&&copy.label&&copy.message,`EmailJS status copy missing ${status}`);
}

const allowedRequestHeaders='content-type, authorization, x-firebase-appcheck';
for(const p of ['../netlify/functions/media-sign-upload.js','../netlify/functions/admin-communication-send.js','../netlify/functions/order-delete-otp.js','../netlify/functions/send-email.js']){
  const response=await require(p).handler({httpMethod:'OPTIONS',headers:{origin:'https://nariyal-sutra.netlify.app'}});
  must(response.statusCode===204,`${p} did not accept approved preflight`);
  must(String(response.headers?.['access-control-allow-headers']||'').toLowerCase()===allowedRequestHeaders,`${p} App Check CORS contract changed`);
}
const unauthorizedStatus=await require('../netlify/functions/send-email.js').handler({
  httpMethod:'POST',
  headers:{origin:'https://nariyal-sutra.netlify.app','content-type':'application/json'},
  body:JSON.stringify({kind:'customer_status',data:{orderId:'NS-QA-EMAIL',email:'qa@example.com',status:'confirmed'}})
});
must(unauthorizedStatus.statusCode===401,'Unauthenticated order-status email was not rejected');

const firebaserc=JSON.parse(read('.firebaserc'));
must(firebaserc?.projects?.default==='nariyal-sutra','.firebaserc must pin nariyal-sutra');
console.log('PRODUCTION FIREBASE INTEGRATION CONTRACT QA: PASS');
