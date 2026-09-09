/* Nariyal Sutra — Firebase web app configuration
   Firebase web config values are public identifiers. Security is enforced by Firebase Authentication + Firestore Security Rules.
*/
window.NS_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA-AcYHVwzqhkHgIwDxZfRNhWQ3jVRtoT0",
  authDomain: "nariyal-sutra.firebaseapp.com",
  projectId: "nariyal-sutra",
  storageBucket: "nariyal-sutra.firebasestorage.app",
  messagingSenderId: "1017952628747",
  appId: "1:1017952628747:web:9b2ceba1640e9ce236570e",
  measurementId: "G-MXWV5S3CWY"
};

window.NS_ADMIN_CONFIG = {
  ownerUid: "9FjkrCMDstfVS1Ghu2LlA0skoAf2",
  ownerEmail: "nariyalsutra@gmail.com",
  recaptchaEnterpriseSiteKey: "" // Add the Firebase App Check reCAPTCHA Enterprise site key here before enabling App Check enforcement.
};


/* Safe storefront defaults. The owner dashboard can write live overrides to Firestore /products. */
window.NS_DEFAULT_PRODUCTS = {
  tender: {name:"Fresh Tender Coconut — Sharp-Cut",shortName:"Fresh Tender Coconut",price:55,minQty:1,stock:150,active:true,mode:"single",description:"Sharp-cut and drink-ready, with natural variation in size and water volume. Freshness-first sourcing and handling."},
  green: {name:"Green Round Coconut — Premium",shortName:"Green Round Coconut",price:55,minQty:1,stock:100,active:true,mode:"single",description:"Full round premium young coconut for gifting, events and premium serves, with natural variation in size and water volume."},
  bulk: {name:"Bulk Pack 10+ pcs",shortName:"Bulk Pack",price:45,minQty:10,stock:300,active:true,mode:"bulk",description:"Bulk pricing for events, cafes, offices and resellers. Minimum quantity and available varieties follow current stock."}
};


window.NS_CUSTOMER_AUTH_PROVIDERS = {
  google: false,
  apple: false,
  phone: false
};

window.NS_BACKEND_FEATURES = {
  firestoreCatalog: true,
  statusEmails: true,
  emailProvider: "netlify-function-with-emailjs-browser-fallback",
  customerAccounts: true,
  customerOrderProjection: true,
  guestOrderClaim: true,
  customerAuthProviders: ["password","google","apple","phone"]
};
