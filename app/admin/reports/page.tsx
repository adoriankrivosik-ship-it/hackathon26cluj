import { ReportsList } from "@/components/admin/ReportsList";
import { listIssueReports } from "@/lib/db";

export default async function AdminReportsPage() {
  const reports = await listIssueReports();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#0D1B2A]">Sesizări cetățeni</h1>
      <ReportsList reports={reports} />
    </div>
  );
}
