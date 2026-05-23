import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/projects";
import { STATUS_COLORS } from "@/lib/status-colors";

interface StatusTimelineProps {
  currentStatus: ProjectStatus;
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = PROJECT_STATUSES.indexOf(currentStatus);

  return (
    <nav aria-label="Etape proiect">
      <ol className="relative flex flex-col gap-0">
        {PROJECT_STATUSES.map((stage, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const colors = STATUS_COLORS[stage];

          return (
            <li key={stage} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-3 w-3 shrink-0 rounded-full border-2 transition-colors duration-200 ${
                    isCurrent
                      ? "scale-125 border-primary bg-primary shadow-sm"
                      : isPast
                        ? "border-primary bg-primary/70"
                        : "border-gray-300 bg-white"
                  }`}
                  style={
                    isCurrent
                      ? { boxShadow: `0 0 0 3px ${colors.fill}33` }
                      : undefined
                  }
                  aria-hidden="true"
                />
                {index < PROJECT_STATUSES.length - 1 && (
                  <span
                    className={`mt-1 w-0.5 flex-1 min-h-[1.25rem] ${
                      isPast ? "bg-primary/50" : "bg-gray-200"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="-mt-0.5 min-w-0 flex-1">
                <p
                  className={`text-sm leading-tight ${
                    isCurrent
                      ? "font-semibold text-primary"
                      : isPast
                        ? "font-medium text-gray-600"
                        : "text-gray-400"
                  }`}
                >
                  {stage}
                  {isCurrent && (
                    <span className="sr-only"> (etapa curentă)</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
