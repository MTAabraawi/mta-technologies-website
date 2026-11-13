import cloudflareAccessPlugin from "@cloudflare/pages-plugin-cloudflare-access";

const protectedPath = /^\/api\/v1\/(?:submissions(?:\/|$)|me(?:\/|$)|admin(?:\/|$))/;

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  if (!protectedPath.test(pathname)) return context.next();

  const domain = context.env.ACCESS_TEAM_DOMAIN;
  const aud = context.env.ACCESS_AUD;
  if (!domain || !aud) {
    return new Response(JSON.stringify({ error: "Marketplace authentication is not configured." }), {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }

  return cloudflareAccessPlugin({ domain, aud })(context);
}
