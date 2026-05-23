CREATE TABLE IF NOT EXISTS walk_pins (
  id TEXT PRIMARY KEY,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  isochrone_geojson TEXT NOT NULL,
  amenities_json TEXT NOT NULL,
  scores_json TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
