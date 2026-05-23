"use client";

export function WalkModeHint() {
  return (
    <div
      className="pointer-events-auto rounded-xl bg-white/95 px-3 py-2.5 shadow-md ring-1 ring-gray-200/80 backdrop-blur-sm"
      role="region"
      aria-label="Instrucțiuni mod scor"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Scor 15 minute
      </p>
      <p className="mt-1 text-xs text-gray-700">
        Apasă pe hartă pentru a plasa un pin și a calcula accesibilitatea pe jos.
      </p>
      <p className="mt-2 text-[10px] text-gray-500">
        Demo: Piața Unirii, Mănăștur, Iris, Gheorgheni
      </p>
    </div>
  );
}
