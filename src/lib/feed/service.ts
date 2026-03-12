import { createClient } from "@supabase/supabase-js";

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export type FeedSortMode = "new" | "hot" | "rabbit_holes";

export interface FeedNode {
  id: string;
  userId: string;
  title: string;
  hook: string | null;
  pseudonym: string;
  upvotes: number;
  forkCount: number;
  parentNodeId: string | null;
  createdAt: string;
  mediaTypes: string[];
}

export interface FeedResult {
  nodes: FeedNode[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Fetch public nodes for the feed with the specified sort mode.
 * 
 * Sort modes:
 * - "new": Chronological, newest first
 * - "hot": Upvotes weighted by recency (Hacker News style)
 * - "rabbit_holes": Sorted by fork chain depth (most forked first)
 */
export async function getFeed(
  sortMode: FeedSortMode = "new",
  limit: number = 20,
  cursor?: string
): Promise<FeedResult> {
  let query = getPublicClient()
    .from("nodes")
    .select(`
      id,
      user_id,
      title,
      hook,
      upvotes,
      fork_count,
      parent_node_id,
      created_at,
      profiles!inner(pseudonym),
      node_artifacts(artifacts(type))
    `)
    .eq("visibility", "public");

  // Apply cursor-based pagination
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (sortMode === "new") {
      query = query.lt("created_at", cursorDate.toISOString());
    } else {
      // For hot and rabbit_holes, we use offset-based pagination
      // since the ordering is more complex
    }
  }

  // Apply sorting based on mode
  if (sortMode === "new") {
    query = query.order("created_at", { ascending: false });
  } else if (sortMode === "hot") {
    // Hot sorting uses a simplified HN-style algorithm
    // We approximate by ordering by upvotes with recency as tiebreaker
    query = query.order("upvotes", { ascending: false });
    query = query.order("created_at", { ascending: false });
  } else if (sortMode === "rabbit_holes") {
    // Rabbit holes: prioritize nodes with forks AND nodes that are forks
    // This surfaces both popular starting points and deep remix chains
    query = query.order("fork_count", { ascending: false });
    query = query.order("parent_node_id", { ascending: false, nullsFirst: false });
    query = query.order("upvotes", { ascending: false });
  }

  // Apply limit (fetch one extra to determine if there's more)
  query = query.limit(limit + 1);

  const { data, error } = await query;

  if (error) throw error;

  const rows = data || [];
  const hasMore = rows.length > limit;
  const nodesToReturn = hasMore ? rows.slice(0, limit) : rows;

  const nodes: FeedNode[] = nodesToReturn.map((row: any) => {
    // Extract unique media types from artifacts
    const mediaTypesSet = new Set<string>();
    if (row.node_artifacts) {
      row.node_artifacts.forEach((na: any) => {
        if (na.artifacts?.type) {
          mediaTypesSet.add(na.artifacts.type);
        }
      });
    }

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      hook: row.hook,
      pseudonym: row.profiles?.pseudonym || "ghost",
      upvotes: row.upvotes || 0,
      forkCount: row.fork_count || 0,
      parentNodeId: row.parent_node_id,
      createdAt: row.created_at,
      mediaTypes: Array.from(mediaTypesSet),
    };
  });

  const nextCursor = hasMore && nodes.length > 0
    ? nodes[nodes.length - 1].createdAt
    : undefined;

  return {
    nodes,
    hasMore,
    nextCursor,
  };
}

/**
 * Calculate a "hot" score using a simplified Hacker News algorithm.
 * Score = upvotes / (hours_since_posted + 2)^gravity
 * Higher gravity = faster decay
 */
export function calculateHotScore(
  upvotes: number,
  createdAt: string | Date,
  gravity: number = 1.8
): number {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const hoursSincePosted = (now - created) / (1000 * 60 * 60);
  
  if (upvotes <= 0) return 0;
  
  return upvotes / Math.pow(hoursSincePosted + 2, gravity);
}
