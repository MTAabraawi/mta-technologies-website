(function () {
  "use strict";

  const search = document.getElementById("app-search");
  const platform = document.getElementById("platform-filter");
  const category = document.getElementById("category-filter");
  const developer = document.getElementById("developer-filter");
  const grid = document.getElementById("apps-grid");
  const empty = document.getElementById("apps-empty");
  const count = document.getElementById("app-count");
  const api = (window.MTA_MARKETPLACE_API || "").replace(/\/$/, "");

  if (!search || !platform || !category || !developer || !grid || !empty || !count) return;

  const isEnglish = () => document.documentElement.lang === "en";
  const text = (ar, en) => isEnglish() ? en : ar;

  function safeHttpsUrl(value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || url.username || url.password) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function makeCard(app) {
    const card = document.createElement("article");
    card.className = "app-card";
    card.dataset.dynamicApp = "true";

    const platforms = Array.isArray(app.platforms)
      ? app.platforms.map(value => String(value).trim()).filter(Boolean)
      : String(app.platform || "").split(",").map(value => value.trim()).filter(Boolean);
    const description = isEnglish()
      ? (app.description_en || app.description || "")
      : (app.description_ar || app.description || "");

    card.dataset.name = app.app_name || "";
    card.dataset.description = description;
    card.dataset.platform = platforms.join(",");
    card.dataset.category = app.category || "Other";
    card.dataset.developer = app.developer_name || "";

    const hasMtaDownload = Boolean((app.download_available === 1 || app.download_available === true) && api && app.id);
    const sourceUrl = safeHttpsUrl(app.source_url);

    const top = document.createElement("div");
    top.className = "app-card-top";

    const icon = document.createElement("div");
    icon.className = "app-icon app-icon-mta";
    icon.textContent = (app.app_name || "APP").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "APP";
    top.append(icon);

    const status = document.createElement("span");
    status.className = "app-status status-live";
    status.textContent = hasMtaDownload
      ? text("تنزيل مستضاف لدى MTA", "MTA-hosted download")
      : text("رابط المصدر الرسمي", "Official source link");
    top.append(status);
    card.append(top);

    const meta = document.createElement("div");
    meta.className = "app-card-meta";
    meta.textContent = (app.developer_name || "Developer") + " · " + platforms.join(", ");
    card.append(meta);

    const title = document.createElement("h3");
    title.textContent = app.app_name || "Application";
    card.append(title);

    const desc = document.createElement("p");
    desc.textContent = description;
    card.append(desc);

    if (app.license_name) {
      const license = document.createElement("small");
      license.className = "app-license";
      license.textContent = text("الترخيص: ", "License: ") + app.license_name;
      card.append(license);
    }

    const tags = document.createElement("div");
    tags.className = "app-tags";
    for (const label of [...platforms, app.category].filter(Boolean)) {
      const span = document.createElement("span");
      span.textContent = label;
      tags.append(span);
    }
    card.append(tags);

    const action = document.createElement("a");
    action.className = "app-card-link";

    if (hasMtaDownload) {
      action.href = api + "/v1/download/" + encodeURIComponent(String(app.id));
      action.textContent = text("تنزيل مباشر", "Direct download");
    } else if (sourceUrl) {
      action.href = sourceUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = text("زيارة المصدر الرسمي", "Visit official source");
    } else {
      action.removeAttribute("href");
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
        .join(" ")
        .toLocaleLowerCase();
      const supportedPlatforms = card.dataset.platform.split(",").map(value => value.trim());
      const matches = searchable.includes(query)
        && (platform.value === "all" || supportedPlatforms.includes(platform.value))
        && (category.value === "all" || card.dataset.category === category.value)
        && (developer.value === "all"
          || (developer.value === "MTA TECHNOLOGIES"
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
      ...[...grid.querySelectorAll(".app-card")].map(card => card.dataset.name.toLocaleLowerCase()),
      ...dynamicApps.map(app => String(app.app_name || "").trim().toLocaleLowerCase())
    ]);

    (Array.isArray(items) ? items : []).forEach(app => {
      if (!app || typeof app !== "object") return;
      const key = String(app.app_name || "").trim().toLocaleLowerCase();
      if (!key || existing.has(key)) return;
      dynamicApps.push(app);
      existing.add(key);
    });

    renderDynamicApps();
  }

  window.addEventListener("mta:languagechange", renderDynamicApps);

  async function loadCurated() {
    try {
      const response = await fetch("data/curated-apps.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Curated catalogue unavailable");
      addApps(await response.json());
    } catch (error) {
      console.warn("Curated catalogue unavailable.", error);
    }
  }

  async function loadApproved() {
    if (!api) return;
    try {
      const response = await fetch(api + "/v1/apps", { credentials: "include" });
      if (!response.ok) throw new Error("Catalogue unavailable");
      const data = await response.json();
      addApps(data.apps || []);
    } catch (error) {
      console.warn("MTA approved catalogue API unavailable; showing curated listings.", error);
    }
  }

  [search, platform, category, developer].forEach(element => {
    element.addEventListener("input", filter);
    element.addEventListener("change", filter);
  });

  filter();
  loadCurated();
  loadApproved();
})();
