/* Nariyal Sutra — Firebase web app configuration
   Firebase web config values are public identifiers. Security is enforced by Firebase Authentication + Firestore Security Rules.
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
    recaptchaEnterpriseSiteKey:"" // Configure Firebase App Check reCAPTCHA Enterprise before enabling enforcement.
  };

  /* Safe storefront defaults. The owner dashboard can write live overrides to Firestore /products. */
  window.NS_DEFAULT_PRODUCTS={
    tender:{name:"Fresh Tender Coconut — Sharp-Cut",shortName:"Fresh Tender Coconut",price:55,minQty:1,stock:150,active:true,mode:"single",description:"Sharp-cut and drink-ready, with natural variation in size and water volume. Freshness-first sourcing and handling."},
    green:{name:"Green Round Coconut — Premium",shortName:"Green Round Coconut",price:55,minQty:1,stock:100,active:true,mode:"single",description:"Full round premium young coconut for gifting, events and premium serves, with natural variation in size and water volume."},
    bulk:{name:"Bulk Pack 10+ pcs",shortName:"Bulk Pack",price:45,minQty:10,stock:300,active:true,mode:"bulk",description:"Bulk pricing for events, cafes, offices and resellers. Minimum quantity and available varieties follow current stock."}
  };

  /* Keep the UI aligned with the providers intentionally exposed today.
     Google is enabled in Firebase Console but remains hidden until it is accepted
     as part of the production customer-auth rollout. */
  window.NS_CUSTOMER_AUTH_PROVIDERS={google:false,apple:false,phone:false};

  window.NS_BACKEND_FEATURES={
    firestoreCatalog:true,
    statusEmails:true,
    emailProvider:"netlify-function-with-emailjs-browser-fallback",
    customerAccounts:true,
    customerOrderProjection:true,
    guestOrderClaim:true,
    customerAuthProviders:["password"],
    appCheckConfigured:!!window.NS_ADMIN_CONFIG.recaptchaEnterpriseSiteKey,
    localProductionFirebaseDisabled:LOCAL
  };
})();
