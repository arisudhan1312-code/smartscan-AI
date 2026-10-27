import { expectedBands } from "./engine";
import { RawSample } from "./types";

/**
 * SplitMix32 PRNG for fully deterministic, reproducible synthetic signals
 */
export function createRNG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t ^ (t + Math.imul(t ^ (t >>> 7), 61 | t))) ^ (t >>> 14);
    return (t >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for Gaussian random distribution
 */
export function gaussian(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

const round = (val: number, decimals: number) =>
  Number(val.toFixed(decimals));

const featureKeys = ["strength", "variation", "uncertainty", "frequency"] as const;

export function generateSingleSample(
  rng: () => number,
  seq: number,
  cycle: number
): RawSample {
  const band = expectedBands[Math.floor(rng() * expectedBands.length)];
  let freq = band.min + rng() * (band.max - band.min);
  let strength = clamp(gaussian(rng, -72, 8), -98, -50);
  let variation = clamp(gaussian(rng, 0.2, 0.08), 0.02, 0.5);
  let uncertainty = clamp(gaussian(rng, 0.18, 0.08), 0.02, 0.5);

  // Injected ground-truth anomalies (~18% of samples)
  const isUnusual = rng() < 0.18;
  if (isUnusual) {
    const pool = [...featureKeys];
    const numTraits = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < numTraits; i++) {
      const idx = Math.floor(rng() * pool.length);
      const trait = pool.splice(idx, 1)[0];
      if (trait === "strength") {
        strength = -44 + 16 * rng();
      } else if (trait === "variation") {
        variation = 0.6 + 0.35 * rng();
      } else if (trait === "uncertainty") {
        uncertainty = 0.6 + 0.32 * rng();
      } else if (trait === "frequency") {
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

export function generateBatch(
  seed: number,
  count = 48
): { samples: RawSample[]; nextSeq: number; cycle: number } {
  const rng = createRNG(seed);
  const samples: RawSample[] = [];
  for (let i = 0; i < count; i++) {
    samples.push(generateSingleSample(rng, i + 1, Math.floor(i / 2)));
  }
  return {
    samples,
    nextSeq: count + 1,
    cycle: Math.ceil(count / 2),
  };
}
