/**
 * Creates ./.dev.db and applies SQL migrations (dev substitute for Wrangler local D1).
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dbPath = path.join(root, ".dev.db");
const migrationsDir = path.join(root, "migrations");

const files = ["0001_projects.sql", "0002_seed_projects.sql"];

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  db.exec(sql);
  console.log(`Applied ${file}`);
}

db.close();
console.log(`Created ${dbPath} with seed data.`);
