import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const must=(c,m)=>{if(!c)throw new Error(m)};
const has=(src,parts,label)=>parts.forEach(p=>must(src.includes(p),`${label}: missing ${p}`));
const not=(src,parts,label)=>parts.forEach(p=>must(!src.includes(p),`${label}: forbidden ${p}`));

const config=read('firebase-config.js');
has(config,[
  "window.NS_FIREBASE_CONFIG=LOCAL?null:PROD_CONFIG",
  'window.NS_FIREBASE_LOCAL_DISABLED=LOCAL',
  'window.NS_INIT_APP_CHECK=function(app)',
  'ReCaptchaEnterpriseProvider',
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
  'validPublicTrackingUpdate(token)',
  'validAuditCreate()',
  'validProduct(productKey)',
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
  'NS_INIT_APP_CHECK',
  "loadScript('/assets/js/admin-v49-customer-live.js')"
],'production bridge');

const login=read('admin-bcc-login.html');
has(login,[
  'u?.emailVerified',
  "x.status!=='Active'",
  'x.active!==true',
  "String(x.email||'')!==String(u.email||'')",
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

for(const p of ['netlify/functions/media-sign-upload.js','netlify/functions/admin-communication-send.js']){
  const src=read(p);
  has(src,["claims.email_verified!==true","status!=='Active'","active!==true","roleEmail!==email"],p);
}

const email=read('netlify/functions/send-email.js');
has(email,[
  "pending:{headline:'Order received'",
  "confirmed:{headline:'Order confirmed'",
  "ready_for_dispatch:{headline:'Ready for dispatch'",
  "out_for_delivery:{headline:'Out for delivery'",
  "delivered:{headline:'Delivered'",
  "cancelled:{headline:'Order cancelled'",
  "show_order_details:showOrder",
  "show_tracking:showTracking"
],'transactional email');
not(email,["Custom quote"],'transactional email');

const firebaserc=JSON.parse(read('.firebaserc'));
must(firebaserc?.projects?.default==='nariyal-sutra','.firebaserc must pin nariyal-sutra');
console.log('PRODUCTION FIREBASE INTEGRATION CONTRACT QA: PASS');
