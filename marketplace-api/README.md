# MTA Marketplace API

The canonical production runtime is **Cloudflare Pages Functions** on the existing website origin:
- `functions/api/_middleware.js` validates Cloudflare Access only for protected API paths.
- `functions/api/[[path]].js` adapts `/api/*` requests to this API module.
- `marketplace-api/src/index.js` contains the API handlers.
- `marketplace-api/schema.sql` defines D1 tables.
- `marketplace-api/DEPLOYMENT.md` contains the full dashboard setup and verification checklist.

## Storage and security
- D1 stores developer submissions and review state.
- A private R2 bucket stores files. New files remain in `quarantine/`.
- Cloudflare Access authenticates developer and administrator requests. The Pages middleware verifies the Access JWT signature, issuer, audience, and expiry with Cloudflare's JWKS, then passes the verified identity payload to the API.
- Only the configured `ADMIN_EMAILS` addresses can access moderation endpoints.
- Public downloads are possible only for rows marked `approved`.
- The admin review API requires explicit `rights_verified: true` and `malware_scan_passed: true` before approval.

## Endpoints
- `GET /api/health`
- `GET /api/v1/apps`
- `GET /api/v1/download/:id`
- `POST /api/v1/submissions`
- `POST /api/v1/submissions/:id/multipart` (start/resume)
- `PUT /api/v1/submissions/:id/multipart/:partNumber` (8 MiB chunks)
- `POST /api/v1/submissions/:id/multipart/complete` (complete upload)
- `PUT /api/v1/submissions/:id/file` (legacy single request, 100 MiB maximum)
- `GET /api/v1/me/submissions`
- `GET /api/v1/admin/submissions`
- `GET /api/v1/admin/submissions/:id/file` (admin-only private quarantine download for scanning)
- `PATCH /api/v1/admin/submissions/:id`

## Required external setup
No Cloudflare resources are created by a Git commit. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to create D1 and private R2, bind them to Pages Functions, configure Access, and set the admin allow-list.

## Important
There is no malware-scanning engine included in this repository. A reviewer must scan the binary with an appropriate security tool and verify redistribution rights before approval. The developer portal uses resumable 8 MiB multipart uploads up to the configured 2 GiB release cap. The legacy single-request endpoint is capped at 100 MiB.
