import "server-only";

import type { DbProject } from "./admin-types";
import { getDatabase } from "./get-database-edge";
import { mapToPublicProject } from "./map-public-project";
import type { PublicProject } from "./projects";

/** Load projects for edge routes (homepage, public API). */
export async function loadProjects(): Promise<PublicProject[]> {
  const db = await getDatabase();
  const { results } = await db
    .prepare("SELECT * FROM projects ORDER BY name ASC")
    .all<DbProject>();

  return (results ?? []).map(mapToPublicProject);
}
