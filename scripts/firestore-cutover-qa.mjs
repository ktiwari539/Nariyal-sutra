import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,writeBatch,serverTimestamp} from 'firebase/firestore';

const PROJECT='nariyal-sutra';
const TOKEN_OLD='1'.repeat(48),TOKEN_NEW='2'.repeat(48),TOKEN_USER='3'.repeat(48);
const OLD_ORDER='NS-CUTOVER-OLD01',NEW_ORDER='NS-CUTOVER-NEW01',USER_ORDER='NS-CUTOVER-USER1';
const must=(c,m)=>{if(!c)throw new Error(m)};
function acquisition(){
  const touch={classification:'social',source:'instagram',medium:'social',campaign:'wedding-season',content:'reel',referrerHost:'instagram.com',landingPath:'/coconut-events-hospitality.html',capturedAtClient:'2026-09-18T10:00:00.000Z'};
  return {version:2,reportedSource:'social_media',reportedSourceLabel:'Social media',reportedDetail:'Instagram',firstTouch:{...touch},lastTouch:{...touch},sessionId:'123e4567-e89b-12d3-a456-426614174000',sessionStartedAtClient:'2026-09-18T10:00:00.000Z',capturedAtClient:'2026-09-18T10:02:00.000Z'};
}
function orderBase(orderId,token,extra={}){
  return {
    orderId,customerName:'Cutover QA',phone:'919876543210',email:'cutover@example.com',city:'Jabalpur',
    address:'893 Aman Nagar, New Ranjhi, Jabalpur 482011',notes:'',productKey:'tender',productName:'Fresh Tender Coconut',
    quantity:2,unitPrice:55,total:110,paymentType:'cod',paymentLabel:'Cash on Delivery (COD)',status:'pending',
    createdAt:serverTimestamp(),updatedAt:serverTimestamp(),source:'website',country:'India',state:'Madhya Pradesh',pin:'482011',landmark:'',
    deliveryLat:23.198712,deliveryLng:80.019245,deliveryAccuracy:18,deliveryMethod:'review',deliveryLabel:'Delivery Review',
    deliveryEtaMin:null,deliveryEtaMax:null,deliveryEta:'Confirmed on WhatsApp',isInternational:false,recurringPreference:'onetime',
    trackingToken:token,deliveryOTP:'123456',qtyBand:'retail',...extra
  };
}
function legacyOrder(orderId,token,extra={}){
  return orderBase(orderId,token,extra);
}
function modernOrder(orderId,token,extra={}){
  return orderBase(orderId,token,{deliveryAddress:'893 Aman Nagar, New Ranjhi, Jabalpur 482011',deliveryLocationSource:'gps',deliveryCoordinatesConfirmed:true,acquisition:acquisition(),...extra});
}
function tracking(orderId,token,extra={}){
  return {trackingToken:token,orderId,status:'pending',productName:'Fresh Tender Coconut',quantity:2,deliveryMethod:'Delivery Review',
    deliveryEstimate:'Confirmed on WhatsApp',estimatedTotal:'₹110 + delivery (confirmed later)',destinationDisplay:'Jabalpur, Madhya Pradesh, India',
    eta:'Confirmed on WhatsApp',updatedAt:serverTimestamp(),...extra};
}
function customerProjection(uid,orderId,token){
  return {customerUid:uid,orderId,productKey:'tender',productName:'Fresh Tender Coconut',quantity:2,unitPrice:55,total:110,status:'pending',
    paymentLabel:'Cash on Delivery (COD)',deliveryMethod:'Delivery Review',deliveryEstimate:'Confirmed on WhatsApp',
    estimatedTotal:'₹110 + delivery (confirmed later)',destinationDisplay:'Jabalpur, Madhya Pradesh, India',trackingToken:token,
    source:'account_checkout',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
}

const strict=fs.readFileSync('firestore.rules','utf8'),cutover=fs.readFileSync('firestore.cutover.rules','utf8');
must(cutover.includes('GENERATED CUTOVER RULESET'),'Cutover rules banner missing');
must(cutover.includes("!d.keys().hasAny(['deliveryAddress'])"),'Legacy deliveryAddress compatibility missing');
must(cutover.includes("!d.keys().hasAny(['deliveryLocationSource'])"),'Legacy location-source compatibility missing');
must(cutover.includes("!d.keys().hasAny(['deliveryCoordinatesConfirmed'])"),'Legacy coordinate-confirmation compatibility missing');
must(!cutover.includes("'customerUpdate','deliveryOTP','updatedAt'"),'Cutover rules widened the public tracking schema unnecessarily');
must(!strict.includes("'customerUpdate','deliveryOTP','updatedAt'"),'Strict final rules accidentally expose private delivery OTP in tracking');

const env=await initializeTestEnvironment({projectId:PROJECT,firestore:{rules:cutover}});
async function seed(path,data){await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),path),data));}
try{
  await env.clearFirestore();
  await seed('products/tender',{name:'Fresh Tender Coconut',price:55,minQty:1,stock:150,active:true,updatedAt:new Date()});
  const guest=env.unauthenticatedContext().firestore();

  // Existing September storefront: legacy private shape, then already-sanitized tracking in a second write.
  await assertSucceeds(setDoc(doc(guest,'orders',OLD_ORDER),legacyOrder(OLD_ORDER,TOKEN_OLD)));
  await assertSucceeds(setDoc(doc(guest,'publicTracking',TOKEN_OLD),tracking(OLD_ORDER,TOKEN_OLD)));

  // Even during cutover, private delivery OTP must never be accepted by public tracking.
  await assertFails(setDoc(doc(guest,'publicTracking','4'.repeat(48)),tracking('NS-CUTOVER-OTP01','4'.repeat(48),{deliveryOTP:'123456'})));

  // New storefront: strict private shape + sanitized tracking projection atomically.
  const modern=writeBatch(guest);
  modern.set(doc(guest,'orders',NEW_ORDER),modernOrder(NEW_ORDER,TOKEN_NEW));
  modern.set(doc(guest,'publicTracking',TOKEN_NEW),tracking(NEW_ORDER,TOKEN_NEW));
  await assertSucceeds(modern.commit());

  // Signed-in legacy checkout remains usable during the short cutover window.
  const uid='cutover-customer',customer=env.authenticatedContext(uid,{email:'cutover@example.com',email_verified:true}).firestore();
  await assertSucceeds(setDoc(doc(customer,'orders',USER_ORDER),legacyOrder(USER_ORDER,TOKEN_USER,{customerUid:uid})));
  await assertSucceeds(setDoc(doc(customer,'publicTracking',TOKEN_USER),tracking(USER_ORDER,TOKEN_USER)));
  await assertSucceeds(setDoc(doc(customer,'customerOrders',uid,'orders',USER_ORDER),customerProjection(uid,USER_ORDER,TOKEN_USER)));

  // Compatibility must not relax unrelated private-order schema validation.
  await assertFails(setDoc(doc(guest,'orders','NS-CUTOVER-BAD01'),legacyOrder('NS-CUTOVER-BAD01','5'.repeat(48),{unexpectedPrivateField:'blocked'})));
  await assertFails(setDoc(doc(guest,'orders','NS-CUTOVER-BAD02'),modernOrder('NS-CUTOVER-BAD02','6'.repeat(48),{acquisition:{...acquisition(),firstTouch:{...acquisition().firstTouch,referrerHost:'https://instagram.com/private'}}})));
  console.log('FIRESTORE ZERO-DOWNTIME CUTOVER QA: PASS');
} finally {
  await env.cleanup();
}
