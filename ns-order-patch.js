/**
 * ns-order-patch.js — Nariyal Sutra V42.1 production checkout contract
 *
 * Guarantees:
 * 1. One private /orders document remains the source of truth.
 * 2. /orders + /publicTracking + signed-in /customerOrders projection are committed atomically.
 * 3. Public/customer projections contain only explicitly sanitized fields.
 * 4. Guest checkout remains supported; customerUid is attached only to the authenticated user.
 * 5. Local preview never initializes or writes production Firebase.
 */
(function(){
  'use strict';

  var SDK='12.18.0';

  function hasNumber(v){
    return v!==null&&v!==undefined&&v!==''&&typeof v!=='boolean'&&Number.isFinite(Number(v));
  }
  function clean(v,max){
    return String(v==null?'':v).trim().slice(0,max||500);
  }
  function safeAttribution(){
    var raw=null;
    try{raw=window.NSAttribution?.read?.()||window.NS_ATTRIBUTION_CONTEXT||null;}catch(_e){}
    if(!raw||Number(raw.version)!==2||!raw.firstTouch||!raw.lastTouch)return null;
    var allowed=['direct','organic_search','paid_campaign','social','whatsapp','email','referral','other_unknown'];
    function campaign(v,max){
      var value=clean(v,max).replace(/[^A-Za-z0-9._ -]/g,'').replace(/\s+/g,' ').trim();
      if(/@|\b(?:password|passwd|pwd|token|otp)\b/i.test(value)||/\d{7,}/.test(value))return '';
      return value;
    }
    function touch(value){
      value=value||{};
      var classification=clean(value.classification,40);
      if(!allowed.includes(classification))classification='other_unknown';
      return {
        classification:classification,
        source:campaign(value.source,120),
        medium:campaign(value.medium,120),
        campaign:campaign(value.campaign,160),
        content:campaign(value.content,160),
        referrerHost:clean(value.referrerHost,253).toLowerCase().replace(/[^a-z0-9.-]/g,''),
        landingPath:('/'+clean(value.landingPath,300).replace(/^\/+/, '').split(/[?#]/)[0]).slice(0,300),
        capturedAtClient:clean(value.capturedAtClient,40)
      };
    }
    var reported=clean(raw.reportedSource,80);
    var reportedAllowed=['','google_search','ai_assistant','word_of_mouth','social_media','whatsapp_telegram','returning_customer','business_event_referral','other','prefer_not_to_say'];
    if(!reportedAllowed.includes(reported))reported='';
    return {
      version:2,
      reportedSource:reported,
      reportedSourceLabel:clean(raw.reportedSourceLabel,120),
      reportedDetail:clean(raw.reportedDetail,180),
      firstTouch:touch(raw.firstTouch),
      lastTouch:touch(raw.lastTouch),
      sessionId:clean(raw.sessionId,64).replace(/[^A-Za-z0-9-]/g,''),
      sessionStartedAtClient:clean(raw.sessionStartedAtClient,40),
      capturedAtClient:clean(raw.capturedAtClient,40)
    };
  }
  function money(v){
    return '₹'+Number(v||0).toLocaleString('en-IN');
  }

  function patchWhenReady(attempts){
    attempts=attempts||0;
    if(window.NS_FIREBASE_LOCAL_DISABLED===true)return;
    if(typeof window.NS_SAVE_ORDER!=='function'){
      if(attempts>40){ console.warn('[ns-order-patch] NS_SAVE_ORDER not found after waiting'); return; }
      return setTimeout(function(){ patchWhenReady(attempts+1); },250);
    }

    window.NS_SAVE_ORDER=async function(order){
      if(window.NS_FIREBASE_LOCAL_DISABLED===true)throw new Error('Production Firebase is disabled in local preview.');

      var state=window.NSDeliveryState||{};
      var extra=Object.assign({},window.NS_DELIVERY_EXTRA||{});
      var addressEl=document.getElementById('oA');
      var finalAddress=addressEl?String(addressEl.value||'').trim():String(state.deliveryAddress||state.address2||'').trim();

      /* Preserve one final checkout-location snapshot in the private order. */
      if(finalAddress)extra.deliveryAddress=finalAddress;
      if(hasNumber(state.lat))extra.deliveryLat=Number(state.lat);
      if(hasNumber(state.lng))extra.deliveryLng=Number(state.lng);
      extra.deliveryAccuracy=hasNumber(state.accuracy)?Number(state.accuracy):null;
      extra.deliveryLocationSource=clean(state.locationSource||extra.deliveryLocationSource||'manual',32);
      extra.deliveryCoordinatesConfirmed=hasNumber(extra.deliveryLat)&&hasNumber(extra.deliveryLng);

      var merged=Object.assign({},order,extra);
      var acquisition=safeAttribution();
      if(acquisition)merged.acquisition=acquisition;
      else delete merged.acquisition;
      var token=clean(extra.trackingToken,48);
      if(!/^[0-9a-f]{48}$/i.test(token))throw new Error('Checkout tracking token is missing or invalid.');

      var [appMod,authMod,fsMod]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-firestore.js')
      ]);
      var app=appMod.getApp();
      var db=fsMod.getFirestore(app);
      var auth=authMod.getAuth(app);
      var authUser=auth.currentUser;
      var customerContext=window.NS_CUSTOMER_CONTEXT||{};
      if(customerContext.ready===true&&customerContext.uid&&authUser&&String(customerContext.uid)===String(authUser.uid)){
        merged.customerUid=String(authUser.uid);
      }else{
        delete merged.customerUid;
      }

      var now=fsMod.serverTimestamp();
      var privateDoc=Object.assign({},merged,{createdAt:now,updatedAt:now,source:'website'});
      var dest=[merged.city,merged.state,merged.country].filter(Boolean).join(', ');
      var subtotal=Number(merged.total||((merged.quantity||1)*(merged.unitPrice||55))||0);
      var delivMin=extra.deliveryEtaMin;
      var delivMax=extra.deliveryEtaMax;
      var estimatedTotal=delivMin!=null&&delivMax!=null
        ? '₹'+(subtotal+Number(delivMin)).toLocaleString('en-IN')+' – ₹'+(subtotal+Number(delivMax)).toLocaleString('en-IN')+' (estimate)'
        : money(subtotal)+' + delivery (confirmed later)';

      /* Public tracking deliberately excludes email, phone, full address and Admin metadata. */
      var publicDoc={
        trackingToken:token,
        orderId:clean(merged.orderId,40),
        status:'pending',
        productName:clean(merged.productName,120),
        quantity:Number(merged.quantity||1),
        deliveryMethod:clean(extra.deliveryLabel||extra.deliveryMethod||'Pending confirmation',120),
        deliveryEstimate:clean(extra.deliveryEta||'Confirmed on WhatsApp',160),
        estimatedTotal:clean(estimatedTotal,160),
        destinationDisplay:clean(dest||'India',220),
        eta:clean(extra.deliveryEta||'',160),
        updatedAt:now
      };

      var batch=fsMod.writeBatch(db);
      batch.set(fsMod.doc(db,'orders',String(merged.orderId)),privateDoc);
      batch.set(fsMod.doc(db,'publicTracking',token),publicDoc);

      if(merged.customerUid){
        var customerDoc={
          customerUid:merged.customerUid,
          orderId:clean(merged.orderId,40),
          productKey:clean(merged.productKey,20),
          productName:clean(merged.productName,120),
          quantity:Number(merged.quantity||0),
          unitPrice:Number(merged.unitPrice||0),
          total:Number(merged.total||0),
          status:'pending',
          paymentLabel:clean(merged.paymentLabel||merged.paymentType,80),
          deliveryMethod:clean(extra.deliveryLabel||extra.deliveryMethod||'Pending confirmation',120),
          deliveryEstimate:clean(extra.deliveryEta||'Confirmed on WhatsApp',160),
          estimatedTotal:clean(estimatedTotal,160),
          destinationDisplay:clean(dest||'India',220),
          trackingToken:token,
          source:'account_checkout',
          createdAt:now,
          updatedAt:now
        };
        batch.set(fsMod.doc(db,'customerOrders',merged.customerUid,'orders',String(merged.orderId)),customerDoc);
      }

      /* All checkout projections succeed together or none of them are accepted. */
      await batch.commit();

      try{
        sessionStorage.setItem('ns_tracking_token',token);
        sessionStorage.setItem('ns_tracking_data',JSON.stringify(Object.assign({},publicDoc,{updatedAt:new Date().toISOString()})));
      }catch(_storageError){}

      window.NS_ORDER_PROJECTION_MODE='atomic-batch';
      window.dispatchEvent(new CustomEvent('ns:order-projections-committed',{detail:{orderId:String(merged.orderId),trackingToken:token,customerUid:merged.customerUid||''}}));
      return merged.orderId;
    };

    console.log('[ns-order-patch] Atomic checkout projection contract active.');
  }

  patchWhenReady();
})();
