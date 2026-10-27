import {
  Band,
  FeatureKey,
  RawSample,
  AnalyzedSample,
  Weights,
  Thresholds,
  Priority,
  PatternStatus,
  Classification,
} from "./types";

export const expectedBands: Band[] = [
  { name: "Sim Band A", min: 902, max: 928 },
  { name: "Sim Band B", min: 2400, max: 2483.5 },
  { name: "Sim Band C", min: 5725, max: 5850 },
];

export const defaultWeights: Weights = {
  strength: 0.25,
  variation: 0.30,
  uncertainty: 0.20,
  frequency: 0.25,
};

export const thresholds: Thresholds = {
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

export const engineName = "Rule-based scoring engine v1";

export const featureLabels: Record<FeatureKey, string> = {
  strength: "Signal strength",
  variation: "Pattern variation",
  uncertainty: "Uncertainty",
  frequency: "Frequency deviation",
};

export const featureKeys: FeatureKey[] = [
  "strength",
  "variation",
  "uncertainty",
  "frequency",
];

export const recommendedActions: Record<Priority, string> = {
  High: "Prioritise for human analyst review",
  Medium: "Queue for secondary review",
  Low: "Log and continue monitoring",
};

export const nextSteps: Record<FeatureKey, string> = {
  uncertainty:
    "Request a re-capture of this simulated sample to reduce measurement uncertainty before drawing any conclusion.",
  variation:
    "Inspect how the pattern changes over time and compare it against nominal baseline samples from the same band.",
  frequency:
    "Check the frequency against the expected band plan. An out-of-band reading may be a configuration or simulation artefact.",
  strength:
    "Check whether the strength reading is consistent with neighbouring samples. A spike may reflect proximity or gain settings.",
};

export function clamp(val: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, val));
}

export function findNearestBand(frequencyMHz: number): { name: string; distance: number } {
  let nearest = { name: expectedBands[0].name, distance: Infinity };
  for (const band of expectedBands) {
    const dist =
      frequencyMHz < band.min
        ? band.min - frequencyMHz
        : frequencyMHz > band.max
        ? frequencyMHz - band.max
        : 0;
    if (dist < nearest.distance) {
      nearest = { name: band.name, distance: dist };
    }
  }
  return nearest;
}

export function normalizeWeights(weights: Weights): Record<FeatureKey, number> {
  const sum = featureKeys.reduce((acc, k) => acc + Math.max(0, weights[k]), 0);
  return Object.fromEntries(
    featureKeys.map((k) => [k, sum === 0 ? 0.25 : Math.max(0, weights[k]) / sum])
  ) as Record<FeatureKey, number>;
}

export function analyzeSample(
  sample: RawSample,
  weights: Weights = defaultWeights,
  isReviewed = false
): AnalyzedSample {
  const nearest = findNearestBand(sample.frequencyMHz);
  const {
    strengthFloorDbm,
    strengthCeilDbm,
    bandMarginMHz,
    bandDeviationScaleMHz,
  } = thresholds;

  // Normalized feature values (0 to 1)
  const normFeatures: Record<FeatureKey, number> = {
    strength: clamp((sample.strengthDbm - strengthFloorDbm) / (strengthCeilDbm - strengthFloorDbm)),
    variation: clamp(sample.patternVariation),
    uncertainty: clamp(sample.uncertainty),
    frequency: nearest.distance <= bandMarginMHz ? 0 : clamp(nearest.distance / bandDeviationScaleMHz),
  };

  const normWeights = normalizeWeights(weights);

  const rawDisplay: Record<FeatureKey, string> = {
    strength: `${sample.strengthDbm.toFixed(1)} dBm`,
    variation: sample.patternVariation.toFixed(2),
    uncertainty: sample.uncertainty.toFixed(2),
    frequency:
      nearest.distance === 0
        ? `In ${nearest.name}`
        : `${nearest.distance.toFixed(1)} MHz from ${nearest.name}`,
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

  // Determine flag reasons
  const flagReasons: string[] = [];
  if (sample.patternVariation >= thresholds.variation) {
    flagReasons.push(
      `Pattern variation ${sample.patternVariation.toFixed(2)} meets or exceeds the ${thresholds.variation.toFixed(2)} threshold.`
    );
  }
  if (nearest.distance > thresholds.bandMarginMHz) {
    flagReasons.push(
      `Frequency ${sample.frequencyMHz.toFixed(1)} MHz lies ${nearest.distance.toFixed(1)} MHz outside the nearest expected band (${nearest.name}).`
    );
  }
  if (sample.strengthDbm >= thresholds.strengthDbm) {
    flagReasons.push(
      `Signal strength ${sample.strengthDbm.toFixed(1)} dBm is at or above the ${thresholds.strengthDbm} dBm threshold.`
    );
  }
  if (sample.uncertainty >= thresholds.uncertainty) {
    flagReasons.push(
      `Uncertainty ${sample.uncertainty.toFixed(2)} meets or exceeds the ${thresholds.uncertainty.toFixed(2)} threshold, so the reading is less reliable.`
    );
  }
  if (score >= thresholds.highScore && flagReasons.length === 0) {
    flagReasons.push(
      `Combined priority score ${score} meets the ${thresholds.highScore} high-priority threshold.`
    );
  }

  const isFlagged = flagReasons.length > 0;
  const priority: Priority =
    score >= thresholds.highScore
      ? "High"
      : score >= thresholds.mediumScore || isFlagged
      ? "Medium"
      : "Low";

  const topFactor = [...featureBreakdowns].sort((a, b) => b.points - a.points)[0];

  let classification: Classification = "Nominal";
  if (isReviewed) {
    classification = "Reviewed";
  } else if (isFlagged) {
    classification = "Flagged for Review";
  } else if (priority !== "Low") {
    classification = "Monitoring";
  }

  const patternStatus: PatternStatus =
    sample.patternVariation >= thresholds.variation
      ? "Unusual"
      : sample.patternVariation >= 0.35
      ? "Irregular"
      : "Normal";

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
    nextStep:
      priority !== "Low" || isFlagged
        ? nextSteps[topFactor.key]
        : "No specific follow-up needed. Keep the sample in the log for baseline comparison.",
    nearestBand: nearest.name,
    bandDistanceMHz: Number(nearest.distance.toFixed(1)),
  };
}

export function sortPriorityQueue(samples: AnalyzedSample[]): AnalyzedSample[] {
  return [...samples].sort((a, b) => b.score - a.score || a.seq - b.seq);
}
