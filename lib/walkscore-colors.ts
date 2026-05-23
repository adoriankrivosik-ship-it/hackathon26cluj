/** Client-safe score → color (no server-only). */
export function scoreToColor(score: number): string {
  if (score < 40) return "#ef4444";
  if (score < 60) return "#f59e0b";
  if (score < 80) return "#86efac";
  return "#22c55e";
}
