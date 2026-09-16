import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const prep=spawnSync(process.execPath,['scripts/prepare-netlify-dev.mjs'],{cwd:root,encoding:'utf8'});
if(prep.status!==0)throw new Error(`Netlify Dev preparation failed:\n${prep.stdout}\n${prep.stderr}`);

const toml=fs.readFileSync(path.join(root,'netlify.toml'),'utf8');
const sourceHeaders=fs.readFileSync(path.join(root,'_headers'),'utf8');
const devRoot=path.join(root,'.netlify-dev');
const devHeaders=fs.readFileSync(path.join(devRoot,'_headers'),'utf8');
const devIndex=fs.readFileSync(path.join(devRoot,'index.html'),'utf8');
const devRedirects=fs.readFileSync(path.join(devRoot,'_redirects'),'utf8');
const peopleCss=fs.readFileSync(path.join(devRoot,'assets/css/v25-public.css'),'utf8');

function expect(re,label){if(!re.test(toml))throw new Error(`netlify.toml missing ${label}`)}
expect(/\[dev\][\s\S]*?framework\s*=\s*"#static"/,'static Netlify Dev framework');
expect(/\[dev\][\s\S]*?publish\s*=\s*"\.netlify-dev"/,'isolated Netlify Dev publish directory');
expect(/\[dev\][\s\S]*?port\s*=\s*8888/,'Netlify Dev port 8888');
expect(/\[build\][\s\S]*?publish\s*=\s*"\."/,'production publish root');

if(!/upgrade-insecure-requests/i.test(sourceHeaders))throw new Error('Production CSP lost upgrade-insecure-requests');
if(/upgrade-insecure-requests/i.test(devHeaders))throw new Error('Generated Dev CSP still forces HTTPS on localhost');
if(/https?:\/\/(?:[a-f0-9]{20,}--)?nariyal-sutra\.netlify\.app\/assets\//i.test(devIndex))throw new Error('Generated Dev index still depends on production runtime assets');
if(!/^\/admin\s+\/admin-preview\.html\s+200$/m.test(devRedirects))throw new Error('Netlify Dev /admin route does not open admin-preview.html directly');
if(!/people-uploads\/U002\.png/.test(peopleCss))throw new Error('People feature header is not wired to U002');

for(const rel of [
  'index.html',
  'admin.html',
  'admin-preview.html',
  'admin-login.html',
  'people-of-nariyal-sutra.html',
  'track.html',
  'assets/css/v17-cinematic.css',
  'assets/css/v421-cinematic-professional.css',
  'assets/js/v17-cinematic.js',
  'assets/js/v36-public.js',
  'assets/images/nariyal-premium-hero.webp',
  'assets/images/story-coconut-hero.png',
  'assets/images/story-coconut-body-cut.png',
  'assets/images/story-coconut-cap-cut.png',
  'assets/images/people-uploads/U002.png'
]){
  if(!fs.existsSync(path.join(devRoot,rel)))throw new Error(`Generated Dev publish tree missing ${rel}`);
}

console.log('NETLIFY DEV CONTRACT QA: PASS');
console.log(prep.stdout.trim());
