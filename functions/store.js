const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const CONNECTED_STORES = {
  "fedora-packages": { name: "Fedora Packages", source: "fedora-packages", platforms: ["Linux", "Fedora"], description: "فهرس حزم Fedora Linux للمستخدمين ومديري الأنظمة والمطورين. استكشف أسماء الحزم ووظائفها وصفحاتها الأصلية، وانتبه إلى إصدار Fedora والمستودع والمعمارية قبل تثبيت أي حزمة." },

  "jetbrains-marketplace": { name: "JetBrains Marketplace", source: "jetbrains-marketplace", platforms: ["IntelliJ IDEA", "PyCharm", "WebStorm", "IDE plugins"], description: "سوق إضافات بيئات JetBrains مثل IntelliJ IDEA وPyCharm وWebStorm. يفيد المطورين في العثور على أدوات اللغات والتنسيق والاختبار والتكامل؛ راجع توافق الإضافة مع إصدار IDE وتقييمات الناشر وتاريخ التحديث." },
  "gnome-extensions": { name: "GNOME Extensions", source: "gnome-extensions", platforms: ["Linux", "GNOME Shell"], description: "دليل إضافات GNOME Shell لتخصيص سطح مكتب Linux وتحسين سير العمل. تحقق من إصدار GNOME المدعوم وصلاحيات الإضافة وآخر تحديث قبل التثبيت، لأن التوافق يختلف بين إصدارات بيئة سطح المكتب." },

  "google-play": { name: "Google Play", source: "google-play", platforms: ["Android"], description: "فهرس استكشافي لبيانات تطبيقات Android المرتبطة بـ Google Play عند توفر اتصال المصدر. قد تختلف النتائج والأسعار والتوفر حسب البلد والجهاز؛ استخدم رابط Google Play الأصلي للتحقق من المطور والأذونات والتقييمات قبل التنزيل." },
  "firefox-addons": { name: "Firefox Add-ons", source: "firefox-addons", platforms: ["Firefox", "Browser extensions"], description: "دليل إضافات ومتصفحات Firefox من واجهة Mozilla Add-ons. ابحث عن أدوات الخصوصية والإنتاجية وتطوير الويب، ثم راجع صلاحيات الإضافة واسم المطور والتوافق والتحديثات ومراجعات المستخدمين قبل إضافتها إلى المتصفح." },
  "wordpress-plugins": { name: "WordPress Plugin Directory", source: "wordpress-plugins", platforms: ["WordPress", "Web"], description: "كتالوج إضافات WordPress.org للمواقع والمدونات والمتاجر المبنية على WordPress. قارن وظيفة الإضافة وإصدارها وتوافقها مع نسخة WordPress وPHP، وراجع التحديثات الأخيرة والتقييمات والتثبيتات النشطة قبل اعتمادها في موقع إنتاجي." },
  "homebrew-formulae": { name: "Homebrew Formulae", source: "homebrew-formulae", platforms: ["macOS", "Linux"], description: "دليل حزم Homebrew/core لأدوات سطر الأوامر والمكتبات وبيئات التطوير على macOS وLinux. تعرض النتائج معلومات الحزمة وصفحتها الأصلية؛ تحقق من المتطلبات والتبعيات ونظام التشغيل قبل تنفيذ أوامر التثبيت." },
  "scoop": { name: "Scoop Buckets", source: "scoop", platforms: ["Windows"], description: "كتالوج تطبيقات وحزم Windows من مستودعات Scoop المعروفة مثل main وextras وgames وversions. يساعدك على اكتشاف أدوات المطورين وبرامج سطح المكتب، مع ضرورة مراجعة manifest والمصدر والتوافق قبل تثبيت الحزمة." },
  "alpine-linux": { name: "Alpine Linux Packages", source: "alpine-linux", platforms: ["Linux"], description: "فهرس حزم Alpine Linux من مستودعات التوزيعة. يشمل أدوات النظام والمكتبات وتطبيقات المستخدم؛ تحقق من فرع Alpine وإصدار الحزمة ومعمارية الجهاز والمستودع الذي تنتمي إليه قبل التثبيت أو الترقية." },

  "fdroid": { name: "F-Droid", source: "fdroid", platforms: ["Android"], description: "مستودع تطبيقات Android الحرة ومفتوحة المصدر. تعرض السجلات المتاحة معلومات الحزمة والترخيص وروابط المشروع عندما يوفرها المصدر؛ راجع وصف التطبيق وإصداره ومتطلبات Android والأذونات، وتحقق من صفحة F-Droid الأصلية لمعرفة حالة البناء والتحديث." },
  "izzyondroid": { name: "IzzyOnDroid", source: "izzyondroid", platforms: ["Android"], description: "مستودع إضافي لتطبيقات Android الحرة والمفتوحة المصدر، يضم مشاريع قد لا تظهر في المستودعات الأخرى. نعرض هوية المصدر وروابطه الأصلية؛ افحص توقيع التطبيق ومصدره ومتطلبات النظام وتاريخ آخر تحديث قبل التثبيت." },
  "apple-app-store": { name: "Apple App Store", source: "apple-itunes", platforms: ["iOS", "iPadOS"], description: "دليل استكشافي لتطبيقات iPhone وiPad من فهرس Apple العام. تختلف الإتاحة والأسعار والاشتراكات حسب بلد Apple ID والجهاز؛ افتح صفحة App Store الأصلية للتحقق من المطور والتوافق وعمليات الشراء داخل التطبيق." },
  "mac-app-store": { name: "Mac App Store", source: "apple-macos", platforms: ["macOS"], description: "كتالوج تطبيقات macOS من فهرس Apple، منفصل عن تطبيقات iPhone وiPad. تحقق من إصدار macOS المطلوب وطراز الجهاز ونوع المعالج وسياسة الاشتراك أو الشراء قبل الانتقال إلى صفحة التطبيق في Mac App Store." },
  "winget": { name: "WinGet", source: "winget-run-community", platforms: ["Windows"], description: "دليل حزم Windows المرتبطة بمصدر WinGet المجتمعي. قد تشمل النتائج تطبيقات سطح المكتب وأدوات سطر الأوامر ومكونات التطوير؛ راجع معرّف الحزمة والناشر والمصدر وملف manifest قبل تثبيت أي برنامج." },
  "chocolatey": { name: "Chocolatey", source: "chocolatey", platforms: ["Windows"], description: "كتالوج حزم Windows من Chocolatey Community. يساعد في اكتشاف البرامج وأدوات الإدارة والتطوير عبر صفحات الحزم الأصلية؛ تحقق من اسم الحزمة والناشر وإصدارها وحالة الصيانة ومتطلبات النظام قبل استخدام أمر التثبيت." },
  "bluejetty-app-index": { name: "Blue Jetty App Index", source: "bluejetty", platforms: ["Android", "iOS"], description: "فهرس تجميعي انتقائي لتطبيقات Android وiOS يربط المستخدم بمعلومات المصدر وصفحات المتاجر الأصلية عند توفرها. استخدمه للاكتشاف والمقارنة الأولية، ثم تحقق من المطور والتوافق والسعر والأذونات لدى المتجر الرسمي." },
  "openuse": { name: "OpenUse Software Catalog", source: "openuse", platforms: ["Windows", "macOS", "Linux", "Android", "iOS", "Web"], description: "كتالوج برمجيات حرة ومفتوحة المصدر متعددة المنصات، يربط المشاريع بمصادرها وصفحات التنزيل الرسمية. افحص نظام التشغيل المدعوم وطريقة التثبيت والترخيص ونشاط المشروع؛ فوجود البرنامج في الدليل لا يعني أن MTA يطوره أو يستضيف ملفاته." },
  "flathub": { name: "Flathub", source: "flathub", platforms: ["Linux"], description: "دليل تطبيقات Linux الموزعة عبر Flatpak وFlathub. استكشف التطبيقات بحسب التصنيف والمشروع والناشر، وتحقق من صلاحيات Flatpak ومصدر الحزمة وتوافق التوزيعة قبل التثبيت، خصوصاً عند منح الوصول إلى الملفات أو الأجهزة." },
  "snap-store": { name: "Snap Store", source: "snap-store", platforms: ["Linux"], description: "كتالوج حزم Snap لتوزيعات Linux. قد تختلف قنوات stable وcandidate وbeta وedge والصلاحيات بين الحزم؛ راجع الناشر والقناة والأذونات وملاحظات الإصدار في صفحة Snap الأصلية قبل التثبيت." },
  "arch-linux": { name: "Arch Linux Packages", source: "arch-linux", platforms: ["Linux"], description: "فهرس حزم Arch Linux بما يشمل التطبيقات والمكتبات وأدوات النظام. ليست كل نتيجة برنامجاً بواجهة رسومية؛ تحقق من المستودع والاعتماديات والمعمارية وحالة الصيانة، واستخدم صفحة Arch الرسمية أو AUR وفق نوع الحزمة." },
  "debian-packages": { name: "Debian Packages", source: "debian-packages", platforms: ["Linux"], description: "دليل حزم Debian لبرامج المستخدم ومكونات النظام والمكتبات. تعتمد الإصدارات والتوفر على إصدار Debian والمعمارية والمستودعات المفعّلة؛ اقرأ وصف الحزمة واعتمادياتها قبل التثبيت لتجنب تعارضات النظام." },
  "homebrew": { name: "Homebrew Cask", source: "homebrew-cask", platforms: ["macOS"], description: "دليل تطبيقات macOS التي تديرها Homebrew Cask، بما فيها برامج سطح المكتب وأدوات المطورين. تحقق من متطلبات macOS والمعالج ومصدر التنزيل والترخيص، وراجع صفحة الـ cask قبل تشغيل أمر التثبيت أو التحديث." },
  "steam": { name: "Steam", source: "steam", platforms: ["Windows", "macOS", "Linux"], description: "فهرس استكشافي محدود لمنتجات Steam وليس نسخة كاملة من مكتبة المتجر. قد تختلف الأسعار والتوفر واللغات ومتطلبات التشغيل حسب المنطقة؛ تحقق من صفحة Steam الأصلية من متطلبات النظام والتقييمات وسياسة المحتوى قبل الشراء." },
  "mta-web-apps": { name: "MTA Web Apps", source: "mta-curated-web", platforms: ["Web"], description: "مجموعة تطبيقات ويب اختيرت تحريرياً ضمن دليل MTA ويمكن استخدامها عبر المتصفح دون افتراض وجود نسخة قابلة للتثبيت. راجع وظيفة كل خدمة وسياسة الخصوصية وشروط الاستخدام لدى الجهة المطورة، فهذه الروابط لا تعني أن MTA يملك الخدمات." }
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
  const metadata = (() => { try { return typeof app.metadata_json === "string" ? JSON.parse(app.metadata_json) : (app.metadata_json || {}); } catch { return {}; } })();
  const iconObject = metadata.icon && typeof metadata.icon === "object" ? metadata.icon : {};
  let publisherHost = "";
  for (const candidate of [metadata.homepage, metadata.website, metadata.project_url, app.app_url, app.source_url]) {
    try { publisherHost = new URL(candidate).hostname.replace(/^www\./, ""); if (publisherHost) break; } catch {}
  }
  const icon = safeHttps(app.icon_url || metadata.icon_url || metadata.iconUrl ||
    (typeof metadata.icon === "string" ? metadata.icon : "") || iconObject.url || iconObject.path ||
    metadata.logo || metadata.image || metadata.image_url || metadata.artworkUrl512) ||
    (publisherHost ? "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(publisherHost) + "&sz=256" : "");
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "APP";
  const original = safeHttps(app.source_url || app.app_url) || store.url || "#";
  const platform = app.platform === "pc-games" ? "PC Games" : (app.platform || "");
  const meta = [app.developer, platform, app.category].filter(Boolean).join(" · ");
  const summary = app.summary || app.description || "لا يتوفر وصف مختصر في بيانات المصدر.";
  const category = String(app.category || "Other").split(",")[0].trim();
  return '<article class="store-app-card" data-category="' + escapeHtml(category) + '" data-platform="' + escapeHtml(String(app.platform || "").toLowerCase()) + '">' +
    '<div class="store-app-top">' +
      (icon ? '<img class="store-app-icon" loading="lazy" decoding="async" src="' + escapeHtml(icon) + '" alt="' + escapeHtml(name) + ' icon" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="store-app-icon-fallback" hidden aria-label="' + escapeHtml(name) + ' icon">' + escapeHtml(initials) + '</span>' :
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
const STORE_EDITORIAL = {
  "fdroid": ["فهرس F-Droid يركز على تطبيقات Android الحرة ومفتوحة المصدر. راجع بيانات الحزمة والترخيص وروابط المشروع قبل الانتقال إلى المستودع.", "قد تتضمن السجلات معلومات الإصدار ومتطلبات النظام، لكن التوفر والتوافق يعتمدان على الجهاز وسياسة المستودع.", "تحقق من توقيع الحزمة والترخيص وصفحة المصدر الأصلية. لا يستضيف MTA ملفات APK ولا يعيد توزيعها."],
  "izzyondroid": ["يعرض هذا القسم حزم Android من مستودع IzzyOnDroid المستقل، ونفصل بياناته عن F-Droid حتى يبقى مصدر كل تطبيق واضحاً.", "قد تختلف سياسة قبول الحزم ومواعيد التحديث؛ ووجود الحزمة هنا لا يعني أنها موجودة في متاجر أخرى.", "راجع صفحة الحزمة والتوقيع وروابط المشروع والترخيص وتاريخ التحديث قبل التثبيت."],
  "apple-itunes": ["تستند النتائج إلى واجهة البحث العامة لدى Apple، وهي وسيلة لاكتشاف التطبيقات وليست نسخة كاملة من App Store.", "قد تختلف النتائج والأسعار والتوفر باختلاف بلد المتجر، وبعض الحقول لا تتوفر لكل سجل.", "افتح صفحة App Store الأصلية للتحقق من المطور والتوافق والاشتراكات وعمليات الشراء."],
  "apple-macos": ["هذا الفهرس مخصص لتطبيقات macOS التي تظهر في واجهة بحث Apple، وهو منفصل عن نتائج iPhone وiPad.", "تعتمد الملاءمة على إصدار macOS وطراز الجهاز ومعمارية المعالج، وقد لا تعكس النتائج كل التطبيقات المتاحة.", "راجع صفحة Mac App Store الأصلية للتحقق من متطلبات النظام والسعر والمطور."],
  "bluejetty": ["Blue Jetty مصدر تجميعي انتقائي لبيانات تطبيقات الهاتف، وليس نسخة كاملة من Google Play أو Apple App Store.", "قد تحتوي السجلات على روابط متاجر ومعلومات ناشر وملاحظات مصدرية؛ نعرض الحقول التي وفرها المصدر فقط.", "قارن السجل مع صفحة المتجر الرسمية، وراجع هوية المطور والتوافق والأذونات قبل التثبيت."],
  "openuse": ["يجمع OpenUse بيانات عن برمجيات حرة ومفتوحة المصدر عبر أنظمة متعددة ويربط السجلات بصفحات المشاريع الأصلية.", "إدراج مشروع لا يعني أن MTA يطوره أو يوزع ملفاته؛ تختلف طريقة التثبيت والترخيص ومتطلبات التشغيل.", "افحص المستودع الرسمي والترخيص ونشاط الصيانة ونظام التشغيل المدعوم قبل اعتماد البرنامج."],
  "steam": ["تأتي النتائج من بحث محدود في واجهة Steam العامة، ولا تمثل كامل مكتبة الألعاب أو كل منتجات المتجر.", "قد تتغير الأسعار والتوفر واللغات ومتطلبات التشغيل بحسب البلد والحساب ونظام التشغيل.", "افتح صفحة Steam للتحقق من متطلبات النظام والتقييمات والسعر وسياسة المحتوى قبل الشراء."]
};
function injectEditorial(html, key) {
  const profile = STORE_EDITORIAL[key];
  if (!profile) return html;
  const ids = ["store-editorial-what", "store-editorial-verify", "store-editorial-availability"];
  for (let i = 0; i < ids.length; i++) {
    const marker = 'id="' + ids[i] + '"';
    const markerAt = html.indexOf(marker);
    const openEnd = html.indexOf(">", markerAt);
    const closeStart = html.indexOf("</p>", openEnd);
    if (markerAt < 0 || openEnd < 0 || closeStart < 0) continue;
    const text = '<span class="ar-only">' + escapeHtml(profile[i]) + '</span>';
    html = html.slice(0, openEnd + 1) + text + html.slice(closeStart);
  }
  return html;
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
async function fetchJsonWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { "accept": "application/json" }, cf: { cacheTtl: 0, cacheEverything: false } });
      if (response.ok) return await response.json();
      lastError = new Error("Catalogue HTTP " + response.status);
      if (response.status < 500 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === 2 || (error && /^Catalogue HTTP 4/.test(error.message || "") && !/429/.test(error.message || ""))) throw error;
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw lastError || new Error("Catalogue request failed");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const response = await context.next();
  if (url.pathname !== "/store") return response;
  const storeKey = url.searchParams.get("store") || "";
  const store = CONNECTED_STORES[storeKey];
  let html = await response.text();
  const canonicalOrigin = (env && env.MTA_SITE_ORIGIN) || "https://www.mtahqq.dpdns.org";
  const canonical = canonicalOrigin + url.pathname + "?store=" + encodeURIComponent(storeKey);
  if (!store) {
    html = setMeta(html, "robots", "noindex,follow");
    html = setCanonical(html, canonical);
  } else {
    const engineOrigin = (env && env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
    try {
      const stats = await fetchJsonWithRetry(new URL("/api/v1/catalog-stats", engineOrigin));
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
        const apps = await fetchJsonWithRetry(appsUrl);
        if (!Array.isArray(apps) || !apps.length) throw new Error("No server-renderable catalogue rows");
        const description = (store.description + " تصفح " + count.toLocaleString("en-US") + " سجلاً مفهرساً من المصدر. تحقق من صفحة الناشر الأصلية قبل التثبيت؛ MTA لا يستضيف ملفات البرامج.").slice(0, 320);
        const title = store.name + " | دليل التطبيقات | MTA TECHNOLOGIES";
        html = html.replace(/<title>[^<]*<\/title>/i, "<title>" + escapeHtml(title) + "</title>");
        html = setMeta(html, "description", description);
        html = setMeta(html, "robots", "index,follow");
        html = setCanonical(html, canonical);
        html = html.replace('<h1 id="store-title">Store catalogue</h1>', '<h1 id="store-title">' + escapeHtml(store.name) + '</h1>');
        html = html.replace('<span id="breadcrumb-store">Store</span>', '<span id="breadcrumb-store">' + escapeHtml(store.name) + '</span>');
        html = html.replace('<p id="store-subtitle"></p>', '<p id="store-subtitle">' + escapeHtml(store.platforms.join(" · ")) + '</p>');
        html = html.replace('<p id="store-description"></p>', '<p id="store-description">' + escapeHtml(store.description) + '</p>');
        html = injectEditorial(html, storeKey);
        html = html.replace('<span class="store-status" id="store-status">Checking integration</span>', '<span class="store-status is-connected" id="store-status">متصل · ' + count.toLocaleString("en-US") + ' سجل مفهرس</span>');
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
