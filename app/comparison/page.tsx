import React from "react";
import { ComparisonView } from "@/components/comparison/comparison-view";

export default function ComparisonPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
          Empirical evaluation
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl text-foreground">
          Strategy Comparison
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Evaluating human reviewer efficiency under Fixed-Order (arrival order)
          review versus Adaptive AI-ranked review on the exact same synthetic
          dataset.
        </p>
      </div>

      <ComparisonView />
    </div>
  );
}
