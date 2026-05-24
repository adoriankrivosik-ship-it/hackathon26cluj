/**
 * Creates or updates ./.dev.db and applies SQL migrations (dev substitute for Wrangler local D1).
 */
import Database from "better-sqlite3";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dbPath = path.join(root, ".dev.db");
const migrationsDir = path.join(root, "migrations");

const files = [
  "0001_schema.sql",
  "0002_seed_projects.sql",
  "0003_walkscore.sql",
];

const db = new Database(dbPath);

const projectCount = db
  .prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='projects'")
  .get()?.c;

if (!projectCount) {
  for (const file of ["0001_schema.sql", "0002_seed_projects.sql"]) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    console.log(`Applied ${file}`);
  }
} else {
  console.log("Projects tables already present — skipping project seed.");
}

const walkTable = db
  .prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='walk_pins'")
  .get()?.c;

if (!walkTable) {
  const sql = fs.readFileSync(
    path.join(migrationsDir, "0003_walkscore.sql"),
    "utf8",
  );
  db.exec(sql);
  console.log("Applied 0003_walkscore.sql");
}

const auditTable = db
  .prepare(
    "SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='audit_ledger'",
  )
  .get()?.c;

if (!auditTable) {
  const sql = fs.readFileSync(
    path.join(migrationsDir, "0004_ledger.sql"),
    "utf8",
  );
  db.exec(sql);
  console.log("Applied 0004_ledger.sql");
} else {
  const auditCount = db
    .prepare("SELECT COUNT(*) as c FROM audit_ledger")
    .get()?.c;
  if (!auditCount) {
    const seedOnly = fs
      .readFileSync(path.join(migrationsDir, "0004_ledger.sql"), "utf8")
      .split("-- Seed:")[1];
    if (seedOnly) {
      db.exec(seedOnly);
      console.log("Seeded audit_ledger");
    }
  }
}

const savedPinsTable = db
  .prepare(
    "SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='saved_pins'",
  )
  .get()?.c;

if (!savedPinsTable) {
  const sql = fs.readFileSync(
    path.join(migrationsDir, "0005_saved_pins.sql"),
    "utf8",
  );
  db.exec(sql);
  console.log("Applied 0005_saved_pins.sql");
}

const citizenProfilesTable = db
  .prepare(
    "SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='citizen_profiles'",
  )
  .get()?.c;

if (!citizenProfilesTable) {
  const sql = fs.readFileSync(
    path.join(migrationsDir, "0006_citizen_profiles.sql"),
    "utf8",
  );
  db.exec(sql);
  console.log("Applied 0006_citizen_profiles.sql");
}

const savedPinsProfileCol = db
  .prepare("PRAGMA table_info(saved_pins)")
  .all()
  .some((col) => col.name === "profile_name");

if (!savedPinsProfileCol) {
  const sql = fs.readFileSync(
    path.join(migrationsDir, "0007_saved_pins_profile.sql"),
    "utf8",
  );
  db.exec(sql);
  console.log("Applied 0007_saved_pins_profile.sql");
}

db.close();

execSync("node scripts/seed-walk-pins.mjs", { stdio: "inherit", cwd: root });
console.log(`Dev database ready at ${dbPath}`);
