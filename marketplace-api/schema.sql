PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  app_name TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL,
  license_name TEXT NOT NULL,
  source_url TEXT,
  description TEXT NOT NULL,
  authorization_confirmed INTEGER NOT NULL CHECK (authorization_confirmed = 1),
  file_name TEXT,
  file_size INTEGER,
  object_key TEXT,
  multipart_upload_id TEXT,
  multipart_key TEXT,
  multipart_token TEXT,
  multipart_parts TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','pending_review','approved','rejected','removed')),
  reviewer_email TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_owner ON submissions(owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status, created_at DESC);


-- MTA ONE-PUBLISH: provider credentials are encrypted by the API before storage.
-- Never write plaintext OAuth tokens, API keys, or private keys to these columns.
CREATE TABLE IF NOT EXISTS store_connections (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_play','apple_app_store','huawei_appgallery')),
  provider_account_id TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  key_version TEXT NOT NULL,
  granted_scopes TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','reauth_required')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(owner_email, provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS publish_jobs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  connection_id TEXT NOT NULL REFERENCES store_connections(id),
  provider TEXT NOT NULL CHECK (provider IN ('google_play','apple_app_store','huawei_appgallery')),
  target_app_id TEXT NOT NULL,
  release_channel TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','uploading','submitted','in_review','approved','rejected','published','failed','cancelled')),
  provider_operation_id TEXT,
  safe_error_code TEXT,
  safe_error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publish_jobs_active_target
ON publish_jobs(submission_id, provider, target_app_id)
WHERE status IN ('draft','ready','uploading','submitted','in_review');

CREATE INDEX IF NOT EXISTS idx_publish_jobs_owner
ON publish_jobs(owner_email, created_at DESC);

CREATE TABLE IF NOT EXISTS publish_job_events (
  id TEXT PRIMARY KEY,
  publish_job_id TEXT NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE,
  actor_email TEXT,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  safe_metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_publish_job_events_job
ON publish_job_events(publish_job_id, created_at ASC);


-- Review workflow: revision requests keep the release in quarantine until resubmitted.
-- The reviewer note is shown to the developer; private moderation notes must not be stored here.
ALTER TABLE submissions ADD COLUMN revision_requested_at TEXT;
ALTER TABLE submissions ADD COLUMN rights_checked_at TEXT;
ALTER TABLE submissions ADD COLUMN malware_scan_reference TEXT;

CREATE TABLE IF NOT EXISTS certificate_requests (
  id TEXT PRIMARY KEY,
  applicant_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  public_display_name TEXT NOT NULL,
  organization TEXT,
  portfolio_url TEXT,
  evidence_url TEXT,
  requested_category TEXT NOT NULL DEFAULT 'developer',
  statement TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','more_info','issued')),
  reviewer_email TEXT,
  reviewer_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_status ON certificate_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_owner ON certificate_requests(applicant_email,created_at DESC);

CREATE TABLE IF NOT EXISTS certificate_serial_counter (
  id INTEGER PRIMARY KEY CHECK(id=1),
  last_value INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO certificate_serial_counter(id,last_value) VALUES(1,0);

CREATE TABLE IF NOT EXISTS issued_certificates (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES certificate_requests(id),
  serial_number TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','revoked','expired')),
  signature TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL DEFAULT 'HMAC-SHA256',
  signer_key_version TEXT NOT NULL,
  issuer_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_status ON issued_certificates(status,expires_at);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_serial ON issued_certificates(serial_number);

CREATE TABLE IF NOT EXISTS certificate_events (
  id TEXT PRIMARY KEY,
  certificate_id TEXT NOT NULL REFERENCES issued_certificates(id),
  actor_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
