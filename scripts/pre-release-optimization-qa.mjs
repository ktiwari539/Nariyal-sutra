import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(ROOT,rel));
const must=(condition,message)=>{if(!condition)throw new Error(message);};

const retired=[
  'assets/js/admin-v35.js','assets/js/admin-v38.js','assets/js/v35-public.js',
  'assets/js/v421-ambassador-campaign-seed.js','assets/js/v421-cinematic-compact.js',
  'assets/js/v421-cinematic-final.js','assets/js/v421-cinematic-isolated.js',
  'assets/js/v421-gold-master-correction.js','assets/css/admin-v35.css',
  'assets/css/v35-public.css','assets/css/v421-cinematic-rebuild.css',
  'assets/css/v421-public.css','scripts/.qa-trigger-2','scripts/.qa-trigger-3',
  'scripts/.qa-trigger-4','scripts/.qa-trigger-5'
];
for(const rel of retired)must(!exists(rel),`confirmed-unused file was restored: ${rel}`);

const index=read('index.html'),location=read('assets/js/v21-public.js');
must(!/<(?:link|script)[^>]+leaflet@1\.9\.4/i.test(index),'Leaflet returned to the initial homepage document');
must(location.includes('data-ns-leaflet')&&location.includes("rootMargin:'500px 0px'"),'checkout map lazy loader is missing');
must(index.includes('assets/js/homepage-analytics.js'),'cacheable homepage analytics bootstrap is missing');

for(const rel of [
  'assets/images/review/coastal-grove.png','assets/images/review/coastal-grove.webp',
  'assets/images/review/backwater-grove.png','assets/images/review/backwater-grove.webp',
  'assets/images/people-uploads/U002.png','assets/images/people-uploads/U002.webp'
])must(exists(rel)&&fs.statSync(path.join(ROOT,rel)).size>0,`required original/optimized image is missing: ${rel}`);
must(index.includes('coastal-grove.webp')&&index.includes('backwater-grove.webp'),'homepage does not use optimized grove images');

const people=read('people-of-nariyal-sutra.html'),sitemap=read('sitemap.xml');
must(/name="robots" content="index,follow,max-image-preview:large"/.test(people),'People page remains excluded from indexing');
must(people.includes('rel="canonical" href="https://nariyal-sutra.netlify.app/people-of-nariyal-sutra.html"'),'People canonical URL is missing');
must(sitemap.includes('<loc>https://nariyal-sutra.netlify.app/people-of-nariyal-sutra.html</loc>'),'People canonical URL is missing from sitemap');

const admin=read('admin.html'),preview=read('admin-preview.html'),bridge=read('assets/js/v421-production-bridge.js'),login=read('admin-bcc-login.html');
must(admin.includes('admin-preview.html')&&preview.includes('assets/js/v421-media-db.js'),'canonical Admin entry chain changed');
must(bridge.includes('admin-bcc-login.html')&&bridge.includes('waitAuth()')&&bridge.includes('adminRole(user)'),'production Admin auth guard changed');
must(login.includes('emailVerified')&&login.includes("x.status!=='Active'")&&login.includes('x.active!==true'),'secure Admin login role checks changed');

console.log('PRE-RELEASE OPTIMIZATION QA: PASS');
