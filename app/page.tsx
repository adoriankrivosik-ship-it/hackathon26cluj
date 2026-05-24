import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { MapView } from "@/components/MapView";
import { loadProjects } from "@/lib/public-projects";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function HomePage() {
  const projects = await loadProjects();

  return (
    <MapErrorBoundary>
      <MapView projects={projects} />
    </MapErrorBoundary>
  );
}
