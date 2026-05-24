"use client";

export type ImportPhase =
  | "idle"
  | "fetch"
  | "analyze"
  | "finalize"
  | "done"
  | "error";

const PHASES: { id: ImportPhase; label: string }[] = [
  { id: "fetch", label: "Descărcare pagină / document" },
  { id: "analyze", label: "Analiză AI" },
  { id: "finalize", label: "Pregătire formulare" },
];

interface ImportProgressProps {
  phase: ImportPhase;
  progress: number;
  message?: string;
}

export function ImportProgress({
  phase,
  progress,
  message,
}: ImportProgressProps) {
  if (phase === "idle") return null;

  const activeIndex = PHASES.findIndex((p) => p.id === phase);

  return (
    <div
      className="mb-6 rounded-xl border border-[#F0A500]/30 bg-white p-5 shadow-sm"
      role="status"
      aria-live="polite"
      aria-busy={phase !== "done" && phase !== "error"}
    >
      <div className="mb-3 flex items-center gap-3">
        {phase !== "done" && phase !== "error" && (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#F0A500] border-t-transparent" />
        )}
        <p className="font-semibold text-[#0D1B2A]">
          {phase === "done"
            ? "Extragere finalizată"
            : phase === "error"
              ? "Extragere eșuată"
              : "Extragere în curs…"}
        </p>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#F0A500] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <ul className="space-y-2 text-sm">
        {PHASES.map((step, index) => {
          const done =
            phase === "done" ||
            (activeIndex >= 0 && index < activeIndex) ||
            (phase === "finalize" && index < 2);
          const active = step.id === phase;

          return (
            <li
              key={step.id}
              className={`flex items-center gap-2 ${
                done
                  ? "text-green-700"
                  : active
                    ? "font-medium text-[#0D1B2A]"
                    : "text-gray-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-green-100"
                    : active
                      ? "bg-[#F0A500]/20 text-[#0D1B2A]"
                      : "bg-gray-100"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              {step.label}
            </li>
          );
        })}
      </ul>

      {message && (
        <p
          className={`mt-3 text-sm ${
            phase === "error" ? "text-red-600" : "text-gray-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
