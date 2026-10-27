import { NextRequest, NextResponse } from "next/server";
import { RawSample, Weights } from "@/lib/signals/types";
import { defaultWeights, analyzeSample, sortPriorityQueue } from "@/lib/signals/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawSamples: RawSample[] = body.samples || [];
    const weights: Weights = body.weights || defaultWeights;

    const analyzed = rawSamples.map((s) => analyzeSample(s, weights));
    const ranked = sortPriorityQueue(analyzed);

    return NextResponse.json({
      status: "success",
      count: analyzed.length,
      samples: analyzed,
      ranked,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to analyze samples" },
      { status: 400 }
    );
  }
}
