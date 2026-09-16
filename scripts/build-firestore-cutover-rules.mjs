import fs from 'node:fs';

const SOURCE='firestore.rules';
const OUTPUT=process.argv[2]||'firestore.cutover.rules';
let rules=fs.readFileSync(SOURCE,'utf8');
const replaceOnce=(from,to,label)=>{
  const count=rules.split(from).length-1;
  if(count!==1)throw new Error(`Cutover rules transform ${label} expected exactly one match, found ${count}`);
  rules=rules.replace(from,to);
};

/*
  Cutover-only compatibility window.
  The live September storefront predates the final delivery snapshot fields and
  writes the tracking projection after the private order. The final storefront
  writes the strict shape atomically. During the short production cutover both
  clients must remain usable; immediately after the new release smoke passes,
  firestore.rules replaces this generated compatibility ruleset.
*/
replaceOnce(
  "        && d.deliveryAddress is string && d.deliveryAddress == d.address",
  "        && (!d.keys().hasAny(['deliveryAddress']) || (d.deliveryAddress is string && d.deliveryAddress == d.address))",
  'legacy deliveryAddress'
);
replaceOnce(
  "        && d.deliveryLocationSource in ['manual','gps','pin','search']\n        && d.deliveryCoordinatesConfirmed is bool\n        && d.deliveryCoordinatesConfirmed == (d.deliveryLat is number && d.deliveryLng is number)",
  "        && (!d.keys().hasAny(['deliveryLocationSource']) || d.deliveryLocationSource in ['manual','gps','pin','search'])\n        && (!d.keys().hasAny(['deliveryCoordinatesConfirmed']) || (\n          d.deliveryCoordinatesConfirmed is bool\n          && d.deliveryCoordinatesConfirmed == (d.deliveryLat is number && d.deliveryLng is number)\n        ))",
  'legacy delivery coordinate metadata'
);
replaceOnce(
  "          'eta','deliveryPartnerName','deliveryPartnerPhone','deliveryPartnerPhotoRef','vehicle','locationLabel','lat','lng','customerUpdate','updatedAt'",
  "          'eta','deliveryPartnerName','deliveryPartnerPhone','deliveryPartnerPhotoRef','vehicle','locationLabel','lat','lng','customerUpdate','deliveryOTP','updatedAt'",
  'legacy public tracking key'
);
replaceOnce(
  "        && (!d.keys().hasAny(['customerUpdate']) || (d.customerUpdate is string && d.customerUpdate.size() <= 500))\n        && d.updatedAt == request.time;\n    }\n    function trackingMatchesOrderAfter()",
  "        && (!d.keys().hasAny(['customerUpdate']) || (d.customerUpdate is string && d.customerUpdate.size() <= 500))\n        && (!d.keys().hasAny(['deliveryOTP']) || (d.deliveryOTP is string && d.deliveryOTP.matches('^[0-9]{6}$')))\n        && d.updatedAt == request.time;\n    }\n    function trackingMatchesOrderAfter()",
  'legacy public tracking OTP validation'
);

const banner=`// GENERATED CUTOVER RULESET — DO NOT LEAVE DEPLOYED AFTER THE NEW STOREFRONT SMOKE PASSES.\n// Source: firestore.rules. Generator: scripts/build-firestore-cutover-rules.mjs.\n`;
fs.writeFileSync(OUTPUT,banner+rules);
console.log(`Generated ${OUTPUT} from ${SOURCE}`);
