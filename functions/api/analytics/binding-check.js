function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet({ env }) {
  if (!env.ANALYTICS_LIMITER) {
    return json({ bindingConfigured: false }, 503);
  }

  try {
    const response = await env.ANALYTICS_LIMITER.fetch(
      new Request("https://analytics-rate-limiter.internal/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "d4c3b2a1-9876-4abc-8def-1234567890ab"
        })
      })
    );

    let result;
    try {
      result = await response.json();
    } catch {
      return json({ bindingConfigured: true, workerResponded: false }, 503);
    }

    return json({
      bindingConfigured: true,
      workerResponded: true,
      limiterStatus: response.status,
      allowed: result?.allowed === true
    }, response.status === 429 ? 429 : response.ok && result?.allowed === true ? 200 : 503);
  } catch {
    return json({ bindingConfigured: true, workerResponded: false }, 503);
  }
}
