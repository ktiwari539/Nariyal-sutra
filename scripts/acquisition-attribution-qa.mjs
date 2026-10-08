import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const has=(source,values,label)=>values.forEach(value=>must(source.includes(value),`${label}: missing ${value}`));
const not=(source,values,label)=>values.forEach(value=>must(!source.includes(value),`${label}: forbidden ${value}`));

const client=read('assets/js/v421-attribution.js');
has(client,[
  "const SESSION_KEY='ns-attribution-v2'",
  'sessionStorage.getItem(SESSION_KEY)',
  'sessionStorage.setItem(SESSION_KEY',
  "params.get('utm_source')",
  "params.get('utm_medium')",
  "params.get('utm_campaign')",
  "params.get('utm_content')",
  'new URL(document.referrer).hostname',
  "classification!=='direct'",
  'firstTouch:copyTouch(sessionAttribution.firstTouch)',
  'lastTouch:copyTouch(sessionAttribution.lastTouch)',
  'reportedSource:source',
  'version:VERSION'
],'storefront attribution');
not(client,[
  'localStorage',
  "params.get('utm_term')",
  'landingReferrer',
  'document.referrer,500',
  'location.search.slice'
],'storefront privacy boundary');
new Function(client);

const sequencing=read('assets/js/v30-page-sequencing.js');
has(sequencing,[
  "if(!window.NSAttribution)loadOnce('/assets/js/v421-attribution.js'",
  'Capture the original landing source on every commerce/content entry page'
],'cross-page first touch');

const order=read('ns-order-patch.js');
has(order,[
  'function safeAttribution()',
  'var acquisition=safeAttribution()',
  'merged.acquisition=acquisition',
  "var privateDoc=Object.assign({},merged,{createdAt:now,updatedAt:now,source:'website'})"
],'private order attribution');
const publicBlock=order.match(/var publicDoc=\{([\s\S]*?)\n\s*\};/)?.[1]||'';
const customerBlock=order.match(/var customerDoc=\{([\s\S]*?)\n\s*\};/)?.[1]||'';
must(!publicBlock.includes('acquisition'),'public tracking exposes acquisition');
must(!customerBlock.includes('acquisition'),'customer order projection exposes acquisition');
new Function(order);

const storefront=read('index.html');
has(storefront,[
  "window.NSAttribution?.read?.()||window.NS_ATTRIBUTION_CONTEXT||null",
  "...(acquisition&&Number(acquisition.version)===2?{acquisition}:{})",
  "fsMod.doc(db,'inquiries'"
],'inquiry attribution');

const rules=read('firestore.rules');
has(rules,[
  'function validAcquisitionTouch(touch)',
  'function validAcquisition()',
  "touch.classification in ['direct','organic_search','paid_campaign','social','whatsapp','email','referral','other_unknown']",
  "touch.referrerHost.matches('^[a-z0-9.-]{0,253}$')",
  "touch.landingPath.matches('^/[^?#]{0,299}$')",
  "!d.keys().hasAny(['acquisition']) || validAcquisition()",
  "'source','acquisition'"
],'Firestore acquisition contract');

const admin=read('assets/js/v421-admin-attribution.js');
has(admin,[
  "collection(db,'orders')",
  "collection(db,'inquiries')",
  'Acquired orders & enquiries by source',
  'They are not website visitor, session or traffic totals.',
  'firstTouch',
  'Top campaigns'
],'Legacy Admin acquisition reporting');
new Function(admin);

const currentAdmin=read('assets/js/admin-analytics-v1.js');
has(currentAdmin,[
  'How customers found us',
  'What customers told us',
  'Top landing pages',
  'Trackable link builder',
  'Visitor-level engagement',
  "utm_source",
  "utm_medium",
  "utm_campaign",
  'Confirmed outcomes, not raw visits',
  'Full referrer URLs and arbitrary query-string values are not stored.'
],'Current Business Command Center acquisition analytics');
not(currentAdmin,[
  '61%',
  '28%',
  'fake visitor',
  'localStorage'
],'Current analytics truthfulness');
new Function(currentAdmin);

const adminPage=read('admin-preview.html');
has(adminPage,[
  'data-view="analytics"',
  'Analytics / Traffic',
  'id="nsAnalyticsApp"',
  'Open traffic & acquisition',
  'assets/js/admin-analytics-v1.js'
],'Current Admin analytics integration');

const bridge=read('assets/js/v421-production-bridge.js');
has(bridge,[
  "collection(db,'inquiries')",
  's.inquiries=snap.docs.map(inquiryFromDoc)',
  'inquiries:(s.inquiries||[]).length'
],'Production inquiry acquisition sync');

const orderAdmin=read('assets/js/admin-v44-order-operations.js');
has(orderAdmin,[
  'data-ns-order-acquisition',
  "['Source',firstLabel||'Unknown']",
  "['Landing page',landingLabel(first.landingPath)]",
  "['Campaign',first.campaign||'—']",
  "['Referrer',first.referrerHost||'—']",
  "['Customer answer',a.reportedSourceLabel"
],'Admin order detail acquisition');

const privacy=read('privacy.html');
has(privacy,[
  'tab-only browser session',
  'We do not store a full external referrer URL',
  'arbitrary URL parameters',
  'custom IP-address records',
  'cross-site fingerprint'
],'privacy disclosure');

console.log('CUSTOMER ACQUISITION ATTRIBUTION QA: PASS');
