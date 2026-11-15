(()=>{"use strict";
const root=document.getElementById("home-catalogue-stats");if(!root)return;
const api=String(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
const status=document.getElementById("home-catalogue-status");
const say=(ar,en)=>document.documentElement.lang==="en"?en:ar;
if(!api){status.textContent=say("تعذر تحديد مصدر بيانات الكتالوج حالياً.","Catalogue data source is not configured.");return}
fetch(api+"/api/v1/catalog-stats",{cache:"no-store",credentials:"omit"}).then(response=>{if(!response.ok)throw Error("HTTP "+response.status);return response.json()}).then(data=>{
const total=Number(data.total||0),sources=Object.values(data.sources||{}).filter(value=>Number(value)>0).length;
document.getElementById("home-catalogue-total").textContent=total.toLocaleString();document.getElementById("home-catalogue-sources").textContent=sources.toLocaleString();
status.textContent=say("أرقام مباشرة من محرك الكتالوج؛ قد تختلف التغطية بين مصدر وآخر.","Live figures from the catalogue engine; source coverage varies.");
}).catch(error=>{console.warn("Homepage catalogue summary unavailable",error);status.textContent=say("بيانات الكتالوج غير متاحة مؤقتاً. يمكنك تصفح الدليل لمعرفة المصادر المتصلة.","Live catalogue data is temporarily unavailable. Open the directory to inspect connected sources.")});
})();