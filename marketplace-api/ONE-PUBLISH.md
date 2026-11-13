# MTA ONE-PUBLISH — connector implementation plan

## Current state

The public service page is a roadmap only. No store connector is live, no publisher credentials are collected, and no app is submitted to an external store by this repository today.

ONE-PUBLISH must orchestrate submissions under each app owner's own publisher account. It must not claim universal publishing, bypass store review, request store passwords, or reuse MTA's publisher identity for third-party apps.

## First official connector candidates

### Google Play
- Official interface: Google Play Developer Publishing API.
- Documented capabilities include uploading releases and assigning them to testing or production tracks.
- Access requires a Google Cloud project, the API enabled, a service account or OAuth client, and explicit permissions granted in Play Console by the app owner.
- Connector implementation should support an upload/edit/commit transaction, release track selection, and API error/status capture.
- Source: https://developer.android.com/google/play/developer-api
- Access setup: https://developers.google.com/android-publisher/getting_started

### Apple App Store Connect
- Official interface: App Store Connect API.
- It supports app metadata, versions, review submission, and release management.
- Binary upload is not a direct App Store Connect API operation; Apple documents using Xcode or Transporter, with API keys usable for Transporter authentication.
- Requires the app owner's Apple Developer team API key and suitable role permissions.
- Source: https://developer.apple.com/app-store-connect/api/
- Upload details: https://developer.apple.com/help/app-store-connect/

### Huawei AppGallery
- Official interface: AppGallery Connect APIs, including Publishing API and Upload Management API.
- Documentation describes package and asset upload, app information updates, and submitting releases for review.
- Requires an authorized AppGallery Connect developer account and API credentials with the required app permissions.
- Source: https://developer.huawei.com/consumer/en/doc/appgallery-connect-Guides/agcapi-overview-0000001158245083/

## Architecture requirements

1. Keep a canonical app record and immutable release artifact in private object storage.
2. Validate package identity, version, signing provenance, file hash, metadata, and target-store requirements before creating a job.
3. Create one independent publishing job per app × store × release. Store states separately: draft, ready, uploading, submitted, in_review, approved, rejected, published, failed, and cancelled.
4. Use provider adapters with a common interface (validate, upload, submit, getStatus, cancel where supported). Do not pretend provider capabilities are identical.
5. Use per-owner OAuth/API authorization. Encrypt credentials at rest with a server-only CONNECTOR_ENCRYPTION_KEY; never expose tokens in browser responses, logs, analytics, or D1 plaintext.
6. Keep credentials scoped to the minimum required actions. Provide disconnect/revoke, key rotation, audit history, and deletion workflows.
7. Persist provider operation IDs and sanitized error details. Use idempotency keys and retry only operations known to be safe.
8. Never automatically press the final publish/production-release action unless the owner explicitly selects it for that specific release and target store.
9. The store's own review remains authoritative. Display each store's returned status and link to its publisher console when possible.
10. For Apple binary upload, plan for a controlled Transporter runner; do not claim that App Store Connect REST alone uploads the binary.

## Proposed D1 records

- store_connections: owner email, provider, provider account/team ID, encrypted credential payload, key version, granted scopes, connection state, timestamps.
- publish_jobs: submission/release ID, owner, provider, target app ID, requested track/channel, status, provider operation ID, safe error code/message, timestamps.
- publish_job_events: append-only audit events, actor, status transition, safe metadata, timestamp.

Use unique constraints to prevent duplicate active jobs for the same release/provider/target. Keep provider secrets out of event payloads.

## Delivery milestones

- M0 — connector-ready product page and documented constraints (completed in this branch).
- M1 — schema, encrypted credential vault, connection lifecycle, and audit trail.
- M2 — Google Play sandbox/internal-track workflow with an owner-authorized test app.
- M3 — Huawei test submission workflow with an owner-authorized test app.
- M4 — Apple metadata/review integration plus a separately secured Transporter upload runner.
- M5 — provider-by-provider operational monitoring, retries, revocation, and user acceptance tests.

## Launch gate

Do not label a connector available until a real authorized developer account has connected, a harmless test release has passed the complete upload/submission/status flow, and credentials can be revoked and deleted. Store-specific review and account eligibility remain outside MTA's control.