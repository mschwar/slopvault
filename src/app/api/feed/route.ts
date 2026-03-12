import { NextRequest, NextResponse } from "next/server";
import { getFeed, FeedSortMode } from "@/lib/feed/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortMode = (searchParams.get("sort") as FeedSortMode) || "new";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const cursor = searchParams.get("cursor") || undefined;

    // Validate sort mode
    if (!["new", "hot", "rabbit_holes"].includes(sortMode)) {
      return NextResponse.json(
        { error: "Invalid sort mode. Use: new, hot, rabbit_holes" },
        { status: 400 }
      );
    }

    const result = await getFeed(sortMode, limit, cursor);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
