import type { ProjectStatus } from "./projects";

export const STATUS_COLORS: Record<
  ProjectStatus,
  { fill: string; ring: string; badge: string; text: string }
> = {
  Inițiat: {
    fill: "#6b7280",
    ring: "#9ca3af",
    badge: "bg-gray-100 text-gray-800 ring-gray-300",
    text: "text-gray-700",
  },
  Aprobat: {
    fill: "#3b82f6",
    ring: "#60a5fa",
    badge: "bg-blue-50 text-blue-800 ring-blue-200",
    text: "text-blue-700",
  },
  Bugetat: {
    fill: "#6366f1",
    ring: "#818cf8",
    badge: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    text: "text-indigo-700",
  },
  "În lucru": {
    fill: "#f59e0b",
    ring: "#fbbf24",
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    text: "text-amber-800",
  },
  Finalizat: {
    fill: "#22c55e",
    ring: "#4ade80",
    badge: "bg-green-50 text-green-800 ring-green-200",
    text: "text-green-700",
  },
};
