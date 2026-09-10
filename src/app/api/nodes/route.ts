import { NextResponse } from "next/server";
import { createNode, listMyNodes } from "@/lib/nodes/service";
import type { CreateNodeInput } from "@/lib/ingestions/types";

export async function GET() {
  try {
    const nodes = await listMyNodes();
    return NextResponse.json({ nodes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list nodes" },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateNodeInput;
    const node = await createNode(body);
    return NextResponse.json({ node });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create node" },
      { status: 400 },
    );
  }
}
