"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { thresholds } from "@/lib/signals/engine";
import { Priority } from "@/lib/signals/types";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const priorityColors: Record<Priority, string> = {
  High: "var(--high)",
  Medium: "var(--medium)",
  Low: "var(--low)",
};

const priorities: Priority[] = ["High", "Medium", "Low"];

export function FeatureScatter() {
  const { samples, select } = useSimulation();

  return (
    <SectionCard
      title="Feature space"
      description="Pattern variation vs. uncertainty for every simulated sample. Dashed lines are the flag thresholds. Click a point to inspect it."
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="patternVariation"
              name="Pattern variation"
              domain={[0, 1]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              label={{
                value: "Pattern variation",
                position: "insideBottom",
                offset: -4,
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="uncertainty"
              name="Uncertainty"
              domain={[0, 1]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              label={{
                value: "Uncertainty",
                angle: -90,
                position: "insideLeft",
                offset: 16,
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <ZAxis
              type="number"
              dataKey="score"
              range={[24, 160]}
              name="Score"
            />
            <ReferenceLine
              x={thresholds.variation}
              stroke="var(--medium)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <ReferenceLine
              y={thresholds.uncertainty}
              stroke="var(--medium)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                color: "var(--popover-foreground)",
                fontSize: "12px",
              }}
              cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }}
            />
            {priorities.map((p) => (
              <Scatter
                key={p}
                name={p}
                data={samples.filter((s) => s.priority === p)}
                fill={priorityColors[p]}
                fillOpacity={0.75}
                isAnimationActive={false}
                onClick={(entry: any) => {
                  const id = entry?.payload?.id;
                  if (id) select(id);
                }}
                className="cursor-pointer"
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {priorities.map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: priorityColors[p] }}
              aria-hidden="true"
            />
            {p} priority
          </span>
        ))}
        <span>Point size = priority score</span>
      </div>
    </SectionCard>
  );
}
