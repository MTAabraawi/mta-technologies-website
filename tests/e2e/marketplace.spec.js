const { test, expect } = require('@playwright/test');

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
  await expect(cards).toHaveCount(44);
  for (const card of await cards.all()) {
    const href = await card.getAttribute('href');
    expect(href).toMatch(/^store\.html\?store=/);
    await expect(card).not.toHaveAttribute('target', '_blank');
  }
});

test('F-Droid opens an internal branded catalogue and displays indexed applications', async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/apps') requests.push(url);
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-store-key="fdroid"]').click();
  await expect(page).toHaveURL(/store\.html\?store=fdroid/);
  await expect(page.locator('#store-title')).toHaveText('F-Droid');
  await expect(page.locator('#store-logo')).toBeVisible();
  await expect(page.locator('.store-app-card').first()).toBeVisible({ timeout: 60_000 });
  await expect.poll(() => requests.some(url => url.searchParams.get('source') === 'fdroid')).toBe(true);
  expect(errors).toEqual([]);
});

test('external-only stores show an internal store profile before offering the original catalogue', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-store-key="google-play"]').click();
  await expect(page).toHaveURL(/store\.html\?store=google-play/);
  await expect(page.locator('#store-title')).toHaveText('Google Play');
  await expect(page.locator('#store-unavailable')).toBeVisible();
  await expect(page.locator('#store-unavailable-link')).toHaveAttribute('href', 'https://play.google.com/store');
  await expect(page.locator('#store-unavailable-link')).toHaveAttribute('target', '_blank');
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
  await expect(page.locator('[data-source-count="fdroid"]')).toContainText(/4,?996/);
  await expect(page.locator('[data-source-count="flathub"]')).toContainText(/1,?000/);
  await expect(page.locator('[data-source-count="homebrew-cask"]')).toContainText(/7,?834/);
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
