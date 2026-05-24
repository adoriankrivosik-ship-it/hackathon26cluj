import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { getSession, isAdminRole } from "@/lib/auth";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F5F7FA]">
        <AdminSidebar user={session} />
        <main className="min-h-screen pb-20 md:ml-64 md:pb-0">
          <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
