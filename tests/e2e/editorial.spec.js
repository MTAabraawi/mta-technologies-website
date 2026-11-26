const { test, expect } = require('@playwright/test');

const existingSlugs = ["ai-agents-security-governance","ai-developments-november-2026","android-app-permissions-guide","browser-privacy-tracking","choose-ai-tools-evaluate","detect-ai-generated-media","password-managers-passkeys","safe-apk-download-verification","telegram-secret-cloud-chats-explained","verify-website-trustworthiness","whatsapp-end-to-end-encrypted-backups"];
const newSlugs = ["google-photos-free-up-space","google-drive-secure-sharing","android-private-space-guide","qr-code-scams-safety","google-admob-ai-tools-publishers","android-theft-protection-guide","google-maps-offline-maps-guide","cloudflare-one-one-one-one-warp-guide","powertoys-advanced-paste-guide","gemini-skills-gems-transition-guide","gemini-notebook-notebooklm-research-guide","obs-studio-screen-recording-streaming-guide","windows-sandbox-safe-app-testing-guide","github-codespaces-practical-guide-cost-control","windows-quick-assist-safe-remote-support"];
const allSlugs = [...existingSlugs, ...newSlugs];

function wordCount(section) {
  return section.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').split(/\s+/).filter(Boolean).length;
}

test('editorial collection cards, CollectionPage schema, and sitemap agree', async ({ page }) => {
  await page.goto('/articles.html');
  const cards = page.locator('.editorial-card');
  await expect(cards).toHaveCount(26);
  const hrefs = await cards.evaluateAll(nodes => nodes.map(node => node.querySelector('a')?.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(26);
  expect(hrefs.every(href => href && href.startsWith('articles/'))).toBe(true);
  const metaTexts = await page.locator('.editorial-meta').allTextContents();
  expect(metaTexts.every(value => !value.includes('undefined'))).toBe(true);
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  const collection = JSON.parse(jsonLd);
  expect(collection['@type']).toBe('CollectionPage');
  expect(collection.hasPart).toHaveLength(26);
  expect(new Set(collection.hasPart.map(item => item.url)).size).toBe(26);

  const [articleMap, storeMap, index] = await Promise.all([
    page.request.get('/sitemap-articles.xml'),
    page.request.get('/sitemap.xml'),
    page.request.get('/sitemap-index.xml')
  ]);
  expect(articleMap.ok()).toBeTruthy();
  expect(storeMap.ok()).toBeTruthy();
  expect(index.ok()).toBeTruthy();
  const articleXml = await articleMap.text();
  const storeXml = await storeMap.text();
  const indexXml = await index.text();
  expect((articleXml.match(/<url>/g) || []).length).toBe(26);
  expect(articleXml).toContain('/articles/google-admob-ai-tools-publishers');
  expect(articleXml).toContain('/articles/gemini-skills-gems-transition-guide');
  expect(articleXml).toContain('/articles/gemini-notebook-notebooklm-research-guide');
  expect(articleXml).toContain('/articles/obs-studio-screen-recording-streaming-guide');
  expect(articleXml).toContain('/articles/windows-sandbox-safe-app-testing-guide');
  expect(articleXml).toContain('/articles/github-codespaces-practical-guide-cost-control');
  expect(articleXml).toContain('/articles/windows-quick-assist-safe-remote-support');
  expect((storeXml.match(/<url>/g) || []).length).toBe(12);
  expect(indexXml).toContain('sitemap-pages.xml');
  expect(indexXml).toContain('sitemap-articles.xml');
  expect(indexXml).toContain('sitemap.xml');
});

test('all editorial pages contain substantial Arabic and English editions, sources, and Article metadata', async ({ page }) => {
  for (const slug of allSlugs) {
    const response = await page.request.get('/articles/' + slug);
    expect(response.ok(), slug + ' should return HTTP 200').toBeTruthy();
    const html = await response.text();
    const ar = html.match(/<article class="article-language" lang="ar"[\s\S]*?<\/article>/i)?.[0] || '';
    const en = html.match(/<article class="article-language" lang="en"[\s\S]*?<\/article>/i)?.[0] || '';
    expect(wordCount(ar), slug + ' Arabic edition').toBeGreaterThan(180);
    expect(wordCount(en), slug + ' English edition').toBeGreaterThan(180);
    expect((html.match(/<section>/g) || []).length).toBeGreaterThanOrEqual(10);
    expect((html.match(/class="article-sources"/g) || []).length).toBe(1);
    const sourceAside = html.match(/<aside class="article-sources"[\s\S]*?<\/aside>/i)?.[0] || '';
    expect((sourceAside.match(/href="https:\/\//g) || []).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('"datePublished"');
    expect(html).toContain('"dateModified"');
    if (newSlugs.includes(slug)) expect(html).toContain('Last updated');
  }
});

test('the fifteen newly added articles meet the expanded bilingual depth threshold', async ({ page }) => {
  for (const slug of newSlugs) {
    const response = await page.request.get('/articles/' + slug);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    const ar = html.match(/<article class="article-language" lang="ar"[\s\S]*?<\/article>/i)?.[0] || '';
    const en = html.match(/<article class="article-language" lang="en"[\s\S]*?<\/article>/i)?.[0] || '';
    expect(wordCount(ar), slug + ' Arabic depth').toBeGreaterThan(400);
    expect(wordCount(en), slug + ' English depth').toBeGreaterThan(400);
    expect((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length).toBeGreaterThanOrEqual(2);
  }
});

test('new editorial pages remain usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of newSlugs) {
    await page.goto('/articles/' + slug);
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      article: document.querySelector('.article-wrap')?.getBoundingClientRect().width || 0
    }));
    expect(dimensions.document, slug + ' horizontal overflow').toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.article, slug + ' article width').toBeLessThanOrEqual(dimensions.viewport);
  }
});
