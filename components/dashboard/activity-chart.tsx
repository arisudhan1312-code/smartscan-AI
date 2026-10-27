"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { thresholds } from "@/lib/signals/engine";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export function ActivityChart() {
  const { samples, running } = useSimulation();

  const data = samples.slice(-40).map((s) => ({
    id: s.id,
    score: s.score,
    uncertainty: Math.round(100 * s.uncertainty),
  }));

  return (
    <SectionCard
      title="Signal activity"
      description="Priority score and uncertainty for the latest 40 simulated samples."
      action={
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <span
            className={
              running
                ? "size-2 animate-pulse rounded-full bg-primary"
                : "size-2 rounded-full bg-muted-foreground/50"
            }
            aria-hidden="true"
          />
          {running ? "LIVE" : "PAUSED"}
        </span>
      }
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="id"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                color: "var(--popover-foreground)",
                fontSize: "12px",
              }}
              cursor={{ stroke: "var(--border)" }}
            />
            <ReferenceLine
              y={thresholds.highScore}
              stroke="var(--high)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: "High threshold (55)",
                position: "insideTopRight",
                fill: "var(--high)",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="uncertainty"
              name="Uncertainty (×100)"
              stroke="var(--low)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="score"
              name="Priority score"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#scoreFill)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
