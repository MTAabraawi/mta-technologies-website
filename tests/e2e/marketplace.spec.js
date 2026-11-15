const { test, expect } = require('@playwright/test');

const API = 'https://mta-applications-engine.hoaam100.workers.dev';

test('public catalogue API is readable cross-origin and exposes pagination metadata', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async api => {
    const [health, stats, first] = await Promise.all([
      fetch(api + '/health', { credentials: 'omit', cache: 'no-store' }),
      fetch(api + '/api/v1/catalog-stats', { credentials: 'omit', cache: 'no-store' }),
      fetch(api + '/api/v1/apps?limit=50&offset=0', { credentials: 'omit', cache: 'no-store' })
    ]);
    const [healthJson, statsJson, firstJson] = await Promise.all([
      health.json(), stats.json(), first.json()
    ]);
    return {
      healthStatus: health.status, health: healthJson,
      statsStatus: stats.status, total: statsJson.total,
      appsStatus: first.status, count: firstJson.length,
      contentType: first.headers.get('content-type'),
      pageTotal: first.headers.get('x-total-count'),
      expose: first.headers.get('access-control-expose-headers')
    };
  }, API);
  expect(result.healthStatus).toBe(200);
  expect(result.health.status).toBe('ok');
  expect(result.statsStatus).toBe(200);
  expect(result.total).toBeGreaterThan(0);
  expect(result.appsStatus).toBe(200);
  expect(result.count).toBeGreaterThan(0);
  expect(result.contentType).toContain('application/json');
  expect(Number(result.pageTotal)).toBe(result.total);
  // The pagination header itself must be readable by browser JavaScript; the
  // Access-Control-Expose-Headers response header need not expose itself.
});

test('marketplace automatically renders successive catalogue batches', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const responses = new Map();
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.endsWith('/api/v1/apps')) {
      responses.set(Number(url.searchParams.get('offset')), response.status());
    }
  });
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
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
  expect(pageErrors).toEqual([]);
});

test('marketplace includes the MTA Net Blocker listing and branded icon', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#apps-grid .app-card').filter({ hasText: 'MTA Net Blocker' }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('img[alt*="MTA Net Blocker"]')).toHaveAttribute('src', /mta-net-blocker/);
});

test('public catalogue can be paginated from first record through the final record', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async api => {
    const statsResponse = await fetch(api + '/api/v1/catalog-stats', { credentials: 'omit', cache: 'no-store' });
    if (!statsResponse.ok) throw new Error('Catalogue stats HTTP ' + statsResponse.status);
    const stats = await statsResponse.json();
    const total = Number(stats.total);
    const pageSize = 200;
    const identities = new Set();
    let received = 0;
    const pageCounts = [];
    for (let offset = 0; offset < total; offset += pageSize) {
      const response = await fetch(api + '/api/v1/apps?limit=' + pageSize + '&offset=' + offset, {
        credentials: 'omit', cache: 'no-store'
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
  }, API);
  expect(result.received).toBe(result.total);
  expect(result.unique).toBe(result.total);
  expect(result.pages).toBe(Math.ceil(result.total / 200));
});
