"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { cn } from "@/lib/utils";
import { Radio, AlertTriangle, ShieldAlert, Gauge } from "lucide-react";

export function StatCards() {
  const { stats } = useSimulation();

  const pct = (val: number) =>
    stats.total ? `${((val / stats.total) * 100).toFixed(0)}% of total` : "—";

  const cards = [
    {
      label: "Simulated signals received",
      value: stats.total.toString(),
      hint: `${stats.reviewed} reviewed`,
      icon: Radio,
      tone: "text-primary bg-primary/10 ring-primary/25",
    },
    {
      label: "Flagged for review",
      value: stats.flagged.toString(),
      hint: pct(stats.flagged),
      icon: AlertTriangle,
      tone: "text-medium bg-medium/10 ring-medium/25",
    },
    {
      label: "High-priority samples",
      value: stats.high.toString(),
      hint: pct(stats.high),
      icon: ShieldAlert,
      tone: "text-high bg-high/10 ring-high/25",
    },
    {
      label: "Average priority score",
      value: stats.avgScore.toFixed(1),
      hint: "Scale 0–100",
      icon: Gauge,
      tone: "text-low bg-low/10 ring-low/25",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card/80 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </div>
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-lg ring-1",
                card.tone
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </div>
        );
      })}
    </div>
  );
}
