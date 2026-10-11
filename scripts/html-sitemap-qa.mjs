// Offline HTML sitemap coverage, canonical and internal link checks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const load=p=>fs.readFileSync(new URL(p,root),'utf8');
const origin='https://nariyal-sutra.netlify.app';
const html=load('sitemap.html'),xml=load('sitemap.xml'),home=load('index.html');
const sitemapUrls=[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1]);
assert.ok(sitemapUrls.includes(origin+'/sitemap.html'),'HTML sitemap must appear in XML sitemap');
assert.ok(home.includes('href="sitemap.html"'),'Home footer should link human sitemap');
assert.ok(html.includes('rel="canonical" href="'+origin+'/sitemap.html"'),'Canonical must match');
assert.match(html,/<meta name="robots" content="index,follow/i,'Human sitemap must be indexable');
for(const absolute of sitemapUrls.filter(u=>u!==origin&&u!==origin+'/sitemap.html')){
  const relative=new URL(absolute).pathname;
  assert.ok(html.includes('href="'+relative+'"'),'Missing canonical page link '+relative);
  const file=relative==='/coconut-water'?'coconut-water.html':relative.slice(1);
  assert.ok(fs.existsSync(new URL('../'+file,import.meta.url)),'Broken linked page '+relative);
}
assert.ok(html.includes('नारियल पानी')&&html.includes('nariyal pani'),'Natural language discovery labels present');
assert.ok(html.includes('serviceability')&&html.includes('availability'),'No unsupported worldwide delivery promises');
assert.ok(!/₹\s*\d+/.test(html),'Do not hardcode variable prices');
assert.ok(load('llms.txt').includes(origin+'/sitemap.html'),'AI information index links HTML sitemap');
console.log('PASS HTML sitemap: '+sitemapUrls.length+' canonical URLs; homepage linkage and actual page paths verified');
