(() => {
 const api=(window.MTA_MARKETPLACE_API||"").replace(/\/$/,""),serial=new URLSearchParams(location.search).get("serial");
 const el=id=>document.getElementById(id);
 if(!serial){el("credential-error").textContent="Missing serial number.";return;}
 fetch(api+"/v1/me/certificates",{credentials:"include"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Sign in required");return d;})
 .then(d=>{const item=(d.certificates||[]).find(x=>x.serial_number===serial);if(!item)throw new Error("This credential is not available to the signed-in account.");
  el("credential-name").textContent=item.subject_name;el("credential-type").textContent=item.credential_type;el("credential-serial").textContent=item.serial_number;el("credential-issued").textContent=new Date(item.issued_at).toLocaleDateString();el("credential-expiry").textContent=new Date(item.expires_at).toLocaleDateString();el("credential-status").textContent=item.status;
  const verify=new URL("verify-certificate.html",location.href);verify.searchParams.set("serial",item.serial_number);verify.searchParams.set("sig",item.signature);el("credential-verify-link").href=verify.href;
  const qr=new URL("https://api.qrserver.com/v1/create-qr-code/");qr.searchParams.set("size","220x220");qr.searchParams.set("data",verify.href);el("credential-qr").src=qr.href;
 }).catch(e=>{el("credential-error").textContent=e.message;});
})();
