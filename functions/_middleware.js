// Keep production GA4 data clean: only the canonical public host may load the GA bootstrap.
// Cloudflare Pages applies this middleware to static pages and Pages Function responses.
const PRODUCTION_HOST = "www.mtahqq.dpdns.org";
const GA_BOOTSTRAP = /<script\\b(?=[^>]*\\bsrc=["']https:\\/\\/www\\.googletagmanager\\.com\\/gtag\\/js\\?id=G-PLS74VD22C["'])[^>]*>\\s*<\\/script>\\s*<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi;

export async function onRequest({ request, next }) {
  const response = await next();
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (hostname === PRODUCTION_HOST) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html") || !response.body) return response;

  const html = await response.clone().text();
  const sanitizedHtml = html.replace(GA_BOOTSTRAP, "");
  if (sanitizedHtml === html) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  return new Response(sanitizedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
