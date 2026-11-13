(() => {
  "use strict";
  const lang = () => document.documentElement.lang === "en" ? "en" : "ar";
  const copy = (ar, en) => lang() === "en" ? en : ar;
  const section = document.createElement("section");
  section.className = "container external-catalogs";
  section.id = "external-catalog-search";
  section.innerHTML = `
    <div class="apps-section-heading">
      <span class="apps-eyebrow">CONNECTED APP CATALOGS</span>
      <h2><span class="ar-only">ابحث في كتالوجات التطبيقات العالمية</span><span class="en-only">Search global app catalogs</span></h2>
      <p><span class="ar-only">نتائج مباشرة من F-Droid وApple App Store، مع رابط بحث رسمي في Flathub. التنزيل يتم من المصدر الأصلي.</span><span class="en-only">Live results from F-Droid and Apple App Store, plus an official Flathub search link. Downloads remain on the original source.</span></p>
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
    <p class="external-catalog-footnote"><span class="ar-only">هذه واجهات بحث وبيانات تعريفية فقط. لا تتحقق نتائج البحث وحدها من سلامة ملفات APK أو صحة التوقيع، ولا تمنح MTA حق إعادة الاستضافة. لا نرفع أو نستضيف أي ملف من هذه المصادر.</span><span class="en-only">These are search and metadata integrations only. Search results do not verify APK integrity or signatures and do not grant MTA redistribution rights. No files from these catalogs are uploaded or mirrored.</span></p>`;
  const storeSection = document.querySelector(".store-directory-section");
  if (storeSection) storeSection.before(section);
  const form = section.querySelector("#external-catalog-form");
  const queryInput = section.querySelector("#external-catalog-query");
  const status = section.querySelector("#external-catalog-status");
  const resultsRoot = section.querySelector("#external-catalog-results");
  const flathubLink = section.querySelector("#flathub-search-link");
  const make = (tag, cls, value) => { const node=document.createElement(tag); if(cls) node.className=cls; node.textContent=value || ""; return node; };
  function card(source, name, developer, detail, href) {
    const article=make("article","external-result-card","");
    article.append(make("span","external-result-source",source));
    article.append(make("h3","",name || copy("تطبيق بدون اسم","Untitled app")));
    if(developer) article.append(make("p","external-result-developer",developer));
    if(detail) article.append(make("p","external-result-detail",detail));
    const link=make("a","app-card-link",copy("زيارة المصدر الرسمي ↗","Open official source ↗"));
    link.href=href; link.target="_blank"; link.rel="noopener noreferrer"; article.append(link);
    return article;
  }
  function extractF(repo) {
    if(Array.isArray(repo)) return repo;
    if(Array.isArray(repo?.apps)) return repo.apps;
    if(Array.isArray(repo?.results)) return repo.results;
    if(Array.isArray(repo?.hits)) return repo.hits;
    if(Array.isArray(repo?.data)) return repo.data;
    return [];
  }
  async function search(q) {
    resultsRoot.replaceChildren();
    status.textContent=copy("جارٍ البحث في F-Droid وApple App Store...","Searching F-Droid and Apple App Store...");
    flathubLink.href="https://flathub.org/apps/search?q="+encodeURIComponent(q);
    const jobs = [
      fetch("https://search.f-droid.org/api/search_apps?q="+encodeURIComponent(q),{headers:{Accept:"application/json"}}).then(async r=>{if(!r.ok) throw new Error("F-Droid "+r.status); return extractF(await r.json());}).then(items=>({source:"F-Droid",items})),
      fetch("https://itunes.apple.com/search?term="+encodeURIComponent(q)+"&entity=software&country=us&limit=15").then(async r=>{if(!r.ok) throw new Error("Apple "+r.status); return (await r.json()).results || [];}).then(items=>({source:"Apple App Store",items}))
    ];
    const settled=await Promise.allSettled(jobs);
    let total=0, failures=0;
    for(let i=0;i<settled.length;i++){
      const result=settled[i];
      const source=i===0?"F-Droid":"Apple App Store";
      if(result.status!=="fulfilled"){failures++; continue;}
      const items=result.value.items.slice(0,15);
      for(const item of items){
        let node;
        if(source==="F-Droid"){
          const href=item.url || (item.packageName || item.package_name || item.id || item.package
            ? "https://f-droid.org/packages/"+encodeURIComponent(item.packageName || item.package_name || item.id || item.package)+"/"
            : "https://f-droid.org/");
          const packageId=(href.match(/\\/packages\\/([^/?#]+)/)||[])[1] || "";
          const name=item.name || item.localizedName || item.title || packageId;
          const developer=item.authorName || item.author || item.developer || "";
          const detail=[item.summary || item.description || "",packageId,item.suggestedVersionName || item.versionName || item.version || ""].filter(Boolean).join(" · ");
          node=card(source,name,developer,detail,href);
        } else {
          const href=item.trackViewUrl || "https://www.apple.com/app-store/";
          node=card(source,item.trackName,item.sellerName || item.artistName,[item.primaryGenreName,item.version].filter(Boolean).join(" · "),href);
        }
        resultsRoot.append(node); total++;
      }
    }
    status.textContent=total
      ? copy("عُثر على "+total+" نتيجة. Flathub متاح عبر رابط البحث الرسمي أعلاه.","Found "+total+" results. Flathub is available through the official search link above.")
      : copy("لم تصل نتائج مباشرة. قد يكون المصدر غير متاح مؤقتاً؛ استخدم روابط المصادر الرسمية أعلاه.","No live results received. A source may be temporarily unavailable; use the official source links above.");
    if(failures) status.textContent += copy(" تعذّر الاتصال بمصدر واحد أو أكثر."," One or more sources could not be reached.");
  }
  form.addEventListener("submit",event=>{event.preventDefault();const q=queryInput.value.trim();if(q.length>=2) search(q);});
})();