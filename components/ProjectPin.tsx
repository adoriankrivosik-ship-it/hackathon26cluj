import type { PublicProject } from "@/lib/projects";
import { STATUS_COLORS } from "@/lib/status-colors";

interface ProjectPinProps {
  project: PublicProject;
  isSelected: boolean;
  isVisible: boolean;
  onSelect: (project: PublicProject) => void;
}

export function ProjectPin({
  project,
  isSelected,
  isVisible,
  onSelect,
}: ProjectPinProps) {
  const colors = STATUS_COLORS[project.status];

  return (
    <button
      type="button"
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none transition-all duration-panel ease-out ${
        isVisible
          ? "pointer-events-auto cursor-pointer opacity-100 scale-100 hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          : "pointer-events-none cursor-default opacity-0 scale-50"
      }`}
      aria-label={`${project.title}, status: ${project.status}${project.isDelayed ? ", întârziat" : ""}`}
      aria-pressed={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project);
      }}
    >
      {project.isDelayed && (
        <span
          className="absolute inset-0 rounded-full ring-[3px] ring-red-500 ring-offset-1 ring-offset-white/80"
          aria-hidden="true"
        />
      )}
      <span
        className={`relative flex h-7 w-7 items-center justify-center rounded-full shadow-pin transition-transform duration-200 ${
          isSelected ? "scale-110 ring-2 ring-white" : ""
        }`}
        style={{
          backgroundColor: colors.fill,
          boxShadow: isSelected
            ? `0 0 0 3px ${colors.ring}, 0 2px 8px rgba(0,0,0,0.25)`
            : undefined,
        }}
        aria-hidden="true"
      >
        {project.isDelayed && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </span>
    </button>
  );
}
