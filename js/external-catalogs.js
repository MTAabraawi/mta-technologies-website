(() => {
  "use strict";
  const lang = () => document.documentElement.lang === "en" ? "en" : "ar";
  const copy = (ar, en) => lang() === "en" ? en : ar;
  const section = document.createElement("section");
  section.className = "container external-catalogs";
  section.id = "external-catalog-search";
  section.innerHTML = \`
    <div class="apps-section-heading">
      <span class="apps-eyebrow">CONNECTED APP CATALOGS</span>
      <h2><span class="ar-only">ابحث في كتالوجات التطبيقات العالمية</span><span class="en-only">Search global app catalogs</span></h2>
      <p><span class="ar-only">نتائج مباشرة من F-Droid وApple App Store (المتجر الأمريكي)، مع رابط بحث رسمي في Flathub. التنزيل يتم من المصدر الأصلي.</span><span class="en-only">Live results from F-Droid and the US Apple App Store storefront, plus an official Flathub search link. Downloads remain on the original source.</span></p>
    </div>
    <form class="external-search-form" id="external-catalog-form">
      <label class="external-search-input"><span aria-hidden="true">⌕</span><input id="external-catalog-query" type="search" minlength="2" maxlength="100" required placeholder="ابحث عن تطبيق أو برنامج..." aria-label="Search connected app catalogs"></label>
      <button class="btn btn-primary" type="submit"><span class="ar-only">بحث في المصادر</span><span class="en-only">Search catalogs</span></button>
    </form>
    <div class="external-source-links">
      <a id="flathub-search-link" href="https://flathub.org/apps" target="_blank" rel="noopener noreferrer">Flathub <span>Linux · Flatpak ↗</span></a>
      <a href="https://f-droid.org/" target="_blank" rel="noopener noreferrer">F-Droid <span>Android ↗</span></a>
      <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">Apple App Store <span>iOS · macOS ↗</span></a>
    </div>
    <div id="external-catalog-status" class="external-catalog-status" role="status" aria-live="polite"><span class="ar-only">أدخل اسم التطبيق لبدء البحث في المصادر المتصلة.</span><span class="en-only">Enter an app name to search connected sources.</span></div>
    <div class="external-results-grid" id="external-catalog-results"></div>
    <p class="external-catalog-footnote"><span class="ar-only">هذه واجهات بحث وبيانات تعريفية فقط. لا تتحقق نتائج البحث وحدها من سلامة ملفات APK أو صحة التوقيع، ولا تمنح MTA حق إعادة الاستضافة. لا نرفع أو نستضيف أي ملف من هذه المصادر.</span><span class="en-only">These are search and metadata integrations only. Search results do not verify APK integrity or signatures and do not grant MTA redistribution rights. No files from these catalogs are uploaded or mirrored.</span></p>\`;
  const storeSection = document.querySelector(".store-directory-section");
  if (storeSection) storeSection.before(section);
  const form = section.querySelector("#external-catalog-form");
  const queryInput = section.querySelector("#external-catalog-query");
  const status = section.querySelector("#external-catalog-status");
  const resultsRoot = section.querySelector("#external-catalog-results");
  const flathubLink = section.querySelector("#flathub-search-link");
  const make = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    node.textContent = value == null ? "" : String(value);
    return node;
  };
  const safeExternalUrl = (value, hosts, fallback) => {
    try {
      const url = new URL(value, fallback);
      return url.protocol === "https:" && hosts.includes(url.hostname) ? url.href : fallback;
    } catch { return fallback; }
  };
  function card(source, name, developer, detail, href) {
    const article = make("article", "external-result-card", "");
    article.append(make("span", "external-result-source", source));
    article.append(make("h3", "", name || copy("تطبيق بدون اسم", "Untitled app")));
    if (developer) article.append(make("p", "external-result-developer", developer));
    if (detail) article.append(make("p", "external-result-detail", detail));
    const link = make("a", "app-card-link", copy("زيارة المصدر الرسمي ↗", "Open official source ↗"));
    link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer";
    article.append(link);
    return article;
  }
  function extractF(payload) {
    if (Array.isArray(payload)) return payload;
    for (const key of ["apps", "results", "hits", "data"]) if (Array.isArray(payload?.[key])) return payload[key];
    return [];
  }
  async function fetchJson(url, source) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal, mode: "cors", credentials: "omit", cache: "no-store" });
      if (!response.ok) throw new Error(source + " HTTP " + response.status);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  let activeSearch = 0;
  async function search(query) {
    const searchId = ++activeSearch;
    resultsRoot.replaceChildren();
    status.textContent = copy("جارٍ البحث في F-Droid وApple App Store...", "Searching F-Droid and Apple App Store...");
    flathubLink.href = "https://flathub.org/apps/search?q=" + encodeURIComponent(query);
    const requests = [
      fetchJson("https://search.f-droid.org/api/search_apps?q=" + encodeURIComponent(query), "F-Droid").then(payload => ({ source: "F-Droid", items: extractF(payload) })),
      fetchJson("https://itunes.apple.com/search?term=" + encodeURIComponent(query) + "&entity=software&country=us&limit=15", "Apple App Store").then(payload => {
        if (!payload || !Array.isArray(payload.results)) throw new Error("Apple response format is invalid");
        return { source: "Apple App Store", items: payload.results };
      })
    ];
    const settled = await Promise.allSettled(requests);
    if (searchId !== activeSearch) return;
    let total = 0;
    const failures = [];
    for (let i = 0; i < settled.length; i++) {
      const result = settled[i], source = i === 0 ? "F-Droid" : "Apple App Store";
      if (result.status !== "fulfilled") { failures.push(source); continue; }
      for (const item of (Array.isArray(result.value.items) ? result.value.items : []).slice(0, 15)) {
        if (!item || typeof item !== "object") continue;
        let name, developer, detail, href;
        if (i === 0) {
          const packageId = String(item.packageName || item.package_name || item.package || item.id || "").trim();
          const fallback = packageId ? "https://f-droid.org/packages/" + encodeURIComponent(packageId) + "/" : "https://f-droid.org/";
          href = safeExternalUrl(item.url || fallback, ["f-droid.org", "www.f-droid.org"], fallback);
          name = item.name || item.localizedName || item.title || packageId;
          developer = item.authorName || item.author || item.developer || "";
          detail = [item.summary || item.description || "", packageId, item.suggestedVersionName || item.versionName || item.version || ""].filter(Boolean).join(" · ");
        } else {
          const fallback = "https://www.apple.com/app-store/";
          href = safeExternalUrl(item.trackViewUrl || fallback, ["apps.apple.com", "itunes.apple.com"], fallback);
          name = item.trackName; developer = item.sellerName || item.artistName || "";
          detail = [item.primaryGenreName, item.version].filter(Boolean).join(" · ");
        }
        resultsRoot.append(card(source, name, developer, detail, href)); total++;
      }
    }
    status.textContent = total
      ? copy("عُثر على " + total + " نتيجة.", "Found " + total + " results.")
      : copy("لم تصل نتائج. قد يكون المصدر غير متاح أو لا توجد نتائج مطابقة.", "No results received. A source may be unavailable or there may be no matches.");
    if (failures.length) status.textContent += copy(" تعذّر الاتصال بـ: " + failures.join("، ") + ".", " Could not connect to: " + failures.join(", ") + ".");
    if (!total && !failures.length) status.textContent += copy(" جرّب كلمة بحث أخرى أو افتح روابط المصادر الرسمية.", " Try another search or use the official source links.");
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const query = queryInput.value.trim();
    if (query.length >= 2) search(query);
  });
})();