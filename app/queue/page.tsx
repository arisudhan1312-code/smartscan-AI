import React from "react";
import { PriorityQueueTable } from "@/components/queue/priority-queue-table";

export default function QueuePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
          Triage management
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl text-foreground">
          Priority Queue
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Simulated electromagnetic signals ordered dynamically by rule-based
          priority score for human analyst triage. Click any row to inspect its
          features, waveform, and recommended next action.
        </p>
      </div>

      <PriorityQueueTable />
    </div>
  );
}
