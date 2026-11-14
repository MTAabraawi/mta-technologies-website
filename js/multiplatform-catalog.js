/* MTA Multiplatform Catalog — source-first discovery.
   Only official/source-provider listing URLs are opened; MTA never hosts third-party binaries. */
(() => {
  "use strict";
  const form = document.getElementById("mta-global-search");
  const input = document.getElementById("mta-global-query");
  const platform = document.getElementById("mta-global-platform");
  const results = document.getElementById("mta-global-results");
  const status = document.getElementById("mta-global-status");
  if (!form || !input || !platform || !results || !status) return;

  const providers = {
    Android: { label: "F-Droid", url: q => "https://search.f-droid.org/?q=" + encodeURIComponent(q), api: q => "https://search.f-droid.org/api/search_apps?q=" + encodeURIComponent(q) },
    iOS: { label: "Apple App Store", url: q => "https://www.apple.com/us/search/" + encodeURIComponent(q) + "?src=globalnav", api: q => "https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&entity=software&limit=20&country=us" },
    Windows: { label: "WinGet packages", url: q => "https://github.com/microsoft/winget-pkgs/search?q=" + encodeURIComponent(q) },
    Linux: { label: "Flathub", url: q => "https://flathub.org/apps/search?q=" + encodeURIComponent(q) },
    macOS: { label: "Homebrew", url: q => "https://formulae.brew.sh/" },
    Web: { label: "Web applications", url: q => "https://www.google.com/search?q=" + encodeURIComponent(q + " official web app") }
  };

  function safeUrl(value) {
    try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; }
    catch { return ""; }
  }
  function card(title, description, source, href, icon) {
    const article = document.createElement("article");
    article.className = "catalog-result-card";
    const heading = document.createElement("h3"); heading.textContent = title || "Application";
    const desc = document.createElement("p"); desc.textContent = description || "Open the original publisher listing for details.";
    const meta = document.createElement("small"); meta.textContent = source;
    const link = document.createElement("a"); link.href = safeUrl(href) || "#"; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Open original listing ↗";
    if (icon && safeUrl(icon)) { const img = document.createElement("img"); img.src = safeUrl(icon); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; article.append(img); }
    article.append(meta, heading, desc, link); return article;
  }
  function sourceLink(name, q, url) {
    const a = document.createElement("a"); a.className = "catalog-source-link"; a.href = url(q); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "Search " + name + " ↗"; return a;
  }
  async function searchProvider(key, q) {
    if (key === "Android") {
      const response = await fetch(providers.Android.api(q), { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("F-Droid search unavailable");
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.packages || data.apps || data.results || []);
      return items.slice(0, 20).map(x => card(x.name || x.packageName || x.package_name, x.summary || x.description || x.description_en, "F-Droid", x.web_url || x.url || ("https://f-droid.org/packages/" + encodeURIComponent(x.packageName || x.package_name || "")), x.icon));
    }
    if (key === "iOS") {
      const response = await fetch(providers.iOS.api(q));
      if (!response.ok) throw new Error("Apple search unavailable");
      const data = await response.json();
      return (data.results || []).map(x => card(x.trackName, x.description, "Apple App Store", x.trackViewUrl, x.artworkUrl512 || x.artworkUrl100));
    }
    return [];
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const q = input.value.trim(); if (!q) { input.focus(); return; }
    const key = platform.value;
    const p = providers[key];
    results.replaceChildren();
    status.textContent = "Searching " + p.label + "…";
    results.append(sourceLink(p.label, q, p.url));
    try {
      const items = await searchProvider(key, q);
      if (!items.length) status.textContent = "No live API results returned. Use the official source search link above.";
      else { status.textContent = items.length + " results from " + p.label + ". Listings open at their original source."; items.forEach(item => results.append(item)); }
    } catch (error) {
      status.textContent = "Live search could not be loaded here. Open the official source search link.";
    }
  });
})();