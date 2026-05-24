import Link from "next/link";
import { ImportProjects } from "@/components/admin/ImportProjects";

export default function ImportProjectsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/projects"
          className="text-sm text-gray-500 hover:text-[#0D1B2A]"
        >
          ← Proiecte
        </Link>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Import AI</h1>
      </div>
      <ImportProjects />
    </div>
  );
}
