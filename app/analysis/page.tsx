import React from "react";
import { WeightsPanel } from "@/components/analysis/weights-panel";
import { FeatureScatter } from "@/components/analysis/feature-scatter";
import { RecentBreakdown } from "@/components/analysis/recent-breakdown";
import { BandOccupancy } from "@/components/analysis/band-occupancy";

export default function AnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
          Engine inspection
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl text-foreground">
          Signal Analysis
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Scoring engine breakdown, live weight controls and feature
          distributions across simulated bands. Adjust weights to see how priority
          scores react immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <WeightsPanel />
        <div className="xl:col-span-2">
          <FeatureScatter />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentBreakdown />
        </div>
        <BandOccupancy />
      </div>
    </div>
  );
}
