import { Metadata } from "next";
import { getFeed, FeedSortMode } from "@/lib/feed/service";
import { FeedClient } from "@/components/feed/FeedClient";

export const metadata: Metadata = {
  title: "Feed | SlopVault",
  description: "Discover AI-generated artifacts from the community",
};

interface FeedPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const sortMode = (params.sort as FeedSortMode) || "new";
  
  // Validate sort mode
  const validSortMode = ["new", "hot", "rabbit_holes"].includes(sortMode)
    ? sortMode
    : "new";

  const { nodes, hasMore, nextOffset } = await getFeed(validSortMode as FeedSortMode, 20);

  return (
    <FeedClient
      initialNodes={nodes}
      initialHasMore={hasMore}
      initialSortMode={validSortMode as FeedSortMode}
      initialNextOffset={nextOffset}
    />
  );
}
