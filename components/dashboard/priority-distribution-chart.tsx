"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const priorityColors: Record<string, string> = {
  High: "var(--high)",
  Medium: "var(--medium)",
  Low: "var(--low)",
};

export function PriorityDistributionChart() {
  const { stats } = useSimulation();

  const data = [
    { name: "High", value: stats.high },
    { name: "Medium", value: stats.medium },
    { name: "Low", value: stats.low },
  ];

  return (
    <SectionCard
      title="Priority distribution"
      description="Breakdown of all active simulated samples."
    >
      <div className="relative flex h-48 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={priorityColors[entry.name] || "var(--primary)"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                color: "var(--popover-foreground)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-foreground">
            {stats.total}
          </span>
          <span className="text-xs text-muted-foreground">samples</span>
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {data.map((item) => (
          <li
            key={item.name}
            className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 py-2"
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ background: priorityColors[item.name] }}
                aria-hidden="true"
              />
              {item.name}
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
