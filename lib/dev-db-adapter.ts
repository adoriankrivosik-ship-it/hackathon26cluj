import "server-only";

import Database from "better-sqlite3";
import path from "path";

const DEV_DB_PATH = path.join(process.cwd(), ".dev.db");

let sqlite: Database.Database | null = null;

function getSqlite(): Database.Database {
  if (!sqlite) {
    sqlite = new Database(DEV_DB_PATH);
  }
  return sqlite;
}

type Stmt = Database.Statement;

function stmtRunner(stmt: Stmt, args: unknown[]) {
  return {
    all: async <T>() => ({
      results: stmt.all(...args) as T[],
      success: true as const,
    }),
    first: async <T>() => (stmt.get(...args) as T | undefined) ?? null,
        run: async () => {
          const info = stmt.run(...args);
          return {
            success: true as const,
            meta: { changes: info.changes },
          };
        },
  };
}

/** Minimal D1-shaped adapter over better-sqlite3 for local `npm run dev`. */
export function createSqliteD1Adapter(): D1Database {
  const db = getSqlite();

  return {
    prepare(query: string) {
      const stmt = db.prepare(query);
      return {
        bind: (...values: unknown[]) => stmtRunner(stmt, values),
        all: async <T>() => ({
          results: stmt.all() as T[],
          success: true as const,
        }),
        first: async <T>() => (stmt.get() as T | undefined) ?? null,
        run: async () => {
          const info = stmt.run();
          return {
            success: true as const,
            meta: { changes: info.changes },
          };
        },
      };
    },
  } as unknown as D1Database;
}
