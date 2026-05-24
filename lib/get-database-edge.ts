import "server-only";

function isCloudflarePagesRuntime(): boolean {
  return process.env.CF_PAGES === "1";
}

/** D1 binding for edge routes (map, walkscore API). */
export async function getDatabase(): Promise<D1Database> {
  if (isCloudflarePagesRuntime()) {
    const { getCloudflareDatabase } = await import("./get-database.cloudflare");
    return getCloudflareDatabase();
  }

  const { createSqliteD1Adapter } = await import("./dev-db-adapter");
  return createSqliteD1Adapter();
}
