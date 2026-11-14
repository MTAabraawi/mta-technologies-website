/* MTA Multiplatform Catalog — source-first discovery.
   MTA indexes metadata and sends visitors to the original publisher/store.
   No third-party installers or app binaries are downloaded or hosted here. */
(() => {
  "use strict";
  const form = document.getElementById("mta-global-search");
  const input = document.getElementById("mta-global-query");
  const platform = document.getElementById("mta-global-platform");
  const results = document.getElementById("mta-global-results");
  const status = document.getElementById("mta-global-status");
  if (!form || !input || !platform || !results || !status) return;

  const providers = {
    Android: { label: "F-Droid", url: q => "https://search.f-droid.org/?q=" + encodeURIComponent(q) },
    iOS: { label: "Apple App Store", url: q => "https://www.apple.com/us/search/" + encodeURIComponent(q) },
    Windows: { label: "WinGet", url: q => "https://winget.run/search?query=" + encodeURIComponent(q) },
    Linux: { label: "Flathub", url: q => "https://flathub.org/apps/search?q=" + encodeURIComponent(q) },
    macOS: { label: "Homebrew", url: q => "https://formulae.brew.sh/" },
    Web: { label: "Web applications", url: q => "https://www.google.com/search?q=" + encodeURIComponent(q + " official web app") }
  };

  const httpsUrl = value => {
    try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; }
    catch { return ""; }
  };
  function makeCard({ title, description, source, href, icon }) {
    const article = document.createElement("article");
    article.className = "catalog-result-card";
    if (httpsUrl(icon)) {
      const img = document.createElement("img"); img.src = httpsUrl(icon); img.alt = "";
      img.loading = "lazy"; img.referrerPolicy = "no-referrer"; article.append(img);
    }
    const meta = document.createElement("small"); meta.textContent = source;
    const heading = document.createElement("h3"); heading.textContent = title || "Application";
    const desc = document.createElement("p"); desc.textContent = description || "Open the original source for app details.";
    const link = document.createElement("a"); link.href = httpsUrl(href) || "#";
    link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Open original listing ↗";
    article.append(meta, heading, desc, link);
    return article;
  }
  function sourceLink(name, q, url) {
    const a = document.createElement("a"); a.className = "catalog-source-link";
    a.href = url(q); a.target = "_blank"; a.rel = "noopener noreferrer";
    a.textContent = "Search " + name + " ↗"; return a;
  }
  async function getJson(url) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Provider returned " + response.status);
    return response.json();
  }
  async function searchProvider(key, q) {
    if (key === "Android") {
      const data = await getJson("https://search.f-droid.org/api/search_apps?q=" + encodeURIComponent(q));
      const items = Array.isArray(data) ? data : (data.packages || data.apps || data.results || []);
      return items.slice(0, 20).map(x => ({
        title: x.name || x.packageName || x.package_name || x.package,
        description: x.summary || x.description || x.description_en,
        source: "F-Droid",
        href: x.web_url || x.url || ("https://f-droid.org/packages/" + encodeURIComponent(x.packageName || x.package_name || x.package || "")),
        icon: x.icon
      })).map(makeCard);
    }
    if (key === "iOS" || key === "macOS") {
      const entity = key === "macOS" ? "macSoftware" : "software";
      const data = await getJson("https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&entity=" + entity + "&limit=20&country=us");
      return (data.results || []).map(x => makeCard({
        title: x.trackName, description: x.description, source: key === "macOS" ? "Mac App Store" : "Apple App Store",
        href: x.trackViewUrl, icon: x.artworkUrl512 || x.artworkUrl100
      }));
    }
    if (key === "Windows") {
      const data = await getJson("https://api.winget.run/v2/packages?query=" + encodeURIComponent(q) + "&take=20");
      return (data.Packages || data.packages || []).map(x => {
        const latest = x.Latest || x.latest || {};
        const id = x.Id || x.id || "";
        return makeCard({
          title: latest.Name || latest.name || id,
          description: latest.Description || latest.description || latest.Publisher || latest.publisher,
          source: "WinGet community catalog",
          href: "https://winget.run/pkg/" + encodeURIComponent(id),
          icon: x.IconUrl || x.iconUrl
        });
      });
    }
    return [];
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const q = input.value.trim(); if (!q) { input.focus(); return; }
    const key = platform.value, provider = providers[key];
    results.replaceChildren();
    results.append(sourceLink(provider.label, q, provider.url));
    status.textContent = "Searching " + provider.label + "…";
    try {
      const items = await searchProvider(key, q);
      if (!items.length) {
        status.textContent = "No live API results were returned. Use the official source search link above.";
      } else {
        status.textContent = items.length + " results from " + provider.label + ". Each listing opens at its original source.";
        items.forEach(item => results.append(item));
      }
    } catch (error) {
      status.textContent = "Live results are unavailable from this browser or provider right now. Use the source search link above.";
    }
  });
})();