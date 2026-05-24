"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import type { SessionUser } from "@/lib/auth-session";

const NAV = [
  { href: "/admin", label: "Registru audit", icon: "📜" },
  { href: "/admin/projects", label: "Proiecte", icon: "📋" },
  { href: "/admin/projects/import", label: "Import", icon: "📥" },
  { href: "/admin/reports", label: "Sesizări", icon: "📢" },
];

const ROLE_LABEL: Record<string, string> = {
  civil_servant: "Funcționar public",
  admin: "Administrator",
};

interface AdminSidebarProps {
  user: SessionUser;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function NavLink({
    href,
    label,
    icon,
    mobile = false,
  }: {
    href: string;
    label: string;
    icon: string;
    mobile?: boolean;
  }) {
    const isActive =
      href === "/admin"
        ? pathname === "/admin"
        : href === "/admin/projects"
          ? pathname === "/admin/projects" ||
            (pathname.startsWith("/admin/projects/") &&
              !pathname.startsWith("/admin/projects/import"))
          : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#F0A500] text-[#0D1B2A]"
            : "text-white/90 hover:bg-white/10"
        } ${mobile ? "flex-col gap-0.5 px-2 py-1.5 text-[10px]" : ""}`}
      >
        <span className={mobile ? "text-base" : ""}>{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <>
      <aside className="hidden h-screen w-64 flex-shrink-0 flex-col bg-[#0D1B2A] md:fixed md:inset-y-0 md:left-0 md:flex">
        <div className="border-b border-white/10 p-5">
          <Logo light className="text-lg" />
          <p className="mt-1 text-xs text-white/50">Panou administrare</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <span className="mt-1 inline-block rounded bg-white/10 px-2 py-0.5 text-xs text-[#F0A500]">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
          >
            Ieșire
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/10 bg-[#0D1B2A] p-2 md:hidden">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} mobile />
        ))}
        <button
          type="button"
          onClick={logout}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] text-white/70"
        >
          <span className="text-base">🚪</span>
          Ieșire
        </button>
      </nav>
    </>
  );
}
