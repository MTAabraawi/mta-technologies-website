# Production deployment — MTA Marketplace on Cloudflare Pages

The production integration uses **Pages Functions on the same website origin** at `/api/*`. This avoids cross-origin browser authentication and keeps the existing static site and Pages project. The API module is in `marketplace-api/src/index.js`; the Pages adapter is in `functions/api/[[path]].js`; Access JWT validation middleware is in `functions/api/_middleware.js`. Cloudflare Access JWTs are verified in the Pages middleware with Web Crypto and Cloudflare's published signing keys; no Access plugin dependency is required.

Cloudflare Pages Functions are deployed with the Pages project when the root `functions/` directory is included in the project build. See the official Pages Functions guide and Cloudflare Access JWT documentation:
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

## 1. Deploy the code safely
1. Keep the current Cloudflare Pages project connected to this GitHub repository.
2. Keep its existing production branch set to `main`. Do not change it to the development branch.
3. Review PR #1 and merge it only after approving the changes. Until then, this code is not part of production.
4. Confirm the Pages build output includes the repository root and that the root `functions/` folder is not excluded.
5. No static-site build command or npm runtime dependency is required for the existing plain HTML website and native Web Crypto middleware; retain the project's currently working build settings.

## 2. Create D1
1. In Cloudflare Dashboard → Workers & Pages → D1 SQL Database → Create.
2. Name it `mta-marketplace`.
3. Open its Console and execute the complete contents of `marketplace-api/schema.sql`.
4. In the Pages project → Settings → Functions → D1 database bindings, add binding name `DB` and select `mta-marketplace`.
5. Add the binding for both Production and Preview only if you intend to test on previews; use a separate test database for Preview.

## 3. Create private R2 storage
1. In Cloudflare Dashboard → R2 → Create bucket.
2. Name it `mta-marketplace-files`.
3. Do not enable public bucket access or attach an r2.dev public URL.
4. In the Pages project → Settings → Functions → R2 bucket bindings, add binding name `FILES` and select `mta-marketplace-files`.
5. Bind production and preview to separate buckets if preview uploads are enabled.

## 4. Configure Pages environment variables
In Pages project → Settings → Functions → Environment variables, set for Production:
- `SITE_ORIGIN` = `https://www.mtahqq.dpdns.org`
- `ACCESS_TEAM_DOMAIN` = `https://YOUR-TEAM.cloudflareaccess.com`
- `ACCESS_AUD` = the audience tag of the Access application protecting the developer/admin API paths
- `MAX_UPLOAD_BYTES` = `2147483648` (2 GiB maximum per submitted release)

Use your actual Cloudflare Zero Trust team domain and Access AUD. Do not commit credentials or API tokens to GitHub. Redeploy after changing bindings or variables.

## 5. Configure Cloudflare Access (path-specific)
Create a Self-hosted Access application for the existing website hostname. Protect only these API paths:
- `www.mtahqq.dpdns.org/api/v1/submissions*`
- `www.mtahqq.dpdns.org/api/v1/me/*`
- `www.mtahqq.dpdns.org/api/v1/admin/*`

Do **not** protect `/api/v1/apps` or `/api/v1/download/*`; those routes are public catalogue/download endpoints. Configure an email one-time PIN provider or a supported identity provider for developer sign-in. Allow external developer identities for the developer routes. The same Access application authenticates developer and administrator requests. The API independently checks `ADMIN_EMAILS` on every admin endpoint, so a normal signed-in developer cannot moderate or inspect other users' submissions.

The Pages middleware validates the `Cf-Access-Jwt-Assertion` (or `CF_Authorization` cookie) signature, issuer, audience, expiry, and key ID using Cloudflare's published JWKS. The API trusts the verified JWT payload placed in the Pages request context. Do not replace it with an unverified email header.

## 6. Set administrator allow-list
In Pages project → Settings → Functions → Environment variables, add:
- `ADMIN_EMAILS` = `mtatechnologies0@gmail.com`

The admin UI is not a security boundary. The server checks this allow-list for every admin API request.

## 7. Configure the website API path
The committed `marketplace-config.js` points the frontend to same-origin `/api`. Do not change it to an external host. Once the Pages Functions deployment is active, the public API health check is:
- `https://www.mtahqq.dpdns.org/api/health`

The catalogue endpoint is:
- `https://www.mtahqq.dpdns.org/api/v1/apps`

## 8. Verify before inviting developers
Run these checks after deployment:
1. `GET /api/health` returns `ok: true`.
2. `GET /api/v1/apps` returns an empty `apps` list initially (plus any manually approved entries).
3. Unauthenticated `GET /api/v1/me/submissions` is blocked by Access.
4. A developer can sign in, create a submission, upload a small harmless test file using the resumable 8 MiB multipart flow, and see `pending_review`.
5. Interrupt a multi-part test upload and retry with the same selected file; already completed parts should be reused.
6. The completed uploaded object is private in R2 and cannot be fetched from the public catalogue or download endpoint.
7. A non-admin cannot access `/api/v1/admin/submissions`.
8. The administrator can review the request. Approval is rejected unless both rights verification and malware-scan checkboxes are selected.
9. Only after approval does `GET /api/v1/download/:id` return the file.
10. Test a rejected listing, a missing file, a too-large file, and a removed listing. Confirm the admin queue can remove a previously approved listing and that its R2 object is deleted.
11. Add Cloudflare rate-limiting/WAF rules for repeated submission and upload attempts where your plan supports them. Monitor Worker/Pages logs and storage usage.

## 9. Operational/legal safeguards still required
- This repository does not include a malware scanning engine. Do not approve real applications until a scanning provider or isolated manual scanning workflow is connected and the reviewer has inspected its result.
- Verify redistribution rights, exact license text, trademarks, bundled assets, source-code obligations, publisher identity, version, and file provenance.
- Add a takedown intake and an operational response process. Remove disputed files from public availability while investigating.
- Establish backup/retention and data-deletion procedures for developer accounts and submission metadata.
- Start with small test uploads. The developer portal uses resumable 8 MiB R2 multipart chunks and supports releases up to the configured 2 GiB cap. The legacy single-request endpoint remains capped at 100 MiB. R2 incomplete multipart sessions expire automatically after seven days; changing the selected file starts a fresh upload session.
- No production upload or download is active until the Pages Functions, D1, R2, and Access configuration above is completed and tested.
