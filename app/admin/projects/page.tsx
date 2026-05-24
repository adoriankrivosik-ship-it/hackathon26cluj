import { ProjectsTable } from "@/components/admin/ProjectsTable";
import { listProjects } from "@/lib/db";

export default async function AdminProjectsPage() {
  const projects = await listProjects();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#0D1B2A]">Proiecte</h1>
      <ProjectsTable projects={projects} />
    </div>
  );
}
