const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function readLimitedBody(request, maxBytes) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;

      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }

      chunks.push(value);
    }

    const combined = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new TextDecoder("utf-8", { fatal: true }).decode(combined);
  } finally {
    reader.releaseLock();
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return response({ allowed: false }, 405);
    }

    if (new URL(request.url).pathname !== "/check") {
      return response({ allowed: false }, 404);
    }

    if (!env.ANALYTICS_RATE_LIMIT) {
      return response({ allowed: false }, 503);
    }

    const contentType = (request.headers.get("Content-Type") || "")
      .split(";")[0].trim().toLowerCase();

    if (contentType !== "application/json") {
      return response({ allowed: false }, 415);
    }

    let data;

    try {
      const raw = await readLimitedBody(request, 512);

      if (raw === null) {
        return response({ allowed: false }, 413);
      }

      data = JSON.parse(raw);
    } catch {
      return response({ allowed: false }, 400);
    }

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      typeof data.sessionId !== "string" ||
      !UUID_RE.test(data.sessionId)
    ) {
      return response({ allowed: false }, 400);
    }

    try {
      const result = await env.ANALYTICS_RATE_LIMIT.limit({
        key: data.sessionId
      });

      if (!result.success) {
        return response({ allowed: false, reason: "rate_limited" }, 429);
      }

      return response({ allowed: true });
    } catch {
      return response({ allowed: false }, 503);
    }
  }
};
