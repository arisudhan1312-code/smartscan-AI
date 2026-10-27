import React from "react";
import { cn } from "@/lib/utils";
import { Priority } from "@/lib/signals/types";

const priorityStyles: Record<Priority, string> = {
  High: "border-high/40 bg-high/15 text-high",
  Medium: "border-medium/40 bg-medium/15 text-medium",
  Low: "border-low/40 bg-low/10 text-low",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {priority}
    </span>
  );
}
