(function () {
  "use strict";
  const search = document.getElementById("app-search");
  const platform = document.getElementById("platform-filter");
  const category = document.getElementById("category-filter");
  const developer = document.getElementById("developer-filter");
  const grid = document.getElementById("apps-grid");
  const empty = document.getElementById("apps-empty");
  const count = document.getElementById("app-count");
  const connection = document.getElementById("catalog-connection");
  const stats = document.getElementById("catalog-stats");
  const api = String(window.MTA_MARKETPLACE_API || "").replace(/\/$/, "");
  if (!search || !platform || !category || !developer || !grid || !empty || !count) return;

  const storePicker = document.getElementById("store-picker");
  const catalogueView = document.getElementById("catalogue-view");
  const backToStores = document.getElementById("store-back");
  const selectedStoreHeading = document.getElementById("selected-store-heading");
  let activeSource = "";
  const storeInfo = {
    "fdroid": ["F-Droid", "تطبيقات Android مفتوحة المصدر", "Open-source Android apps"],
    "izzyondroid": ["IzzyOnDroid", "تطبيقات Android من مستودع IzzyOnDroid", "Android apps from the IzzyOnDroid repository"],
    "apple-itunes": ["Apple App Store", "تطبيقات iPhone وiPad", "iPhone and iPad apps"],
    "apple-macos": ["Mac App Store", "تطبيقات macOS من متجر Apple", "macOS apps from Apple's store"],
    "snap-store": ["Snap Store", "تطبيقات Linux عبر Snap", "Linux apps via Snap"],
    "flathub": ["Flathub", "تطبيقات Linux عبر Flatpak", "Linux apps via Flatpak"],
    "homebrew-cask": ["Homebrew", "تطبيقات macOS", "macOS applications"],
    "winget-run-community": ["WinGet", "برامج Windows", "Windows software"],
    "chocolatey": ["Chocolatey", "حزم وبرامج Windows", "Windows packages and software"],
    "bluejetty": ["Blue Jetty App Index", "فهرس تطبيقات Android وiOS", "Android and iOS app index"],
    "openuse": ["OpenUse", "برمجيات حرة ومفتوحة المصدر متعددة المنصات", "Cross-platform free and open-source software"],
    "arch-linux": ["Arch Linux Packages", "حزم وتطبيقات Arch Linux", "Arch Linux packages and apps"],
    "debian-packages": ["Debian Packages", "برامج وحزم Debian", "Debian software packages"],
    "steam": ["Steam", "نتائج بحث من متجر Steam", "Steam storefront search results"],
    "mta-curated-web": ["MTA Web Apps", "تطبيقات الويب المختارة", "Curated web applications"]
  };
  const isEnglish = () => document.documentElement.lang === "en";
  const text = (ar, en) => isEnglish() ? en : ar;
  const safeHttpsUrl = value => {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  };
  const platformName = value => ({
    android: "Android", ios: "iOS", windows: "Windows",
    macos: "macOS", linux: "Linux", web: "Web"
  }[String(value || "").toLowerCase()] || String(value || "Other"));
  const categoryName = value => {
    const raw = String(value || "Other").split(",")[0].trim().toLowerCase();
    const map = {
      games: "Games", game: "Games", security: "Security",
      productivity: "Productivity", education: "Education", office: "Office",
      graphics: "Graphics", photo: "Graphics", multimedia: "Media",
      video: "Media", audio: "Media", browser: "Tools", utilities: "Tools",
      utility: "Tools", development: "Tools", communication: "Tools",
      network: "Tools", system: "Tools", science: "Education", internet: "Web",
      ai: "AI", artificialintelligence: "AI", "artificial intelligence": "AI",
      design: "Design", cloud: "Cloud", "3d": "3D & Animation",
      animation: "3D & Animation", office: "Office", business: "Productivity",
      weather: "Tools", travel: "Tools", finance: "Productivity",
      health: "Education", lifestyle: "Tools", food: "Tools", books: "Education"
    };
    return map[raw] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Other");
  };

  function makeCard(app) {
    const card = document.createElement("article");
    card.className = "app-card";
    card.dataset.dynamicApp = "true";
    const platforms = Array.isArray(app.platforms)
      ? app.platforms.map(platformName)
      : String(app.platform || "Other").split(/\s*,\s*/).filter(Boolean).map(platformName);
    const description = isEnglish()
      ? (app.description_en || app.summary || app.description || "")
      : (app.description_ar || app.summary || app.description || "");
    const name = String(app.app_name || app.name || "Application");
    const dev = String(app.developer_name || app.developer || "Independent developer");
    const cat = categoryName(app.category);
    const categorySelect = document.getElementById("category-filter");
    if (categorySelect && cat && ![...categorySelect.options].some(option => option.value === cat)) {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.append(option);
    }
    card.dataset.name = name;
    card.dataset.description = description;
    card.dataset.platform = platforms.join(",");
    card.dataset.category = cat;
    card.dataset.developer = dev;
    card.dataset.source = String(app.source || app.source_key || "mta-curated-web");

    const top = document.createElement("div");
    top.className = "app-card-top";
    const icon = document.createElement("div");
    icon.className = "app-icon app-icon-image";
    const iconUrl = safeHttpsUrl(app.icon_url || app.icon_path);
    const homepageUrl = safeHttpsUrl(app.app_url || app.homepage || app.source_url);
    let faviconUrl = "";
    try {
      if (homepageUrl) {
        const host = new URL(homepageUrl).hostname.replace(/^www\./, "");
        faviconUrl = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=128";
      }
    } catch {}
    const fallbackIcon = () => {
      const mark = document.createElement("span");
      mark.className = "app-icon-fallback";
      mark.setAttribute("aria-label", name + " icon unavailable");
      mark.textContent = name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
      return mark;
    };
    const appendIconImage = (url, fallbackUrl) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = name + " icon";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      let usingFallback = false;
      img.addEventListener("error", () => {
        if (fallbackUrl && !usingFallback) {
          usingFallback = true;
          img.src = fallbackUrl;
        } else {
          icon.replaceChildren(fallbackIcon());
        }
      });
      icon.append(img);
    };
    if (iconUrl) appendIconImage(iconUrl, faviconUrl && faviconUrl !== iconUrl ? faviconUrl : "");
    else if (faviconUrl) appendIconImage(faviconUrl, "");
    else icon.append(fallbackIcon());
    top.append(icon);
    const status = document.createElement("span");
    status.className = "app-status status-live";
    status.textContent = text("بيانات من المصدر", "Source metadata");
    top.append(status);
    card.append(top);

    const meta = document.createElement("div");
    meta.className = "app-card-meta";
    meta.textContent = dev + " · " + platforms.join(", ");
    card.append(meta);
    const title = document.createElement("h3");
    title.textContent = name;
    card.append(title);
    const desc = document.createElement("p");
    desc.textContent = description;
    card.append(desc);
    const metadata = app.metadata_json && typeof app.metadata_json === "object" ? app.metadata_json : {};
    const sizeBytes = Number(metadata.size_bytes || app.size_bytes || 0);
    if (Number.isFinite(sizeBytes) && sizeBytes > 0) {
      const size = document.createElement("small");
      size.className = "app-license";
      const units = ["B", "KB", "MB", "GB"];
      let amount = sizeBytes, unit = 0;
      while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit++; }
      size.textContent = text("الحجم: ", "Size: ") + amount.toFixed(amount >= 10 || unit === 0 ? 0 : 1) + " " + units[unit];
      card.append(size);
    }

    if (app.license || app.license_name) {
      const license = document.createElement("small");
      license.className = "app-license";
      license.textContent = text("الترخيص: ", "License: ") + (app.license || app.license_name);
      card.append(license);
    }
    const tags = document.createElement("div");
    tags.className = "app-tags";
    [...platforms, cat].filter(Boolean).forEach(label => {
      const span = document.createElement("span");
      span.textContent = label;
      tags.append(span);
    });
    card.append(tags);

    const action = document.createElement("a");
    action.className = "app-card-link";
    const href = safeHttpsUrl(app.source_url || app.app_url || app.homepage);
    if (href) {
      action.href = href;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = text("زيارة صفحة التطبيق الرسمية", "Visit official app page");
    } else {
      action.setAttribute("aria-disabled", "true");
      action.textContent = text("رابط المصدر غير متاح", "Source link unavailable");
    }
    card.append(action);
    return card;
  }

  function filter() {
    const query = (search.value || "").trim().toLocaleLowerCase();
    let visible = 0;
    grid.querySelectorAll(".app-card").forEach(card => {
      const searchable = [card.dataset.name, card.dataset.description, card.textContent]
        .join(" ").toLocaleLowerCase();
      const supported = card.dataset.platform.split(",").map(value => value.trim());
      const matches = searchable.includes(query)
        && (!activeSource || card.dataset.source === activeSource)
        && (platform.value === "all" || supported.includes(platform.value))
        && (category.value === "all" || card.dataset.category === category.value)
        && (developer.value === "all" || (developer.value === "MTA TECHNOLOGIES"
          ? card.dataset.developer === "MTA TECHNOLOGIES"
          : card.dataset.developer !== "MTA TECHNOLOGIES"));
      card.hidden = !matches;
      if (matches) visible++;
    });
    empty.hidden = visible !== 0;
    count.textContent = visible + " " + text("تطبيق معروض", "apps shown");
  }

  const curatedApps = [];
  const engineApps = [];
  function renderDynamicApps() {
    grid.querySelectorAll('.app-card[data-dynamic-app="true"]').forEach(card => card.remove());
    [...curatedApps, ...engineApps].forEach(app => grid.insertBefore(makeCard(app), empty));
    filter();
  }
  function addApps(items, target) {
    const existing = new Set([
      ...[...grid.querySelectorAll(".app-card")].filter(card => card.dataset.dynamicApp !== "true")
        .map(card => (card.dataset.name || "").toLocaleLowerCase() + "|" + (card.dataset.platform || "").toLocaleLowerCase()),
      ...curatedApps.map(app => String(app.app_name || app.name || "").trim().toLocaleLowerCase() + "|" + platformName(app.platform).toLocaleLowerCase()),
      ...engineApps.map(app => String(app.app_name || app.name || "").trim().toLocaleLowerCase() + "|" + platformName(app.platform).toLocaleLowerCase())
    ]);
    let added = 0;
    (Array.isArray(items) ? items : []).forEach(app => {
      if (!app || typeof app !== "object") return;
      const name = String(app.app_name || app.name || "").trim();
      const key = name.toLocaleLowerCase() + "|" + platformName(app.platform).toLocaleLowerCase();
      if (!name || existing.has(key)) return;
      const normalized = { ...app, app_name: name };
      target.push(normalized);
      existing.add(key);
      // Append only the new card. Rebuilding every previously loaded card on
      // every page made long catalogues progressively slower on mobile devices.
      grid.insertBefore(makeCard(normalized), empty);
      added++;
    });
    filter();
    return added;
  }

  window.addEventListener("mta:languagechange", renderDynamicApps);
  async function loadCurated() {
    try {
      const response = await fetch("data/curated-apps.json", { cache: "no-cache" });
      if (response.ok) addApps(await response.json(), curatedApps);
    } catch (error) {
      console.warn("Curated app directory unavailable", error);
    }
  }

  const pageSize = 50;
  let nextOffset = 0;
  let catalogueExhausted = false;
  let engineTotal = 0;
  let globalEngineTotal = 0;
  let activeQuery = "";
  let engineLoading = false;
  let catalogueObserver = null;
  const catalogueSentinel = document.getElementById("catalogue-sentinel");
  async function fetchEnginePage() {
    if (!api || !activeSource || engineLoading || catalogueExhausted) return [];
    const button = document.getElementById("load-more-apps");
    engineLoading = true;
    if (button) {
      button.hidden = false;
      button.disabled = true;
      button.textContent = text("جارٍ تحميل التطبيقات...", "Loading applications...");
    }
    try {
      const params = new URLSearchParams({limit:String(pageSize),offset:String(nextOffset)});
      if (activeQuery) params.set("q", activeQuery);
      params.set("source", activeSource);
      if (platform.value !== "all") params.set("platform", platform.value.toLowerCase());
      const requestUrl = api + "/api/v1/apps?" + params.toString();
      let response = null;
      let requestError = null;
      // Give each retry its own timeout controller. Reusing an aborted
      // controller made every retry fail immediately after the first timeout.
      for (let attempt = 0; attempt < 3; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        try {
          response = await fetch(requestUrl, {
            credentials: "omit", cache: "no-store", signal: controller.signal
          });
          if (response.ok) break;
          requestError = new Error("Catalogue HTTP " + response.status);
          if (response.status < 500) throw requestError;
        } catch (error) {
          requestError = error;
          if (attempt === 2) throw error;
        } finally {
          clearTimeout(timeoutId);
        }
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
      }
      if (!response || !response.ok) throw requestError || new Error("Catalogue request failed");
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Catalogue returned a non-JSON response");
      }
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("Unexpected catalogue response");
      const reportedTotal = Number(response.headers.get("X-Total-Count") || 0);
      if (payload.length === 0) catalogueExhausted = true;
      if (reportedTotal) engineTotal = reportedTotal;
      if (stats && activeSource && reportedTotal) stats.textContent = reportedTotal.toLocaleString() + " " + text("تطبيقاً في هذا المتجر", "apps in this store");
      addApps(payload, engineApps);
      nextOffset += payload.length;
      if (stats && engineTotal) stats.textContent = engineTotal.toLocaleString() + " " + (activeSource
        ? text("تطبيقاً في هذا المتجر", "apps in this store")
        : text("تطبيقاً مفهرساً", "indexed applications"));
      if (button) {
        button.hidden = payload.length < pageSize || (engineTotal > 0 && nextOffset >= engineTotal);
        if (catalogueExhausted) button.hidden = true;
        button.disabled = false;
        button.textContent = text(
          "تحميل المزيد · " + Math.max(0, engineTotal-nextOffset).toLocaleString() + " متبقٍ",
          "Load more · " + Math.max(0, engineTotal-nextOffset).toLocaleString() + " remaining"
        );
        button.classList.remove("is-retry");
      }
      if (connection) connection.textContent = text(
        "متصل · عُرض " + Math.min(nextOffset, engineTotal || nextOffset).toLocaleString() + " من " + (engineTotal || nextOffset).toLocaleString() + " تطبيقاً",
        "Connected · showing " + Math.min(nextOffset, engineTotal || nextOffset).toLocaleString() + " of " + (engineTotal || nextOffset).toLocaleString() + " apps"
      );
      return payload;
    } catch (error) {
      console.warn("MTA Applications Engine catalogue page unavailable", error);
      if (connection) connection.title = String(error && error.message ? error.message : error);
      if (button) {
        button.hidden = false;
        button.disabled = false;
        button.textContent = text("تعذّر التحميل — أعد المحاولة", "Load failed — retry");
        button.classList.add("is-retry");
      }
      if (connection) connection.textContent = text(
        "تعذّر تحميل هذه الدفعة. تحقق من الاتصال ثم أعد المحاولة؛ لم نحذف التطبيقات المعروضة.",
        "This batch failed to load. Check the connection and retry; displayed apps were kept."
      );
      throw error;
    } finally {
      // timeoutId is scoped to each retry attempt; it must not be
      // referenced here. Always release the loading lock after success/failure.
      engineLoading = false;
      if (button) button.disabled = false;
      // Re-arm the sentinel after a successful batch. IntersectionObserver
      // may not emit another callback when the sentinel stayed in its margin
      // while the previous request was in flight.
      if (catalogueObserver && catalogueSentinel && button
          && !button.hidden && !button.classList.contains("is-retry") && !catalogueExhausted) {
        catalogueObserver.unobserve(catalogueSentinel);
        catalogueObserver.observe(catalogueSentinel);
      }
    }
  }
  async function reloadEngine() {
    if (!api || !activeSource) return;
    nextOffset = 0;
    catalogueExhausted = false;
    engineApps.length = 0;
    renderDynamicApps();
    if (connection) connection.textContent = text("جارٍ تحديث نتائج البحث...", "Refreshing catalogue results...");
    await fetchEnginePage();
  }
  async function loadEngine() {
    if (!api) {
      if (connection) connection.textContent = text("عنوان محرك التطبيقات غير مضبوط.", "Application engine URL is not configured.");
      return;
    }

    // Load application records first. Statistics are supplementary and must
    // never prevent the actual catalogue from appearing.
    if (connection) connection.textContent = text("جارٍ تحميل التطبيقات...", "Loading applications...");
    const statsTask = (async () => {
      try {
        let response;
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await fetch(api + "/api/v1/catalog-stats", {
            credentials: "omit", cache: "no-store"
          });
          if (response.ok) break;
          if (response.status < 500 || attempt === 2) {
            throw new Error("Catalogue stats HTTP " + response.status);
          }
          await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
        }
        const data = await response.json();
        const globalTotal = Number(data.total || 0);
        if (globalTotal) globalEngineTotal = globalTotal;
        if (stats && !activeSource && globalTotal) stats.textContent = globalTotal.toLocaleString() + " " + text("تطبيقاً مفهرساً", "indexed applications");
        document.querySelectorAll("[data-source-count]").forEach(element => {
        const amount = Number((data.sources || {})[element.dataset.sourceCount] || 0);
        element.textContent = amount.toLocaleString() + " " + text("تطبيق", "apps");
      });
      document.querySelectorAll("[data-catalog-platform]").forEach(element => {
          const key = element.dataset.catalogPlatform;
          const amount = Number((data.platforms || {})[key] || 0);
          element.textContent = amount.toLocaleString() + " " + platformName(key);
          element.title = amount.toLocaleString() + " " + text("تطبيقاً", "applications");
        });
      } catch (error) {
        console.warn("Catalogue statistics unavailable; continuing with app records", error);
      }
    })();

    try {
      if (activeSource) await fetchEnginePage();
      await statsTask;
    } catch (error) {
      console.warn("MTA Applications Engine app records unavailable", error);
      if (connection) {
        connection.title = String(error && error.message ? error.message : error);
        connection.textContent = text(
          "تعذّر تحميل التطبيقات حالياً. اضغط «إعادة المحاولة» أو تحقق من الاتصال.",
          "Applications could not be loaded. Press Retry or check your connection."
        );
      }
      const button = document.getElementById("load-more-apps");
      if (button) {
        button.hidden = false;
        button.disabled = false;
        button.classList.add("is-retry");
        button.textContent = text("إعادة محاولة تحميل التطبيقات", "Retry loading applications");
      }
    }
  }

  function chooseStore(source) {
    if (!storeInfo[source]) return;
    activeSource = source;
    const info = storeInfo[source];
    if (storePicker) storePicker.hidden = true;
    if (catalogueView) catalogueView.hidden = false;
    if (selectedStoreHeading) selectedStoreHeading.innerHTML = "<h3>" + info[0] + "</h3><p>" + text(info[1], info[2]) + "</p>";
    if (platform) platform.value = "all";
    if (search) search.value = "";
    activeQuery = "";
    if (category) category.value = "all";
    if (developer) developer.value = "all";
    if (connection) connection.textContent = text("جارٍ تحميل تطبيقات هذا المتجر...", "Loading this store's applications...");
    reloadEngine().catch(() => {});
    filter();
  }
  storePicker?.querySelectorAll("[data-store-source]").forEach(button => {
    button.addEventListener("click", () => chooseStore(button.dataset.storeSource));
  });
  backToStores?.addEventListener("click", () => {
    activeSource = "";
    if (catalogueView) catalogueView.hidden = true;
    if (storePicker) storePicker.hidden = false;
    nextOffset = 0;
    catalogueExhausted = false;
    engineApps.length = 0;
    renderDynamicApps();
    if (connection) connection.textContent = text("اختر متجراً لعرض تطبيقاته.", "Choose a store to browse its apps.");
    if (stats) stats.textContent = globalEngineTotal.toLocaleString() + " " + text("تطبيقاً مفهرساً", "indexed applications");
  });
  category.addEventListener("change", filter);
  developer.addEventListener("change", filter);
  platform.addEventListener("change", () => reloadEngine().catch(() => {}));
  let searchTimer = null;
  search.addEventListener("input", () => {
    filter();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const query = search.value.trim();
      if (query === activeQuery) return;
      activeQuery = query;
      reloadEngine().catch(() => {});
    }, 450);
  });
  const moreButton = document.getElementById("load-more-apps");
  if (moreButton) {
    moreButton.addEventListener("click", () => fetchEnginePage().catch(() => {}));
    if (!("IntersectionObserver" in window) || !catalogueSentinel) moreButton.classList.add("is-retry");
    // Continue loading catalogue batches automatically as the visitor reaches
    // the end of the currently rendered results. The button remains available
    // for manual loading and browsers without IntersectionObserver.
    if ("IntersectionObserver" in window && catalogueSentinel) {
      catalogueObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting) && !engineLoading
            && !moreButton.hidden && !moreButton.disabled) {
          fetchEnginePage().catch(() => {});
        }
      }, { root: null, rootMargin: "700px 0px", threshold: 0 });
      catalogueObserver.observe(catalogueSentinel);
    }
  }
  filter();
  loadEngine();
})();
