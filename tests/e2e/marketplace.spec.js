const { test, expect } = require('@playwright/test');

test('marketplace API is served from the same origin without contacting workers.dev', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const origin = window.location.origin;
    const [stats, first] = await Promise.all([
      fetch(origin + '/api/v1/catalog-stats', { credentials: 'same-origin', cache: 'no-store' }),
      fetch(origin + '/api/v1/apps?limit=50&offset=0', { credentials: 'same-origin', cache: 'no-store' })
    ]);
    const [statsJson, firstJson] = await Promise.all([stats.json(), first.json()]);
    return {
      origin,
      statsUrl: stats.url,
      appsUrl: first.url,
      statsStatus: stats.status,
      total: statsJson.total,
      appsStatus: first.status,
      count: firstJson.length,
      contentType: first.headers.get('content-type'),
      pageTotal: first.headers.get('x-total-count')
    };
  });
  expect(result.statsUrl.startsWith(result.origin + '/')).toBe(true);
  expect(result.appsUrl.startsWith(result.origin + '/')).toBe(true);
  expect(result.statsStatus).toBe(200);
  expect(result.total).toBeGreaterThan(0);
  expect(result.appsStatus).toBe(200);
  expect(result.count).toBeGreaterThan(0);
  expect(result.contentType).toContain('application/json');
  expect(Number(result.pageTotal)).toBe(result.total);
});

test('marketplace automatically renders successive catalogue batches through its own domain', async ({ page }) => {
  const pageErrors = [];
  const externalCatalogueRequests = [];
  const responses = new Map();
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('mta-applications-engine.hoaam100.workers.dev')) {
      externalCatalogueRequests.push(request.url());
    }
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname === '/api/v1/apps') {
      responses.set(Number(url.searchParams.get('offset')), response.status());
    }
  });
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-store-source="fdroid"]').click();
  const cards = page.locator('#apps-grid .app-card[data-dynamic-app="true"]');
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });
  const sentinel = page.locator('#catalogue-sentinel');
  for (const offset of [0, 50, 100, 150]) {
    await expect.poll(() => responses.get(offset), { timeout: 90_000 }).toBe(200);
    if (offset < 150) {
      await sentinel.scrollIntoViewIfNeeded();
      await expect.poll(async () => cards.count(), { timeout: 60_000 })
        .toBeGreaterThan((offset / 50 + 1) * 20);
    }
  }
  expect(externalCatalogueRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('marketplace includes the MTA Net Blocker listing and branded icon', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-store-source="mta-curated-web"]').click();
  const card = page.locator('#apps-grid .app-card').filter({ hasText: 'MTA Net Blocker' }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('img[alt*="MTA Net Blocker"]')).toHaveAttribute('src', /mta-net-blocker/);
});

test('public catalogue can be paginated from first record through the final record', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const origin = window.location.origin;
    const statsResponse = await fetch(origin + '/api/v1/catalog-stats', { credentials: 'same-origin', cache: 'no-store' });
    if (!statsResponse.ok) throw new Error('Catalogue stats HTTP ' + statsResponse.status);
    const stats = await statsResponse.json();
    const total = Number(stats.total);
    const pageSize = 200;
    const identities = new Set();
    let received = 0;
    const pageCounts = [];
    for (let offset = 0; offset < total; offset += pageSize) {
      const response = await fetch(origin + '/api/v1/apps?limit=' + pageSize + '&offset=' + offset, {
        credentials: 'same-origin', cache: 'no-store'
      });
      if (!response.ok) throw new Error('Catalogue page at offset ' + offset + ' returned HTTP ' + response.status);
      const rows = await response.json();
      const headerTotal = Number(response.headers.get('x-total-count'));
      if (!Number.isFinite(headerTotal) || headerTotal !== total) {
        throw new Error('Pagination total header mismatch at offset ' + offset + ': ' + response.headers.get('x-total-count'));
      }
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Unexpected empty catalogue page at offset ' + offset);
      }
      for (const row of rows) {
        const key = String(row.source) + '|' + String(row.external_id);
        if (identities.has(key)) throw new Error('Duplicate catalogue identity: ' + key);
        identities.add(key);
      }
      received += rows.length;
      pageCounts.push(rows.length);
    }
    return { total, received, unique: identities.size, pages: pageCounts.length, lastPageCount: pageCounts.at(-1) };
  });
  expect(result.received).toBe(result.total);
  expect(result.unique).toBe(result.total);
  expect(result.pages).toBe(Math.ceil(result.total / 200));
});

test('store picker requests and displays only the selected catalogue source', async ({ page }) => {
  const sourceRequests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/apps') sourceRequests.push(url.searchParams.get('source'));
  });
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#store-picker')).toBeVisible();
  await expect(page.locator('#catalogue-view')).toBeHidden();
  await page.locator('[data-store-source="fdroid"]').click();
  await expect(page.locator('#catalogue-view')).toBeVisible();
  await expect(page.locator('#store-picker')).toBeHidden();
  await expect.poll(() => sourceRequests.includes('fdroid'), { timeout: 30_000 }).toBe(true);
  const cards = page.locator('#apps-grid .app-card[data-dynamic-app="true"]');
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => cards.first().getAttribute('data-source')).toBe('fdroid');
  await page.locator('#store-back').click();
  await expect(page.locator('#store-picker')).toBeVisible();
  await expect(page.locator('#catalogue-view')).toBeHidden();
});


test('newly connected public catalogues are available in the store picker', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  for (const source of ['izzyondroid', 'snap-store', 'apple-macos', 'steam']) {
    const store = page.locator('[data-store-source="' + source + '"]');
    await expect(store).toHaveCount(1);
    await expect(store.locator('[data-source-count="' + source + '"]')).toHaveCount(1);
  }
});
