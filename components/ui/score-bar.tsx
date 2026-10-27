import React from "react";
import { cn } from "@/lib/utils";

export function ScoreBar({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const color =
    score >= 55 ? "bg-high" : score >= 35 ? "bg-medium" : "bg-low";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-10 text-right font-mono text-sm tabular-nums">
        {score.toFixed(1)}
      </span>
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}
