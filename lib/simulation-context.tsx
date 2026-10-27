"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  RawSample,
  AnalyzedSample,
  Weights,
  SimulationEvent,
  Priority,
} from "./signals/types";
import {
  defaultWeights,
  analyzeSample,
  sortPriorityQueue,
} from "./signals/engine";
import {
  generateBatch,
  generateSingleSample,
  createRNG,
} from "./signals/generator";

export interface SimulationStats {
  total: number;
  flagged: number;
  high: number;
  medium: number;
  low: number;
  reviewed: number;
  avgScore: number;
}

export interface SimulationContextValue {
  raw: RawSample[];
  samples: AnalyzedSample[];
  ranked: AnalyzedSample[];
  rankById: Map<string, number>;
  selected: AnalyzedSample | null;
  selectedId: string | null;
  running: boolean;
  seed: number;
  cycle: number;
  weights: Weights;
  stats: SimulationStats;
  events: SimulationEvent[];
  start: () => void;
  stop: () => void;
  reset: (seed?: number) => void;
  generateNew: () => void;
  select: (id: string | null) => void;
  markReviewed: (id: string) => void;
  setWeights: (weights: Weights) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(
  undefined
);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [seed, setSeed] = useState<number>(2026);
  const [running, setRunning] = useState<boolean>(false);
  const [weights, setWeightsState] = useState<Weights>(defaultWeights);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Raw samples state
  const [rawSamples, setRawSamples] = useState<RawSample[]>(() => {
    return generateBatch(2026, 48).samples;
  });

  const [nextSeq, setNextSeq] = useState<number>(49);
  const [cycle, setCycle] = useState<number>(24);

  const [events, setEvents] = useState<SimulationEvent[]>([
    {
      id: "evt-0",
      cycle: 0,
      kind: "system",
      message: "Initialised 48 simulated samples (seed 2026).",
    },
  ]);
  const [eventSeq, setEventSeq] = useState<number>(1);

  const rngRef = useRef<() => number>(createRNG(2026 + 1000));

  // Compute analyzed samples based on current weights and reviewed status
  const analyzedSamples = useMemo(() => {
    return rawSamples.map((s) => analyzeSample(s, weights, !!reviewed[s.id]));
  }, [rawSamples, weights, reviewed]);

  // Compute prioritized queue
  const rankedSamples = useMemo(() => {
    return sortPriorityQueue(analyzedSamples);
  }, [analyzedSamples]);

  // Rank map for quick lookups
  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    rankedSamples.forEach((s, idx) => map.set(s.id, idx + 1));
    return map;
  }, [rankedSamples]);

  // Selected sample
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return analyzedSamples.find((s) => s.id === selectedId) || null;
  }, [analyzedSamples, selectedId]);

  // Summary statistics
  const stats = useMemo<SimulationStats>(() => {
    const total = analyzedSamples.length;
    let flagged = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let reviewedCount = 0;
    let totalScore = 0;

    for (const s of analyzedSamples) {
      if (s.flagged) flagged++;
      if (s.priority === "High") high++;
      else if (s.priority === "Medium") medium++;
      else low++;
      if (reviewed[s.id]) reviewedCount++;
      totalScore += s.score;
    }

    return {
      total,
      flagged,
      high,
      medium,
      low,
      reviewed: reviewedCount,
      avgScore: total > 0 ? totalScore / total : 0,
    };
  }, [analyzedSamples, reviewed]);

  // Simulation timer for streaming new samples
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setRawSamples((prev) => {
        const nextCycle = Math.ceil(nextSeq / 2);
        const newSample = generateSingleSample(rngRef.current, nextSeq, nextCycle);
        setNextSeq((seq) => seq + 1);
        setCycle(nextCycle);

        // Check if sample would be flagged and generate an event
        const analyzed = analyzeSample(newSample, weights);
        if (analyzed.flagged) {
          setEvents((evts) => [
            {
              id: `evt-${eventSeq}`,
              cycle: nextCycle,
              kind: "flagged",
              sampleId: analyzed.id,
              priority: analyzed.priority,
              message: `${analyzed.id} flagged — ${analyzed.priority} priority (score ${analyzed.score.toFixed(1)})`,
            },
            ...evts.slice(0, 39),
          ]);
          setEventSeq((seq) => seq + 1);
        }

        // Keep maximum 400 recent samples in buffer
        return [...prev, newSample].slice(-400);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [running, nextSeq, eventSeq, weights]);

  // Actions
  const start = useCallback(() => {
    setRunning(true);
    setEvents((evts) => [
      {
        id: `evt-${Date.now()}`,
        cycle,
        kind: "system",
        message: "Simulation started.",
      },
      ...evts.slice(0, 39),
    ]);
  }, [cycle]);

  const stop = useCallback(() => {
    setRunning(false);
    setEvents((evts) => [
      {
        id: `evt-${Date.now()}`,
        cycle,
        kind: "system",
        message: "Simulation paused.",
      },
      ...evts.slice(0, 39),
    ]);
  }, [cycle]);

  const reset = useCallback(
    (newSeed?: number) => {
      const activeSeed = newSeed ?? seed;
      const initial = generateBatch(activeSeed, 48);
      setSeed(activeSeed);
      setRunning(false);
      setRawSamples(initial.samples);
      setNextSeq(initial.nextSeq);
      setCycle(initial.cycle);
      setReviewed({});
      setSelectedId(null);
      rngRef.current = createRNG(activeSeed + 1000);
      setEvents([
        {
          id: `evt-${Date.now()}`,
          cycle: initial.cycle,
          kind: "system",
          message: `Reset simulation with 48 samples (seed ${activeSeed}).`,
        },
      ]);
    },
    [seed]
  );

  const generateNew = useCallback(() => {
    const randomSeed = Math.floor(Math.random() * 900000) + 100000;
    reset(randomSeed);
  }, [reset]);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const markReviewed = useCallback(
    (id: string) => {
      setReviewed((prev) => ({ ...prev, [id]: true }));
      setEvents((evts) => [
        {
          id: `evt-${Date.now()}`,
          cycle,
          kind: "system",
          message: `Sample ${id} marked reviewed by analyst.`,
        },
        ...evts.slice(0, 39),
      ]);
    },
    [cycle]
  );

  const setWeights = useCallback((newWeights: Weights) => {
    setWeightsState(newWeights);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        raw: rawSamples,
        samples: analyzedSamples,
        ranked: rankedSamples,
        rankById,
        selected,
        selectedId,
        running,
        seed,
        cycle,
        weights,
        stats,
        events,
        start,
        stop,
        reset,
        generateNew,
        select,
        markReviewed,
        setWeights,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
