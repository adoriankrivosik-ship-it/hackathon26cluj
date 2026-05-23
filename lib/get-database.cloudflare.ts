import "server-only";

import { getRequestContext } from "@cloudflare/next-on-pages";

/** D1 binding on Cloudflare Pages (production). */
export function getCloudflareDatabase(): D1Database {
  return getRequestContext().env.DB;
}
