import { NextResponse } from "next/server";
import { commitIngestion } from "@/lib/ingestions/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await commitIngestion(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Commit failed." },
      { status: 400 },
    );
  }
}
