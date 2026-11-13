(() => {
 const api = (window.MTA_MARKETPLACE_API || "").replace(/\/$/, "");
 const el = id => document.getElementById(id);
 const msg = (id, text) => { if (el(id)) el(id).textContent = text; };
 const t = (ar,en) => document.documentElement.lang === "en" ? en : ar;
 if (!api) el("portal-setup").hidden = false;
 async function request(path, options={}) {
   if (!api) throw new Error(t("خدمة المتجر غير مربوطة بعد.","Marketplace API is not configured."));
   const response = await fetch(api + path, { credentials:"include", ...options });
   const data = await response.json().catch(()=>({}));
   if (!response.ok) throw new Error(data.error || ("HTTP " + response.status));
   return data;
 }
 el("portal-login-btn").addEventListener("click", () => {
   if (!api) { msg("portal-identity",t("خدمة المتجر غير مربوطة بعد.","Marketplace API is not configured.")); return; }
   window.open(api + "/v1/me/submissions", "_blank", "noopener");
   msg("portal-identity",t("أكمل تسجيل الدخول في الصفحة الجديدة، ثم ارجع واضغط تحديث الطلبات.","Complete sign-in in the new tab, then return and refresh your submissions."));
 });
 function renderMine(items) {
   const root=el("my-submissions"); root.replaceChildren();
   if (!items.length) { root.textContent=t("لا توجد طلبات حتى الآن.","No submissions yet."); return; }
   for (const item of items) {
     const card=document.createElement("article"); card.className="submission-item";
     const title=document.createElement("h3"); title.textContent=item.app_name; card.append(title);
     const meta=document.createElement("div"); meta.className="submission-meta"; meta.textContent=[item.platform,item.version,new Date(item.created_at).toLocaleDateString()].join(" · "); card.append(meta);
     const status=document.createElement("span"); status.className="status-pill status-"+item.status; status.textContent=({pending:t("بانتظار الملف","Awaiting file"),pending_review:t("قيد المراجعة","Under review"),approved:t("معتمد","Approved"),rejected:t("مرفوض","Rejected"),removed:t("محذوف","Removed")})[item.status] || item.status; card.append(status);
     if(item.review_note){const note=document.createElement("p");note.className="muted";note.textContent=item.review_note;card.append(note);}
     root.append(card);
   }
 }
 el("refresh-submissions").addEventListener("click",async()=>{try{const r=await request("/v1/me/submissions");renderMine(r.submissions||[]);}catch(e){msg("submission-message",e.message);}});
 el("submission-form").addEventListener("submit",async event=>{
   event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button[type="submit"]'); button.disabled=true;
   try {
     const fd=new FormData(form); const body=Object.fromEntries(fd.entries()); body.authorization_confirmed=fd.get("authorization_confirmed")==="on";
     const result=await request("/v1/submissions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
     const file=el("release-file").files[0];
     if(file){
       if(file.size>100*1024*1024) throw new Error(t("الحد الأقصى الحالي 100 ميجابايت.","Current maximum is 100 MiB."));
       const upload=await fetch(api+"/v1/submissions/"+encodeURIComponent(result.id)+"/file",{method:"PUT",credentials:"include",headers:{"x-file-name":file.name},body:file});
       const up=await upload.json().catch(()=>({})); if(!upload.ok) throw new Error(up.error||"Upload failed");
       msg("submission-message",t("تم استلام الطلب والملف، وهما بانتظار المراجعة.","Submission and file received; awaiting review."));
     } else msg("submission-message",t("تم حفظ الطلب. أرسل ملف الإصدار لاحقاً أو أعد تقديمه عند تفعيل الرفع.","Submission saved. Upload the release file when available."));
     form.reset(); const mine=await request("/v1/me/submissions"); renderMine(mine.submissions||[]);
   } catch(e) { msg("submission-message",e.message); }
   finally { button.disabled=false; }
 });
})();