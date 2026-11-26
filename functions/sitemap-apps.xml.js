const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const PAGE_SIZE = 200;
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

function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function lastModified(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
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

  const url = new URL(request.url);
  const source = (url.searchParams.get("source") || "").trim().toLowerCase();
  const store = SOURCE_TO_STORE[source];
  const offset = Number(url.searchParams.get("offset") || 0);
  if (!store || !Number.isSafeInteger(offset) || offset < 0 || offset % PAGE_SIZE !== 0) {
    return xmlResponse("Invalid catalogue sitemap page.", 400, "no-store");
  }

  const engineOrigin = (env && env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
  const siteOrigin = ((env && env.MTA_SITE_ORIGIN) || "https://www.mtahqq.dpdns.org").replace(/\/$/, "");
  const appsUrl = new URL("/api/v1/apps", engineOrigin);
  appsUrl.searchParams.set("source", source);
  appsUrl.searchParams.set("limit", String(PAGE_SIZE));
  appsUrl.searchParams.set("offset", String(offset));

  let appsResponse;
  try {
    appsResponse = await fetch(appsUrl, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 900, cacheEverything: true }
    });
  } catch {
    return xmlResponse("Catalogue records are temporarily unavailable.", 503, "no-store");
  }
  if (!appsResponse.ok) return xmlResponse("Catalogue records are temporarily unavailable.", 503, "no-store");

  let apps;
  try {
    apps = await appsResponse.json();
  } catch {
    return xmlResponse("Catalogue records returned invalid data.", 502, "no-store");
  }
  if (!Array.isArray(apps)) return xmlResponse("Catalogue records returned an invalid format.", 502, "no-store");

  const locations = [];
  for (const app of apps) {
    const name = String(app.name || "").trim();
    const externalId = String(app.external_id ?? app.id ?? "").trim();
    const description = [app.summary, app.description].find(value =>
      typeof value === "string" && value.trim().length >= 40
    );
    const originalUrl = safeHttps(app.source_url || app.app_url);
    if (!name || !externalId || !description || !originalUrl) continue;

    const params = new URLSearchParams();
    params.set("source", source);
    params.set("store", store);
    params.set("id", externalId);
    params.set("name", name);
    const applicationUrl = siteOrigin + "/application?" + params.toString();
    const modified = lastModified(app.updated_at || app.first_seen_at);
    locations.push("<url><loc>" + xmlEscape(applicationUrl) + "</loc>" +
      (modified ? "<lastmod>" + modified + "</lastmod>" : "") +
      "</url>");
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    locations.join("") +
    "</urlset>";
  return xmlResponse(xml, 200, "public, max-age=900, s-maxage=3600");
}
