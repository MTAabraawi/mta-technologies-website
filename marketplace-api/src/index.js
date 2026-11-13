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
async function requireIdentity(request, env) {
  const identity = await accessIdentity(request, env);
  return identity;
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
      "cache-control": "public, max-age=300"
    }});
  }

  const identity = await requireIdentity(ctx);
  if (!identity) return json({ error: "Authentication required" }, 401);

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

  const uploadMatch = url.pathname.match(/^\/v1\/submissions\/([a-f0-9-]+)\/file$/i);
  if (uploadMatch && request.method === "PUT") {
    const id = uploadMatch[1];
    const row = await env.DB.prepare("SELECT id,status FROM submissions WHERE id=? AND owner_email=?").bind(id, identity.email).first();
    if (!row || !["pending","pending_review"].includes(row.status)) return json({ error: "Submission not found or upload is closed." }, 404);
    const size = Number(request.headers.get("content-length") || 0);
    const max = Number(env.MAX_UPLOAD_BYTES || 104857600);
    if (!request.body || size > max) return json({ error: "File is empty or the declared upload limit was exceeded." }, 413);
    const filename = safeName(request.headers.get("x-file-name"));
    const ext = filename.toLowerCase().split(".").pop();
    const allowed = ["apk","aab","exe","msi","dmg","pkg","deb","rpm","appimage","zip","tar","gz","wasm"];
    if (!allowed.includes(ext)) return json({ error: "Unsupported file type." }, 415);
    const key = "quarantine/" + id + "/" + crypto.randomUUID() + "-" + filename;
    let actualSize = 0;
    const limitedBody = request.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        actualSize += chunk.byteLength;
        if (actualSize > max) throw new Error("UPLOAD_TOO_LARGE");
        controller.enqueue(chunk);
      }
    }));
    try {
      await env.FILES.put(key, limitedBody, { httpMetadata: { contentType: "application/octet-stream" }, customMetadata: { submissionId: id, uploader: identity.email } });
    } catch (error) {
      await env.FILES.delete(key);
      if (actualSize > max) return json({ error: "File exceeds the upload limit." }, 413);
      throw error;
    }
    if (actualSize === 0 || (size > 0 && actualSize !== size)) {
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
    const { results } = await env.DB.prepare("SELECT * FROM submissions WHERE status IN ('pending','pending_review') ORDER BY created_at").all();
    return json({ submissions: results });
  }
  const reviewMatch = url.pathname.match(/^\/v1\/admin\/submissions\/([a-f0-9-]+)$/i);
  if (reviewMatch && request.method === "PATCH") {
    if (!isAdmin(identity, env)) return json({ error: "Forbidden" }, 403);
    const body = await request.json().catch(() => null);
    if (!body || !["approved","rejected","removed"].includes(body.status)) return json({ error: "Invalid review status." }, 400);
    if (body.status === "approved" && (body.rights_verified !== true || body.malware_scan_passed !== true)) {
      return json({ error: "Approval requires explicit rights verification and a completed malware scan." }, 400);
    }
    const row = await env.DB.prepare("SELECT id,object_key FROM submissions WHERE id=?").bind(reviewMatch[1]).first();
    if (!row) return json({ error: "Submission not found." }, 404);
    if (body.status === "approved" && !row.object_key) return json({ error: "A release file is required before approval." }, 400);
    if (body.status === "approved" && row.object_key.startsWith("quarantine/")) {
      const source = await env.FILES.get(row.object_key);
      if (!source) return json({ error: "Quarantined file is missing." }, 409);
      const publicKey = "published/" + row.id + "/" + safeName((await env.DB.prepare("SELECT file_name FROM submissions WHERE id=?").bind(row.id).first()).file_name);
      await env.FILES.put(publicKey, source.body, { httpMetadata: { contentType: "application/octet-stream" } });
      await env.FILES.delete(row.object_key);
      await env.DB.prepare("UPDATE submissions SET object_key=? WHERE id=?").bind(publicKey,row.id).run();
    }
    await env.DB.prepare("UPDATE submissions SET status=?,reviewer_email=?,review_note=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
      .bind(body.status, identity.email, String(body.note || "").slice(0,1000), reviewMatch[1]).run();
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
