/**
 * SmartScan AI - Standalone Client Controller
 * Exact mirror of the Next.js simulation and scoring engine.
 */

// =============================================================================
// Constants & Configuration
// =============================================================================

const expectedBands = [
  { name: "Sim Band A", min: 902, max: 928 },
  { name: "Sim Band B", min: 2400, max: 2483.5 },
  { name: "Sim Band C", min: 5725, max: 5850 },
];

const defaultWeights = {
  strength: 0.25,
  variation: 0.30,
  uncertainty: 0.20,
  frequency: 0.25,
};

const thresholds = {
  variation: 0.60,
  uncertainty: 0.60,
  strengthDbm: -45,
  bandMarginMHz: 10,
  bandDeviationScaleMHz: 150,
  strengthFloorDbm: -100,
  strengthCeilDbm: -30,
  highScore: 55,
  mediumScore: 35,
};

const featureKeys = ["strength", "variation", "uncertainty", "frequency"];

const featureLabels = {
  strength: "Signal strength",
  variation: "Pattern variation",
  uncertainty: "Uncertainty",
  frequency: "Frequency deviation",
};

const recommendedActions = {
  High: "Prioritise for human analyst review",
  Medium: "Queue for secondary review",
  Low: "Log and continue monitoring",
};

const nextSteps = {
  uncertainty: "Request a re-capture of this simulated sample to reduce measurement uncertainty before drawing any conclusion.",
  variation: "Inspect how the pattern changes over time and compare it against nominal baseline samples from the same band.",
  frequency: "Check the frequency against the expected band plan. An out-of-band reading may be a configuration or simulation artefact.",
  strength: "Check whether the strength reading is consistent with neighbouring samples. A spike may reflect proximity or gain settings.",
};

// =============================================================================
// PRNG & Generator
// =============================================================================

function createRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t ^ (t + Math.imul(t ^ (t >>> 7), 61 | t))) ^ (t >>> 14);
    return (t >>> 0) / 4294967296;
  };
}

function gaussian(rng, mean, std) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const clamp = (val, min = 0, max = 1) => Math.min(max, Math.max(min, val));
const round = (val, dec = 2) => Number(val.toFixed(dec));

function generateSingleSample(rng, seq, cycle) {
  const band = expectedBands[Math.floor(rng() * expectedBands.length)];
  let freq = band.min + rng() * (band.max - band.min);
  let strength = clamp(gaussian(rng, -72, 8), -98, -50);
  let variation = clamp(gaussian(rng, 0.2, 0.08), 0.02, 0.5);
  let uncertainty = clamp(gaussian(rng, 0.18, 0.08), 0.02, 0.5);

  const isUnusual = rng() < 0.18;
  if (isUnusual) {
    const pool = [...featureKeys];
    const numTraits = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < numTraits; i++) {
      const idx = Math.floor(rng() * pool.length);
      const trait = pool.splice(idx, 1)[0];
      if (trait === "strength") strength = -44 + 16 * rng();
      else if (trait === "variation") variation = 0.6 + 0.35 * rng();
      else if (trait === "uncertainty") uncertainty = 0.6 + 0.32 * rng();
      else if (trait === "frequency") {
        const offset = 15 + 165 * rng();
        freq = rng() < 0.5 ? band.min - offset : band.max + offset;
      }
    }
  }

  return {
    id: `SIM-${String(seq).padStart(4, "0")}`,
    seq,
    cycle,
    frequencyMHz: round(freq, 1),
    strengthDbm: round(strength, 1),
    patternVariation: round(variation, 2),
    uncertainty: round(uncertainty, 2),
    generatorLabel: isUnusual ? "unusual" : "background",
  };
}

function generateInitialBatch(seed = 2026, count = 48) {
  const rng = createRNG(seed);
  const samples = [];
  for (let i = 0; i < count; i++) {
    samples.push(generateSingleSample(rng, i + 1, Math.floor(i / 2)));
  }
  return { samples, nextSeq: count + 1, cycle: Math.ceil(count / 2) };
}

// =============================================================================
// Scoring & Analysis Engine
// =============================================================================

function findNearestBand(freqMHz) {
  let nearest = { name: expectedBands[0].name, distance: Infinity };
  for (const b of expectedBands) {
    const dist = freqMHz < b.min ? b.min - freqMHz : freqMHz > b.max ? freqMHz - b.max : 0;
    if (dist < nearest.distance) {
      nearest = { name: b.name, distance: dist };
    }
  }
  return nearest;
}

function normalizeWeights(weights) {
  const sum = featureKeys.reduce((acc, k) => acc + Math.max(0, weights[k]), 0);
  return Object.fromEntries(
    featureKeys.map((k) => [k, sum === 0 ? 0.25 : Math.max(0, weights[k]) / sum])
  );
}

function analyzeSample(sample, weights = defaultWeights, isReviewed = false) {
  const nearest = findNearestBand(sample.frequencyMHz);
  const { strengthFloorDbm, strengthCeilDbm, bandMarginMHz, bandDeviationScaleMHz } = thresholds;

  const normFeatures = {
    strength: clamp((sample.strengthDbm - strengthFloorDbm) / (strengthCeilDbm - strengthFloorDbm)),
    variation: clamp(sample.patternVariation),
    uncertainty: clamp(sample.uncertainty),
    frequency: nearest.distance <= bandMarginMHz ? 0 : clamp(nearest.distance / bandDeviationScaleMHz),
  };

  const normWeights = normalizeWeights(weights);

  const rawDisplay = {
    strength: `${sample.strengthDbm.toFixed(1)} dBm`,
    variation: sample.patternVariation.toFixed(2),
    uncertainty: sample.uncertainty.toFixed(2),
    frequency: nearest.distance === 0 ? `In ${nearest.name}` : `${nearest.distance.toFixed(1)} MHz from ${nearest.name}`,
  };

  const featureBreakdowns = featureKeys.map((k) => ({
    key: k,
    label: featureLabels[k],
    rawDisplay: rawDisplay[k],
    normalized: normFeatures[k],
    weightShare: normWeights[k],
    points: 100 * normWeights[k] * normFeatures[k],
  }));

  const score = Number(featureBreakdowns.reduce((sum, f) => sum + f.points, 0).toFixed(1));

  const flagReasons = [];
  if (sample.patternVariation >= thresholds.variation) {
    flagReasons.push(`Pattern variation ${sample.patternVariation.toFixed(2)} meets or exceeds the ${thresholds.variation.toFixed(2)} threshold.`);
  }
  if (nearest.distance > thresholds.bandMarginMHz) {
    flagReasons.push(`Frequency ${sample.frequencyMHz.toFixed(1)} MHz lies ${nearest.distance.toFixed(1)} MHz outside the nearest expected band (${nearest.name}).`);
  }
  if (sample.strengthDbm >= thresholds.strengthDbm) {
    flagReasons.push(`Signal strength ${sample.strengthDbm.toFixed(1)} dBm is at or above the ${thresholds.strengthDbm} dBm threshold.`);
  }
  if (sample.uncertainty >= thresholds.uncertainty) {
    flagReasons.push(`Uncertainty ${sample.uncertainty.toFixed(2)} meets or exceeds the ${thresholds.uncertainty.toFixed(2)} threshold, so the reading is less reliable.`);
  }
  if (score >= thresholds.highScore && flagReasons.length === 0) {
    flagReasons.push(`Combined priority score ${score} meets the ${thresholds.highScore} high-priority threshold.`);
  }

  const isFlagged = flagReasons.length > 0;
  const priority = score >= thresholds.highScore ? "High" : score >= thresholds.mediumScore || isFlagged ? "Medium" : "Low";
  const topFactor = [...featureBreakdowns].sort((a, b) => b.points - a.points)[0];

  let classification = "Nominal";
  if (isReviewed) classification = "Reviewed";
  else if (isFlagged) classification = "Flagged for Review";
  else if (priority !== "Low") classification = "Monitoring";

  const patternStatus = sample.patternVariation >= thresholds.variation ? "Unusual" : sample.patternVariation >= 0.35 ? "Irregular" : "Normal";

  return {
    ...sample,
    features: featureBreakdowns,
    score,
    priority,
    patternStatus,
    flagged: isFlagged,
    flagReasons,
    classification,
    recommendedAction: recommendedActions[priority],
    nextStep: priority !== "Low" || isFlagged ? nextSteps[topFactor.key] : "No specific follow-up needed. Keep the sample in the log for baseline comparison.",
    nearestBand: nearest.name,
    bandDistanceMHz: Number(nearest.distance.toFixed(1)),
  };
}

function sortPriorityQueue(samples) {
  return [...samples].sort((a, b) => b.score - a.score || a.seq - b.seq);
}

// =============================================================================
// Application State
// =============================================================================

const state = {
  raw: [],
  weights: { ...defaultWeights },
  reviewed: {},
  running: false,
  seed: 2026,
  cycle: 24,
  nextSeq: 49,
  events: [],
  selectedSample: null,
  activeTab: "dashboard",
  sortKey: "rank",
  sortDir: "asc",
  charts: {
    activity: null,
    distribution: null,
    scatter: null,
    bands: null,
    comparison: null,
  },
};

let simInterval = null;
let rng = createRNG(3026);

// =============================================================================
// DOM Elements
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initSimulation();
  bindUIEvents();
  renderAll();
  lucide.createIcons();
});

function initSimulation(seed = 2026) {
  const initial = generateInitialBatch(seed, 48);
  state.seed = seed;
  state.raw = initial.samples;
  state.nextSeq = initial.nextSeq;
  state.cycle = initial.cycle;
  state.reviewed = {};
  state.selectedSample = null;
  state.events = [
    {
      id: "evt-0",
      cycle: 0,
      kind: "system",
      message: `Initialised 48 simulated samples (seed ${seed}).`,
    },
  ];
  rng = createRNG(seed + 1000);
}

// =============================================================================
// UI Event Bindings
// =============================================================================

function bindUIEvents() {
  // Navigation Tabs
  document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Simulation controls
  document.getElementById("btn-toggle-sim").addEventListener("click", toggleSimulation);
  document.getElementById("btn-new-signals").addEventListener("click", () => {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    stopSimulation();
    initSimulation(newSeed);
    renderAll();
  });

  // Reset Weights
  document.getElementById("btn-reset-weights").addEventListener("click", () => {
    state.weights = { ...defaultWeights };
    renderAll();
  });

  // Re-run comparison
  document.getElementById("btn-rerun-comparison").addEventListener("click", renderComparisonView);

  // Queue table filters
  document.getElementById("queue-search-input").addEventListener("input", renderQueueTable);
  document.getElementById("queue-filter-priority").addEventListener("change", renderQueueTable);
  document.getElementById("queue-filter-pattern").addEventListener("change", renderQueueTable);
  document.getElementById("queue-hide-reviewed").addEventListener("change", renderQueueTable);

  // Drawer Close
  document.getElementById("btn-close-drawer").addEventListener("click", closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", closeDrawer);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Update tabs UI
  document.querySelectorAll(".page-view").forEach((p) => p.classList.add("hidden"));
  const activePage = document.getElementById(`page-${tabId}`);
  if (activePage) {
    activePage.classList.remove("hidden");
    activePage.classList.add("flex");
  }

  // Update sidebar active classes
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    const isCur = btn.dataset.tab === tabId;
    btn.className = `nav-btn flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isCur ? "bg-[#0f2040] text-sky-400 font-semibold" : "text-slate-400 hover:bg-[#0f2040]/60 hover:text-white"
    }`;
  });

  document.querySelectorAll(".mobile-nav-btn").forEach((btn) => {
    const isCur = btn.dataset.tab === tabId;
    btn.className = `mobile-nav-btn px-3 py-1 text-xs rounded ${
      isCur ? "bg-[#0f2040] text-sky-400 font-semibold" : "text-slate-400 hover:text-white"
    }`;
  });

  if (tabId === "analysis") renderAnalysisCharts();
  if (tabId === "comparison") renderComparisonView();
  if (tabId === "queue") renderQueueTable();

  lucide.createIcons();
}

function toggleSimulation() {
  if (state.running) {
    stopSimulation();
  } else {
    startSimulation();
  }
}

function startSimulation() {
  state.running = true;
  document.getElementById("btn-toggle-sim").className =
    "inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 border border-[#1e3358] px-3 py-1.5 rounded-md text-xs hover:bg-slate-700 transition-colors cursor-pointer";
  document.getElementById("btn-toggle-sim").innerHTML = `
    <i data-lucide="square" class="size-3.5 fill-current"></i>
    <span>Stop Simulation</span>
  `;
  document.getElementById("sim-status-dot").className = "size-2 rounded-full bg-sky-400 animate-pulse";
  document.getElementById("sim-status-text").textContent = "Running";
  document.getElementById("chart-live-dot").className = "size-2 rounded-full bg-sky-400 animate-pulse";
  document.getElementById("chart-live-text").textContent = "LIVE";

  state.events.unshift({
    id: `evt-${Date.now()}`,
    cycle: state.cycle,
    kind: "system",
    message: "Simulation started.",
  });

  simInterval = setInterval(() => {
    const nextCycle = Math.ceil(state.nextSeq / 2);
    const sample = generateSingleSample(rng, state.nextSeq, nextCycle);
    state.nextSeq++;
    state.cycle = nextCycle;

    const analyzed = analyzeSample(sample, state.weights);
    if (analyzed.flagged) {
      state.events.unshift({
        id: `evt-${Date.now()}`,
        cycle: nextCycle,
        kind: "flagged",
        sampleId: analyzed.id,
        priority: analyzed.priority,
        message: `${analyzed.id} flagged — ${analyzed.priority} priority (score ${analyzed.score.toFixed(1)})`,
      });
      if (state.events.length > 40) state.events.pop();
    }

    state.raw.push(sample);
    if (state.raw.length > 400) state.raw.shift();

    renderAll();
  }, 1500);

  lucide.createIcons();
}

function stopSimulation() {
  state.running = false;
  if (simInterval) clearInterval(simInterval);
  simInterval = null;

  document.getElementById("btn-toggle-sim").className =
    "inline-flex items-center gap-1.5 bg-sky-500 text-slate-950 font-semibold px-3 py-1.5 rounded-md text-xs hover:bg-sky-400 transition-colors cursor-pointer";
  document.getElementById("btn-toggle-sim").innerHTML = `
    <i data-lucide="play" class="size-3.5 fill-current"></i>
    <span>Start Simulation</span>
  `;
  document.getElementById("sim-status-dot").className = "size-2 rounded-full bg-slate-500";
  document.getElementById("sim-status-text").textContent = "Paused";
  document.getElementById("chart-live-dot").className = "size-2 rounded-full bg-slate-500";
  document.getElementById("chart-live-text").textContent = "PAUSED";

  state.events.unshift({
    id: `evt-${Date.now()}`,
    cycle: state.cycle,
    kind: "system",
    message: "Simulation paused.",
  });

  lucide.createIcons();
}

// =============================================================================
// Core Render Pipeline
// =============================================================================

function renderAll() {
  const analyzedSamples = state.raw.map((s) =>
    analyzeSample(s, state.weights, !!state.reviewed[s.id])
  );
  const ranked = sortPriorityQueue(analyzedSamples);

  // Update Stats
  const total = analyzedSamples.length;
  let flagged = 0, high = 0, med = 0, low = 0, reviewedCount = 0, totalScore = 0;
  analyzedSamples.forEach((s) => {
    if (s.flagged) flagged++;
    if (s.priority === "High") high++;
    else if (s.priority === "Medium") med++;
    else low++;
    if (state.reviewed[s.id]) reviewedCount++;
    totalScore += s.score;
  });

  const avgScore = total > 0 ? (totalScore / total).toFixed(1) : "0.0";

  document.getElementById("sim-meta-text").textContent = `Cycle ${state.cycle} · ${total} samples · seed ${state.seed}`;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-reviewed").textContent = `${reviewedCount} reviewed`;
  document.getElementById("stat-flagged").textContent = flagged;
  document.getElementById("stat-flagged-pct").textContent = total ? `${Math.round((flagged / total) * 100)}% of total` : "—";
  document.getElementById("stat-high").textContent = high;
  document.getElementById("stat-high-pct").textContent = total ? `${Math.round((high / total) * 100)}% of total` : "—";
  document.getElementById("stat-avg-score").textContent = avgScore;

  document.getElementById("donut-total").textContent = total;
  document.getElementById("dist-high").textContent = high;
  document.getElementById("dist-med").textContent = med;
  document.getElementById("dist-low").textContent = low;

  renderActivityChart(analyzedSamples);
  renderDistributionChart(high, med, low);
  renderTopPriorityList(ranked);
  renderRecentActivity();
  renderWeightsSliders();
  renderRecentBreakdown(analyzedSamples);

  if (state.activeTab === "queue") renderQueueTable();
  if (state.activeTab === "analysis") renderAnalysisCharts();

  lucide.createIcons();
}

// =============================================================================
// Dashboard Sub-Views & Charts
// =============================================================================

function renderTopPriorityList(ranked) {
  const container = document.getElementById("top-priority-list");
  container.innerHTML = "";

  const unreviewed = ranked.filter((s) => s.classification !== "Reviewed").slice(0, 5);
  unreviewed.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="flex w-full items-center justify-between gap-3 px-1 py-2.5 text-left hover:bg-[#132240]/50 rounded cursor-pointer">
        <span class="flex flex-col">
          <span class="font-mono text-sm font-medium text-white">${s.id}</span>
          <span class="text-xs text-slate-400">${s.frequencyMHz.toFixed(1)} MHz</span>
        </span>
        <span class="flex items-center gap-3">
          <span class="font-mono text-xs text-slate-300 hidden sm:inline">${s.score.toFixed(1)}</span>
          <span class="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${
            s.priority === "High" ? "border-rose-500/40 bg-rose-500/15 text-rose-300" :
            s.priority === "Medium" ? "border-amber-500/40 bg-amber-500/15 text-amber-300" :
            "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }">
            <span class="size-1.5 rounded-full bg-current"></span>${s.priority}
          </span>
        </span>
      </button>
    `;
    li.querySelector("button").addEventListener("click", () => openDrawer(s));
    container.appendChild(li);
  });
}

function renderRecentActivity() {
  const container = document.getElementById("recent-activity-list");
  container.innerHTML = "";

  state.events.forEach((evt) => {
    const li = document.createElement("li");
    const isFlag = evt.kind === "flagged";
    li.className = "flex items-start gap-3 px-2 py-2 rounded hover:bg-[#132240]/60 cursor-pointer text-xs";
    li.innerHTML = `
      <span class="mt-0.5 ${isFlag ? (evt.priority === "High" ? "text-rose-400" : "text-amber-400") : "text-slate-400"}">
        <i data-lucide="${isFlag ? "flag" : "cpu"}" class="size-4"></i>
      </span>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="text-slate-200 font-medium truncate">${evt.message}</span>
        <span class="font-mono text-[11px] text-slate-500">Cycle ${evt.cycle}</span>
      </span>
    `;
    if (evt.sampleId) {
      li.addEventListener("click", () => {
        const sample = state.raw.map((s) => analyzeSample(s, state.weights, !!state.reviewed[s.id])).find((s) => s.id === evt.sampleId);
        if (sample) openDrawer(sample);
      });
    }
    container.appendChild(li);
  });
}

function renderActivityChart(analyzedSamples) {
  const ctx = document.getElementById("canvas-activity").getContext("2d");
  const slice = analyzedSamples.slice(-40);
  const labels = slice.map((s) => s.id);
  const scores = slice.map((s) => s.score);
  const uncertainty = slice.map((s) => Math.round(s.uncertainty * 100));

  if (state.charts.activity) state.charts.activity.destroy();

  state.charts.activity = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Priority score",
          data: scores,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.15)",
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "Uncertainty (×100)",
          data: uncertainty,
          borderColor: "#10b981",
          borderDash: [4, 4],
          fill: false,
          tension: 0.2,
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#94a3b8", font: { size: 11 } } },
      },
      scales: {
        x: { ticks: { color: "#64748b", maxTicksLimit: 8 }, grid: { color: "#1e3358" } },
        y: { min: 0, max: 100, ticks: { color: "#64748b" }, grid: { color: "#1e3358" } },
      },
    },
  });
}

function renderDistributionChart(high, med, low) {
  const ctx = document.getElementById("canvas-distribution").getContext("2d");
  if (state.charts.distribution) state.charts.distribution.destroy();

  state.charts.distribution = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["High", "Medium", "Low"],
      datasets: [
        {
          data: [high, med, low],
          backgroundColor: ["#f43f5e", "#f59e0b", "#10b981"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: { legend: { display: false } },
    },
  });
}

// =============================================================================
// Analysis Page Views & Sliders
// =============================================================================

function renderWeightsSliders() {
  const container = document.getElementById("weights-sliders-container");
  container.innerHTML = "";

  const normWeights = normalizeWeights(state.weights);

  featureKeys.forEach((key) => {
    const li = document.createElement("div");
    li.className = "flex flex-col gap-1.5";
    li.innerHTML = `
      <div class="flex items-center justify-between text-sm">
        <label class="font-medium text-slate-200">${featureLabels[key]}</label>
        <span class="font-mono text-xs text-slate-400">w = ${state.weights[key].toFixed(2)} · share ${Math.round(normWeights[key] * 100)}%</span>
      </div>
      <input type="range" min="0" max="1" step="0.05" value="${state.weights[key]}" class="w-full accent-sky-400 cursor-pointer">
      <div class="flex justify-between font-mono text-[11px] text-slate-500">
        <span>threshold active</span>
        <span>normalized [0,1]</span>
      </div>
    `;
    li.querySelector("input").addEventListener("input", (e) => {
      state.weights[key] = parseFloat(e.target.value);
      renderAll();
    });
    container.appendChild(li);
  });
}

function renderRecentBreakdown(analyzedSamples) {
  const container = document.getElementById("recent-breakdown-list");
  container.innerHTML = "";

  const slice = analyzedSamples.slice(-10).reverse();
  const colors = {
    strength: "#38bdf8",
    variation: "#f59e0b",
    uncertainty: "#10b981",
    frequency: "#f43f5e",
  };

  slice.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="grid w-full grid-cols-[5rem_1fr_3rem_4.5rem] items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#132240]/50 transition-colors cursor-pointer text-xs">
        <span class="font-mono font-medium text-white">${s.id}</span>
        <span class="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
          ${s.features.map((f) => `<span style="width:${f.points}%; background:${colors[f.key]}" title="${f.label}: ${f.points.toFixed(1)}"></span>`).join("")}
        </span>
        <span class="text-right font-mono text-slate-300 font-semibold">${s.score.toFixed(1)}</span>
        <span class="justify-self-end inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${
          s.priority === "High" ? "border-rose-500/40 text-rose-300" :
          s.priority === "Medium" ? "border-amber-500/40 text-amber-300" :
          "border-emerald-500/40 text-emerald-300"
        }">${s.priority}</span>
      </button>
    `;
    li.querySelector("button").addEventListener("click", () => openDrawer(s));
    container.appendChild(li);
  });
}

function renderAnalysisCharts() {
  const analyzedSamples = state.raw.map((s) => analyzeSample(s, state.weights, !!state.reviewed[s.id]));

  // Scatter Chart
  const ctxScatter = document.getElementById("canvas-scatter").getContext("2d");
  if (state.charts.scatter) state.charts.scatter.destroy();

  const highData = analyzedSamples.filter((s) => s.priority === "High").map((s) => ({ x: s.patternVariation, y: s.uncertainty, r: Math.max(3, s.score / 12) }));
  const medData = analyzedSamples.filter((s) => s.priority === "Medium").map((s) => ({ x: s.patternVariation, y: s.uncertainty, r: Math.max(3, s.score / 12) }));
  const lowData = analyzedSamples.filter((s) => s.priority === "Low").map((s) => ({ x: s.patternVariation, y: s.uncertainty, r: Math.max(3, s.score / 12) }));

  state.charts.scatter = new Chart(ctxScatter, {
    type: "bubble",
    data: {
      datasets: [
        { label: "High", data: highData, backgroundColor: "rgba(244, 63, 94, 0.7)" },
        { label: "Medium", data: medData, backgroundColor: "rgba(245, 158, 11, 0.7)" },
        { label: "Low", data: lowData, backgroundColor: "rgba(16, 185, 129, 0.7)" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { min: 0, max: 1, title: { display: true, text: "Pattern variation", color: "#64748b" }, ticks: { color: "#64748b" }, grid: { color: "#1e3358" } },
        y: { min: 0, max: 1, title: { display: true, text: "Uncertainty", color: "#64748b" }, ticks: { color: "#64748b" }, grid: { color: "#1e3358" } },
      },
    },
  });

  // Bands Chart
  const ctxBands = document.getElementById("canvas-bands").getContext("2d");
  if (state.charts.bands) state.charts.bands.destroy();

  const bandNames = expectedBands.map((b) => b.name);
  const inBandCounts = expectedBands.map((b) => analyzedSamples.filter((s) => s.nearestBand === b.name && s.bandDistanceMHz <= thresholds.bandMarginMHz).length);
  const outBandCounts = expectedBands.map((b) => analyzedSamples.filter((s) => s.nearestBand === b.name && s.bandDistanceMHz > thresholds.bandMarginMHz).length);

  state.charts.bands = new Chart(ctxBands, {
    type: "bar",
    data: {
      labels: bandNames,
      datasets: [
        { label: "In band", data: inBandCounts, backgroundColor: "#38bdf8" },
        { label: "Out of band", data: outBandCounts, backgroundColor: "#f43f5e" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, ticks: { color: "#64748b" }, grid: { display: false } },
        y: { stacked: true, ticks: { color: "#64748b" }, grid: { color: "#1e3358" } },
      },
    },
  });
}

// =============================================================================
// Priority Queue Table
// =============================================================================

let queueSortKey = "rank";
let queueSortDir = "asc";

function sortQueue(key) {
  if (queueSortKey === key) {
    queueSortDir = queueSortDir === "asc" ? "desc" : "asc";
  } else {
    queueSortKey = key;
    queueSortDir = key === "rank" || key === "id" ? "asc" : "desc";
  }
  renderQueueTable();
}

function renderQueueTable() {
  const query = (document.getElementById("queue-search-input").value || "").toLowerCase().trim();
  const priFilter = document.getElementById("queue-filter-priority").value;
  const patFilter = document.getElementById("queue-filter-pattern").value;
  const hideRev = document.getElementById("queue-hide-reviewed").checked;

  const analyzed = state.raw.map((s) => analyzeSample(s, state.weights, !!state.reviewed[s.id]));
  const ranked = sortPriorityQueue(analyzed);

  const rankMap = new Map();
  ranked.forEach((s, idx) => rankMap.set(s.id, idx + 1));

  let filtered = ranked.filter((s) => {
    if (priFilter !== "All" && s.priority !== priFilter) return false;
    if (patFilter !== "All" && s.patternStatus !== patFilter) return false;
    if (hideRev && s.classification === "Reviewed") return false;
    if (!query) return true;
    return (
      s.id.toLowerCase().includes(query) ||
      s.nearestBand.toLowerCase().includes(query) ||
      s.recommendedAction.toLowerCase().includes(query) ||
      s.frequencyMHz.toFixed(1).includes(query)
    );
  });

  const mult = queueSortDir === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    const va = queueSortKey === "rank" ? rankMap.get(a.id) : a[queueSortKey];
    const vb = queueSortKey === "rank" ? rankMap.get(b.id) : b[queueSortKey];
    if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * mult;
    return (va - vb) * mult;
  });

  document.getElementById("queue-count-label").textContent = `Showing ${filtered.length} of ${ranked.length} simulated samples.`;

  const tbody = document.getElementById("queue-table-body");
  tbody.innerHTML = "";

  filtered.forEach((sample) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#132240]/50 transition-colors cursor-pointer text-xs";
    tr.innerHTML = `
      <td class="px-3 py-2.5 font-mono text-slate-400 tabular-nums">${rankMap.get(sample.id)}</td>
      <td class="px-3 py-2.5 font-mono font-semibold text-sky-400">${sample.id}</td>
      <td class="px-3 py-2.5 font-mono text-slate-200 tabular-nums">${sample.frequencyMHz.toFixed(1)} MHz</td>
      <td class="px-3 py-2.5 font-mono text-slate-400 tabular-nums">${sample.strengthDbm.toFixed(1)} dBm</td>
      <td class="px-3 py-2.5"><span class="px-1.5 py-0.5 rounded text-[11px] font-mono ${
        sample.patternStatus === "Unusual" ? "bg-rose-500/15 text-rose-300" :
        sample.patternStatus === "Irregular" ? "bg-amber-500/15 text-amber-300" : "text-slate-400"
      }">${sample.patternStatus}</span></td>
      <td class="px-3 py-2.5 font-mono text-slate-400">${sample.uncertainty.toFixed(2)}</td>
      <td class="px-3 py-2.5 font-mono font-bold text-white">${sample.score.toFixed(1)}</td>
      <td class="px-3 py-2.5"><span class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${
        sample.priority === "High" ? "border-rose-500/40 text-rose-300" :
        sample.priority === "Medium" ? "border-amber-500/40 text-amber-300" :
        "border-emerald-500/40 text-emerald-300"
      }">${sample.priority}</span></td>
      <td class="px-3 py-2.5 text-slate-400">${sample.recommendedAction}</td>
    `;
    tr.addEventListener("click", () => openDrawer(sample));
    tbody.appendChild(tr);
  });
}

// =============================================================================
// Strategy Comparison Benchmark
// =============================================================================

function runBenchmark() {
  const analyzed = state.raw.map((s) => analyzeSample(s, state.weights));
  const flaggedIds = new Set(analyzed.filter((s) => s.flagged).map((s) => s.id));
  const injectedIds = new Set(state.raw.filter((s) => s.generatorLabel === "unusual").map((s) => s.id));

  // Measure Fixed-Order FIFO sorting
  const t0 = performance.now();
  let fixedSorted = [];
  for (let i = 0; i < 200; i++) {
    fixedSorted = [...state.raw].sort((a, b) => a.seq - b.seq);
  }
  const fixedTimingMs = (performance.now() - t0) / 200;

  // Measure Adaptive Priority sorting
  const t1 = performance.now();
  let adaptiveSorted = [];
  for (let i = 0; i < 200; i++) {
    const b = state.raw.map((s) => analyzeSample(s, state.weights));
    adaptiveSorted = sortPriorityQueue(b);
  }
  const adaptiveTimingMs = (performance.now() - t1) / 200;

  const fixedIds = fixedSorted.map((s) => s.id);
  const adaptiveIds = adaptiveSorted.map((s) => s.id);
  const windowSize = Math.max(5, Math.round(0.2 * state.raw.length));

  function calcMetrics(ids, targets) {
    const pos = [];
    ids.forEach((id, idx) => {
      if (targets.has(id)) pos.push(idx + 1);
    });
    const count = pos.length;
    return {
      count,
      avgPosition: count ? pos.reduce((a, b) => a + b, 0) / count : 0,
      lastPosition: count ? pos[count - 1] : 0,
      foundInWindow: pos.filter((p) => p <= windowSize).length,
    };
  }

  const fixedFlagged = calcMetrics(fixedIds, flaggedIds);
  const fixedInjected = calcMetrics(fixedIds, injectedIds);
  const adaptiveFlagged = calcMetrics(adaptiveIds, flaggedIds);
  const adaptiveInjected = calcMetrics(adaptiveIds, injectedIds);

  const curve = [];
  let ff = 0, af = 0;
  for (let i = 0; i < state.raw.length; i++) {
    if (flaggedIds.has(fixedIds[i])) ff++;
    if (flaggedIds.has(adaptiveIds[i])) af++;
    curve.push({ pos: i + 1, fixed: ff, adaptive: af });
  }

  const fixedMap = new Map(fixedIds.map((id, idx) => [id, idx + 1]));
  const flaggedOrder = adaptiveSorted
    .filter((s) => flaggedIds.has(s.id))
    .map((s) => ({
      id: s.id,
      adaptivePos: adaptiveIds.indexOf(s.id) + 1,
      fixedPos: fixedMap.get(s.id) || 0,
      score: s.score,
    }));

  return {
    sampleCount: state.raw.length,
    windowSize,
    fixed: { timingMs: fixedTimingMs, flagged: fixedFlagged, injected: fixedInjected },
    adaptive: { timingMs: adaptiveTimingMs, flagged: adaptiveFlagged, injected: adaptiveInjected },
    curve,
    flaggedOrder,
  };
}

function renderComparisonView() {
  const res = runBenchmark();
  document.getElementById("comp-sample-count").textContent = `same ${res.sampleCount} simulated samples`;

  const containerCards = document.getElementById("comparison-metric-cards");
  containerCards.innerHTML = `
    <!-- Fixed FIFO Card -->
    <div class="flex flex-col gap-3 rounded-xl border border-[#1e3358] bg-[#0f1d38]/80 p-5 shadow-sm">
      <div class="flex items-center gap-2">
        <span class="size-2.5 rounded-full bg-slate-400"></span>
        <h2 class="font-semibold text-white">Fixed-order review</h2>
      </div>
      <p class="text-xs text-slate-400">Analyst reviews samples in the order they arrived (ID order). No scoring step.</p>
      <dl class="flex flex-col divide-y divide-[#1e3358] text-sm">
        <div class="flex justify-between py-2"><dt class="text-slate-400">Avg. position of flagged samples</dt><dd class="font-mono text-white">${res.fixed.flagged.avgPosition.toFixed(1)}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Last flagged sample reviewed at</dt><dd class="font-mono text-white">#${res.fixed.flagged.lastPosition}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Flagged found in first ${res.windowSize}</dt><dd class="font-mono text-white">${res.fixed.flagged.foundInWindow} / ${res.fixed.flagged.count}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Avg. position of injected unusual (${res.fixed.injected.count})</dt><dd class="font-mono text-white">${res.fixed.injected.avgPosition.toFixed(1)}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Measured ordering time (avg)</dt><dd class="font-mono text-white">${res.fixed.timingMs.toFixed(3)} ms</dd></div>
      </dl>
    </div>

    <!-- Adaptive Priority Card -->
    <div class="flex flex-col gap-3 rounded-xl border border-[#1e3358] bg-[#0f1d38]/80 p-5 shadow-sm">
      <div class="flex items-center gap-2">
        <span class="size-2.5 rounded-full bg-sky-400"></span>
        <h2 class="font-semibold text-white">Adaptive-priority review</h2>
      </div>
      <p class="text-xs text-slate-400">Analyst reviews samples ranked by rule-based priority score, highest first.</p>
      <dl class="flex flex-col divide-y divide-[#1e3358] text-sm">
        <div class="flex justify-between py-2"><dt class="text-slate-400">Avg. position of flagged samples</dt><dd class="font-mono text-sky-400 font-semibold">${res.adaptive.flagged.avgPosition.toFixed(1)}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Last flagged sample reviewed at</dt><dd class="font-mono text-white">#${res.adaptive.flagged.lastPosition}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Flagged found in first ${res.windowSize}</dt><dd class="font-mono text-sky-400 font-semibold">${res.adaptive.flagged.foundInWindow} / ${res.adaptive.flagged.count}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Avg. position of injected unusual (${res.adaptive.injected.count})</dt><dd class="font-mono text-sky-400 font-semibold">${res.adaptive.injected.avgPosition.toFixed(1)}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-slate-400">Measured ordering time (avg)</dt><dd class="font-mono text-white">${res.adaptive.timingMs.toFixed(3)} ms</dd></div>
      </dl>
    </div>
  `;

  const delta = (res.fixed.flagged.avgPosition - res.adaptive.flagged.avgPosition).toFixed(1);
  const ratio = (res.adaptive.timingMs / (res.fixed.timingMs || 0.001)).toFixed(1);

  document.getElementById("comparison-explanation-list").innerHTML = `
    <li>Flagged samples reached the reviewer on average <strong class="text-white">${Math.abs(delta)} positions earlier</strong> with adaptive ordering.</li>
    <li>Generator-injected unusual samples are the simulation's ground truth. Their average position (${res.fixed.injected.avgPosition.toFixed(1)} fixed vs. ${res.adaptive.injected.avgPosition.toFixed(1)} adaptive) demonstrates separation capability.</li>
    <li>Adaptive ordering costs extra compute: it took <strong class="text-white">${ratio}×</strong> the fixed-order time (${res.fixed.timingMs.toFixed(3)} ms vs. ${res.adaptive.timingMs.toFixed(3)} ms) because it scores every sample.</li>
    <li>Results are from synthetic data only and say nothing about real-world signal environments.</li>
  `;

  // Curve Chart
  const ctxCurve = document.getElementById("canvas-comparison-curve").getContext("2d");
  if (state.charts.comparison) state.charts.comparison.destroy();

  state.charts.comparison = new Chart(ctxCurve, {
    type: "line",
    data: {
      labels: res.curve.map((c) => c.pos),
      datasets: [
        { label: "Adaptive AI priority", data: res.curve.map((c) => c.adaptive), borderColor: "#38bdf8", borderWidth: 2.5, tension: 0.1, pointRadius: 0 },
        { label: "Fixed FIFO order", data: res.curve.map((c) => c.fixed), borderColor: "#64748b", borderDash: [4, 4], borderWidth: 1.5, tension: 0.1, pointRadius: 0 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: "#64748b", maxTicksLimit: 10 }, grid: { color: "#1e3358" } },
        y: { ticks: { color: "#64748b" }, grid: { color: "#1e3358" } },
      },
    },
  });

  // Table
  const tbody = document.getElementById("comparison-flagged-table");
  tbody.innerHTML = "";
  res.flaggedOrder.forEach((item) => {
    const adv = item.fixedPos - item.adaptivePos;
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#132240]/40";
    tr.innerHTML = `
      <td class="px-3 py-1.5 font-semibold text-sky-400">${item.id}</td>
      <td class="px-3 py-1.5 text-slate-200">${item.score.toFixed(1)}</td>
      <td class="px-3 py-1.5 font-semibold text-white">#${item.adaptivePos}</td>
      <td class="px-3 py-1.5 text-slate-400">#${item.fixedPos}</td>
      <td class="px-3 py-1.5 ${adv > 0 ? "text-emerald-400 font-semibold" : adv < 0 ? "text-rose-400 font-semibold" : "text-slate-400"}">${adv > 0 ? `+${adv}` : adv}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================================================================
// Signal Details Drawer
// =============================================================================

function openDrawer(sample) {
  state.selectedSample = sample;
  document.getElementById("drawer-sample-id").textContent = sample.id;

  const content = document.getElementById("drawer-content");
  content.innerHTML = `
    <div class="flex flex-wrap items-center gap-2">
      <span class="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${
        sample.priority === "High" ? "border-rose-500/40 bg-rose-500/15 text-rose-300" :
        sample.priority === "Medium" ? "border-amber-500/40 bg-amber-500/15 text-amber-300" :
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      }">
        <span class="size-1.5 rounded-full bg-current"></span>${sample.priority}
      </span>
      <span class="rounded-md border border-[#1e3358] bg-[#132240] px-2 py-0.5 text-xs text-white">${sample.classification}</span>
      <span class="font-mono text-xs text-slate-400">Score: ${sample.score.toFixed(1)} / 100</span>
    </div>

    <!-- Recommendation Box -->
    <div class="flex flex-col gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-slate-200">
      <div class="flex items-center gap-1.5 font-semibold text-sky-400">
        <i data-lucide="lightbulb" class="size-4 shrink-0"></i>
        <span>Recommended analyst action</span>
      </div>
      <p class="font-medium text-white">${sample.recommendedAction}</p>
      <p class="text-slate-400 leading-relaxed">${sample.nextStep}</p>
    </div>

    ${sample.flagReasons.length ? `
      <div class="flex flex-col gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-slate-200">
        <div class="flex items-center gap-1.5 font-semibold text-amber-400">
          <i data-lucide="alert-triangle" class="size-4 shrink-0"></i>
          <span>Why this was flagged</span>
        </div>
        <ul class="list-disc pl-4 text-slate-300 space-y-1">
          ${sample.flagReasons.map((r) => `<li>${r}</li>`).join("")}
        </ul>
      </div>
    ` : ""}

    <!-- Scoring Breakdown -->
    <div class="flex flex-col gap-2">
      <h3 class="font-mono text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Scoring breakdown</h3>
      <div class="flex flex-col divide-y divide-[#1e3358] rounded-lg border border-[#1e3358] overflow-hidden text-xs">
        ${sample.features.map((f) => `
          <div class="flex items-center justify-between p-2.5">
            <span class="text-white">${f.label}</span>
            <span class="font-mono text-sky-400 font-semibold">+${f.points.toFixed(1)} pts (${Math.round(f.weightShare * 100)}% w)</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Physical Parameters -->
    <div class="flex flex-col gap-2">
      <h3 class="font-mono text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Signal parameters</h3>
      <dl class="flex flex-col divide-y divide-[#1e3358] rounded-lg border border-[#1e3358] text-xs">
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Simulated frequency</dt><dd class="font-mono text-white">${sample.frequencyMHz.toFixed(1)} MHz</dd></div>
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Nearest expected band</dt><dd class="font-mono text-white">${sample.nearestBand} (${sample.bandDistanceMHz === 0 ? "in band" : `+${sample.bandDistanceMHz} MHz`})</dd></div>
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Signal strength</dt><dd class="font-mono text-white">${sample.strengthDbm.toFixed(1)} dBm</dd></div>
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Pattern variation</dt><dd class="font-mono text-white">${sample.patternVariation.toFixed(2)} (${sample.patternStatus})</dd></div>
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Uncertainty</dt><dd class="font-mono text-white">${sample.uncertainty.toFixed(2)}</dd></div>
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Received at</dt><dd class="font-mono text-white">Cycle ${sample.cycle}</dd></div>
        <div class="flex justify-between p-2.5"><dt class="text-slate-400">Generator label</dt><dd class="font-mono text-white">${sample.generatorLabel === "unusual" ? "Injected unusual traits" : "Background"}</dd></div>
      </dl>
    </div>

    <div class="pt-4 border-t border-[#1e3358] flex justify-end">
      <button id="btn-mark-reviewed" class="w-full sm:w-auto bg-sky-500 text-slate-950 font-semibold px-4 py-2 rounded-md text-xs hover:bg-sky-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
        <i data-lucide="check-circle-2" class="size-4"></i>Mark as reviewed
      </button>
    </div>
  `;

  document.getElementById("btn-mark-reviewed").addEventListener("click", () => {
    state.reviewed[sample.id] = true;
    state.events.unshift({
      id: `evt-${Date.now()}`,
      cycle: state.cycle,
      kind: "system",
      message: `Sample ${sample.id} marked reviewed by analyst.`,
    });
    closeDrawer();
    renderAll();
  });

  document.getElementById("drawer-overlay").classList.remove("hidden");
  lucide.createIcons();
}

function closeDrawer() {
  document.getElementById("drawer-overlay").classList.add("hidden");
  state.selectedSample = null;
}
