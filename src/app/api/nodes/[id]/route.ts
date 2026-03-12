import { NextResponse } from "next/server";
import { deleteNode, getNodeBundle, updateNode } from "@/lib/nodes/service";
import type { UpdateNodeInput } from "@/lib/ingestions/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bundle = await getNodeBundle(id);
    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Node not found" },
      { status: 404 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateNodeInput;
    const node = await updateNode(id, body);
    return NextResponse.json({ node });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update node" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteNode(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete node" },
      { status: 400 },
    );
  }
}
