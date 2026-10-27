import React from "react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { PriorityDistributionChart } from "@/components/dashboard/priority-distribution-chart";
import { TopPriorityList } from "@/components/dashboard/top-priority-list";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
            Mission overview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl text-foreground">
            Signal Intelligence Dashboard
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Synthetic electromagnetic samples are scored by a transparent
            rule-based engine and ranked so a human reviewer can examine the most
            unusual ones first. Press Start Simulation to stream new samples.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatCards />

      {/* Primary Visualizations */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart />
        </div>
        <PriorityDistributionChart />
      </div>

      {/* Triage Queue & Live Event Feed */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopPriorityList />
        <RecentActivity />
      </div>
    </div>
  );
}
