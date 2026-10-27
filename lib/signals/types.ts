export type FeatureKey = "strength" | "variation" | "uncertainty" | "frequency";

export type Priority = "High" | "Medium" | "Low";

export type PatternStatus = "Normal" | "Irregular" | "Unusual";

export type Classification = "Reviewed" | "Flagged for Review" | "Monitoring" | "Nominal";

export type GeneratorLabel = "unusual" | "background";

export interface Band {
  name: string;
  min: number; // MHz
  max: number; // MHz
}

export interface RawSample {
  id: string;
  seq: number;
  cycle: number;
  frequencyMHz: number;
  strengthDbm: number;
  patternVariation: number; // 0-1
  uncertainty: number; // 0-1
  generatorLabel: GeneratorLabel;
}

export interface FeatureBreakdown {
  key: FeatureKey;
  label: string;
  rawDisplay: string;
  normalized: number; // 0-1
  weightShare: number; // 0-1
  points: number; // weightShare * normalized * 100
}

export interface AnalyzedSample extends RawSample {
  features: FeatureBreakdown[];
  score: number; // 0-100
  priority: Priority;
  patternStatus: PatternStatus;
  flagged: boolean;
  flagReasons: string[];
  classification: Classification;
  recommendedAction: string;
  nextStep: string;
  nearestBand: string;
  bandDistanceMHz: number;
}

export type Weights = Record<FeatureKey, number>;

export interface Thresholds {
  variation: number;
  uncertainty: number;
  strengthDbm: number;
  bandMarginMHz: number;
  bandDeviationScaleMHz: number;
  strengthFloorDbm: number;
  strengthCeilDbm: number;
  highScore: number;
  mediumScore: number;
}

export interface SimulationEvent {
  id: string;
  cycle: number;
  kind: "system" | "flagged";
  sampleId?: string;
  priority?: Priority;
  message: string;
}

export interface StrategyMetrics {
  count: number;
  avgPosition: number;
  lastPosition?: number;
}

export interface ComparisonRun {
  flagged: StrategyMetrics;
  injected: StrategyMetrics;
  timingMs: number;
  cumulativeCurve: number[];
}

export interface ComparisonResult {
  sampleCount: number;
  iterations: number;
  window: number;
  fixed: ComparisonRun;
  adaptive: ComparisonRun;
  curve: Array<{
    reviewed: number;
    Fixed: number;
    Adaptive: number;
  }>;
}
