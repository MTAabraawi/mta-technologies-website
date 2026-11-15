(() => {
"use strict";
const api=String(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
if(!api)return;
fetch(api+"/api/v1/catalog-stats",{cache:"no-store",credentials:"omit"}).then(r=>{if(!r.ok)throw new Error("stats "+r.status);return r.json()}).then(data=>{
 const total=Number(data.total||0),sources=data.sources||{},platforms=data.platforms||{};
 document.querySelectorAll("[data-source-count]").forEach(el=>{const n=Number(sources[el.dataset.sourceCount]||0);el.textContent=n.toLocaleString()+" "+(document.documentElement.lang==="en"?"apps":"تطبيق");el.dataset.count=n});
 document.querySelectorAll("[data-stat-total]").forEach(el=>el.textContent=total.toLocaleString());
 document.querySelectorAll("[data-stat-source-count]").forEach(el=>el.textContent=Object.values(sources).filter(v=>Number(v)>0).length.toLocaleString());
 document.querySelectorAll("[data-stat-platform]").forEach(el=>{const key=el.dataset.statPlatform;if(platforms[key]!=null)el.textContent=Number(platforms[key]).toLocaleString()});
 const totalEl=document.getElementById("catalog-stats");if(totalEl)totalEl.textContent=total.toLocaleString()+" "+(document.documentElement.lang==="en"?"indexed records":"سجلاً مفهرساً");
}).catch(err=>console.warn("MTA catalogue statistics unavailable",err));
})();