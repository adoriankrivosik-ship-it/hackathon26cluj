-- Civic transparency schema: projects, audit ledger, issues, subscriptions, notifications

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description_original TEXT,
  description_plain TEXT,
  status TEXT NOT NULL,
  -- status: planned | procurement | starting | continuing | finalizing | delayed | completed
  category TEXT,
  -- category: mobility | education | green | social | cultural | energy | housing | waste
  budget_ron INTEGER,
  budget_source TEXT,
  -- budget_source: local | european | national | mixed
  responsible_institution TEXT,
  location_lat REAL,
  location_lng REAL,
  address TEXT,
  district TEXT,
  start_date TEXT,
  end_date TEXT,
  source_url TEXT,
  source_type TEXT,
  -- source_type: pdf | webpage | manual
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id),
  action_type TEXT NOT NULL,
  -- action_type: project_created | status_updated | field_updated | issue_submitted | issue_resolved
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  changed_by_role TEXT,
  -- changed_by_role: citizen | civil_servant
  note TEXT,
  previous_hash TEXT,
  entry_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location_lat REAL,
  location_lng REAL,
  address TEXT,
  status TEXT,
  -- status: open | in_progress | resolved
  submitted_by TEXT,
  submitted_at TEXT,
  photo_url TEXT,
  resolved_at TEXT,
  resolution_note TEXT
);

CREATE TABLE IF NOT EXISTS project_subscriptions (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT
);
