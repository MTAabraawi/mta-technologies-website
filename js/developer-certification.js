(() => {
 const api=(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
 const el=id=>document.getElementById(id);
 const msg=(id,value)=>{const node=el(id);if(node)node.textContent=value;};
 const t=(ar,en)=>document.documentElement.lang==="en"?en:ar;
 async function call(path,options={}) {
  if(!api) throw new Error(t("خدمة البوابة غير مهيأة بعد.","Portal API is not configured."));
  const response=await fetch(api+path,{credentials:"include",...options});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||("HTTP "+response.status));
  return data;
 }
 const form=el("cert-request");
 form?.addEventListener("submit",async event=>{
  event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());
  try{const result=await call("/v1/certificates/requests",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});msg("cert-message",t("تم استلام طلبك. رقم الطلب: ","Request received. Request ID: ")+result.id);form.reset();}
  catch(error){msg("cert-message",error.message);}
 });
 el("load-certs")?.addEventListener("click",async()=>{
  const root=el("my-certs");root.replaceChildren();
  try{const data=await call("/v1/me/certificates");if(!data.certificates.length){root.textContent=t("لا توجد بطاقات صادرة لحسابك.","No credentials have been issued to your account.");return;}
   for(const item of data.certificates){const card=document.createElement("article");card.className="submission-item";const title=document.createElement("h3");title.textContent=item.subject_name;const serial=document.createElement("p");serial.textContent=item.serial_number+" · "+item.status;const dates=document.createElement("p");dates.textContent=item.issued_at+" → "+item.expires_at;card.append(title,serial,dates);root.append(card);}
  }catch(error){root.textContent=error.message;}
 });
 el("cert-verify")?.addEventListener("submit",async event=>{
  event.preventDefault();const serial=new FormData(event.currentTarget).get("serial");const root=el("cert-result");root.textContent=t("جارٍ التحقق...","Verifying...");
  try{const result=await call("/v1/certificates/verify?serial="+encodeURIComponent(serial));root.textContent=(result.valid?t("بطاقة صحيحة وسارية","Authentic and active"):t("البطاقة غير سارية أو غير صالحة","Credential is not active or valid"))+" · "+result.name+" · "+result.serial+" · "+result.status;}
  catch(error){root.textContent=t("تعذر التحقق من البطاقة: ","Could not verify credential: ")+error.message;}
 });
})();
