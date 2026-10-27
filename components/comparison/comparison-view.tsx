"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSimulation } from "@/lib/simulation-context";
import { runBenchmarkComparison, DetailedComparisonResult } from "@/lib/signals/comparison";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Info, Sparkles } from "lucide-react";

export function ComparisonView() {
  const { raw, weights } = useSimulation();
  const [result, setResult] = useState<DetailedComparisonResult | null>(null);

  const executeComparison = useCallback(() => {
    setResult(runBenchmarkComparison(raw, weights, 200));
  }, [raw, weights]);

  useEffect(() => {
    executeComparison();
  }, [executeComparison]);

  const isStale = result !== null && result.sampleCount !== raw.length;

  if (!result) {
    return (
      <div
        className="h-64 animate-pulse rounded-xl border border-border bg-card/60"
        aria-label="Running comparison"
      />
    );
  }

  const { fixed, adaptive, window: windowSize, sampleCount, iterations, curve, flaggedOrder } = result;

  const positionDelta = fixed.flagged.avgPosition - adaptive.flagged.avgPosition;
  const timingRatio =
    fixed.timingMs > 0 ? adaptive.timingMs / fixed.timingMs : 0;

  const renderStrategyCard = (
    title: string,
    subtitle: string,
    m: typeof fixed,
    tone: string
  ) => {
    const rows = [
      [
        "Avg. position of flagged samples",
        m.flagged.count ? m.flagged.avgPosition.toFixed(1) : "—",
      ],
      [
        "Last flagged sample reviewed at",
        m.flagged.count ? `#${m.flagged.lastPosition}` : "—",
      ],
      [
        `Flagged found in first ${windowSize}`,
        `${m.flagged.foundInWindow} / ${m.flagged.count}`,
      ],
      [
        `Avg. position of injected unusual (${m.injected.count})`,
        m.injected.count ? m.injected.avgPosition.toFixed(1) : "—",
      ],
      [
        "Measured ordering time (avg)",
        `${m.timingMs.toFixed(3)} ms`,
      ],
    ];

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ background: tone }}
            aria-hidden="true"
          />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <dl className="flex flex-col divide-y divide-border">
          {rows.map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono tabular-nums text-foreground font-medium">
                {val}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Disclaimer / Info Banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Both methods use the <strong>same {sampleCount} simulated samples</strong>.
            Timing is measured with{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              performance.now()
            </code>{" "}
            averaged over {iterations} runs in your browser.
            {isStale && (
              <span className="text-medium font-semibold ml-1">
                The dataset has changed since this run.
              </span>
            )}
          </span>
        </p>
        <Button onClick={executeComparison} size="sm" className="shrink-0">
          Re-run on current dataset
        </Button>
      </div>

      {/* Side-by-side Strategy Metric Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderStrategyCard(
          "Fixed-order review",
          "Analyst reviews samples in the order they arrived (ID order). No scoring step.",
          fixed,
          "var(--muted-foreground)"
        )}
        {renderStrategyCard(
          "Adaptive-priority review",
          "Analyst reviews samples ranked by rule-based priority score, highest first.",
          adaptive,
          "var(--primary)"
        )}
      </div>

      {/* Honest What This Run Shows Section */}
      <div className="rounded-xl border border-border bg-card/80 p-5 text-sm leading-relaxed shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          What this run actually shows
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
          <li>
            Flagged samples reached the reviewer on average{" "}
            <strong className="text-foreground">
              {Math.abs(positionDelta).toFixed(1)} positions{" "}
              {positionDelta >= 0 ? "earlier" : "later"}
            </strong>{" "}
            with adaptive ordering. Because the engine both flags and ranks, this
            is expected by construction — it shows the queue works, not that the
            rules are correct.
          </li>
          <li>
            Generator-injected unusual samples are the simulation&apos;s ground truth.
            Their average position ({fixed.injected.avgPosition.toFixed(1)} fixed
            vs. {adaptive.injected.avgPosition.toFixed(1)} adaptive) is the fairer
            check of whether the scoring formula separates them.
          </li>
          <li>
            Adaptive ordering costs extra compute: it took{" "}
            <strong className="text-foreground">
              {timingRatio ? `${timingRatio.toFixed(1)}×` : "n/a"}
            </strong>{" "}
            the fixed-order time here ({fixed.timingMs.toFixed(3)} ms vs.{" "}
            {adaptive.timingMs.toFixed(3)} ms), because it scores and sorts every
            sample. Speed is not the benefit — earlier access to unusual samples is.
          </li>
          <li>
            Results are from synthetic data only and say nothing about real-world
            signal environments.
          </li>
        </ul>
      </div>

      {/* Cumulative Discovery Curve & Queue Position Table */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Cumulative flagged samples found"
          description="How many flagged samples the reviewer has seen after N reviews. Steeper is better."
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={curve}
                margin={{ top: 8, right: 12, left: -16, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="position"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Samples reviewed",
                    position: "insideBottom",
                    offset: -4,
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Flagged found",
                    angle: -90,
                    position: "insideLeft",
                    offset: 16,
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Line
                  type="monotone"
                  dataKey="adaptive"
                  name="Adaptive AI priority"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="fixed"
                  name="Fixed FIFO order"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Flagged sample triage positions"
          description="Comparison of review position for each flagged sample under fixed vs. adaptive ordering."
        >
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Sample ID</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Adaptive Rank</th>
                  <th className="px-3 py-2 font-medium">Fixed Order</th>
                  <th className="px-3 py-2 font-medium">Advance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {flaggedOrder.map((item) => {
                  const advance = item.fixedPos - item.adaptivePos;
                  return (
                    <tr key={item.id} className="hover:bg-muted/40">
                      <td className="px-3 py-1.5 font-semibold text-primary">
                        {item.id}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums text-foreground">
                        {item.score.toFixed(1)}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums font-semibold text-foreground">
                        #{item.adaptivePos}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums text-muted-foreground">
                        #{item.fixedPos}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums">
                        <span
                          className={
                            advance > 0
                              ? "text-low font-semibold"
                              : advance < 0
                              ? "text-high font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {advance > 0 ? `+${advance}` : advance}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
