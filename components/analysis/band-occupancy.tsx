"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { expectedBands, thresholds } from "@/lib/signals/engine";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export function BandOccupancy() {
  const { samples } = useSimulation();

  const data = expectedBands.map((band) => {
    const inThisBand = samples.filter((s) => s.nearestBand === band.name);
    return {
      band: band.name,
      range: `${band.min}–${band.max} MHz`,
      "In band": inThisBand.filter(
        (s) => s.bandDistanceMHz <= thresholds.bandMarginMHz
      ).length,
      "Out of band": inThisBand.filter(
        (s) => s.bandDistanceMHz > thresholds.bandMarginMHz
      ).length,
    };
  });

  return (
    <SectionCard
      title="Band occupancy"
      description="Samples grouped by nearest simulated band. Out-of-band readings raise the frequency-deviation feature."
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="band"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
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
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar
              dataKey="In band"
              stackId="a"
              fill="var(--primary)"
              isAnimationActive={false}
            />
            <Bar
              dataKey="Out of band"
              stackId="a"
              fill="var(--high)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] text-muted-foreground">
        {data.map((b) => (
          <li key={b.band}>{b.range}</li>
        ))}
      </ul>
    </SectionCard>
  );
}
