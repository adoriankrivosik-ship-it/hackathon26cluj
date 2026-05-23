/** Map overall score (0–100) to a fill color for neighborhood polygons. */
export function scoreToColor(score: number): string {
  if (score < 40) return "#ef4444";
  if (score < 60) return "#f59e0b";
  if (score < 80) return "#86efac";
  return "#22c55e";
}

export const SCORE_LEGEND_STOPS = [
  { label: "0–40", color: "#ef4444" },
  { label: "40–60", color: "#f59e0b" },
  { label: "60–80", color: "#86efac" },
  { label: "80–100", color: "#22c55e" },
] as const;
