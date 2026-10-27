"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Radar,
  LayoutDashboard,
  Activity,
  ListOrdered,
  Scale,
  Info,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Signal Analysis", icon: Activity },
  { href: "/queue", label: "Priority Queue", icon: ListOrdered },
  { href: "/comparison", label: "Strategy Comparison", icon: Scale },
  { href: "/about", label: "About", icon: Info },
];

export function SidebarNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav aria-label="Main">
      <ul
        className={cn(
          isMobile
            ? "flex gap-1 overflow-x-auto px-4 pb-3"
            : "flex flex-col gap-1 px-3"
        )}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-sidebar-accent text-primary font-semibold"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  isMobile && "py-1.5 text-xs"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SidebarHeader() {
  return (
    <Link href="/" className="flex items-center gap-3 px-5 py-5 group">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 transition-transform group-hover:scale-105">
        <Radar className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-semibold tracking-tight text-foreground">
          SmartScan AI
        </span>
        <span className="text-xs text-muted-foreground">Smart Scan Strategy</span>
      </span>
    </Link>
  );
}
