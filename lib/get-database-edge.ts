import "server-only";

import { createMockD1Database } from "./mock-d1";

function isCloudflarePagesRuntime(): boolean {
  return process.env.CF_PAGES === "1";
}

/** D1 binding for edge routes (map, walkscore API, saved pins). */
export async function getDatabase(): Promise<D1Database> {
  if (isCloudflarePagesRuntime()) {
    const { getCloudflareDatabase } = await import("./get-database.cloudflare");
    return getCloudflareDatabase();
  }

  return createMockD1Database();
}
