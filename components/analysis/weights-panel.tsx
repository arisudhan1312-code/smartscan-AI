"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  defaultWeights,
  engineName,
  featureKeys,
  featureLabels,
  normalizeWeights,
  thresholds,
} from "@/lib/signals/engine";
import { RotateCcw } from "lucide-react";
import { FeatureKey } from "@/lib/signals/types";

const formulaDescriptions: Record<FeatureKey, string> = {
  strength: `(dBm − (${thresholds.strengthFloorDbm})) / ${thresholds.strengthCeilDbm - thresholds.strengthFloorDbm}`,
  variation: "variation (already 0–1)",
  uncertainty: "uncertainty (already 0–1)",
  frequency: `distance outside band / ${thresholds.bandDeviationScaleMHz} MHz`,
};

const flagConditions: Record<FeatureKey, string> = {
  strength: `≥ ${thresholds.strengthDbm} dBm`,
  variation: `≥ ${thresholds.variation}`,
  uncertainty: `≥ ${thresholds.uncertainty}`,
  frequency: `> ${thresholds.bandMarginMHz} MHz out of band`,
};

export function WeightsPanel() {
  const { weights, setWeights } = useSimulation();

  const normWeights = normalizeWeights(weights);
  const isDefault = featureKeys.every((k) => weights[k] === defaultWeights[k]);

  return (
    <SectionCard
      title="Scoring formula & weights"
      description={`${engineName}. Every number is visible and adjustable; no trained model is used in this prototype.`}
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeights(defaultWeights)}
          disabled={isDefault}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset
        </Button>
      }
    >
      <p className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground">
        score = 100 × Σ<sub>i</sub> (w<sub>i</sub> / Σw) × x<sub>i</sub>
        <span className="block text-muted-foreground mt-0.5">
          x = normalised feature (0–1), w = weight
        </span>
      </p>

      <ul className="flex flex-col gap-4">
        {featureKeys.map((key) => (
          <li key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <label htmlFor={`w-${key}`} className="font-medium text-foreground">
                {featureLabels[key]}
              </label>
              <span className="font-mono text-xs text-muted-foreground">
                w = {weights[key].toFixed(2)} · share{" "}
                {(100 * normWeights[key]).toFixed(0)}%
              </span>
            </div>
            <input
              id={`w-${key}`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={weights[key]}
              onChange={(e) =>
                setWeights({
                  ...weights,
                  [key]: Number(e.target.value),
                })
              }
              className="w-full accent-[var(--primary)] cursor-pointer"
            />
            <div className="flex flex-wrap justify-between gap-x-3 font-mono text-[11px] text-muted-foreground">
              <span>x = {formulaDescriptions[key]}</span>
              <span>flag {flagConditions[key]}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Changing a weight re-scores every sample instantly. Priority: High ≥{" "}
        {thresholds.highScore}, Medium ≥ {thresholds.mediumScore} or any flag rule
        fired, otherwise Low.
      </p>
    </SectionCard>
  );
}
