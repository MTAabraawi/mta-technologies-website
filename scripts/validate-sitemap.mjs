import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const origin = "https://www.mtahqq.dpdns.org";
const xml = readFileSync("sitemap.xml", "utf8");
const robots = readFileSync("robots.txt", "utf8");

assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.match(xml, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(urls.length, 15, "Sitemap should contain exactly the 15 indexable corporate pages");
assert.equal(new Set(urls).size, urls.length, "Sitemap must not contain duplicate URLs");

for (const value of urls) {
  const url = new URL(value);
  assert.equal(url.origin, origin, `Unexpected sitemap host: ${value}`);
  assert.equal(url.search, "", `Query-string URLs must not be listed: ${value}`);
  assert.equal(url.hash, "", `Fragment URLs must not be listed: ${value}`);
  assert.equal(url.protocol, "https:", `HTTPS is required: ${value}`);

  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1) + ".html";
  const html = readFileSync(file, "utf8");
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  assert.ok(canonical, `Missing canonical tag in ${file}`);
  assert.equal(canonical[1], value, `Sitemap and canonical URL differ for ${file}`);
}

const requiredPages = [
  "/", "/about", "/projects", "/innovation", "/knowledge", "/gallery",
  "/contact", "/apps", "/app-mta-net-blocker", "/privacy-policy",
  "/terms", "/disclaimer", "/cookies", "/data-subject-rights", "/suggestions"
];
for (const path of requiredPages) {
  assert.ok(urls.includes(origin + path), `Required page missing from sitemap: ${path}`);
}

assert.match(robots, /^User-agent:\s*\*\s*\nAllow:\s*\/\s*$/m);
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`), "robots.txt must advertise the canonical root sitemap");
assert.ok(!robots.includes("/sitemap.xml/"), "Sitemap URL must not end with a slash");

console.log(`Sitemap validation passed: ${urls.length} canonical URLs, no query strings or duplicates.`);
