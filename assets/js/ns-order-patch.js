/**
 * ns-order-patch.js — Nariyal Sutra V42.1
 * Wraps the existing window.NS_SAVE_ORDER to:
 * 1. Merge delivery/tracking fields from ns-delivery.js
 * 2. Attach customerUid only when a Firebase customer session is actually signed in
 * 3. Attach first-party customer acquisition attribution captured at checkout
 * 4. Keep the private /orders write as the source of truth
 * 5. Write the sanitized /publicTracking/{token} document
 * 6. Add a sanitized My Orders projection for signed-in customers (non-critical)
 * 7. Store the private tracking token in sessionStorage for the Order Hub
 *
 * Guest checkout remains unchanged: no customerUid is added when signed out.
 */
(function(){
  'use strict';

  function clean(v,max){return String(v||'').trim().replace(/\s+/g,' ').slice(0,max||180);}
  function safeAttribution(){
    var a=window.NS_ATTRIBUTION_CONTEXT||{};
    if(!a||typeof a!=='object')return null;
    var source=clean(a.source,80);
    if(!source)return null;
    return {
      source:source,
      label:clean(a.label,120),
      detail:clean(a.detail,180),
      landingPath:clean(a.landingPath,300),
      landingReferrer:clean(a.landingReferrer,500),
      utmSource:clean(a.utmSource,120),
      utmMedium:clean(a.utmMedium,120),
      utmCampaign:clean(a.utmCampaign,160),
      utmContent:clean(a.utmContent,160),
      capturedAtClient:clean(a.capturedAtClient,80),
      version:Number(a.version)||1
    };
  }

  function patchWhenReady(attempts){
    attempts=attempts||0;
    if(typeof window.NS_SAVE_ORDER!=='function'){
      if(attempts>40){ console.warn('[ns-order-patch] NS_SAVE_ORDER not found after waiting'); return; }
      return setTimeout(function(){ patchWhenReady(attempts+1); }, 250);
    }

    var orig=window.NS_SAVE_ORDER;
    window.NS_SAVE_ORDER=async function(order){
      var extra=window.NS_DELIVERY_EXTRA||{};
      var merged=Object.assign({},order,extra);

      var attribution=safeAttribution();
      if(attribution){
        merged.acquisitionSource=attribution.source;
        merged.acquisitionSourceLabel=attribution.label;
        merged.acquisitionDetail=attribution.detail;
        merged.acquisition=attribution;
      }

      /* Account is optional. Only bind the order when Firebase Auth has resolved a real user. */
      var customerContext=window.NS_CUSTOMER_CONTEXT||{};
      if(customerContext.ready===true && customerContext.uid){
        merged.customerUid=String(customerContext.uid);
      }

      /* Source of truth: existing private Firestore order write. */
      var result=await orig(merged);

      var token=extra.trackingToken;
      if(token && window.NS_FIREBASE_READY){
        try{
          var SDK='12.18.0';
          var [{getFirestore,doc,setDoc,serverTimestamp},{getApp}]=await Promise.all([
            import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-firestore.js'),
            import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-app.js')
          ]);
          var db=getFirestore(getApp());

          /* Public tracking is deliberately sanitized: no email, phone, full address,
             acquisition metadata or admin metadata. */
          var dest=[merged.city,merged.state,merged.country].filter(Boolean).join(', ');
          var subtotal=(merged.quantity||1)*(merged.unitPrice||55);
          var delivMin=extra.deliveryEtaMin;
          var delivMax=extra.deliveryEtaMax;
          var estimatedTotal=delivMin!=null
            ? '₹'+(subtotal+delivMin).toLocaleString('en-IN')+' – ₹'+(subtotal+delivMax).toLocaleString('en-IN')+' (estimate)'
            : '₹'+subtotal.toLocaleString('en-IN')+' + delivery (confirmed later)';

          var pubDoc={
            trackingToken:token,
            orderId:merged.orderId||'',
            status:merged.status||'pending',
            productName:merged.productName||'',
            quantity:merged.quantity||1,
            deliveryMethod:extra.deliveryLabel||extra.deliveryMethod||'Pending',
            deliveryEstimate:extra.deliveryEta||'TBD',
            estimatedTotal:estimatedTotal,
            destinationDisplay:dest||'India',
            eta:extra.deliveryEta||'',
            updatedAt:serverTimestamp()
          };

          await setDoc(doc(db,'publicTracking',token),pubDoc);
          console.log('[ns-order-patch] publicTracking written:',token);

          try{
            sessionStorage.setItem('ns_tracking_token',token);
            sessionStorage.setItem('ns_tracking_data',JSON.stringify(pubDoc));
          }catch(_storageError){}
        }catch(e){
          console.warn('[ns-order-patch] publicTracking write failed (non-critical):',e);
        }
      }

      /* My Account is another non-critical projection. A failure here must never fail checkout. */
      if(merged.customerUid && typeof window.NS_CUSTOMER_AFTER_ORDER_SAVED==='function'){
        try{ await window.NS_CUSTOMER_AFTER_ORDER_SAVED(merged); }
        catch(e){ console.warn('[ns-order-patch] customer order projection failed (non-critical):',e); }
      }

      return result;
    };

    console.log('[ns-order-patch] NS_SAVE_ORDER patched.');
  }

  patchWhenReady();
})();
