CREATE TABLE IF NOT EXISTS citizen_profiles (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  answers_json TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_citizen_profiles_user_email ON citizen_profiles(user_email);
