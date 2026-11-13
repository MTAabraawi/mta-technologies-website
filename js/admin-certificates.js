(() => {
 const api=(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
 const el=id=>document.getElementById(id);
 async function req(path,options={}){const r=await fetch(api+path,{credentials:"include",...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||("HTTP "+r.status));return d;}
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 async function load(){
  const queue=el("cert-requests"),issued=el("issued-list"),stats=el("cert-stats");queue.replaceChildren();issued.replaceChildren();stats.replaceChildren();
  try{
   const data=await req("/v1/admin/certificates/requests");
   const all=data.issued||[],active=all.filter(x=>x.status==="active"&&Date.parse(x.expires_at)>Date.now()).length;
   stats.append(node("p","", "إجمالي البطاقات المسجلة: "+all.length),node("p","", "بطاقات سارية: "+active),node("p","", "موقوفة/ملغاة/منتهية: "+(all.length-active)));
   if(!(data.requests||[]).length)queue.textContent="لا توجد طلبات اعتماد معلقة.";
   for(const item of data.requests||[]){
    const card=node("article","submission-item");card.append(node("h3","",item.full_name),node("p","",item.applicant_email+" · "+item.requested_category),node("p","",item.statement));
    if(item.portfolio_url){const a=node("a","","معرض الأعمال");a.href=item.portfolio_url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);}
    const issue=node("button","btn btn-primary","اعتماد وإصدار بطاقة لمدة سنة");issue.addEventListener("click",async()=>{if(!confirm("هل راجعت هوية المتقدم وأعماله وتريد إصدار بطاقة رسمية؟"))return;try{const out=await req("/v1/admin/certificates/requests/"+encodeURIComponent(item.id)+"/issue",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({credential_type:item.requested_category})});el("cert-admin-message").textContent="تم الإصدار: "+out.serial+" · "+out.verify_url;await load();}catch(e){el("cert-admin-message").textContent=e.message;}});const reject=node("button","btn btn-outline","رفض الطلب");reject.addEventListener("click",async()=>{const note=prompt("سبب الرفض؟")||"";if(!note)return;try{await req("/v1/admin/certificates/requests/"+encodeURIComponent(item.id),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:"rejected",note})});await load();}catch(e){el("cert-admin-message").textContent=e.message;}});
    const more=node("button","btn btn-outline","طلب معلومات إضافية");more.addEventListener("click",async()=>{const note=prompt("ما المعلومات المطلوبة؟")||"";if(!note)return;try{await req("/v1/admin/certificates/requests/"+encodeURIComponent(item.id),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:"more_info",note})});await load();}catch(e){el("cert-admin-message").textContent=e.message;}});
    card.append(issue,reject,more);queue.append(card);
   }
   for(const item of all){const card=node("article","submission-item");card.append(node("h3","",item.subject_name),node("p","",item.serial_number+" · "+item.status),node("p","",item.issued_at+" → "+item.expires_at));const a=node("a","","صفحة التحقق الرسمية");a.href="verify-certificate.html?serial="+encodeURIComponent(item.serial_number);card.append(a);
    if(item.status==="active"){const revoke=node("button","btn btn-outline","تعليق البطاقة");revoke.addEventListener("click",async()=>{const note=prompt("سبب التعليق؟")||"";if(!note)return;try{await req("/v1/admin/certificates/"+encodeURIComponent(item.serial_number),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:"suspended",note})});await load();}catch(e){el("cert-admin-message").textContent=e.message;}});card.append(revoke);}
    issued.append(card);}
  }catch(e){el("cert-admin-message").textContent=e.message;queue.textContent="تعذر تحميل الطلبات؛ تحقق من تسجيل دخول المدير وإعدادات API.";}
 }
 el("cert-refresh").addEventListener("click",load);load();
})();
