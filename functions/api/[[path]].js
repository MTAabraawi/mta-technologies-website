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

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    let upstream = null;
    let lastError = null;

    // Retry transient upstream failures at the edge as well as in the
    // browser. This protects both catalogue pages and the initial stats call.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        upstream = await fetch(new Request(upstreamUrl, {
          method: request.method,
          headers,
          redirect: "manual"
        }));

        const retryable = upstream.status === 429 || upstream.status >= 500;
        if (!retryable || attempt === 2) break;

        // Release the failed response before retrying.
        try {
          await upstream.body?.cancel();
        } catch {
          // Ignore cancellation errors; the next attempt is still safe.
        }
      } catch (error) {
        lastError = error;
        if (attempt === 2) throw error;
      }

      await wait(300 * (attempt + 1));
    }

    if (!upstream) {
      throw lastError || new Error("Catalogue upstream request failed");
    }

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
      "Retry-After": "5"
    });
  }
}
