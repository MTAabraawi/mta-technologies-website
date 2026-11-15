const DEFAULT_ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const ALLOWED_PATHS = new Set([
  "/api/v1/apps",
  "/api/v1/catalog-stats"
]);

export async function onRequest({ request, env }) {
  const incoming = new URL(request.url);

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ detail: "Method Not Allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", "allow": "GET" }
    });
  }

  if (!ALLOWED_PATHS.has(incoming.pathname)) {
    return new Response(JSON.stringify({ detail: "Not Found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const engineOrigin = (env && env.MTA_APPLICATIONS_ENGINE_ORIGIN) || DEFAULT_ENGINE_ORIGIN;
  const upstream = new URL(incoming.pathname + incoming.search, engineOrigin);

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: { "accept": "application/json" },
      redirect: "error",
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    const headers = new Headers(response.headers);
    headers.set("cache-control", "no-store, no-cache, must-revalidate");
    headers.set("x-content-type-options", "nosniff");
    headers.delete("access-control-allow-origin");
    headers.delete("access-control-allow-methods");
    headers.delete("access-control-allow-headers");
    headers.delete("access-control-expose-headers");
    headers.delete("vary");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.error("MTA catalogue proxy upstream request failed:", error);
    return new Response(JSON.stringify({
      detail: "Application catalogue upstream is temporarily unavailable",
      code: "CATALOGUE_UPSTREAM_UNAVAILABLE"
    }), {
      status: 502,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      }
    });
  }
}
