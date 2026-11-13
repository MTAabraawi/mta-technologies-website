const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff" };

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}
function cors(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== env.SITE_ORIGIN) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PUT,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-file-name",
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}
function safeName(value) {
  return String(value || "application.bin").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}
async function requireIdentity(ctx) {
  try {
    const payload = ctx?.access
      ? await ctx.access.getIdentity()
      : ctx?.data?.cloudflareAccess?.JWT?.payload;
    const email = String(payload?.email || "").trim().toLowerCase();
    return validEmail(email) ? { email } : null;
  } catch {
    return null;
  }
}
function isAdmin(identity, env) {
  return (env.ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean).includes(identity.email);
}
async function handle(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request, env) });
  if (url.pathname === "/health" && request.method === "GET") return json({ ok: true, service: "MTA Marketplace API" });
  if (url.pathname === "/v1/apps" && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, app_name, developer_name, platform, category, version, license_name, source_url, description, file_name, file_size, created_at FROM submissions WHERE status='approved' ORDER BY app_name").all();
    return json({ apps: results });
  }
  if (url.pathname.startsWith("/v1/download/") && request.method === "GET") {
    const id = url.pathname.split("/").pop();
    const row = await env.DB.prepare("SELECT file_name, object_key, app_name FROM submissions WHERE id=? AND status='approved' AND object_key IS NOT NULL").bind(id).first();
    if (!row) return json({ error: "File not found" }, 404);
    const object = await env.FILES.get(row.object_key);
    if (!object) return json({ error: "File not found" }, 404);
    return new Response(object.body, { headers: {
      "content-type": "application/octet-stream",
      "content-length": String(object.size),
      "content-disposition": 'attachment; filename="' + safeName(row.file_name) + '"',
      "x-content-type-options": "nosniff",
      "cache-control": "no-store"
    }});
  }


  // Public certificate verification: the signature is checked server-side; a QR image alone is not trusted.
  if (url.pathname === "/v1/certificates/verify" && request.method === "GET") {
    const serial = String(url.searchParams.get("serial") || "");
    const supplied = String(url.searchParams.get("sig") || "");
    const row = await env.DB.prepare("SELECT serial_number,subject_name,credential_type,issued_at,expires_at,status,signature,signature_algorithm FROM issued_certificates WHERE serial_number=?").bind(serial).first();
    if (!row || !env.CERT_SIGNING_SECRET) return json({ valid: false, reason: "not_found" }, 404);
    const submittedSignature = supplied || row.signature;
    const payload = [row.serial_number,row.subject_name,row.credential_type,row.issued_at,row.expires_at].join("|");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.CERT_SIGNING_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const bytes = Uint8Array.from(atob(submittedSignature.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-submittedSignature.length%4)%4)), ch => ch.charCodeAt(0));
    const validSignature = await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(payload));
    const signatureMatches = submittedSignature === row.signature && validSignature;
    const current = Date.now();
    const expired = Date.parse(row.expires_at) <= current;
    return json({ valid: signatureMatches && row.status === "active" && !expired, authentic: signatureMatches, status: expired && row.status === "active" ? "expired" : row.status, serial: row.serial_number, name: row.subject_name, credential: row.credential_type, issued_at: row.issued_at, expires_at: row.expires_at });
  }

  const identity = await requireIdentity(ctx);
  if (!identity) return json({ error: "Authentication required" }, 401);


  if (url.pathname === "/v1/certificates/requests" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !String(body.full_name || "").trim() || !String(body.statement || "").trim() || !String(body.requested_category || "").trim()) return json({ error: "Name, credential category, and supporting statement are required." }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO certificate_requests (id,applicant_email,full_name,public_display_name,organization,portfolio_url,evidence_url,requested_category,statement) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(id,identity.email,String(body.full_name).trim().slice(0,160),String(body.public_display_name || body.full_name).trim().slice(0,100),String(body.organization || "").slice(0,160),String(body.portfolio_url || "").slice(0,500),String(body.evidence_url || "").slice(0,500),String(body.requested_category).slice(0,60),String(body.statement).trim().slice(0,2000)).run();
    return json({ id, status: "pending" }, 201);
  }
  if (url.pathname === "/v1/me/certificates" && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT serial_number,subject_name,credential_type,issued_at,expires_at,status FROM issued_certificates WHERE request_id IN (SELECT id FROM certificate_requests WHERE applicant_email=?) ORDER BY created_at DESC").bind(identity.email).all();
    return json({ certificates: results });
  }
  if (url.pathname === "/v1/admin/certificates/requests" && request.method === "GET") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    const { results } = await env.DB.prepare("SELECT * FROM certificate_requests WHERE status IN ('pending','more_info','approved') ORDER BY created_at ASC").all();
    const { results: issued } = await env.DB.prepare("SELECT serial_number,subject_name,credential_type,issued_at,expires_at,status,issuer_email FROM issued_certificates ORDER BY created_at DESC").all();
    return json({ requests: results, issued });
  }

  const certStatusMatch = url.pathname.match(/^\\/v1\\/admin\\/certificates\\/([A-Z0-9-]+)$/i);
  if (certStatusMatch && request.method === "PATCH") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    const body = await request.json().catch(() => null);
    if (!body || !["suspended","revoked","active"].includes(body.status)) return json({ error: "Invalid credential status." }, 400);
    const row = await env.DB.prepare("SELECT id,status FROM issued_certificates WHERE serial_number=?").bind(certStatusMatch[1]).first();
    if (!row) return json({ error: "Credential not found." }, 404);
    await env.DB.prepare("UPDATE issued_certificates SET status=? WHERE id=?").bind(body.status,row.id).run();
    await env.DB.prepare("INSERT INTO certificate_events (id,certificate_id,actor_email,event_type,note) VALUES (?,?,?,?,?)")
      .bind(crypto.randomUUID(),row.id,identity.email,"status_"+body.status,String(body.note||"").slice(0,500)).run();
    return json({ serial: certStatusMatch[1], status: body.status });
  }
  const issueCertMatch = url.pathname.match(/^\/v1\/admin\/certificates\/requests\/([a-f0-9-]+)\/issue$/i);
  if (issueCertMatch && request.method === "POST") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    if (!env.CERT_SIGNING_SECRET || String(env.CERT_SIGNING_SECRET).length < 32) return json({ error: "Certificate signing secret is not configured securely." }, 503);
    const req = await env.DB.prepare("SELECT * FROM certificate_requests WHERE id=? AND status IN ('pending','approved')").bind(issueCertMatch[1]).first();
    if (!req) return json({ error: "Certificate request not found or not eligible." }, 404);
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 365*24*60*60*1000).toISOString();
    const counter = await env.DB.prepare("UPDATE certificate_serial_counter SET last_value=last_value+1 WHERE id=1 RETURNING last_value").first();
    if (!counter) return json({ error: "Serial counter is unavailable." }, 503);
    const serial = "MTA-DEV-" + now.getUTCFullYear() + "-" + String(counter.last_value).padStart(6,"0");
    const subject = req.public_display_name || req.full_name;
    const credential = String(body.credential_type || req.requested_category || "developer").slice(0,60);
    const payload = [serial,subject,credential,issuedAt,expiresAt].join("|");
    const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(env.CERT_SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
    const raw = new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
    let binary = ""; for (const b of raw) binary += String.fromCharCode(b);
    const signature = btoa(binary).replace(/\\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO issued_certificates (id,request_id,serial_number,subject_name,credential_type,issued_at,expires_at,signature,signer_key_version,issuer_email) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(id,req.id,serial,subject,credential,issuedAt,expiresAt,signature,String(env.CERT_SIGNING_KEY_VERSION || "v1"),identity.email).run();
    await env.DB.prepare("UPDATE certificate_requests SET status='issued',reviewer_email=?,reviewer_note=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(identity.email,String(body.note || "").slice(0,500),req.id).run();
    await env.DB.prepare("INSERT INTO certificate_events (id,certificate_id,actor_email,event_type,note) VALUES (?,?,?,'issued',?)")
      .bind(crypto.randomUUID(),id,identity.email,"Initial issuance").run();
    return json({ serial, name: subject, credential, issued_at: issuedAt, expires_at: expiresAt, signature, verify_url: env.SITE_ORIGIN + "/verify-certificate.html?serial=" + encodeURIComponent(serial) + "&sig=" + encodeURIComponent(signature) },201);
  }
  if (url.pathname === "/v1/submissions" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !body.app_name || !body.developer_name || !body.platform || !body.category || !body.version || !body.license_name || !body.description || body.authorization_confirmed !== true) {
      return json({ error: "Complete all required fields and confirm distribution rights." }, 400);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO submissions (id,owner_email,app_name,developer_name,platform,category,version,license_name,source_url,description,authorization_confirmed) VALUES (?,?,?,?,?,?,?,?,?,?,1)")
      .bind(id, identity.email, String(body.app_name).slice(0,120), String(body.developer_name).slice(0,120), String(body.platform).slice(0,40), String(body.category).slice(0,60), String(body.version).slice(0,40), String(body.license_name).slice(0,100), String(body.source_url || "").slice(0,500), String(body.description).slice(0,4000)).run();
    return json({ id, status: "pending", message: "Submission saved. Upload the release file to continue." }, 201);
  }

  const multipartStartMatch = url.pathname.match(/^\/v1\/submissions\/([a-f0-9-]+)\/multipart$/i);
  if (multipartStartMatch && request.method === "POST") {
    const id = multipartStartMatch[1];
    const row = await env.DB.prepare("SELECT id,status,multipart_upload_id,multipart_key,multipart_token,file_name,file_size,multipart_parts FROM submissions WHERE id=? AND owner_email=?").bind(id, identity.email).first();
    if (!row || row.status !== "pending") return json({ error: "Submission not found or upload is closed." }, 404);
    const body = await request.json().catch(() => null);
    const filename = safeName(body?.file_name);
    const fileSize = Number(body?.file_size);
    const token = String(body?.file_token || "").slice(0, 200);
    const ext = filename.toLowerCase().split(".").pop();
    const allowed = ["apk","aab","exe","msi","msix","msixbundle","dmg","pkg","deb","rpm","appimage","flatpak","snap","zip","7z","tar","gz","xz","bz2","iso","wasm"];
    const max = Number(env.MAX_UPLOAD_BYTES || 2147483648);
    if (!body || !token || !Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > max || !allowed.includes(ext)) {
      return json({ error: "Invalid filename, file size, upload token, or unsupported file type." }, 400);
    }
    if (row.multipart_upload_id && row.multipart_token === token && row.file_size === fileSize && row.file_name === filename) {
      let parts = [];
      try { parts = JSON.parse(row.multipart_parts || "[]"); } catch {}
      return json({ id, upload_id: row.multipart_upload_id, part_size: 8388608, parts, resumed: true });
    }
    if (row.multipart_upload_id && row.multipart_key) {
      try { await env.FILES.resumeMultipartUpload(row.multipart_key, row.multipart_upload_id).abort(); } catch {}
    }
    const key = "quarantine/" + id + "/" + crypto.randomUUID() + "-" + filename;
    const upload = await env.FILES.createMultipartUpload(key, {
      httpMetadata: { contentType: "application/octet-stream" },
      customMetadata: { submissionId: id, uploader: identity.email }
    });
    await env.DB.prepare("UPDATE submissions SET file_name=?,file_size=?,multipart_upload_id=?,multipart_key=?,multipart_token=?,multipart_parts='[]',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(filename, fileSize, upload.uploadId, key, token, id).run();
    return json({ id, upload_id: upload.uploadId, part_size: 8388608, parts: [], resumed: false }, 201);
  }

  const multipartPartMatch = url.pathname.match(/^\/v1\/submissions\/([a-f0-9-]+)\/multipart\/([0-9]+)$/i);
  if (multipartPartMatch && request.method === "PUT") {
    const id = multipartPartMatch[1];
    const partNumber = Number(multipartPartMatch[2]);
    const row = await env.DB.prepare("SELECT multipart_upload_id,multipart_key,multipart_parts FROM submissions WHERE id=? AND owner_email=? AND status='pending'").bind(id, identity.email).first();
    if (!row?.multipart_upload_id || !row.multipart_key || row.multipart_upload_id !== request.headers.get("x-upload-id")) return json({ error: "Upload session not found." }, 404);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000 || !request.body) return json({ error: "Invalid upload part." }, 400);
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > 8388608) return json({ error: "Each upload part must be between 1 byte and 8 MiB." }, 413);
    const upload = env.FILES.resumeMultipartUpload(row.multipart_key, row.multipart_upload_id);
    const uploadedPart = await upload.uploadPart(partNumber, bytes);
    let parts = [];
    try { parts = JSON.parse(row.multipart_parts || "[]"); } catch {}
    parts = parts.filter(part => part.partNumber !== partNumber);
    parts.push({ partNumber, etag: uploadedPart.etag, size: bytes.byteLength });
    parts.sort((a, b) => a.partNumber - b.partNumber);
    await env.DB.prepare("UPDATE submissions SET multipart_parts=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(JSON.stringify(parts), id).run();
    return json({ partNumber, etag: uploadedPart.etag, uploaded_parts: parts.length });
  }

  const multipartCompleteMatch = url.pathname.match(/^\/v1\/submissions\/([a-f0-9-]+)\/multipart\/complete$/i);
  if (multipartCompleteMatch && request.method === "POST") {
    const id = multipartCompleteMatch[1];
    const row = await env.DB.prepare("SELECT multipart_upload_id,multipart_key,multipart_parts,file_size FROM submissions WHERE id=? AND owner_email=? AND status='pending'").bind(id, identity.email).first();
    if (!row?.multipart_upload_id || !row.multipart_key) return json({ error: "Upload session not found." }, 404);
    const body = await request.json().catch(() => null);
    if (body?.upload_id !== row.multipart_upload_id) return json({ error: "Upload session mismatch." }, 409);
    let parts = [];
    try { parts = JSON.parse(row.multipart_parts || "[]"); } catch {}
    parts.sort((a, b) => a.partNumber - b.partNumber);
    if (!parts.length || parts.some((part, index) => part.partNumber !== index + 1 || typeof part.etag !== "string" || !Number.isInteger(part.size) || part.size < 1 || part.size > 8388608)) {
      return json({ error: "Upload is incomplete. Retry missing parts before completing." }, 409);
    }
    const uploadedBytes = parts.reduce((sum, part) => sum + part.size, 0);
    if (uploadedBytes !== row.file_size || parts.slice(0, -1).some(part => part.size < 5242880)) {
      return json({ error: "Uploaded part sizes do not match the declared file size or multipart minimums." }, 409);
    }
    try {
      const existingObject = await env.FILES.head(row.multipart_key);
      if (!existingObject) {
        await env.FILES.resumeMultipartUpload(row.multipart_key, row.multipart_upload_id).complete(parts);
      } else if (existingObject.size !== row.file_size) {
        return json({ error: "Stored object size does not match the submitted release." }, 409);
      }
    } catch {
      return json({ error: "Could not complete multipart upload. Verify all parts and retry." }, 400);
    }
    await env.DB.prepare("UPDATE submissions SET object_key=multipart_key,multipart_upload_id=NULL,multipart_key=NULL,multipart_token=NULL,multipart_parts='[]',status='pending_review',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(id).run();
    return json({ id, status: "pending_review", file_size: row.file_size, message: "File received and held for security and rights review." });
  }

  const uploadMatch = url.pathname.match(/^\/v1\/submissions\/([a-f0-9-]+)\/file$/i);
  if (uploadMatch && request.method === "PUT") {
    const id = uploadMatch[1];
    const row = await env.DB.prepare("SELECT id,status FROM submissions WHERE id=? AND owner_email=?").bind(id, identity.email).first();
    if (!row || !["pending","pending_review"].includes(row.status)) return json({ error: "Submission not found or upload is closed." }, 404);
    const size = Number(request.headers.get("content-length") || 0);
    const max = Math.min(Number(env.MAX_UPLOAD_BYTES || 104857600), 104857600);
    if (!request.body || !size) return json({ error: "A known file size is required for secure streaming uploads." }, 411);
    if (size > max) return json({ error: "File exceeds the upload limit." }, 413);
    const filename = safeName(request.headers.get("x-file-name"));
    const ext = filename.toLowerCase().split(".").pop();
    const allowed = ["apk","aab","exe","msi","dmg","pkg","deb","rpm","appimage","zip","tar","gz","wasm"];
    if (!allowed.includes(ext)) return json({ error: "Unsupported file type." }, 415);
    const key = "quarantine/" + id + "/" + crypto.randomUUID() + "-" + filename;
    let actualSize = 0;
    const fixed = new FixedLengthStream(size);
    const countedBody = request.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        actualSize += chunk.byteLength;
        if (actualSize > max || actualSize > size) throw new Error("UPLOAD_SIZE_MISMATCH");
        controller.enqueue(chunk);
      }
    }));
    try {
      const storePromise = env.FILES.put(key, fixed.readable, { httpMetadata: { contentType: "application/octet-stream" }, customMetadata: { submissionId: id, uploader: identity.email } });
      const outcomes = await Promise.allSettled([countedBody.pipeTo(fixed.writable), storePromise]);
      const failure = outcomes.find(result => result.status === "rejected");
      if (failure) throw failure.reason;
    } catch (error) {
      await env.FILES.delete(key);
      if (actualSize > max) return json({ error: "File exceeds the upload limit." }, 413);
      return json({ error: "Upload stream failed or file size did not match its declared length." }, 400);
    }
    if (actualSize === 0 || actualSize !== size) {
      await env.FILES.delete(key);
      return json({ error: "Uploaded size does not match the declared file size." }, 400);
    }
    await env.DB.prepare("UPDATE submissions SET file_name=?,file_size=?,object_key=?,status='pending_review',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(filename, actualSize, key, id).run();
    return json({ id, status: "pending_review", message: "File received and held for security and rights review." });
  }

  if (url.pathname === "/v1/me/submissions" && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id,app_name,platform,version,status,created_at,updated_at,review_note FROM submissions WHERE owner_email=? ORDER BY created_at DESC").bind(identity.email).all();
    return json({ submissions: results });
  }

  if (url.pathname === "/v1/admin/submissions" && request.method === "GET") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    const { results } = await env.DB.prepare("SELECT * FROM submissions WHERE status IN ('pending','pending_review','approved') ORDER BY status, created_at DESC").all();
    return json({ submissions: results });
  }
  const adminFileMatch = url.pathname.match(/^\/v1\/admin\/submissions\/([a-f0-9-]+)\/file$/i);
  if (adminFileMatch && request.method === "GET") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    const row = await env.DB.prepare("SELECT file_name, object_key FROM submissions WHERE id=?").bind(adminFileMatch[1]).first();
    if (!row?.object_key) return json({ error: "File not found" }, 404);
    const object = await env.FILES.get(row.object_key);
    if (!object) return json({ error: "File not found" }, 404);
    return new Response(object.body, { headers: {
      "content-type": "application/octet-stream",
      "content-length": String(object.size),
      "content-disposition": 'attachment; filename="' + safeName(row.file_name) + '"',
      "x-content-type-options": "nosniff",
      "cache-control": "no-store"
    }});
  }
  const reviewMatch = url.pathname.match(/^\/v1\/admin\/submissions\/([a-f0-9-]+)$/i);
  if (reviewMatch && request.method === "PATCH") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    const body = await request.json().catch(() => null);
    if (!body || !["approved","rejected","removed","changes_requested"].includes(body.status)) return json({ error: "Invalid review status." }, 400);
    if (body.status === "changes_requested" && !String(body.note || "").trim()) return json({ error: "A clear revision request is required." }, 400);
    if (body.status === "approved" && (body.rights_verified !== true || body.malware_scan_passed !== true)) {
      return json({ error: "Approval requires explicit rights verification and a completed malware scan." }, 400);
    }
    const row = await env.DB.prepare("SELECT id,object_key,multipart_upload_id,multipart_key FROM submissions WHERE id=?").bind(reviewMatch[1]).first();
    if (!row) return json({ error: "Submission not found." }, 404);
    if (body.status === "approved" && !row.object_key) return json({ error: "A release file is required before approval." }, 400);
    if (body.status !== "approved" && body.status !== "changes_requested") {
      if (row.multipart_upload_id && row.multipart_key) {
        try { await env.FILES.resumeMultipartUpload(row.multipart_key, row.multipart_upload_id).abort(); } catch {}
      }
      if (row.object_key) await env.FILES.delete(row.object_key);
      await env.DB.prepare("UPDATE submissions SET object_key=NULL,file_name=NULL,file_size=NULL,multipart_upload_id=NULL,multipart_key=NULL,multipart_token=NULL,multipart_parts='[]' WHERE id=?").bind(row.id).run();
    }
    if (body.status === "changes_requested" && row.object_key) {
      await env.FILES.delete(row.object_key);
      await env.DB.prepare("UPDATE submissions SET object_key=NULL,file_name=NULL,file_size=NULL WHERE id=?").bind(row.id).run();
    }
    if (body.status === "approved" && row.object_key.startsWith("quarantine/")) {
      const source = await env.FILES.get(row.object_key);
      if (!source) return json({ error: "Quarantined file is missing." }, 409);
      const publicKey = "published/" + row.id + "/" + safeName((await env.DB.prepare("SELECT file_name FROM submissions WHERE id=?").bind(row.id).first()).file_name);
      await env.FILES.put(publicKey, source.body, { httpMetadata: { contentType: "application/octet-stream" } });
      await env.FILES.delete(row.object_key);
      await env.DB.prepare("UPDATE submissions SET object_key=? WHERE id=?").bind(publicKey,row.id).run();
    }
    const storedStatus = body.status === "changes_requested" ? "pending" : body.status;
    await env.DB.prepare("UPDATE submissions SET status=?,reviewer_email=?,review_note=?,revision_requested_at=CASE WHEN ?=1 THEN strftime('%Y-%m-%dT%H:%M:%fZ','now') ELSE revision_requested_at END,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(storedStatus, identity.email, String(body.note || "").slice(0,1000), body.status === "changes_requested" ? 1 : 0, reviewMatch[1]).run();
    return json({ id: reviewMatch[1], status: body.status });
  }
  return json({ error: "Not found" }, 404);
}
export default {
  async fetch(request, env, ctx) {
    const headers = cors(request, env);
    try {
      const response = await handle(request, env, ctx);
      const merged = new Headers(response.headers);
      for (const [key, value] of Object.entries(headers)) merged.set(key, value);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: merged });
    } catch (error) {
      return json({ error: "Internal server error" }, 500, headers);
    }
  }
};
