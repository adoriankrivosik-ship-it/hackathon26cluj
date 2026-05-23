-- Projects table for public infrastructure map pins
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  budget INTEGER NOT NULL,
  funding_source TEXT NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  start_date TEXT NOT NULL,
  planned_end_date TEXT NOT NULL,
  progress_percent INTEGER NOT NULL,
  is_delayed INTEGER NOT NULL DEFAULT 0
);
