(() => {
 const api=(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
 const el=id=>document.getElementById(id);
 const t=(ar,en)=>document.documentElement.lang==="en"?en:ar;
 if(!api) el("admin-setup").hidden=false;
 async function request(path,options={}) {
   if(!api) throw new Error(t("لم يتم ربط API بعد.","Marketplace API is not configured."));
   const r=await fetch(api+path,{credentials:"include",...options}); const d=await r.json().catch(()=>({}));
   if(r.redirected || !(r.headers.get("content-type")||"").includes("application/json")) throw new Error(t("سجّل الدخول عبر Cloudflare Access ثم أعد تحميل الصفحة.","Sign in through Cloudflare Access, then reload this page."));
   if(!r.ok) throw new Error(d.error||("HTTP "+r.status)); return d;
 }
 async function load(){
   const root=el("admin-queue"); root.replaceChildren();
   try {
     const data=await request("/v1/admin/submissions");
     if(!data.submissions?.length){root.textContent=t("لا توجد طلبات معلقة.","No pending submissions.");return;}
     for(const item of data.submissions){
       const card=document.createElement("article");card.className="submission-item";
       const h=document.createElement("h3");h.textContent=item.app_name;card.append(h);
       const p=document.createElement("p");p.className="submission-meta";p.textContent=[item.developer_name,item.platform,item.version,item.license_name,item.owner_email].join(" · ");card.append(p);
       const desc=document.createElement("p");desc.className="muted";desc.textContent=item.description;card.append(desc);
       if(item.source_url){const a=document.createElement("a");a.href=item.source_url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=t("فتح مصدر التطبيق","Open app source");card.append(a);}
       if(item.file_name){const f=document.createElement("p");f.className="muted";f.textContent=item.file_name+" · "+Math.ceil((item.file_size||0)/1024/1024)+" MiB";card.append(f);const fileLink=document.createElement("a");fileLink.href=api+"/v1/admin/submissions/"+encodeURIComponent(item.id)+"/file";fileLink.textContent=t("تنزيل الملف للفحص اليدوي","Download file for manual scanning");fileLink.target="_blank";fileLink.rel="noopener noreferrer";card.append(fileLink);}
       const rights=document.createElement("label");rights.className="check-label";const rc=document.createElement("input");rc.type="checkbox";rights.append(rc,document.createTextNode(t("تم التحقق من حقوق التوزيع","Redistribution rights verified")));card.append(rights);
       const malware=document.createElement("label");malware.className="check-label";const mc=document.createElement("input");mc.type="checkbox";malware.append(mc,document.createTextNode(t("اجتاز فحص البرمجيات الضارة","Malware scan passed")));card.append(malware);
       const actions=document.createElement("div");actions.className="admin-actions";
       const approve=document.createElement("button");approve.className="btn btn-primary";approve.textContent=t("اعتماد ونشر","Approve & publish");approve.disabled=!item.object_key;
       approve.addEventListener("click",()=>review(item.id,"approved",{rights_verified:rc.checked,malware_scan_passed:mc.checked}));
       const reject=document.createElement("button");reject.className="btn btn-outline";reject.textContent=t("رفض","Reject");reject.addEventListener("click",()=>review(item.id,"rejected",{}));
       actions.append(approve,reject);card.append(actions);root.append(card);
     }
   } catch(e){el("admin-message").textContent=e.message;}
 }
 async function review(id,status,checks){
   const note=window.prompt(t("أدخل ملاحظة المراجعة (اختياري):","Enter a review note (optional):"))||"";
   try{await request("/v1/admin/submissions/"+encodeURIComponent(id),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status,note,...checks})});el("admin-message").textContent=t("تم تحديث حالة الطلب.","Submission status updated.");load();}
   catch(e){el("admin-message").textContent=e.message;}
 }
 el("admin-refresh").addEventListener("click",load);
 load();
})();