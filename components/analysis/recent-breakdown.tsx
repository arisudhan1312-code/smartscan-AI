"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/badge";
import { featureKeys, featureLabels } from "@/lib/signals/engine";
import { FeatureKey } from "@/lib/signals/types";

const featureColors: Record<FeatureKey, string> = {
  strength: "var(--primary)",
  variation: "var(--medium)",
  uncertainty: "var(--low)",
  frequency: "var(--high)",
};

export function RecentBreakdown() {
  const { samples, select } = useSimulation();
  const recent = samples.slice(-10).reverse();

  return (
    <SectionCard
      title="Latest analysis"
      description="How each feature contributed to the score of the 10 most recent simulated samples."
    >
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {featureKeys.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm"
              style={{ background: featureColors[k] }}
              aria-hidden="true"
            />
            {featureLabels[k]}
          </span>
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {recent.map((sample) => (
          <li key={sample.id} className="animate-in fade-in">
            <button
              type="button"
              onClick={() => select(sample.id)}
              className="grid w-full grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[5.5rem_1fr_3rem_5.5rem] cursor-pointer"
            >
              <span className="font-mono text-sm font-medium text-foreground">
                {sample.id}
              </span>
              <span
                className="flex h-3 overflow-hidden rounded-full bg-muted"
                aria-label={`Score ${sample.score} out of 100`}
              >
                {sample.features.map((f) => (
                  <span
                    key={f.key}
                    style={{
                      width: `${f.points}%`,
                      background: featureColors[f.key],
                    }}
                    title={`${f.label}: ${f.points.toFixed(1)} pts`}
                  />
                ))}
              </span>
              <span className="hidden text-right font-mono text-sm tabular-nums text-foreground sm:block">
                {sample.score.toFixed(1)}
              </span>
              <PriorityBadge
                priority={sample.priority}
                className="justify-self-end"
              />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
