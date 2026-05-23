"use client";

import { useEffect, useState } from "react";

export interface SubcategoryBreakdown {
  label: string;
  count: number;
}

interface CategoryBarProps {
  label: string;
  count: number;
  score: number;
  color: string;
  animate: boolean;
  subcategories?: SubcategoryBreakdown[];
}

export function CategoryBar({
  label,
  count,
  score,
  color,
  animate,
  subcategories,
}: CategoryBarProps) {
  const [width, setWidth] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setWidth(score);
      return;
    }
    setWidth(0);
    const frame = requestAnimationFrame(() => setWidth(score));
    return () => cancelAnimationFrame(frame);
  }, [animate, score]);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-700">
          {label}{" "}
          <span className="text-gray-400">({count})</span>
        </span>
        <span className="tabular-nums font-medium text-gray-900">{score}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${score} din 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[400ms] ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {subcategories && subcategories.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-l-2 border-gray-100 pl-3" aria-label={`${label} — detaliu`}>
          {subcategories.map((sub) => (
            <li
              key={sub.label}
              className="flex justify-between text-xs text-gray-500"
            >
              <span>{sub.label}</span>
              <span className="tabular-nums text-gray-400">{sub.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
