import { NextResponse } from "next/server";
import { updateIngestionItem } from "@/lib/ingestions/service";
import type { UpdateIngestionItemInput } from "@/lib/ingestions/types";

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, itemId } = await context.params;
    const body = (await request.json()) as UpdateIngestionItemInput;
    const item = await updateIngestionItem(id, itemId, body);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 },
    );
  }
}
