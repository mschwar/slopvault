import { NextResponse } from "next/server";
import { analyzeIngestion } from "@/lib/ingestions/service";
import type { AnalyzeIngestionInput } from "@/lib/ingestions/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as AnalyzeIngestionInput;
    const result = await analyzeIngestion(id, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analyze failed." },
      { status: 400 },
    );
  }
}
