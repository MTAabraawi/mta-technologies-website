# MTA Marketplace API (deployment scaffold)

This Worker is the backend foundation for developer accounts, submissions, file storage, moderation, and approved direct downloads. It is **not live** until the Cloudflare resources and Access application below are created and the Worker is deployed.

## Architecture
- Cloudflare Pages: public bilingual website.
- Cloudflare Worker: API and download gateway.
- D1: app metadata, ownership, submission/review status.
- Private R2 bucket: uploaded files. New uploads remain under `quarantine/`.
- Cloudflare Access: authenticates registered developer/admin identities. Configure Google/GitHub identity providers for external developers. Protect only authenticated API paths (`/v1/submissions*`, `/v1/me/*`, and `/v1/admin/*`) so public catalogue and download routes remain public. Set the Worker Access audience and team issuer values exactly as shown by Cloudflare.
- Admin review: only addresses in the `ADMIN_EMAILS` secret can view the queue or approve/reject submissions.

## Provisioning
1. Create a D1 database named `mta-marketplace`; apply `schema.sql`.
2. Create a **private** R2 bucket named `mta-marketplace-files`.
3. Create a Worker from this directory and set the D1/R2 bindings in `wrangler.toml`.
4. Replace the Access placeholders. Configure an Access application for the API hostname and allow external developer identities. Do not expose the Worker API before JWT validation and identity-provider policies are configured.
5. Add the secret `ADMIN_EMAILS` containing the official administrator email address(es), comma-separated.
6. Deploy the Worker and configure CORS with the exact public site origin.
7. Connect the front-end submission form to this API only after the Worker health check, Access login, D1, and R2 upload have been tested.

## API outline
- `GET /health`: health check.
- `GET /v1/apps`: approved public catalogue.
- `POST /v1/submissions`: authenticated developer creates a metadata submission.
- `PUT /v1/submissions/:id/file`: owner uploads a release binary (100 MiB default).
- `GET /v1/me/submissions`: developer sees their own submission status.
- `GET /v1/admin/submissions`: admin-only moderation queue.
- `PATCH /v1/admin/submissions/:id`: admin approves, rejects, or removes a submission. Approval requires both `rights_verified: true` and `malware_scan_passed: true` in the request body.
- `GET /v1/download/:id`: public direct download, but only for approved entries.

See [SOURCES.md](./SOURCES.md) for the initial source catalogue and redistribution rules.

## Mandatory safety and legal review
- Uploads are private and not downloadable while awaiting review.
- The reviewer must verify the submitter's authority, the redistribution license/permission, official source, version, platform, and file identity.
- Run malware scanning and inspect package signatures/hashes before approval. The reviewer must explicitly send both `rights_verified: true` and `malware_scan_passed: true`. This starter does not include a malware-scanning engine; approval must not be automated.
- Reject pirated, cracked, repackaged without permission, malicious, deceptive, or rights-infringing software.
- Keep a takedown/report channel and promptly disable disputed files pending investigation.
- Never claim that an app is “verified safe” merely because it passed a basic file-type check.

## Important implementation notes
- The initial upload endpoint accepts a single request body and is capped at 100 MiB by default. Large desktop installers need a multipart/resumable upload implementation before the limit is raised.
- The Access JWT must contain an email claim and the configured audience. Use Cloudflare's official Access application configuration and never put API secrets in browser code.
- This scaffold does not create Cloudflare resources, configure DNS, or deploy itself.
