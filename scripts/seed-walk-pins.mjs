/**
 * Inserts demo walk_pins into .dev.db (run after migrations via db:setup).
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", ".dev.db");

const COUNT_CAPS = {
  education: 6,
  health: 8,
  commercial: 8,
  culture: 5,
  transport: 12,
  parks: 5,
  sport: 5,
};

function scoreFromCount(count, cap) {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((count / cap) * 100));
}

function overallFromScores(scores) {
  const keys = Object.keys(COUNT_CAPS);
  const sum = keys.reduce((acc, k) => acc + scores[k], 0);
  return Math.round(sum / keys.length);
}

function hexRing(lng, lat, r = 0.011) {
  const coords = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * Math.PI;
    coords.push([lng + r * Math.cos(a), lat + r * 0.75 * Math.sin(a)]);
  }
  coords.push(coords[0]);
  return coords;
}

function isochrone(lng, lat) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [hexRing(lng, lat)] },
        properties: { contour: 15 },
      },
    ],
  };
}

/** [category, subcategory?, name, dLng, dLat] */
const seeds = [
  {
    id: "walk-centru",
    lng: 23.5889,
    lat: 46.7713,
    label: "Piața Unirii",
    amenityOffsets: [
      ["education", "school", "Școala Centrală", 0.002, 0.001],
      ["education", "kindergarten", "Grădiniță", 0.003, 0.002],
      ["education", "university", "Universitate", -0.002, 0.003],
      ["parks", null, "Parcul Central", -0.003, -0.002],
      ["parks", null, "Grădina Botanică", -0.004, -0.001],
      ["transport", null, "Stație autobuz", 0.001, -0.001],
      ["transport", null, "Stație tramvai", 0.002, -0.002],
      ["transport", null, "Platformă", 0.0015, -0.0015],
      ["commercial", "supermarket", "Supermarket", -0.001, 0.002],
      ["commercial", "convenience", "Magazin", 0.001, 0.001],
      ["health", "pharmacy", "Farmacie", 0.002, -0.002],
      ["health", "clinic_doctors", "Clinică", -0.001, -0.002],
      ["culture", "theatre", "Teatru", -0.002, 0.001],
      ["culture", "museum", "Muzeu", -0.0025, 0.0015],
      ["culture", "library", "Bibliotecă", 0.002, 0.002],
      ["sport", "fitness_centre", "Sală fitness", 0.003, -0.001],
      ["sport", "sports_centre", "Polivalentă", -0.002, 0.002],
    ],
  },
  {
    id: "walk-manastur",
    lng: 23.555,
    lat: 46.762,
    label: "Mănăștur",
    amenityOffsets: [
      ["transport", null, "Stație tramvai", 0.002, 0],
      ["transport", null, "Stație autobuz", 0.001, 0.001],
      ["commercial", "convenience", "Magazin alimentar", -0.002, 0.001],
      ["commercial", "supermarket", "Supermarket", -0.003, 0.002],
      ["education", "school", "Liceu", 0.001, -0.002],
      ["education", "kindergarten", "Grădiniță", 0.002, -0.001],
      ["health", "pharmacy", "Farmacie", -0.001, 0.002],
      ["parks", null, "Parc mic", 0.002, 0.002],
      ["sport", "pitch", "Teren sport", 0.003, 0.001],
    ],
  },
  {
    id: "walk-iris",
    lng: 23.638,
    lat: 46.782,
    label: "Iris",
    amenityOffsets: [
      ["transport", null, "Stație autobuz", 0.001, 0.001],
      ["transport", null, "Stație", -0.001, 0.002],
      ["commercial", "convenience", "Magazin", -0.001, -0.001],
      ["commercial", "convenience", "Magazin 2", 0.002, -0.001],
      ["education", "school", "Școală", 0.001, -0.002],
      ["health", "pharmacy", "Farmacie", -0.002, 0.001],
      ["parks", null, "Spațiu verde", 0.002, 0.002],
    ],
  },
  {
    id: "walk-gheorgheni",
    lng: 23.615,
    lat: 46.752,
    label: "Gheorgheni",
    amenityOffsets: [
      ["parks", null, "Parc Gheorgheni", 0.002, 0.002],
      ["parks", null, "Parc mic", -0.001, 0.003],
      ["transport", null, "Stație", -0.001, 0.001],
      ["transport", null, "Tramvai", 0.002, 0],
      ["commercial", "supermarket", "Supermarket", 0.002, -0.001],
      ["commercial", "convenience", "Magazin", -0.001, -0.002],
      ["health", "clinic_doctors", "Clinică", -0.002, -0.001],
      ["health", "pharmacy", "Farmacie", 0.001, -0.002],
      ["education", "school", "Școală", 0.002, 0.001],
      ["education", "kindergarten", "Grădiniță", -0.002, 0.002],
      ["sport", "fitness_centre", "Fitness", 0.003, 0.001],
      ["culture", "library", "Bibliotecă", -0.002, 0.001],
    ],
  },
];

const db = new Database(dbPath);
const createdAt = new Date().toISOString();

const insert = db.prepare(`
  INSERT OR REPLACE INTO walk_pins (
    id, lng, lat, isochrone_geojson, amenities_json, scores_json,
    overall_score, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of seeds) {
  const amenities = s.amenityOffsets.map(
    ([category, subcategory, name, dLng, dLat]) => ({
      category,
      ...(subcategory ? { subcategory } : {}),
      name,
      lng: s.lng + dLng,
      lat: s.lat + dLat,
    }),
  );

  const counts = Object.fromEntries(
    Object.keys(COUNT_CAPS).map((k) => [
      k,
      amenities.filter((a) => a.category === k).length,
    ]),
  );

  const scores = Object.fromEntries(
    Object.entries(COUNT_CAPS).map(([k, cap]) => [
      k,
      scoreFromCount(counts[k], cap),
    ]),
  );

  const overall = overallFromScores(scores);

  insert.run(
    s.id,
    s.lng,
    s.lat,
    JSON.stringify(isochrone(s.lng, s.lat)),
    JSON.stringify(amenities),
    JSON.stringify(scores),
    overall,
    createdAt,
  );
  console.log(`Seeded walk pin: ${s.label} (overall ${overall})`, scores);
}

db.close();
