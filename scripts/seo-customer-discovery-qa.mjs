// Offline quality gate for discoverability claims; never calls Search Console or Netlify.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const guide=read('coconut-buying-guide.html');
const sitemap=read('sitemap.xml');
const llms=read('llms.txt');
const robots=read('robots.txt');
const homepage=read('index.html');
assert.match(guide,/<title>[^<]*Nariyal Pani Delivery[^<]*<\/title>/,'Buyer-search title');
assert.match(guide,/<meta\s+name="description"\s+content="[^"]*tender coconut delivery/i);
assert.match(guide,/<h1>[^<]*Nariyal pani delivery/i,'Visible heading');
for(const t of ['नारियल पानी','narial paani','tender coconut delivery','Jabalpur','postal code']){
  assert.ok(guide.includes(t),'Natural delivery guidance missing: '+t);
}
for(const href of ['/#collection','/#order','/coconut-wholesale-export.html','/coconut-water']){
  assert.ok(guide.includes('href="'+href+'"'),'Useful internal buying link: '+href);
}
assert.match(guide,/shipping to every country is not guaranteed/i);
assert.match(guide,/before accepting the request/i);
assert.ok(!/₹\s*\d+/.test(guide),'Guide must not hard-code changing Firestore product prices');
assert.ok(sitemap.includes('https://nariyal-sutra.netlify.app/coconut-buying-guide.html'));
assert.ok(llms.includes('https://nariyal-sutra.netlify.app/coconut-buying-guide.html'));
assert.ok(robots.includes('Sitemap: https://nariyal-sutra.netlify.app/sitemap.xml'));
assert.ok(homepage.includes('href="/coconut-buying-guide.html"')||homepage.includes('href="coconut-buying-guide.html"'),'Homepage internally links guide');
assert.ok(!/<meta[^>]+noindex/i.test(guide),'Guide must remain indexable');
console.log('PASS SEO buyer-discovery content, local delivery qualification, internal links, no stale prices, sitemap and AI references');
