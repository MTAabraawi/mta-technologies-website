(()=>{"use strict";
const api=String(window.MTA_MARKETPLACE_API||"").replace(/\/$/,""),root=document.getElementById("store-picker");
if(!root||!api)return;
const en=()=>document.documentElement.lang==="en",w=(ar,eng)=>en()?eng:ar;
function repairStoreLogos(){
 root.querySelectorAll(".store-picker-card img").forEach(img=>{
  if(img.dataset.fallbackBound)return;img.dataset.fallbackBound="1";
  img.addEventListener("error",()=>{
   if(!img.dataset.faviconFallback){
    img.dataset.faviconFallback="1";let domain="";
    try{const u=new URL(img.src);domain=u.searchParams.get("domain")||u.hostname.replace(/^www\./,"")}catch{}
    if(domain){img.src="https://icons.duckduckgo.com/ip3/"+encodeURIComponent(domain)+".ico";return}
   }
   if(!img.dataset.brandFallback){img.dataset.brandFallback="1";img.src="images/mta-logo-square.png"}
  });
 });
}
repairStoreLogos();
const group=(cls,ar,eng)=>{const s=document.createElement("section");s.className="store-group "+cls;const h=document.createElement("h4");h.textContent=w(ar,eng);const g=document.createElement("div");g.className="store-picker-grid";s.append(h,g);return{section:s,grid:g}};
function arrange(sources){
 const wrapper=root.querySelector(".store-groups");if(!wrapper)return;
 const original=Array.from(wrapper.querySelectorAll(":scope > .store-group")),live=[],soon=[];
 for(const section of original){
  const remaining=[];
  for(const card of Array.from(section.querySelectorAll(".store-picker-card"))){
   const badge=card.querySelector("[data-source-count]")||card.querySelector(".store-card-state"),key=badge?.dataset.sourceCount||"",count=key?Number(sources[key]||0):0;
   if(count>0){if(badge){badge.className="store-card-state is-connected";badge.textContent=key==="steam"?w("نتائج جزئية · "+count.toLocaleString()+" سجل","Partial results · "+count.toLocaleString()+" records"):count.toLocaleString()+" "+w("تطبيق مفهرس","indexed apps");badge.dataset.count=String(count)}card.dataset.catalogueState="connected";live.push({card,count})}
   else{if(badge){badge.className="store-card-state is-coming-soon";badge.textContent=w("نعمل على توفيرها قريباً","Coming soon — integration in progress");badge.removeAttribute("data-count")}card.dataset.catalogueState="coming-soon";remaining.push(card);soon.push(card)}
  }
  section.querySelector(".store-picker-grid")?.replaceChildren(...remaining);
 }
 const liveGroup=group("store-connected-group","المتاجر التي تتوفر تطبيقاتها الآن · مرتبة حسب العدد","Stores with indexed apps · ranked by count");
 live.sort((a,b)=>b.count-a.count||a.card.textContent.localeCompare(b.card.textContent)).forEach(x=>liveGroup.grid.append(x.card));
 const soonGroup=group("store-coming-soon-group","نعمل على توفير تطبيقات هذه المتاجر قريباً","More stores · integrations coming soon");
 soon.sort((a,b)=>a.textContent.localeCompare(b.textContent)).forEach(card=>soonGroup.grid.append(card));
 wrapper.replaceChildren();if(live.length)wrapper.append(liveGroup.section);if(soon.length)wrapper.append(soonGroup.section);
 root.dataset.connectedStores=String(live.length);root.dataset.comingSoonStores=String(soon.length);
}
function summary(data){
 const heading=root.querySelector(".store-picker-heading");if(!heading||document.getElementById("mta-catalogue-summary"))return;
 const box=document.createElement("div");box.id="mta-catalogue-summary";box.className="catalogue-summary-grid";
 [[Number(data.total||0),w("سجلاً مفهرساً","indexed records")],[Object.values(data.sources||{}).filter(x=>Number(x)>0).length,w("مصادر بيانات نشطة","active data sources")],[Number(data.with_icon||0),w("أيقونة من المصدر","source icons")]].forEach(([n,label])=>{const item=document.createElement("div");item.className="catalogue-summary-item";const strong=document.createElement("strong");strong.textContent=n.toLocaleString();const span=document.createElement("span");span.textContent=label;item.append(strong,span);box.append(item)});
 heading.after(box);const missing=Number(data.without_icon||0),note=document.createElement("p");note.className="catalogue-icon-note";note.textContent=missing?w("نستخدم أيقونة المصدر الأصلية متى توفرت، ثم أيقونة موقع الناشر أو الأحرف الأولى عند غيابها. سجلات بلا أيقونة مصدر: "+missing.toLocaleString()+".","We use original source icons where available, then publisher favicons or initials when missing. Records without a source icon: "+missing.toLocaleString()+"."):w("تتوفر أيقونات المصدر لجميع السجلات المفهرسة حالياً.","Source icons are available for all indexed records.");box.after(note);
}
fetch(api+"/api/v1/catalog-stats",{cache:"no-store",credentials:"omit"}).then(r=>{if(!r.ok)throw Error("stats HTTP "+r.status);return r.json()}).then(data=>{const total=document.getElementById("catalog-stats");if(total)total.textContent=Number(data.total||0).toLocaleString()+" "+w("سجلاً مفهرساً","indexed records");summary(data);arrange(data.sources||{})}).catch(error=>{console.warn("Catalogue stats unavailable; availability is not assumed",error);root.querySelectorAll(".store-card-state").forEach(b=>{b.className="store-card-state is-coming-soon";b.textContent=w("تعذر التحقق حالياً · نعمل على توفيرها قريباً","Could not verify · integration in progress")});arrange({})});
})();