const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const CONNECTED_STORES = {
  "fdroid": { name: "F-Droid", source: "fdroid", platforms: ["Android"], description: "مستودع تطبيقات Android الحرة ومفتوحة المصدر. تعرض هذه الصفحة سجلات الحزم المتاحة من فهرس F-Droid، مع معلومات الترخيص وروابط المشروع عندما يوفرها المصدر." },
  "izzyondroid": { name: "IzzyOnDroid", source: "izzyondroid", platforms: ["Android"], description: "مستودع إضافي لتطبيقات Android الحرة. نفصل سجلاته عن المستودعات الأخرى ونوضح مصدر كل تطبيق وروابطه الأصلية." },
  "apple-app-store": { name: "Apple App Store", source: "apple-itunes", platforms: ["iOS", "iPadOS"], description: "دليل نتائج تطبيقات Apple المتاحة عبر فهرس البحث العام. قد تختلف النتائج والأسعار والإتاحة حسب بلد متجر Apple." },
  "mac-app-store": { name: "Mac App Store", source: "apple-macos", platforms: ["macOS"], description: "كتالوج تطبيقات Mac من فهرس Apple، مع فصل متطلبات macOS عن تطبيقات iPhone وiPad." },
  "winget": { name: "WinGet", source: "winget-run-community", platforms: ["Windows"], description: "دليل حزم Windows المرتبطة بمصدر WinGet المجتمعي. قد تشمل النتائج أدوات سطر أوامر وحزم تثبيت إلى جانب التطبيقات." },
  "flathub": { name: "Flathub", source: "flathub", platforms: ["Linux"], description: "كتالوج تطبيقات Linux المنشورة عبر Flathub وFlatpak، مع بيانات المشروع والتصنيف وروابط المصدر عند توفرها." },
  "snap-store": { name: "Snap Store", source: "snap-store", platforms: ["Linux"], description: "كتالوج حزم Snap لتوزيعات Linux. قد تختلف القنوات والناشرون والصلاحيات بين حزمة وأخرى." },
  "arch-linux": { name: "Arch Linux Packages", source: "arch-linux", platforms: ["Linux"], description: "فهرس حزم Arch Linux، بما في ذلك التطبيقات والمكتبات وأدوات النظام. ليست كل نتيجة تطبيقاً رسوميّاً مستقلاً." },
  "debian-packages": { name: "Debian Packages", source: "debian-packages", platforms: ["Linux"], description: "دليل حزم Debian ويشمل برامج المستخدم ومكونات النظام والمكتبات. تعتمد الإصدارات على نسخة التوزيعة والمعمارية." },
  "homebrew": { name: "Homebrew Cask", source: "homebrew-cask", platforms: ["macOS"], description: "دليل تطبيقات macOS التي يمكن إدارتها عبر Homebrew Cask، بما فيها تطبيقات سطح المكتب وأدوات المطورين." },
  "steam": { name: "Steam", source: "steam", platforms: ["Windows", "macOS", "Linux"], description: "نتائج محدودة من واجهة Steam العامة. هذه تغطية جزئية وليست نسخة كاملة من مكتبة Steam أو جميع الألعاب." },
  "mta-web-apps": { name: "MTA Web Apps", source: "mta-curated-web", platforms: ["Web"], description: "تطبيقات ويب اختيرت تحريرياً لدليل MTA، ويمكن الوصول إليها عبر المتصفح من صفحاتها الأصلية." }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function safeHttps(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; }
  catch { return ""; }
}
function replaceOnce(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}
function makeCard(app, storeKey, store) {
  const name = String(app.name || "Application");
  const id = String(app.external_id || app.id || "");
  const source = String(app.source || store.source);
  const detail = "application.html?source=" + encodeURIComponent(source) +
    "&store=" + encodeURIComponent(storeKey) +
    "&id=" + encodeURIComponent(id) +
    "&name=" + encodeURIComponent(name);
  const icon = safeHttps(app.icon_url);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "APP";
  const original = safeHttps(app.source_url || app.app_url) || store.url || "#";
  const platform = app.platform === "pc-games" ? "PC Games" : (app.platform || "");
  const meta = [app.developer, platform, app.category].filter(Boolean).join(" · ");
  const summary = app.summary || app.description || "لا يتوفر وصف مختصر في بيانات المصدر.";
  return '<article class="store-app-card">' +
    '<div class="store-app-top">' +
      (icon ? '<img class="store-app-icon" loading="lazy" decoding="async" src="' + escapeHtml(icon) + '" alt="' + escapeHtml(name) + ' icon">' :
        '<span class="store-app-icon-fallback" aria-label="' + escapeHtml(name) + ' icon">' + escapeHtml(initials) + '</span>') +
      '<span class="store-app-source">' + escapeHtml(source) + '</span>' +
    '</div>' +
    '<h3><a href="' + escapeHtml(detail) + '">' + escapeHtml(name) + '</a></h3>' +
    '<p class="store-app-meta">' + escapeHtml(meta) + '</p>' +
    '<p class="store-app-summary">' + escapeHtml(summary) + '</p>' +
    '<div class="store-app-tags">' + [platform, app.license].filter(Boolean).map(value => '<span>' + escapeHtml(value) + '</span>').join("") + '</div>' +
    '<a class="store-app-detail-link" href="' + escapeHtml(detail) + '">تفاصيل التطبيق داخل MTA</a>' +
    '<a class="store-app-link" href="' + escapeHtml(original) + '" target="_blank" rel="noopener noreferrer">عرض التطبيق في مصدره الأصلي ↗</a>' +
  '</article>';
}
function setMeta(html, name, content) {
  const escaped = escapeHtml(content);
  const re = new RegExp("<meta\\s+name=[\"']" + name + "[\"'][^>]*>", "i");
  if (re.test(html)) return html.replace(re, '<meta name="' + name + '" content="' + escaped + '">');
  return html.replace("</head>", '<meta name="' + name + '" content="' + escaped + '"></head>');
}
function setCanonical(html, canonical) {
  const tag = '<link rel="canonical" href="' + escapeHtml(canonical) + '">';
  const re = /<link\s+rel=["']canonical["'][^>]*>/i;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", tag + "</head>");
}
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const response = await context.next();
  if (url.pathname !== "/store") return response;
  const storeKey = url.searchParams.get("store") || "";
  const store = CONNECTED_STORES[storeKey];
  let html = await response.text();
  const canonical = url.origin + url.pathname + "?store=" + encodeURIComponent(storeKey);
  if (!store) {
    html = setMeta(html, "robots", "noindex,follow");
    html = setCanonical(html, canonical);
  } else {
    const engineOrigin = (env && env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
    try {
      const statsResponse = await fetch(new URL("/api/v1/catalog-stats", engineOrigin), {
        headers: { "accept": "application/json" }, cf: { cacheTtl: 0, cacheEverything: false }
      });
      if (!statsResponse.ok) throw new Error("Catalogue stats HTTP " + statsResponse.status);
      const stats = await statsResponse.json();
      const count = Number((stats.sources || {})[store.source] || 0);
      if (count <= 0) {
        html = setMeta(html, "robots", "noindex,follow");
        html = setCanonical(html, canonical);
        html = html.replace('<h1 id="store-title">Store catalogue</h1>', '<h1 id="store-title">' + escapeHtml(store.name) + '</h1>');
      } else {
        const appsUrl = new URL("/api/v1/apps", engineOrigin);
        appsUrl.searchParams.set("source", store.source);
        appsUrl.searchParams.set("limit", "12");
        appsUrl.searchParams.set("offset", "0");
        const appsResponse = await fetch(appsUrl, {
          headers: { "accept": "application/json" }, cf: { cacheTtl: 0, cacheEverything: false }
        });
        if (!appsResponse.ok) throw new Error("Catalogue apps HTTP " + appsResponse.status);
        const apps = await appsResponse.json();
        if (!Array.isArray(apps) || !apps.length) throw new Error("No server-renderable catalogue rows");
        const description = store.description + " تصفح " + count.toLocaleString("en-US") +
          " سجلاً مفهرساً، وابحث حسب الاسم والمنصة والتصنيف. MTA يعرض بيانات المصدر وروابط الناشر الأصلية ولا يستضيف ملفات التثبيت.";
        const title = store.name + " | دليل التطبيقات | MTA TECHNOLOGIES";
        html = html.replace(/<title>[^<]*<\/title>/i, "<title>" + escapeHtml(title) + "</title>");
        html = setMeta(html, "description", description);
        html = setMeta(html, "robots", "index,follow");
        html = setCanonical(html, canonical);
        html = html.replace('<h1 id="store-title">Store catalogue</h1>', '<h1 id="store-title">' + escapeHtml(store.name) + '</h1>');
        html = html.replace('<span id="breadcrumb-store">Store</span>', '<span id="breadcrumb-store">' + escapeHtml(store.name) + '</span>');
        html = html.replace('<p id="store-subtitle"></p>', '<p id="store-subtitle">' + escapeHtml(store.platforms.join(" · ")) + '</p>');
        html = html.replace('<p id="store-description"></p>', '<p id="store-description">' + escapeHtml(store.description) + '</p>');
        html = html.replace('<span class="store-status" id="store-status">Checking integration</span>', '<span class="store-status is-connected" id="store-status">متصل · ' + count.toLocaleString("en-US") + ' تطبيق مفهرس</span>');
        html = html.replace('<p id="store-results-note"><span class="ar-only">نحمّل بيانات التطبيقات المتاحة من المصدر.</span><span class="en-only">Loading available application metadata.</span></p>',
          '<p id="store-results-note">يعرض هذا القسم عينة أولية من ' + count.toLocaleString("en-US") + ' سجلاً مفهرساً من مصدر ' + escapeHtml(store.name) + '. تُحمّل بقية النتائج على دفعات.</p>');
        html = html.replace('<div class="store-live-count" id="store-count">—</div>', '<div class="store-live-count" id="store-count">' + count.toLocaleString("en-US") + ' تطبيق مفهرس</div>');
        const loadingGrid = '<div class="store-app-grid" id="store-app-grid"><div class="store-loading"><span class="store-spinner"></span><span class="ar-only">جارٍ تحميل التطبيقات...</span><span class="en-only">Loading apps...</span></div></div>';
        html = html.replace(loadingGrid, '<div class="store-app-grid" id="store-app-grid">' + apps.map(app => makeCard(app, storeKey, store)).join("") + '</div>');
        const schema = {
          "@context": "https://schema.org", "@type": "CollectionPage",
          "name": title, "description": description, "url": canonical,
          "inLanguage": ["ar", "en"],
          "mainEntity": { "@type": "ItemList", "numberOfItems": count,
            "itemListElement": apps.map((app, index) => ({
              "@type": "ListItem", "position": index + 1,
              "item": { "@type": "SoftwareApplication", "name": String(app.name || "Application"),
                "description": String(app.summary || app.description || "").slice(0, 500),
                "operatingSystem": String(app.platform || store.platforms.join(", ")),
                "url": safeHttps(app.source_url || app.app_url) || canonical }
            })) }
        };
        const structured = '<script type="application/ld+json" id="store-ssr-schema">' + JSON.stringify(schema).replace(/</g, "\\u003c") + '</script>';
        html = html.replace("</head>", '<meta property="og:title" content="' + escapeHtml(title) + '"><meta property="og:description" content="' + escapeHtml(description) + '"><meta property="og:url" content="' + escapeHtml(canonical) + '">' + structured + "</head>");
      }
    } catch (error) {
      console.error("MTA store server rendering failed:", error);
      html = setMeta(html, "robots", "noindex,follow");
      html = setCanonical(html, canonical);
      html = html.replace('<h1 id="store-title">Store catalogue</h1>', '<h1 id="store-title">' + escapeHtml(store.name) + '</h1>');
      html = html.replace('<p id="store-description"></p>', '<p id="store-description">' + escapeHtml(store.description) + '</p>');
    }
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=60, s-maxage=60");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
