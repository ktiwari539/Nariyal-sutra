import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

const PROJECT='nariyal-sutra';
const OWNER_UID='9FjkrCMDstfVS1Ghu2LlA0skoAf2';
const OWNER_EMAIL='nariyalsutra@gmail.com';
const TOKEN='a'.repeat(48);
const TOKEN2='b'.repeat(48);
const TOKEN3='c'.repeat(48);
const ORDER='NS-2026-RULES01';
const ORDER2='NS-2026-RULES02';
const ORDER3='NS-2026-RULES03';
const must=(c,m)=>{if(!c)throw new Error(m)};

function acquisition(extra={}){
  const touch={
    classification:'organic_search',source:'google',medium:'organic',campaign:'wedding-season-2026',content:'homepage-hero',
    referrerHost:'google.com',landingPath:'/fresh-tender-coconut.html',capturedAtClient:'2026-09-18T10:00:00.000Z'
  };
  return {
    version:2,reportedSource:'google_search',reportedSourceLabel:'Google Search',reportedDetail:'',
    firstTouch:{...touch},lastTouch:{...touch},sessionId:'123e4567-e89b-12d3-a456-426614174000',
    sessionStartedAtClient:'2026-09-18T10:00:00.000Z',capturedAtClient:'2026-09-18T10:02:00.000Z',...extra
  };
}

function baseOrder(orderId=ORDER,token=TOKEN,extra={}){
  return {
    orderId,
    customerName:'QA Customer',
    phone:'919876543210',
    email:'qa.customer@example.com',
    city:'Jabalpur',
    address:'893 Aman Nagar, New Ranjhi, Jabalpur 482011',
    deliveryAddress:'893 Aman Nagar, New Ranjhi, Jabalpur 482011',
    notes:'',
    productKey:'tender',
    productName:'Fresh Tender Coconut',
    quantity:2,
    unitPrice:55,
    total:110,
    paymentType:'cod',
    paymentLabel:'Cash on Delivery (COD)',
    status:'pending',
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp(),
    source:'website',
    country:'India',
    state:'Madhya Pradesh',
    pin:'482011',
    landmark:'',
    deliveryLat:23.198712,
    deliveryLng:80.019245,
    deliveryAccuracy:18,
    deliveryLocationSource:'gps',
    deliveryCoordinatesConfirmed:true,
    deliveryMethod:'review',
    deliveryLabel:'Delivery Review',
    deliveryEtaMin:null,
    deliveryEtaMax:null,
    deliveryEta:'Confirmed on WhatsApp',
    isInternational:false,
    recurringPreference:'onetime',
    trackingToken:token,
    deliveryOTP:'123456',
    qtyBand:'retail',
    acquisition:acquisition(),
    ...extra
  };
}

function tracking(orderId=ORDER,token=TOKEN,extra={}){
  return {
    trackingToken:token,
    orderId,
    status:'pending',
    productName:'Fresh Tender Coconut',
    quantity:2,
    deliveryMethod:'Delivery Review',
    deliveryEstimate:'Confirmed on WhatsApp',
    estimatedTotal:'₹110 + delivery (confirmed later)',
    destinationDisplay:'Jabalpur, Madhya Pradesh, India',
    eta:'Confirmed on WhatsApp',
    updatedAt:serverTimestamp(),
    ...extra
  };
}

function customerProjection(uid,orderId=ORDER3,token=TOKEN3,extra={}){
  return {
    customerUid:uid,
    orderId,
    productKey:'tender',
    productName:'Fresh Tender Coconut',
    quantity:2,
    unitPrice:55,
    total:110,
    status:'pending',
    paymentLabel:'Cash on Delivery (COD)',
    deliveryMethod:'Delivery Review',
    deliveryEstimate:'Confirmed on WhatsApp',
    estimatedTotal:'₹110 + delivery (confirmed later)',
    destinationDisplay:'Jabalpur, Madhya Pradesh, India',
    trackingToken:token,
    source:'account_checkout',
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp(),
    ...extra
  };
}

const env=await initializeTestEnvironment({
  projectId:PROJECT,
  firestore:{rules:fs.readFileSync('firestore.rules','utf8')}
});

async function seed(path,data){
  await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),path),data));
}
async function role(uid,email,roleName='Operations',active=true){
  await seed(`adminRoles/${uid}`,{
    uid,email,role:roleName,status:active?'Active':'Inactive',active,
    inviteStatus:active?'Active':'Revoked'
  });
}
async function seedCatalog(){
  await seed('products/tender',{name:'Fresh Tender Coconut',price:55,minQty:1,stock:150,active:true,updatedAt:new Date()});
  await seed('products/green',{name:'Green Round Coconut',price:55,minQty:1,stock:100,active:true,updatedAt:new Date()});
  await seed('products/bulk',{name:'Bulk Pack 10+ pcs',price:45,minQty:10,stock:300,active:true,updatedAt:new Date()});
}
async function guestCheckout(db,orderId=ORDER,token=TOKEN,extraOrder={},extraTrack={}){
  const b=writeBatch(db);
  b.set(doc(db,'orders',orderId),baseOrder(orderId,token,extraOrder));
  b.set(doc(db,'publicTracking',token),tracking(orderId,token,extraTrack));
  return b.commit();
}
function followup(id,uid,email,extra={}){
  return {
    id,customerKey:'customer-qa-1',customerName:'QA Follow-up Customer',orderId:ORDER,reason:'Confirm recurring delivery requirements',
    assignee:'Support',assigneeUid:uid,priority:'high',dueAt:new Date('2026-09-24T11:30:00.000Z'),status:'open',
    createdAt:serverTimestamp(),createdBy:uid,createdByEmail:email,updatedAt:serverTimestamp(),updatedBy:uid,updatedByEmail:email,
    completedAt:null,completedBy:'',...extra
  };
}
function followupEvent(eventId,followupId,uid,email,roleName,action='created',extra={}){
  return {eventId,followupId,action,details:'Follow-up QA event.',actorUid:uid,actorEmail:email,actorRole:roleName,createdAt:serverTimestamp(),...extra};
}

try{
  await env.clearFirestore();
  await seedCatalog();

  const guest=env.unauthenticatedContext().firestore();
  await assertSucceeds(guestCheckout(guest));
  must((await getDoc(doc(guest,'publicTracking',TOKEN))).exists(),'Exact tracking token GET must remain public-readable');

  await assertFails(guestCheckout(guest,ORDER2,TOKEN2,{unexpectedPrivateField:'blocked'}));
  await assertFails(guestCheckout(guest,'NS-2026-RULES04','d'.repeat(48),{unitPrice:1,total:2}));
  await assertFails(guestCheckout(guest,'NS-2026-RULES05','e'.repeat(48),{}, {phone:'private-data-must-never-project'}));
  await assertFails(guestCheckout(guest,'NS-2026-RULES06','6'.repeat(48),{acquisition:acquisition({firstTouch:{...acquisition().firstTouch,referrerHost:'https://google.com/search?q=private'}})}));
  await assertFails(guestCheckout(guest,'NS-2026-RULES07','7'.repeat(48),{}, {acquisition:acquisition()}));

  const inquiry={
    inquiryId:'NSQ-2026-RULES01',role:'buyer',inquiryType:'bulk',inquiryTypeLabel:'Bulk 10+',productPreference:'tender',
    frequency:'one_time',packaging:'recommend',name:'QA Buyer',phone:'919876543210',email:'buyer@example.com',organization:'',
    quantity:50,requiredDate:'2026-10-01',destination:'Jabalpur, Madhya Pradesh, India',country:'India',state:'Madhya Pradesh',
    city:'Jabalpur',postalCode:'482011',preferredContact:'telegram',telegramUsername:'qa_buyer',message:'Please share availability.',
    status:'new',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),source:'website',acquisition:acquisition()
  };
  await assertSucceeds(setDoc(doc(guest,'inquiries',inquiry.inquiryId),inquiry));
  await assertFails(setDoc(doc(guest,'inquiries','NSQ-2026-RULES02'),{...inquiry,inquiryId:'NSQ-2026-RULES02',acquisition:acquisition({lastTouch:{...acquisition().lastTouch,landingPath:'/fresh.html?email=buyer@example.com'}})}));

  const orphanToken='f'.repeat(48);
  await assertFails(setDoc(doc(guest,'publicTracking',orphanToken),tracking('NS-2026-ORPHAN1',orphanToken)));

  const customerUid='customer-qa-1';
  const customer=env.authenticatedContext(customerUid,{email:'customer@example.com',email_verified:true}).firestore();
  const signedBatch=writeBatch(customer);
  signedBatch.set(doc(customer,'orders',ORDER3),baseOrder(ORDER3,TOKEN3,{customerUid}));
  signedBatch.set(doc(customer,'publicTracking',TOKEN3),tracking(ORDER3,TOKEN3));
  signedBatch.set(doc(customer,'customerOrders',customerUid,'orders',ORDER3),customerProjection(customerUid));
  await assertSucceeds(signedBatch.commit());

  const activeUid='ops-active';
  const activeEmail='ops.active@example.com';
  await role(activeUid,activeEmail,'Operations',true);
  const activeOps=env.authenticatedContext(activeUid,{email:activeEmail,email_verified:true}).firestore();
  await assertSucceeds(getDoc(doc(activeOps,'orders',ORDER)));

  const inactiveUid='ops-inactive';
  const inactiveEmail='ops.inactive@example.com';
  await role(inactiveUid,inactiveEmail,'Operations',false);
  const inactiveOps=env.authenticatedContext(inactiveUid,{email:inactiveEmail,email_verified:true}).firestore();
  await assertFails(getDoc(doc(inactiveOps,'orders',ORDER)));

  const unverifiedUid='ops-unverified';
  const unverifiedEmail='ops.unverified@example.com';
  await role(unverifiedUid,unverifiedEmail,'Operations',true);
  const unverifiedOps=env.authenticatedContext(unverifiedUid,{email:unverifiedEmail,email_verified:false}).firestore();
  await assertFails(getDoc(doc(unverifiedOps,'orders',ORDER)));

  const mismatchedUid='ops-email-mismatch';
  await role(mismatchedUid,'expected@example.com','Operations',true);
  const mismatched=env.authenticatedContext(mismatchedUid,{email:'other@example.com',email_verified:true}).firestore();
  await assertFails(getDoc(doc(mismatched,'orders',ORDER)));

  const supportUid='support-followups';
  const supportEmail='support.followups@example.com';
  await role(supportUid,supportEmail,'Support',true);
  const support=env.authenticatedContext(supportUid,{email:supportEmail,email_verified:true}).firestore();
  const followupId='FU-RULES-01',createEventId='FUE-RULES-01',createFollowup=writeBatch(support);
  createFollowup.set(doc(support,'followups',followupId),followup(followupId,supportUid,supportEmail));
  createFollowup.set(doc(support,'followupEvents',createEventId),followupEvent(createEventId,followupId,supportUid,supportEmail,'Support'));
  await assertSucceeds(createFollowup.commit());
  await assertSucceeds(getDoc(doc(support,'followups',followupId)));

  const salesUid='sales-followups';
  const salesEmail='sales.followups@example.com';
  await role(salesUid,salesEmail,'Sales',true);
  const sales=env.authenticatedContext(salesUid,{email:salesEmail,email_verified:true}).firestore();
  const completeEventId='FUE-RULES-02',completeFollowup=writeBatch(sales);
  completeFollowup.update(doc(sales,'followups',followupId),{status:'completed',completedAt:serverTimestamp(),completedBy:salesUid,updatedAt:serverTimestamp(),updatedBy:salesUid,updatedByEmail:salesEmail});
  completeFollowup.set(doc(sales,'followupEvents',completeEventId),followupEvent(completeEventId,followupId,salesUid,salesEmail,'Sales','status_changed'));
  await assertSucceeds(completeFollowup.commit());

  await assertSucceeds(getDoc(doc(activeOps,'followups',followupId)));
  await assertSucceeds(getDoc(doc(activeOps,'followupEvents',createEventId)));
  await assertFails(updateDoc(doc(activeOps,'followups',followupId),{reason:'Operations must remain read only',updatedAt:serverTimestamp(),updatedBy:activeUid,updatedByEmail:activeEmail}));
  await assertFails(setDoc(doc(support,'followupEvents','FUE-RULES-SPOOF'),followupEvent('FUE-RULES-SPOOF',followupId,'someone-else',supportEmail,'Owner','updated')));
  await assertFails(deleteDoc(doc(support,'followups',followupId)));

  const contentUid='content-active';
  const contentEmail='content@example.com';
  await role(contentUid,contentEmail,'Content',true);
  await seed('mediaAssets/MEDIA-QA',{logicalId:'MEDIA-QA',provider:'cloudinary'});
  const content=env.authenticatedContext(contentUid,{email:contentEmail,email_verified:true}).firestore();
  await assertFails(getDoc(doc(content,'followups',followupId)));
  await assertFails(getDoc(doc(content,'followupEvents',createEventId)));
  await assertSucceeds(getDoc(doc(content,'mediaAssets','MEDIA-QA')));
  await assertSucceeds(setDoc(doc(content,'mediaAssets','MEDIA-NEW'),{
    logicalId:'MEDIA-NEW',provider:'cloudinary',sourceSha256:'a'.repeat(64),updatedAt:serverTimestamp(),updatedBy:contentUid
  }));
  await assertFails(setDoc(doc(content,'mediaAssets','MEDIA-BAD'),{
    logicalId:'MEDIA-BAD',provider:'unapproved-provider',sourceSha256:'not-a-hash'
  }));
  await assertFails(setDoc(doc(content,'mediaAssets','MEDIA-EXTRA'),{
    logicalId:'MEDIA-EXTRA',provider:'firebase',sourceSha256:'b'.repeat(64),updatedAt:serverTimestamp(),updatedBy:contentUid,unreviewedField:true
  }));

  const adminUid='admin-active';
  const adminEmail='admin@example.com';
  await role(adminUid,adminEmail,'Admin',true);
  const admin=env.authenticatedContext(adminUid,{email:adminEmail,email_verified:true}).firestore();
  await assertSucceeds(setDoc(doc(admin,'adminAudit','audit-ok'),{
    action:'QA contract check',target:'firestore.rules',actorUid:adminUid,actorEmail:adminEmail,actorRole:'Admin',timestamp:serverTimestamp(),source:'rules_qa'
  }));
  await assertFails(setDoc(doc(admin,'adminAudit','audit-spoof'),{
    action:'Spoof attempt',target:'firestore.rules',actorUid:'someone-else',actorEmail:adminEmail,actorRole:'Owner',timestamp:serverTimestamp(),source:'rules_qa'
  }));

  await assertSucceeds(updateDoc(doc(activeOps,'products','tender'),{stock:149,updatedAt:serverTimestamp(),updatedBy:activeUid}));
  await assertFails(updateDoc(doc(activeOps,'products','green'),{stock:99,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(activeOps,'products','tender'),{price:50,updatedAt:serverTimestamp(),updatedBy:activeUid}));

  // Operational status changes must update private order + sanitized tracking together.
  const confirm=writeBatch(activeOps);
  confirm.update(doc(activeOps,'orders',ORDER),{status:'confirmed',updatedAt:serverTimestamp()});
  confirm.update(doc(activeOps,'publicTracking',TOKEN),{status:'confirmed',updatedAt:serverTimestamp()});
  await assertSucceeds(confirm.commit());

  const invalidJump=writeBatch(activeOps);
  invalidJump.update(doc(activeOps,'orders',ORDER),{status:'delivered',updatedAt:serverTimestamp()});
  invalidJump.update(doc(activeOps,'publicTracking',TOKEN),{status:'delivered',updatedAt:serverTimestamp()});
  await assertFails(invalidJump.commit());

  const owner=env.authenticatedContext(OWNER_UID,{email:OWNER_EMAIL,email_verified:true}).firestore();
  await assertSucceeds(getDoc(doc(owner,'orders',ORDER)));
  await assertSucceeds(setDoc(doc(owner,'adminAudit','owner-delete-audit-shape'),{
    eventType:'owner_order_hard_delete',actorUid:OWNER_UID,actorEmail:OWNER_EMAIL,actorRole:'Owner',timestamp:serverTimestamp(),
    orderIds:[ORDER],count:1,otpVerified:true,source:'admin_owner_email_otp',cleanup:[{orderId:ORDER,orderDeleted:true}]
  }));
  await assertFails(deleteDoc(doc(owner,'products','tender')));
  const ownerUnverified=env.authenticatedContext(OWNER_UID,{email:OWNER_EMAIL,email_verified:false}).firestore();
  await assertFails(getDoc(doc(ownerUnverified,'orders',ORDER)));

  console.log('FIRESTORE SECURITY CONTRACT QA: PASS');
} finally {
  await env.cleanup();
}
