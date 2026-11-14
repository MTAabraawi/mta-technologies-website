const { test, expect } = require('@playwright/test');

test('marketplace loads real catalogue records and app icons', async ({ page }) => {
  const pageErrors = [];
  const catalogueResponses = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/api/v1/apps')) catalogueResponses.push(response);
  });

  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#apps-grid .app-card[data-dynamic-app="true"]').first()).toBeVisible({ timeout: 90_000 });

  const firstBatch = page.locator('#apps-grid .app-card[data-dynamic-app="true"]');
  const firstCount = await firstBatch.count();
  expect(firstCount).toBeGreaterThan(0);

  const firstApiResponse = catalogueResponses.find(response => new URL(response.url()).searchParams.get('offset') === '0');
  expect(firstApiResponse, 'The first catalogue API request should be observed').toBeTruthy();
  expect(firstApiResponse.status()).toBe(200);

  const firstDynamicCard = firstBatch.first();
  await expect(firstDynamicCard.locator('h3')).not.toBeEmpty();
  await expect(firstDynamicCard.locator('.app-icon img, .app-icon-fallback').first()).toBeAttached();

  const moreButton = page.locator('#load-more-apps');
  await expect(moreButton).toBeVisible({ timeout: 20_000 });
  await expect(moreButton).toBeEnabled();
  await moreButton.click();

  await expect.poll(async () => firstBatch.count(), { timeout: 60_000 }).toBeGreaterThan(firstCount);
  const secondPageResponse = catalogueResponses.find(response => new URL(response.url()).searchParams.get('offset') === '24');
  expect(secondPageResponse, 'Clicking Load More should request the next offset').toBeTruthy();
  expect(secondPageResponse.status()).toBe(200);

  expect(pageErrors, 'The marketplace should not throw uncaught JavaScript errors').toEqual([]);
});

test('marketplace includes the MTA Net Blocker listing and branded icon', async ({ page }) => {
  await page.goto('/apps.html', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#apps-grid .app-card').filter({ hasText: 'MTA Net Blocker' }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('img[alt*="MTA Net Blocker"]')).toHaveAttribute('src', /mta-net-blocker/);
});
