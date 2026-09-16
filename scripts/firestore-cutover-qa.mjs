import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,writeBatch,serverTimestamp} from 'firebase/firestore';

const PROJECT='nariyal-sutra';
const TOKEN_OLD='1'.repeat(48),TOKEN_NEW='2'.repeat(48),TOKEN_USER='3'.repeat(48);
const OLD_ORDER='NS-CUTOVER-OLD01',NEW_ORDER='NS-CUTOVER-NEW01',USER_ORDER='NS-CUTOVER-USER1';
const must=(c,m)=>{if(!c)throw new Error(m)};
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
  return orderBase(orderId,token,{deliveryAddress:'893 Aman Nagar, New Ranjhi, Jabalpur 482011',deliveryLocationSource:'gps',deliveryCoordinatesConfirmed:true,...extra});
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
must(cutover.includes("'customerUpdate','deliveryOTP','updatedAt'"),'Legacy tracking compatibility missing from cutover rules');
must(!strict.includes("'customerUpdate','deliveryOTP','updatedAt'"),'Strict final rules accidentally retained legacy public OTP compatibility');

const env=await initializeTestEnvironment({projectId:PROJECT,firestore:{rules:cutover}});
async function seed(path,data){await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),path),data));}
try{
  await env.clearFirestore();
  await seed('products/tender',{name:'Fresh Tender Coconut',price:55,minQty:1,stock:150,active:true,updatedAt:new Date()});
  const guest=env.unauthenticatedContext().firestore();

  // Existing September storefront: legacy private shape, then tracking projection in a second write.
  await assertSucceeds(setDoc(doc(guest,'orders',OLD_ORDER),legacyOrder(OLD_ORDER,TOKEN_OLD)));
  await assertSucceeds(setDoc(doc(guest,'publicTracking',TOKEN_OLD),tracking(OLD_ORDER,TOKEN_OLD,{deliveryOTP:'123456'})));

  // New storefront: strict private shape + sanitized tracking projection atomically.
  const modern=writeBatch(guest);
  modern.set(doc(guest,'orders',NEW_ORDER),modernOrder(NEW_ORDER,TOKEN_NEW));
  modern.set(doc(guest,'publicTracking',TOKEN_NEW),tracking(NEW_ORDER,TOKEN_NEW));
  await assertSucceeds(modern.commit());

  // Signed-in legacy checkout must remain usable during the short cutover window.
  const uid='cutover-customer',customer=env.authenticatedContext(uid,{email:'cutover@example.com',email_verified:true}).firestore();
  await assertSucceeds(setDoc(doc(customer,'orders',USER_ORDER),legacyOrder(USER_ORDER,TOKEN_USER,{customerUid:uid})));
  await assertSucceeds(setDoc(doc(customer,'publicTracking',TOKEN_USER),tracking(USER_ORDER,TOKEN_USER,{deliveryOTP:'654321'})));
  await assertSucceeds(setDoc(doc(customer,'customerOrders',uid,'orders',USER_ORDER),customerProjection(uid,USER_ORDER,TOKEN_USER)));

  // Cutover compatibility must not relax unrelated private-order schema validation.
  await assertFails(setDoc(doc(guest,'orders','NS-CUTOVER-BAD01'),legacyOrder('NS-CUTOVER-BAD01','4'.repeat(48),{unexpectedPrivateField:'blocked'})));
  console.log('FIRESTORE ZERO-DOWNTIME CUTOVER QA: PASS');
} finally {
  await env.cleanup();
}
