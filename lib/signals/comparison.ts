import { RawSample, Weights } from "./types";
import { analyzeSample, sortPriorityQueue } from "./engine";

export interface StrategyMetrics {
  count: number;
  avgPosition: number;
  lastPosition: number;
  foundInWindow: number;
}

export interface StrategyResult {
  timingMs: number;
  flagged: StrategyMetrics;
  injected: StrategyMetrics;
}

export interface FlaggedOrderItem {
  id: string;
  adaptivePos: number;
  fixedPos: number;
  score: number;
}

export interface DetailedComparisonResult {
  sampleCount: number;
  iterations: number;
  window: number;
  fixed: StrategyResult;
  adaptive: StrategyResult;
  curve: Array<{
    position: number;
    fixed: number;
    adaptive: number;
  }>;
  flaggedOrder: FlaggedOrderItem[];
}

function calculateMetrics(
  orderedIds: string[],
  targetSet: Set<string>,
  windowSize: number
): StrategyMetrics {
  const positions: number[] = [];
  orderedIds.forEach((id, idx) => {
    if (targetSet.has(id)) {
      positions.push(idx + 1);
    }
  });

  const count = positions.length;
  return {
    count,
    avgPosition: count > 0 ? positions.reduce((acc, p) => acc + p, 0) / count : 0,
    lastPosition: count > 0 ? positions[count - 1] : 0,
    foundInWindow: positions.filter((p) => p <= windowSize).length,
  };
}

export function runBenchmarkComparison(
  rawSamples: RawSample[],
  weights: Weights,
  iterations = 200
): DetailedComparisonResult {
  const analyzed = rawSamples.map((s) => analyzeSample(s, weights));
  const flaggedIds = new Set(analyzed.filter((s) => s.flagged).map((s) => s.id));
  const injectedIds = new Set(
    rawSamples.filter((s) => s.generatorLabel === "unusual").map((s) => s.id)
  );

  // Measure Fixed-Order sorting (by sequence arrival)
  let fixedSorted: RawSample[] = [];
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) {
    fixedSorted = [...rawSamples].sort((a, b) => a.seq - b.seq);
  }
  const fixedTimingMs = (performance.now() - t0) / iterations;

  // Measure Adaptive-Priority sorting (score and sort)
  let adaptiveSorted: ReturnType<typeof sortPriorityQueue> = [];
  const t1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    const batchAnalyzed = rawSamples.map((s) => analyzeSample(s, weights));
    adaptiveSorted = sortPriorityQueue(batchAnalyzed);
  }
  const adaptiveTimingMs = (performance.now() - t1) / iterations;

  const fixedIds = fixedSorted.map((s) => s.id);
  const adaptiveIds = adaptiveSorted.map((s) => s.id);
  const windowSize = Math.max(5, Math.round(0.2 * rawSamples.length));

  // Build cumulative discovery curve
  const curve: Array<{ position: number; fixed: number; adaptive: number }> = [];
  let fixedFound = 0;
  let adaptiveFound = 0;
  for (let i = 0; i < rawSamples.length; i++) {
    if (flaggedIds.has(fixedIds[i])) fixedFound++;
    if (flaggedIds.has(adaptiveIds[i])) adaptiveFound++;
    curve.push({
      position: i + 1,
      fixed: fixedFound,
      adaptive: adaptiveFound,
    });
  }

  const fixedPosMap = new Map(fixedIds.map((id, idx) => [id, idx + 1]));
  const flaggedOrder: FlaggedOrderItem[] = adaptiveSorted
    .filter((s) => flaggedIds.has(s.id))
    .map((s, idx) => ({
      id: s.id,
      adaptivePos: adaptiveIds.indexOf(s.id) + 1 || idx + 1,
      fixedPos: fixedPosMap.get(s.id) ?? 0,
      score: s.score,
    }));

  return {
    sampleCount: rawSamples.length,
    iterations,
    window: windowSize,
    fixed: {
      timingMs: fixedTimingMs,
      flagged: calculateMetrics(fixedIds, flaggedIds, windowSize),
      injected: calculateMetrics(fixedIds, injectedIds, windowSize),
    },
    adaptive: {
      timingMs: adaptiveTimingMs,
      flagged: calculateMetrics(adaptiveIds, flaggedIds, windowSize),
      injected: calculateMetrics(adaptiveIds, injectedIds, windowSize),
    },
    curve,
    flaggedOrder,
  };
}
