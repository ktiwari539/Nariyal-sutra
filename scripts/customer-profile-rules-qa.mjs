import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,updateDoc,getDoc,serverTimestamp,deleteField} from 'firebase/firestore';

if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Customer profile QA requires the local Firestore emulator');
const results=[];
function profile(uid,email,extra={}){
  return {uid,email,contactEmail:email,emailVerified:false,phoneVerified:false,displayName:'Disposable Profile QA',phone:'',photoURL:'',photoPath:'',preferredProduct:'tender',recurringPreference:'onetime',telegramUsername:'',preferredChannel:'email',notifyEmail:false,notifyWhatsapp:false,notifyTelegram:false,marketingEmailOptIn:false,marketingWhatsappOptIn:false,marketingTelegramOptIn:false,primaryCity:'',primaryState:'',primaryCountry:'',primaryPin:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),lastLoginAt:serverTimestamp(),...extra};
}
function legacyProfile(uid,email,extra={}){
  const data=profile(uid,email,extra);
  for(const key of ['marketingEmailOptIn','marketingWhatsappOptIn','marketingTelegramOptIn'])delete data[key];
  return data;
}
for(const mode of ['strict','cutover']){
  const env=await initializeTestEnvironment({projectId:'demo-nariyal-profile-rules',firestore:{rules:fs.readFileSync(mode==='strict'?'firestore.rules':'firestore.cutover.rules','utf8')}});
  const check=async(name,operation,allowed=true)=>{await (allowed?assertSucceeds:assertFails)(operation);results.push({mode,name,result:'PASS'});};
  try{
    await env.clearFirestore();
    const uid=`${mode}-email`,email=`${uid}@example.com`;
    const db=env.authenticatedContext(uid,{email,email_verified:false}).firestore(),ref=doc(db,'customers',uid);
    await check('Email token without phone claim creates profile',setDoc(ref,profile(uid,email)));
    await check('Email token without phone claim updates profile',updateDoc(ref,{displayName:'Updated QA',updatedAt:serverTimestamp()}));
    await check('Email verification cannot be spoofed',updateDoc(ref,{emailVerified:true,updatedAt:serverTimestamp()}),false);
    await check('Phone verification cannot be spoofed',updateDoc(ref,{phoneVerified:true,updatedAt:serverTimestamp()}),false);
    await check('Identity email cannot be changed',updateDoc(ref,{email:'different@example.com',updatedAt:serverTimestamp()}),false);
    await check('Another customer profile cannot be created',setDoc(doc(db,'customers','another-customer'),profile('another-customer',email)),false);
    await check('Consent change requires server timestamp',updateDoc(ref,{marketingEmailOptIn:true,updatedAt:serverTimestamp()}),false);
    await check('Consent change with server timestamp succeeds',updateDoc(ref,{marketingEmailOptIn:true,marketingConsentUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
    await check('Unrelated update preserves consent',updateDoc(ref,{displayName:'Consent retained',updatedAt:serverTimestamp()}));
    await check('Consent timestamp cannot change alone',updateDoc(ref,{marketingConsentUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()}),false);
    await check('Consent flags must be booleans',updateDoc(ref,{marketingWhatsappOptIn:'yes',marketingConsentUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()}),false);
    await check('Existing consent field cannot be deleted',updateDoc(ref,{marketingEmailOptIn:deleteField(),marketingConsentUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()}),false);
    const stored=(await getDoc(ref)).data();
    const overwrite={...stored,updatedAt:serverTimestamp(),marketingConsentUpdatedAt:serverTimestamp()};
    for(const key of ['marketingEmailOptIn','marketingWhatsappOptIn','marketingTelegramOptIn'])delete overwrite[key];
    await check('Legacy replacement cannot erase explicit consent',setDoc(ref,overwrite),false);

    const verifiedUid=`${mode}-verified`,verifiedEmail=`${verifiedUid}@example.com`;
    const verified=env.authenticatedContext(verifiedUid,{email:verifiedEmail,email_verified:true}).firestore();
    await check('Verified email without phone claim is accepted',setDoc(doc(verified,'customers',verifiedUid),profile(verifiedUid,verifiedEmail,{emailVerified:true})));
    const phoneUid=`${mode}-phone`,phone='+919876543210';
    const phoneDb=env.authenticatedContext(phoneUid,{phone_number:phone}).firestore(),phoneRef=doc(phoneDb,'customers',phoneUid);
    await check('Phone token without email claims creates profile',setDoc(phoneRef,profile(phoneUid,'',{phone,phoneVerified:true})));
    await check('Phone token without email claims updates profile',updateDoc(phoneRef,{displayName:'Phone QA updated',updatedAt:serverTimestamp()}));
    await check('Phone token cannot claim verified email',updateDoc(phoneRef,{emailVerified:true,updatedAt:serverTimestamp()}),false);
    const anonymousUid=`${mode}-no-identity`,anonymous=env.authenticatedContext(anonymousUid,{}).firestore();
    await check('Token without email or phone identity is rejected',setDoc(doc(anonymous,'customers',anonymousUid),profile(anonymousUid,'')),false);

    const oldUid=`${mode}-legacy`,oldEmail=`${oldUid}@example.com`;
    const oldDb=env.authenticatedContext(oldUid,{email:oldEmail,email_verified:false}).firestore(),oldRef=doc(oldDb,'customers',oldUid);
    await check('Legacy consent omission follows release phase',setDoc(oldRef,legacyProfile(oldUid,oldEmail)),mode==='cutover');
    if(mode==='cutover'){
      await check('Legacy profile remains editable during cutover',updateDoc(oldRef,{displayName:'Legacy profile updated',updatedAt:serverTimestamp()}));
      await check('Legacy profile gains explicit consent safely',updateDoc(oldRef,{marketingEmailOptIn:false,marketingWhatsappOptIn:false,marketingTelegramOptIn:false,marketingConsentUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
    }
  }finally{await env.cleanup();}
}
fs.mkdirSync('qa-artifacts/firebase',{recursive:true});
fs.writeFileSync('qa-artifacts/firebase/customer-profile-rules-results.json',JSON.stringify({localEmulatorOnly:true,externalMutations:0,assertions:results.length,results},null,2));
console.log(`CUSTOMER PROFILE RULES QA: PASS (${results.length} assertions; strict and cutover)`);
