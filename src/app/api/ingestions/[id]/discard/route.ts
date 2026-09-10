import { NextResponse } from "next/server";
import { discardIngestion } from "@/lib/ingestions/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ingestion = await discardIngestion(id);
    return NextResponse.json({ ingestion });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discard failed." },
      { status: 400 },
    );
  }
}
