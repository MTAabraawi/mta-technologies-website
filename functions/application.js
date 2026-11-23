const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const STORE_NAMES = {
  "google-play":"Google Play","fdroid":"F-Droid","izzyondroid":"IzzyOnDroid","apple-app-store":"Apple App Store",
  "mac-app-store":"Mac App Store","winget":"WinGet","chocolatey":"Chocolatey","bluejetty-app-index":"Blue Jetty App Index","openuse":"OpenUse","flathub":"Flathub",
  "snap-store":"Snap Store","arch-linux":"Arch Linux Packages",
  "debian-packages":"Debian Packages","homebrew":"Homebrew Cask",
  "steam":"Steam","mta-web-apps":"MTA Web Apps",
  "open-vsx":"Open VSX Registry","fedora-packages":"Fedora Packages","firefox-addons":"Firefox Add-ons",
  "wordpress-plugins":"WordPress Plugin Directory","homebrew-formulae":"Homebrew Formulae",
  "scoop":"Scoop Buckets","gnome-extensions":"GNOME Shell Extensions",
  "alpine-linux":"Alpine Linux Packages","jetbrains-marketplace":"JetBrains Marketplace"
};
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}
function safe(value) {
  try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; }
  catch { return ""; }
}
function meta(html, name, value) {
  const tag = '<meta name="' + name + '" content="' + esc(value) + '">';
  const re = new RegExp('<meta\\s+name="' + name + '"[^>]*>', "i");
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", tag + "</head>");
}
function canonical(html, url) {
  const tag = '<link rel="canonical" href="' + esc(url) + '">';
  const re = /<link\s+rel=["']canonical["'][^>]*>/i;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", tag + "</head>");
}
function replaceInner(html, id, value) {
  const opening = new RegExp('<([a-z][a-z0-9:-]*)\\b(?=[^>]*\\bid="' + id + '")[^>]*>', "i");
  const match = opening.exec(html);
  if (!match) return html;
  const tag = match[1];
  const contentStart = match.index + match[0].length;
  const token = new RegExp("<\\/?"+tag+"\\b[^>]*>", "gi");
  token.lastIndex = match.index;
  let depth = 0, closeStart = -1, item;
  while ((item = token.exec(html))) {
    if (item[0].startsWith("</")) depth--;
    else if (!item[0].endsWith("/>")) depth++;
    if (depth === 0) { closeStart = item.index; break; }
  }
  if (closeStart < 0) return html;
  return html.slice(0, contentStart) + value + html.slice(closeStart);
}
function setIdText(html, id, value) {
  return replaceInner(html, id, esc(value));
}
function setIdHtml(html, id, value) {
  return replaceInner(html, id, value);
}
async function fetchJsonWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" }, cf: { cacheTtl: 0 } });
      if (response.ok) return await response.json();
      lastError = new Error("Application API HTTP " + response.status);
      if (response.status < 500 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === 2 || (error && /^Application API HTTP 4/.test(error.message || "") && !/429/.test(error.message || ""))) throw error;
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw lastError || new Error("Application API unavailable");
}
export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  if (url.pathname !== "/application" && url.pathname !== "/application.html") return response;
  let html = await response.text();
  const source = url.searchParams.get("source") || "";
  const store = url.searchParams.get("store") || source;
  const id = url.searchParams.get("id") || "";
  const name = url.searchParams.get("name") || "";
  const canonicalOrigin = (context.env && context.env.MTA_SITE_ORIGIN) || "https://www.mtahqq.dpdns.org";
  const canonicalParams = new URLSearchParams();
  if (source) canonicalParams.set("source", source);
  if (id) canonicalParams.set("id", id);
  const canonicalUrl = canonicalOrigin + "/application" + (canonicalParams.size ? "?" + canonicalParams.toString() : "");
  const engine = (context.env && context.env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
  try {
    if (!source || !id) throw new Error("Missing app source or exact identifier");
    const api = new URL("/api/v1/apps", engine);
    api.searchParams.set("source", source);
    api.searchParams.set("external_id", id);
    const rows = await fetchJsonWithRetry(api);
    if (!Array.isArray(rows)) throw new Error("Invalid application response");
    const app = rows.find(row => String(row.external_id || row.id || "") === id);
    if (!app) throw new Error("Application not found");
    const title = String(app.name || name || "Application");
    const summary = String(app.summary || app.description || "Application details and source information from the MTA directory.").slice(0, 500);
    const description = String(app.description || app.summary || "Review the original publisher listing for current application details.").slice(0, 5000);
    const usefulDescription = [app.summary, app.description].some(value => typeof value === "string" && value.trim().length >= 40);
    const pageTitle = title + " | " + (STORE_NAMES[store] || "Application Directory") + " | MTA TECHNOLOGIES";
    html = html.replace(/<title>[^<]*<\/title>/i, "<title>" + esc(pageTitle) + "</title>");
    html = meta(html, "description", summary);
    html = meta(html, "robots", usefulDescription ? "index,follow" : "noindex,follow");
    html = canonical(html, canonicalUrl);
    html = setIdText(html, "application-name", title);
    html = setIdText(html, "application-breadcrumb", title);
    html = setIdText(html, "application-byline", [app.developer, app.platform, app.category].filter(Boolean).join(" · "));
    html = setIdText(html, "application-summary", summary);
    html = setIdText(html, "application-description", description);
    html = setIdHtml(html, "application-platform-guidance", '<span class="ar-only">تحقق من متطلبات النظام والتوافق وهوية الناشر والترخيص والأذونات قبل تثبيت التطبيق. قد تختلف الإتاحة حسب البلد والجهاز.</span><span class="en-only">Check system requirements, compatibility, publisher identity, licence and permissions before installing. Availability may vary by country and device.</span>');
    html = setIdHtml(html, "application-data-quality", '<span class="ar-only">تعرض هذه الصفحة الحقول التي وفرها مصدر البيانات فقط. الحقول غير المتاحة لا تُعرض كحقائق مؤكدة؛ راجع صفحة الناشر للتحقق من أحدث المعلومات.</span><span class="en-only">This page shows only fields supplied by the data source. Missing fields are not presented as facts; check the publisher listing for the latest information.</span>');
    html = setIdText(html, "application-store-link", STORE_NAMES[store] || store);
    const sourceUrl = safe(app.source_url || app.app_url);
    if (sourceUrl) {
      html = html.replace('<a id="application-source-link" class="btn btn-primary" href="#" target="_blank" rel="noopener noreferrer" hidden>',
        '<a id="application-source-link" class="btn btn-primary" href="' + esc(sourceUrl) + '" target="_blank" rel="noopener noreferrer">');
    }
    const storeHref = "store?store=" + encodeURIComponent(store);
    html = html.replace('<a id="application-store-link" href="apps.html">', '<a id="application-store-link" href="' + esc(storeHref) + '">');
    html = html.replace('<a id="application-back-link" class="btn btn-outline" href="apps.html">', '<a id="application-back-link" class="btn btn-outline" href="' + esc(storeHref) + '">');
    const metadata = app.metadata_json && typeof app.metadata_json === "object" ? app.metadata_json : {};
    const facts = [["المطور","Developer",app.developer],["المنصة","Platform",app.platform],["التصنيف","Category",app.category],["الترخيص","Licence",app.license],["الإصدار","Version",metadata.version || metadata.versionString],["معرّف الحزمة","Package identifier",metadata.package_name || metadata.bundle_id],["الحد الأدنى لإصدار Android","Minimum Android version",metadata.minSdkVersion],["الحجم بالبايت","Size (bytes)",metadata.size_bytes],["آخر تحديث للسجل","Catalogue record updated",app.updated_at],["مصدر البيانات","Data source",app.source || source],["معرّف المصدر","Source identifier",app.external_id || app.id]].filter(pair => pair[2] != null && String(pair[2]).trim() !== "");
    html = setIdHtml(html, "application-facts", facts.map(pair => '<dt><span class="ar-only">'+esc(pair[0])+'</span><span class="en-only">'+esc(pair[1])+'</span></dt><dd>'+esc(pair[2])+'</dd>').join(""));
    const icon = safe(app.icon_url);
    if (icon) {
      html = html.replace('<img id="application-icon" alt="" hidden>',
        '<img id="application-icon" src="' + esc(icon) + '" alt="' + esc(title) + ' icon" loading="lazy" decoding="async">');
      html = html.replace('<span id="application-icon-fallback" class="store-app-icon-fallback">MTA</span>', '<span id="application-icon-fallback" class="store-app-icon-fallback" hidden>MTA</span>');
    } else {
      const initials = title.trim().split(/\s+/).slice(0,2).map(part => part[0] || "").join("").toUpperCase();
      html = html.replace('<span id="application-icon-fallback" class="store-app-icon-fallback">MTA</span>',
        '<span id="application-icon-fallback" class="store-app-icon-fallback">' + esc(initials) + '</span>');
    }
    if (usefulDescription) {
      const schema = {
      "@context":"https://schema.org","@type":"SoftwareApplication",
      "name":title,"description":summary,"url":canonicalUrl,
      "operatingSystem":String(app.platform || "Unspecified"),
      "applicationCategory":String(app.category || "Software"),
      "publisher":app.developer ? {"@type":"Organization","name":String(app.developer)} : undefined,
      "softwareVersion":metadata.version || metadata.versionString || undefined,
      "dateModified":app.updated_at || undefined,
      "image":icon || undefined,
      "sameAs":sourceUrl || undefined,
      "inLanguage":["ar","en"]
    };
      const json = '<script type="application/ld+json" id="application-ssr-schema">' + JSON.stringify(schema).replace(/</g,"\\u003c") + "</script>";
      html = html.replace("</head>", json + "</head>");
    }
  } catch (error) {
    console.error("MTA application SSR failed:", error);
    html = meta(html, "robots", "noindex,follow");
    html = canonical(html, canonicalUrl);
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length"); headers.delete("etag");
  headers.set("content-type","text/html; charset=utf-8");
  headers.set("cache-control","public, max-age=60, s-maxage=60");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
