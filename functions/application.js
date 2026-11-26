const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const STORE_NAMES = {
  "google-play":"Google Play","fdroid":"F-Droid","izzyondroid":"IzzyOnDroid","apple-app-store":"Apple App Store",
  "mac-app-store":"Mac App Store","winget":"WinGet","chocolatey":"Chocolatey","bluejetty-app-index":"Blue Jetty App Index","openuse":"OpenUse","flathub":"Flathub",
  "snap-store":"Snap Store","arch-linux":"Arch Linux Packages",
  "debian-packages":"Debian Packages","homebrew":"Homebrew Cask",
  "steam":"Steam","mta-web-apps":"MTA Web Apps",
  "fedora-packages":"Fedora Packages","firefox-addons":"Firefox Add-ons",
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
function metaProperty(html, property, value) {
  const tag = '<meta property="' + property + '" content="' + esc(value) + '">';
  const re = new RegExp('<meta\\s+property="' + property + '"[^>]*>', "i");
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", tag + "</head>");
}
function snippet(value, maximum = 155) {
  const clean = String(value || "").replace(/\\s+/g, " ").trim();
  if (clean.length <= maximum) return clean;
  const boundary = clean.lastIndexOf(" ", maximum - 1);
  return clean.slice(0, boundary > 100 ? boundary : maximum).replace(/[،,;:–—-]+$/, "").trim();
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
  if (store) canonicalParams.set("store", store);
  if (id) canonicalParams.set("id", id);
  if (name) canonicalParams.set("name", name);
  const canonicalUrl = canonicalOrigin + "/application" + (canonicalParams.size ? "?" + canonicalParams.toString() : "");
  const engine = (context.env && context.env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
  try {
    if (!source || !id || !name) throw new Error("Missing app reference");
    const api = new URL("/api/v1/apps", engine);
    api.searchParams.set("source", source);
    api.searchParams.set("q", name);
    api.searchParams.set("limit", "200");
    const upstream = await fetch(api, { headers: { accept: "application/json" }, cf: { cacheTtl: 0 } });
    if (!upstream.ok) throw new Error("Application API HTTP " + upstream.status);
    const rows = await upstream.json();
    if (!Array.isArray(rows)) throw new Error("Invalid application response");
    const app = rows.find(row => String(row.external_id || row.id || "") === id);
    if (!app) throw new Error("Application not found");
    const title = String(app.name || name);
    const sourceDescription = [app.summary, app.description].find(value => typeof value === "string" && value.trim().length >= 40) || "";
    const hasSubstantiveContent = Boolean(sourceDescription);
    const summary = String(sourceDescription || "لم يوفر مصدر البيانات وصفاً كافياً لهذا التطبيق بعد. راجع صفحة المصدر الأصلية للتحقق من التفاصيل.").slice(0, 500);
    const metaDescription = snippet(summary);
    const description = String(app.description || app.summary || "لا تتوفر تفاصيل وصفية كافية للفهرسة حالياً. راجع صفحة المصدر الأصلية للحصول على المعلومات المحدثة.").slice(0, 5000);
    const pageTitle = title + " | " + (STORE_NAMES[store] || "Application Directory") + " | MTA TECHNOLOGIES";
    html = html.replace(/<title>[^<]*<\/title>/i, "<title>" + esc(pageTitle) + "</title>");
    html = meta(html, "description", metaDescription);
    html = metaProperty(html, "og:title", pageTitle);
    html = metaProperty(html, "og:description", metaDescription);
    html = meta(html, "robots", hasSubstantiveContent ? "index,follow" : "noindex,follow");
    html = canonical(html, canonicalUrl);
    html = setIdText(html, "application-name", title);
    html = setIdText(html, "application-breadcrumb", title);
    html = setIdText(html, "application-byline", [app.developer, app.platform, app.category].filter(Boolean).join(" · "));
    html = setIdText(html, "application-summary", summary);
    html = setIdText(html, "application-description", description);
    html = setIdText(html, "application-platform-guidance", "تحقق من متطلبات النظام والتوافق وهوية الناشر والترخيص والأذونات قبل تثبيت التطبيق. قد تختلف الإتاحة حسب البلد والجهاز.");
    html = setIdText(html, "application-data-quality", "تعرض هذه الصفحة الحقول التي وفرها مصدر البيانات فقط. الحقول غير المتاحة لا تُعرض كحقائق مؤكدة؛ راجع صفحة الناشر للتحقق من أحدث المعلومات.");
    html = setIdText(html, "application-store-link", STORE_NAMES[store] || store);
    const sourceUrl = safe(app.source_url || app.app_url);
    if (sourceUrl) {
      html = html.replace('<a id="application-source-link" class="btn btn-primary" href="#" target="_blank" rel="noopener noreferrer" hidden>',
        '<a id="application-source-link" class="btn btn-primary" href="' + esc(sourceUrl) + '" target="_blank" rel="noopener noreferrer">');
    }
    const storeHref = "store?store=" + encodeURIComponent(store);
    html = html.replace('<a id="application-store-link" href="apps.html">', '<a id="application-store-link" href="' + esc(storeHref) + '">');
    html = html.replace('<a id="application-back-link" class="btn btn-outline" href="apps.html">', '<a id="application-back-link" class="btn btn-outline" href="' + esc(storeHref) + '">');
    const facts = [
      ["المطور",app.developer],["المنصة",app.platform],["التصنيف",app.category],
      ["الترخيص",app.license],["مصدر البيانات",app.source || source],["معرّف المصدر",app.external_id || app.id]
    ].filter(pair => pair[1] != null && String(pair[1]).trim() !== "");
    html = setIdHtml(html, "application-facts", facts.map(pair => "<dt>"+esc(pair[0])+"</dt><dd>"+esc(pair[1])+"</dd>").join(""));
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
    if (hasSubstantiveContent) {
      const schema = {
      "@context":"https://schema.org","@type":"SoftwareApplication",
      "name":title,"description":metaDescription,"url":canonicalUrl,
      "operatingSystem":String(app.platform || "Unspecified"),
      "applicationCategory":String(app.category || "Software"),
      "publisher":app.developer ? {"@type":"Organization","name":String(app.developer)} : undefined,
      "image":icon || undefined,
      "sameAs":sourceUrl || undefined
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
