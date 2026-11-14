const protectedPath = /^\/api\/v1\/(?:submissions(?:\/|$)|me(?:\/|$)|admin(?:\/|$)|certificates\/requests(?:\/|$))/;
let cachedJwks = null;
let cachedJwksAt = 0;

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function getAccessToken(request) {
  const headerToken = request.headers.get("Cf-Access-Jwt-Assertion");
  if (headerToken) return headerToken;

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function getAccessJwks(domain) {
  const now = Date.now();
  if (cachedJwks && now - cachedJwksAt < 5 * 60 * 1000) return cachedJwks;

  const response = await fetch(`https://${domain}/cdn-cgi/access/certs`, {
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) throw new Error("Unable to retrieve Cloudflare Access signing keys.");

  const body = await response.json();
  if (!Array.isArray(body.keys)) throw new Error("Invalid Cloudflare Access signing-key response.");

  cachedJwks = body.keys;
  cachedJwksAt = now;
  return cachedJwks;
}

async function verifyAccessJwt(token, domain, expectedAudience) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  let header;
  let payload;
  try {
    header = decodeJsonPart(parts[0]);
    payload = decodeJsonPart(parts[1]);
  } catch {
    return false;
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string") return false;

  const issuer = `https://${domain}`;
  if (payload.iss !== issuer) return false;

  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(expectedAudience)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || now >= payload.exp) return false;
  if (typeof payload.nbf === "number" && now + 60 < payload.nbf) return false;

  const keys = await getAccessJwks(domain);
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return false;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  return valid ? payload : null;
}

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  if (!protectedPath.test(pathname)) return context.next();

  const configuredDomain = context.env.ACCESS_TEAM_DOMAIN;
  const audience = context.env.ACCESS_AUD;
  if (!configuredDomain || !audience) {
    return jsonError("Marketplace authentication is not configured.", 503);
  }

  const domain = configuredDomain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const token = getAccessToken(context.request);
  if (!token) return jsonError("Cloudflare Access authentication is required.", 401);

  try {
    const payload = await verifyAccessJwt(token, domain, audience);
    if (!payload) return jsonError("Cloudflare Access token is invalid or expired.", 401);
    context.data = context.data || {};
    context.data.cloudflareAccess = { JWT: { payload } };
  } catch {
    return jsonError("Unable to verify Cloudflare Access authentication.", 503);
  }

  return context.next();
}
