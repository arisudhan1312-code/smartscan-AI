"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { Button } from "@/components/ui/button";
import { formatCycle, cn } from "@/lib/utils";
import { Play, Square, RefreshCw } from "lucide-react";

export function SimulationControls() {
  const { running, cycle, seed, stats, start, stop, generateNew } =
    useSimulation();

  return (
    <div className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2">
      <div
        className="flex items-center gap-3 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <span className="rounded-md border border-medium/40 bg-medium/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-medium">
          SIMULATED DATA
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-2 rounded-full",
              running ? "animate-pulse bg-primary" : "bg-muted-foreground/50"
            )}
            aria-hidden="true"
          />
          {running ? "Running" : "Paused"}
        </span>
        <span className="hidden font-mono sm:inline">
          {formatCycle(cycle)} · {stats.total} samples · seed {seed}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {running ? (
          <Button variant="outline" size="sm" onClick={stop}>
            <Square className="size-3.5" aria-hidden="true" />
            Stop Simulation
          </Button>
        ) : (
          <Button size="sm" onClick={start}>
            <Play className="size-3.5 fill-current" aria-hidden="true" />
            Start Simulation
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={generateNew}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Generate New Signals</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}
