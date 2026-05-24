import type { Metadata } from "next";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { MapView } from "@/components/MapView";
import { getSession, isCitizenRole } from "@/lib/auth";
import { loadProjects } from "@/lib/public-projects";

export const metadata: Metadata = {
  title: "Hartă Proiecte Publice — Cluj-Napoca",
  description:
    "Platformă de transparență civică pentru proiectele de infrastructură publică din Cluj-Napoca.",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const projects = await loadProjects();
  const session = await getSession();
  const citizenUser =
    session && isCitizenRole(session.role)
      ? { email: session.email, name: session.name }
      : null;

  return (
    <MapErrorBoundary>
      <MapView projects={projects} citizenUser={citizenUser} />
    </MapErrorBoundary>
  );
}
