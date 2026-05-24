import { STATUS_PILL_CLASSES, statusLabel } from "@/lib/admin-mappings";
import type { ProjectStatusDb } from "@/lib/admin-types";

export function StatusPill({ status }: { status: string }) {
  const key = status as ProjectStatusDb;
  const classes =
    STATUS_PILL_CLASSES[key] ?? "bg-gray-200 text-gray-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {statusLabel(status)}
    </span>
  );
}
