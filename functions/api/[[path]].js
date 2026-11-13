import marketplaceWorker from "../../marketplace-api/src/index.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = url.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  const request = new Request(url, context.request);
  return marketplaceWorker.fetch(request, context.env, context);
}
