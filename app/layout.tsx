import "./globals.css";
import React from "react";
import type { Metadata } from "next";
import { SimulationProvider } from "@/lib/simulation-context";
import { SidebarNav, SidebarHeader } from "@/components/layout/sidebar-nav";
import { SimulationControls } from "@/components/layout/simulation-controls";
import { SignalDetailsDrawer } from "@/components/layout/signal-details-drawer";

export const metadata: Metadata = {
  title: "SmartScan AI - Smart Scan Strategy for Electronic Warfare",
  description:
    "Educational signal-analysis prototype that scores synthetic electromagnetic samples with a transparent rule-based engine and prioritises them for human review.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <SimulationProvider>
          <div className="flex min-h-dvh">
            {/* Desktop Left Sidebar */}
            <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
              <SidebarHeader />
              <div className="flex-1 overflow-y-auto py-2">
                <SidebarNav variant="sidebar" />
              </div>
              <div className="p-4 border-t border-sidebar-border text-[11px] text-muted-foreground leading-normal">
                SmartScan AI Prototype
                <br />
                Synthetic EW Dataset
              </div>
            </aside>

            {/* Main Area */}
            <div className="flex flex-1 flex-col min-w-0">
              {/* Sticky Top Bar with Simulation Controls */}
              <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-8">
                <div className="lg:hidden">
                  <SidebarHeader />
                </div>
                <SimulationControls />
              </header>

              {/* Mobile Navigation */}
              <div className="border-b border-border bg-sidebar lg:hidden">
                <SidebarNav variant="mobile" />
              </div>

              {/* Page Content */}
              <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
                {children}
              </main>

              {/* Global Footer */}
              <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground md:px-8">
                SmartScan AI is an educational prototype using synthetic signal
                data. Unusual patterns are not proof of hostile activity. All
                recommendations require human review.
              </footer>
            </div>
          </div>

          {/* Interactive Inspection Drawer */}
          <SignalDetailsDrawer />
        </SimulationProvider>
      </body>
    </html>
  );
}
