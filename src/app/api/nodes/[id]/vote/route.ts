import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/nodes/[id]/vote - Upvote a node
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const nodeId = (await params).id;

    // Check if node exists and is public
    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .select("id, visibility")
      .eq("id", nodeId)
      .single();

    if (nodeError || !node) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    if (node.visibility !== "public") {
      return NextResponse.json(
        { error: "Cannot vote on private nodes" },
        { status: 403 }
      );
    }

    // Insert vote (will fail with unique constraint if already voted)
    const { error: voteError } = await supabase
      .from("votes")
      .insert({
        user_id: user.id,
        node_id: nodeId,
      });

    if (voteError) {
      // Check if it's a unique constraint violation (already voted)
      if (voteError.code === "23505") {
        return NextResponse.json(
          { error: "Already voted" },
          { status: 409 }
        );
      }
      throw voteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote POST error:", error);
    return NextResponse.json(
      { error: "Failed to upvote" },
      { status: 500 }
    );
  }
}

// DELETE /api/nodes/[id]/vote - Remove upvote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const nodeId = (await params).id;

    // Delete vote
    const { error: deleteError } = await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("node_id", nodeId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}

// GET /api/nodes/[id]/vote - Check if user has voted
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasVoted: false });
    }

    const nodeId = (await params).id;

    const { data, error } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", user.id)
      .eq("node_id", nodeId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({ hasVoted: !!data });
  } catch (error) {
    console.error("Vote GET error:", error);
    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 }
    );
  }
}
