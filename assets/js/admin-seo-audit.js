(() => {
  'use strict';

  const SITE_ORIGIN = 'https://nariyal-sutra.netlify.app';
  const PRIORITY = new Set([
    '/',
    '/coconut-water',
    '/fresh-tender-coconut.html',
    '/green-coconut.html',
    '/bulk-coconut-supply.html',
    '/coconut-events-hospitality.html',
    '/coconut-wholesale-export.html'
  ]);
  let latestReport = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const fetchPathFor = (pathname) => {
    if (pathname === '/') return '/index.html';
    if (pathname === '/coconut-water') return '/coconut-water.html';
    return pathname;
  };

  const parseSitemap = (xml) =>
    Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());

  const schemaStatus = (doc) => {
    const blocks = [...doc.querySelectorAll('script[type="application/ld+json"]')];
    if (!blocks.length) return { ok: false, count: 0, error: 'missing schema' };
    try {
      blocks.forEach((node) => JSON.parse(node.textContent || ''));
      return { ok: true, count: blocks.length, error: '' };
    } catch {
      return { ok: false, count: blocks.length, error: 'invalid schema JSON' };
    }
  };

  const auditPage = async (canonicalUrl) => {
    const canonical = new URL(canonicalUrl);
    const pathname = canonical.pathname || '/';
    const response = await fetch(fetchPathFor(pathname), { cache: 'no-store' });
    if (!response.ok) {
      return { pathname, canonicalUrl, ok: false, indexable: false, failures: ['page fetch'], passed: 0, total: 10 };
    }
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const robots = (doc.querySelector('meta[name="robots"]')?.content || '').toLowerCase();
    const canonicalTag = doc.querySelector('link[rel="canonical"]')?.href || '';
    const schema = schemaStatus(doc);
    const checks = {
      title: Boolean(doc.title.trim()),
      description: Boolean(doc.querySelector('meta[name="description"]')?.content.trim()),
      canonical: canonicalTag === canonicalUrl,
      h1: doc.querySelectorAll('h1').length === 1 && Boolean(doc.querySelector('h1')?.textContent.trim()),
      robots: robots.includes('index') && !robots.includes('noindex'),
      openGraph: ['og:title', 'og:description', 'og:url', 'og:image'].every(
        (key) => Boolean(doc.querySelector('meta[property="' + key + '"]')?.content.trim())
      ),
      twitter: ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].every(
        (key) => Boolean(doc.querySelector('meta[name="' + key + '"]')?.content.trim())
      ),
      schema: schema.ok,
      imageAlt: [...doc.querySelectorAll('img')].every((img) => img.hasAttribute('alt')),
      canonicalHost: canonicalTag.startsWith(SITE_ORIGIN)
    };
    const labels = {
      title: 'title',
      description: 'description',
      canonical: 'canonical',
      h1: 'H1',
      robots: 'robots',
      openGraph: 'Open Graph',
      twitter: 'Twitter',
      schema: 'schema',
      imageAlt: 'image alt',
      canonicalHost: 'canonical host'
    };
    const failures = Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([key]) => labels[key]);
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      pathname,
      canonicalUrl,
      ok: failures.length === 0,
      indexable: checks.robots && checks.canonical && checks.canonicalHost,
      failures,
      passed,
      total: Object.keys(checks).length,
      searchConsoleVerification: Boolean(
        doc.querySelector('meta[name="google-site-verification"]')?.content.trim()
      )
    };
  };

  const render = (report) => {
    const summary = document.getElementById('apSeoSummary');
    const rows = document.getElementById('apSeoAuditRows');
    const note = document.getElementById('apSeoAuditNote');
    if (!summary || !rows) return;

    const ready = report.pages.filter((page) => page.ok).length;
    summary.textContent =
      ready + '/' + report.pages.length + ' sitemap pages pass the local technical contract';

    const sorted = [...report.pages].sort((a, b) => {
      const ap = PRIORITY.has(a.pathname) ? 0 : 1;
      const bp = PRIORITY.has(b.pathname) ? 0 : 1;
      return ap - bp || a.pathname.localeCompare(b.pathname);
    });

    rows.innerHTML = sorted.map((page) => {
      const state = page.ok ? 'Ready locally' : page.failures.join(', ');
      return (
        '<div class="ap-seo-row">' +
        '<span>' + esc(page.pathname) + '</span>' +
        '<span>' + (page.indexable ? 'Indexable' : 'Review') + '</span>' +
        '<span>' + page.passed + '/' + page.total + '</span>' +
        '<span>' + esc(state) + '</span>' +
        '</div>'
      );
    }).join('');

    const verify = report.searchConsoleVerificationPresent ? 'present' : 'missing';
    note.textContent =
      'Local/repository audit only. Search Console verification token: ' + verify +
      '. Google index coverage is not inferred; verify it only after approved live deployment.';
  };

  const run = async () => {
    const summary = document.getElementById('apSeoSummary');
    try {
      if (summary) summary.textContent = 'Running local technical audit…';
      const response = await fetch('/sitemap.xml', { cache: 'no-store' });
      if (!response.ok) throw new Error('sitemap.xml could not be loaded');
      const sitemapText = await response.text();
      const urls = parseSitemap(sitemapText);
      const pages = [];
      for (const url of urls) pages.push(await auditPage(url));
      latestReport = {
        generatedAt: new Date().toISOString(),
        scope: 'repository/local technical SEO audit',
        canonicalOrigin: SITE_ORIGIN,
        sitemap: SITE_ORIGIN + '/sitemap.xml',
        searchConsoleVerificationPresent: Boolean(
          pages.find((page) => page.pathname === '/')?.searchConsoleVerification
        ),
        pages
      };
      render(latestReport);
    } catch (error) {
      if (summary) summary.textContent = 'SEO audit unavailable';
      const note = document.getElementById('apSeoAuditNote');
      if (note) {
        note.textContent =
          'Could not complete local SEO audit: ' + error.message +
          '. No indexing status has been inferred.';
      }
    }
  };

  document.getElementById('apSeoExport')?.addEventListener('click', () => {
    if (!latestReport) return;
    const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nariyal-sutra-seo-audit.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
