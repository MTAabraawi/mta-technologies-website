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
   if (response.redirected || !(response.headers.get("content-type") || "").includes("application/json")) throw new Error(t("سجّل الدخول أولاً من زر تسجيل الدخول ثم أعد المحاولة.","Please sign in first using the sign-in button, then retry."));
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
     if(item.review_note){const note=document.createElement("p");note.className="muted";note.textContent=t("ملاحظة المراجع: ","Reviewer note: ")+item.review_note;card.append(note);}
     if(item.status==="pending" && item.review_note){
       const revise=document.createElement("button");revise.className="btn btn-outline";revise.type="button";revise.textContent=t("تعديل الطلب وإعادة الرفع","Edit submission and re-upload");
       revise.addEventListener("click",()=>{
         const form=el("submission-form");
         for(const key of ["app_name","developer_name","platform","category","version","license_name","source_url","description"]){if(form.elements[key])form.elements[key].value=item[key]||"";}
         form.elements.authorization_confirmed.checked=true;
         form.elements.submission_id.value=item.id;
         msg("submission-message",t("عدّل البيانات واختر ملف الإصدار الجديد ثم أرسل الطلب.","Edit the details, choose the replacement release file, and submit."));
         form.scrollIntoView({behavior:"smooth",block:"start"});
       });
       card.append(revise);
     }
     root.append(card);
   }
 }
 el("refresh-submissions").addEventListener("click",async()=>{try{const r=await request("/v1/me/submissions");renderMine(r.submissions||[]);}catch(e){msg("submission-message",e.message);}});
 el("submission-form").addEventListener("submit",async event=>{
   event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button[type="submit"]'); button.disabled=true;
   try {
     const fd=new FormData(form); const body=Object.fromEntries(fd.entries()); body.authorization_confirmed=fd.get("authorization_confirmed")==="on";
     const file=el("release-file").files[0];
     if(!file) throw new Error(t("اختر ملف الإصدار أولاً.","Select a release file first."));
     if(file.size>2*1024*1024*1024) throw new Error(t("الحد الأقصى الحالي 2 جيجابايت.","Current maximum is 2 GiB."));
     let result;
     if(body.submission_id){
       result=await request("/v1/submissions/"+encodeURIComponent(body.submission_id)+"/revise",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
       result={id:body.submission_id};
     } else {
       result=await request("/v1/submissions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
       form.elements.submission_id.value=result.id;
     }
     const fileToken=[file.name,file.size,file.lastModified].join(":");
     const init=await request("/v1/submissions/"+encodeURIComponent(result.id)+"/multipart",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({file_name:file.name,file_size:file.size,file_token:fileToken})});
     const partSize=init.part_size||8388608;
     const completed=new Set((init.parts||[]).map(part=>part.partNumber));
     const totalParts=Math.ceil(file.size/partSize);
     for(let partNumber=1;partNumber<=totalParts;partNumber++){
       if(completed.has(partNumber)) continue;
       const start=(partNumber-1)*partSize;
       const chunk=file.slice(start,Math.min(start+partSize,file.size));
       const response=await fetch(api+"/v1/submissions/"+encodeURIComponent(result.id)+"/multipart/"+partNumber,{method:"PUT",credentials:"include",headers:{"x-upload-id":init.upload_id},body:chunk});
       const part=await response.json().catch(()=>({}));
       if(response.redirected || !(response.headers.get("content-type")||"").includes("application/json")) throw new Error(t("انتهت جلسة الدخول. سجّل الدخول ثم أعد المحاولة لاستكمال الرفع.","Your sign-in session expired. Sign in again and retry to resume the upload."));
       if(!response.ok) throw new Error(part.error||("Upload part "+partNumber+" failed"));
       completed.add(partNumber);
       msg("submission-message",t("جارٍ رفع الجزء ","Uploading part ")+partNumber+"/"+totalParts);
     }
     await request("/v1/submissions/"+encodeURIComponent(result.id)+"/multipart/complete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({upload_id:init.upload_id})});
     msg("submission-message",t("تم استلام الطلب والملف، وهما بانتظار المراجعة.","Submission and file received; awaiting review."));
     form.reset(); form.elements.submission_id.value=""; const mine=await request("/v1/me/submissions"); renderMine(mine.submissions||[]);
   } catch(e) { msg("submission-message",e.message); }
   finally { button.disabled=false; }
 });
})();