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
  The live September storefront predates exactly three private delivery snapshot
  fields. Its public tracking projection is already sanitized and can satisfy the
  final tracking schema; it is simply written after the private order instead of
  inside the new atomic batch. Keep the compatibility surface limited to those
  three missing private-order fields. Immediately after the new release smoke
  passes, firestore.rules replaces this generated ruleset. Existing customer
  profiles may also lack the newer explicit marketing-consent fields. Absence
  remains unconsented, and an existing consent field may never be removed.
*/
replaceOnce(
  "        && d.deliveryAddress is string && d.deliveryAddress == d.address",
  "        && (!d.keys().hasAny(['deliveryAddress']) || (d.deliveryAddress is string && d.deliveryAddress == d.address))",
  'legacy deliveryAddress'
);

const consentFlags="        && d.marketingEmailOptIn is bool && d.marketingWhatsappOptIn is bool && d.marketingTelegramOptIn is bool";
const createConsentTime="        && (!('marketingConsentUpdatedAt' in d) || (d.marketingConsentUpdatedAt is timestamp && d.marketingConsentUpdatedAt == request.time))";
const updateConsentTime="        && (!('marketingConsentUpdatedAt' in d) || d.marketingConsentUpdatedAt is timestamp)";
const flags=['marketingEmailOptIn','marketingWhatsappOptIn','marketingTelegramOptIn'];
replaceOnce(
  consentFlags+'\n'+createConsentTime,
  flags.map(field=>`        && (!d.keys().hasAny(['${field}']) || d.${field} is bool)`).join('\n')+'\n'+createConsentTime,
  'legacy customer profile creation'
);
replaceOnce(
  consentFlags+'\n'+updateConsentTime,
  flags.map(field=>`        && ((!d.keys().hasAny(['${field}']) && !resource.data.keys().hasAny(['${field}'])) || d.${field} is bool)`).join('\n')+'\n'+updateConsentTime,
  'legacy customer profile updates without consent deletion'
);
replaceOnce(
  "        && d.deliveryLocationSource in ['manual','gps','pin','search']\n        && d.deliveryCoordinatesConfirmed is bool\n        && d.deliveryCoordinatesConfirmed == (d.deliveryLat is number && d.deliveryLng is number)",
  "        && (!d.keys().hasAny(['deliveryLocationSource']) || (d.deliveryLocationSource in ['manual','gps','pin','search']))\n        && (!d.keys().hasAny(['deliveryCoordinatesConfirmed']) || (d.deliveryCoordinatesConfirmed is bool && d.deliveryCoordinatesConfirmed == (d.deliveryLat is number && d.deliveryLng is number)))",
  'legacy delivery coordinate metadata'
);

const banner=`// GENERATED CUTOVER RULESET — DO NOT LEAVE DEPLOYED AFTER THE NEW STOREFRONT SMOKE PASSES.\n// Source: firestore.rules. Generator: scripts/build-firestore-cutover-rules.mjs.\n`;
fs.writeFileSync(OUTPUT,banner+rules);
console.log(`Generated ${OUTPUT} from ${SOURCE}`);
