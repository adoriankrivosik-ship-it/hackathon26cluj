import type { ProjectStatus } from "@/lib/projects";
import { STATUS_COLORS } from "@/lib/status-colors";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colors.badge} ${className}`}
    >
      {status}
    </span>
  );
}
