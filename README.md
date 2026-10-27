# SmartScan AI — Smart Scan Strategy for Electronic Warfare
### Complete Local Codebase for [lumina-ruby-omega.vercel.app](https://lumina-ruby-omega.vercel.app)

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Charts-Recharts%20%26%20Chart.js-rose.svg)](https://recharts.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **CRITICAL EDUCATIONAL DISCLAIMER:**  
> SmartScan AI is an educational prototype using synthetic electromagnetic signal data. Unusual patterns are not proof of hostile activity. All recommendations require human review. Review priority scores represent triage urgency, NOT real-world kinetic threat probability.

---

## 1. Project Overview

This repository contains the complete, reproduction-ready source code for the **SmartScan AI** web application deployed at [https://lumina-ruby-omega.vercel.app](https://lumina-ruby-omega.vercel.app).

It features:
- **Mission Overview Dashboard (`/`)**: Live StatCards, ActivityChart (score & uncertainty), PriorityDistributionChart (donut chart), TopPriorityList (review next queue), and RecentActivity event feed.
- **Signal Analysis (`/analysis`)**: Interactive WeightsPanel with live range sliders, FeatureScatter plot (pattern variation vs. uncertainty), RecentBreakdown (points contribution), and BandOccupancy chart (Sim Band A, B, C).
- **Priority Queue (`/queue`)**: Full searchable, filterable (High/Med/Low, Normal/Irregular/Unusual, Hide reviewed), and sortable triage table.
- **Strategy Comparison (`/comparison`)**: Empirical benchmark comparison between Fixed-Order Review (FIFO) and Adaptive AI Prioritization on an identical stream, with 200-run `performance.now()` browser timing and cumulative discovery curves.
- **About Page (`/about`)**: Complete documentation covering The Problem, Proposed Solution, 5-Step Working Principle, Unique Features, Tech Stack, Backend-Ready Architecture, and Expected Impact.
- **Signal Details Drawer**: Interactive slide-in inspector with scoring breakdown, recommended analyst action, flag reasons, and "Mark as reviewed" controls.

---

## 2. Directory Structure

```text
SmartScanAI-Lumina/
│
├── package.json                    # Next.js dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.mjs                 # Next.js 15 config
├── tailwind.config.ts              # Tailwind dark navy theme tokens
├── postcss.config.mjs              # PostCSS config
├── README.md                       # Complete Windows 11 & VS Code guide
├── run_preview.py                  # One-click zero-dependency local preview server
│
├── app/
│   ├── globals.css                 # Dark navy theme variables & base styles
│   ├── layout.tsx                  # Root layout with sidebar, header & simulation provider
│   ├── page.tsx                    # Mission Overview Dashboard (/)
│   ├── analysis/page.tsx           # Signal Analysis (/analysis)
│   ├── queue/page.tsx              # Priority Queue (/queue)
│   ├── comparison/page.tsx         # Strategy Comparison (/comparison)
│   ├── about/page.tsx              # About & Architecture (/about)
│   └── api/analyze/route.ts        # Typed Next.js API route (/api/analyze)
│
├── components/
│   ├── dashboard/
│   │   ├── stat-cards.tsx          # 4 top summary cards
│   │   ├── activity-chart.tsx      # Recharts score & uncertainty stream
│   │   ├── priority-distribution-chart.tsx # Donut priority chart
│   │   ├── top-priority-list.tsx   # Top 5 unreviewed queue
│   │   └── recent-activity.tsx     # Live simulation event stream
│   ├── analysis/
│   │   ├── weights-panel.tsx       # Live interactive formula sliders
│   │   ├── feature-scatter.tsx     # Pattern vs Uncertainty scatter plot
│   │   ├── recent-breakdown.tsx    # Color-coded feature contribution bars
│   │   └── band-occupancy.tsx      # Stacked bar band occupancy chart
│   ├── queue/
│   │   └── priority-queue-table.tsx# Searchable, sortable, filterable queue table
│   ├── comparison/
│   │   └── comparison-view.tsx     # Empirical comparison, metrics & curves
│   ├── layout/
│   │   ├── sidebar-nav.tsx         # Navigation sidebar & header
│   │   ├── simulation-controls.tsx # Start/Stop, Seed & New Signals controls
│   │   └── signal-details-drawer.tsx # Slide-in sample detail drawer
│   └── ui/
│       ├── card.tsx                # Reusable section card
│       ├── badge.tsx               # Priority badges (High, Medium, Low)
│       ├── score-bar.tsx           # Progress score indicator
│       └── button.tsx              # UI button variants
│
├── lib/
│   ├── simulation-context.tsx      # React simulation state, interval & hooks
│   ├── utils.ts                    # cn helper & formatting functions
│   └── signals/
│       ├── types.ts                # TypeScript interfaces & domain types
│       ├── engine.ts               # Rule-based scoring engine & bands
│       ├── generator.ts            # SplitMix32 PRNG & Box-Muller generator
│       ├── comparison.ts           # Benchmark comparison calculations
│       └── service.ts              # API client with offline fallback
│
└── standalone/
    ├── index.html                  # Self-contained standalone application
    └── app.js                      # Complete client simulation engine
```

---

## 3. Quick Start (Windows 11 & VS Code)

### Option A: Instant Zero-Dependency Run (Recommended)
You can run the full interactive application right now using Python (which is already configured):

1. Open VS Code terminal (`Ctrl + \``) in:
   ```powershell
   cd C:\Users\Admin\.gemini\antigravity\scratch\SmartScanAI-Lumina
   ```
2. Run the preview launcher:
   ```powershell
   python run_preview.py
   ```
3. Your browser will automatically open to:
   👉 **[http://127.0.0.1:3000](http://127.0.0.1:3000)**

---

### Option B: Run with Next.js & Node.js (If Node is installed)
If you have Node.js (v18+) installed or are deploying to Vercel:

```powershell
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 4. Scoring Engine & Formula

Every sample receives a combined priority score ($0$ to $100$) using the transparent weighted formula:

$$\text{score} = 100 \times \sum_{i} \left(\frac{w_i}{\sum w}\right) \times x_i$$

Where:
- $x_{\text{strength}} = \frac{\text{dBm} - (-100)}{-30 - (-100)}$ (clamped to $[0, 1]$)
- $x_{\text{variation}} = \text{Pattern Variation}$ (clamped to $[0, 1]$)
- $x_{\text{uncertainty}} = \text{Measurement Uncertainty}$ (clamped to $[0, 1]$)
- $x_{\text{frequency}} = \frac{\text{Distance Outside Expected Band (MHz)}}{150\text{ MHz}}$

### Simulated Radar Bands:
- **Sim Band A**: $902 - 928\text{ MHz}$
- **Sim Band B**: $2400 - 2483.5\text{ MHz}$
- **Sim Band C**: $5725 - 5850\text{ MHz}$

### Review Priority Thresholds:
- **High Priority**: Score $\ge 55$
- **Medium Priority**: Score $\ge 35$ or any anomaly rule fired
- **Low Priority**: Score $< 35$
