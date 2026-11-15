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
const grid=$("store-app-grid"), count=$("store-count"), load=$("store-load-more"), search=$("store-search"), platform=$("store-platform-filter");
const safe=(value)=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:""}catch{return""}};
const lang=()=>document.documentElement.lang==="en";
const copy=(ar,en)=>lang()?en:ar;
const title=$("store-title"), subtitle=$("store-subtitle"), logo=$("store-logo"), official=$("store-official-link"), status=$("store-status"), desc=$("store-description");
if(!store){$("store-results-note").textContent=copy("لم يتم العثور على المتجر المطلوب. ارجع إلى دليل المتاجر لاختيار متجر آخر.","Store not found. Return to the marketplace and choose another store.");$("store-catalogue-section").hidden=true;}
else{
 title.textContent=store.name; $("breadcrumb-store").textContent=store.name; document.title=store.name+" | MTA TECHNOLOGIES"; const canonical=document.querySelector("link[rel=canonical]"); if(canonical)canonical.href=location.origin+location.pathname+"?store="+encodeURIComponent(key); const descriptionMeta=document.querySelector("meta[name=description]"); if(descriptionMeta)descriptionMeta.content=store.name+" catalogue on MTA TECHNOLOGIES. "+store.desc+" Browse verified app metadata, developer details, platform information and original publisher links.";
 $("store-description").textContent=store.desc; subtitle.textContent=store.platforms.join(" · ");
 const editorialIntro=$("store-editorial-intro"),editorialWhat=$("store-editorial-what"),editorialVerify=$("store-editorial-verify"),editorialAvailability=$("store-editorial-availability");
 if(editorialIntro)editorialIntro.textContent=lang()?("Browse "+store.name+" through MTA's source-aware catalogue. "+store.platforms.join(", ")+". "+store.desc):("تصفح "+store.name+" عبر دليل MTA مع توضيح مصدر البيانات وحالة الفهرسة. "+store.desc);
 if(editorialWhat)editorialWhat.textContent=lang()?"Explore indexed app names, developers, categories, descriptions, platform compatibility and publisher icons when supplied.":"تصفح أسماء التطبيقات المفهرسة والمطورين والتصنيفات والأوصاف والمنصات والأيقونات التي يوفرها الناشر.";
 if(editorialVerify)editorialVerify.textContent=lang()?"MTA keeps each catalogue source separate, checks live indexed-record counts and links every listing to its original source.":"نفصل بيانات كل متجر عن غيره، ونتحقق من عدد السجلات المفهرسة فعلياً، ونربط كل تطبيق بصفحته الأصلية.";
 if(editorialAvailability)editorialAvailability.textContent=lang()?"Store availability, pricing and regional access are controlled by the original provider and may vary by country, device and account.":"تخضع إتاحة التطبيقات وأسعارها والوصول الإقليمي لسياسات المتجر الأصلي، وقد تختلف حسب البلد والجهاز والحساب.";
 const storeSchema=document.createElement("script");storeSchema.type="application/ld+json";storeSchema.id="store-profile-schema";storeSchema.textContent=JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":store.name+" catalogue","description":store.desc,"url":location.href,"inLanguage":["ar","en"],"about":{"@type":"Thing","name":store.name+" app catalogue"}});document.head.append(storeSchema);
 const logoUrl="https://www.google.com/s2/favicons?domain="+encodeURIComponent(store.host)+"&sz=128",logoFallback="https://icons.duckduckgo.com/ip3/"+encodeURIComponent(store.host)+".ico";
 logo.src=logoUrl;logo.alt=store.name+" logo";logo.onerror=()=>{if(logo.src!==logoFallback)logo.src=logoFallback;else{logo.onerror=null;logo.src="images/mta-logo-square.png"}};
 official.href=store.url;
 $("store-platforms").replaceChildren(...store.platforms.map(p=>{const s=document.createElement("span");s.textContent=p;return s}));
 const connected=!!store.source;if(store.source==="steam"&&!Array.from($("store-platform-filter").options).some(o=>o.value==="pc-games")){const option=document.createElement("option");option.value="pc-games";option.textContent="PC Games";$("store-platform-filter").append(option)}
 status.textContent=connected?copy("جارٍ التحقق من توفر السجلات","Checking indexed records"):copy("نعمل على توفيرها قريباً","Coming soon");status.classList.remove("is-connected");
 const robots=document.querySelector("meta[name=robots]");if(robots)robots.content="noindex,follow";
 if(!connected){const robots=document.querySelector("meta[name=robots]");if(robots)robots.content="noindex,follow";$("store-search-row").hidden=true;grid.hidden=true;load.hidden=true;$("store-catalogue-section").querySelector(".store-catalogue-heading").hidden=true;$("store-unavailable").hidden=false;$("store-unavailable-copy").textContent=store.desc;$("store-unavailable-link").href=store.url;$("store-results-note").textContent=copy("لا نعرض سجلات تطبيقات من هذا المتجر حتى يتوفر مصدر بيانات قابل للتحقق.","No app records are shown until a verifiable data source is available.");}
}

let offset=0,total=0,loading=false,exhausted=false,query="",timer=null;
function makeCard(app){
 const card=document.createElement("article");card.className="store-app-card";card.dataset.category=String(app.category||"Other").split(",")[0].trim();card.dataset.platform=String(app.platform||"").toLowerCase();
 const top=document.createElement("div");top.className="store-app-top";
 const icon=document.createElement("img");icon.className="store-app-icon";icon.loading="lazy";icon.decoding="async";icon.alt=(app.name||"App")+" icon";
 let metadata=app.metadata_json&&typeof app.metadata_json==="object"?app.metadata_json:{};
 if(typeof app.metadata_json==="string"){try{metadata=JSON.parse(app.metadata_json)}catch{metadata={}}}
 const pageUrl=safe(app.app_url||metadata.homepage||metadata.website||metadata.homepage_url||metadata.project_url||metadata.publisher_url||app.source_url||"");let host="";try{host=pageUrl?new URL(pageUrl).hostname.replace(/^www\./,""):""}catch{}
 const iconObject=metadata.icon&&typeof metadata.icon==="object"?metadata.icon:{};
 const iconCollection=metadata.icons&&typeof metadata.icons==="object"?Object.values(metadata.icons):[];
 const metadataIcons=[metadata.icon_url,metadata.iconUrl,metadata.icon,iconObject.url,iconObject.path,metadata.logo,metadata.image,metadata.image_url,metadata.artworkUrl512,metadata.artworkUrl100,metadata.thumbnail,...iconCollection];
 const iconUrl=safe(app.icon_url||"");
 const candidates=[iconUrl,...metadataIcons.map(value=>safe(typeof value==="string"?value:(value&&typeof value==="object"?(value.url||value.path||""):""))),host?"https://www.google.com/s2/favicons?domain="+encodeURIComponent(host)+"&sz=128":"",host?"https://icons.duckduckgo.com/ip3/"+encodeURIComponent(host)+".ico":""].filter((v,i,a)=>v&&a.indexOf(v)===i);
 let iconIndex=0;
 const makeMonogram=()=>{const mark=document.createElement("span");mark.className="store-app-icon-fallback";mark.setAttribute("aria-label",(app.name||"App")+" icon unavailable");mark.textContent=String(app.name||"A").trim().split(/\s+/).slice(0,2).map(x=>x.charAt(0)).join("").toUpperCase();return mark};
 icon.onerror=()=>{iconIndex++;if(iconIndex<candidates.length)icon.src=candidates[iconIndex];else if(icon.parentNode)icon.replaceWith(makeMonogram())};
 const badge=document.createElement("span");badge.className="store-app-source";badge.textContent=app.source||store.name;
 if(candidates.length){top.append(icon,badge);icon.src=candidates[0]}else{top.append(makeMonogram(),badge)}
 const h=document.createElement("h3");
 const detailParams=new URLSearchParams({source:String(app.source||store.source||""),id:String(app.external_id||app.id||""),name:String(app.name||"Application")});
 const detailUrl="application.html?"+detailParams.toString();
 const titleLink=document.createElement("a");titleLink.href=detailUrl;titleLink.textContent=app.name||"Application";titleLink.setAttribute("aria-label",copy("تفاصيل "+(app.name||"التطبيق"),"Details for "+(app.name||"application")));h.append(titleLink);
 const detailLink=document.createElement("a");detailLink.className="store-app-detail-link";detailLink.href=detailUrl;detailLink.textContent=copy("تفاصيل التطبيق داخل MTA","View app details on MTA");
 const meta=document.createElement("p");meta.className="store-app-meta";const platformLabel=app.platform==="pc-games"?"PC Games":app.platform;meta.textContent=[app.developer,platformLabel,app.category].filter(Boolean).join(" · ");
 const summary=document.createElement("p");summary.className="store-app-summary";summary.textContent=app.summary||app.description||copy("لا يتوفر وصف مختصر لهذا التطبيق في بيانات المصدر.","No short description is available in the source metadata.");
 let details=null;const fullDescription=String(app.description||"").trim();
 if(fullDescription&&fullDescription!==String(app.summary||"").trim()){
  details=document.createElement("details");details.className="store-app-details";
  const summaryToggle=document.createElement("summary");summaryToggle.textContent=copy("قراءة التفاصيل","Read full description");
  const body=document.createElement("p");body.textContent=fullDescription;details.append(summaryToggle,body);
 }
 const categorySelect=$("store-category-filter"),category=card.dataset.category;
 if(category&&categorySelect&&!Array.from(categorySelect.options).some(o=>o.value===category)){
  const option=document.createElement("option");option.value=category;option.textContent=category;categorySelect.append(option);
 }
 const tags=document.createElement("div");tags.className="store-app-tags";[platformLabel,app.license].filter(Boolean).forEach(v=>{const x=document.createElement("span");x.textContent=v;tags.append(x)});const price=app.metadata_json?.price;if(price&&Number.isFinite(Number(price.final))&&price.currency){const p=document.createElement("span");p.className="store-app-price";p.textContent=Number(price.final)===0?copy("مجاني","Free"):(Number(price.final)/100).toLocaleString(undefined,{style:"currency",currency:String(price.currency)});tags.append(p)}
 const link=document.createElement("a");link.className="store-app-link";link.href=safe(app.source_url||app.app_url)||store.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=copy("عرض التطبيق في مصدره الأصلي ↗","View original app listing ↗");
 card.append(top,h,meta,summary);if(details)card.append(details);card.append(tags,detailLink,link);return card;
}
function setEmpty(message){$("store-empty").hidden=false;$("store-empty").textContent=message}
function applyLocalFilters(){const selected=$("store-category-filter")?.value||"";const cards=Array.from(grid.querySelectorAll(".store-app-card"));cards.forEach(card=>card.hidden=!!selected&&card.dataset.category!==selected);if($("store-sort")?.value==="name"){cards.sort((a,b)=>a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent));cards.forEach(card=>grid.append(card))}}
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
  if(offset===0){status.textContent=total>0?copy("متصل · "+total.toLocaleString()+" تطبيق مفهرس","Connected · "+total.toLocaleString()+" indexed apps"):copy("نعمل على توفير التطبيقات قريباً","Apps integration coming soon");status.classList.toggle("is-connected",total>0);const robots=document.querySelector("meta[name=robots]");if(robots)robots.content=total>0?"index,follow":"noindex,follow"}
  if(!items.length&&offset===0){exhausted=true;setEmpty(copy("لا توجد تطبيقات مطابقة أو لا توجد سجلات متاحة حالياً لهذا المصدر.","No matching apps or no indexed records are currently available for this source."))}
  items.forEach(app=>grid.append(makeCard(app)));applyLocalFilters();if(reset&&items.length){const schema={"@context":"https://schema.org","@type":"ItemList","name":store.name+" applications","itemListElement":items.slice(0,36).map((app,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"SoftwareApplication","name":String(app.name||"Application"),"operatingSystem":String(app.platform||store.platforms.join(", ")),"applicationCategory":String(app.category||"Software"),"description":String(app.summary||app.description||"").slice(0,500),"url":safe(app.source_url||app.app_url)||store.url}}))};let ld=document.getElementById("store-itemlist-schema");if(!ld){ld=document.createElement("script");ld.type="application/ld+json";ld.id="store-itemlist-schema";document.head.append(ld)}ld.textContent=JSON.stringify(schema)}offset+=items.length;
  if(items.length<36||(total&&offset>=total))exhausted=true;
  count.textContent=total?total.toLocaleString()+" "+copy("تطبيق مفهرس","indexed apps"):offset.toLocaleString()+" "+copy("تطبيق معروض","apps shown");
  $("store-results-note").textContent=total?copy("تُعرض بيانات المصدر على دفعات. إجمالي السجلات المفهرسة لهذا المصدر: "+total.toLocaleString(),"Results load in batches. Indexed records for this source: "+total.toLocaleString()):copy("نتائج من واجهة المصدر المتاحة لمحرك MTA.","Results from the source integration available to MTA.");
  load.hidden=exhausted;load.disabled=false;load.textContent=copy("تحميل المزيد","Load more");
 }catch(e){console.error("Store catalogue fetch failed",e);if(!offset)setEmpty(copy("تعذر الاتصال بكتالوج التطبيقات الآن. أعد المحاولة بعد قليل.","The app catalogue could not be reached. Please retry shortly."));load.hidden=false;load.disabled=false;load.textContent=copy("إعادة المحاولة","Retry");}
 finally{loading=false;load.disabled=false}
}
if(store?.source){
 fetch(API+"/api/v1/catalog-stats",{cache:"no-store",credentials:"omit"}).then(r=>{if(!r.ok)throw Error("stats HTTP "+r.status);return r.json()}).then(data=>{
  const available=Number((data.sources||{})[store.source]||0);
  if(available>0){status.textContent=copy("متصل · "+available.toLocaleString()+" تطبيق مفهرس","Connected · "+available.toLocaleString()+" indexed apps");status.classList.add("is-connected");const robots=document.querySelector("meta[name=robots]");if(robots)robots.content="index,follow";fetchPage(true)}
  else{status.textContent=copy("نعمل على توفيرها قريباً","Coming soon");$("store-search-row").hidden=true;grid.hidden=true;load.hidden=true;$("store-unavailable").hidden=false;$("store-unavailable-copy").textContent=copy("نعمل على ربط هذا المتجر بمصدر بيانات يمكن التحقق منه. سنعرض التطبيقات هنا عندما تصبح بياناتها متاحة.","We are working to connect this store to a verifiable data source. Its apps will appear here once indexed data is available.");$("store-unavailable-link").href=store.url;$("store-results-note").textContent=copy("هذا المتجر غير مفهرس حالياً داخل MTA.","This store is not currently indexed by MTA.")}
 }).catch(error=>{console.warn("Store statistics unavailable",error);status.textContent=copy("تعذر التحقق من الاتصال","Connection could not be verified");$("store-search-row").hidden=true;grid.hidden=true;load.hidden=true;$("store-unavailable").hidden=false;$("store-unavailable-copy").textContent=copy("تعذر التحقق من بيانات هذا المتجر حالياً. سنعرض التطبيقات بعد استعادة الاتصال والتحقق من المصدر.","We could not verify this store's catalogue right now. Listings will appear after the source connection is restored and verified.");$("store-unavailable-link").href=store.url});
 load.addEventListener("click",()=>fetchPage(false));$("store-category-filter").addEventListener("change",applyLocalFilters);$("store-sort").addEventListener("change",applyLocalFilters);search.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{query=search.value.trim();fetchPage(true)},350)});platform.addEventListener("change",()=>fetchPage(true));}
window.addEventListener("mta:languagechange",()=>{if(store){document.title=store.name+" | MTA TECHNOLOGIES"}});
})();