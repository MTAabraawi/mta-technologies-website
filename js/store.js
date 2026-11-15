(() => {
"use strict";
const API=String(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
const stores={
"google-play":{name:"Google Play",platforms:["Android"],url:"https://play.google.com/store",host:"play.google.com",mode:"external",desc:"متجر تطبيقات Android الرسمي من Google. لا تتوفر حالياً واجهة بيانات عامة معتمدة متصلة بمحرك MTA لهذا الكتالوج."},
"apkmirror":{name:"APKMirror",platforms:["Android"],url:"https://www.apkmirror.com/",host:"apkmirror.com",mode:"external",desc:"مستودع يعرض إصدارات تطبيقات Android وروابط صفحاتها. لم يتم ربط مصدر بيانات آلي موثوق به حتى الآن."},
"apkpure":{name:"APKPure",platforms:["Android"],url:"https://apkpure.com/",host:"apkpure.com",mode:"external",desc:"كتالوج تطبيقات Android تابع لمصدره الأصلي. الربط الآلي غير متاح حالياً."},
"uptodown":{name:"Uptodown",platforms:["Android","Windows","macOS"],url:"https://en.uptodown.com/android",host:"uptodown.com",mode:"external",desc:"منصة توزيع تطبيقات وبرامج متعددة. لم يتوفر تكامل بيانات عام موثوق بعد."},
"aptoide":{name:"Aptoide",platforms:["Android"],url:"https://www.aptoide.com/",host:"aptoide.com",mode:"external",desc:"متجر Android بديل. نعرض صفحة تعريف المتجر إلى أن يتوفر اتصال بيانات يمكن التحقق منه."},
"amazon-appstore":{name:"Amazon Appstore",platforms:["Android","Windows"],url:"https://www.amazon.com/gp/mas/get/android",host:"amazon.com",mode:"external",desc:"متجر Amazon للتطبيقات. التصفح داخل MTA قيد دراسة تكامل رسمي مناسب."},
"fdroid":{name:"F-Droid",platforms:["Android"],url:"https://f-droid.org/",host:"f-droid.org",source:"fdroid",mode:"live",desc:"مستودع تطبيقات Android الحرة ومفتوحة المصدر. يعرض MTA بيانات التطبيقات الوصفية المتاحة من فهرس F-Droid."},
"huawei-appgallery":{name:"Huawei AppGallery",platforms:["Android","HarmonyOS"],url:"https://appgallery.huawei.com/",host:"appgallery.huawei.com",mode:"external",desc:"متجر Huawei الرسمي. لا يوجد حالياً موصل بيانات عام موثوق يسمح بفهرسة الكتالوج كاملاً."},
"samsung-galaxy-store":{name:"Samsung Galaxy Store",platforms:["Android"],url:"https://galaxystore.samsung.com/",host:"galaxystore.samsung.com",mode:"external",desc:"متجر Samsung لأجهزة Galaxy. إتاحة الكتالوج والواجهات تختلف حسب الجهاز والمنطقة."},
"xiaomi-getapps":{name:"Xiaomi GetApps",platforms:["Android"],url:"https://global.app.mi.com/",host:"mi.com",mode:"external",desc:"متجر Xiaomi الإقليمي. لم يتوفر مصدر بيانات عام يمكن الاعتماد عليه للفهرسة الآلية."},
"oppo-app-market":{name:"OPPO App Market",platforms:["Android"],url:"https://store.oppomobile.com/",host:"oppomobile.com",mode:"external",desc:"متجر OPPO للأجهزة المدعومة، وقد تختلف إتاحته حسب المنطقة."},
"vivo-app-store":{name:"Vivo App Store",platforms:["Android"],url:"https://appstore.vivo.com/",host:"vivo.com",mode:"external",desc:"متجر vivo الرسمي. لم يتوفر تكامل بيانات عام موثوق بعد."},
"one-store":{name:"ONE Store",platforms:["Android"],url:"https://www.onestore.co.kr/",host:"onestore.co.kr",mode:"external",desc:"متجر تطبيقات إقليمي في كوريا الجنوبية."},
"taptap":{name:"TapTap",platforms:["Android","iOS"],url:"https://www.taptap.io/",host:"taptap.io",mode:"external",desc:"منصة اكتشاف وتوزيع ألعاب. لم يتم ربط واجهة بيانات موثوقة لهذا الكتالوج بعد."},
"qooapp":{name:"QooApp",platforms:["Android"],url:"https://www.qoo-app.com/",host:"qoo-app.com",mode:"external",desc:"منصة ألعاب وتطبيقات تركز على أسواق آسيا."},
"honor-app-market":{name:"HONOR App Market",platforms:["Android"],url:"https://www.honor.com/global/tech/honor-app-market/",host:"honor.com",mode:"external",desc:"متجر HONOR، وقد تختلف خدماته حسب البلد والجهاز."},
"360-mobile-assistant":{name:"360 Mobile Assistant",platforms:["Android"],url:"https://zhushou.360.cn/",host:"360.cn",mode:"external",desc:"كتالوج Android صيني. لا توجد حالياً آلية موثوقة لاستيراد بياناته إلى MTA."},
"baidu-mobile-assistant":{name:"Baidu Mobile Assistant",platforms:["Android"],url:"https://mobile.baidu.com/",host:"baidu.com",mode:"external",desc:"منصة تطبيقات صينية. يتطلب الوصول إلى الكتالوج مراعاة اللغة والمنطقة وسياسات المصدر."},
"wandoujia":{name:"Wandoujia",platforms:["Android"],url:"https://www.wandoujia.com/",host:"wandoujia.com",mode:"external",desc:"كتالوج تطبيقات Android صيني."},
"rustore":{name:"RuStore",platforms:["Android","HarmonyOS"],url:"https://www.rustore.ru/en",host:"rustore.ru",mode:"external",desc:"متجر تطبيقات روسي. لم يتوفر حتى الآن تكامل بيانات عام معتمد داخل محرك MTA."},
"izzyondroid":{name:"IzzyOnDroid",platforms:["Android"],url:"https://apt.izzysoft.de/",host:"izzysoft.de",source:"izzyondroid",mode:"live",desc:"مستودع Android مفتوح المصدر، ويفهرس MTA بيانات الحزم التي يوفرها الفهرس العام."},
"accrescent":{name:"Accrescent",platforms:["Android"],url:"https://accrescent.app/",host:"accrescent.app",mode:"external",desc:"متجر Android بديل يركز على الأمان. لا توجد واجهة فهرسة عامة متصلة حالياً."},
"aurora-store":{name:"Aurora Store",platforms:["Android"],url:"https://auroraoss.com/",host:"auroraoss.com",mode:"external",desc:"عميل بديل للوصول إلى كتالوج Google Play، وليس مصدراً مستقلاً لبيانات MTA."},
"apple-app-store":{name:"Apple App Store",platforms:["iOS","iPadOS"],url:"https://www.apple.com/app-store/",host:"apple.com",source:"apple-itunes",mode:"live",desc:"يعرض MTA نتائج التطبيقات المتاحة عبر فهرس Apple iTunes Search API، وقد تختلف النتائج حسب بلد المتجر."},
"altstore":{name:"AltStore",platforms:["iOS"],url:"https://altstore.io/",host:"altstore.io",mode:"external",desc:"متجر وتوزيع بديل لتطبيقات iOS؛ تختلف التغطية والخيارات باختلاف المنطقة والإصدار."},
"skich-store":{name:"Skich Store",platforms:["iOS","Android"],url:"https://skich.app/store",host:"skich.app",mode:"external",desc:"منصة اكتشاف ألعاب وتطبيقات؛ تختلف الإتاحة حسب المنصة والمنطقة."},
"microsoft-store":{name:"Microsoft Store",platforms:["Windows"],url:"https://apps.microsoft.com/",host:"apps.microsoft.com",mode:"external",desc:"متجر Microsoft الرسمي لتطبيقات Windows. لا توجد واجهة فهرسة عامة متصلة حالياً."},
"winget":{name:"WinGet",platforms:["Windows"],url:"https://winget.run/",host:"winget.run",source:"winget-run-community",mode:"live",desc:"كتالوج حزم Windows Community عبر WinGet، ويعرض MTA بيانات الحزم المتاحة من الفهرس العام."},
"chocolatey":{name:"Chocolatey",platforms:["Windows"],url:"https://community.chocolatey.org/packages",host:"chocolatey.org",mode:"external",desc:"مستودع حزم Windows. يمكن إضافة تكامل عند توفر مصدر بيانات مناسب ومستقر."},
"npackd":{name:"Npackd",platforms:["Windows"],url:"https://www.npackd.org/",host:"npackd.org",mode:"external",desc:"مدير حزم وكتالوج برامج Windows."},
"flathub":{name:"Flathub",platforms:["Linux"],url:"https://flathub.org/",host:"flathub.org",source:"flathub",mode:"live",desc:"كتالوج تطبيقات Linux عبر Flatpak، مع بيانات وصفية وروابط الصفحات الأصلية."},
"snap-store":{name:"Snap Store",platforms:["Linux"],url:"https://snapcraft.io/store",host:"snapcraft.io",source:"snap-store",mode:"live",desc:"كتالوج حزم Snap لتوزيعات Linux. تتوفر سجلات مفهرسة حالياً بحسب إحصاءات المحرك."},
"arch-linux":{name:"Arch Linux Packages",platforms:["Linux"],url:"https://archlinux.org/packages/",host:"archlinux.org",source:"arch-linux",mode:"live",desc:"قاعدة بيانات حزم Arch Linux مع بيانات الحزم وروابط المصدر."},
"debian-packages":{name:"Debian Packages",platforms:["Linux"],url:"https://packages.debian.org/",host:"debian.org",source:"debian-packages",mode:"live",desc:"كتالوج حزم Debian. قد يتغير عدد الحزم حسب إصدار التوزيعة والمعمارية."},
"ubuntu-app-center":{name:"Ubuntu App Center",platforms:["Linux"],url:"https://apps.ubuntu.com/",host:"ubuntu.com",mode:"external",desc:"واجهة تطبيقات Ubuntu؛ بعض التطبيقات تأتي عبر Snap أو مصادر أخرى."},
"mac-app-store":{name:"Mac App Store",platforms:["macOS"],url:"https://www.apple.com/mac/app-store/",host:"apple.com",source:"apple-macos",mode:"live",desc:"كتالوج تطبيقات macOS عبر بيانات Apple المتاحة للبحث. قد لا يمثل كامل المتجر."},
"homebrew":{name:"Homebrew Cask",platforms:["macOS"],url:"https://brew.sh/",host:"brew.sh",source:"homebrew-cask",mode:"live",desc:"كتالوج تطبيقات macOS القابلة للتثبيت عبر Homebrew Cask."},
"steam":{name:"Steam",platforms:["Windows","macOS","Linux"],url:"https://store.steampowered.com/",host:"steampowered.com",source:"steam",mode:"partial",desc:"بحث محدود في واجهة Steam العامة؛ لا يمثل كامل مكتبة المتجر أو كل المنتجات."},
"epic-games-store":{name:"Epic Games Store",platforms:["Windows","macOS"],url:"https://store.epicgames.com/",host:"epicgames.com",mode:"external",desc:"متجر Epic Games للألعاب."},
"gog":{name:"GOG",platforms:["Windows","macOS","Linux"],url:"https://www.gog.com/",host:"gog.com",mode:"external",desc:"متجر ألعاب يركز على الألعاب الخالية من إدارة الحقوق الرقمية حيثما ينطبق."},
"ea-app":{name:"EA app",platforms:["Windows","macOS"],url:"https://www.ea.com/ea-app",host:"ea.com",mode:"external",desc:"منصة EA للألعاب والخدمات المرتبطة بها."},
"itch-io":{name:"itch.io",platforms:["Windows","macOS","Linux","Web"],url:"https://itch.io/",host:"itch.io",mode:"external",desc:"منصة ألعاب مستقلة ومحتوى رقمي من المطورين."},
"mta-web-apps":{name:"MTA Web Apps",platforms:["Web"],url:"https://www.mtahqq.dpdns.org/apps.html",host:"mtahqq.dpdns.org",source:"mta-curated-web",mode:"live",desc:"تطبيقات ويب مدرجة في دليل MTA التحريري."},
"product-hunt":{name:"Product Hunt",platforms:["Web"],url:"https://www.producthunt.com/",host:"producthunt.com",mode:"external",desc:"منصة اكتشاف منتجات وشركات ناشئة وأدوات ويب."}
};
const $=id=>document.getElementById(id), params=new URLSearchParams(location.search), key=params.get("store")||"", store=stores[key];
const safe=(value)=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:""}catch{return""}};
const lang=()=>document.documentElement.lang==="en";
const copy=(ar,en)=>lang()?en:ar;
const title=$("store-title"), subtitle=$("store-subtitle"), logo=$("store-logo"), official=$("store-official-link"), status=$("store-status"), desc=$("store-description");
if(!store){$("store-results-note").textContent=copy("لم يتم العثور على المتجر المطلوب. ارجع إلى دليل المتاجر لاختيار متجر آخر.","Store not found. Return to the marketplace and choose another store.");$("store-catalogue-section").hidden=true;}
else{
 title.textContent=store.name; $("breadcrumb-store").textContent=store.name; document.title=store.name+" | MTA TECHNOLOGIES"; const canonical=document.querySelector("link[rel=canonical]"); if(canonical)canonical.href=location.origin+location.pathname+"?store="+encodeURIComponent(key); const descriptionMeta=document.querySelector("meta[name=description]"); if(descriptionMeta)descriptionMeta.content=store.name+" catalogue on MTA TECHNOLOGIES. Browse verified app metadata and original publisher links.";
 $("store-description").textContent=store.desc; subtitle.textContent=store.platforms.join(" · ");
 const logoUrl="https://www.google.com/s2/favicons?domain="+encodeURIComponent(store.host)+"&sz=128";
 logo.src=logoUrl;logo.alt=store.name+" logo";logo.onerror=()=>{logo.src="images/mta-logo-square.png"};
 official.href=store.url;
 $("store-platforms").replaceChildren(...store.platforms.map(p=>{const s=document.createElement("span");s.textContent=p;return s}));
 const connected=!!store.source;
 status.textContent=store.mode==="live"?copy("مصدر متصل","Connected catalogue"):store.mode==="partial"?copy("تكامل جزئي","Partial integration"):copy("كتالوج خارجي · غير مفهرس بعد","External catalogue · not indexed yet");
 status.classList.toggle("is-connected",connected);
 if(!connected){const robots=document.querySelector("meta[name=robots]");if(robots)robots.content="noindex,follow";$("store-search-row").hidden=true;$("store-catalogue-section").querySelector(".store-catalogue-heading").hidden=true;$("store-unavailable").hidden=false;$("store-unavailable-copy").textContent=store.desc;$("store-unavailable-link").href=store.url;$("store-results-note").textContent=copy("لا نعرض سجلات تطبيقات من هذا المتجر حتى يتوفر مصدر بيانات قابل للتحقق.","No app records are shown until a verifiable data source is available.");}
}
const grid=$("store-app-grid"), count=$("store-count"), load=$("store-load-more"), search=$("store-search"), platform=$("store-platform-filter");
let offset=0,total=0,loading=false,exhausted=false,query="",timer=null;
function makeCard(app){
 const card=document.createElement("article");card.className="store-app-card";card.dataset.category=String(app.category||"Other").split(",")[0].trim();card.dataset.platform=String(app.platform||"").toLowerCase();
 const top=document.createElement("div");top.className="store-app-top";
 const icon=document.createElement("img");icon.className="store-app-icon";icon.loading="lazy";icon.decoding="async";icon.alt=(app.name||"App")+" icon";
 const iconUrl=safe(app.icon_url||"");icon.src=iconUrl||"images/mta-logo-square.png";icon.onerror=()=>{icon.onerror=null;icon.src="images/mta-logo-square.png"};
 const badge=document.createElement("span");badge.className="store-app-source";badge.textContent=app.source||store.name;top.append(icon,badge);
 const h=document.createElement("h3");h.textContent=app.name||"Application";
 const meta=document.createElement("p");meta.className="store-app-meta";meta.textContent=[app.developer,app.platform,app.category].filter(Boolean).join(" · ");
 const summary=document.createElement("p");summary.className="store-app-summary";summary.textContent=app.summary||app.description||copy("لا يتوفر وصف مختصر لهذا التطبيق في بيانات المصدر.","No short description is available in the source metadata.");
 const tags=document.createElement("div");tags.className="store-app-tags";[app.platform,app.license].filter(Boolean).forEach(v=>{const x=document.createElement("span");x.textContent=v;tags.append(x)});
 const link=document.createElement("a");link.className="store-app-link";link.href=safe(app.source_url||app.app_url)||store.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=copy("عرض التطبيق في مصدره الأصلي ↗","View original app listing ↗");
 card.append(top,h,meta,summary);if(details)card.append(details);card.append(tags,link);return card;
}
function setEmpty(message){$("store-empty").hidden=false;$("store-empty").textContent=message}\nfunction applyLocalFilters(){const selected=$("store-category-filter")?.value||"";const cards=Array.from(grid.querySelectorAll(".store-app-card"));cards.forEach(card=>card.hidden=!!selected&&card.dataset.category!==selected);if($("store-sort")?.value==="name"){cards.sort((a,b)=>a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent));cards.forEach(card=>grid.append(card))}}
async function fetchPage(reset=false){
 if(!store?.source||loading||exhausted||!API)return;
 if(reset){offset=0;exhausted=false;total=0;grid.replaceChildren();$("store-empty").hidden=true}
 loading=true;load.hidden=false;load.disabled=true;load.textContent=copy("جارٍ التحميل...","Loading...");
 try{
  const p=new URLSearchParams({source:store.source,limit:"36",offset:String(offset)});
  if(query)p.set("q",query);if(platform.value)p.set("platform",platform.value);
  const response=await fetch(API+"/api/v1/apps?"+p.toString(),{cache:"no-store",credentials:"omit"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const items=await response.json();if(!Array.isArray(items))throw new Error("Invalid catalogue response");
  total=Number(response.headers.get("X-Total-Count")||total||0);
  if(!items.length&&offset===0){exhausted=true;setEmpty(copy("لا توجد تطبيقات مطابقة أو لا توجد سجلات متاحة حالياً لهذا المصدر.","No matching apps or no indexed records are currently available for this source."))}
  items.forEach(app=>grid.append(makeCard(app)));applyLocalFilters();if(reset&&items.length){const schema={"@context":"https://schema.org","@type":"ItemList","name":store.name+" applications","itemListElement":items.slice(0,36).map((app,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"SoftwareApplication","name":String(app.name||"Application"),"operatingSystem":String(app.platform||store.platforms.join(", ")),"applicationCategory":String(app.category||"Software"),"description":String(app.summary||app.description||"").slice(0,500),"url":safe(app.source_url||app.app_url)||store.url}}))};let ld=document.getElementById("store-itemlist-schema");if(!ld){ld=document.createElement("script");ld.type="application/ld+json";ld.id="store-itemlist-schema";document.head.append(ld)}ld.textContent=JSON.stringify(schema)}offset+=items.length;
  if(items.length<36||(total&&offset>=total))exhausted=true;
  count.textContent=total?total.toLocaleString()+" "+copy("تطبيق مفهرس","indexed apps"):offset.toLocaleString()+" "+copy("تطبيق معروض","apps shown");
  $("store-results-note").textContent=total?copy("تُعرض بيانات المصدر على دفعات. إجمالي السجلات المفهرسة لهذا المصدر: "+total.toLocaleString(),"Results load in batches. Indexed records for this source: "+total.toLocaleString()):copy("نتائج من واجهة المصدر المتاحة لمحرك MTA.","Results from the source integration available to MTA.");
  load.hidden=exhausted;load.disabled=false;load.textContent=copy("تحميل المزيد","Load more");
 }catch(e){console.error("Store catalogue fetch failed",e);if(!offset)setEmpty(copy("تعذر الاتصال بكتالوج التطبيقات الآن. أعد المحاولة بعد قليل.","The app catalogue could not be reached. Please retry shortly."));load.hidden=false;load.disabled=false;load.textContent=copy("إعادة المحاولة","Retry");}
 finally{loading=false;load.disabled=false}
}
if(store?.source){if(store.source==="steam"){$("store-results-note").textContent=copy("اكتب اسم لعبة أو برنامج للبحث في نتائج Steam المتاحة.","Enter a game or software title to search available Steam results.");grid.replaceChildren();setEmpty(copy("ابدأ البحث باسم لعبة أو برنامج لعرض النتائج المتاحة من Steam.","Search for a game or software title to view available Steam results."));}else fetchPage(true);load.addEventListener("click",()=>fetchPage(false));$("store-category-filter").addEventListener("change",applyLocalFilters);$("store-sort").addEventListener("change",applyLocalFilters);search.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{query=search.value.trim();if(store.source==="steam"&&query.length<2)return;fetchPage(true)},350)});platform.addEventListener("change",()=>fetchPage(true));}
window.addEventListener("mta:languagechange",()=>{if(store){document.title=store.name+" | MTA TECHNOLOGIES"}});
})();