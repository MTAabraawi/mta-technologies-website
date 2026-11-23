(()=>{"use strict";
const root=document.getElementById("store-picker");
if(!root)return;
const api=String(window.MTA_MARKETPLACE_API||window.location.origin||"").replace(/\/$/,"");
const en=()=>document.documentElement.lang==="en",w=(ar,eng)=>en()?eng:ar;

/* Last successfully verified catalogue counts. Used only when live stats cannot be reached. */
const lastKnownSources={
 "fdroid":4996,
 "izzyondroid":1405,
 "apple-itunes":1453,
 "apple-macos":1193,
 "winget-run-community":191,
 "bluejetty":0,
 "openuse":0,
 "chocolatey":0,
 "flathub":1000,
 "snap-store":413,
 "arch-linux":608,
 "debian-packages":10,
 "alpine-linux":29202,
 "jetbrains-marketplace":285,
 "homebrew-formulae":8732,
 "homebrew-cask":7839,
 "steam":82,
 "mta-curated-web":7,
 "open-vsx":0
};
const lastKnownTotal=Object.values(lastKnownSources).reduce((sum,n)=>sum+n,0);

function repairStoreLogos(){
 root.querySelectorAll(".store-picker-card img").forEach(img=>{
  if(img.dataset.fallbackBound)return;
  img.dataset.fallbackBound="1";
  img.addEventListener("error",()=>{
   if(!img.dataset.faviconFallback){
    img.dataset.faviconFallback="1";let domain="";
    try{const u=new URL(img.src);domain=u.searchParams.get("domain")||u.hostname.replace(/^www\./,"")}catch{}
    if(domain){img.src="https://icons.duckduckgo.com/ip3/"+encodeURIComponent(domain)+".ico";return}
   }
   if(!img.dataset.brandFallback){img.dataset.brandFallback="1";img.src="images/mta-logo-square.webp"}
  });
 });
}
function makeGroup(cls,ar,eng){
 const section=document.createElement("section");section.className="store-group "+cls;
 const heading=document.createElement("h4");heading.textContent=w(ar,eng);
 const grid=document.createElement("div");grid.className="store-picker-grid";
 section.append(heading,grid);return{section,grid};
}
function arrange(sources,stale){
 const wrapper=root.querySelector(".store-groups");if(!wrapper)return;
 const original=Array.from(wrapper.children).filter(node=>node.classList&&node.classList.contains("store-group"));
 const live=[],coming=[];
 for(const section of original){
  const cards=Array.from(section.querySelectorAll(".store-picker-card"));
  for(const card of cards){
   const badge=card.querySelector("[data-source-count]")||card.querySelector(".store-card-state");
   const key=badge?.dataset.sourceCount||"";
   const count=stale?Number(lastKnownSources[key]||0):Number(sources[key]||0);
   if(count>0){
    if(badge){
     badge.className="store-card-state is-connected";
     badge.textContent=stale
      ?w("آخر عدد متحقق: "+count.toLocaleString(),"Last verified: "+count.toLocaleString())
      :(key==="steam"?w("نتائج جزئية · "+count.toLocaleString()+" سجل","Partial results · "+count.toLocaleString()+" records"):count.toLocaleString()+" "+w("تطبيق مفهرس","indexed apps"));
     badge.dataset.count=String(count);
     badge.title=stale?w("تعذر الاتصال المباشر؛ هذا آخر عدد تحققنا منه.","Live verification is temporarily unavailable; showing the last verified count."):"";
    } else if(badge) badge.removeAttribute("data-count");
    card.dataset.catalogueState="connected";live.push({card,count});
   } else {
    if(badge){badge.className="store-card-state is-coming-soon";badge.textContent=w("نعمل على توفيرها قريباً","Coming soon — integration in progress");badge.removeAttribute("data-count");}
    card.dataset.catalogueState="coming-soon";coming.push(card);
   }
  }
 }
 const connected=makeGroup("store-connected-group","المتاجر التي تتوفر تطبيقاتها الآن · مرتبة حسب العدد","Stores with indexed apps · ranked by count");
 live.sort((a,b)=>b.count-a.count||a.card.textContent.localeCompare(b.card.textContent)).forEach(item=>connected.grid.append(item.card));
 const upcoming=makeGroup("store-coming-soon-group","متاجر أخرى · نعمل على توفير بياناتها","More stores · integrations in progress");
 coming.sort((a,b)=>a.textContent.localeCompare(b.textContent)).forEach(card=>upcoming.grid.append(card));
 wrapper.replaceChildren();
 if(live.length)wrapper.append(connected.section);
 if(coming.length)wrapper.append(upcoming.section);
 root.dataset.connectedStores=String(live.length);
 root.dataset.comingSoonStores=String(coming.length);
}
function summary(data,stale){
 const heading=root.querySelector(".store-picker-heading");if(!heading)return;
 let box=document.getElementById("mta-catalogue-summary");
 if(!box){box=document.createElement("div");box.id="mta-catalogue-summary";box.className="catalogue-summary-grid";heading.after(box);}
 box.replaceChildren();
 const sources=data.sources||lastKnownSources;
 const items=[
  [Number(data.total||lastKnownTotal),w("سجلاً مفهرساً","indexed records")],
  [Object.values(sources).filter(value=>Number(value)>0).length,w("مصادر بيانات نشطة","active data sources")]
 ];
 if(!stale&&Number.isFinite(Number(data.with_icon)))items.push([Number(data.with_icon),w("أيقونة من المصدر","source icons")]);
 items.forEach(([number,label])=>{const item=document.createElement("div");item.className="catalogue-summary-item";const strong=document.createElement("strong");strong.textContent=number.toLocaleString();const span=document.createElement("span");span.textContent=label;item.append(strong,span);box.append(item);});
 let note=document.querySelector(".catalogue-icon-note");
 if(stale){
  if(!note){note=document.createElement("p");note.className="catalogue-icon-note";box.after(note);}
  note.textContent=w("تعذر التحقق المباشر مؤقتاً؛ نعرض المتاجر التي سبق التحقق من وجود تطبيقات لها وآخر أعدادها المعروفة.","Live verification is temporarily unavailable. Showing stores previously verified to contain apps and their last known counts.");
 }else if(note)note.remove();
}
function apply(data,stale){
 const total=document.getElementById("catalog-stats");
 if(total)total.textContent=Number(data.total||lastKnownTotal).toLocaleString()+" "+w("سجلاً مفهرساً","indexed records");
 summary(data,stale);
 arrange(data.sources||lastKnownSources,stale);
}
repairStoreLogos();
const fallback={total:lastKnownTotal,sources:lastKnownSources};
if(!api){apply(fallback,true);return;}
fetch(api+"/api/v1/catalog-stats",{cache:"no-store",credentials:"omit"})
 .then(response=>{if(!response.ok)throw Error("stats HTTP "+response.status);return response.json();})
 .then(data=>{if(!data||!data.sources)throw Error("Invalid catalogue stats payload");apply(data,false);})
 .catch(error=>{console.warn("Catalogue stats unavailable; keeping previously verified stores visible",error);apply(fallback,true);});
})();