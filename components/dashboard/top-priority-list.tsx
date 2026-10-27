"use client";

import React from "react";
import Link from "next/link";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { formatFrequency } from "@/lib/utils";

export function TopPriorityList() {
  const { ranked, select } = useSimulation();

  const topUnreviewed = ranked
    .filter((s) => s.classification !== "Reviewed")
    .slice(0, 5);

  return (
    <SectionCard
      title="Review next"
      description="Top unreviewed samples in the adaptive priority queue."
      action={
        <Link
          href="/queue"
          className="text-xs font-medium text-primary hover:underline"
        >
          Full queue
        </Link>
      }
    >
      <ul className="flex flex-col divide-y divide-border">
        {topUnreviewed.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              onClick={() => select(sample.id)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <span className="flex flex-col">
                <span className="font-mono text-sm font-medium text-foreground">
                  {sample.id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFrequency(sample.frequencyMHz)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <ScoreBar score={sample.score} className="hidden sm:flex" />
                <PriorityBadge priority={sample.priority} />
              </span>
            </button>
          </li>
        ))}
        {topUnreviewed.length === 0 && (
          <li className="py-4 text-center text-sm text-muted-foreground">
            All samples reviewed.
          </li>
        )}
      </ul>
    </SectionCard>
  );
}
