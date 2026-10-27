import { RawSample, AnalyzedSample, Weights } from "./types";
import { defaultWeights, analyzeSample, sortPriorityQueue } from "./engine";

export interface AnalysisServiceResponse {
  status: string;
  count: number;
  samples: AnalyzedSample[];
  ranked: AnalyzedSample[];
}

export async function analyzeSignalsApi(
  samples: RawSample[],
  weights: Weights = defaultWeights
): Promise<AnalysisServiceResponse> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ samples, weights }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    // Graceful offline fallback to in-browser engine
    const analyzed = samples.map((s) => analyzeSample(s, weights));
    const ranked = sortPriorityQueue(analyzed);
    return {
      status: "fallback",
      count: analyzed.length,
      samples: analyzed,
      ranked,
    };
  }
}
