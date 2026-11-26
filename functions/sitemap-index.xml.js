const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const PAGE_SIZE = 200;
const MAX_SITEMAP_ENTRIES = 50000;
const SOURCE_TO_STORE = {
  "apple-itunes": "apple-app-store",
  "apple-macos": "mac-app-store",
  "winget-run-community": "winget",
  "flathub": "flathub",
  "arch-linux": "arch-linux",
  "debian-packages": "debian-packages",
  "fdroid": "fdroid",
  "izzyondroid": "izzyondroid",
  "steam": "steam",
  "mta-curated-web": "mta-web-apps"
};

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  }[character]));
}

function xmlResponse(xml, status, cacheControl) {
  return new Response(xml, {
    status,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": cacheControl
    }
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  const engineOrigin = (env && env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
  const siteOrigin = ((env && env.MTA_SITE_ORIGIN) || "https://www.mtahqq.dpdns.org").replace(/\/$/, "");
  let statsResponse;
  try {
    statsResponse = await fetch(new URL("/api/v1/catalog-stats", engineOrigin), {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 900, cacheEverything: true }
    });
  } catch {
    return xmlResponse("Catalogue statistics are temporarily unavailable.", 503, "no-store");
  }
  if (!statsResponse.ok) return xmlResponse("Catalogue statistics are temporarily unavailable.", 503, "no-store");

  let stats;
  try {
    stats = await statsResponse.json();
  } catch {
    return xmlResponse("Catalogue statistics returned invalid data.", 502, "no-store");
  }

  // A sitemap index must point directly to URL-set sitemaps. Never reference
  // sitemap-apps-index.xml here because that endpoint is itself a sitemap index.
  const entries = [
    "<sitemap><loc>" + xmlEscape(siteOrigin + "/sitemap.xml") + "</loc></sitemap>"
  ];
  for (const source of Object.keys(SOURCE_TO_STORE)) {
    const total = Math.max(0, Number((stats.sources || {})[source] || 0));
    if (!Number.isFinite(total) || total <= 0) continue;
    const quality = stats.quality?.sources?.[source]?.fields;
    const describedRecords = Number(quality?.summary?.present || 0) + Number(quality?.description?.present || 0);
    if (quality && describedRecords <= 0) continue;

    const pageCount = Math.ceil(total / PAGE_SIZE);
    for (let page = 0; page < pageCount && entries.length < MAX_SITEMAP_ENTRIES; page++) {
      const sitemapUrl = new URL("/sitemap-apps.xml", siteOrigin);
      sitemapUrl.searchParams.set("source", source);
      sitemapUrl.searchParams.set("offset", String(page * PAGE_SIZE));
      entries.push("<sitemap><loc>" + xmlEscape(sitemapUrl.toString()) + "</loc></sitemap>");
    }
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    entries.join("") +
    "</sitemapindex>";
  return xmlResponse(xml, 200, "public, max-age=900, s-maxage=3600");
}
