"use client";

import { useEffect, useState } from "react";
import { scoreToColor } from "@/lib/score-colors";

interface ScoreBarProps {
  label: string;
  value: number;
  /** When true, animates the bar from 0 to value (~400ms). */
  animate: boolean;
}

/**
 * Horizontal score bar with grow animation on panel open.
 */
export function ScoreBar({ label, value, animate }: ScoreBarProps) {
  const [width, setWidth] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setWidth(value);
      return;
    }
    setWidth(0);
    const frame = requestAnimationFrame(() => {
      setWidth(value);
    });
    return () => cancelAnimationFrame(frame);
  }, [animate, value]);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="tabular-nums font-medium text-gray-900">{value}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${value} din 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[400ms] ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: scoreToColor(value),
          }}
        />
      </div>
    </div>
  );
}
