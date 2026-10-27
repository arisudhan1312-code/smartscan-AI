"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { SectionCard } from "@/components/ui/card";
import { formatCycle, cn } from "@/lib/utils";
import { Flag, Cpu } from "lucide-react";
import { SimulationEvent } from "@/lib/signals/types";

function EventIcon({ event }: { event: SimulationEvent }) {
  if (event.kind === "flagged") {
    return (
      <Flag
        className={cn(
          "size-4 shrink-0",
          event.priority === "High" ? "text-high" : "text-medium"
        )}
        aria-hidden="true"
      />
    );
  }
  return <Cpu className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />;
}

export function RecentActivity() {
  const { events, select } = useSimulation();

  return (
    <SectionCard
      title="Recent activity"
      description="Engine flags, reviews and simulation events."
      className="h-full"
    >
      <ol
        className="flex max-h-[22rem] flex-col gap-1 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {events.map((event) => {
          const content = (
            <>
              <span className="mt-0.5">
                <EventIcon event={event} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-foreground">
                  {event.message}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatCycle(event.cycle)}
                </span>
              </span>
            </>
          );

          return (
            <li key={event.id} className="animate-in fade-in slide-in-from-top-1">
              {event.sampleId ? (
                <button
                  type="button"
                  onClick={() => select(event.sampleId!)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-start gap-3 px-2 py-2">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
