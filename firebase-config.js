/* Nariyal Sutra — Firebase web app configuration
   Firebase web config values and the reCAPTCHA Enterprise site key are public identifiers.
   Security is enforced by Firebase Authentication, App Check enforcement and Firestore/Storage Security Rules.
*/
(function(){
  'use strict';
  var LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
  var PROD_CONFIG={
    apiKey:"AIzaSyA-AcYHVwzqhkHgIwDxZfRNhWQ3jVRtoT0",
    authDomain:"nariyal-sutra.firebaseapp.com",
    projectId:"nariyal-sutra",
    storageBucket:"nariyal-sutra.firebasestorage.app",
    messagingSenderId:"1017952628747",
    appId:"1:1017952628747:web:9b2ceba1640e9ce236570e",
    measurementId:"G-MXWV5S3CWY"
  };
  var APP_CHECK_SITE_KEY=String(
    window.NS_APP_CHECK_SITE_KEY
    || document.querySelector('meta[name="ns-app-check-site-key"]')?.getAttribute('content')
    || ''
  ).trim();

  /* Local preview is intentionally fail-closed. It must never initialize the
     production Firebase project. Local Admin/storefront QA uses local state;
     Firestore rules are tested separately against the emulator in CI. */
  window.NS_FIREBASE_ENV=LOCAL?'local-preview':'production';
  window.NS_FIREBASE_CONFIG=LOCAL?null:PROD_CONFIG;
  window.NS_FIREBASE_LOCAL_DISABLED=LOCAL;
  window.NS_FIREBASE_DISABLED_REASON=LOCAL?'Local preview never connects to production Firebase.':'';

  window.NS_ADMIN_CONFIG={
    ownerUid:"9FjkrCMDstfVS1Ghu2LlA0skoAf2",
    ownerEmail:"nariyalsutra@gmail.com",
    recaptchaEnterpriseSiteKey:APP_CHECK_SITE_KEY
  };

  /* Shared App Check initializer. Every production surface (storefront, account
     and Admin) can use the same idempotent readiness contract. Enforcement is
     intentionally a separate Firebase Console activation step after live smoke. */
  window.NS_APP_CHECK_READY=false;
  window.NS_APP_CHECK_STATUS=LOCAL?'local-disabled':(APP_CHECK_SITE_KEY?'configured-not-initialized':'awaiting-site-key');
  var appCheckPromise=null;
  window.NS_INIT_APP_CHECK=function(app){
    if(LOCAL){window.NS_APP_CHECK_STATUS='local-disabled';return Promise.resolve(null);}
    if(!APP_CHECK_SITE_KEY){window.NS_APP_CHECK_STATUS='awaiting-site-key';return Promise.resolve(null);}
    if(appCheckPromise)return appCheckPromise;
    appCheckPromise=(async function(){
      try{
        var mod=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js');
        var instance=mod.initializeAppCheck(app,{provider:new mod.ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),isTokenAutoRefreshEnabled:true});
        window.NS_APP_CHECK_INSTANCE=instance;
        window.NS_APP_CHECK_READY=true;
        window.NS_APP_CHECK_STATUS='initialized';
        window.dispatchEvent(new CustomEvent('ns:app-check-ready'));
        return instance;
      }catch(e){
        /* A second surface may race with the storefront's legacy initializer.
           Treat an already-initialized app as ready; all other errors fail closed
           in readiness reporting and are visible to QA/console. */
        if(/already|initialized/i.test(String(e&&e.message||e))){
          window.NS_APP_CHECK_READY=true;
          window.NS_APP_CHECK_STATUS='initialized';
          return window.NS_APP_CHECK_INSTANCE||null;
        }
        window.NS_APP_CHECK_STATUS='error';
        window.NS_APP_CHECK_ERROR=String(e&&e.message||e);
        console.error('[Nariyal Sutra App Check]',e);
        throw e;
      }
    })();
    return appCheckPromise;
  };

  /* Admin does not run the homepage Firebase bootstrap, so when a site key is
     configured this watcher attaches App Check to whichever Firebase app is
     initialized first without ever creating a production app on localhost. */
  if(!LOCAL&&APP_CHECK_SITE_KEY){
    (async function attachWhenReady(){
      try{
        var appMod=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js');
        for(var i=0;i<80;i++){
          var apps=appMod.getApps();
          if(apps.length){await window.NS_INIT_APP_CHECK(apps[0]);return;}
          await new Promise(function(r){setTimeout(r,250);});
        }
        window.NS_APP_CHECK_STATUS='firebase-app-not-ready';
      }catch(e){
        window.NS_APP_CHECK_STATUS='error';
        window.NS_APP_CHECK_ERROR=String(e&&e.message||e);
      }
    })();
  }

  /* Safe storefront defaults. The owner dashboard can write live overrides to Firestore /products. */
  window.NS_DEFAULT_PRODUCTS={
    tender:{name:"Fresh Tender Coconut — Sharp-Cut",shortName:"Fresh Tender Coconut",price:55,minQty:1,stock:150,active:true,mode:"single",description:"Sharp-cut and drink-ready, with natural variation in size and water volume. Freshness-first sourcing and handling."},
    green:{name:"Green Round Coconut — Premium",shortName:"Green Round Coconut",price:55,minQty:1,stock:100,active:true,mode:"single",description:"Full round premium young coconut for gifting, events and premium serves, with natural variation in size and water volume."},
    bulk:{name:"Bulk Pack 10+ pcs",shortName:"Bulk Pack",price:45,minQty:10,stock:300,active:true,mode:"bulk",description:"Bulk pricing for events, cafes, offices and resellers. Minimum quantity and available varieties follow current stock."}
  };

  /* Firebase Console currently has Google available, but the approved website
     exposes password auth only until Google receives its own acceptance pass. */
  window.NS_CUSTOMER_AUTH_PROVIDERS={google:false,apple:false,phone:false};

  window.NS_BACKEND_FEATURES={
    firestoreCatalog:true,
    statusEmails:true,
    emailProvider:"netlify-function-emailjs",
    customerAccounts:true,
    customerOrderProjection:true,
    guestOrderClaim:true,
    customerAuthProviders:["password"],
    appCheckConfigured:!!APP_CHECK_SITE_KEY,
    appCheckStatus:window.NS_APP_CHECK_STATUS,
    localProductionFirebaseDisabled:LOCAL
  };
})();
