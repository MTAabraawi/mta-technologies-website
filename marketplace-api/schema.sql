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
