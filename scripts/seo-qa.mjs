import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ORIGIN = 'https://nariyal-sutra.netlify.app';
const errors = [];
const checks = [];

const read = (file) => fs.readFile(path.join(ROOT, file), 'utf8');
const strip = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
const escapeRe = (value) => value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

function meta(html, kind, key) {
  const tag =
    html.match(
      new RegExp(
        `<meta\\b[^>]*\\b${kind}=[\"']${escapeRe(key)}[\"'][^>]*>`,
        'i'
      )
    )?.[0] || '';
  return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1]?.trim() || '';
}

function canonical(html) {
  const tag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0] || '';
  return tag.match(/\bhref=["']([^"']*)["']/i)?.[1]?.trim() || '';
}

function title(html) {
  return strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
}

function fileForUrl(urlString) {
  const pathname = new URL(urlString).pathname;
  if (pathname === '/') return 'index.html';
  if (pathname === '/coconut-water') return 'coconut-water.html';
  return pathname.replace(/^\//, '');
}

function structuredData(html, file) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  ].map((match) => match[1]);

  if (!blocks.length) errors.push(file + ': structured data missing');

  const parsed = [];
  for (const block of blocks) {
    try {
      parsed.push(JSON.parse(block));
    } catch (error) {
      errors.push(file + ': invalid structured data JSON (' + error.message + ')');
    }
  }
  return parsed;
}

function hasPriceKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasPriceKey);
  return Object.entries(value).some(
    ([key, child]) =>
      ['price', 'lowPrice', 'highPrice'].includes(key) || hasPriceKey(child)
  );
}

const sitemap = await read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  match[1].trim()
);

if (!urls.length) errors.push('sitemap.xml: no URLs');
if (new Set(urls).size !== urls.length) errors.push('sitemap.xml: duplicate URLs');

const privateFragments = [
  '/admin',
  '/track',
  '/staff-sign-in',
  '/docs/',
  '/qa-artifacts/'
];

for (const url of urls) {
  if (!url.startsWith(ORIGIN)) {
    errors.push('sitemap.xml: non-canonical origin ' + url);
  }
  if (
    privateFragments.some((fragment) =>
      new URL(url).pathname.startsWith(fragment)
    )
  ) {
    errors.push('sitemap.xml: private/QA URL included ' + url);
  }
}

const seenTitles = new Map();
const seenCanonicals = new Map();
const pageResults = [];

for (const url of urls) {
  const file = fileForUrl(url);
  let html;
  try {
    html = await read(file);
  } catch {
    errors.push('sitemap.xml: target file missing for ' + url + ' -> ' + file);
    continue;
  }

  const pageTitle = title(html);
  const description = meta(html, 'name', 'description');
  const robots = meta(html, 'name', 'robots').toLowerCase();
  const pageCanonical = canonical(html);
  const h1s = [
    ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)
  ].map((match) => strip(match[1]));
  const og = ['og:title', 'og:description', 'og:url', 'og:image'].map((key) =>
    meta(html, 'property', key)
  );
  const twitter = [
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image'
  ].map((key) => meta(html, 'name', key));
  const schema = structuredData(html, file);
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);

  if (!pageTitle) errors.push(file + ': title missing');
  if (!description) errors.push(file + ': meta description missing');
  if (!robots.includes('index') || robots.includes('noindex')) {
    errors.push(file + ': public robots directive must be indexable');
  }
  if (pageCanonical !== url) {
    errors.push(
      file + ': canonical mismatch (' + (pageCanonical || 'missing') + ' != ' + url + ')'
    );
  }
  if (h1s.length !== 1 || !h1s[0]) {
    errors.push(file + ': expected exactly one meaningful H1, found ' + h1s.length);
  }
  if (og.some((value) => !value)) {
    errors.push(file + ': Open Graph basics incomplete');
  }
  if (twitter.some((value) => !value)) {
    errors.push(file + ': Twitter card basics incomplete');
  }
  if (imgs.some((tag) => !/\balt\s*=/i.test(tag))) {
    errors.push(file + ': image without alt attribute');
  }

  if (seenTitles.has(pageTitle)) {
    errors.push(file + ': duplicate title with ' + seenTitles.get(pageTitle));
  } else {
    seenTitles.set(pageTitle, file);
  }

  if (seenCanonicals.has(pageCanonical)) {
    errors.push(
      file + ': duplicate canonical with ' + seenCanonicals.get(pageCanonical)
    );
  } else {
    seenCanonicals.set(pageCanonical, file);
  }

  const ogImage = og[3];
  if (ogImage?.startsWith(ORIGIN)) {
    const imageFile = new URL(ogImage).pathname.replace(/^\//, '');
    try {
      await fs.access(path.join(ROOT, imageFile));
    } catch {
      errors.push(file + ': local og:image missing -> ' + imageFile);
    }
  }

  pageResults.push({
    file,
    url,
    pageTitle,
    schemaCount: schema.length
  });
}

const semanticContracts = {
  'fresh-tender-coconut.html': [
    /fresh tender coconut/i,
    /(young coconut|tender nariyal)/i
  ],
  'green-coconut.html': [
    /green coconut/i,
    /(young green coconut|green nariyal|drinking coconut)/i
  ],
  'coconut-water.html': [
    /coconut water/i,
    /(nariyal pani|narial pani)/i
  ],
  'bulk-coconut-supply.html': [
    /bulk/i,
    /(commercial|supply|supplier|wholesale)/i
  ],
  'coconut-events-hospitality.html': [
    /(events|weddings)/i,
    /(hotels|cafés|hospitality)/i
  ],
  'coconut-wholesale-export.html': [/wholesale/i, /export/i]
};

for (const [file, patterns] of Object.entries(semanticContracts)) {
  const html = await read(file);
  const visible = strip(html);
  for (const pattern of patterns) {
    if (!pattern.test(visible)) {
      errors.push(file + ': semantic coverage missing ' + pattern);
    }
  }
}

for (const file of [
  'fresh-tender-coconut.html',
  'green-coconut.html'
]) {
  const html = await read(file);
  for (const block of structuredData(html, file)) {
    if (hasPriceKey(block)) {
      errors.push(
        file +
          ': static structured-data price detected; public price must remain authoritative/dynamic'
      );
    }
  }
}

const home = await read('index.html');
if (!meta(home, 'name', 'google-site-verification')) {
  errors.push('index.html: Google Search Console verification meta missing');
}

const robotsTxt = await read('robots.txt');
if (!robotsTxt.includes('Sitemap: ' + ORIGIN + '/sitemap.xml')) {
  errors.push('robots.txt: canonical sitemap declaration missing');
}

const headers = await read('_headers');
for (const route of [
  '/admin-live-legacy.html',
  '/admin-login.html',
  '/admin-bcc-login.html',
  '/admin-set-password.html',
  '/staff-sign-in.html',
  '/docs/*',
  '/qa-artifacts/*'
]) {
  const i = headers.indexOf(route);
  const window = i >= 0 ? headers.slice(i, i + 180) : '';
  if (i < 0 || !/X-Robots-Tag:\s*noindex/i.test(window)) {
    errors.push('_headers: noindex coverage missing for ' + route);
  }
}

checks.push(urls.length + ' canonical sitemap URLs audited');
checks.push(seenTitles.size + ' unique titles');
checks.push(seenCanonicals.size + ' unique canonicals');
checks.push('Open Graph and Twitter basics complete for sitemap pages');
checks.push('Structured data JSON parses and product SEO contains no static price');
checks.push('Private/Admin/QA indexation guards present');
checks.push('Search Console verification token preserved');
checks.push('Core coconut synonym and commercial-intent coverage present');

if (errors.length) {
  console.error(JSON.stringify({ ok: false, checks, errors }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checks,
      pages: pageResults
    },
    null,
    2
  )
);
