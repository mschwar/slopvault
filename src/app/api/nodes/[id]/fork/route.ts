import { NextRequest, NextResponse } from "next/server";
import { forkNode } from "@/lib/nodes/service";

// POST /api/nodes/[id]/fork - Fork a public node
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const nodeId = (await params).id;
    const forkedNode = await forkNode(nodeId);

    return NextResponse.json({ 
      success: true,
      node: forkedNode 
    });
  } catch (error) {
    console.error("Fork POST error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Node not found") {
        return NextResponse.json(
          { error: "Node not found" },
          { status: 404 }
        );
      }
      if (error.message === "Cannot fork private nodes") {
        return NextResponse.json(
          { error: "Cannot fork private nodes" },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to fork node" },
      { status: 500 }
    );
  }
}
