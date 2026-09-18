import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(c,m)=>{if(!c)throw new Error(m)};

const pages=[
  'index.html','about-nariyal-sutra.html','bulk-coconut-supply.html',
  'coconut-events-hospitality.html','coconut-wholesale-export.html','direct-farm.html',
  'fresh-tender-coconut.html','freshness-first.html','green-coconut.html',
  'gujarat-coast.html','south-india-groves.html','supplier-partnership.html',
  'coconut-water.html','people-of-nariyal-sutra.html','delivery-policy.html',
  'privacy.html','terms.html','track.html'
];

const forbidden=[
  'Admin controls',
  'Admin-controlled',
  'choose website placement',
  'approved customer receives email + WhatsApp publication notice',
  'visual language is intentionally',
  'product-card template',
  'No fake “ships worldwide” claim',
  'process-led rather than gallery-led',
  'earlier build',
  'baked-in cinematic composite',
  'malformed rectangular cut composites',
  'This page intentionally excludes private operational notes',
  'smart enquiry desk',
  'smart enquiry',
  'Cinematic story selector',
  'Cinematic product study',
  'Cinematic Product Study',
  'current storefront focuses',
  'generic stock assumptions',
  'same system can route',
  'website does not promise a fixed delivery charge',
  'Skip cinematic'
];

for(const page of pages){
  const src=read(page)
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ');
  for(const phrase of forbidden)must(!src.includes(phrase),`${page}: customer-facing implementation copy remains: ${phrase}`);
}

const dynamic=read('assets/js/v421-local-store.js');
for(const phrase of [
  'Admin controls the images, order, speed, direction, surfaces and placement.',
  'Curated ambassadors who have been explicitly approved for this public role.',
  'Customer-submitted coconut moments appear here only after consent, review and Admin approval.',
  'A living editorial rail controlled from Admin.'
])must(!dynamic.includes(phrase),`Dynamic People copy still exposes internal wording: ${phrase}`);

const homepage=read('index.html');
must(homepage.includes('supported locations across India'),'Homepage does not state India-wide serviceability positioning');
must(homepage.includes('International requirements are handled through our Trade &amp; Supply Desk.'),'Homepage does not route international requirements professionally');
must(homepage.includes('People of Nariyal Sutra · Stories in motion'),'Homepage People heading was not professionalized');
must(homepage.includes('Address / locality for serviceability'),'Checkout location wording is not compatible with flexible handover modes');

console.log('PUBLIC COPY PROFESSIONAL QA: PASS');
