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
"bluejetty-app-index":{name:"Blue Jetty App Index",platforms:["Android","iOS"],url:"https://bluejetty.ai/apps",host:"bluejetty.ai",source:"bluejetty",mode:"live",desc:"فهرس عام لتطبيقات Android وiOS مع بيانات مصدرية وروابط المتاجر الرسمية عند توفرها. نطاقه انتقائي وليس نسخة كاملة من المتاجر."},
"openuse":{name:"OpenUse Software Catalog",platforms:["Windows","macOS","Linux","Android","iOS","Web"],url:"https://openuse.app/",host:"openuse.app",source:"openuse",mode:"live",desc:"كتالوج مجاني للبرمجيات الحرة ومفتوحة المصدر متعددة المنصات، مع روابط صفحات المشاريع والتنزيلات الرسمية."},
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
"chocolatey":{name:"Chocolatey",platforms:["Windows"],url:"https://community.chocolatey.org/packages",host:"chocolatey.org",source:"chocolatey",mode:"live",desc:"كتالوج حزم Windows من مستودع Chocolatey Community عبر عميل Chocolatey الرسمي، مع روابط صفحات الحزم الأصلية."},
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
"firefox-addons":{name:"Firefox Add-ons",platforms:["Firefox"],url:"https://addons.mozilla.org/firefox/",host:"addons.mozilla.org",source:"firefox-addons",mode:"live",desc:"Mozilla add-on catalogue."},
"wordpress-plugins":{name:"WordPress Plugins",platforms:["WordPress","Web"],url:"https://wordpress.org/plugins/",host:"wordpress.org",source:"wordpress-plugins",mode:"live",desc:"Official WordPress plugin catalogue."},
"homebrew-formulae":{name:"Homebrew Formulae",platforms:["macOS","Linux"],url:"https://formulae.brew.sh/formula/",host:"formulae.brew.sh",source:"homebrew-formulae",mode:"live",desc:"Homebrew core formula catalogue."},
"scoop":{name:"Scoop Buckets",platforms:["Windows"],url:"https://scoop.sh/",host:"scoop.sh",source:"scoop",mode:"live",desc:"Scoop package manifests from official buckets."},
"alpine-linux":{name:"Alpine Linux Packages",platforms:["Linux"],url:"https://pkgs.alpinelinux.org/packages",host:"pkgs.alpinelinux.org",source:"alpine-linux",mode:"live",desc:"Alpine Linux package index."},
"jetbrains-marketplace":{name:"JetBrains Marketplace",platforms:["IntelliJ IDEA","PyCharm","WebStorm"],url:"https://plugins.jetbrains.com/",host:"plugins.jetbrains.com",source:"jetbrains-marketplace",mode:"live",desc:"JetBrains IDE plugin marketplace."},
"gnome-extensions":{name:"GNOME Extensions",platforms:["Linux","GNOME Shell"],url:"https://extensions.gnome.org/",host:"extensions.gnome.org",source:"gnome-extensions",mode:"live",desc:"GNOME Shell extensions catalogue."},
"fedora-packages":{name:"Fedora Packages",platforms:["Linux","Fedora"],url:"https://packages.fedoraproject.org/",host:"packages.fedoraproject.org",source:"fedora-packages",mode:"live",desc:"Official Fedora RPM package index with package names and original detail pages."},
"product-hunt":{name:"Product Hunt",platforms:["Web"],url:"https://www.producthunt.com/",host:"producthunt.com",mode:"external",desc:"منصة اكتشاف منتجات وشركات ناشئة وأدوات ويب."}
};
const $=id=>document.getElementById(id), params=new URLSearchParams(location.search), key=params.get("store")||"", store=stores[key];
const grid=$("store-app-grid"), count=$("store-count"), load=$("store-load-more"), search=$("store-search"), platform=$("store-platform-filter");
const safe=(value)=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:""}catch{return""}};
function appIdentity(app){
 const source=String(app.source||store?.source||"").trim().toLowerCase();
 const id=String(app.external_id??app.id??"").trim();
 if(id)return source+"|id:"+id;
 const name=String(app.name||"").trim().toLocaleLowerCase();
 const platform=String(app.platform||"").trim().toLowerCase();
 return source+"|name:"+name+"|platform:"+platform;
}
function cardIdentity(card){
 if(card.dataset.appKey)return card.dataset.appKey;
 const link=card.querySelector(".store-app-detail-link,h3 a");
 if(link){
  try{
   const url=new URL(link.href,location.href);
   return appIdentity({
    source:url.searchParams.get("source")||store?.source||"",
    external_id:url.searchParams.get("id")||"",
    name:url.searchParams.get("name")||card.querySelector("h3")?.textContent||"",
    platform:card.dataset.platform||""
   });
  }catch{}
 }
 return appIdentity({name:card.querySelector("h3")?.textContent||"",platform:card.dataset.platform||""});
}
const editorialProfiles={
"fdroid":{ar:["يضم هذا القسم تطبيقات Android الحرة التي تظهر في فهرس F-Droid. ركزنا هنا على إبراز طبيعة البرمجيات مفتوحة المصدر، مع إتاحة البحث بحسب الاسم والتصنيف والمنصة.","يمكن أن تتضمن سجلات F-Droid وصف المشروع والترخيص وروابط المصدر. وجود التطبيق في هذا الفهرس لا يعني بالضرورة أنه متاح في كل بلد أو متوافق مع كل جهاز.","راجع الترخيص وإصدار Android ومتطلبات التطبيق في صفحة المصدر قبل التثبيت؛ يحتفظ MTA بالرابط الأصلي ولا يستضيف ملفات APK."],en:["This catalogue focuses on free and open-source Android software indexed by F-Droid. The page highlights the repository context and supports discovery by name, category and platform.","F-Droid records may include project descriptions, licences and source-code links. A listing does not guarantee availability in every country or compatibility with every device.","Check the licence, Android version and app requirements at the original listing before installing. MTA links to the source and does not host APK files."]},
"izzyondroid":{ar:["يعرض هذا القسم الحزم التي يفهرسها مستودع IzzyOnDroid، وهو مستودع إضافي لتطبيقات Android الحرة. نفصل نتائجه عن F-Droid حتى يعرف الزائر مصدر كل سجل.","قد تختلف سياسات قبول الحزم وتحديثاتها عن المستودعات الأخرى؛ لذلك نعرض البيانات المتاحة كما وردت ولا ندمجها في كتالوج واحد بلا تمييز.","افحص صفحة الحزمة الأصلية وروابط المشروع والترخيص قبل التثبيت، فقد تتغير حالة الصيانة أو التوفر."],en:["This section lists packages indexed by IzzyOnDroid, an additional repository for free Android apps. Its records remain separate from F-Droid so visitors can identify the source of each listing.","Package acceptance and update practices can differ from other repositories. MTA presents the available metadata without merging distinct catalogues into an ambiguous list.","Review the original package page, project links and licence before installing; maintenance and availability can change."]},
"apple-itunes":{ar:["يعرض هذا القسم نتائج التطبيقات التي يوفرها فهرس Apple العام عبر واجهة البحث. قد تتغير النتائج بحسب بلد متجر Apple الذي يستهدفه الطلب.","قد تتضمن البيانات اسم المطور والتصنيف والتقييم والسعر ورابط صفحة التطبيق، لكن بعض الحقول لا تتوفر لكل نتيجة ولا نعرضها عند غيابها.","تحقق من التوافق مع iPhone أو iPad وإصدار iOS ومن السعر داخل App Store قبل الشراء أو التنزيل."],en:["This catalogue presents app results available through Apple's public search index. Results can vary with the Apple storefront country used by the request.","Records may include developer, category, rating, price and an App Store listing link, but not every field is supplied for every result.","Confirm iPhone or iPad compatibility, the required iOS version and current pricing in the App Store before downloading or purchasing."]},
"apple-macos":{ar:["هذا القسم مخصص لتطبيقات Mac التي تظهر في فهرس متجر Apple. نفصله عن تطبيقات iPhone وiPad لأن متطلبات النظام وطبيعة الاستخدام مختلفة.","تساعد بيانات المطور والتصنيف ورابط المتجر على التعرف إلى التطبيق، لكن لا نفترض توافقه مع كل أجهزة Mac أو معالجات Apple وIntel.","راجع متطلبات macOS والمنطقة والسعر في صفحة Mac App Store الأصلية قبل التثبيت."],en:["This section focuses on Mac applications indexed by Apple's storefront. It is kept separate from iPhone and iPad listings because system requirements and use cases differ.","Developer, category and store-link metadata help identify each app, but compatibility with every Mac model or Apple and Intel processor is not assumed.","Check macOS requirements, regional availability and pricing on the original Mac App Store listing."]},
"winget-run-community":{ar:["يعرض هذا القسم سجلات حزم Windows المرتبطة بمنظومة WinGet المجتمعية. قد تكون بعض النتائج أدوات سطر أوامر أو حزم تثبيت وليست تطبيقات متجر تقليدية.","تساعد بيانات الحزمة ومعرّفها ورابط المصدر المستخدم المتقدم على التحقق من اسم الناشر وطريقة التثبيت. لا ننفذ أوامر تثبيت نيابة عن الزائر.","تحقق من معرّف الحزمة والناشر وملف manifest قبل تثبيت أي برنامج على Windows."],en:["This section lists Windows package records associated with the community WinGet ecosystem. Some entries are command-line tools or installer packages rather than conventional store apps.","Package identifiers and source links help experienced users verify publishers and installation methods. MTA does not execute installation commands on a visitor's behalf.","Verify the package identifier, publisher and manifest before installing software on Windows."]},
"flathub":{ar:["يقدم هذا القسم تطبيقات Linux المنشورة عبر Flathub وبيانات Flatpak الوصفية. تساعد المنصة المستخدم على اكتشاف تطبيقات سطح المكتب من خلال التصنيفات وصفحات المشاريع.","تختلف صلاحيات التطبيق وبيئة التشغيل واحتياجات التكامل من حزمة إلى أخرى؛ لذلك لا يكفي اسم التطبيق وحده للحكم على ملاءمته.","افحص صفحة Flathub ومعلومات الأذونات وبيئة التشغيل ومتطلبات Flatpak قبل التثبيت."],en:["This section presents Linux desktop applications distributed through Flathub with Flatpak metadata. Categories and project pages support software discovery.","Permissions, runtimes and integration requirements vary by package, so an app name alone is not enough to judge suitability.","Review the Flathub page, permissions, runtime and Flatpak requirements before installing."]},
"snap-store":{ar:["يجمع هذا القسم الحزم التي يفهرسها مصدر Snap. قد تتضمن السجلات تطبيقات سطح مكتب وخدمات وأدوات سطر أوامر لتوزيعات Linux المختلفة.","قد يختلف الناشر وقناة الإصدار والصلاحيات بين حزمة وأخرى؛ ونكتفي بعرض ما توفره بيانات المصدر دون افتراض قناة مستقرة أو تحديث حديث.","راجع ناشر Snap والقناة والصلاحيات والتوافق مع توزيعتك قبل التثبيت."],en:["This section gathers packages indexed by the Snap source, including desktop apps, services and command-line tools for Linux distributions.","Publisher, release channel and permissions can differ between packages. MTA displays supplied metadata without assuming a stable channel or recent update.","Check the Snap publisher, channel, permissions and distribution compatibility before installing."]},
"arch-linux":{ar:["يعرض هذا القسم حزم مستودعات Arch Linux، بما فيها المكتبات والأدوات التي قد لا تكون تطبيقات رسومية مستقلة. لهذا قد يكون عدد الحزم أكبر من عدد التطبيقات المعتادة.","تساعد بيانات الإصدار والمعمارية والمستودع على فهم سياق الحزمة، لكن التوافق يتوقف على النظام والمستودعات المثبتة لديك.","راجع وصف الحزمة واعتمادياتها ومعمارية الجهاز ومستودعها قبل التثبيت أو التحديث."],en:["This section lists Arch Linux repository packages, including libraries and tools that are not standalone graphical apps. Package totals can therefore exceed typical app counts.","Version, architecture and repository metadata explain a package's context, while actual compatibility depends on the installed system and repositories.","Review the package description, dependencies, device architecture and repository before installing or updating."]},
"debian-packages":{ar:["يعرض هذا القسم حزم Debian المتاحة في مصدر البيانات المتصل. تشمل قاعدة الحزم برامج للمستخدم ومكونات نظام ومكتبات، لذلك ليست كل نتيجة تطبيقاً نهائياً.","قد تختلف الإصدارات حسب إصدار Debian والمعمارية والمستودع؛ نعرض بيانات المصدر ونترك التحقق النهائي لصفحة الحزمة الرسمية.","تحقق من إصدار التوزيعة والمعمارية والاعتماديات ومصدر الحزمة قبل التثبيت."],en:["This section presents Debian packages available through the connected data source. The package archive includes user software, system components and libraries, so not every result is an end-user app.","Versions can vary by Debian release, architecture and repository. MTA shows source metadata and leaves final verification to the official package page.","Check your distribution release, architecture, dependencies and package origin before installation."]},
"homebrew-cask":{ar:["يركز هذا القسم على Homebrew Cask، الذي يسهل اكتشاف وتثبيت تطبيقات macOS الموزعة خارج Mac App Store. قد تتضمن السجلات تطبيقات سطح مكتب وأدوات للمطورين.","بيانات الـ Cask تصف الحزمة وطريقة توزيعها، لكنها لا تعني أن التطبيق مجاني أو أن كل إصدار متوافق مع جهازك.","راجع موقع الناشر ومتطلبات macOS وبيانات الـ Cask قبل التثبيت، خصوصاً للتطبيقات التي تتطلب تراخيص مدفوعة."],en:["This section focuses on Homebrew Cask, which helps discover and install macOS apps distributed outside the Mac App Store. Records can include desktop software and developer tools.","Cask metadata describes packaging and distribution; it does not imply an app is free or that every release supports your device.","Review the publisher website, macOS requirements and Cask details before installing, especially for paid or licensed software."]},
"steam":{ar:["هذا القسم يقدم نتائج محدودة من واجهة Steam العامة، وليس نسخة كاملة من مكتبة Steam أو جميع الألعاب والعروض. لذلك نوضح أن التغطية جزئية.","قد تختلف الأسعار والتوفر حسب المنطقة والحساب والمنصة، ولا نعرض السعر أو التوافق إلا عندما تتوفر بيانات موثوقة.","افتح صفحة اللعبة في Steam لمراجعة متطلبات التشغيل والمنطقة والسعر وسياسة المحتوى قبل الشراء."],en:["This section contains limited results from Steam's public interface; it is not a complete mirror of the Steam library, games or offers. Coverage is explicitly marked as partial.","Prices and availability vary by region, account and platform. MTA only displays price or compatibility when reliable metadata is supplied.","Visit the Steam listing to verify system requirements, regional pricing and content information before purchasing."]},
"mta-curated-web":{ar:["هذا القسم يضم تطبيقات ويب اختيرت تحريرياً لدليل MTA، ويمكن تشغيلها عبر المتصفح دون افتراض الحاجة إلى تنزيل برنامج تقليدي.","نحاول توضيح وظيفة الخدمة وموقعها الأصلي ورابط المطور عندما تتوفر هذه المعلومات، ونميزها عن نتائج المتاجر الخارجية.","تحقق من سياسة الخصوصية وشروط الاستخدام والصلاحيات التي يطلبها موقع الخدمة قبل إدخال بياناتك."],en:["This section contains web applications selected for the MTA directory. They are accessed through a browser and may not require a traditional software installer.","We aim to identify each service's purpose, original website and developer links when available, while keeping these listings distinct from third-party store results.","Review the service's privacy policy, terms and requested permissions before entering personal or business data."]}
};

const lang=()=>document.documentElement.lang==="en";
const copy=(ar,en)=>lang()?en:ar;
const title=$("store-title"), subtitle=$("store-subtitle"), logo=$("store-logo"), official=$("store-official-link"), status=$("store-status"), desc=$("store-description");
if(!store){$("store-results-note").textContent=copy("لم يتم العثور على المتجر المطلوب. ارجع إلى دليل المتاجر لاختيار متجر آخر.","Store not found. Return to the marketplace and choose another store.");$("store-catalogue-section").hidden=true;}
else{
 title.textContent=store.name; $("breadcrumb-store").textContent=store.name; document.title=store.name+" | MTA TECHNOLOGIES"; const canonical=document.querySelector("link[rel=canonical]"); if(canonical)canonical.href=location.origin+location.pathname+"?store="+encodeURIComponent(key); const descriptionMeta=document.querySelector("meta[name=description]"); if(descriptionMeta)descriptionMeta.content=lang()?(store.name+" app catalogue on MTA. Browse available listings and original publisher links."):( "دليل "+store.name+" على MTA. تصفح التطبيقات المتاحة وروابط الناشرين الأصلية.");
 $("store-description").textContent=store.desc; subtitle.textContent=store.platforms.join(" · ");
 const editorialIntro=$("store-editorial-intro"),editorialWhat=$("store-editorial-what"),editorialVerify=$("store-editorial-verify"),editorialAvailability=$("store-editorial-availability");
 if(editorialIntro)editorialIntro.textContent=lang()?("Browse "+store.name+" through MTA's source-aware catalogue. "+store.platforms.join(", ")+". "+store.desc):("تصفح "+store.name+" عبر دليل MTA مع توضيح مصدر البيانات وحالة الفهرسة. "+store.desc);
 if(editorialWhat)editorialWhat.textContent=lang()?"Explore indexed app names, developers, categories, descriptions, platform compatibility and publisher icons when supplied.":"تصفح أسماء التطبيقات المفهرسة والمطورين والتصنيفات والأوصاف والمنصات والأيقونات التي يوفرها الناشر.";
 if(editorialVerify)editorialVerify.textContent=lang()?"MTA keeps each catalogue source separate, checks live indexed-record counts and links every listing to its original source.":"نفصل بيانات كل متجر عن غيره، ونتحقق من عدد السجلات المفهرسة فعلياً، ونربط كل تطبيق بصفحته الأصلية.";
 if(editorialAvailability)editorialAvailability.textContent=lang()?"Store availability, pricing and regional access are controlled by the original provider and may vary by country, device and account.":"تخضع إتاحة التطبيقات وأسعارها والوصول الإقليمي لسياسات المتجر الأصلي، وقد تختلف حسب البلد والجهاز والحساب.";
 const profile=store.source&&editorialProfiles[store.source];
 if(profile){const texts=lang()?profile.en:profile.ar;if(editorialIntro)editorialIntro.textContent=texts[0];if(editorialWhat)editorialWhat.textContent=texts[1];if(editorialVerify)editorialVerify.textContent=texts[2];if(editorialAvailability)editorialAvailability.textContent=lang()?(store.name+" availability, pricing and regional access can vary across "+store.platforms.join(", ")+". Check the publisher listing for current regional and device requirements."):( "قد يختلف توفر "+store.name+" وأسعاره والوصول إليه بحسب "+store.platforms.join(" و")+" والمنطقة والجهاز. راجع صفحة الناشر للتأكد من المتطلبات الحالية.");}
 const storeSchema=document.createElement("script");storeSchema.type="application/ld+json";storeSchema.id="store-profile-schema";storeSchema.textContent=JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":store.name+" catalogue","description":store.desc,"url":location.href,"inLanguage":["ar","en"],"about":{"@type":"Thing","name":store.name+" app catalogue"}});document.head.append(storeSchema);
 const logoUrl="https://www.google.com/s2/favicons?domain="+encodeURIComponent(store.host)+"&sz=128",logoFallback="https://icons.duckduckgo.com/ip3/"+encodeURIComponent(store.host)+".ico";
 logo.src=logoUrl;logo.setAttribute("alt",copy("شعار "+store.name,"Logo of "+store.name));logo.onerror=()=>{if(logo.src!==logoFallback)logo.src=logoFallback;else{logo.onerror=null;logo.src="images/mta-logo-square.webp"}};
 official.href=store.url;
 $("store-platforms").replaceChildren(...store.platforms.map(p=>{const s=document.createElement("span");s.textContent=p;return s}));
 const connected=!!store.source;if(store.source==="steam"&&!Array.from($("store-platform-filter").options).some(o=>o.value==="pc-games")){const option=document.createElement("option");option.value="pc-games";option.textContent="PC Games";$("store-platform-filter").append(option)}
 status.textContent=connected?copy("جارٍ التحقق من توفر السجلات","Checking indexed records"):copy("نعمل على توفيرها قريباً","Coming soon");status.classList.remove("is-connected");
 if(!connected){const robots=document.querySelector("meta[name=robots]");if(robots)robots.content="noindex,follow";$("store-search-row").hidden=true;grid.hidden=true;load.hidden=true;$("store-catalogue-section").querySelector(".store-catalogue-heading").hidden=true;$("store-unavailable").hidden=false;$("store-unavailable-copy").textContent=store.desc;$("store-unavailable-link").href=store.url;$("store-results-note").textContent=copy("لا نعرض سجلات تطبيقات من هذا المتجر حتى يتوفر مصدر بيانات قابل للتحقق.","No app records are shown until a verifiable data source is available.");}
}

let offset=0,total=0,loading=false,exhausted=false,query="",timer=null,autoLoadPaused=false,autoLoadObserver=null;
const initialServerRenderedCount=grid.querySelectorAll(".store-app-card").length;
function populateCategoryOptionsFromRenderedCards(){
 const select=$("store-category-filter");
 if(!select)return;
 const known=new Set(Array.from(select.options).map(option=>option.value));
 grid.querySelectorAll(".store-app-card").forEach(card=>{
  const category=String(card.dataset.category||"").trim();
  if(!category||known.has(category))return;
  const option=document.createElement("option");
  option.value=category;option.textContent=category;select.append(option);known.add(category);
 });
}
populateCategoryOptionsFromRenderedCards();
let indexedTotal=0;
function makeCard(app){
 const card=document.createElement("article");card.className="store-app-card";card.dataset.category=String(app.category||"Other").split(",")[0].trim();card.dataset.platform=String(app.platform||"").toLowerCase();card.dataset.appKey=appIdentity(app);
 const top=document.createElement("div");top.className="store-app-top";
 const icon=document.createElement("img");icon.className="store-app-icon";icon.loading="lazy";icon.decoding="async";icon.setAttribute("alt",copy("أيقونة "+(app.name||"التطبيق"),"Icon for "+(app.name||"application")));
 let metadata=app.metadata_json&&typeof app.metadata_json==="object"?app.metadata_json:{};
 if(typeof app.metadata_json==="string"){try{metadata=JSON.parse(app.metadata_json)}catch{metadata={}}}
 const pageUrl=safe(metadata.homepage||metadata.website||metadata.homepage_url||metadata.project_url||metadata.publisher_url||metadata.publisher_website||metadata.publisherWebsite||app.app_url||"");let host="";try{host=pageUrl?new URL(pageUrl).hostname.replace(/^www\./,""):""}catch{}
 const iconObject=metadata.icon&&typeof metadata.icon==="object"?metadata.icon:{};
 const iconCollection=metadata.icons&&typeof metadata.icons==="object"?Object.values(metadata.icons):[];
 const metadataIcons=[metadata.icon_url,metadata.iconUrl,metadata.icon,iconObject.url,iconObject.path,metadata.logo,metadata.image,metadata.image_url,metadata.artworkUrl512,metadata.artworkUrl100,metadata.thumbnail,...iconCollection];
 const iconUrl=safe(app.icon_url||"");
 const catalogueHosts=["play.google.com","apps.apple.com","itunes.apple.com","apps.microsoft.com","store.steampowered.com","steamcommunity.com","addons.mozilla.org","plugins.jetbrains.com","wordpress.org","flathub.org","snapcraft.io","community.chocolatey.org","packages.fedoraproject.org","pkgs.alpinelinux.org","archlinux.org","packages.debian.org","packages.ubuntu.com","formulae.brew.sh","brew.sh","scoop.sh","winget.run","openuse.app","apt.izzysoft.de","f-droid.org"];
 const isCatalogueHost=host&&catalogueHosts.some(domain=>host===domain||host.endsWith("."+domain));
 const faviconHost=host&&!isCatalogueHost?host:"";
 const candidates=[iconUrl,...metadataIcons.map(value=>safe(typeof value==="string"?value:(value&&typeof value==="object"?(value.url||value.path||""):""))),faviconHost?"https://www.google.com/s2/favicons?domain="+encodeURIComponent(faviconHost)+"&sz=256":"",faviconHost?"https://icons.duckduckgo.com/ip3/"+encodeURIComponent(faviconHost)+".ico":"",faviconHost?"https://"+faviconHost+"/favicon.ico":""].filter((v,i,a)=>v&&a.indexOf(v)===i);
 let iconIndex=0;
 const makeMonogram=()=>{const mark=document.createElement("span");mark.className="store-app-icon-fallback";mark.setAttribute("aria-label",(app.name||"App")+" icon unavailable");mark.textContent=String(app.name||"A").trim().split(/\s+/).slice(0,2).map(x=>x.charAt(0)).join("").toUpperCase();return mark};
 icon.onerror=()=>{iconIndex++;if(iconIndex<candidates.length)icon.src=candidates[iconIndex];else if(icon.parentNode)icon.replaceWith(makeMonogram())};
 const badge=document.createElement("span");badge.className="store-app-source";badge.textContent=app.source||store.name;
 if(candidates.length){top.append(icon,badge);icon.src=candidates[0]}else{top.append(makeMonogram(),badge)}
 const h=document.createElement("h3");
 const detailParams=new URLSearchParams({source:String(app.source||store.source||""),store:key,id:String(app.external_id||app.id||""),name:String(app.name||"Application")});
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
 if(!store?.source||loading||(!reset&&exhausted)||!API)return;
 let keepServerRendered=false;
 if(reset){autoLoadPaused=false;keepServerRendered=!query&&!platform.value&&initialServerRenderedCount>0;offset=0;exhausted=false;total=indexedTotal;if(!keepServerRendered)grid.replaceChildren();$("store-empty").hidden=true}
 loading=true;load.hidden=false;load.disabled=true;load.textContent=copy("جارٍ التحميل...","Loading...");
 try{
  const p=new URLSearchParams({source:store.source,limit:"12",offset:String(offset)});
  if(query)p.set("q",query);if(platform.value)p.set("platform",platform.value);
  const requestUrl=API+"/api/v1/apps?"+p.toString();
  let response=null,lastError=null;
  for(let attempt=0;attempt<3;attempt++){
   const controller=new AbortController();
   const timeoutId=setTimeout(()=>controller.abort(),45000);
   try{
    response=await fetch(requestUrl,{cache:"no-store",credentials:"omit",signal:controller.signal});
    if(response.ok)break;
    lastError=new Error("HTTP "+response.status);
    if(response.status<500&&response.status!==429)throw lastError;
   }catch(error){
    lastError=error;
    if(attempt===2)throw error;
   }finally{clearTimeout(timeoutId)}
   if(attempt<2)await new Promise(resolve=>setTimeout(resolve,800*(attempt+1)));
  }
  if(!response||!response.ok)throw lastError||new Error("Catalogue request failed");
  const items=await response.json();if(!Array.isArray(items))throw new Error("Invalid catalogue response");autoLoadPaused=false;
  if(keepServerRendered)grid.replaceChildren();
  total=Number(response.headers.get("X-Total-Count")||total||0);
  if(offset===0){status.textContent=total>0?copy("متصل · "+total.toLocaleString()+" سجل مفهرس","Connected · "+total.toLocaleString()+" indexed records"):copy("نعمل على توفير التطبيقات قريباً","Apps integration coming soon");status.classList.toggle("is-connected",total>0);const robots=document.querySelector("meta[name=robots]");if(robots)robots.content=total>0?"index,follow":"noindex,follow"}
  if(!items.length&&offset===0){exhausted=true;setEmpty(copy("لا توجد تطبيقات مطابقة أو لا توجد سجلات متاحة حالياً لهذا المصدر.","No matching apps or no indexed records are currently available for this source."))}
  const seen=new Set(Array.from(grid.querySelectorAll(".store-app-card")).map(cardIdentity));
  items.forEach(app=>{const identity=appIdentity(app);if(seen.has(identity))return;seen.add(identity);grid.append(makeCard(app))});applyLocalFilters();if(reset&&items.length){const schema={"@context":"https://schema.org","@type":"ItemList","name":store.name+" applications","itemListElement":items.slice(0,12).map((app,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"SoftwareApplication","name":String(app.name||"Application"),"operatingSystem":String(app.platform||store.platforms.join(", ")),"applicationCategory":String(app.category||"Software"),"description":String(app.summary||app.description||"").slice(0,500),"url":safe(app.source_url||app.app_url)||store.url}}))};let ld=document.getElementById("store-itemlist-schema");if(!ld){ld=document.createElement("script");ld.type="application/ld+json";ld.id="store-itemlist-schema";document.head.append(ld)}ld.textContent=JSON.stringify(schema)}offset+=items.length;
  if(items.length<12||(total&&offset>=total))exhausted=true;
  count.textContent=total?total.toLocaleString()+" "+copy("سجل مفهرس","indexed records"):offset.toLocaleString()+" "+copy("تطبيق معروض","apps shown");
  $("store-results-note").textContent=total?copy("تُعرض بيانات المصدر على دفعات. إجمالي السجلات المفهرسة لهذا المصدر: "+total.toLocaleString(),"Results load in batches. Indexed records for this source: "+total.toLocaleString()):copy("نتائج من واجهة المصدر المتاحة لمحرك MTA.","Results from the source integration available to MTA.");
  load.hidden=exhausted;load.disabled=false;load.textContent=copy("تحميل المزيد","Load more");
 }catch(e){autoLoadPaused=true;console.error("Store catalogue fetch failed",e);if(keepServerRendered){offset=initialServerRenderedCount;status.textContent=copy("تعذر تحديث الاتصال؛ نعرض التطبيقات المحمّلة مسبقاً.","Live refresh failed; showing preloaded applications.");status.classList.add("is-connected");count.textContent=initialServerRenderedCount.toLocaleString()+" "+copy("تطبيقات معروضة","apps shown");$("store-results-note").textContent=copy("تعذر تحديث الدفعة الآن، لكن التطبيقات المحمّلة مسبقاً ما زالت متاحة. يمكنك إعادة المحاولة لتحميل المزيد.","The latest batch could not be refreshed, but preloaded applications remain available. Retry to load more.");}else if(!offset)setEmpty(copy("تعذر الاتصال بكتالوج التطبيقات الآن. أعد المحاولة بعد قليل.","The app catalogue could not be reached. Please retry shortly."));load.hidden=false;load.disabled=false;load.textContent=copy("إعادة المحاولة","Retry");}
 finally{loading=false;load.disabled=false;if(autoLoadObserver){autoLoadObserver.unobserve(load);if(!load.hidden&&!autoLoadPaused)autoLoadObserver.observe(load)}}
}
function setupAutomaticLoading(){
 if(!load||!("IntersectionObserver" in window))return;
 autoLoadObserver=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting)&&!loading&&!exhausted&&!autoLoadPaused)fetchPage(false);
 },{root:null,rootMargin:"700px 0px",threshold:0});
 if(!load.hidden)autoLoadObserver.observe(load);
}
if(store?.source){
 if(initialServerRenderedCount>0){
  // The Pages Function already rendered a usable first page. Do not gate
  // visible catalogue content on a second browser-side stats request.
  offset=initialServerRenderedCount;
  status.textContent=copy("متصل · التطبيقات الأولية جاهزة","Connected · initial listings ready");
  status.classList.add("is-connected");
  const robots=document.querySelector("meta[name=robots]");
  if(robots)robots.content="index,follow";
  load.hidden=false;load.disabled=false;load.textContent=copy("تحميل المزيد","Load more");
 }else{
  // If server rendering was unavailable, try the stats endpoint and then
  // the apps endpoint independently instead of hiding the catalogue area.
  fetch(API+"/api/v1/catalog-stats",{cache:"no-store",credentials:"omit"}).then(r=>{if(!r.ok)throw Error("stats HTTP "+r.status);return r.json()}).then(data=>{
   const available=Number((data.sources||{})[store.source]||0);
   if(available>0){indexedTotal=available;total=available;status.textContent=copy("متصل · "+available.toLocaleString()+" سجل مفهرس","Connected · "+available.toLocaleString()+" indexed records");status.classList.add("is-connected");const robots=document.querySelector("meta[name=robots]");if(robots)robots.content="index,follow";fetchPage(true)}
   else{status.textContent=copy("نعمل على توفيرها قريباً","Coming soon");$("store-search-row").hidden=true;grid.hidden=true;load.hidden=true;$("store-unavailable").hidden=false;$("store-unavailable-copy").textContent=copy("لا توجد سجلات مفهرسة لهذا المصدر حالياً.","No indexed records are currently available for this source.");$("store-unavailable-link").href=store.url;$("store-results-note").textContent=copy("هذا المتجر غير مفهرس حالياً داخل MTA.","This store is not currently indexed by MTA.")}
  }).catch(error=>{
   console.warn("Store statistics unavailable; trying app listings directly",error);
   status.textContent=copy("جارٍ محاولة الاتصال بكتالوج التطبيقات","Retrying catalogue connection");
   fetchPage(true);
  });
 }
 load.addEventListener("click",()=>{autoLoadPaused=false;fetchPage(false)});setupAutomaticLoading();$("store-category-filter").addEventListener("change",applyLocalFilters);$("store-sort").addEventListener("change",applyLocalFilters);search.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{query=search.value.trim();fetchPage(true)},350)});platform.addEventListener("change",()=>fetchPage(true));
}
window.addEventListener("mta:languagechange",()=>{if(store){document.title=store.name+" | MTA TECHNOLOGIES"}});
})();