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
  "0001_projects.sql",
  "0002_seed_projects.sql",
  "0003_walkscore.sql",
];

const db = new Database(dbPath);

const projectCount = db
  .prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='projects'")
  .get()?.c;

if (!projectCount) {
  for (const file of ["0001_projects.sql", "0002_seed_projects.sql"]) {
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

db.close();

execSync("node scripts/seed-walk-pins.mjs", { stdio: "inherit", cwd: root });
console.log(`Dev database ready at ${dbPath}`);
