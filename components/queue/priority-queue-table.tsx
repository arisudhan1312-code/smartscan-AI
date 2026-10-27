"use client";

import React, { useState, useMemo } from "react";
import { useSimulation } from "@/lib/simulation-context";
import { PriorityBadge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { formatFrequency, formatDbm, cn } from "@/lib/utils";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Priority, PatternStatus } from "@/lib/signals/types";

type SortKey =
  | "rank"
  | "id"
  | "frequencyMHz"
  | "strengthDbm"
  | "patternVariation"
  | "uncertainty"
  | "score"
  | "priority";

export function PriorityQueueTable() {
  const { ranked, rankById, select } = useSimulation();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [patternFilter, setPatternFilter] = useState<string>("All");
  const [hideReviewed, setHideReviewed] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = ranked.filter((s) => {
      if (priorityFilter !== "All" && s.priority !== priorityFilter) return false;
      if (patternFilter !== "All" && s.patternStatus !== patternFilter) return false;
      if (hideReviewed && s.classification === "Reviewed") return false;
      if (!query) return true;
      return (
        s.id.toLowerCase().includes(query) ||
        s.nearestBand.toLowerCase().includes(query) ||
        s.recommendedAction.toLowerCase().includes(query) ||
        s.frequencyMHz.toFixed(1).includes(query)
      );
    });

    const getVal = (s: any) =>
      sortKey === "rank" ? rankById.get(s.id) ?? 0 : s[sortKey];
    const multiplier = sortDir === "asc" ? 1 : -1;

    return [...list].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb) * multiplier;
      }
      return (va - vb) * multiplier;
    });
  }, [
    ranked,
    rankById,
    search,
    priorityFilter,
    patternFilter,
    hideReviewed,
    sortKey,
    sortDir,
  ]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" || key === "id" ? "asc" : "desc");
    }
  };

  const renderSortTh = (key: SortKey, label: string, className?: string) => {
    const isActive = sortKey === key;
    const Icon = isActive
      ? sortDir === "asc"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;

    return (
      <th scope="col" className={cn("px-3 py-2.5 font-medium", className)}>
        <button
          type="button"
          onClick={() => handleSort(key)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground cursor-pointer",
            isActive && "text-foreground font-semibold"
          )}
        >
          {label}
          <Icon className="size-3" aria-hidden="true" />
        </button>
      </th>
    );
  };

  const selectStyle =
    "h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="queue-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, band, frequency, action…"
            className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            id="filter-priority"
            className={selectStyle}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            id="filter-pattern"
            className={selectStyle}
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
          >
            <option value="All">All patterns</option>
            <option value="Unusual">Unusual</option>
            <option value="Irregular">Irregular</option>
            <option value="Normal">Normal</option>
          </select>

          <label className="flex h-9 items-center gap-2 rounded-md border border-input px-2.5 text-sm text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideReviewed}
              onChange={(e) => setHideReviewed(e.target.checked)}
              className="accent-[var(--primary)] cursor-pointer"
            />
            Hide reviewed
          </label>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {filteredSamples.length} of {ranked.length} simulated samples.
        Queue rank updates automatically as new samples arrive.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {renderSortTh("rank", "#", "w-12")}
              {renderSortTh("id", "Sample")}
              {renderSortTh("frequencyMHz", "Frequency")}
              {renderSortTh("strengthDbm", "Strength")}
              {renderSortTh("patternVariation", "Pattern")}
              {renderSortTh("uncertainty", "Uncertainty")}
              {renderSortTh("score", "Score")}
              {renderSortTh("priority", "Priority")}
              <th scope="col" className="px-3 py-2.5 font-medium">
                Recommended action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSamples.map((sample) => {
              const rank = rankById.get(sample.id) ?? 0;
              return (
                <tr
                  key={sample.id}
                  onClick={() => select(sample.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      select(sample.id);
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground tabular-nums">
                    {rank}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-primary">
                    {sample.id}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-foreground">
                    {formatFrequency(sample.frequencyMHz)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDbm(sample.strengthDbm)}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[11px]",
                        sample.patternStatus === "Unusual"
                          ? "bg-high/15 text-high"
                          : sample.patternStatus === "Irregular"
                          ? "bg-medium/15 text-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {sample.patternStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {sample.uncertainty.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar score={sample.score} />
                  </td>
                  <td className="px-3 py-2.5">
                    <PriorityBadge priority={sample.priority} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {sample.recommendedAction}
                  </td>
                </tr>
              );
            })}
            {filteredSamples.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No simulated samples match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
