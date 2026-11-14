const { test, expect } = require('@playwright/test');

test('marketplace loads real catalogue records and app icons', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const apiResponsePromise = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname.endsWith('/api/v1/apps') && url.searchParams.get('offset') === '0';
  }, { timeout: 90_000 });
  // Register before navigation: automatic loading can request the next page
  // as soon as the load-more sentinel enters the observer margin.
  const secondApiResponsePromise = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname.endsWith('/api/v1/apps') && url.searchParams.get('offset') === '50';
  }, { timeout: 90_000 });
  const thirdApiResponsePromise = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname.endsWith('/api/v1/apps') && url.searchParams.get('offset') === '100';
  }, { timeout: 90_000 });

  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const firstApiResponse = await apiResponsePromise;
  expect(firstApiResponse.status(), 'The catalogue API must return HTTP 200').toBe(200);

  const payload = await firstApiResponse.json();
  expect(Array.isArray(payload), 'The catalogue API must return an array').toBeTruthy();
  expect(payload.length, 'The first API page should contain app records').toBeGreaterThan(0);

  // The catalogue intentionally suppresses duplicate name/platform pairs.
  // Compare rendered cards with the unique records, not the raw API row count.
  const platformNames = {
    android: 'Android', ios: 'iOS', windows: 'Windows',
    macos: 'macOS', linux: 'Linux', web: 'Web'
  };
  const uniquePayloadCount = new Set(payload.map(app => {
    const name = String(app.app_name || app.name || '').trim().toLocaleLowerCase();
    const platform = platformNames[String(app.platform || 'Other').toLowerCase()]
      || String(app.platform || 'Other');
    return name + '|' + platform.toLocaleLowerCase();
  })).size;

  const firstBatch = page.locator('#apps-grid .app-card[data-dynamic-app="true"]');
  await expect(firstBatch.first()).toBeVisible({ timeout: 30_000 });
  const firstCount = await firstBatch.count();
  expect(firstCount, 'Every unique first-page record must be rendered').toBeGreaterThanOrEqual(uniquePayloadCount);
  await expect(firstBatch.filter({ has: page.locator('h3', { hasText: /^#WEATHER$/ }) }).first())
    .toBeVisible();

  const firstDynamicCard = firstBatch.first();
  await expect(firstDynamicCard.locator('h3')).not.toBeEmpty();
  await expect(firstDynamicCard.locator('.app-icon img, .app-icon-fallback').first()).toBeAttached();

  const sentinel = page.locator("#catalogue-sentinel");
  await expect(sentinel).toBeAttached();
  await sentinel.scrollIntoViewIfNeeded();
  const secondPageResponse = await secondApiResponsePromise;
  expect(secondPageResponse.status(), 'The second catalogue page must return HTTP 200').toBe(200);

  const secondPayload = await secondPageResponse.json();
  expect(Array.isArray(secondPayload)).toBeTruthy();
  expect(secondPayload.length, 'The second API page should contain app records').toBeGreaterThan(0);
  await expect.poll(async () => firstBatch.count(), { timeout: 30_000 })
    .toBeGreaterThan(firstCount);
  await expect(page.locator('#apps-grid .app-card[data-dynamic-app="true"] h3', { hasText: /^1Password$/ }).first())
    .toBeVisible();

  // Reach the end of the second batch. The third page must load from the
  // observer without clicking the fallback button.
  await sentinel.scrollIntoViewIfNeeded();
  const thirdPageResponse = await thirdApiResponsePromise;
  expect(thirdPageResponse.status(), 'The third catalogue page must return HTTP 200').toBe(200);
  const thirdPayload = await thirdPageResponse.json();
  expect(Array.isArray(thirdPayload)).toBeTruthy();
  expect(thirdPayload.length, 'The third API page should contain app records').toBeGreaterThan(0);
  await expect.poll(async () => firstBatch.count(), { timeout: 30_000 })
    .toBeGreaterThan(firstCount + secondPayload.length / 2);

  expect(pageErrors, 'The marketplace should not throw uncaught JavaScript errors').toEqual([]);
});

test('marketplace includes the MTA Net Blocker listing and branded icon', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#apps-grid .app-card').filter({ hasText: 'MTA Net Blocker' }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('img[alt*="MTA Net Blocker"]')).toHaveAttribute('src', /mta-net-blocker/);
});
