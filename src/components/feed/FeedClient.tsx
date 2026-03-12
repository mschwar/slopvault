"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { FeedNode, FeedSortMode } from "@/lib/feed/service";

interface FeedClientProps {
  initialNodes: FeedNode[];
  initialHasMore: boolean;
  initialSortMode: FeedSortMode;
}

const sortModeLabels: Record<FeedSortMode, string> = {
  new: "New/Raw",
  hot: "Hot Slop",
  rabbit_holes: "Rabbit Holes",
};

const sortModeDescriptions: Record<FeedSortMode, string> = {
  new: "Chronological firehose of everything published",
  hot: "Upvotes weighted by recency",
  rabbit_holes: "Most remixed and forked content",
};

function MediaTypeIcon({ types }: { types: string[] }) {
  const hasText = types.includes("text");
  const hasImage = types.includes("image");
  const hasAudio = types.includes("audio_link");

  return (
    <span className="flex gap-1 text-xs text-gray-500">
      {hasText && <span title="Text">T</span>}
      {hasImage && <span title="Image">I</span>}
      {hasAudio && <span title="Audio">A</span>}
    </span>
  );
}

function FeedCard({
  node,
  userVote,
  onVote,
}: {
  node: FeedNode;
  userVote: boolean;
  onVote: (nodeId: string, voted: boolean) => void;
}) {
  const [isVoting, setIsVoting] = useState(false);
  const [localVote, setLocalVote] = useState(userVote);
  const [localUpvotes, setLocalUpvotes] = useState(node.upvotes);

  const handleVote = async () => {
    setIsVoting(true);
    try {
      if (localVote) {
        // Remove vote
        const res = await fetch(`/api/nodes/${node.id}/vote`, {
          method: "DELETE",
        });
        if (res.ok) {
          setLocalVote(false);
          setLocalUpvotes((prev) => prev - 1);
          onVote(node.id, false);
        }
      } else {
        // Add vote
        const res = await fetch(`/api/nodes/${node.id}/vote`, {
          method: "POST",
        });
        if (res.ok) {
          setLocalVote(true);
          setLocalUpvotes((prev) => prev + 1);
          onVote(node.id, true);
        }
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="group border-b border-gray-800 py-4">
      <div className="flex gap-3">
        {/* Vote button */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={handleVote}
            disabled={isVoting}
            className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-bold transition-colors ${
              localVote
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-500 hover:text-gray-300"
            }`}
            title={localVote ? "Remove upvote" : "Upvote"}
          >
            ▲
          </button>
          <span className="text-xs font-medium text-gray-400">
            {localUpvotes}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/p/nodes/${node.id}`}
            className="block hover:opacity-80"
          >
            <h3 className="text-base font-semibold text-gray-100">
              {node.title}
            </h3>
            {node.hook && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                {node.hook}
              </p>
            )}
          </Link>

          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>by {" "}
              <Link
                href={`/u/${node.pseudonym}`}
                className="text-gray-400 hover:text-gray-300 hover:underline"
              >
                {node.pseudonym}
              </Link>
            </span>
            <span>•</span>
            <span>{new Date(node.createdAt).toLocaleDateString()}</span>
            <MediaTypeIcon types={node.mediaTypes} />
            {node.forkCount > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-400">{node.forkCount} forks</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedClient({
  initialNodes,
  initialHasMore,
  initialSortMode,
}: FeedClientProps) {
  const [sortMode, setSortMode] = useState<FeedSortMode>(initialSortMode);
  const [nodes, setNodes] = useState<FeedNode[]>(initialNodes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch user votes for visible nodes
  useEffect(() => {
    async function fetchUserVotes() {
      const votes: Record<string, boolean> = {};
      await Promise.all(
        nodes.map(async (node) => {
          try {
            const res = await fetch(`/api/nodes/${node.id}/vote`);
            const data = await res.json();
            votes[node.id] = data.hasVoted;
          } catch {
            votes[node.id] = false;
          }
        })
      );
      setUserVotes(votes);
    }
    fetchUserVotes();
  }, [nodes]);

  // Fetch feed when sort mode changes
  const fetchFeed = useCallback(
    async (mode: FeedSortMode, cursor?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          sort: mode,
          limit: "20",
        });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/feed?${params}`);
        if (!res.ok) throw new Error("Failed to fetch feed");

        const data = await res.json();

        if (cursor) {
          setNodes((prev) => [...prev, ...data.nodes]);
        } else {
          setNodes(data.nodes);
        }
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSortChange = (newMode: FeedSortMode) => {
    setSortMode(newMode);
    fetchFeed(newMode);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("sort", newMode);
    window.history.replaceState({}, "", url);
  };

  const loadMore = () => {
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      fetchFeed(sortMode, lastNode.createdAt);
    }
  };

  const handleVote = (nodeId: string, voted: boolean) => {
    setUserVotes((prev) => ({ ...prev, [nodeId]: voted }));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-100">The Feed</h1>
              <p className="text-sm text-gray-500">
                {sortModeDescriptions[sortMode]}
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              ← Back
            </Link>
          </div>

          {/* Sort tabs */}
          <div className="mt-4 flex gap-1">
            {(Object.keys(sortModeLabels) as FeedSortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleSortChange(mode)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortMode === mode
                    ? "bg-gray-800 text-gray-100"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {sortModeLabels[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed content */}
      <div className="mx-auto max-w-3xl px-4 pb-8">
        {error && (
          <div className="my-4 rounded border border-red-900/50 bg-red-950/30 p-4 text-red-400">
            {error}
          </div>
        )}

        {nodes.length === 0 && !isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-lg">No public nodes yet.</p>
            <p className="mt-2 text-sm">
              Be the first to share something interesting.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {nodes.map((node) => (
              <FeedCard
                key={node.id}
                node={node}
                userVote={userVotes[node.id] || false}
                onVote={handleVote}
              />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        )}

        {hasMore && !isLoading && (
          <button
            onClick={loadMore}
            className="mt-6 w-full rounded border border-gray-800 bg-gray-900 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
