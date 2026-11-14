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
      : [platformName(app.platform)];
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

    const top = document.createElement("div");
    top.className = "app-card-top";
    const icon = document.createElement("div");
    icon.className = "app-icon app-icon-image";
    const iconUrl = safeHttpsUrl(app.icon_url || app.icon_path);
    const fallbackIcon = () => {
      const mark = document.createElement("span");
      mark.className = "app-icon-fallback";
      mark.textContent = name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
      return mark;
    };
    if (iconUrl) {
      const img = document.createElement("img");
      img.src = iconUrl;
      img.alt = name + " icon";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        icon.replaceChildren(fallbackIcon());
      }, { once: true });
      icon.append(img);
    } else {
      icon.append(fallbackIcon());
    }
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

  const dynamicApps = [];
  function renderDynamicApps() {
    grid.querySelectorAll('.app-card[data-dynamic-app="true"]').forEach(card => card.remove());
    dynamicApps.forEach(app => grid.insertBefore(makeCard(app), empty));
    filter();
  }
  function addApps(items) {
    const existing = new Set([
      ...[...grid.querySelectorAll(".app-card")].map(card => (card.dataset.name || "").toLocaleLowerCase() + "|" + (card.dataset.platform || "").toLocaleLowerCase()),
      ...dynamicApps.map(app => String(app.app_name || app.name || "").trim().toLocaleLowerCase() + "|" + platformName(app.platform).toLocaleLowerCase())
    ]);
    (Array.isArray(items) ? items : []).forEach(app => {
      if (!app || typeof app !== "object") return;
      const name = String(app.app_name || app.name || "").trim();
      const key = name.toLocaleLowerCase() + "|" + platformName(app.platform).toLocaleLowerCase();
      if (!key || existing.has(key)) return;
      dynamicApps.push({ ...app, app_name: name });
      existing.add(key);
    });
    renderDynamicApps();
  }

  window.addEventListener("mta:languagechange", renderDynamicApps);
  async function loadCurated() {
    try {
      const response = await fetch("data/curated-apps.json", { cache: "no-cache" });
      if (response.ok) addApps(await response.json());
    } catch (error) {
      console.warn("Curated app directory unavailable", error);
    }
  }

  const pageSize = 60;
  let nextOffset = 0;
  let engineTotal = 0;
  let activeQuery = "";
  async function fetchEnginePage() {
    if (!api) return [];
    const button = document.getElementById("load-more-apps");
    if (button) {
      button.disabled = true;
      button.textContent = text("جارٍ التحميل...", "Loading...");
    }
    try {
      const queryPart = activeQuery ? "&q=" + encodeURIComponent(activeQuery) : "";
      const response = await fetch(api + "/api/v1/apps?limit=" + pageSize + "&offset=" + nextOffset + queryPart, {
        credentials: "omit", cache: "no-store"
      });
      if (!response.ok) throw new Error("Catalogue HTTP " + response.status);
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : (payload.apps || payload.items || []);
      addApps(items);
      nextOffset += items.length;
      if (button) {
        button.hidden = items.length < pageSize || (engineTotal > 0 && nextOffset >= engineTotal);
        button.disabled = false;
        button.textContent = text("تحميل المزيد من التطبيقات", "Load more applications");
      }
      return items;
    } catch (error) {
      console.warn("MTA Applications Engine catalogue page unavailable", error);
      if (button) {
        button.hidden = true;
        button.disabled = false;
      }
      throw error;
    }
  }

  async function loadEngine() {
    if (!api) {
      if (connection) connection.textContent = text("محرك الفهرسة غير مضبوط.", "Application engine is not configured.");
      return;
    }
    try {
      const statsResponse = await fetch(api + "/api/v1/catalog-stats", {
        credentials: "omit", cache: "no-store"
      });
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        engineTotal = Number(data.total || 0);
        if (stats) stats.textContent = engineTotal.toLocaleString() + " " + text("تطبيقاً مفهرساً", "indexed applications");
      }
      await fetchEnginePage();
      if (connection) connection.textContent = text(
        "متصل بمحرك MTA العالمي · بيانات وروابط من المصادر الأصلية",
        "Connected to MTA Global Engine · metadata and links from original sources"
      );
    } catch (error) {
      console.warn("MTA Applications Engine is currently unavailable", error);
      if (connection) connection.textContent = text(
        "تعذر الاتصال بالمحرك حالياً؛ ما زالت التطبيقات المحلية وروابط المصادر متاحة.",
        "The engine is temporarily unreachable; local listings and source links remain available."
      );
    }
  }

  [platform, category, developer].forEach(element => {
    element.addEventListener("input", filter);
    element.addEventListener("change", filter);
  });
  let searchTimer = null;
  search.addEventListener("input", () => {
    filter();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const query = search.value.trim();
      if (query === activeQuery) return;
      activeQuery = query;
      nextOffset = 0;
      fetchEnginePage().catch(() => {});
    }, 450);
  });
  const moreButton = document.getElementById("load-more-apps");
  if (moreButton) moreButton.addEventListener("click", () => fetchEnginePage().catch(() => {}));
  filter();
  loadCurated();
  loadEngine();
})();
