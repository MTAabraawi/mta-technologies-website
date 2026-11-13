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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','pending_review','approved','rejected','removed')),
  reviewer_email TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_owner ON submissions(owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status, created_at DESC);
