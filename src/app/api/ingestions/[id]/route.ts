import { NextResponse } from "next/server";
import { getIngestion } from "@/lib/ingestions/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const bundle = await getIngestion(id);
  if (!bundle.ingestion) {
    return NextResponse.json({ error: "Ingestion not found." }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
