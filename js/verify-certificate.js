(() => {
 const api=(window.MTA_MARKETPLACE_API||"").replace(/\/$/,"");
 const params=new URLSearchParams(location.search),serial=params.get("serial")||"",sig=params.get("sig")||"";
 const status=document.getElementById("verification-status"),details=document.getElementById("verification-details");
 const add=(label,value)=>{const dt=document.createElement("dt");dt.textContent=label;const dd=document.createElement("dd");dd.textContent=value||"—";details.append(dt,dd);};
 if(!serial){status.textContent="لم يتم توفير الرقم التسلسلي.";return;}
 fetch(api+"/v1/certificates/verify?serial="+encodeURIComponent(serial)+(sig?"&sig="+encodeURIComponent(sig):""))
 .then(async r=>{const d=await r.json();if(!r.ok)throw new Error("لم يتم العثور على سجل مطابق.");return d;})
 .then(d=>{status.textContent=d.valid?"✓ بطاقة أصلية وسارية وصادرة من MTA TECHNOLOGIES":"⚠ البطاقة غير سارية أو لا يمكن اعتمادها";add("الاسم",d.name);add("الرقم التسلسلي",d.serial);add("نوع الاعتماد",d.credential);add("الحالة",d.status);add("تاريخ الإصدار",d.issued_at);add("تاريخ الانتهاء",d.expires_at);})
 .catch(e=>{status.textContent=e.message;});
})();
