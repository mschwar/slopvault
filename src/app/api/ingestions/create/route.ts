import { NextResponse } from "next/server";
import { createIngestionDraft } from "@/lib/ingestions/service";
import type { CreateDraftInput } from "@/lib/ingestions/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateDraftInput;
    const ingestion = await createIngestionDraft(body);
    return NextResponse.json({ ingestion });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create draft." },
      { status: 400 },
    );
  }
}
