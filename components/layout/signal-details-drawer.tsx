"use client";

import React, { useEffect, useRef } from "react";
import { useSimulation } from "@/lib/simulation-context";
import { PriorityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFrequency, formatDbm, formatCycle } from "@/lib/utils";
import { thresholds } from "@/lib/signals/engine";
import { X, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

export function SignalDetailsDrawer() {
  const { selected, select, rankById, stats, markReviewed } = useSimulation();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isOpen = selected !== null;

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, select]);

  if (!selected) return null;

  const rank = rankById.get(selected.id) ?? 0;

  const uncertaintyInfo =
    selected.uncertainty >= thresholds.uncertainty
      ? {
          label: "High uncertainty",
          text: "The simulated measurement is unreliable. Treat any conclusion as tentative and consider re-capturing the sample.",
        }
      : selected.uncertainty >= 0.35
      ? {
          label: "Moderate uncertainty",
          text: "The reading is usable but should be cross-checked against neighbouring samples before acting on it.",
        }
      : {
          label: "Low uncertainty",
          text: "The simulated measurement is consistent. Its features can be interpreted with reasonable confidence.",
        };

  const featureRows = [
    ["Simulated frequency", formatFrequency(selected.frequencyMHz)],
    [
      "Nearest expected band",
      selected.bandDistanceMHz === 0
        ? `${selected.nearestBand} (in band)`
        : `${selected.nearestBand} (+${selected.bandDistanceMHz} MHz)`,
    ],
    ["Signal strength", formatDbm(selected.strengthDbm)],
    [
      "Pattern variation",
      `${selected.patternVariation.toFixed(2)} (${selected.patternStatus})`,
    ],
    ["Uncertainty", selected.uncertainty.toFixed(2)],
    ["Received at", formatCycle(selected.cycle)],
    [
      "Generator label",
      selected.generatorLabel === "unusual"
        ? "Injected unusual traits"
        : "Background",
    ],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close details"
        tabIndex={-1}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm transition-opacity"
        onClick={() => select(null)}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signal-details-title"
        className="relative flex h-full w-full max-w-lg flex-col border-l border-border bg-popover shadow-2xl duration-200 animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs tracking-widest text-primary uppercase">
              Simulated sample
            </p>
            <h2
              id="signal-details-title"
              className="font-mono text-xl font-semibold text-foreground"
            >
              {selected.id}
            </h2>
          </div>
          <Button
            ref={closeBtnRef}
            variant="ghost"
            size="icon"
            onClick={() => select(null)}
            aria-label="Close details"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={selected.priority} />
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-foreground font-medium">
              {selected.classification}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              Queue position #{rank} of {stats.total}
            </span>
          </div>

          {/* Combined Score */}
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Priority Score</span>
              <span className="font-mono text-lg font-bold text-foreground">
                {selected.score.toFixed(1)} / 100
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, selected.score)}%` }}
              />
            </div>
          </div>

          {/* Recommended Next Step Box */}
          <div className="flex flex-col gap-2.5 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Lightbulb className="size-4 shrink-0" aria-hidden="true" />
              <span>Recommended analyst action</span>
            </div>
            <p className="font-medium text-foreground">
              {selected.recommendedAction}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selected.nextStep}
            </p>
          </div>

          {/* Flag Reasons (if any) */}
          {selected.flagReasons.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-medium/30 bg-medium/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-medium">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                <span>Why this was flagged</span>
              </div>
              <ul className="list-disc pl-5 text-xs leading-relaxed text-foreground flex flex-col gap-1">
                {selected.flagReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Feature Breakdown Table */}
          <div className="flex flex-col gap-3">
            <h3 className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Scoring breakdown
            </h3>
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
              {selected.features.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between p-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {f.label}
                    </span>
                    <span className="text-muted-foreground">{f.rawDisplay}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 font-mono">
                    <span className="font-semibold text-foreground">
                      +{f.points.toFixed(1)} pts
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {(f.weightShare * 100).toFixed(0)}% weight
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Parameters Table */}
          <div className="flex flex-col gap-3">
            <h3 className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Signal parameters
            </h3>
            <dl className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {featureRows.map(([label, val]) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 text-xs"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-foreground font-medium">
                    {val}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Uncertainty notice */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground block mb-1">
              {uncertaintyInfo.label}
            </strong>
            {uncertaintyInfo.text}
          </div>

          {/* Review Action */}
          <div className="mt-2 pt-4 border-t border-border flex justify-end">
            <Button
              onClick={() => {
                markReviewed(selected.id);
                select(null);
              }}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Mark as reviewed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
