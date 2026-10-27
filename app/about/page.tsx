import React from "react";
import {
  Radar,
  Sparkles,
  Binary,
  Eye,
  SlidersHorizontal,
  ListOrdered,
  Scale,
  Layers,
  Target,
  CodeXml,
  Server,
  AlertTriangle,
} from "lucide-react";

export default function AboutPage() {
  const steps = [
    {
      num: "01",
      title: "Simulate",
      desc: "A seeded generator creates synthetic samples across three simulated bands. About 18% are deliberately given unusual traits so results can be checked against ground truth.",
    },
    {
      num: "02",
      title: "Normalise",
      desc: "Signal strength, pattern variation, uncertainty and out-of-band frequency deviation are each scaled to a 0–1 feature.",
    },
    {
      num: "03",
      title: "Score",
      desc: "A weighted sum of the four features produces a 0–100 priority score. The weights are visible and adjustable on the Signal Analysis page.",
    },
    {
      num: "04",
      title: "Flag & rank",
      desc: "Threshold rules flag unusual patterns and explain why. Samples are sorted by score into the priority queue, which re-ranks every time new samples arrive.",
    },
    {
      num: "05",
      title: "Human review",
      desc: "An analyst opens each sample, reads the explanation and recommended next step, and marks it reviewed. The system never takes action on its own.",
    },
  ];

  const uniqueFeatures = [
    {
      icon: Eye,
      title: "Explainable by design",
      desc: "Every score is broken down feature by feature with the exact formula shown.",
    },
    {
      icon: SlidersHorizontal,
      title: "Tunable weights",
      desc: "Adjust weights live and watch the whole queue re-score instantly.",
    },
    {
      icon: ListOrdered,
      title: "Adaptive queue",
      desc: "The review order updates continuously as the simulation streams new samples.",
    },
    {
      icon: Scale,
      title: "Honest comparison",
      desc: "Fixed vs. adaptive review on the same dataset, with measured — not invented — timing.",
    },
    {
      icon: Layers,
      title: "Pluggable engine",
      desc: "Scoring sits behind one interface so a trained model can replace it later.",
    },
    {
      icon: Target,
      title: "Ground-truth check",
      desc: "Generator labels let you see where the rules succeed and where they miss.",
    },
  ];

  const techStack = [
    {
      name: "Next.js + TypeScript",
      desc: "App Router pages and a typed /api/analyze route",
    },
    {
      name: "Tailwind CSS",
      desc: "Design tokens for the navy and cyan theme",
    },
    {
      name: "Recharts",
      desc: "Activity, distribution, scatter and comparison charts",
    },
    {
      name: "Lucide icons",
      desc: "Consistent iconography across components",
    },
    {
      name: "React state",
      desc: "All prototype data lives in browser memory with zero external dependencies",
    },
  ];

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase">
          Hackathon project
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          About SmartScan AI
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Smart Scan Strategy for Electronic Warfare — an educational dashboard
          that shows how transparent prioritisation can help a human analyst
          decide which simulated signal samples to examine first.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-medium/30 bg-medium/10 p-4 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-medium" aria-hidden="true" />
        <p>
          SmartScan AI is an educational prototype using synthetic signal data.
          Unusual patterns are not proof of hostile activity. All recommendations
          require human review.
        </p>
      </div>

      {/* The Problem & Proposed Solution */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Radar className="size-4 text-primary" aria-hidden="true" />
            <h2>The problem</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Signal analysts can face far more samples than they have time to
            inspect. Reviewing them strictly in arrival order means a small number
            of unusual samples may sit unnoticed behind hundreds of routine ones.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h2>Proposed solution</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Score every sample with a transparent, rule-based formula, flag unusual
            patterns, and present a ranked review queue — so the analyst sees the
            most unusual samples first while always making the final call.
          </p>
        </div>
      </div>

      {/* Working Principle 5 Steps */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Binary className="size-4 text-primary" aria-hidden="true" />
          <h2>Working principle</h2>
        </div>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {steps.map((s) => (
            <li
              key={s.num}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-4"
            >
              <span className="font-mono text-xs font-semibold text-primary">
                STEP {s.num}
              </span>
              <h3 className="font-medium text-foreground text-sm">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-center font-mono text-xs text-primary font-medium">
          score = 100 × Σ (wᵢ / Σw) × xᵢ
        </div>
      </div>

      {/* Unique Features */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Unique features
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uniqueFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-4"
              >
                <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  <span>{f.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technology Stack & Architecture */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <CodeXml className="size-4 text-primary" aria-hidden="true" />
            <h2>Technology stack</h2>
          </div>
          <dl className="flex flex-col divide-y divide-border text-sm">
            {techStack.map((item) => (
              <div key={item.name} className="py-2.5 flex flex-col gap-0.5">
                <dt className="font-medium text-foreground">{item.name}</dt>
                <dd className="text-xs text-muted-foreground">{item.desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Server className="size-4 text-primary" aria-hidden="true" />
            <h2>Backend-ready architecture</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Scoring lives in{" "}
            <code className="font-mono text-xs text-foreground bg-muted px-1 py-0.5 rounded">
              lib/signals/engine.ts
            </code>{" "}
            behind an <code className="font-mono text-xs text-foreground">AnalysisEngine</code>{" "}
            interface.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The{" "}
            <code className="font-mono text-xs text-foreground bg-muted px-1 py-0.5 rounded">
              /api/analyze
            </code>{" "}
            route and{" "}
            <code className="font-mono text-xs text-foreground bg-muted px-1 py-0.5 rounded">
              lib/signals/service.ts
            </code>{" "}
            client mirror the JSON contract a Python/Flask service would expose,
            so a trained machine learning model can be swapped in later without
            changing any part of the UI.
          </p>
          <div className="mt-auto border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Target className="size-3.5 text-primary" />
              Expected impact
            </h3>
            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
              <li>Shortens analyst discovery delay for high-interest signals.</li>
              <li>Maintains full human-in-the-loop decision authority.</li>
              <li>Provides clear trade-off exploration between rule weights.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
