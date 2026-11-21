const ENGINE_ORIGIN = "https://mta-applications-engine.hoaam100.workers.dev";
const ALLOWED_PATHS = new Set([
  "/api/v1/apps",
  "/api/v1/catalog-stats"
]);

function jsonError(status, error, headers = {}) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

export async function onRequest({ request }) {
  const incoming = new URL(request.url);

  // This is a narrow same-origin API bridge, not an open proxy.
  if (!ALLOWED_PATHS.has(incoming.pathname)) {
    return jsonError(404, "API route not found");
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonError(405, "Method not allowed", { Allow: "GET, HEAD" });
  }

  const upstreamUrl = new URL(incoming.pathname + incoming.search, ENGINE_ORIGIN);
  const headers = new Headers();
  const accept = request.headers.get("Accept");
  const acceptLanguage = request.headers.get("Accept-Language");
  if (accept) headers.set("Accept", accept);
  if (acceptLanguage) headers.set("Accept-Language", acceptLanguage);

  try {
    const upstream = await fetch(new Request(upstreamUrl, {
      method: request.method,
      headers,
      redirect: "manual"
    }));

    // Preserve the engine's JSON body and pagination headers (including
    // X-Total-Count), while preventing stale catalogue pages at the edge.
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.delete("Set-Cookie");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("MTA catalogue API upstream request failed", error);
    return jsonError(502, "Catalogue service temporarily unavailable", {
      "Retry-After": "15"
    });
  }
}
