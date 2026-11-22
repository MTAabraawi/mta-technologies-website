const { test, expect } = require('@playwright/test');
const trackingAndAdHosts = /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|acscdn\.com|embellishedcoffee\.com)$/i;

function isTrackingOrAdHost(hostname) {
  return trackingAndAdHosts.test(hostname);
}

// Browser tests use only the local Pages server. Never send test pageviews or
// ad requests to third-party analytics/ad networks.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', async route => {
    const hostname = new URL(route.request().url()).hostname.toLowerCase();
    if (isTrackingOrAdHost(hostname)) return route.abort();
    return route.continue();
  });
});

test('local test guard recognizes analytics and advertising hosts', async () => {
  for (const host of [
    'googletagmanager.com', 'www.googletagmanager.com',
    'google-analytics.com', 'www.google-analytics.com',
    'doubleclick.net', 'pagead2.googlesyndication.com',
    'acscdn.com', 'embellishedcoffee.com', 'sub.embellishedcoffee.com'
  ]) {
    expect(trackingAndAdHosts.test(host)).toBe(true);
  }
  expect(trackingAndAdHosts.test('127.0.0.1')).toBe(false);
  expect(trackingAndAdHosts.test('www.mtahqq.dpdns.org')).toBe(false);
});

test('marketplace API is served from the same origin', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const origin = location.origin;
    const [stats, apps] = await Promise.all([
      fetch(origin + '/api/v1/catalog-stats', { cache: 'no-store' }),
      fetch(origin + '/api/v1/apps?source=fdroid&limit=3&offset=0', { cache: 'no-store' })
    ]);
    const [statsJson, rows] = await Promise.all([stats.json(), apps.json()]);
    return { origin, statsUrl: stats.url, appsUrl: apps.url, statsStatus: stats.status,
      total: statsJson.total, appsStatus: apps.status, count: rows.length,
      contentType: apps.headers.get('content-type'), source: rows[0]?.source };
  });
  expect(result.statsUrl.startsWith(result.origin + '/')).toBe(true);
  expect(result.appsUrl.startsWith(result.origin + '/')).toBe(true);
  expect(result.statsStatus).toBe(200);
  expect(result.total).toBeGreaterThan(0);
  expect(result.appsStatus).toBe(200);
  expect(result.count).toBeGreaterThan(0);
  expect(result.contentType).toContain('application/json');
  expect(result.source).toBe('fdroid');
});

test('all store cards open internal MTA store pages, never external stores directly', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.store-picker-card');
  await expect(cards).toHaveCount(54);
  for (const card of await cards.all()) {
    const href = await card.getAttribute('href');
    expect(href.startsWith('store?store=')).toBe(true);
    await expect(card).not.toHaveAttribute('target', '_blank');
  }
});

test('F-Droid opens an internal branded catalogue and displays server-rendered applications', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-store-key="fdroid"]').click();
  await expect(page).toHaveURL(/\/store\?store=fdroid/);
  await expect(page.locator('#store-title')).toHaveText('F-Droid');
  await expect(page.locator('#store-logo')).toBeVisible();
  // Pages Functions render the first page into the HTML, so the catalogue
  // must be usable without a redundant browser-side request.
  await expect(page.locator('.store-app-card')).toHaveCount(12, { timeout: 60_000 });
  await expect(page.locator('.store-app-card').first()).toContainText('MTA Net Blocker');
  expect(errors).toEqual([]);
});

test('store catalogue automatically appends the next page when the user reaches the list end', async ({ page }) => {
  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.store-app-card');
  await expect(cards).toHaveCount(12, { timeout: 60_000 });
  const firstApp = await cards.first().locator('h3').innerText();
  const loadMore = page.locator('#store-load-more');
  await loadMore.scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(24, { timeout: 60_000 });
  await expect(cards.first().locator('h3')).toHaveText(firstApp);
});

test('store search and category/platform filters narrow results and can be cleared', async ({ page }) => {
  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  const visibleCards = page.locator('.store-app-card:not([hidden])');
  await expect(visibleCards).toHaveCount(12, { timeout: 30_000 });

  await page.locator('#store-search').fill('MTA Net Blocker');
  await expect(visibleCards).toHaveCount(1, { timeout: 15_000 });
  await expect(visibleCards.first()).toContainText('MTA Net Blocker');

  await page.locator('#store-search').fill('');
  await expect(visibleCards).toHaveCount(12, { timeout: 15_000 });

  const category = page.locator('#store-category-filter');
  await expect(category.locator('option[value="utilities"]')).toHaveCount(1);
  await category.selectOption('utilities');
  await expect(visibleCards).toHaveCount(6);
  await category.selectOption('');
  await expect(visibleCards).toHaveCount(12);

  await page.locator('#store-platform-filter').selectOption('ios');
  await expect(visibleCards).toHaveCount(0, { timeout: 15_000 });
  await page.locator('#store-platform-filter').selectOption('');
  await expect(visibleCards).toHaveCount(12, { timeout: 15_000 });
});

test('store pagination ignores duplicate source identities returned by the upstream', async ({ page }) => {
  await page.route('**/api/v1/apps?**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('offset') !== '12') return route.continue();
    const firstPageResponse = await page.request.get(
      'http://127.0.0.1:8788/api/v1/apps?source=fdroid&limit=12&offset=0'
    );
    const firstPage = await firstPageResponse.json();
    const response = await route.fetch();
    const nextPage = await response.json();
    await route.fulfill({ response, body: JSON.stringify([firstPage[0], ...nextPage]) });
  });

  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.store-app-card');
  await expect(cards).toHaveCount(12, { timeout: 30_000 });
  await page.locator('#store-load-more').scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(24, { timeout: 30_000 });
  const identities = await cards.evaluateAll(elements => elements.map(card => {
    const link = card.querySelector('.store-app-detail-link');
    const url = new URL(link.href);
    return url.searchParams.get('source') + '|' + url.searchParams.get('id');
  }));
  expect(new Set(identities).size).toBe(24);
});

test('external-only stores show an internal store profile before offering the original catalogue', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-store-key="google-play"]').click();
  await expect(page).toHaveURL(/\/store\?store=google-play/);
  await expect(page.locator('#store-title')).toHaveText('Google Play');
  await expect(page.locator('#store-unavailable')).toBeVisible();
  await expect(page.locator('#store-unavailable-link')).toHaveAttribute('href', 'https://play.google.com/store');
  await expect(page.locator('#store-unavailable-link')).toHaveAttribute('target', '_blank');
});

test('new open catalogues and Chocolatey open dedicated in-site catalogue pages', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  for (const [key, title] of [
    ['bluejetty-app-index', 'Blue Jetty App Index'],
    ['openuse', 'OpenUse Software Catalog'],
    ['chocolatey', 'Chocolatey']
  ]) {
    await page.locator('[data-store-key="' + key + '"]').click();
    await expect(page.locator('#store-title')).toHaveText(title);
    await expect(page.locator('.store-app-card').first()).toBeVisible({ timeout: 30_000 });
    await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  }
});

test('marketplace includes the MTA Net Blocker first-party product listing', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.mta-product-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('MTA Net Blocker');
  await expect(card.locator('img')).toHaveAttribute('src', /mta-net-blocker/);
  await expect(card.locator('a')).toHaveAttribute('href', 'app-mta-net-blocker.html');
});

test('connected store cards show live indexed counts from catalogue statistics', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const stats = await page.evaluate(async () => (await fetch('/api/v1/catalog-stats', { cache: 'no-store' })).json());
  for (const source of ['fdroid', 'flathub', 'homebrew-cask', 'bluejetty', 'openuse', 'chocolatey']) {
    const actual = await page.locator('[data-source-count="' + source + '"]').getAttribute('data-count');
    expect(Number(actual)).toBe(Number(stats.sources[source] || 0));
  }
});

test('public catalogue can be paginated without duplicate source identities', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const statsResponse = await fetch(location.origin + '/api/v1/catalog-stats', { cache: 'no-store' });
    if (!statsResponse.ok) throw new Error('Catalogue stats HTTP ' + statsResponse.status);
    const total = Number((await statsResponse.json()).total);
    const pageSize = 200, identities = new Set();
    let received = 0, pages = 0;
    for (let offset = 0; offset < total; offset += pageSize) {
      const response = await fetch(location.origin + '/api/v1/apps?limit=' + pageSize + '&offset=' + offset, { cache: 'no-store' });
      if (!response.ok) throw new Error('Catalogue page HTTP ' + response.status);
      const rows = await response.json();
      if (Number(response.headers.get('x-total-count')) !== total || !Array.isArray(rows) || !rows.length) throw new Error('Invalid catalogue page at ' + offset);
      for (const row of rows) {
        const key = String(row.source) + '|' + String(row.external_id);
        if (identities.has(key)) throw new Error('Duplicate identity: ' + key);
        identities.add(key);
      }
      received += rows.length; pages++;
    }
    return { total, received, unique: identities.size, pages };
  });
  expect(result.received).toBe(result.total);
  expect(result.unique).toBe(result.total);
  expect(result.pages).toBe(Math.ceil(result.total / 200));
});

test('catalogue stores are separated by verified live source counts', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const live = page.locator('.store-connected-group');
  const upcoming = page.locator('.store-coming-soon-group');
  await expect(live).toBeVisible({ timeout: 15_000 });
  await expect(upcoming).toBeVisible();
  await expect(live.locator('[data-store-key="fdroid"]')).toHaveAttribute('data-catalogue-state', 'connected');
  await expect(live.locator('[data-store-key="fdroid"] [data-source-count="fdroid"]')).toContainText('405');
  await expect(upcoming.locator('[data-store-key="google-play"]')).toHaveAttribute('data-catalogue-state', 'coming-soon');
  await expect(upcoming.locator('[data-store-key="google-play"]')).toContainText('نعمل على توفيرها قريباً');
  await expect(page.locator('.store-picker-card')).toHaveCount(54);
});

test('sitemap is valid, reachable and lists pages that resolve without redirects', async ({ page }) => {
  const sitemap = await page.request.get('/sitemap.xml', { maxRedirects: 0 });
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('xml');
  const xml = await sitemap.text();
  expect(xml.trim().startsWith('<?xml')).toBe(true);
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(locations.length).toBeGreaterThan(15);
  expect(new Set(locations).size).toBe(locations.length);
  for (const location of locations) {
    const url = new URL(location);
    expect(url.hostname).toBe('www.mtahqq.dpdns.org');
    const response = await page.request.get(url.pathname + url.search, { maxRedirects: 0 });
    expect(response.status(), 'Sitemap URL should resolve directly: ' + location).toBe(200);
    const body = await response.text();
    const canonical = body.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    expect(canonical, 'Sitemap page must declare a canonical: ' + location).not.toBeNull();
    expect(canonical[1], 'Sitemap URL must equal its canonical: ' + location).toBe(location);
    expect(body).not.toMatch(/<meta\s+name=["']robots["']\s+content=["']noindex/i);
  }
  const robots = await page.request.get('/robots.txt', { maxRedirects: 0 });
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('https://www.mtahqq.dpdns.org/sitemap-index.xml');
});

test('connected store pages become indexable while unconnected stores stay out of the index', async ({ page }) => {
  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#store-title')).toHaveText('F-Droid');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  await expect(page.locator('#store-editorial')).toBeVisible();
  await page.goto('/store?store=google-play', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#store-title')).toHaveText('Google Play');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('#store-unavailable')).toBeVisible();
});

test('connected store pages are server-rendered with a unique canonical and visible catalogue', async ({ page }) => {
  // Disable external and local scripts to verify the first HTML response is useful to crawlers.
  await page.route('**/*.js', route => route.abort());
  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#store-title')).toHaveText('F-Droid');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/store\?store=fdroid$/);
  await expect(page.locator('.store-app-card')).toHaveCount(12);
  await expect(page.locator('.store-app-card').first()).toContainText('MTA Net Blocker');
});

test('catalogue cards open dedicated in-site application profiles before the original source', async ({ page }) => {
  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.store-app-card').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.locator('.store-app-detail-link').click();
  await expect(page).toHaveURL(/\/application\?source=fdroid(?:&|$)/);
  await expect(page.locator('#application-name')).toHaveText('MTA Net Blocker');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  await expect(page.locator('#application-source-link')).toHaveAttribute('href', 'https://example.org/apps/1');
  await expect(page.locator('#application-description')).toBeVisible();
});

test('global theme tokens provide readable contrast on dark and light themes', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim());
  expect(dark.toLowerCase()).toBe('#d2dce9');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim());
  expect(light.toLowerCase()).toBe('#334155');
});

test('applications without original artwork still receive a visible icon fallback', async ({ page }) => {
  // Force every image request to fail so the test exercises the complete
  // original-icon -> publisher-favicon -> monogram fallback chain.
  await page.route('**/*', route => {
    if (route.request().resourceType() === 'image') return route.abort();
    return route.continue();
  });
  await page.goto('/store?store=fdroid', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.store-app-card').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('.store-app-card').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.store-app-icon-fallback').first()).toBeVisible({ timeout: 15_000 });
});

test('all public HTML pages are free of Google AdSense integrations', async ({ page }) => {
  const pages = [
    '/index.html', '/about.html', '/projects.html', '/innovation.html',
    '/knowledge.html', '/gallery.html', '/contact.html', '/apps.html',
    '/app-mta-net-blocker.html', '/privacy-policy.html', '/terms.html',
    '/disclaimer.html', '/cookies.html', '/data-subject-rights.html',
    '/suggestions.html', '/application.html', '/store.html',
    '/store?store=fdroid'
  ];
  const adCode = /pagead2\.googlesyndication\.com|adsbygoogle|ca-pub-|google_ad|data-ad-client|data-ad-slot|doubleclick\.net/i;
  for (const path of pages) {
    const response = await page.request.get(path);
    expect(response.status(), 'Page should load: ' + path).toBe(200);
    const html = await response.text();
    expect(html, 'Page must not load ad code: ' + path).not.toMatch(adCode);
  }
});


test('all site pages and store/application routes use the shared Adcash Display placement', async ({ page }) => {
  const pages = [
    '/index.html', '/about.html', '/projects.html', '/innovation.html',
    '/knowledge.html', '/gallery.html', '/contact.html', '/apps.html',
    '/app-mta-net-blocker.html', '/privacy-policy.html', '/terms.html',
    '/disclaimer.html', '/cookies.html', '/data-subject-rights.html',
    '/suggestions.html', '/application.html', '/store.html',
    '/contact-thanks.html', '/404.html',
    '/store?store=fdroid', '/store?store=google-play',
    '/application?source=fdroid&id=1&name=MTA%20Net%20Blocker'
  ];
  const hilltop = /hilltop\s*ads?|hilltopads?\.(?:com|net)|hilltopads?/i;
  for (const path of pages) {
    const response = await page.request.get(path);
    expect(response.status(), 'Page should load: ' + path).toBe(200);
    const html = await response.text();
    expect(html, 'HilltopAds must be absent: ' + path).not.toMatch(hilltop);
    expect(html, 'Adcash library must be present: ' + path).toContain('acscdn.com/script/aclib.js');
    expect(html, 'Shared Adcash initializer must be present: ' + path).toContain('js/adcash.js');
    expect(html, 'Top 728x90 Adcash slot must be present: ' + path).toContain('class="mta-ad-slot mta-ad-slot-top"');
    expect(html, 'Bottom 300x250 Adcash slot must be present: ' + path).toContain('class="mta-ad-slot mta-ad-slot-bottom"');
    expect(html, 'Top Adcash zone must be configured: ' + path).toContain('data-ad-zone="12478774"');
    expect(html, 'Bottom Adcash zone must be configured: ' + path).toContain('data-ad-zone="12478782"');
    expect(html, 'Inline banner code must not be embedded in HTML: ' + path).not.toMatch(/aclib\.runBanner\s*\(/i);
  }
});

test('shared Adcash initializer waits for visible carousel slides and never exposes provider code as text', async ({ page }) => {
  await page.route('**/acscdn.com/script/aclib.js', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: "window.__mtaAdcashZoneIds = []; window.aclib = { runBanner: function (options) { window.__mtaAdcashZoneIds.push(options.zoneId); var frame = document.createElement('iframe'); frame.title = 'Advertisement'; frame.src = 'about:blank'; document.querySelector(options.renderIn).appendChild(frame); } };"
  }));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const topSlot = page.locator('.mta-ad-slot-top');
  const bottomSlot = page.locator('.mta-ad-slot-bottom');
  await expect(topSlot).toHaveCount(1);
  await expect(bottomSlot).toBeVisible();
  await expect(bottomSlot).toHaveAttribute('data-ad-status', 'rendered');
  await expect(topSlot).not.toHaveAttribute('data-ad-status', 'rendered');
  await expect.poll(() => page.evaluate(() => window.__mtaAdcashZoneIds)).toEqual(['12478782']);

  await page.locator('[data-carousel-to="1"]').click();
  await expect(topSlot).not.toHaveAttribute('data-ad-status', 'requested');
  await page.locator('[data-carousel-to="2"]').click();
  await expect(topSlot).toHaveAttribute('data-ad-status', 'rendered');
  await expect.poll(() => page.evaluate(() => window.__mtaAdcashZoneIds)).toEqual(['12478782', '12478774']);

  for (const slot of [topSlot, bottomSlot]) {
    const visibleText = await slot.evaluate(element => Array.from(element.childNodes).filter(node => node.nodeType !== Node.ELEMENT_NODE || !["SCRIPT", "STYLE"].includes(node.tagName)).map(node => node.textContent || "").join(" ").trim());
    expect(visibleText).not.toContain('aclib.runBanner');
    expect(visibleText).not.toContain('zoneId');
    expect(visibleText).not.toContain('12478774');
    expect(visibleText).not.toContain('12478782');
    await expect(slot.locator('iframe[title="Advertisement"]')).toHaveCount(1);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const mobileTopSlot = page.locator('.mta-ad-slot-top');
  const mobileBottomSlot = page.locator('.mta-ad-slot-bottom');
  await expect(mobileBottomSlot).toHaveAttribute('data-ad-status', 'rendered');
  await expect(mobileTopSlot).not.toHaveAttribute('data-ad-status', 'rendered');
  await expect.poll(() => page.evaluate(() => window.__mtaAdcashZoneIds)).toEqual(['12478782']);
  await page.locator('[data-carousel-to="2"]').click();
  await expect(mobileTopSlot).toHaveAttribute('data-ad-status', 'rendered');
  await expect.poll(() => page.evaluate(() => window.__mtaAdcashZoneIds)).toEqual(['12478782', '12478774']);
  for (const slot of [mobileTopSlot, mobileBottomSlot]) {
    const visibleText = await slot.evaluate(element => element.innerText);
    expect(visibleText).not.toContain('aclib.runBanner');
    expect(visibleText).not.toContain('zoneId');
    expect(visibleText).not.toContain('12478782');
    await expect(slot.locator('iframe[title="Advertisement"]')).toHaveCount(1);
    await expect(slot.locator('script')).toHaveCount(1);
    await expect(slot.locator('script')).toHaveJSProperty('hidden', true);
  }
});

test('corporate homepage presents company capabilities and a released product', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main > section')).toHaveCount(5);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.mta-home-capability-card')).toHaveCount(4);
  await expect(page.locator('.mta-home-proof')).toContainText('MTA Net Blocker');
  await expect(page.locator('.mta-home-project-card')).toHaveCount(0);
  await expect(page.locator('.mta-home-contact')).toBeVisible();
});

test('cinematic homepage carousel animates the MTA logo, projects, and embedded Adcash slide', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const carousel = page.locator('[data-mta-carousel]');
  await expect(carousel).toBeVisible();
  await expect(carousel.locator('[data-carousel-slide]')).toHaveCount(3);
  await expect(carousel).toHaveAttribute('data-autoplay', '4200');
  await expect(carousel.locator('.mta-cinema-logo img')).toHaveAttribute('src', 'images/mta-logo-square.webp');
  await expect(carousel.locator('[data-carousel-slide]').nth(0)).toBeVisible();
  await carousel.locator('[data-carousel-next]').click();
  await expect(carousel.locator('[data-carousel-slide]').nth(1)).toBeVisible();
  await expect(carousel.locator('.mta-motion-app')).toHaveCount(4);
  for (const image of await carousel.locator('.mta-motion-app img').all()) {
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await expect(carousel.locator('.mta-motion-app[href*="projects.html"]')).toHaveCount(3);
  await expect(carousel.locator('[data-carousel-pause]')).toHaveCount(0);
  await carousel.locator('[data-carousel-to="2"]').click();
  await expect(carousel.locator('[data-carousel-slide]').nth(2)).toBeVisible();
  await expect(carousel.locator('.mta-ad-slot-top')).toBeVisible();
  await expect(carousel.locator('.mta-ad-slot-top')).toHaveAttribute('data-ad-zone', '12478774');
  await expect(carousel.locator('[data-carousel-slide]').nth(0)).toBeVisible({ timeout: 6_000 });
});


test('desktop homepage layout has a restrained navigation and spacious two-column project motion stage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect(page.locator('.corp-page-nav a')).toHaveCount(5);
  await expect(page.locator('.corp-store-link')).toHaveCount(0);
  // The project slide is initially hidden; activate it before measuring its grid.
  await page.locator('[data-carousel-to="1"]').click();
  const projectSlide = page.locator('.mta-home-slide-projects');
  await expect(projectSlide).toHaveAttribute('aria-hidden', 'false');
  await expect(projectSlide).toBeVisible();
  // Wait for the external stylesheet cascade and visible desktop grid.
  await page.waitForFunction(() => {
    const stage = document.querySelector('.mta-home-slide-projects .mta-projects-motion-stage');
    const header = document.querySelector('.corp-header-inner');
    if (!stage || !header || !stage.getClientRects().length) return false;
    const stageStyle = getComputedStyle(stage);
    const headerStyle = getComputedStyle(header);
    return stageStyle.display === 'grid'
      && stageStyle.gridTemplateColumns.split(' ').length >= 2
      && headerStyle.display === 'grid';
  });
  const layout = await page.evaluate(() => ({
    headerColumns: getComputedStyle(document.querySelector('.corp-header-inner')).gridTemplateColumns,
    stageColumns: getComputedStyle(document.querySelector('.mta-home-slide-projects .mta-projects-motion-stage')).gridTemplateColumns,
    projectCards: document.querySelectorAll('.mta-home-slide-projects .mta-motion-app').length,
    carouselHeight: document.querySelector('.mta-home-carousel').getBoundingClientRect().height
  }));
  expect(layout.headerColumns.trim().split(/\s+/).length).toBe(3);
  // Read the actual CSS grid tracks, not animated card bounding boxes:
  // the entrance animation applies 3D transforms that can shift visual left edges.
  expect(layout.stageColumns.trim().split(/\s+/).length).toBe(2);
  expect(layout.projectCards).toBe(4);
  expect(layout.carouselHeight).toBeGreaterThanOrEqual(640);
});
test('project portfolio explains each project and distinguishes release status', async ({ page }) => {
  await page.goto('/projects.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.mta-project-detail')).toHaveCount(4);
  for (const id of [
    'mta-net-blocker',
    'mta-video-downloader',
    'mta-university-library-collector',
    'mta-ai-video-studio'
  ]) {
    await expect(page.locator('#' + id)).toBeVisible();
    await expect(page.locator('#' + id + ' h2')).toBeVisible();
  }
  await expect(page.locator('#mta-net-blocker .mta-project-state.is-live')).toBeVisible();
  await expect(page.locator('#mta-video-downloader .mta-project-state.is-progress')).toBeVisible();
  await expect(page.locator('#mta-university-library-collector .mta-project-state.is-progress')).toBeVisible();
  await expect(page.locator('#mta-ai-video-studio .mta-project-state.is-research')).toBeVisible();
  await expect(page.locator('#mta-university-library-collector .mta-project-note')).toContainText('لا يعني');
  await expect(page.locator('#mta-ai-video-studio .mta-project-note')).toContainText('ليس وصفاً');
});
