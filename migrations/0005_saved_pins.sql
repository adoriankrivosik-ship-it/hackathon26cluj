CREATE TABLE IF NOT EXISTS saved_pins (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  label TEXT,
  overall_score INTEGER,
  scores_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_pins_user_email ON saved_pins(user_email);
